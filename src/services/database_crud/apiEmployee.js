import supabase from "@/lib/supabase.js";

export async function insertEmployee(employeeData) {
  const { data, error } = await supabase
    .from("employees")
    .insert([employeeData])
    .select();

  if (error) {
    throw new Error(`Employee creation failed: ${error.message}`);
  }

  return data;
}

export async function getEmployeeById(employeeId) {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .maybeSingle();

  if (error) {
    throw new Error(`Employee fetch failed: ${error.message}`);
  }

  return data;
}

export async function getAllEmployees() {
  const { data, error } = await supabase
    .from("employees")
    .select(
      `
      *,
      departments(id, name),
      locations(id, name)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch employees: ${error.message}`);
  }

  return data;
}

export async function updateEmployee(employeeId, employeeData) {
  const { data, error } = await supabase
    .from("employees")
    .update(employeeData)
    .eq("id", employeeId)
    .select(
      `
      *,
      departments(id, name),
      locations(id, name)
    `,
    )
    .single();

  if (error) {
    throw new Error(`Failed to update employee: ${error.message}`);
  }

  return data;
}
