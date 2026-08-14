from __future__ import annotations

from dataclasses import dataclass


def round_money(value: float) -> float:
    return round(value * 100) / 100


def compute_consumption(current: float, previous: float) -> float:
    return round_money(current - previous)


def compute_metered_amount(consumption: float, tariff: float) -> float:
    return round_money(consumption * tariff)


def compute_fixed_amount(tariff: float) -> float:
    return round_money(tariff)


def compute_by_area_amount(area_m2: float, tariff: float) -> float:
    return round_money(area_m2 * tariff)


def compute_two_zone_amount(
    day_consumption: float,
    day_tariff: float,
    night_consumption: float,
    night_tariff: float,
) -> float:
    return round_money(day_consumption * day_tariff + night_consumption * night_tariff)


def describe_formula(calc_type: str, parts: dict) -> str:
    tariff = parts["tariff"]
    if calc_type == "fixed":
        return f"Фиксированная сумма {tariff} ₽"
    if calc_type == "by_area":
        return f"{parts.get('area_m2', 0)} м² × {tariff} ₽"
    if calc_type == "two_zone":
        return (
            f"{parts.get('consumption', 0)} кВт⋅ч × {tariff} ₽ + "
            f"{parts.get('night_consumption', 0)} кВт⋅ч × {parts.get('night_tariff', 0)} ₽"
        )
    return f"{parts.get('consumption', 0)} {parts.get('unit', '')} × {tariff} ₽"


@dataclass
class ChargeDraft:
    service_id: str
    amount: float
    consumption: float | None
    formula_snapshot: str
