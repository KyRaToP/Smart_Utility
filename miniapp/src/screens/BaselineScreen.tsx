import { useMemo, useState } from "react";
import { apartmentServices, readingForMonth } from "../calc/month";
import { BackRow } from "../components/BackRow";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { GaugeIcon } from "../components/Icons";
import {
  currentMonthKey,
  formatMonthTitle,
  previousMonthKey,
} from "../lib/format";
import { useApp } from "../state/AppContext";

function monthOptions(from = currentMonthKey()): string[] {
  const months = [from];
  let cursor = from;
  for (let i = 0; i < 3; i += 1) {
    cursor = previousMonthKey(cursor);
    months.push(cursor);
  }
  return months;
}

export function BaselineScreen() {
  const { data, currentMonth, back, saveBaseline, setTab, push } = useApp();
  const apartment = data.apartments.find((item) => item.id === data.activeApartmentId);
  const services = apartment
    ? apartmentServices(data, apartment.id).filter((item) => item.hasMeter)
    : [];
  const meters = data.meters.filter((meter) =>
    services.some((service) => service.id === meter.serviceId),
  );

  const options = useMemo(() => monthOptions(currentMonth), [currentMonth]);
  const [month, setMonth] = useState(currentMonth);
  const [markPaid, setMarkPaid] = useState(true);
  const [done, setDone] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const meter of meters) {
      const current = readingForMonth(data, meter.id, currentMonth);
      initial[meter.id] = current === null ? "" : String(current);
    }
    return initial;
  });

  if (!apartment) {
    return null;
  }

  if (meters.length === 0) {
    return (
      <div className="app-content screen-enter stack">
        <BackRow title="Уже оплачено" onBack={back} />
        <EmptyState
          icon={<GaugeIcon />}
          title="Нет счётчиков"
          text="Сначала добавьте услугу со счётчиком — потом можно внести показания оплаченного месяца."
          actionLabel="Добавить услугу"
          onAction={() => push({ name: "add-service" })}
        />
      </div>
    );
  }

  const numericValues: Record<string, number> = {};
  let canSave = true;
  for (const meter of meters) {
    const parsed = Number(values[meter.id]?.replace(",", "."));
    if (!Number.isFinite(parsed) || values[meter.id]?.trim() === "") {
      canSave = false;
    } else {
      numericValues[meter.id] = parsed;
    }
  }

  if (done) {
    const nextHint = formatMonthTitle(
      month === currentMonth
        ? // next calendar month after baseline
          (() => {
            const [y, m] = month.split("-").map(Number);
            return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
          })()
        : currentMonth,
    );
    return (
      <div className="app-content screen-enter stack">
        <BackRow title="Готово" onBack={() => setTab("home")} />
        <Card size="hero">
          <p className="caption">База сохранена</p>
          <p className="h2" style={{ marginTop: 8 }}>
            {formatMonthTitle(month)}
          </p>
          <p className="small" style={{ marginTop: 10 }}>
            Показания за этот месяц — точка отсчёта. В {nextHint.toLowerCase()} введёте новые
            текущие значения, и приложение посчитает расход: новые − эти.
          </p>
          {markPaid ? (
            <p className="small" style={{ marginTop: 8 }}>
              Месяц отмечен как уже оплаченный.
            </p>
          ) : null}
        </Card>
        <Button onClick={() => setTab("home")}>На главную</Button>
        <Button variant="secondary" onClick={() => setTab("readings")}>
          К показаниям следующего месяца
        </Button>
      </div>
    );
  }

  return (
    <div className="app-content screen-enter stack">
      <BackRow title="Уже оплачено" onBack={back} />

      <Card>
        <p className="h3">Зачем это</p>
        <p className="small" style={{ marginTop: 8 }}>
          Вы уже передали и оплатили коммуналку за месяц вне приложения. Внесите конечные
          показания того месяца — они станут «предыдущими» для следующего расчёта.
        </p>
      </Card>

      <label className="field">
        Месяц (уже оплачен)
        <select
          value={month}
          onChange={(event) => {
            const next = event.target.value;
            setMonth(next);
            setValues((current) => {
              const updated = { ...current };
              for (const meter of meters) {
                const existing = readingForMonth(data, meter.id, next);
                updated[meter.id] = existing === null ? updated[meter.id] ?? "" : String(existing);
              }
              return updated;
            });
          }}
        >
          {options.map((key) => (
            <option key={key} value={key}>
              {formatMonthTitle(key)}
            </option>
          ))}
        </select>
      </label>

      {meters.map((meter) => {
        const service = services.find((item) => item.id === meter.serviceId);
        if (!service) {
          return null;
        }
        return (
          <Card key={meter.id}>
            <p className="h3">
              {meter.zone === "single"
                ? service.name
                : `${service.name} · ${meter.name}`}
            </p>
            <p className="small" style={{ marginTop: 4 }}>
              Конечное показание за {formatMonthTitle(month).toLowerCase()}
            </p>
            <div className="reading-input" style={{ marginTop: 12 }}>
              <label className="field" style={{ flex: 1 }}>
                Значение
                <input
                  inputMode="decimal"
                  value={values[meter.id] ?? ""}
                  placeholder="Как на квитанции"
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
          </Card>
        );
      })}

      <Card>
        <div className="row">
          <div>
            <p>Отметить месяц оплаченным</p>
            <p className="small">Без повторного расчёта в приложении</p>
          </div>
          <button
            type="button"
            className={`toggle${markPaid ? " is-on" : ""}`}
            aria-pressed={markPaid}
            onClick={() => setMarkPaid((value) => !value)}
          />
        </div>
      </Card>

      <Button
        disabled={!canSave}
        onClick={async () => {
          await saveBaseline(numericValues, month, markPaid);
          setDone(true);
        }}
      >
        Сохранить базу за {formatMonthTitle(month).split(" ")[0].toLowerCase()}
      </Button>
    </div>
  );
}
