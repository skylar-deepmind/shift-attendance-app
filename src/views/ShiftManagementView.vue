<template>
  <section class="min-h-screen bg-base-200">
    <NavBar title="排班管理" />
    <div class="mx-auto flex max-w-none flex-col gap-6 px-4 py-6 lg:px-6">
      <ShiftToolbar
        v-model:keyword="employeeKeyword"
        v-model:location-id="selectedLocationId"
        :locations="locations"
        :week-label="weekRangeLabel"
        @next-week="goNextWeek"
        @prev-week="goPrevWeek"
        @this-week="goThisWeek"
      />

      <div
        v-if="isBootLoading"
        class="rounded-box border border-base-300 bg-base-100 py-16 text-center"
      >
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <template v-else>
        <div v-if="pageError" class="alert alert-error">
          {{ pageError }}
        </div>

        <ShiftCoverageSummary :gaps="coverageGaps" :stats="coverageStats" />

        <ShiftBoard
          :board-rows="boardRows"
          :week-days="weekDays"
          @select-cell="openShiftDialog"
        />

        <StaffLoadSummary :rows="staffLoadRows" />
      </template>
    </div>

    <ShiftFormDialog
      :date-label="selectedCellDateLabel"
      :employees="candidateEmployees"
      :error-message="dialogError"
      :is-saving="isSubmitting"
      :location-name="selectedLocationName"
      :mode="dialogMode"
      :selected-cell="selectedCell"
      :shift-label="selectedShiftLabel"
      :visible="isDialogVisible"
      @close="closeShiftDialog"
      @submit="submitShiftDialog"
    />
  </section>
</template>

<script setup>
import ShiftBoard from "@/features/shift/ShiftBoard.vue";
import ShiftCoverageSummary from "@/features/shift/ShiftCoverageSummary.vue";
import ShiftFormDialog from "@/features/shift/ShiftFormDialog.vue";
import ShiftToolbar from "@/features/shift/ShiftToolbar.vue";
import StaffLoadSummary from "@/features/shift/StaffLoadSummary.vue";
import { getCurrentProfile } from "@/services/apiAuth.js";
import { getAllEmployees } from "@/services/database_crud/apiEmployee.js";
import { getLocations } from "@/services/database_crud/apiOrganization.js";
import {
  createShift,
  getShiftsInRange,
  updateShift,
} from "@/services/database_crud/apiShift.js";
import NavBar from "@/ui/NavBar.vue";
import { computed, onMounted, ref, watch } from "vue";

const SHIFT_TEMPLATES = [
  {
    key: "night",
    label: "00:00 - 08:00",
    startTime: "00:00",
    endTime: "08:00:00",
    hours: 8,
  },
  {
    key: "morning",
    label: "08:00 - 16:00",
    startTime: "08:00",
    endTime: "16:00:00",
    hours: 8,
  },
  {
    key: "evening",
    label: "16:00 - 24:00",
    startTime: "16:00",
    endTime: "23:59:00",
    hours: 8,
  },
];

const locations = ref([]);
const allEmployees = ref([]);
const shifts = ref([]);
const currentProfile = ref(null);

const selectedLocationId = ref("");
const employeeKeyword = ref("");
const weekAnchor = ref(getStartOfWeek(new Date()));

const isBootLoading = ref(true);
const isShiftLoading = ref(false);
const pageError = ref("");

const isDialogVisible = ref(false);
const selectedCell = ref(null);
const dialogMode = ref("create");
const isSubmitting = ref(false);
const dialogError = ref("");

const weekStartDate = computed(() => new Date(weekAnchor.value));
const weekEndDate = computed(() => {
  const end = new Date(weekStartDate.value);
  end.setDate(end.getDate() + 6);
  return end;
});

const weekStartISO = computed(() => toISODate(weekStartDate.value));
const weekEndISO = computed(() => toISODate(weekEndDate.value));

const weekDays = computed(() => {
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(weekStartDate.value);
    date.setDate(date.getDate() + index);

    return {
      dateKey: toISODate(date),
      dateLabel: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    };
  });
});

const weekRangeLabel = computed(() => {
  const startText = weekStartDate.value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endText = weekEndDate.value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startText} - ${endText}`;
});

const selectedLocationName = computed(() => {
  return (
    locations.value.find((item) => item.id === selectedLocationId.value)
      ?.name || "No store selected"
  );
});

const activeEmployeesForStore = computed(() => {
  return allEmployees.value.filter((employee) => {
    if (employee.status !== "active") {
      return false;
    }

    if (!selectedLocationId.value) {
      return true;
    }

    return employee.location_id === selectedLocationId.value;
  });
});

const candidateEmployees = computed(() => {
  const keyword = employeeKeyword.value.trim().toLowerCase();

  if (!keyword) {
    return activeEmployeesForStore.value;
  }

  return activeEmployeesForStore.value.filter((employee) => {
    return (
      employee.name?.toLowerCase().includes(keyword) ||
      employee.employee_code?.toLowerCase().includes(keyword)
    );
  });
});

const shiftsForStoreAndWeek = computed(() => {
  return shifts.value.filter((shift) => {
    const inLocation = selectedLocationId.value
      ? shift.location_id === selectedLocationId.value
      : true;

    return inLocation;
  });
});

const boardRows = computed(() => {
  return SHIFT_TEMPLATES.map((template) => {
    const cells = weekDays.value.map((day) =>
      buildShiftCell(day.dateKey, template),
    );

    return {
      templateKey: template.key,
      shiftLabel: template.label,
      cells,
    };
  });
});

const coverageStats = computed(() => {
  const total = SHIFT_TEMPLATES.length * 7;
  const filled = boardRows.value.reduce((sum, row) => {
    return sum + row.cells.filter((cell) => cell.effectiveShift).length;
  }, 0);
  const open = total - filled;
  const completion = total ? Math.round((filled / total) * 100) : 0;

  return {
    total,
    filled,
    open,
    completion,
    completionText: `${completion}%`,
  };
});

const coverageGaps = computed(() => {
  const gapMap = weekDays.value.reduce((acc, day) => {
    acc[day.dateKey] = day;
    return acc;
  }, {});

  return boardRows.value
    .flatMap((row) => row.cells)
    .filter((cell) => !cell.effectiveShift)
    .map((cell) => ({
      key: cell.key,
      dayLabel: `${gapMap[cell.date]?.weekday || ""} ${gapMap[cell.date]?.dateLabel || cell.date}`,
      shiftLabel: cell.template.label,
    }));
});

const staffLoadRows = computed(() => {
  const activeShiftCounts = new Map();

  shiftsForStoreAndWeek.value.forEach((shift) => {
    if (shift.status === "cancelled") {
      return;
    }

    const currentCount = activeShiftCounts.get(shift.employee_id) || 0;
    activeShiftCounts.set(shift.employee_id, currentCount + 1);
  });

  return candidateEmployees.value
    .map((employee) => {
      const shiftCount = activeShiftCounts.get(employee.id) || 0;
      return {
        ...employee,
        shiftCount,
        totalHours: shiftCount * 8,
      };
    })
    .sort(
      (a, b) => b.shiftCount - a.shiftCount || a.name.localeCompare(b.name),
    );
});

const selectedCellDateLabel = computed(() => {
  if (!selectedCell.value?.date) {
    return "";
  }

  return new Date(selectedCell.value.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
});

const selectedShiftLabel = computed(() => {
  return selectedCell.value?.template?.label || "";
});

watch(
  [weekStartISO, weekEndISO, selectedLocationId],
  async () => {
    if (!selectedLocationId.value) {
      shifts.value = [];
      return;
    }

    await loadShifts();
  },
  { immediate: false },
);

onMounted(async () => {
  await bootPage();
});

async function bootPage() {
  isBootLoading.value = true;
  pageError.value = "";

  try {
    const [locationList, employeeList, profile] = await Promise.all([
      getLocations(),
      getAllEmployees(),
      getCurrentProfile(),
    ]);

    locations.value = locationList;
    allEmployees.value = employeeList;
    currentProfile.value = profile;

    if (!selectedLocationId.value && locationList.length > 0) {
      selectedLocationId.value = locationList[0].id;
    }

    if (selectedLocationId.value) {
      await loadShifts();
    }
  } catch (error) {
    pageError.value = error.message || "Failed to load shift management page.";
  } finally {
    isBootLoading.value = false;
  }
}

async function loadShifts() {
  isShiftLoading.value = true;
  pageError.value = "";

  try {
    shifts.value = await getShiftsInRange({
      startDate: weekStartISO.value,
      endDate: weekEndISO.value,
      locationId: selectedLocationId.value,
    });
  } catch (error) {
    pageError.value = error.message || "Failed to fetch shifts.";
  } finally {
    isShiftLoading.value = false;
  }
}

function goPrevWeek() {
  const next = new Date(weekStartDate.value);
  next.setDate(next.getDate() - 7);
  weekAnchor.value = next;
}

function goNextWeek() {
  const next = new Date(weekStartDate.value);
  next.setDate(next.getDate() + 7);
  weekAnchor.value = next;
}

function goThisWeek() {
  weekAnchor.value = getStartOfWeek(new Date());
}

function openShiftDialog(cell) {
  selectedCell.value = cell;
  dialogMode.value = cell.effectiveShift ? "edit" : "create";
  dialogError.value = "";
  isDialogVisible.value = true;
}

function closeShiftDialog() {
  isDialogVisible.value = false;
  dialogError.value = "";
}

async function submitShiftDialog(payload) {
  if (!selectedCell.value || !selectedLocationId.value) {
    dialogError.value = "Please select a valid shift cell first.";
    return;
  }

  isSubmitting.value = true;
  dialogError.value = "";

  try {
    if (dialogMode.value === "create") {
      await assignShift(payload);
    } else {
      await editShift(payload);
    }

    closeShiftDialog();
  } catch (error) {
    dialogError.value = error.message || "Failed to save shift changes.";
  } finally {
    isSubmitting.value = false;
  }
}

async function assignShift(payload) {
  const slotDate = selectedCell.value.date;
  const slotTemplate = selectedCell.value.template;

  if (!payload.employee_id) {
    throw new Error("Please select one active employee.");
  }

  if (hasSlotConflict(slotDate, slotTemplate.startTime)) {
    throw new Error("This shift slot is already assigned.");
  }

  if (hasEmployeeDailyConflict(payload.employee_id, slotDate)) {
    throw new Error("This employee already has another shift on this date.");
  }

  const created = await createShift({
    employee_id: payload.employee_id,
    work_date: slotDate,
    start_time: `${slotTemplate.startTime}:00`,
    end_time: slotTemplate.endTime,
    break_minutes: 0,
    location_id: selectedLocationId.value,
    status: "scheduled",
    created_by: currentProfile.value?.id || null,
  });

  shifts.value = [...shifts.value, created];
}

async function editShift(payload) {
  const existingShift = selectedCell.value.effectiveShift;

  if (!existingShift) {
    throw new Error("Cannot edit an empty shift slot.");
  }

  const nextStatus = payload.status || existingShift.status;
  const nextEmployeeId =
    nextStatus === "cancelled"
      ? existingShift.employee_id
      : payload.employee_id || existingShift.employee_id;

  if (nextStatus !== "cancelled" && !nextEmployeeId) {
    throw new Error("Please select one active employee.");
  }

  if (
    nextStatus !== "cancelled" &&
    hasEmployeeDailyConflict(
      nextEmployeeId,
      existingShift.work_date,
      existingShift.id,
    )
  ) {
    throw new Error("This employee already has another shift on this date.");
  }

  if (
    nextStatus !== "cancelled" &&
    hasSlotConflict(
      existingShift.work_date,
      normalizeTime(existingShift.start_time),
      existingShift.id,
    )
  ) {
    throw new Error("Another active shift already occupies this slot.");
  }

  const updated = await updateShift(existingShift.id, {
    employee_id: nextEmployeeId,
    status: nextStatus,
  });

  shifts.value = shifts.value.map((shift) => {
    if (shift.id !== updated.id) {
      return shift;
    }

    return updated;
  });
}

function hasSlotConflict(date, startTime, excludeShiftId = null) {
  return shiftsForStoreAndWeek.value.some((shift) => {
    if (excludeShiftId && shift.id === excludeShiftId) {
      return false;
    }

    if (shift.status === "cancelled") {
      return false;
    }

    return (
      shift.work_date === date && normalizeTime(shift.start_time) === startTime
    );
  });
}

function hasEmployeeDailyConflict(employeeId, date, excludeShiftId = null) {
  return shiftsForStoreAndWeek.value.some((shift) => {
    if (excludeShiftId && shift.id === excludeShiftId) {
      return false;
    }

    if (shift.status === "cancelled") {
      return false;
    }

    return shift.work_date === date && shift.employee_id === employeeId;
  });
}

function buildShiftCell(date, template) {
  const slotShifts = shiftsForStoreAndWeek.value.filter((shift) => {
    return (
      shift.work_date === date &&
      normalizeTime(shift.start_time) === template.startTime
    );
  });

  const activeShifts = slotShifts.filter(
    (shift) => shift.status !== "cancelled",
  );
  const cancelledShifts = slotShifts.filter(
    (shift) => shift.status === "cancelled",
  );

  return {
    key: `${date}-${template.key}`,
    date,
    template,
    effectiveShift: activeShifts[0] || null,
    cancelledCount: cancelledShifts.length,
  };
}

function getStartOfWeek(inputDate) {
  const date = new Date(inputDate);
  const weekday = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - weekday);
  return date;
}

function toISODate(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeTime(value) {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}
</script>
