<template>
  <section class="min-h-screen bg-base-200">
    <NavBar title="个人资料" />

    <div class="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <div v-if="isLoading" class="rounded-box bg-base-100 py-16 text-center shadow-sm">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div v-else class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article class="rounded-box border border-base-300 bg-base-100 p-6 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm text-base-content/60">账号资料</p>
              <h1 class="mt-1 text-2xl font-semibold text-base-content">
                {{ employee?.name || profile?.display_name || "未命名员工" }}
              </h1>
              <p class="mt-2 text-sm text-base-content/70">
                {{ user?.email || "暂无邮箱" }}
              </p>
            </div>

            <span class="badge badge-outline" :class="roleBadgeClass">
              {{ roleLabel }}
            </span>
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <InfoField label="员工编号" :value="employee?.employee_code || profile?.employee_code" />
            <InfoField label="联系电话" :value="employee?.phone" />
            <InfoField label="岗位" :value="employee?.position" />
            <InfoField label="部门" :value="employee?.departments?.name" />
            <InfoField label="门店/地点" :value="employee?.locations?.name" />
            <InfoField label="入职日期" :value="formatDate(employee?.joined_at)" />
            <InfoField label="用工类型" :value="formatEmploymentType(employee?.employment_type)" />
            <InfoField label="员工状态" :value="formatStatus(employee?.status)" />
          </div>
        </article>

        <article class="rounded-box border border-base-300 bg-base-100 p-6 shadow-sm">
          <p class="text-sm text-base-content/60">使用建议</p>
          <h2 class="mt-1 text-xl font-semibold text-base-content">下一步操作</h2>

          <div class="mt-5 space-y-3">
            <button class="btn btn-primary w-full justify-start" type="button" @click="goPrimary">
              {{ primaryActionLabel }}
            </button>
            <button
              v-if="isAdmin"
              class="btn btn-outline w-full justify-start"
              type="button"
              @click="router.push({ name: 'leave-approval' })"
            >
              查看请假审批
            </button>
            <button
              v-else
              class="btn btn-outline w-full justify-start"
              type="button"
              @click="router.push({ name: 'my-leave' })"
            >
              查看我的请假
            </button>
          </div>

          <div v-if="errorMessage" class="alert alert-error mt-5 text-sm">
            {{ errorMessage }}
          </div>

          <div class="mt-6 rounded-lg bg-base-200 p-4 text-sm text-base-content/70">
            <p>当前页面展示的是员工主数据和账号角色。</p>
            <p class="mt-2">
              后续如果要支持员工自己修改资料，建议只开放手机号、紧急联系人等字段，岗位和门店继续由管理员维护。
            </p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { getCurrentProfile, getCurrentUser, resolveProfileHomeRoute } from "@/services/apiAuth.js";
import { getEmployeeById } from "@/services/database_crud/apiEmployee.js";
import {
  formatEmployeeStatus,
  formatEmploymentType,
} from "@/shared/constants/employee.js";
import { formatDate } from "@/shared/utils/date.js";
import NavBar from "@/ui/NavBar.vue";
import { computed, defineComponent, h, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const isLoading = ref(true);
const errorMessage = ref("");
const user = ref(null);
const profile = ref(null);
const employee = ref(null);

const isAdmin = computed(() => profile.value?.role === "admin");
const roleLabel = computed(() => (isAdmin.value ? "管理员" : "员工"));
const roleBadgeClass = computed(() =>
  isAdmin.value ? "badge-primary" : "badge-ghost",
);
const primaryActionLabel = computed(() =>
  isAdmin.value ? "进入管理 Dashboard" : "进入今日打卡",
);

onMounted(async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const [currentUser, currentProfile] = await Promise.all([
      getCurrentUser(),
      getCurrentProfile(),
    ]);

    user.value = currentUser;
    profile.value = currentProfile;

    if (currentProfile?.employee_id) {
      employee.value = await getEmployeeById(currentProfile.employee_id);
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "加载个人资料失败。";
  } finally {
    isLoading.value = false;
  }
});

function goPrimary() {
  router.push(resolveProfileHomeRoute(profile.value));
}

const formatStatus = formatEmployeeStatus;

const InfoField = defineComponent({
  name: "InfoField",
  props: {
    label: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      default: "",
    },
  },
  setup(props) {
    return () =>
      h("div", { class: "rounded-lg bg-base-200 p-4" }, [
        h("p", { class: "text-xs text-base-content/60" }, props.label),
        h(
          "p",
          { class: "mt-2 text-sm font-medium text-base-content" },
          props.value || "未设置",
        ),
      ]);
  },
});
</script>
