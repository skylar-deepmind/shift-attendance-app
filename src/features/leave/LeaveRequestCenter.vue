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
import { useLeaveRequestPage } from "@/features/leave/useLeaveRequestPage.js";
import {
  formatLeaveStatus,
  formatLeaveType,
  getLeaveStatusBadgeClass,
} from "@/shared/constants/leave.js";
import { formatDateRange, formatDateTime } from "@/shared/utils/date.js";
import NavBar from "@/ui/NavBar.vue";
const {
  cancelRequest,
  durationDays,
  feedback,
  form,
  isLoading,
  isSubmitting,
  loadRequests,
  requests,
  resetForm,
  submitRequest,
} = useLeaveRequestPage();

const formatStatus = formatLeaveStatus;
const statusClass = getLeaveStatusBadgeClass;
</script>
