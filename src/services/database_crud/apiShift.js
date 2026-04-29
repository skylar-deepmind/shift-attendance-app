import supabase from "@/lib/supabase.js";

const shiftSelect = `
  *,
  employees(id, name, employee_code),
  locations(id, name)
`;

export async function getShiftsInRange({ startDate, endDate, locationId }) {
  let query = supabase
    .from("shifts")
    .select(shiftSelect)
    .gte("work_date", startDate)
    .lte("work_date", endDate)
    .order("work_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (locationId) {
    query = query.eq("location_id", locationId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch shifts: ${error.message}`);
  }

  return data;
}

export async function createShift(shiftData) {
  const { data, error } = await supabase
    .from("shifts")
    .insert([shiftData])
    .select(shiftSelect)
    .single();

  if (error) {
    throw new Error(`Failed to create shift: ${error.message}`);
  }

  return data;
}

export async function updateShift(shiftId, shiftData) {
  const { data, error } = await supabase
    .from("shifts")
    .update(shiftData)
    .eq("id", shiftId)
    .select(shiftSelect)
    .single();

  if (error) {
    throw new Error(`Failed to update shift: ${error.message}`);
  }

  return data;
}
