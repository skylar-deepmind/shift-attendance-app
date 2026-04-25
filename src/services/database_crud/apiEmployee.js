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
