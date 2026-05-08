export const LEAVE_TYPE_LABELS = {
  annual: "年假",
  sick: "病假",
  personal: "事假",
  unpaid: "无薪假",
  other: "其他",
};

export const LEAVE_STATUS_LABELS = {
  pending: "待审批",
  approved: "已通过",
  rejected: "已驳回",
  cancelled: "已撤回",
};

export const LEAVE_STATUS_BADGE_CLASSES = {
  pending: "badge-warning",
  approved: "badge-success",
  rejected: "badge-error",
  cancelled: "badge-neutral",
};

export function formatLeaveType(value) {
  return LEAVE_TYPE_LABELS[value] || LEAVE_TYPE_LABELS.other;
}

export function formatLeaveStatus(value) {
  return LEAVE_STATUS_LABELS[value] || LEAVE_STATUS_LABELS.pending;
}

export function getLeaveStatusBadgeClass(value) {
  return LEAVE_STATUS_BADGE_CLASSES[value] || LEAVE_STATUS_BADGE_CLASSES.pending;
}
