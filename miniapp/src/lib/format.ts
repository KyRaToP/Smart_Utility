const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

export function currentMonthKey(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function previousMonthKey(monthKey: string): string {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, "0")}`;
}

export function formatMonthTitle(monthKey: string): string {
  const [yearText, monthText] = monthKey.split("-");
  const monthIndex = Number(monthText) - 1;
  return `${MONTHS[monthIndex]} ${yearText}`;
}

export function formatMonthShort(monthKey: string): string {
  const monthIndex = Number(monthKey.split("-")[1]) - 1;
  return MONTHS[monthIndex].slice(0, 3);
}

export function formatRub(amount: number): string {
  const hasCents = Math.abs(amount % 1) >= 0.005;
  const formatted = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ₽`;
}

export function formatNumber(value: number, digits = 1): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

export function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function clampDay(year: number, month: number, day: number): number {
  const last = lastDayOfMonth(year, month);
  return Math.max(1, Math.min(day, last));
}

export function formatDueDate(day: number, monthKey: string): string {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const safeDay = clampDay(year, month, day);
  return `${safeDay} ${MONTHS_GENITIVE[month - 1]}`;
}

export function dueDateIso(monthKey: string, day: number): string {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const safeDay = clampDay(year, month, day);
  return `${yearText}-${monthText}-${String(safeDay).padStart(2, "0")}`;
}

export function dayFromIsoDate(iso: string): number | null {
  const day = Number(iso.split("-")[2]);
  if (!Number.isFinite(day) || day < 1 || day > 31) {
    return null;
  }
  return day;
}

export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) {
    return null;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
