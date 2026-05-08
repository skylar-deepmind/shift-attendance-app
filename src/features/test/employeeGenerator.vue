<template>
  <div
    class="card bg-base-100 shadow-xl border border-base-300 p-6 w-full max-w-md"
  >
    <div class="flex flex-col gap-4">
      <h2 class="card-title text-sm font-mono text-secondary">
        REV-SYNC: PROFILES -> EMPLOYEE
      </h2>

      <!-- <div class="form-control">
        <label class="label">
          <span class="label-text font-bold">固定属性 (Department)</span>
        </label>
        <select v-model="fixedDept" class="select select-bordered select-sm">
          <option value="2ed0924e-a5d9-4aad-8834-ca5fff85a4aa">
            研发部 (R&D)
          </option>
          <option value="0e20073c-5898-439b-92e6-75f9513b3475">
            市场部 (Marketing)
          </option>
          <option value="random">🎲 随机分配</option>
        </select>
      </div> -->

      <button
        @click="fillEmployeeTable"
        :disabled="loading"
        class="btn btn-secondary w-full"
      >
        <span v-if="loading" class="loading loading-spinner"></span>
        {{ loading ? "同步中..." : "根据 Profile 填充 Employee 档案" }}
      </button>

      <div v-if="statusMsg" class="alert alert-info py-2 text-xs">
        <span>{{ statusMsg }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { faker } from "@faker-js/faker";
import { insertEmployee } from "@/services/database_crud/apiEmployee.js";
import {
  getDepartments,
  getLocations,
} from "@/services/database_crud/apiOrganization.js";
import supabase from "@/lib/supabase.js";

const loading = ref(false);
const statusMsg = ref("");

const fillEmployeeTable = async () => {
  loading.value = true;
  statusMsg.value = "正在初始化...";

  try {
    // 1. 动态获取有效的 department 和 location
    const departments = await getDepartments();
    const locations = await getLocations();

    if (!departments.length || !locations.length) {
      throw new Error("请先创建 Department 和 Location");
    }

    const defaultDept = departments[0];
    const defaultLoc = locations[0];

    statusMsg.value = "正在读取 Profiles...";

    // 2. 读取真实的 profiles 数据
    const { data: profiles, error: fetchErr } = await supabase
      .from("profiles")
      .select("employee_id, display_name, employee_code")
      .not("employee_id", "is", null);

    if (fetchErr) throw fetchErr;
    if (!profiles || profiles.length === 0) {
      statusMsg.value = "没有找到待同步的 Profile 记录";
      return;
    }

    statusMsg.value = `找到 ${profiles.length} 条待同步...`;

    // 3. 逐条插入（NOT 批量）
    let successCount = 0;
    let failCount = 0;

    for (const profile of profiles) {
      try {
        // 检查是否已存在
        const { data: existing } = await supabase
          .from("employees")
          .select("id")
          .eq("id", profile.employee_id)
          .maybeSingle();

        if (existing) {
          console.log(`${profile.employee_id} 已存在，跳过`);
          continue;
        }

        // 单条插入（不要在这里再 map）
        await insertEmployee({
          id: profile.employee_id,
          employee_code:
            profile.employee_code ||
            `EMP-${faker.string.alphanumeric(6).toUpperCase()}`,
          name: profile.display_name || "Unknown",
          email: faker.internet.email(),
          phone: faker.phone.number(),
          department_id: defaultDept.id, // 用真实的 id
          location_id: defaultLoc.id, // 用真实的 id
          position: "Front Desk Clerk",
          employment_type: "full_time",
          status: "active",
          joined_at: new Date().toISOString().slice(0, 10),
        });

        successCount += 1;
        statusMsg.value = `进行中... 成功 ${successCount}, 失败 ${failCount}`;
      } catch (itemErr) {
        failCount += 1;
        console.error(`${profile.employee_id} 失败:`, itemErr.message);
      }
    }

    statusMsg.value = `完成！成功 ${successCount}，失败 ${failCount}`;
  } catch (err) {
    statusMsg.value = "失败: " + err.message;
  } finally {
    loading.value = false;
  }
};
</script>
