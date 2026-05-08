<template>
  <section class="rounded-box border border-base-300 bg-base-100 shadow-sm">
    <div v-if="loading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else-if="employees.length === 0" class="px-6 py-16 text-center">
      <p class="text-lg font-medium text-base-content">No employees found</p>
      <p class="mt-2 text-sm text-base-content/70">
        Adjust the filters or invite a new employee to sign up.
      </p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Employee Code</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Location</th>
            <th>Position</th>
            <th>Type</th>
            <th>Status</th>
            <th>Join Date</th>
            <th class="w-56 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="employee in employees" :key="employee.id">
            <td class="font-medium">{{ employee.employee_code }}</td>
            <td>
              <div class="font-medium">{{ employee.name }}</div>
              <div class="text-xs text-base-content/60">
                {{ employee.phone }}
              </div>
            </td>
            <td>{{ employee.email }}</td>
            <td>{{ employee.departments?.name }}</td>
            <td>{{ employee.locations?.name }}</td>
            <td>{{ employee.position }}</td>
            <td>{{ formatEmploymentType(employee.employment_type) }}</td>
            <td>
              <span class="badge" :class="statusClassMap[employee.status]">
                {{ formatStatus(employee.status) }}
              </span>
            </td>
            <td>{{ formatDate(employee.joined_at) }}</td>
            <td class="w-56">
              <div class="flex justify-end gap-2">
                <button
                  class="btn btn-sm btn-ghost w-16"
                  type="button"
                  @click="openEditModal(employee)"
                >
                  Edit
                </button>
                <button
                  v-if="employee.status !== 'resigned'"
                  class="btn btn-sm btn-outline btn-error w-32"
                  type="button"
                  @click="emitStatusUpdate(employee.id, 'resigned')"
                >
                  Mark resigned
                </button>
                <button
                  v-else
                  class="btn btn-sm btn-outline btn-success w-32"
                  type="button"
                  @click="emitStatusUpdate(employee.id, 'active')"
                >
                  Restore
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <dialog ref="editDialogRef" class="modal">
    <div class="modal-box max-w-2xl">
      <h3 class="text-lg font-semibold">Edit Employee</h3>
      <p class="mt-1 text-sm text-base-content/70">
        Update the employee record without changing their login identity.
      </p>

      <form class="mt-5 grid gap-4 md:grid-cols-2" @submit.prevent="submitEdit">
        <label class="form-control">
          <span class="label-text mb-1 text-sm">Employee Code</span>
          <input
            v-model="form.employee_code"
            class="input input-bordered"
            readonly
            type="text"
          />
        </label>

        <label class="form-control">
          <span class="label-text mb-1 text-sm">Full Name</span>
          <input
            v-model="form.name"
            class="input input-bordered"
            required
            type="text"
          />
        </label>

        <label class="form-control">
          <span class="label-text mb-1 text-sm">Email</span>
          <input
            v-model="form.email"
            class="input input-bordered"
            readonly
            type="email"
          />
        </label>

        <label class="form-control">
          <span class="label-text mb-1 text-sm">Phone</span>
          <input
            v-model="form.phone"
            class="input input-bordered"
            required
            type="text"
          />
        </label>

        <label class="form-control">
          <span class="label-text mb-1 text-sm">Department</span>
          <select
            v-model="form.department_id"
            class="select select-bordered"
            required
          >
            <option value="">Select department</option>
            <option
              v-for="department in departments"
              :key="department.id"
              :value="department.id"
            >
              {{ department.name }}
            </option>
          </select>
        </label>

        <label class="form-control">
          <span class="label-text mb-1 text-sm">Location</span>
          <select
            v-model="form.location_id"
            class="select select-bordered"
            required
          >
            <option value="">Select location</option>
            <option
              v-for="location in locations"
              :key="location.id"
              :value="location.id"
            >
              {{ location.name }}
            </option>
          </select>
        </label>

        <label class="form-control">
          <span class="label-text mb-1 text-sm">Position</span>
          <input
            v-model="form.position"
            class="input input-bordered"
            required
            type="text"
          />
        </label>

        <label class="form-control">
          <span class="label-text mb-1 text-sm">Join Date</span>
          <input
            v-model="form.joined_at"
            class="input input-bordered"
            required
            type="date"
          />
        </label>

        <label class="form-control">
          <span class="label-text mb-1 text-sm">Employment Type</span>
          <select
            v-model="form.employment_type"
            class="select select-bordered"
            required
          >
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
          </select>
        </label>

        <label class="form-control">
          <span class="label-text mb-1 text-sm">Status</span>
          <select v-model="form.status" class="select select-bordered" required>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="resigned">Resigned</option>
          </select>
        </label>

        <div v-if="formError" class="alert alert-error md:col-span-2">
          {{ formError }}
        </div>

        <div class="modal-action md:col-span-2">
          <button class="btn" type="button" @click="closeEditModal">
            Cancel
          </button>
          <button class="btn btn-primary" :disabled="isSaving" type="submit">
            <span
              v-if="isSaving"
              class="loading loading-spinner loading-sm"
            ></span>
            <span>{{ isSaving ? "Saving..." : "Save changes" }}</span>
          </button>
        </div>
      </form>
    </div>
    <form class="modal-backdrop" method="dialog">
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup>
import {
  EMPLOYEE_STATUS_BADGE_CLASSES,
  formatEmployeeStatus,
  formatEmploymentType,
} from "@/shared/constants/employee.js";
import { formatDate } from "@/shared/utils/date.js";
import { reactive, ref } from "vue";

const props = defineProps({
  departments: {
    type: Array,
    default: () => [],
  },
  employees: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  locations: {
    type: Array,
    default: () => [],
  },
  updateEmployee: {
    type: Function,
    required: true,
  },
  updateStatus: {
    type: Function,
    required: true,
  },
});
const editDialogRef = ref(null);
const isSaving = ref(false);
const formError = ref("");
const form = reactive({
  id: "",
  employee_code: "",
  name: "",
  email: "",
  phone: "",
  department_id: "",
  location_id: "",
  position: "",
  employment_type: "full_time",
  status: "active",
  joined_at: "",
});

const statusClassMap = EMPLOYEE_STATUS_BADGE_CLASSES;
const formatStatus = formatEmployeeStatus;

function openEditModal(employee) {
  form.id = employee.id;
  form.employee_code = employee.employee_code || "";
  form.name = employee.name || "";
  form.email = employee.email || "";
  form.phone = employee.phone || "";
  form.department_id = employee.department_id || "";
  form.location_id = employee.location_id || "";
  form.position = employee.position || "";
  form.employment_type = employee.employment_type || "full_time";
  form.status = employee.status || "active";
  form.joined_at = employee.joined_at || "";
  formError.value = "";
  editDialogRef.value?.showModal();
}

function closeEditModal() {
  editDialogRef.value?.close();
}

async function submitEdit() {
  formError.value = "";
  isSaving.value = true;

  try {
    await props.updateEmployee({
      id: form.id,
      data: {
        name: form.name,
        phone: form.phone,
        department_id: form.department_id,
        location_id: form.location_id,
        position: form.position,
        employment_type: form.employment_type,
        status: form.status,
        joined_at: form.joined_at,
      },
    });

    closeEditModal();
  } catch (error) {
    formError.value = error.message || "Failed to update employee.";
  } finally {
    isSaving.value = false;
  }
}

async function emitStatusUpdate(employeeId, status) {
  try {
    await props.updateStatus({ id: employeeId, status });
  } catch (error) {
    formError.value = error.message || "Failed to update employee status.";
  }
}
</script>
