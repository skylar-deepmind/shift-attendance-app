import {
  getCurrentProfile,
  getCurrentUser,
  hasEmployeeRecord,
  resolveProfileHomeRoute,
} from "@/services/apiAuth.js";

export async function getRouteAccessContext() {
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

  return {
    hasCompletedEmployee,
    profile,
    user,
  };
}

export function resolveRouteGuard(to, context) {
  const { hasCompletedEmployee, profile, user } = context;

  if (to.meta.guestOnly && user) {
    return hasCompletedEmployee
      ? resolveProfileHomeRoute(profile)
      : { name: "employee-form" };
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
    return resolveProfileHomeRoute(profile);
  }

  if (to.meta.requiresCompletedEmployee && !hasCompletedEmployee) {
    return { name: "employee-form" };
  }

  if (to.meta.requiresAdmin && profile?.role !== "admin") {
    return { name: "403" };
  }

  return true;
}
