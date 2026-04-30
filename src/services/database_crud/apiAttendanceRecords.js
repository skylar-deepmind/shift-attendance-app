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
