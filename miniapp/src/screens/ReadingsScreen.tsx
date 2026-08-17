import { useMemo, useState } from "react";
import {
  apartmentServices,
  lastReadingBefore,
  readingForMonth,
} from "../calc/month";
import { computeConsumption } from "../calc/calculate";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { DueDatePicker } from "../components/DueDatePicker";
import { EmptyState } from "../components/EmptyState";
import { GaugeIcon } from "../components/Icons";
import { formatMonthTitle, formatNumber } from "../lib/format";
import { useApp } from "../state/AppContext";

export function ReadingsScreen() {
  const { data, currentMonth, saveReadings, saveBaseline, push, setTab, updateApartment } =
    useApp();
  const apartment = data.apartments.find((item) => item.id === data.activeApartmentId);
  const services = apartment
    ? apartmentServices(data, apartment.id).filter((item) => item.hasMeter)
    : [];
  const meters = data.meters.filter((meter) =>
    services.some((service) => service.id === meter.serviceId),
  );

  const initialValues = useMemo(() => {
    const values: Record<string, string> = {};
    for (const meter of meters) {
      const current = readingForMonth(data, meter.id, currentMonth);
      values[meter.id] = current === null ? "" : String(current);
    }
    return values;
  }, [meters, data, currentMonth]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [baselineSaved, setBaselineSaved] = useState(false);

  if (!apartment) {
    return null;
  }

  if (meters.length === 0) {
    return (
      <div className="screen-enter">
        <h1 className="h1">Показания</h1>
        <EmptyState
          icon={<GaugeIcon />}
          title="Нет счётчиков"
          text="Добавьте услугу со счётчиком — холодную воду, электричество или газ."
          actionLabel="Добавить услугу"
          onAction={() => push({ name: "add-service" })}
        />
      </div>
    );
  }

  const needsBaseline = meters.every(
    (meter) => lastReadingBefore(data, meter.id, currentMonth) === null,
  );

  const numericValues: Record<string, number> = {};
  let canSubmit = true;
  for (const meter of meters) {
    const parsed = Number(values[meter.id]?.replace(",", "."));
    if (!Number.isFinite(parsed) || values[meter.id]?.trim() === "") {
      canSubmit = false;
    } else {
      numericValues[meter.id] = parsed;
    }
  }

  if (baselineSaved) {
    return (
      <div className="stack screen-enter">
        <h1 className="h1">База сохранена</h1>
        <Card size="hero">
          <p className="caption">{formatMonthTitle(currentMonth)}</p>
          <p className="h3" style={{ marginTop: 8 }}>
            Показания записаны как уже оплаченные
          </p>
          <p className="small" style={{ marginTop: 10 }}>
            В следующем месяце введёте новые текущие значения — приложение посчитает расход:
            новые − эти.
          </p>
        </Card>
        <Button onClick={() => setTab("home")}>На главную</Button>
        <Button variant="secondary" onClick={() => push({ name: "baseline" })}>
          Выбрать другой месяц
        </Button>
      </div>
    );
  }

  return (
    <div className="stack screen-enter">
      <div>
        <h1 className="h1">Показания</h1>
        <p className="small">{apartment.name}</p>
      </div>

      <Card size="sm">
        <DueDatePicker
          monthKey={currentMonth}
          day={apartment.readingDueDay}
          onChange={(day) => {
            void updateApartment(apartment.id, {
              name: apartment.name,
              rooms: apartment.rooms ? String(apartment.rooms) : "",
              areaM2: apartment.areaM2 ? String(apartment.areaM2) : "",
              readingDueDay: String(day),
            });
          }}
        />
      </Card>

      {needsBaseline ? (
        <Card>
          <p className="h3">Нет предыдущих показаний</p>
          <p className="small" style={{ marginTop: 6 }}>
            Если месяц уже оплачен вне приложения — сохраните конечные показания
            с квитанции как базу. В следующем месяце появится расход
            (новые − эти). Деньги через приложение не списываются.
          </p>
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary" onClick={() => push({ name: "baseline" })}>
              Выбрать месяц вручную
            </Button>
          </div>
        </Card>
      ) : null}

      {meters.map((meter) => {
        const service = services.find((item) => item.id === meter.serviceId);
        if (!service) {
          return null;
        }
        const previous = lastReadingBefore(data, meter.id, currentMonth);
        const currentValue = Number(values[meter.id]?.replace(",", "."));
        const hasCurrent = values[meter.id]?.trim() !== "" && Number.isFinite(currentValue);
        const consumption =
          previous !== null && hasCurrent
            ? computeConsumption(currentValue, previous)
            : null;

        return (
          <Card key={meter.id}>
            <p className="h3">
              {meter.zone === "single" ? service.name : `${service.name} · ${meter.name}`}
            </p>
            <p className="small" style={{ marginTop: 4 }}>
              {previous === null
                ? "Первый раз: конечное показание оплаченного месяца"
                : `Предыдущие: ${formatNumber(previous, 2)} ${service.unit}`}
            </p>
            <div className="reading-input" style={{ marginTop: 12 }}>
              <label className="field" style={{ flex: 1 }}>
                Текущие
                <input
                  inputMode="decimal"
                  value={values[meter.id] ?? ""}
                  placeholder={previous === null ? "Как на квитанции" : ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [meter.id]: event.target.value,
                    }))
                  }
                />
              </label>
              <span className="small">{service.unit}</span>
            </div>
            {consumption !== null ? (
              <p className="small" style={{ marginTop: 10 }}>
                Расход: {formatNumber(consumption, 2)} {service.unit}
                {consumption < 0
                  ? " — значение меньше предыдущего. Проверьте или отметьте замену счётчика позже."
                  : ""}
              </p>
            ) : null}
          </Card>
        );
      })}

      <Button
        disabled={!canSubmit}
        onClick={async () => {
          if (needsBaseline) {
            await saveBaseline(numericValues, currentMonth, true);
            setBaselineSaved(true);
            return;
          }
          await saveReadings(numericValues, currentMonth);
          push({ name: "calculation" });
        }}
      >
        {needsBaseline ? "Сохранить как уже оплаченную базу" : "Перейти к расчёту"}
      </Button>
    </div>
  );
}
