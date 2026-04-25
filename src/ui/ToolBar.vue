<template>
  <section class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-base-content">Staff Management</h1>
        <p class="text-sm text-base-content/70">
          Manage active staff, update records, and share the signup link for new hires.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <div class="badge badge-outline badge-lg">{{ employeeCount }} employees</div>
        <button class="btn btn-primary" type="button" @click="copyInviteLink">
          {{ copyButtonText }}
        </button>
      </div>
    </div>

    <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <label class="form-control">
        <span class="label-text mb-1 text-sm">Keyword</span>
        <input
          :value="filters.keyword"
          class="input input-bordered w-full"
          placeholder="Code, name, or email"
          type="text"
          @input="updateFilter('keyword', $event.target.value)"
        />
      </label>

      <label class="form-control">
        <span class="label-text mb-1 text-sm">Department</span>
        <select
          :value="filters.departmentId"
          class="select select-bordered w-full"
          @change="updateFilter('departmentId', $event.target.value)"
        >
          <option value="">All departments</option>
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
          :value="filters.locationId"
          class="select select-bordered w-full"
          @change="updateFilter('locationId', $event.target.value)"
        >
          <option value="">All locations</option>
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
        <span class="label-text mb-1 text-sm">Employment type</span>
        <select
          :value="filters.employmentType"
          class="select select-bordered w-full"
          @change="updateFilter('employmentType', $event.target.value)"
        >
          <option value="">All types</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="contract">Contract</option>
        </select>
      </label>

      <label class="form-control">
        <span class="label-text mb-1 text-sm">Status</span>
        <select
          :value="filters.status"
          class="select select-bordered w-full"
          @change="updateFilter('status', $event.target.value)"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="resigned">Resigned</option>
        </select>
      </label>
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  departments: {
    type: Array,
    default: () => [],
  },
  employeeCount: {
    type: Number,
    default: 0,
  },
  filters: {
    type: Object,
    required: true,
  },
  locations: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:filters"]);
const copyButtonText = ref("Copy signup link");

function updateFilter(key, value) {
  emit("update:filters", {
    ...props.filters,
    [key]: value,
  });
}

async function copyInviteLink() {
  const inviteLink = `${window.location.origin}/signup`;

  try {
    await navigator.clipboard.writeText(inviteLink);
    copyButtonText.value = "Link copied";
  } catch (error) {
    copyButtonText.value = "Copy failed";
  }

  window.setTimeout(() => {
    copyButtonText.value = "Copy signup link";
  }, 1500);
}
</script>
