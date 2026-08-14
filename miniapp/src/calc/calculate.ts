import type { CalcType } from "../types";

export function computeConsumption(current: number, previous: number): number {
  return roundMoney(current - previous);
}

export function computeMeteredAmount(consumption: number, tariff: number): number {
  return roundMoney(consumption * tariff);
}

export function computeFixedAmount(tariff: number): number {
  return roundMoney(tariff);
}

export function computeByAreaAmount(areaM2: number, tariff: number): number {
  return roundMoney(areaM2 * tariff);
}

export function computeTwoZoneAmount(
  dayConsumption: number,
  dayTariff: number,
  nightConsumption: number,
  nightTariff: number,
): number {
  return roundMoney(dayConsumption * dayTariff + nightConsumption * nightTariff);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function describeFormula(
  calcType: CalcType,
  parts: {
    consumption?: number;
    tariff: number;
    nightConsumption?: number;
    nightTariff?: number;
    areaM2?: number;
    unit: string;
  },
): string {
  if (calcType === "fixed") {
    return `Фиксированная сумма ${parts.tariff} ₽`;
  }
  if (calcType === "by_area") {
    return `${parts.areaM2 ?? 0} м² × ${parts.tariff} ₽`;
  }
  if (calcType === "two_zone") {
    return `${parts.consumption ?? 0} кВт⋅ч × ${parts.tariff} ₽ + ${parts.nightConsumption ?? 0} кВт⋅ч × ${parts.nightTariff ?? 0} ₽`;
  }
  return `${parts.consumption ?? 0} ${parts.unit} × ${parts.tariff} ₽`;
}
