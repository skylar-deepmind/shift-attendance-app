<script setup>
import {
  ensureProfileEmployeeId,
  getCurrentProfile,
  getCurrentUser,
  hasEmployeeRecord,
  resolveProfileHomeRoute,
} from "@/services/apiAuth.js";
import { insertEmployee } from "@/services/database_crud/apiEmployee.js";
import {
  getDepartments,
  getLocations,
} from "@/services/database_crud/apiOrganization.js";
import { updateProfile } from "@/services/database_crud/apiProfile.js";
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const isPageLoading = ref(true);
const isSubmitting = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const currentProfileId = ref("");
const reservedEmployeeId = ref("");
const departments = ref([]);
const locations = ref([]);
const currentProfile = ref(null);

const formData = reactive({
  employee_code: "",
  name: "",
  email: "",
  phone: "",
  department_id: "",
  location_id: "",
  position: "",
  employment_type: "full_time",
  status: "active",
  joined_at: new Date().toISOString().slice(0, 10),
});

onMounted(async () => {
  try {
    const [user, profile, departmentList, locationList] = await Promise.all([
      getCurrentUser(),
      getCurrentProfile(),
      getDepartments(),
      getLocations(),
    ]);

    if (!user) {
      router.push({ name: "login" });
      return;
    }

    if (!profile) {
      throw new Error("Profile not found. Please sign up again.");
    }

    currentProfile.value = profile;

    if (await hasEmployeeRecord(profile.employee_id)) {
      router.push(resolveProfileHomeRoute(profile));
      return;
    }

    currentProfileId.value = profile.id;
    reservedEmployeeId.value = await ensureProfileEmployeeId(profile);
    departments.value = departmentList;
    locations.value = locationList;
    formData.employee_code = profile.employee_code || "";
    formData.name = profile.display_name || "";
    formData.email = user.email || "";
    formData.department_id = departmentList[0]?.id || "";
    formData.location_id = locationList[0]?.id || "";
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Failed to load employee form.";
  } finally {
    isPageLoading.value = false;
  }
});

async function handleSubmit() {
  errorMessage.value = "";
  successMessage.value = "";
  isSubmitting.value = true;

  try {
    const createdEmployees = await insertEmployee({
      id: reservedEmployeeId.value,
      employee_code: formData.employee_code,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      department_id: formData.department_id || null,
      location_id: formData.location_id || null,
      position: formData.position || null,
      employment_type: formData.employment_type,
      status: formData.status,
      joined_at: formData.joined_at,
    });

    const createdEmployee = createdEmployees[0];

    if (!createdEmployee?.id) {
      throw new Error("Employee record was not created.");
    }

    if (createdEmployee.id !== reservedEmployeeId.value) {
      await updateProfile(currentProfileId.value, {
        employee_id: createdEmployee.id,
      });
    }

    successMessage.value = "Employee profile completed. Redirecting...";
    setTimeout(() => {
      router.push(resolveProfileHomeRoute(currentProfile.value));
    }, 800);
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "Failed to submit employee form.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="flex justify-center items-center min-h-screen bg-base-200 p-4">
    <div class="card w-full max-w-2xl bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-2xl font-bold mb-2 text-primary">
          Complete Employee Profile
        </h2>
        <p class="text-sm text-base-content/70 mb-4">
          Fill in your basic employee information before using the system.
        </p>

        <div v-if="isPageLoading" class="flex justify-center py-10">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <p v-if="errorMessage" class="alert alert-error text-sm">
            {{ errorMessage }}
          </p>

          <p v-if="successMessage" class="alert alert-success text-sm">
            {{ successMessage }}
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">Employee Code</span>
              </label>
              <input
                v-model="formData.employee_code"
                type="text"
                class="input input-bordered w-full input-disabled"
                readonly
              />
            </div>

            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">Full Name</span>
              </label>
              <input
                v-model="formData.name"
                type="text"
                placeholder="Enter full name"
                class="input input-bordered w-full focus:input-primary"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">Email</span>
              </label>
              <input
                v-model="formData.email"
                type="email"
                class="input input-bordered w-full input-disabled"
                readonly
              />
            </div>

            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">Phone</span>
              </label>
              <input
                v-model="formData.phone"
                type="tel"
                placeholder="Enter phone number"
                class="input input-bordered w-full focus:input-primary"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">Department</span>
              </label>
              <select
                v-model="formData.department_id"
                class="select select-bordered focus:select-primary"
                required
              >
                <option v-if="departments.length === 0" disabled value="">
                  No departments available
                </option>
                <option
                  v-for="department in departments"
                  :key="department.id"
                  :value="department.id"
                >
                  {{ department.name }}
                </option>
              </select>
            </div>

            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">Location</span>
              </label>
              <select
                v-model="formData.location_id"
                class="select select-bordered focus:select-primary"
                required
              >
                <option v-if="locations.length === 0" disabled value="">
                  No locations available
                </option>
                <option
                  v-for="location in locations"
                  :key="location.id"
                  :value="location.id"
                >
                  {{ location.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">Position</span>
              </label>
              <input
                v-model="formData.position"
                type="text"
                placeholder="e.g. Store Staff"
                class="input input-bordered w-full focus:input-primary"
                required
              />
            </div>

            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">Join Date</span>
              </label>
              <input
                v-model="formData.joined_at"
                type="date"
                class="input input-bordered w-full focus:input-primary"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">Employment Type</span>
              </label>
              <select
                v-model="formData.employment_type"
                class="select select-bordered focus:select-primary"
                required
              >
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contract</option>
              </select>
            </div>

            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">Employment Status</span>
              </label>
              <select
                v-model="formData.status"
                class="select select-bordered focus:select-primary"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="resigned">Resigned</option>
              </select>
            </div>
          </div>

          <div class="card-actions justify-end mt-4">
            <button
              type="submit"
              class="btn btn-primary w-full md:w-40"
              :disabled="
                isSubmitting ||
                isPageLoading ||
                !formData.employee_code ||
                !reservedEmployeeId ||
                !formData.department_id ||
                !formData.location_id
              "
            >
              <span v-if="isSubmitting" class="loading loading-spinner"></span>
              <span>{{
                isSubmitting ? "Submitting..." : "Complete Profile"
              }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
