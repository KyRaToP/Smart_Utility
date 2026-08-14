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

export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) {
    return null;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
