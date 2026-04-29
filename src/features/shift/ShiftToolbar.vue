<template>
  <section class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
    <div
      class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
    >
      <div>
        <h1 class="text-2xl font-semibold text-base-content">
          Shift Coverage Board
        </h1>
        <p class="text-sm text-base-content/70">
          Plan one store at a time and keep every fixed slot covered for this
          week.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button class="btn btn-sm" type="button" @click="$emit('prev-week')">
          Previous week
        </button>
        <button class="btn btn-sm" type="button" @click="$emit('this-week')">
          This week
        </button>
        <button class="btn btn-sm" type="button" @click="$emit('next-week')">
          Next week
        </button>
      </div>
    </div>

    <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <label class="form-control">
        <span class="label-text mb-1 text-sm">Store</span>
        <select
          :value="locationId"
          class="select select-bordered w-full"
          @change="$emit('update:locationId', $event.target.value)"
        >
          <option value="">Select a store</option>
          <option
            v-for="location in locations"
            :key="location.id"
            :value="location.id"
          >
            {{ location.name }}
          </option>
        </select>
      </label>

      <div class="form-control">
        <span class="label-text mb-1 text-sm">Week range</span>
        <div
          class="input input-bordered flex items-center bg-base-200 text-sm text-base-content/80"
        >
          {{ weekLabel }}
        </div>
      </div>

      <label class="form-control md:col-span-2">
        <span class="label-text mb-1 text-sm">Employee search</span>
        <input
          :value="keyword"
          class="input input-bordered w-full"
          placeholder="Search by name or employee code"
          type="text"
          @input="$emit('update:keyword', $event.target.value)"
        />
      </label>
    </div>

    <div class="alert alert-info mt-4 py-3 text-sm">
      One store, one week, three fixed shifts per day. Only active employees can
      be assigned, and one employee cannot hold two shifts on the same date.
    </div>
  </section>
</template>

<script setup>
defineProps({
  keyword: {
    type: String,
    default: "",
  },
  locationId: {
    type: String,
    default: "",
  },
  locations: {
    type: Array,
    default: () => [],
  },
  weekLabel: {
    type: String,
    default: "",
  },
});

defineEmits([
  "prev-week",
  "this-week",
  "next-week",
  "update:locationId",
  "update:keyword",
]);
</script>
