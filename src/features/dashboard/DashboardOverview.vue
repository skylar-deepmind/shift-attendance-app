<template>
  <section class="min-h-screen bg-base-200">
    <NavBar title="管理 Dashboard" />

    <div class="mx-auto max-w-none px-4 py-6 lg:px-6">
      <div v-if="isLoading" class="rounded-box bg-base-100 py-16 text-center shadow-sm">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <template v-else>
        <div v-if="errorMessage" class="alert alert-error mb-6">
          {{ errorMessage }}
        </div>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="card in snapshot.cards"
            :key="card.key"
            class="rounded-box border bg-base-100 p-5 shadow-sm"
            :class="cardClass(card.tone)"
          >
            <p class="text-sm text-base-content/60">{{ card.label }}</p>
            <p class="mt-3 text-3xl font-semibold text-base-content">{{ card.value }}</p>
          </article>
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section class="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-base-content">今日考勤概览</h2>
                <p class="text-sm text-base-content/60">帮助管理员快速确认今天的出勤状态</p>
              </div>
              <button class="btn btn-sm" type="button" @click="loadSnapshot">刷新</button>
            </div>

            <div class="mt-5 grid gap-4 md:grid-cols-2">
              <article class="rounded-lg bg-base-200 p-4">
                <p class="text-xs uppercase tracking-wide text-base-content/60">今日出勤</p>
                <p class="mt-2 text-2xl font-semibold">{{ snapshot.attendanceSummary.attendanceToday }}</p>
              </article>
              <article class="rounded-lg bg-base-200 p-4">
                <p class="text-xs uppercase tracking-wide text-base-content/60">今日迟到</p>
                <p class="mt-2 text-2xl font-semibold">{{ snapshot.attendanceSummary.lateToday }}</p>
              </article>
              <article class="rounded-lg bg-base-200 p-4">
                <p class="text-xs uppercase tracking-wide text-base-content/60">今日早退</p>
                <p class="mt-2 text-2xl font-semibold">{{ snapshot.attendanceSummary.earlyLeaveToday }}</p>
              </article>
              <article class="rounded-lg bg-base-200 p-4">
                <p class="text-xs uppercase tracking-wide text-base-content/60">请假中员工</p>
                <p class="mt-2 text-2xl font-semibold">{{ snapshot.attendanceSummary.activeLeaveToday }}</p>
              </article>
            </div>
          </section>

          <section class="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
            <h2 class="text-lg font-semibold text-base-content">最近请假申请</h2>
            <p class="mt-1 text-sm text-base-content/60">方便管理员快速进入审批处理</p>

            <div v-if="snapshot.recentLeaveRequests.length === 0" class="mt-6 rounded-lg border border-dashed border-base-300 p-6 text-center text-sm text-base-content/70">
              暂无请假申请记录
            </div>

            <ul v-else class="mt-5 space-y-3">
              <li
                v-for="request in snapshot.recentLeaveRequests"
                :key="request.id"
                class="rounded-lg border border-base-300 p-4"
              >
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="font-medium text-base-content">
                      {{ request.employees?.name || "未知员工" }}
                    </p>
                    <p class="mt-1 text-sm text-base-content/60">
                      {{ formatDateRange(request.start_date, request.end_date) }} ·
                      {{ formatLeaveType(request.leave_type) }}
                    </p>
                  </div>
                  <span class="badge" :class="statusClass(request.status)">
                    {{ formatStatus(request.status) }}
                  </span>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <section class="mt-6 rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 class="text-lg font-semibold text-base-content">门店班次分布</h2>
          <p class="mt-1 text-sm text-base-content/60">统计的是本周已安排的有效班次和覆盖员工数</p>

          <div class="mt-5 overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>门店</th>
                  <th>本周有效班次</th>
                  <th>参与员工数</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in snapshot.locationRows" :key="row.id">
                  <td class="font-medium">{{ row.name }}</td>
                  <td>{{ row.shiftCount }}</td>
                  <td>{{ row.assignedEmployees }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </div>
  </section>
</template>

<script setup>
import { getDashboardSnapshot } from "@/services/apiDashboard.js";
import NavBar from "@/ui/NavBar.vue";
import { onMounted, ref } from "vue";

const isLoading = ref(true);
const errorMessage = ref("");
const snapshot = ref({
  cards: [],
  attendanceSummary: {
    attendanceToday: 0,
    lateToday: 0,
    earlyLeaveToday: 0,
    activeLeaveToday: 0,
  },
  locationRows: [],
  recentLeaveRequests: [],
});

onMounted(async () => {
  await loadSnapshot();
});

async function loadSnapshot() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    snapshot.value = await getDashboardSnapshot();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "加载 dashboard 失败。";
  } finally {
    isLoading.value = false;
  }
}

function cardClass(tone) {
  if (tone === "success") return "border-success/30";
  if (tone === "warning") return "border-warning/30";
  if (tone === "error") return "border-error/30";
  return "border-primary/30";
}

function formatDateRange(startDate, endDate) {
  return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
}

function formatLeaveType(value) {
  if (value === "annual") return "年假";
  if (value === "sick") return "病假";
  if (value === "personal") return "事假";
  if (value === "unpaid") return "无薪假";
  return "其他";
}

function formatStatus(value) {
  if (value === "approved") return "已通过";
  if (value === "rejected") return "已驳回";
  if (value === "cancelled") return "已撤回";
  return "待审批";
}

function statusClass(value) {
  if (value === "approved") return "badge-success";
  if (value === "rejected") return "badge-error";
  if (value === "cancelled") return "badge-neutral";
  return "badge-warning";
}
</script>
