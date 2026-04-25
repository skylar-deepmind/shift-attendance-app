import { createRouter, createWebHistory } from "vue-router";
import {
  getCurrentProfile,
  getCurrentUser,
  hasEmployeeRecord,
} from "@/services/apiAuth.js";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: {
        guestOnly: true,
      },
    },
    {
      path: "/signup",
      name: "signup",
      component: () => import("@/views/SignupView.vue"),
      meta: {
        guestOnly: true,
      },
    },
    {
      path: "/profile",
      name: "profile",
      component: () => import("@/views/ProfileView.vue"),
      meta: {
        requiresAuth: true,
        requiresCompletedEmployee: true,
      },
    },
    {
      path: "/employee-form",
      name: "employee-form",
      component: () => import("@/views/EmployeeFormView.vue"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/403",
      name: "403",
      component: () => import("@/ui/403.vue"),
    },
    {
      path: "/404",
      name: "404",
      component: () => import("@/ui/404.vue"),
    },
  ],
});

router.beforeEach(async (to) => {
  let user = null;

  try {
    user = await getCurrentUser();
  } catch (error) {
    user = null;
  }

  let profile = null;
  let hasCompletedEmployee = false;

  if (user) {
    try {
      profile = await getCurrentProfile();
      hasCompletedEmployee = await hasEmployeeRecord(profile?.employee_id);
    } catch (error) {
      profile = null;
      hasCompletedEmployee = false;
    }
  }

  if (to.meta.guestOnly && user) {
    return hasCompletedEmployee ? { name: "profile" } : { name: "employee-form" };
  }

  if (to.meta.requiresAuth && !user) {
    return { name: "login" };
  }

  if (!user) {
    return true;
  }

  if (
    to.name !== "employee-form" &&
    !hasCompletedEmployee &&
    to.meta.requiresAuth
  ) {
    return { name: "employee-form" };
  }

  if (to.name === "employee-form" && hasCompletedEmployee) {
    return { name: "profile" };
  }

  if (to.meta.requiresCompletedEmployee && !hasCompletedEmployee) {
    return { name: "employee-form" };
  }

  return true;
});

export default router;
