import { previousMonthKey } from "../lib/format";
import type { AppData, Charge, Payment } from "../types";
import { defaultNotifications } from "../types";

const MONTHS = [
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
  "2026-08",
];

export function createEmptyData(): AppData {
  return {
    onboarded: false,
    displayName: "",
    apartments: [],
    activeApartmentId: null,
    services: [],
    meters: [],
    readings: [],
    charges: [],
    payments: [],
    notifications: defaultNotifications(),
  };
}

export function createMockData(): AppData {
  const charges: Charge[] = [
    charge("c1", "apt-1", "2026-08", "svc-cold", 153.68, 3.4, "3.4 м³ × 45.20 ₽"),
    charge("c2", "apt-1", "2026-08", "svc-hot", 1087, 4, "4 м³ × 271.75 ₽"),
    charge("c3", "apt-1", "2026-08", "svc-power", 2180, 302.36, "302.36 кВт⋅ч × 7.21 ₽"),
    charge("c4", "apt-1", "2026-08", "svc-gas", 740, 10, "10 м³ × 74 ₽"),
    charge("c5", "apt-1", "2026-08", "svc-heat", 1850, null, "Фиксированная сумма 1850 ₽"),
    charge("c6", "apt-1", "2026-08", "svc-maint", 2732, null, "Фиксированная сумма 2732 ₽"),
  ];

  const historyTotals = [7420, 7680, 7810, 7950, 8210, 8742.68];
  const extraCharges: Charge[] = [];
  const payments: Payment[] = [];

  MONTHS.forEach((month, index) => {
    const total = historyTotals[index];
    extraCharges.push(
      charge(`h-${month}`, "apt-1", month, "svc-maint", total, null, "Сводка месяца"),
    );
    const isCurrent = month === "2026-08";
    payments.push({
      id: `pay-1-${month}`,
      apartmentId: "apt-1",
      month,
      amount: total,
      paidAt: isCurrent ? null : `${month}-15`,
      status: isCurrent ? "pending" : "paid",
    });
  });

  payments.push(
    {
      id: "pay-2-08",
      apartmentId: "apt-2",
      month: "2026-08",
      amount: 6120,
      paidAt: null,
      status: "overdue",
    },
    {
      id: "pay-3-08",
      apartmentId: "apt-3",
      month: "2026-08",
      amount: 4280,
      paidAt: "2026-08-10",
      status: "paid",
    },
  );

  charges.push(
    charge("c7", "apt-2", "2026-08", "svc-2-power", 1840, 280, "день/ночь × тариф"),
    charge("c8", "apt-2", "2026-08", "svc-2-water", 1180, 26.1, "26.1 м³ × 45.20 ₽"),
    charge("c9", "apt-2", "2026-08", "svc-2-maint", 3100, null, "Фиксированная сумма 3100 ₽"),
    charge("c10", "apt-3", "2026-08", "svc-3-power", 3630, 503.5, "503.5 кВт⋅ч × 7.21 ₽"),
    charge("c11", "apt-3", "2026-08", "svc-3-net", 650, null, "Фиксированная сумма 650 ₽"),
  );

  return {
    onboarded: true,
    displayName: "Анна",
    apartments: [
      { id: "apt-1", name: "Демо · Центр", rooms: 2, areaM2: 54, readingDueDay: 25 },
      { id: "apt-2", name: "Демо · Семья", rooms: 3, areaM2: 72, readingDueDay: 25 },
      { id: "apt-3", name: "Демо · Студия", rooms: 1, areaM2: 28, readingDueDay: 20 },
    ],
    activeApartmentId: "apt-1",
    services: [
      service("svc-cold", "apt-1", "Холодная вода", "Вода", "metered", "м³", 45.2, true),
      service("svc-hot", "apt-1", "Горячая вода", "Вода", "metered", "м³", 271.75, true),
      service("svc-power", "apt-1", "Электричество", "Электроэнергия", "metered", "кВт⋅ч", 7.21, true),
      service("svc-gas", "apt-1", "Газ", "Газ", "metered", "м³", 74, true),
      service("svc-heat", "apt-1", "Отопление", "Отопление", "fixed", "₽", 1850, false),
      service("svc-maint", "apt-1", "Содержание", "Содержание", "fixed", "₽", 2732, false),
      service("svc-2-power", "apt-2", "Электричество", "Электроэнергия", "two_zone", "кВт⋅ч", 6.8, true, 3.2),
      service("svc-2-water", "apt-2", "Холодная вода", "Вода", "metered", "м³", 45.2, true),
      service("svc-2-maint", "apt-2", "Содержание", "Содержание", "fixed", "₽", 3100, false),
      service("svc-3-power", "apt-3", "Электричество", "Электроэнергия", "metered", "кВт⋅ч", 7.21, true),
      service("svc-3-net", "apt-3", "Интернет", "Интернет", "fixed", "₽", 650, false),
    ],
    meters: [
      meter("m-cold", "svc-cold", "ХВС"),
      meter("m-hot", "svc-hot", "ГВС"),
      meter("m-power", "svc-power", "Электроэнергия"),
      meter("m-gas", "svc-gas", "Газ"),
      meter("m-2-day", "svc-2-power", "День", "day"),
      meter("m-2-night", "svc-2-power", "Ночь", "night"),
      meter("m-2-water", "svc-2-water", "ХВС"),
      meter("m-3-power", "svc-3-power", "Электроэнергия"),
    ],
    readings: [
      reading("r-cold-prev", "m-cold", previousMonthKey("2026-08"), 124.8),
      reading("r-hot-prev", "m-hot", previousMonthKey("2026-08"), 86.1),
      reading("r-power-prev", "m-power", previousMonthKey("2026-08"), 3842),
      reading("r-gas-prev", "m-gas", previousMonthKey("2026-08"), 410),
      reading("r-2-day-prev", "m-2-day", previousMonthKey("2026-08"), 1200),
      reading("r-2-night-prev", "m-2-night", previousMonthKey("2026-08"), 840),
      reading("r-2-water-prev", "m-2-water", previousMonthKey("2026-08"), 55.2),
      reading("r-3-power-init", "m-3-power", previousMonthKey("2026-08"), 210, true),
      reading("r-cold-now", "m-cold", "2026-08", 128.2),
      reading("r-hot-now", "m-hot", "2026-08", 90.1),
      reading("r-power-now", "m-power", "2026-08", 4144.36),
      reading("r-gas-now", "m-gas", "2026-08", 420),
    ],
    charges: [...charges, ...extraCharges.filter((item) => item.month !== "2026-08")],
    payments,
    notifications: defaultNotifications(),
  };
}

function service(
  id: string,
  apartmentId: string,
  name: string,
  category: string,
  calcType: AppData["services"][number]["calcType"],
  unit: string,
  tariff: number,
  hasMeter: boolean,
  nightTariff?: number,
): AppData["services"][number] {
  return {
    id,
    apartmentId,
    name,
    category,
    calcType,
    unit,
    tariff,
    nightTariff,
    hasMeter,
    isActive: true,
  };
}

function meter(
  id: string,
  serviceId: string,
  name: string,
  zone: "single" | "day" | "night" = "single",
): AppData["meters"][number] {
  return { id, serviceId, name, zone };
}

function reading(
  id: string,
  meterId: string,
  month: string,
  value: number,
  isInitial = false,
): AppData["readings"][number] {
  return { id, meterId, month, value, isInitial };
}

function charge(
  id: string,
  apartmentId: string,
  month: string,
  serviceId: string,
  amount: number,
  consumption: number | null,
  formulaSnapshot: string,
): Charge {
  return { id, apartmentId, month, serviceId, amount, consumption, formulaSnapshot };
}
