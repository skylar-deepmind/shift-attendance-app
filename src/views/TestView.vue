<template>
  <button class="btn btn-primary" @click="fetchAllEmployees">
    Get All Employees info
  </button>
  <UserGenerator />
  <EmployeeGenerator />
</template>

<script setup>
import EmployeeGenerator from "@/features/test/employeeGenerator.vue";
import UserGenerator from "@/features/test/userGenerator.vue";
import { getAllEmployees } from "@/services/database_crud/apiEmployee.js";

async function fetchAllEmployees() {
  // Implementation for fetching all employees
  const data = await getAllEmployees();
  console.log(data);
}
</script>

<style lang="scss" scoped></style>
