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
import NavBar from "@/ui/NavBar.vue";
import { useShiftManagementPage } from "@/features/shift/useShiftManagementPage.js";
const {
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
} = useShiftManagementPage();
</script>
