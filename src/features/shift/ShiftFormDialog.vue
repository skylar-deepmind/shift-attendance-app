<template>
  <dialog ref="dialogRef" class="modal">
    <div class="modal-box max-w-lg">
      <h3 class="text-lg font-semibold">
        {{ mode === "create" ? "Assign Open Shift" : "Edit Shift" }}
      </h3>
      <p class="mt-1 text-sm text-base-content/70">
        Keep edits simple: assign a valid employee and adjust status when
        needed.
      </p>

      <form class="mt-4 grid gap-3" @submit.prevent="submitForm">
        <label class="form-control">
          <span class="label-text mb-1 text-sm">Store</span>
          <input
            :value="locationName"
            class="input input-bordered"
            readonly
            type="text"
          />
        </label>

        <label class="form-control">
          <span class="label-text mb-1 text-sm">Date</span>
          <input
            :value="dateLabel"
            class="input input-bordered"
            readonly
            type="text"
          />
        </label>

        <label class="form-control">
          <span class="label-text mb-1 text-sm">Shift</span>
          <input
            :value="shiftLabel"
            class="input input-bordered"
            readonly
            type="text"
          />
        </label>

        <label class="form-control">
          <span class="label-text mb-1 text-sm">Employee</span>
          <select
            v-model="employeeId"
            class="select select-bordered"
            :disabled="mode === 'edit' && status === 'cancelled'"
            required
          >
            <option value="">Select employee</option>
            <option
              v-for="employee in employees"
              :key="employee.id"
              :value="employee.id"
            >
              {{ employee.name }} ({{ employee.employee_code }})
            </option>
          </select>
        </label>

        <label v-if="mode === 'edit'" class="form-control">
          <span class="label-text mb-1 text-sm">Status</span>
          <select v-model="status" class="select select-bordered" required>
            <option value="scheduled">scheduled</option>
            <option value="changed">changed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </label>

        <div v-if="errorMessage" class="alert alert-error py-2 text-sm">
          {{ errorMessage }}
        </div>

        <div class="modal-action mt-1">
          <button class="btn" type="button" @click="$emit('close')">
            Close
          </button>
          <button
            v-if="mode === 'edit'"
            class="btn btn-outline btn-warning"
            type="button"
            :disabled="isSaving"
            @click="markCancelled"
          >
            Mark cancelled
          </button>
          <button class="btn btn-primary" :disabled="isSaving" type="submit">
            <span
              v-if="isSaving"
              class="loading loading-spinner loading-sm"
            ></span>
            <span>{{ mode === "create" ? "Assign" : "Save" }}</span>
          </button>
        </div>
      </form>
    </div>
    <form class="modal-backdrop" method="dialog">
      <button @click.prevent="$emit('close')">close</button>
    </form>
  </dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  dateLabel: {
    type: String,
    default: "",
  },
  employees: {
    type: Array,
    default: () => [],
  },
  errorMessage: {
    type: String,
    default: "",
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  locationName: {
    type: String,
    default: "",
  },
  mode: {
    type: String,
    default: "create",
  },
  selectedCell: {
    type: Object,
    default: null,
  },
  shiftLabel: {
    type: String,
    default: "",
  },
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "submit"]);
const dialogRef = ref(null);
const employeeId = ref("");
const status = ref("scheduled");

const defaultEmployeeId = computed(() => {
  return props.selectedCell?.effectiveShift?.employee_id || "";
});

const defaultStatus = computed(() => {
  return props.selectedCell?.effectiveShift?.status || "scheduled";
});

watch(
  () => props.selectedCell,
  () => {
    employeeId.value = defaultEmployeeId.value;
    status.value = defaultStatus.value;
  },
  { immediate: true },
);

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      dialogRef.value?.showModal();
      return;
    }

    dialogRef.value?.close();
  },
);

watch(status, (value) => {
  if (value === "cancelled") {
    return;
  }

  if (!employeeId.value) {
    employeeId.value = defaultEmployeeId.value;
  }
});

function submitForm() {
  emit("submit", {
    employee_id: employeeId.value,
    status: props.mode === "create" ? "scheduled" : status.value,
  });
}

function markCancelled() {
  emit("submit", {
    employee_id: defaultEmployeeId.value,
    status: "cancelled",
  });
}
</script>
