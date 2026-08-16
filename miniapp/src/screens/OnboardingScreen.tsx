import { useState } from "react";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { useApp } from "../state/AppContext";

const EMPTY_ROW = { name: "", rooms: "", areaM2: "" };

export function OnboardingScreen() {
  const { completeOnboarding, apiError } = useApp();
  const [rows, setRows] = useState([
    { ...EMPTY_ROW },
    { ...EMPTY_ROW },
    { ...EMPTY_ROW },
  ]);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const namesReady = rows.every((row) => row.name.trim().length > 0);

  const onContinue = async () => {
    if (!namesReady || saving) {
      return;
    }
    setSaving(true);
    setLocalError(null);
    try {
      await completeOnboarding(rows);
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : "Не удалось сохранить. Откройте приложение снова из бота.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-content screen-enter stack">
      <div>
        <p className="caption">Smart_Utility</p>
        <h1 className="h1">Три квартиры</h1>
        <p className="small" style={{ marginTop: 8 }}>
          Назовите объекты так, как вам удобно. Адреса и тарифы вы добавите сами —
          в приложении нет чужих данных.
        </p>
        <p className="small" style={{ marginTop: 8 }}>
          Дальше: услуги с квитанции → если месяц уже оплачен, сохраните показания
          как базу → со следующего месяца будет расчёт расхода. Деньги через
          приложение не списываются.
        </p>
      </div>

      {rows.map((row, index) => (
        <div key={index} className="card">
          <p className="section-title">Квартира {index + 1}</p>
          <div className="stack">
            <Field
              label="Название"
              value={row.name}
              placeholder={index === 0 ? "Например, Дом родителей" : "Название"}
              hint="Только вы видите это имя"
              onChange={(name) =>
                setRows((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, name } : item,
                  ),
                )
              }
            />
            <Field
              label="Комнаты (необязательно)"
              value={row.rooms}
              inputMode="numeric"
              onChange={(rooms) =>
                setRows((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, rooms } : item,
                  ),
                )
              }
            />
            <Field
              label="Площадь, м² (необязательно)"
              value={row.areaM2}
              inputMode="decimal"
              hint="Нужна, если тариф считается за квадратный метр"
              onChange={(areaM2) =>
                setRows((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, areaM2 } : item,
                  ),
                )
              }
            />
          </div>
        </div>
      ))}

      {localError || apiError ? (
        <p className="small" style={{ color: "var(--danger, #b42318)" }} role="alert">
          {localError ?? apiError}
        </p>
      ) : null}

      <Button disabled={!namesReady || saving} onClick={() => void onContinue()}>
        {saving ? "Сохраняем…" : "Продолжить"}
      </Button>
    </div>
  );
}
