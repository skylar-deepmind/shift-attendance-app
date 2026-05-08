import supabase from "@/lib/supabase.js";
import { getEmployeeById } from "@/services/database_crud/apiEmployee.js";
import {
  getProfileById,
  updateProfile,
  upsertProfile,
} from "@/services/database_crud/apiProfile.js";

function generateEmployeeId() {
  return crypto.randomUUID();
}

function generateEmployeeCode() {
  const year = new Date().getFullYear();
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `EMP-${year}-${randomPart}`;
}

export async function signUp({ email, password, displayName }) {
  const employeeId = generateEmployeeId();
  const employeeCode = generateEmployeeCode();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        employee_id: employeeId,
        display_name: displayName,
        employee_code: employeeCode,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const userId = data.user?.id;
  let profile = null;

  if (data.session && userId) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          employee_id: employeeId,
          display_name: displayName,
          employee_code: employeeCode,
          role: "employee",
        },
        { onConflict: "id" },
      )
      .select()
      .single();

    if (profileError) {
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    profile = profileData;
  }

  return {
    user: data.user,
    session: data.session,
    profile,
    employeeId,
    employeeCode,
    needsEmailConfirmation: Boolean(data.user && !data.session),
  };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    const isInvalidSession =
      error.message === "User from sub claim in JWT does not exist" ||
      error.message?.toLowerCase().includes("jwt");

    if (isInvalidSession) {
      await supabase.auth.signOut();
      return null;
    }

    throw new Error(error.message);
  }

  return data.user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  try {
    return await getProfileById(user.id);
  } catch (error) {
    if (user.user_metadata?.display_name || user.user_metadata?.employee_code) {
      const insertedProfiles = await upsertProfile({
        id: user.id,
        employee_id: user.user_metadata.employee_id || null,
        display_name:
          user.user_metadata.display_name ||
          user.email?.split("@")[0] ||
          "User",
        employee_code: user.user_metadata.employee_code || null,
        role: "employee",
      });

      return insertedProfiles[0] ?? null;
    }

    throw error;
  }
}

export async function hasEmployeeRecord(employeeId) {
  if (!employeeId) {
    return false;
  }

  const employee = await getEmployeeById(employeeId);
  return Boolean(employee);
}

export async function ensureProfileEmployeeId(profile) {
  if (profile?.employee_id) {
    return profile.employee_id;
  }

  if (!profile?.id) {
    throw new Error("Profile id is missing.");
  }

  const employeeId = generateEmployeeId();
  await updateProfile(profile.id, { employee_id: employeeId });
  return employeeId;
}

export function resolveProfileHomeRoute(profile) {
  if (profile?.role === "admin") {
    return { name: "dashboard" };
  }

  return { name: "clock" };
}
