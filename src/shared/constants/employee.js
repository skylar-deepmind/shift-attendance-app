export const EMPLOYMENT_TYPE_LABELS = {
  full_time: "全职",
  part_time: "兼职",
  contract: "合同工",
};

export const EMPLOYEE_STATUS_LABELS = {
  active: "在职",
  inactive: "停用",
  resigned: "离职",
};

export const EMPLOYEE_STATUS_BADGE_CLASSES = {
  active: "badge-success",
  inactive: "badge-warning",
  resigned: "badge-neutral",
};

export function formatEmploymentType(value) {
  return EMPLOYMENT_TYPE_LABELS[value] || value || "未设置";
}

export function formatEmployeeStatus(value) {
  return EMPLOYEE_STATUS_LABELS[value] || value || "未设置";
}
