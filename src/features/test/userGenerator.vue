<template>
  <div class="card bg-base-100 shadow-xl border border-base-300 p-6 w-96">
    <div class="flex flex-col gap-4">
      <h2 class="card-title text-sm opacity-70">SUPABASE 用户批量导入</h2>

      <div class="form-control">
        <label class="label"><span class="label-text">插入数量</span></label>
        <input
          v-model.number="count"
          type="range"
          min="1"
          max="20"
          class="range range-primary range-sm"
          step="1"
        />
        <div class="text-xs mt-1">当前选择：{{ count }} 条</div>
      </div>

      <!-- <div class="form-control">
        <label class="label"
          ><span class="label-text">固定 Role 字段</span></label
        >
        <select v-model="fixedRole" class="select select-bordered select-sm">
          <option value="user">User (普通用户)</option>
          <option value="admin">Admin (管理员)</option>
          <option value="vip">VIP (高级会员)</option>
        </select>
      </div> -->

      <button
        @click="batchInsert"
        :disabled="loading"
        class="btn btn-primary mt-2"
      >
        <span v-if="loading" class="loading loading-spinner"></span>
        {{ loading ? "插入中..." : `批量插入 ${count} 条记录` }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { faker } from "@faker-js/faker";
import { signUp } from "@/services/apiAuth.js";
// import { supabase } from '@/lib/supabase'

const count = ref(5);
const fixedRole = ref("user");
const loading = ref(false);

const batchInsert = async () => {
  loading.value = true;

  try {
    for (let i = 0; i < count.value; i++) {
      // 构造随机数据，但固定 role
      const userData = {
        email: faker.internet.email(),
        password: "111111", // 固定密码，实际使用中请注意安全
        //用邮箱前缀作为 display_name，确保唯一性
        displayName: faker.internet.email().split("@")[0],
      };

      console.log(`正在插入第 ${i + 1} 条:`, userData.email);

      // 调用函数插入
      await signUp(userData);
    }
    alert(`成功批量插入 ${count.value} 条数据`);
  } catch (err) {
    console.error(err);
    alert("插入失败，请检查 Service Role Key 配置");
  } finally {
    loading.value = false;
  }
};
</script>
