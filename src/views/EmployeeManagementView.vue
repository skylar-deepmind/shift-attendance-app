<template>
  <section class="min-h-screen bg-base-200">
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
import {
  getAllEmployees,
  updateEmployee,
} from "@/services/database_crud/apiEmployee.js";
import {
  getDepartments,
  getLocations,
} from "@/services/database_crud/apiOrganization.js";
import ToolBar from "@/ui/ToolBar.vue";
import { computed, onMounted, ref } from "vue";

const isLoading = ref(true);
const employees = ref([]);
const departments = ref([]);
const locations = ref([]);
const filters = ref({
  keyword: "",
  departmentId: "",
  locationId: "",
  employmentType: "",
  status: "",
});

const filteredEmployees = computed(() => {
  const keyword = filters.value.keyword.trim().toLowerCase();

  return employees.value.filter((employee) => {
    const matchesKeyword =
      !keyword ||
      employee.employee_code?.toLowerCase().includes(keyword) ||
      employee.name?.toLowerCase().includes(keyword) ||
      employee.email?.toLowerCase().includes(keyword);

    const matchesDepartment =
      !filters.value.departmentId ||
      employee.department_id === filters.value.departmentId;

    const matchesLocation =
      !filters.value.locationId ||
      employee.location_id === filters.value.locationId;

    const matchesEmploymentType =
      !filters.value.employmentType ||
      employee.employment_type === filters.value.employmentType;

    const matchesStatus =
      !filters.value.status || employee.status === filters.value.status;

    return (
      matchesKeyword &&
      matchesDepartment &&
      matchesLocation &&
      matchesEmploymentType &&
      matchesStatus
    );
  });
});

onMounted(async () => {
  try {
    const [employeeList, departmentList, locationList] = await Promise.all([
      getAllEmployees(),
      getDepartments(),
      getLocations(),
    ]);

    employees.value = employeeList;
    departments.value = departmentList;
    locations.value = locationList;
  } finally {
    isLoading.value = false;
  }
});

async function handleUpdateEmployee(payload) {
  const updatedEmployee = await updateEmployee(payload.id, payload.data);
  replaceEmployee(updatedEmployee);
  return updatedEmployee;
}

async function handleUpdateStatus(payload) {
  const updatedEmployee = await updateEmployee(payload.id, {
    status: payload.status,
  });
  replaceEmployee(updatedEmployee);
  return updatedEmployee;
}

function replaceEmployee(updatedEmployee) {
  employees.value = employees.value.map((employee) =>
    employee.id === updatedEmployee.id ? updatedEmployee : employee,
  );
}
</script>
