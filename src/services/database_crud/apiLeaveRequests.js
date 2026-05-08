import supabase from "@/lib/supabase.js";

const leaveSelect = `
  *,
  employees(id, name, employee_code)
`;

export async function createLeaveRequest(payload) {
  const { data, error } = await supabase
    .from("leave_requests")
    .insert([payload])
    .select(leaveSelect)
    .single();

  if (error) {
    throw new Error(`Failed to create leave request: ${error.message}`);
  }

  return data;
}

export async function getLeaveRequests({
  employeeId,
  status,
  startDate,
  endDate,
} = {}) {
  let query = supabase
    .from("leave_requests")
    .select(leaveSelect)
    .order("created_at", { ascending: false });

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (startDate) {
    query = query.gte("start_date", startDate);
  }

  if (endDate) {
    query = query.lte("end_date", endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch leave requests: ${error.message}`);
  }

  return data;
}

export async function updateLeaveRequest(requestId, payload) {
  const { data, error } = await supabase
    .from("leave_requests")
    .update(payload)
    .eq("id", requestId)
    .select(leaveSelect)
    .single();

  if (error) {
    throw new Error(`Failed to update leave request: ${error.message}`);
  }

  return data;
}

export async function getLeaveRequestCount({
  status,
  activeOnDate,
} = {}) {
  let query = supabase
    .from("leave_requests")
    .select("*", { head: true, count: "exact" });

  if (status) {
    query = query.eq("status", status);
  }

  if (activeOnDate) {
    query = query
      .lte("start_date", activeOnDate)
      .gte("end_date", activeOnDate);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Failed to count leave requests: ${error.message}`);
  }

  return count || 0;
}
