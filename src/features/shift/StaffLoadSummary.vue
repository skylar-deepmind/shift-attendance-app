<template>
  <section class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-base-content">
        Staff Load Summary
      </h2>
      <p class="text-xs text-base-content/60">
        Active employees in selected store for this week
      </p>
    </div>

    <div
      v-if="rows.length === 0"
      class="mt-4 rounded-lg border border-dashed border-base-300 p-6 text-center"
    >
      <p class="text-sm text-base-content/70">
        No active employees found for this store.
      </p>
    </div>

    <div v-else class="mt-4 overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Name</th>
            <th>Employee Code</th>
            <th>Shifts (week)</th>
            <th>Total Hours</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="employee in rows" :key="employee.id">
            <td class="font-medium">{{ employee.name || "Unknown" }}</td>
            <td>{{ employee.employee_code || "No code" }}</td>
            <td>
              <span class="badge badge-outline">{{ employee.shiftCount }}</span>
            </td>
            <td>{{ employee.totalHours }} h</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
});
</script>
