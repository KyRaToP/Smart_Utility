import {
  computeByAreaAmount,
  computeConsumption,
  computeFixedAmount,
  computeMeteredAmount,
  computeTwoZoneAmount,
  describeFormula,
  roundMoney,
} from "../calc/calculate";
import { createId, previousMonthKey } from "../lib/format";
import type { AppData, Charge, Service } from "../types";

export interface ServiceChargeDraft {
  service: Service;
  amount: number;
  consumption: number | null;
  formulaSnapshot: string;
}

export function lastReadingBefore(
  data: AppData,
  meterId: string,
  month: string,
): number | null {
  const previous = data.readings
    .filter((item) => item.meterId === meterId && item.month < month)
    .sort((left, right) => right.month.localeCompare(left.month))[0];
  return previous ? previous.value : null;
}

export function readingForMonth(
  data: AppData,
  meterId: string,
  month: string,
): number | null {
  const found = data.readings.find(
    (item) => item.meterId === meterId && item.month === month,
  );
  return found ? found.value : null;
}

export function monthTotal(data: AppData, apartmentId: string, month: string): number {
  const saved = data.charges.filter(
    (item) => item.apartmentId === apartmentId && item.month === month,
  );
  if (saved.length === 0) {
    return 0;
  }
  return roundMoney(saved.reduce((sum, item) => sum + item.amount, 0));
}

export function apartmentServices(data: AppData, apartmentId: string): Service[] {
  return data.services.filter(
    (item) => item.apartmentId === apartmentId && item.isActive,
  );
}

export function buildMonthCharges(
  data: AppData,
  apartmentId: string,
  month: string,
  currentReadings: Record<string, number>,
): ServiceChargeDraft[] {
  const apartment = data.apartments.find((item) => item.id === apartmentId);
  const drafts: ServiceChargeDraft[] = [];

  for (const service of apartmentServices(data, apartmentId)) {
    if (service.calcType === "fixed") {
      drafts.push({
        service,
        amount: computeFixedAmount(service.tariff),
        consumption: null,
        formulaSnapshot: describeFormula("fixed", {
          tariff: service.tariff,
          unit: service.unit,
        }),
      });
      continue;
    }

    if (service.calcType === "by_area") {
      const area = apartment?.areaM2 ?? 0;
      drafts.push({
        service,
        amount: computeByAreaAmount(area, service.tariff),
        consumption: area,
        formulaSnapshot: describeFormula("by_area", {
          tariff: service.tariff,
          unit: service.unit,
          areaM2: area,
        }),
      });
      continue;
    }

    const meters = data.meters.filter((item) => item.serviceId === service.id);
    if (service.calcType === "two_zone") {
      const dayMeter = meters.find((item) => item.zone === "day");
      const nightMeter = meters.find((item) => item.zone === "night");
      if (!dayMeter || !nightMeter) {
        continue;
      }
      const dayPrevious = lastReadingBefore(data, dayMeter.id, month);
      const nightPrevious = lastReadingBefore(data, nightMeter.id, month);
      const dayCurrent = currentReadings[dayMeter.id];
      const nightCurrent = currentReadings[nightMeter.id];
      if (
        dayPrevious === null ||
        nightPrevious === null ||
        dayCurrent === undefined ||
        nightCurrent === undefined
      ) {
        continue;
      }
      const dayUse = computeConsumption(dayCurrent, dayPrevious);
      const nightUse = computeConsumption(nightCurrent, nightPrevious);
      drafts.push({
        service,
        amount: computeTwoZoneAmount(
          dayUse,
          service.tariff,
          nightUse,
          service.nightTariff ?? 0,
        ),
        consumption: roundMoney(dayUse + nightUse),
        formulaSnapshot: describeFormula("two_zone", {
          consumption: dayUse,
          nightConsumption: nightUse,
          tariff: service.tariff,
          nightTariff: service.nightTariff,
          unit: service.unit,
        }),
      });
      continue;
    }

    const meter = meters[0];
    if (!meter) {
      continue;
    }
    const previous = lastReadingBefore(data, meter.id, month);
    const current = currentReadings[meter.id];
    if (previous === null || current === undefined) {
      continue;
    }
    const consumption = computeConsumption(current, previous);
    drafts.push({
      service,
      amount: computeMeteredAmount(consumption, service.tariff),
      consumption,
      formulaSnapshot: describeFormula("metered", {
        consumption,
        tariff: service.tariff,
        unit: service.unit,
      }),
    });
  }

  return drafts;
}

export function draftsToCharges(
  apartmentId: string,
  month: string,
  drafts: ServiceChargeDraft[],
): Charge[] {
  return drafts.map((draft) => ({
    id: createId("charge"),
    apartmentId,
    month,
    serviceId: draft.service.id,
    amount: draft.amount,
    consumption: draft.consumption,
    formulaSnapshot: draft.formulaSnapshot,
  }));
}

export function categoryTotals(
  data: AppData,
  apartmentId: string,
  month: string,
): Array<{ category: string; amount: number }> {
  const map = new Map<string, number>();
  for (const chargeItem of data.charges.filter(
    (item) => item.apartmentId === apartmentId && item.month === month,
  )) {
    const service = data.services.find((item) => item.id === chargeItem.serviceId);
    const category = service?.category ?? "Другое";
    map.set(category, roundMoney((map.get(category) ?? 0) + chargeItem.amount));
  }
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((left, right) => right.amount - left.amount);
}

export function groupedHomeCards(
  data: AppData,
  apartmentId: string,
  month: string,
): Array<{ category: string; amount: number }> {
  const groups = categoryTotals(data, apartmentId, month);
  return groups.slice(0, 4);
}

export function monthList(fromMonth: string, count: number): string[] {
  const months: string[] = [];
  let cursor = fromMonth;
  for (let index = 0; index < count; index += 1) {
    months.unshift(cursor);
    cursor = previousMonthKey(cursor);
  }
  return months;
}

export function paymentFor(data: AppData, apartmentId: string, month: string) {
  return data.payments.find(
    (item) => item.apartmentId === apartmentId && item.month === month,
  );
}

export type SmartStatusKind = "ok" | "readings" | "unpaid" | "empty";

export function smartStatus(
  data: AppData,
  apartmentId: string,
  month: string,
): { kind: SmartStatusKind; label: string } {
  const services = apartmentServices(data, apartmentId);
  if (services.length === 0) {
    return { kind: "empty", label: "Добавьте первую услугу" };
  }

  const meters = data.meters.filter((meter) =>
    services.some((service) => service.id === meter.serviceId && service.hasMeter),
  );
  const missingReading = meters.some(
    (meter) => readingForMonth(data, meter.id, month) === null,
  );
  if (missingReading) {
    return { kind: "readings", label: "Нужно передать показания" };
  }

  const payment = paymentFor(data, apartmentId, month);
  const total = monthTotal(data, apartmentId, month);
  if (payment?.status === "overdue" || (total > 0 && payment?.status === "pending")) {
    return { kind: "unpaid", label: "Есть неоплаченный счёт" };
  }

  return { kind: "ok", label: "Всё под контролем" };
}

export function insightText(
  data: AppData,
  apartmentId: string,
  month: string,
): string | null {
  const current = monthTotal(data, apartmentId, month);
  if (current <= 0) {
    return null;
  }
  const history = data.payments
    .filter((item) => item.apartmentId === apartmentId && item.month < month)
    .map((item) => item.amount);
  if (history.length === 0) {
    return "Это первый сохранённый месяц. Следующие платежи можно будет сравнить.";
  }
  const average = history.reduce((sum, item) => sum + item, 0) / history.length;
  const delta = Math.round(current - average);
  if (Math.abs(delta) < 20) {
    return "В этом месяце расход почти как обычно.";
  }
  if (delta > 0) {
    return `В этом месяце вы потратили на ${Math.abs(delta)} ₽ больше, чем обычно.`;
  }
  return `В этом месяце расход ниже обычного на ${Math.abs(delta)} ₽.`;
}
