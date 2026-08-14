import { useState } from "react";
import { buildMonthCharges } from "../calc/month";
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
  const total = drafts.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="app-content screen-enter stack">
      <BackRow title="Расчёт" onBack={back} />
      <p className="small">
        {apartment.name} · {formatMonthTitle(currentMonth)}
      </p>

      {drafts.length === 0 ? (
        <Card>
          <p className="h3">Пока нечего считать</p>
          <p className="small" style={{ marginTop: 6 }}>
            Сначала передайте показания по счётчикам или добавьте услуги с фиксированной суммой.
          </p>
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
        disabled={drafts.length === 0}
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
