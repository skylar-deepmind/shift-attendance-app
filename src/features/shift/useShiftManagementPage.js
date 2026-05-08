import { getCurrentProfile } from "@/services/apiAuth.js";
import { getAllEmployees } from "@/services/database_crud/apiEmployee.js";
import { getLocations } from "@/services/database_crud/apiOrganization.js";
import {
  createShift,
  getShiftsInRange,
  updateShift,
} from "@/services/database_crud/apiShift.js";
import {
  formatDate,
  getStartOfWeek,
  normalizeTime,
  toISODate,
} from "@/shared/utils/date.js";
import { computed, onMounted, ref, watch } from "vue";
import { SHIFT_TEMPLATES } from "./shiftTemplates.js";

export function useShiftManagementPage() {
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
      if (!selectedLocationId.value) {
        return true;
      }

      return shift.location_id === selectedLocationId.value;
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

    return formatDate(selectedCell.value.date, "en-US", {
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
      pageError.value =
        error.message || "Failed to load shift management page.";
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

  return {
    boardRows,
    candidateEmployees,
    closeShiftDialog,
    coverageGaps,
    coverageStats,
    dialogError,
    dialogMode,
    employeeKeyword,
    goNextWeek,
    goPrevWeek,
    goThisWeek,
    isBootLoading,
    isDialogVisible,
    isShiftLoading,
    isSubmitting,
    locations,
    openShiftDialog,
    pageError,
    selectedCell,
    selectedCellDateLabel,
    selectedLocationId,
    selectedLocationName,
    selectedShiftLabel,
    staffLoadRows,
    submitShiftDialog,
    weekDays,
    weekRangeLabel,
  };
}
