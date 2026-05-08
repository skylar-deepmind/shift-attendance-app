import { getCurrentProfile } from "@/services/apiAuth.js";
import {
  createLeaveRequest,
  getLeaveRequests,
  updateLeaveRequest,
} from "@/services/database_crud/apiLeaveRequests.js";
import { computed, onMounted, reactive, ref } from "vue";
import { createDefaultLeaveForm } from "./leaveForm.js";

export function useLeaveRequestPage() {
  const isLoading = ref(true);
  const isSubmitting = ref(false);
  const requests = ref([]);
  const profile = ref(null);
  const feedback = reactive({
    type: "success",
    message: "",
  });

  const form = reactive(createDefaultLeaveForm());

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
      const updated = await updateLeaveRequest(request.id, {
        status: "cancelled",
      });
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
    const nextForm = createDefaultLeaveForm();
    form.leave_type = nextForm.leave_type;
    form.start_date = nextForm.start_date;
    form.end_date = nextForm.end_date;
    form.reason = nextForm.reason;
  }

  return {
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
  };
}
