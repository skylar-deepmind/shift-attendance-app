import {
  getAllEmployees,
  updateEmployee,
} from "@/services/database_crud/apiEmployee.js";
import {
  getDepartments,
  getLocations,
} from "@/services/database_crud/apiOrganization.js";
import { computed, onMounted, ref } from "vue";

export function useEmployeeManagementPage() {
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

  return {
    departments,
    filteredEmployees,
    filters,
    handleUpdateEmployee,
    handleUpdateStatus,
    isLoading,
    locations,
  };
}
