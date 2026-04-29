<template>
  <section class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-lg border border-base-300 bg-base-200 p-3">
        <p class="text-xs uppercase tracking-wide text-base-content/60">
          Required shifts
        </p>
        <p class="mt-1 text-2xl font-semibold text-base-content">
          {{ stats.total }}
        </p>
      </article>

      <article class="rounded-lg border border-success/30 bg-success/10 p-3">
        <p class="text-xs uppercase tracking-wide text-base-content/60">
          Scheduled
        </p>
        <p class="mt-1 text-2xl font-semibold text-success">
          {{ stats.filled }}
        </p>
      </article>

      <article class="rounded-lg border border-warning/30 bg-warning/10 p-3">
        <p class="text-xs uppercase tracking-wide text-base-content/60">
          Open shifts
        </p>
        <p class="mt-1 text-2xl font-semibold text-warning">{{ stats.open }}</p>
      </article>

      <article class="rounded-lg border border-base-300 bg-base-200 p-3">
        <p class="text-xs uppercase tracking-wide text-base-content/60">
          Completion
        </p>
        <p class="mt-1 text-2xl font-semibold text-base-content">
          {{ stats.completionText }}
        </p>
      </article>
    </div>

    <div class="mt-4">
      <progress
        class="progress progress-primary w-full"
        :value="stats.completion"
        max="100"
      ></progress>
    </div>

    <div class="mt-4 rounded-lg border border-base-300 bg-base-200 p-3">
      <h3 class="text-sm font-semibold text-base-content">Coverage gaps</h3>
      <p class="mt-1 text-xs text-base-content/60">
        These slots are still empty for this store and week.
      </p>

      <ul v-if="gaps.length" class="mt-3 flex flex-wrap gap-2">
        <li
          v-for="gap in gaps"
          :key="gap.key"
          class="badge badge-outline badge-warning gap-1 py-3"
        >
          <span>{{ gap.dayLabel }}</span>
          <span>{{ gap.shiftLabel }}</span>
        </li>
      </ul>

      <p v-else class="mt-3 text-sm font-medium text-success">
        All fixed shifts are covered.
      </p>
    </div>
  </section>
</template>

<script setup>
defineProps({
  gaps: {
    type: Array,
    default: () => [],
  },
  stats: {
    type: Object,
    required: true,
  },
});
</script>
