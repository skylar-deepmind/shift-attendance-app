import supabase from "@/lib/supabase.js";

/**
 *  {
      // 这里的字段名需与表结构一致
      employee_id: '3f6e8c1a-9b2d-4e5f-8a7c-1234567890ab', // UUID 格式
      shift_id: 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',    // UUID 格式
      work_date: '2026-04-30',                             // Date 格式 (YYYY-MM-DD)
      clock_in_at: new Date().toISOString(),               // Timestamp with time zone
      clock_out_at: new Date().toISOString(),              // Timestamp with time zone
      break_minutes: 60,                                   // Integer
      work_minutes: 480,                                   // Integer
      status: 'present',                                   // 注意：需符合你定义的 enum 值
      note: 'Normal working day'                           // Text
    }, */
export async function insertAttendanceRecord(record) {
  const { data, error } = await supabase
    .from("attendance_records")
    .insert([record])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert attendance record: ${error.message}`);
  }

  return data;
}

export async function getAttendanceRecords({
  employeeId,
  startDate,
  endDate,
  locationId,
}) {
  let query = supabase
    .from("attendance_records")
    .select("*, employees(id, name, employee_code), shifts(location_id)")
    .order("work_date", { ascending: false })
    .order("clock_in_at", { ascending: false });

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  if (startDate) {
    query = query.gte("work_date", startDate);
  }

  if (endDate) {
    query = query.lte("work_date", endDate);
  }

  if (locationId) {
    query = query.eq("shifts.location_id", locationId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch attendance records: ${error.message}`);
  }

  return data;
}

export async function getAttendanceCountByStatus({
  startDate,
  endDate,
  statuses,
}) {
  let query = supabase
    .from("attendance_records")
    .select("*", { count: "exact", head: true });

  if (startDate) {
    query = query.gte("work_date", startDate);
  }

  if (endDate) {
    query = query.lte("work_date", endDate);
  }

  if (statuses?.length) {
    query = query.in("status", statuses);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Failed to count attendance records: ${error.message}`);
  }

  return count || 0;
}
