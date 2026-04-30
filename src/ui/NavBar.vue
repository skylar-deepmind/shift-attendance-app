<template>
  <div class="navbar bg-base-100 shadow-sm">
    <div class="flex-1">
      <a class="btn btn-ghost text-xl">{{ title }}</a>
    </div>
    <div class="flex items-center gap-2">
      <div class="badge badge-outline badge-primary">{{ employeeName }}</div>

      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
          <div class="w-10 rounded-full">
            <img
              alt="Tailwind CSS Navbar component"
              src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
            />
          </div>
        </div>
        <ul
          tabindex="-1"
          class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
        >
          <li>
            <a class="justify-between">
              Profile
              <span class="badge">New</span>
            </a>
          </li>
          <!-- todo later  -->
          <li><a>Settings</a></li>
          <li><a>Logout</a></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getCurrentUser } from "@/services/apiAuth.js";
import { onMounted, ref } from "vue";

defineProps({
  title: {
    type: String,
    default: "My App",
  },
});

const employeeName = ref("未知用户");
onMounted(async () => {
  const currentEmployee = await getCurrentUser();
  employeeName.value = currentEmployee.user_metadata.display_name;
});
</script>

<style lang="scss" scoped></style>
