<template>
  <section class="min-h-screen bg-base-200">
    <NavBar title="请假审批" />

    <div class="mx-auto max-w-none px-4 py-6 lg:px-6">
      <section class="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-base-content">管理员审批面板</h1>
            <p class="mt-1 text-sm text-base-content/60">集中处理请假申请，审核结果会直接写回申请记录。</p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <label class="form-control">
              <span class="label-text mb-1 text-sm">状态筛选</span>
              <select v-model="selectedStatus" class="select select-bordered">
                <option value="">全部</option>
                <option value="pending">待审批</option>
                <option value="approved">已通过</option>
                <option value="rejected">已驳回</option>
                <option value="cancelled">已撤回</option>
              </select>
            </label>

            <button class="btn" type="button" @click="loadRequests">刷新</button>
          </div>
        </div>

        <div v-if="errorMessage" class="alert alert-error mt-4">
          {{ errorMessage }}
        </div>

        <div v-if="isLoading" class="py-16 text-center">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>

        <div
          v-else-if="requests.length === 0"
          class="mt-6 rounded-lg border border-dashed border-base-300 p-8 text-center text-sm text-base-content/70"
        >
          当前筛选下没有请假申请。
        </div>

        <div v-else class="mt-6 overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>员工</th>
                <th>类型</th>
                <th>日期</th>
                <th>天数</th>
                <th>状态</th>
                <th>原因</th>
                <th class="w-72">审批</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="request in requests" :key="request.id">
                <td>
                  <div class="font-medium">{{ request.employees?.name || "未知员工" }}</div>
                  <div class="text-xs text-base-content/60">
                    {{ request.employees?.employee_code || "无编号" }}
                  </div>
                </td>
                <td>{{ formatLeaveType(request.leave_type) }}</td>
                <td>{{ formatDateRange(request.start_date, request.end_date) }}</td>
                <td>{{ request.duration_days }}</td>
                <td>
                  <span class="badge" :class="statusClass(request.status)">
                    {{ formatStatus(request.status) }}
                  </span>
                </td>
                <td class="max-w-xs whitespace-pre-wrap text-sm text-base-content/75">
                  {{ request.reason || "无说明" }}
                </td>
                <td>
                  <div class="grid gap-2">
                    <textarea
                      v-model="reviewComments[request.id]"
                      class="textarea textarea-bordered textarea-sm min-h-20"
                      placeholder="填写审批备注（选填）"
                    ></textarea>

                    <div class="flex gap-2">
                      <button
                        class="btn btn-sm btn-success"
                        :disabled="request.status !== 'pending' || submittingId === request.id"
                        type="button"
                        @click="reviewRequest(request, 'approved')"
                      >
                        通过
                      </button>
                      <button
                        class="btn btn-sm btn-error"
                        :disabled="request.status !== 'pending' || submittingId === request.id"
                        type="button"
                        @click="reviewRequest(request, 'rejected')"
                      >
                        驳回
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { getCurrentProfile } from "@/services/apiAuth.js";
import {
  getLeaveRequests,
  updateLeaveRequest,
} from "@/services/database_crud/apiLeaveRequests.js";
import NavBar from "@/ui/NavBar.vue";
import { onMounted, ref, watch } from "vue";

const isLoading = ref(true);
const errorMessage = ref("");
const selectedStatus = ref("pending");
const submittingId = ref("");
const requests = ref([]);
const reviewComments = ref({});
const currentProfile = ref(null);

onMounted(async () => {
  currentProfile.value = await getCurrentProfile();
  await loadRequests();
});

watch(selectedStatus, async () => {
  await loadRequests();
});

async function loadRequests() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    requests.value = await getLeaveRequests({
      status: selectedStatus.value || undefined,
    });
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "加载审批列表失败。";
  } finally {
    isLoading.value = false;
  }
}

async function reviewRequest(request, status) {
  submittingId.value = request.id;
  errorMessage.value = "";

  try {
    const updated = await updateLeaveRequest(request.id, {
      status,
      reviewer_id: currentProfile.value?.id || null,
      reviewed_at: new Date().toISOString(),
      review_comment: reviewComments.value[request.id] || null,
    });

    requests.value = requests.value.map((item) =>
      item.id === updated.id ? updated : item,
    );
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "提交审批失败。";
  } finally {
    submittingId.value = "";
  }
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

function formatDateRange(startDate, endDate) {
  return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
}
</script>
