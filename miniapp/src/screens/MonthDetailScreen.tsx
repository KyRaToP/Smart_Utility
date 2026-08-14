import { lastReadingBefore, paymentFor, readingForMonth } from "../calc/month";
import { BackRow } from "../components/BackRow";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { formatMonthTitle, formatNumber, formatRub } from "../lib/format";
import { useApp } from "../state/AppContext";

export function MonthDetailScreen() {
  const { data, stack, back, markPaid } = useApp();
  const route = stack[stack.length - 1];
  const month = route.month;
  const apartment = data.apartments.find((item) => item.id === data.activeApartmentId);

  if (!apartment || !month) {
    return null;
  }

  const charges = data.charges.filter(
    (item) => item.apartmentId === apartment.id && item.month === month,
  );
  const total = charges.reduce((sum, item) => sum + item.amount, 0);
  const payment = paymentFor(data, apartment.id, month);
  const meters = data.meters.filter((meter) =>
    data.services.some(
      (service) => service.apartmentId === apartment.id && service.id === meter.serviceId,
    ),
  );

  const status =
    payment?.status === "paid"
      ? { tone: "success" as const, text: "Оплачено" }
      : payment?.status === "overdue"
        ? { tone: "danger" as const, text: "Просрочено" }
        : { tone: "warning" as const, text: "Ожидает оплаты" };

  return (
    <div className="app-content screen-enter stack">
      <BackRow title={formatMonthTitle(month)} onBack={back} />
      <Card size="hero">
        <p className="caption">Итого</p>
        <p className="hero-amount">{formatRub(total || payment?.amount || 0)}</p>
        <div style={{ marginTop: 12 }}>
          <Badge tone={status.tone}>{status.text}</Badge>
        </div>
      </Card>

      <Card>
        <p className="section-title">Услуги</p>
        {charges.length === 0 ? (
          <p className="small">Нет детализации по услугам за этот месяц.</p>
        ) : (
          charges.map((charge) => {
            const service = data.services.find((item) => item.id === charge.serviceId);
            return (
              <div key={charge.id} className="formula-row">
                <div>
                  <p>{service?.name ?? "Услуга"}</p>
                  <p className="caption">{charge.formulaSnapshot}</p>
                </div>
                <strong>{formatRub(charge.amount)}</strong>
              </div>
            );
          })
        )}
      </Card>

      <Card>
        <p className="section-title">Показания</p>
        {meters.map((meter) => {
          const service = data.services.find((item) => item.id === meter.serviceId);
          const current = readingForMonth(data, meter.id, month);
          const previous = lastReadingBefore(data, meter.id, month);
          if (current === null) {
            return null;
          }
          return (
            <div key={meter.id} className="formula-row">
              <span>
                {meter.zone === "single"
                  ? service?.name
                  : `${service?.name} · ${meter.name}`}
              </span>
              <span className="small">
                {previous === null ? "—" : formatNumber(previous, 2)} → {formatNumber(current, 2)}
              </span>
            </div>
          );
        })}
      </Card>

      {payment?.status !== "paid" ? (
        <Button onClick={() => markPaid(apartment.id, month)}>Отметить оплаченным</Button>
      ) : null}
    </div>
  );
}
