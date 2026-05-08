<template>
  <div class="border-b border-base-300 bg-base-100 shadow-sm">
    <div class="mx-auto flex max-w-none flex-col gap-4 px-4 py-4 lg:px-6 xl:flex-row xl:items-center xl:justify-between">
      <div class="flex items-center gap-4">
        <RouterLink class="btn btn-ghost px-0 text-xl" :to="homeRoute">
          {{ title }}
        </RouterLink>
        <span class="badge badge-outline" :class="profile?.role === 'admin' ? 'badge-primary' : 'badge-ghost'">
          {{ profile?.role === "admin" ? "管理员" : "员工" }}
        </span>
      </div>

      <div class="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div class="flex flex-wrap gap-2">
          <RouterLink
            v-for="link in navLinks"
            :key="link.name"
            class="btn btn-sm"
            :class="$route.name === link.name ? 'btn-primary' : 'btn-ghost'"
            :to="{ name: link.name }"
          >
            {{ link.label }}
          </RouterLink>
        </div>

        <div class="flex items-center gap-2 xl:ml-2">
          <div class="badge badge-outline badge-primary">
            {{ profile?.display_name || "未知用户" }}
          </div>
          <button class="btn btn-sm btn-outline" type="button" @click="handleLogout">
            退出登录
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  getCurrentProfile,
  resolveProfileHomeRoute,
  signOut,
} from "@/services/apiAuth.js";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

defineProps({
  title: {
    type: String,
    default: "Shift Attendance",
  },
});

const router = useRouter();
const profile = ref(null);

onMounted(async () => {
  profile.value = await getCurrentProfile();
});

const navLinks = computed(() => {
  if (profile.value?.role === "admin") {
    return [
      { name: "dashboard", label: "Dashboard" },
      { name: "employee-management", label: "员工" },
      { name: "shifts", label: "排班" },
      { name: "leave-approval", label: "审批" },
      { name: "profile", label: "我的资料" },
    ];
  }

  return [
    { name: "clock", label: "打卡" },
    { name: "my-leave", label: "请假" },
    { name: "profile", label: "我的资料" },
  ];
});

const homeRoute = computed(() => resolveProfileHomeRoute(profile.value));

async function handleLogout() {
  await signOut();
  await router.push({ name: "login" });
}
</script>
