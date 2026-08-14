import { Card } from "../components/Card";
import { ChevronIcon, SettingsIcon } from "../components/Icons";
import { useApp } from "../state/AppContext";

export function SettingsScreen() {
  const { data, push } = useApp();
  const apartment = data.apartments.find((item) => item.id === data.activeApartmentId);
  const serviceCount = data.services.filter(
    (item) => item.apartmentId === apartment?.id,
  ).length;

  return (
    <div className="stack screen-enter">
      <h1 className="h1">Настройки</h1>

      <Card>
        <button
          type="button"
          className="settings-item"
          onClick={() => push({ name: "apartment-edit" })}
        >
          <div className="icon-wrap">
            <SettingsIcon size={18} />
          </div>
          <div className="settings-item__text">
            <p className="h3">{apartment?.name ?? "Квартира"}</p>
            <p className="small">
              {apartment?.rooms ? `${apartment.rooms} комн.` : "Без комнат"}
              {apartment?.areaM2 ? ` · ${apartment.areaM2} м²` : ""}
            </p>
          </div>
          <ChevronIcon />
        </button>
      </Card>

      <Card>
        <SettingsLink
          title="Услуги"
          subtitle={`${serviceCount} в этой квартире`}
          onClick={() => push({ name: "services" })}
        />
        <SettingsLink
          title="Добавить услугу"
          subtitle="Название, тариф, счётчик"
          onClick={() => push({ name: "add-service" })}
        />
        <SettingsLink
          title="Уведомления"
          subtitle="Показания, оплата, отчёт"
          onClick={() => push({ name: "notifications" })}
        />
        <SettingsLink
          title="Профиль"
          subtitle="Три квартиры и экспорт"
          onClick={() => push({ name: "profile" })}
        />
      </Card>
    </div>
  );
}

function SettingsLink({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="settings-item" onClick={onClick} style={{ padding: "10px 0" }}>
      <div className="settings-item__text">
        <p>{title}</p>
        <p className="small">{subtitle}</p>
      </div>
      <ChevronIcon />
    </button>
  );
}
