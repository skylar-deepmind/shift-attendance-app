<template>
  <div class="min-h-screen bg-base-200 p-4 flex flex-col items-center gap-6">
    <div class="stats shadow bg-base-100 w-full max-w-md">
      <div class="stat text-center">
        <div class="stat-title text-sm">当前时间</div>
        <div class="stat-value text-primary text-4xl">{{ currentTime }}</div>
        <div class="stat-desc mt-2">{{ currentDateLabel }}</div>
      </div>
    </div>

    <div class="card w-full max-w-md bg-base-100 shadow-xl">
      <div class="card-body items-center text-center">
        <h2 class="card-title mb-4">
          状态：
          <div v-if="status === 0" class="badge badge-ghost">未开始</div>
          <div v-else-if="status === 1" class="badge badge-success">工作中</div>
          <div v-else class="badge badge-error">已结束</div>
        </h2>

        <button
          @click="handleClock"
          :disabled="status === 2 || !canClockToday || submitting"
          class="btn btn-circle btn-primary w-32 h-32 text-xl shadow-lg border-8 border-primary/20 transition-all hover:scale-105 active:scale-95"
          :class="status === 1 ? 'btn-outline' : ''"
        >
          {{ status === 0 ? "上班打卡" : status === 1 ? "下班打卡" : "已签退" }}
        </button>

        <p class="text-xs text-base-content/50 mt-4">地点：(定位功能待开发)</p>
        <p class="text-xs text-base-content/70 mt-1">{{ shiftHint }}</p>
      </div>
    </div>

    <div class="w-full max-w-md">
      <div class="divider">今日记录</div>
      <ul class="timeline timeline-vertical">
        <li v-for="(log, index) in logs" :key="index">
          <hr v-if="index > 0" class="bg-primary" />
          <div class="timeline-start font-mono italic">{{ log.time }}</div>
          <div class="timeline-middle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              class="h-5 w-5 text-primary"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="timeline-end timeline-box shadow-sm">{{ log.type }}</div>
          <hr v-if="index < logs.length - 1" class="bg-primary" />
        </li>
      </ul>

      <div
        v-if="logs.length === 0"
        class="text-center text-base-content/30 py-8"
      >
        暂无打卡记录
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCurrentUser } from "@/services/apiAuth.js";
import { insertAttendanceRecord } from "@/services/database_crud/apiAttendanceRecords.js";
import { getShiftsInRange } from "@/services/database_crud/apiShift.js";
import { ref, onMounted, onUnmounted } from "vue";

type AttendanceStatus =
  | "normal"
  | "absence"
  | "late"
  | "early_leave"
  | "late_and_early_leave"
  | "missing_clock_out";

type AttendanceRecord = {
  employee_id: string;
  shift_id: string;
  work_date: string;
  clock_in_at: string;
  clock_out_at: string;
  break_minutes: number;
  work_minutes: number;
  status: AttendanceStatus;
  note: string;
};

type Shift = {
  id: string;
  employee_id: string;
  work_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number | null;
  status?: string;
};

// 模拟状态：0-未打卡, 1-已上班, 2-已下班
const status = ref(0);
const currentTime = ref(new Date().toLocaleTimeString());
const currentDateLabel = ref(
  new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }),
);
const logs = ref<{ time: string; type: string }[]>([]);
const todayShift = ref<Shift | null>(null);
const canClockToday = ref(true);
const shiftHint = ref("正在加载今日排班...");
const submitting = ref(false);
const record = ref<AttendanceRecord>({
  employee_id: "", // UUID 格式
  shift_id: "", // UUID 格式
  work_date: "", // Date 格式 (YYYY-MM-DD)
  clock_in_at: "", // Timestamp with time zone
  clock_out_at: "", // Timestamp with time zone
  break_minutes: 0, // Integer
  work_minutes: 0, // Integer
  status: "normal", // 注意：需符合你定义的 enum 值("normal" || "absence"|| "late" || "early_leave"||"late_and_early_leave"||"missing_clock_out")
  note: "Normal working day", // Text
});
const employeeName = ref("未知用户");
const currentEmployeeId = ref("");

const formatWorkDate = (date: Date) => date.toISOString().slice(0, 10);

const calculateWorkMinutes = (clockInAt: string, clockOutAt: string) => {
  const clockInTime = new Date(clockInAt).getTime();
  const clockOutTime = new Date(clockOutAt).getTime();
  const diffMs = Math.max(clockOutTime - clockInTime, 0);
  return Math.floor(diffMs / 60000);
};

const formatDateTimeByShift = (workDate: string, hhmmss: string) => {
  const safeTime = hhmmss?.slice(0, 8) || "00:00:00";
  return new Date(`${workDate}T${safeTime}`);
};

const getFinalAttendanceStatus = (
  clockInAt: Date,
  clockOutAt: Date,
  shiftStartAt: Date,
  shiftEndAt: Date,
): AttendanceStatus => {
  const isLate = clockInAt.getTime() > shiftStartAt.getTime();
  const isEarlyLeave = clockOutAt.getTime() < shiftEndAt.getTime();

  if (isLate && isEarlyLeave) {
    return "late_and_early_leave";
  }

  if (isLate) {
    return "late";
  }

  if (isEarlyLeave) {
    return "early_leave";
  }

  return "normal";
};

const resolveShiftHint = (shift: Shift | null) => {
  if (!shift) {
    return "今日无排班，无需打卡";
  }

  return `今日班次: ${shift.start_time.slice(0, 5)} - ${shift.end_time.slice(
    0,
    5,
  )}`;
};

const loadTodayShift = async (employeeId: string) => {
  const today = formatWorkDate(new Date());
  const shifts = await getShiftsInRange({
    startDate: today,
    endDate: today,
    locationId: undefined,
  });

  const matchedShift = (shifts || []).find(
    (shift: Shift) => shift.employee_id === employeeId,
  );

  todayShift.value = matchedShift || null;
  canClockToday.value = Boolean(todayShift.value);
  shiftHint.value = resolveShiftHint(todayShift.value);
};

// 更新时间
let timer: number;
onMounted(async () => {
  try {
    const currentEmployee = await getCurrentUser();
    employeeName.value =
      currentEmployee?.user_metadata?.display_name || "未知用户";
    record.value.employee_id =
      currentEmployee?.user_metadata?.employee_id || "";
    currentEmployeeId.value = record.value.employee_id;

    if (!currentEmployeeId.value) {
      canClockToday.value = false;
      shiftHint.value = "无法识别员工身份，暂时无法打卡";
    } else {
      await loadTodayShift(currentEmployeeId.value);
    }
  } catch (error) {
    canClockToday.value = false;
    shiftHint.value = "加载排班失败，请稍后重试";
    console.error(error);
  }

  timer = window.setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString();
    currentDateLabel.value = new Date().toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  }, 1000);
});
onUnmounted(() => {
  clearInterval(timer);
});

// 打卡逻辑
const handleClock = async () => {
  if (!canClockToday.value || !todayShift.value || submitting.value) {
    return;
  }

  submitting.value = true;
  const now = new Date();
  const nowLabel = now.toLocaleTimeString();
  const shift = todayShift.value;
  const shiftStartAt = formatDateTimeByShift(shift.work_date, shift.start_time);
  const shiftEndAt = formatDateTimeByShift(shift.work_date, shift.end_time);

  try {
    if (status.value === 0) {
      status.value = 1;
      record.value.shift_id = shift.id;
      record.value.work_date = shift.work_date;
      record.value.clock_in_at = now.toISOString();
      record.value.clock_out_at = "";
      record.value.break_minutes = shift.break_minutes || 0;
      record.value.work_minutes = 0;
      record.value.status =
        now.getTime() > shiftStartAt.getTime() ? "late" : "normal";
      record.value.note = "上班打卡";

      logs.value.push({ time: nowLabel, type: "上班打卡" });
    } else if (status.value === 1) {
      status.value = 2;
      record.value.clock_out_at = now.toISOString();
      const totalMinutes = calculateWorkMinutes(
        record.value.clock_in_at,
        record.value.clock_out_at,
      );
      record.value.work_minutes = Math.max(
        totalMinutes - record.value.break_minutes,
        0,
      );
      record.value.status = getFinalAttendanceStatus(
        new Date(record.value.clock_in_at),
        new Date(record.value.clock_out_at),
        shiftStartAt,
        shiftEndAt,
      );
      record.value.note = "下班打卡";

      await insertAttendanceRecord(record.value);

      logs.value.push({ time: nowLabel, type: "下班打卡" });
      console.log("最终打卡记录:", record.value);
    }
  } catch (error) {
    console.error(error);
    if (status.value === 2) {
      status.value = 1;
    }
  } finally {
    submitting.value = false;
  }
};
</script>
