import { BackRow } from "../components/BackRow";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { apartmentServices } from "../calc/month";
import { useApp } from "../state/AppContext";

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
          <Card key={service.id} size="sm">
            <p className="h3">{service.name}</p>
            <p className="small" style={{ marginTop: 4 }}>
              {service.category} · {service.tariff} ₽ / {service.unit}
              {service.hasMeter ? " · счётчик" : ""}
            </p>
          </Card>
        ))
      )}
      <Button onClick={() => push({ name: "add-service" })}>Добавить услугу</Button>
    </div>
  );
}
