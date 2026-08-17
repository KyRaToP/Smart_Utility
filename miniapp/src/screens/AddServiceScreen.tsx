import { useMemo, useState } from "react";
import { BackRow } from "../components/BackRow";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Field } from "../components/Field";
import { useApp } from "../state/AppContext";
import type { CalcType, Service } from "../types";

const TYPES: Array<{ id: CalcType; label: string }> = [
  { id: "metered", label: "По счётчику" },
  { id: "two_zone", label: "День / ночь" },
  { id: "fixed", label: "Фиксированная сумма" },
  { id: "by_area", label: "По площади" },
];

const CATEGORIES = [
  "Вода",
  "Электроэнергия",
  "Газ",
  "Отопление",
  "Содержание",
  "Капремонт",
  "Мусор",
  "Интернет",
  "Другое",
] as const;

type Category = (typeof CATEGORIES)[number];

const UNITS_BY_CATEGORY: Record<Category, string[]> = {
  Вода: ["м³"],
  Электроэнергия: ["кВт⋅ч"],
  Газ: ["м³"],
  Отопление: ["Гкал", "м²", "₽"],
  Содержание: ["₽", "м²"],
  Капремонт: ["₽"],
  Мусор: ["₽", "м³"],
  Интернет: ["₽"],
  Другое: ["м³", "кВт⋅ч", "м²", "₽", "Гкал"],
};

function unitsFor(category: Category, calcType: CalcType): string[] {
  if (calcType === "fixed") {
    return ["₽"];
  }
  if (calcType === "by_area") {
    return ["м²"];
  }
  if (calcType === "two_zone") {
    return ["кВт⋅ч"];
  }
  return UNITS_BY_CATEGORY[category];
}

function defaultUnit(category: Category, calcType: CalcType): string {
  return unitsFor(category, calcType)[0];
}

function asCategory(value: string): Category {
  return (CATEGORIES as readonly string[]).includes(value)
    ? (value as Category)
    : "Другое";
}

function fieldsFromService(service: Service | undefined) {
  const category = asCategory(service?.category ?? "Вода");
  const calcType = service?.calcType ?? "metered";
  return {
    name: service?.name ?? "",
    category,
    calcType,
    unit: service?.unit ?? defaultUnit(category, calcType),
    tariff: service ? String(service.tariff) : "",
    hasMeter: service?.hasMeter ?? true,
  };
}

export function AddServiceScreen() {
  const { addService, updateService, back, data, stack } = useApp();
  const route = stack[stack.length - 1];
  const editingId = route?.serviceId;
  const existing = data.services.find((item) => item.id === editingId);
  const initial = fieldsFromService(existing);

  const [name, setName] = useState(initial.name);
  const [category, setCategory] = useState<Category>(initial.category);
  const [calcType, setCalcType] = useState<CalcType>(initial.calcType);
  const [unit, setUnit] = useState(initial.unit);
  const [tariff, setTariff] = useState(initial.tariff);
  const [hasMeter, setHasMeter] = useState(initial.hasMeter);

  const unitOptions = useMemo(() => unitsFor(category, calcType), [category, calcType]);
  const canSave = name.trim().length > 0 && Number(tariff.replace(",", ".")) >= 0 && tariff !== "";

  const applyCalcType = (next: CalcType) => {
    setCalcType(next);
    const meterOn = next === "metered" || next === "two_zone";
    setHasMeter(meterOn);
    const nextCategory = next === "two_zone" ? "Электроэнергия" : category;
    if (next === "two_zone") {
      setCategory("Электроэнергия");
    }
    setUnit(defaultUnit(nextCategory, next));
  };

  const applyCategory = (next: Category) => {
    setCategory(next);
    setUnit(defaultUnit(next, calcType));
  };

  const applyMeterToggle = () => {
    if (hasMeter) {
      applyCalcType("fixed");
      return;
    }
    applyCalcType("metered");
  };

  return (
    <div className="app-content screen-enter stack">
      <BackRow title={existing ? "Изменить услугу" : "Новая услуга"} onBack={back} />
      <p className="small">
        {existing
          ? "Изменения применятся только к этой квартире. Тариф берите из квитанции."
          : "Услуга сохранится только в активной квартире. Тариф вводите свой, из квитанции."}
      </p>

      <Card>
        <div className="stack">
          <Field label="Название" value={name} placeholder="Холодная вода" onChange={setName} />

          <label className="field">
            Категория
            <select
              value={category}
              onChange={(event) => applyCategory(event.target.value as Category)}
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <span className="hint">Нужна для статистики на экране «Статистика»</span>
          </label>

          <label className="field">
            Тип расчёта
            <select
              value={calcType}
              onChange={(event) => applyCalcType(event.target.value as CalcType)}
            >
              {TYPES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            Единица
            <select
              value={unitOptions.includes(unit) ? unit : unitOptions[0]}
              onChange={(event) => setUnit(event.target.value)}
            >
              {unitOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <span className="hint">
              Список зависит от категории и типа расчёта
            </span>
          </label>

          <Field
            label="Тариф, ₽"
            value={tariff}
            inputMode="decimal"
            hint="Сумма за единицу или фиксированный платёж в месяц"
            onChange={setTariff}
          />

          <div className="row">
            <span>Использовать счётчик</span>
            <button
              type="button"
              className={`toggle${hasMeter ? " is-on" : ""}`}
              onClick={applyMeterToggle}
              aria-pressed={hasMeter}
            />
          </div>
        </div>
      </Card>

      <Button
        disabled={!canSave}
        onClick={async () => {
          const payload = {
            name,
            category,
            unit: unitOptions.includes(unit) ? unit : unitOptions[0],
            tariff: tariff.replace(",", "."),
            hasMeter,
            calcType,
          };
          if (existing) {
            await updateService(existing.id, payload);
          } else {
            await addService(payload);
          }
          back();
        }}
      >
        Сохранить
      </Button>
    </div>
  );
}
