export function toISODate(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getStartOfWeek(inputDate) {
  const date = new Date(inputDate);
  const weekday = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - weekday);
  return date;
}

export function formatDate(value, locale = "zh-CN", options = {}) {
  if (!value) {
    return "未设置";
  }

  return new Date(value).toLocaleDateString(locale, options);
}

export function formatDateTime(value, locale = "zh-CN", options = {}) {
  if (!value) {
    return "未设置";
  }

  return new Date(value).toLocaleString(locale, options);
}

export function formatDateRange(startDate, endDate, locale = "zh-CN") {
  return `${formatDate(startDate, locale)} - ${formatDate(endDate, locale)}`;
}

export function normalizeTime(value) {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}
