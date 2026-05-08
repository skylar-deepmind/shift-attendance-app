<template>
  <section class="min-h-screen bg-base-200">
    <NavBar title="我的请假" />

    <div class="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article class="rounded-box border border-base-300 bg-base-100 p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-xl font-semibold text-base-content">提交请假申请</h1>
              <p class="mt-1 text-sm text-base-content/60">提交后等待管理员审核，审核结果会展示在右侧列表中。</p>
            </div>
            <button class="btn btn-sm" type="button" @click="resetForm">重置</button>
          </div>

          <form class="mt-6 grid gap-4" @submit.prevent="submitRequest">
            <label class="form-control">
              <span class="label-text mb-1 text-sm">请假类型</span>
              <select v-model="form.leave_type" class="select select-bordered" required>
                <option value="annual">年假</option>
                <option value="sick">病假</option>
                <option value="personal">事假</option>
                <option value="unpaid">无薪假</option>
                <option value="other">其他</option>
              </select>
            </label>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="form-control">
                <span class="label-text mb-1 text-sm">开始日期</span>
                <input v-model="form.start_date" class="input input-bordered" required type="date" />
              </label>
              <label class="form-control">
                <span class="label-text mb-1 text-sm">结束日期</span>
                <input v-model="form.end_date" class="input input-bordered" required type="date" />
              </label>
            </div>

            <label class="form-control">
              <span class="label-text mb-1 text-sm">请假原因</span>
              <textarea
                v-model="form.reason"
                class="textarea textarea-bordered min-h-28"
                maxlength="300"
                placeholder="简单描述请假原因，方便审批判断"
                required
              ></textarea>
            </label>

            <div class="rounded-lg bg-base-200 p-4 text-sm text-base-content/70">
              本次申请预计请假 <span class="font-semibold text-base-content">{{ durationDays }}</span> 天
            </div>

            <div v-if="feedback.message" class="alert" :class="feedback.type === 'error' ? 'alert-error' : 'alert-success'">
              {{ feedback.message }}
            </div>

            <button class="btn btn-primary" :disabled="isSubmitting" type="submit">
              <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
              <span>{{ isSubmitting ? "提交中..." : "提交申请" }}</span>
            </button>
          </form>
        </article>

        <article class="rounded-box border border-base-300 bg-base-100 p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-base-content">我的申请记录</h2>
              <p class="mt-1 text-sm text-base-content/60">查看审批进度，也可以撤回尚未审批的申请。</p>
            </div>
            <button class="btn btn-sm" type="button" @click="loadRequests">刷新</button>
          </div>

          <div v-if="isLoading" class="py-12 text-center">
            <span class="loading loading-spinner loading-lg text-primary"></span>
          </div>

          <div
            v-else-if="requests.length === 0"
            class="mt-6 rounded-lg border border-dashed border-base-300 p-8 text-center text-sm text-base-content/70"
          >
            还没有请假申请记录。
          </div>

          <div v-else class="mt-6 space-y-4">
            <article
              v-for="request in requests"
              :key="request.id"
              class="rounded-lg border border-base-300 p-4"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="font-medium text-base-content">{{ formatLeaveType(request.leave_type) }}</p>
                  <p class="mt-1 text-sm text-base-content/60">
                    {{ formatDateRange(request.start_date, request.end_date) }} · {{ request.duration_days }} 天
                  </p>
                </div>
                <span class="badge" :class="statusClass(request.status)">
                  {{ formatStatus(request.status) }}
                </span>
              </div>

              <p class="mt-3 text-sm text-base-content/75">{{ request.reason || "无说明" }}</p>

              <div class="mt-3 flex items-center justify-between gap-3">
                <p class="text-xs text-base-content/50">
                  提交时间：{{ formatDateTime(request.created_at) }}
                </p>
                <button
                  v-if="request.status === 'pending'"
                  class="btn btn-xs btn-outline"
                  type="button"
                  @click="cancelRequest(request)"
                >
                  撤回
                </button>
              </div>

              <div
                v-if="request.review_comment"
                class="mt-3 rounded-lg bg-base-200 p-3 text-sm text-base-content/70"
              >
                审批备注：{{ request.review_comment }}
              </div>
            </article>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { getCurrentProfile } from "@/services/apiAuth.js";
import {
  createLeaveRequest,
  getLeaveRequests,
  updateLeaveRequest,
} from "@/services/database_crud/apiLeaveRequests.js";
import NavBar from "@/ui/NavBar.vue";
import { computed, onMounted, reactive, ref } from "vue";

const isLoading = ref(true);
const isSubmitting = ref(false);
const requests = ref([]);
const profile = ref(null);
const feedback = reactive({
  type: "success",
  message: "",
});

const form = reactive({
  leave_type: "annual",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date().toISOString().slice(0, 10),
  reason: "",
});

const durationDays = computed(() => {
  const start = new Date(form.start_date);
  const end = new Date(form.end_date);
  const diff = end.getTime() - start.getTime();

  if (Number.isNaN(diff) || diff < 0) {
    return 0;
  }

  return Math.floor(diff / 86400000) + 1;
});

onMounted(async () => {
  await bootPage();
});

async function bootPage() {
  isLoading.value = true;
  feedback.message = "";

  try {
    profile.value = await getCurrentProfile();
    await loadRequests();
  } catch (error) {
    feedback.type = "error";
    feedback.message =
      error instanceof Error ? error.message : "加载请假页面失败。";
  } finally {
    isLoading.value = false;
  }
}

async function loadRequests() {
  if (!profile.value?.employee_id) {
    requests.value = [];
    return;
  }

  requests.value = await getLeaveRequests({
    employeeId: profile.value.employee_id,
  });
}

async function submitRequest() {
  if (!profile.value?.employee_id) {
    feedback.type = "error";
    feedback.message = "当前账号缺少员工信息，无法提交请假。";
    return;
  }

  if (durationDays.value <= 0) {
    feedback.type = "error";
    feedback.message = "结束日期不能早于开始日期。";
    return;
  }

  isSubmitting.value = true;
  feedback.message = "";

  try {
    const created = await createLeaveRequest({
      employee_id: profile.value.employee_id,
      leave_type: form.leave_type,
      start_date: form.start_date,
      end_date: form.end_date,
      duration_days: durationDays.value,
      reason: form.reason.trim(),
      status: "pending",
    });

    requests.value = [created, ...requests.value];
    feedback.type = "success";
    feedback.message = "请假申请已提交，等待管理员审核。";
    resetForm();
  } catch (error) {
    feedback.type = "error";
    feedback.message =
      error instanceof Error ? error.message : "提交请假申请失败。";
  } finally {
    isSubmitting.value = false;
  }
}

async function cancelRequest(request) {
  try {
    const updated = await updateLeaveRequest(request.id, { status: "cancelled" });
    requests.value = requests.value.map((item) =>
      item.id === updated.id ? updated : item,
    );
  } catch (error) {
    feedback.type = "error";
    feedback.message =
      error instanceof Error ? error.message : "撤回请假申请失败。";
  }
}

function resetForm() {
  form.leave_type = "annual";
  form.start_date = new Date().toISOString().slice(0, 10);
  form.end_date = new Date().toISOString().slice(0, 10);
  form.reason = "";
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

function formatDateTime(value) {
  return new Date(value).toLocaleString();
}
</script>
