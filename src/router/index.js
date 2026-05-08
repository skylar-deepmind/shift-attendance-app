import { createRouter, createWebHistory } from "vue-router";
import {
  getRouteAccessContext,
  resolveRouteGuard,
} from "@/features/auth/authGuard.js";

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
      path: "/dashboard",
      name: "dashboard",
      component: () => import("@/views/DashboardView.vue"),
      meta: {
        requiresAuth: true,
        requiresCompletedEmployee: true,
        requiresAdmin: true,
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
      path: "/my-leave",
      name: "my-leave",
      component: () => import("@/views/LeaveRequestsView.vue"),
      meta: {
        requiresAuth: true,
        requiresCompletedEmployee: true,
      },
    },
    {
      path: "/leave-approval",
      name: "leave-approval",
      component: () => import("@/views/LeaveApprovalView.vue"),
      meta: {
        requiresAuth: true,
        requiresCompletedEmployee: true,
        requiresAdmin: true,
      },
    },
    {
      path: "/employee-management",
      name: "employee-management",
      component: () => import("@/views/EmployeeManagementView.vue"),
      meta: {
        requiresAuth: true,
        requiresCompletedEmployee: true,
        requiresAdmin: true,
      },
    },
    {
      path: "/shifts",
      name: "shifts",
      component: () => import("@/views/ShiftManagementView.vue"),
      meta: {
        requiresAuth: true,
        requiresCompletedEmployee: true,
        requiresAdmin: true,
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
      path: "/clock",
      name: "clock",
      component: () => import("@/views/ClockView.vue"),
      meta: {
        requiresAuth: true,
        requiresCompletedEmployee: true,
      },
    },
    {
      path: "/test",
      name: "test",
      component: () => import("@/views/TestView.vue"),
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
    {
      path: "/:pathMatch(.*)*",
      redirect: "/404",
    },
  ],
});

router.beforeEach(async (to) => {
  const context = await getRouteAccessContext();
  return resolveRouteGuard(to, context);
});

export default router;
