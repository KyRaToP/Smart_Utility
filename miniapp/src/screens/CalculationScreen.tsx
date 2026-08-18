import { useState } from "react";
import { buildMonthCharges, monthChargeBlockers } from "../calc/month";
import { BackRow } from "../components/BackRow";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { formatMonthTitle, formatRub } from "../lib/format";
import { useApp } from "../state/AppContext";

export function CalculationScreen() {
  const { data, currentMonth, back, saveCalculation, setTab } = useApp();
  const apartment = data.apartments.find((item) => item.id === data.activeApartmentId);
  const [openId, setOpenId] = useState<string | null>(null);

  if (!apartment) {
    return null;
  }

  const currentReadings: Record<string, number> = {};
  for (const reading of data.readings.filter((item) => item.month === currentMonth)) {
    currentReadings[reading.meterId] = reading.value;
  }

  const drafts = buildMonthCharges(data, apartment.id, currentMonth, currentReadings);
  const blockers = monthChargeBlockers(
    data,
    apartment.id,
    currentMonth,
    currentReadings,
  );
  const cannotSave =
    drafts.length === 0 ||
    blockers.incomplete.length > 0 ||
    blockers.negative.length > 0;
  const total = drafts.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="app-content screen-enter stack">
      <BackRow title="Расчёт" onBack={back} />
      <p className="small">
        {apartment.name} · {formatMonthTitle(currentMonth)}
      </p>

      {blockers.incomplete.length > 0 ? (
        <Card>
          <p className="h3">Нельзя сохранить неполный расчёт</p>
          <p className="small" style={{ marginTop: 6 }}>
            Нет предыдущих показаний для: {blockers.incomplete.join(", ")}.
            Сохраните базу (уже оплаченный месяц) или введите прошлые показания.
          </p>
        </Card>
      ) : null}
      {blockers.negative.length > 0 ? (
        <Card>
          <p className="h3">Показания меньше предыдущих</p>
          <p className="small" style={{ marginTop: 6 }}>
            {blockers.negative.join(", ")}. Если счётчик заменили — сначала
            сохраните базу.
          </p>
        </Card>
      ) : null}

      {drafts.length === 0 ? (
        <Card>
          <p className="h3">Пока нечего считать</p>
          <p className="small" style={{ marginTop: 6 }}>
            {Object.keys(currentReadings).length > 0
              ? "Сейчас сохранены только начальные показания (база). Расход появится в следующем месяце, когда введёте новые текущие значения."
              : "Сначала передайте показания по счётчикам или добавьте услуги с фиксированной суммой."}
          </p>
          {Object.keys(currentReadings).length > 0 ? (
            <div style={{ marginTop: 12 }}>
              <Button variant="secondary" onClick={() => setTab("home")}>
                На главную
              </Button>
            </div>
          ) : null}
        </Card>
      ) : (
        drafts.map((draft) => (
          <Card key={draft.service.id}>
            <button
              type="button"
              className="settings-item"
              onClick={() =>
                setOpenId((current) =>
                  current === draft.service.id ? null : draft.service.id,
                )
              }
            >
              <div className="settings-item__text">
                <p className="h3">{draft.service.name}</p>
                <p className="small">{draft.formulaSnapshot}</p>
              </div>
              <strong>{formatRub(draft.amount)}</strong>
            </button>
            {openId === draft.service.id ? (
              <p className="small" style={{ marginTop: 8 }}>
                Формула сохраняется вместе с месяцем. Если тариф позже изменится, история не
                пересчитается.
              </p>
            ) : null}
          </Card>
        ))
      )}

      <Card size="hero">
        <p className="caption">Итого</p>
        <p className="hero-amount">{formatRub(total)}</p>
      </Card>

      <Button
        disabled={cannotSave}
        onClick={async () => {
          await saveCalculation(currentMonth, currentReadings);
          setTab("home");
        }}
      >
        Сохранить расчёт
      </Button>
    </div>
  );
}
