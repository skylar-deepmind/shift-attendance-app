<template>
  <section class="min-h-screen bg-base-200">
    <NavBar title="员工管理" />
    <div class="mx-auto flex max-w-none flex-col gap-6 px-4 py-6 lg:px-6">
      <ToolBar
        v-model:filters="filters"
        :departments="departments"
        :locations="locations"
        :employee-count="filteredEmployees.length"
      />

      <EmployeeList
        :employees="filteredEmployees"
        :departments="departments"
        :loading="isLoading"
        :locations="locations"
        :update-employee="handleUpdateEmployee"
        :update-status="handleUpdateStatus"
      />
    </div>
  </section>
</template>

<script setup>
import EmployeeList from "@/features/employee/EmployeeList.vue";
import { useEmployeeManagementPage } from "@/features/employee/useEmployeeManagementPage.js";
import NavBar from "@/ui/NavBar.vue";
import ToolBar from "@/ui/ToolBar.vue";
const {
  departments,
  filteredEmployees,
  filters,
  handleUpdateEmployee,
  handleUpdateStatus,
  isLoading,
  locations,
} = useEmployeeManagementPage();
</script>
