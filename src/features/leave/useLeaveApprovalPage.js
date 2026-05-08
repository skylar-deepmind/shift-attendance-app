import { getCurrentProfile } from "@/services/apiAuth.js";
import {
  getLeaveRequests,
  updateLeaveRequest,
} from "@/services/database_crud/apiLeaveRequests.js";
import { onMounted, ref, watch } from "vue";

export function useLeaveApprovalPage() {
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
        reviewed_by: currentProfile.value?.id || null,
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

  return {
    errorMessage,
    isLoading,
    loadRequests,
    requests,
    reviewComments,
    reviewRequest,
    selectedStatus,
    submittingId,
  };
}
