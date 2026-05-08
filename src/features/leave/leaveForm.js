export function createDefaultLeaveForm() {
  const today = new Date().toISOString().slice(0, 10);

  return {
    leave_type: "annual",
    start_date: today,
    end_date: today,
    reason: "",
  };
}
