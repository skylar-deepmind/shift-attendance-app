import { getAttendanceCountByStatus } from "@/services/database_crud/apiAttendanceRecords.js";
import { getAllEmployees } from "@/services/database_crud/apiEmployee.js";
import { getLeaveRequestCount, getLeaveRequests } from "@/services/database_crud/apiLeaveRequests.js";
import { getLocations } from "@/services/database_crud/apiOrganization.js";
import { getShiftsInRange } from "@/services/database_crud/apiShift.js";

function toISODate(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStartOfWeek(inputDate) {
  const date = new Date(inputDate);
  const weekday = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - weekday);
  return date;
}

export async function getDashboardSnapshot() {
  const today = toISODate(new Date());
  const weekStart = getStartOfWeek(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const startDate = toISODate(weekStart);
  const endDate = toISODate(weekEnd);

  const [
    employees,
    locations,
    shifts,
    attendanceToday,
    lateToday,
    earlyLeaveToday,
    activeLeaveToday,
    pendingLeaveCount,
    recentLeaveRequests,
  ] = await Promise.all([
    getAllEmployees(),
    getLocations(),
    getShiftsInRange({ startDate, endDate }),
    getAttendanceCountByStatus({ startDate: today, endDate: today }),
    getAttendanceCountByStatus({
      startDate: today,
      endDate: today,
      statuses: ["late", "late_and_early_leave"],
    }),
    getAttendanceCountByStatus({
      startDate: today,
      endDate: today,
      statuses: ["early_leave", "late_and_early_leave"],
    }),
    getLeaveRequestCount({ status: "approved", activeOnDate: today }),
    getLeaveRequestCount({ status: "pending" }),
    getLeaveRequests(),
  ]);

  const activeEmployees = employees.filter(
    (employee) => employee.status === "active",
  );
  const scheduledWeek = shifts.filter((shift) => shift.status !== "cancelled");
  const openSlotsEstimate = Math.max(locations.length * 21 - scheduledWeek.length, 0);

  const locationRows = locations.map((location) => {
    const locationShifts = scheduledWeek.filter(
      (shift) => shift.location_id === location.id,
    );
    const assignedEmployees = new Set(
      locationShifts.map((shift) => shift.employee_id).filter(Boolean),
    );

    return {
      id: location.id,
      name: location.name,
      shiftCount: locationShifts.length,
      assignedEmployees: assignedEmployees.size,
    };
  });

  return {
    cards: [
      {
        key: "active-employees",
        label: "在职员工",
        value: activeEmployees.length,
        tone: "primary",
      },
      {
        key: "attendance-today",
        label: "今日出勤记录",
        value: attendanceToday,
        tone: "success",
      },
      {
        key: "pending-leave",
        label: "待审批请假",
        value: pendingLeaveCount,
        tone: "warning",
      },
      {
        key: "open-shifts",
        label: "本周待补班次",
        value: openSlotsEstimate,
        tone: "error",
      },
    ],
    attendanceSummary: {
      attendanceToday,
      lateToday,
      earlyLeaveToday,
      activeLeaveToday,
    },
    locationRows,
    recentLeaveRequests: recentLeaveRequests.slice(0, 8),
  };
}
