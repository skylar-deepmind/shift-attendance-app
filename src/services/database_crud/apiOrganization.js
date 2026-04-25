import supabase from "@/lib/supabase.js";

export async function getDepartments() {
  const { data, error } = await supabase
    .from("departments")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Departments fetch failed: ${error.message}`);
  }

  return data;
}

export async function getLocations() {
  const { data, error } = await supabase
    .from("locations")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Locations fetch failed: ${error.message}`);
  }

  return data;
}
