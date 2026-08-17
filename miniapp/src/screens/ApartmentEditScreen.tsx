import { useState } from "react";
import { BackRow } from "../components/BackRow";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Field } from "../components/Field";
import { useApp } from "../state/AppContext";

export function ApartmentEditScreen() {
  const { data, back, updateApartment } = useApp();
  const apartment = data.apartments.find((item) => item.id === data.activeApartmentId);
  const [name, setName] = useState(apartment?.name ?? "");
  const [rooms, setRooms] = useState(apartment?.rooms ? String(apartment.rooms) : "");
  const [areaM2, setAreaM2] = useState(apartment?.areaM2 ? String(apartment.areaM2) : "");
  const [readingDueDay, setReadingDueDay] = useState(
    String(apartment?.readingDueDay ?? 25),
  );

  if (!apartment) {
    return null;
  }

  return (
    <div className="app-content screen-enter stack">
      <BackRow title="Квартира" onBack={back} />
      <Card>
        <div className="stack">
          <Field label="Название" value={name} onChange={setName} />
          <Field label="Комнаты" value={rooms} inputMode="numeric" onChange={setRooms} />
          <Field label="Площадь, м²" value={areaM2} inputMode="decimal" onChange={setAreaM2} />
          <Field
            label="День передачи показаний"
            value={readingDueDay}
            inputMode="numeric"
            hint="Число месяца, например 25. На экране «Показания» дату можно выбрать календарём"
            onChange={setReadingDueDay}
          />
        </div>
      </Card>
      <Button
        onClick={async () => {
          await updateApartment(apartment.id, { name, rooms, areaM2, readingDueDay });
          back();
        }}
      >
        Сохранить
      </Button>
    </div>
  );
}
