import { useState } from "react";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { useApp } from "../state/AppContext";

const EMPTY_ROW = { name: "", rooms: "", areaM2: "" };

export function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  const [rows, setRows] = useState([
    { ...EMPTY_ROW },
    { ...EMPTY_ROW },
    { ...EMPTY_ROW },
  ]);

  const namesReady = rows.every((row) => row.name.trim().length > 0);

  return (
    <div className="app-content screen-enter stack">
      <div>
        <p className="caption">Smart_Utility</p>
        <h1 className="h1">Три квартиры</h1>
        <p className="small" style={{ marginTop: 8 }}>
          Назовите объекты так, как вам удобно. Адреса и тарифы вы добавите сами —
          в приложении нет чужих данных.
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

      <Button
        disabled={!namesReady}
        onClick={() => {
          void completeOnboarding(rows);
        }}
      >
        Продолжить
      </Button>
    </div>
  );
}
