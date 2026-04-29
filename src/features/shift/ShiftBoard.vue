<template>
  <section class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-base-content">
        Weekly Shift Matrix
      </h2>
      <p class="text-xs text-base-content/60">
        Rows: fixed shifts · Columns: Monday to Sunday
      </p>
    </div>

    <div class="mt-4 overflow-x-auto">
      <table class="table table-bordered">
        <thead>
          <tr>
            <th class="w-40 bg-base-200">Shift</th>
            <th
              v-for="day in weekDays"
              :key="day.dateKey"
              class="min-w-40 bg-base-200 text-center"
            >
              <div class="font-semibold">{{ day.weekday }}</div>
              <div class="text-xs text-base-content/60">
                {{ day.dateLabel }}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in boardRows" :key="row.templateKey">
            <th class="align-top bg-base-50 font-medium">
              {{ row.shiftLabel }}
            </th>
            <td v-for="cell in row.cells" :key="cell.key" class="p-2 align-top">
              <button
                class="w-full rounded-lg border p-3 text-left transition hover:border-primary"
                :class="cellClass(cell)"
                type="button"
                @click="$emit('select-cell', cell)"
              >
                <template v-if="cell.effectiveShift">
                  <p class="text-sm font-semibold text-base-content">
                    {{ cell.effectiveShift.employees?.name || "Unassigned" }}
                  </p>
                  <p class="text-xs text-base-content/70">
                    {{
                      cell.effectiveShift.employees?.employee_code || "No code"
                    }}
                  </p>
                  <span
                    class="badge badge-sm mt-2"
                    :class="statusClass(cell.effectiveShift.status)"
                  >
                    {{ cell.effectiveShift.status }}
                  </span>
                </template>

                <template v-else>
                  <p class="text-sm font-semibold">Open shift</p>
                  <p class="text-xs opacity-80">Click to assign employee</p>
                </template>

                <p
                  v-if="cell.cancelledCount > 0"
                  class="mt-2 text-xs text-base-content/60"
                >
                  {{ cell.cancelledCount }} cancelled record{{
                    cell.cancelledCount > 1 ? "s" : ""
                  }}
                </p>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
defineProps({
  boardRows: {
    type: Array,
    default: () => [],
  },
  weekDays: {
    type: Array,
    default: () => [],
  },
});

defineEmits(["select-cell"]);

function cellClass(cell) {
  if (cell.effectiveShift) {
    return "border-success/40 bg-success/10";
  }

  if (cell.cancelledCount > 0) {
    return "border-warning/40 bg-warning/10";
  }

  return "border-base-300 bg-base-100";
}

function statusClass(status) {
  if (status === "scheduled") return "badge-success";
  if (status === "changed") return "badge-info";
  if (status === "cancelled") return "badge-warning";
  return "badge-ghost";
}
</script>
