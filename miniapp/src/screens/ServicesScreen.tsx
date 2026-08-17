import { BackRow } from "../components/BackRow";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { ChevronIcon } from "../components/Icons";
import { apartmentServices } from "../calc/month";
import { useApp } from "../state/AppContext";
import type { Service } from "../types";

export function ServicesScreen() {
  const { data, back, push } = useApp();
  const apartmentId = data.activeApartmentId;
  const services = apartmentId ? apartmentServices(data, apartmentId) : [];

  return (
    <div className="app-content screen-enter stack">
      <BackRow title="Услуги" onBack={back} />
      {services.length === 0 ? (
        <EmptyState
          title="Услуг пока нет"
          text="Добавьте то, за что платите: воду, свет, содержание, интернет."
          actionLabel="Добавить услугу"
          onAction={() => push({ name: "add-service" })}
        />
      ) : (
        services.map((service) => (
          <Card
            key={service.id}
            size="sm"
            onClick={() => push({ name: "add-service", serviceId: service.id })}
          >
            <div className="service-card">
              <div className="service-card__text">
                <p className="h3">{service.name}</p>
                <p className="small" style={{ marginTop: 4 }}>
                  {serviceSubtitle(service)}
                </p>
              </div>
              <span className="service-card__chevron">
                <ChevronIcon />
              </span>
            </div>
          </Card>
        ))
      )}
      <Button onClick={() => push({ name: "add-service" })}>Добавить услугу</Button>
    </div>
  );
}

function serviceSubtitle(service: Service): string {
  const meterLabel = service.hasMeter ? " · счётчик" : "";
  if (service.calcType === "fixed" || service.unit === "₽") {
    return `${service.category} · ${service.tariff} ₽ / месяц${meterLabel}`;
  }
  if (service.calcType === "two_zone") {
    const night = service.nightTariff ?? 0;
    return `${service.category} · день ${service.tariff} ₽ / ${service.unit} · ночь ${night} ₽ / ${service.unit}${meterLabel}`;
  }
  return `${service.category} · ${service.tariff} ₽ / ${service.unit}${meterLabel}`;
}
