import {
  groupedHomeCards,
  insightText,
  monthTotal,
  paymentFor,
  smartStatus,
} from "../calc/month";
import { ApartmentSwitcher } from "../components/ApartmentSwitcher";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { CountUpAmount } from "../components/CountUpAmount";
import { EmptyState } from "../components/EmptyState";
import {
  BoltIcon,
  BuildingIcon,
  DropIcon,
  FlameIcon,
} from "../components/Icons";
import {
  formatMonthTitle,
  formatRub,
  percentChange,
  previousMonthKey,
} from "../lib/format";
import { useApp } from "../state/AppContext";

function categoryIcon(category: string) {
  if (category.includes("Вод")) {
    return <DropIcon />;
  }
  if (category.includes("Электр")) {
    return <BoltIcon />;
  }
  if (category.includes("Газ") || category.includes("Отопл")) {
    return <FlameIcon />;
  }
  return <BuildingIcon />;
}

export function HomeScreen() {
  const { data, telegramName, currentMonth, setActiveApartment, push, setTab, markPaid } =
    useApp();
  const apartment = data.apartments.find((item) => item.id === data.activeApartmentId);

  if (!apartment) {
    return (
      <EmptyState
        title="Нет квартир"
        text="Сначала назовите три квартиры, чтобы вести учёт отдельно."
      />
    );
  }

  const total = monthTotal(data, apartment.id, currentMonth);
  const previousTotal = monthTotal(data, apartment.id, previousMonthKey(currentMonth));
  const change = percentChange(total, previousTotal);
  const status = smartStatus(data, apartment.id, currentMonth);
  const insight = insightText(data, apartment.id, currentMonth);
  const cards = groupedHomeCards(data, apartment.id, currentMonth);
  const payment = paymentFor(data, apartment.id, currentMonth);
  const servicesCount = data.services.filter(
    (item) => item.apartmentId === apartment.id,
  ).length;

  const statusTone =
    status.kind === "ok"
      ? "success"
      : status.kind === "unpaid"
        ? "danger"
        : status.kind === "readings"
          ? "warning"
          : "info";

  return (
    <div className="stack screen-enter">
      <div className="screen-top">
        <p className="small">Привет, {telegramName}</p>
        <h1 className="h2" style={{ marginTop: 2 }}>
          {apartment.name} · {formatMonthTitle(currentMonth)}
        </h1>

        <div style={{ marginTop: 16 }}>
          <ApartmentSwitcher
            apartments={data.apartments}
            activeId={apartment.id}
            onChange={setActiveApartment}
            onDark
          />
        </div>

        <div className="summary-row" style={{ marginTop: 14 }}>
          {data.apartments.map((item) => (
            <button
              key={item.id}
              type="button"
              className="summary-cell"
              onClick={() => setActiveApartment(item.id)}
            >
              <span className="caption">{item.name}</span>
              <strong>{formatRub(monthTotal(data, item.id, currentMonth))}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="screen-top__pull stack" style={{ gap: 12 }}>
        <Badge tone={statusTone}>{status.label}</Badge>

        {servicesCount === 0 ? (
          <Card size="hero">
            <EmptyState
              title="С чего начать"
              text="1) Добавьте услуги и тарифы с квитанции. 2) Если месяц уже оплачен — внесите конечные показания как базу (Настройки → Уже оплаченный месяц)."
              actionLabel="Добавить услугу"
              onAction={() => push({ name: "add-service" })}
            />
          </Card>
        ) : (
          <Card size="hero">
            <p className="caption">К оплате (расчёт в приложении)</p>
            <CountUpAmount value={total} />
            {change !== null ? (
              <p className="small" style={{ marginTop: 8 }}>
                {change > 0 ? "↑" : "↓"} {Math.abs(change)}% к прошлому месяцу
              </p>
            ) : (
              <p className="small" style={{ marginTop: 8 }}>
                Сравним с прошлым месяцем, когда появится история
              </p>
            )}
            <p className="small" style={{ marginTop: 8 }}>
              Оплата — в банке или у поставщика. Здесь только отметка в учёте.
            </p>
            <div style={{ marginTop: 20 }}>
              <Button
                disabled={total <= 0 || payment?.status === "paid"}
                onClick={() => markPaid(apartment.id, currentMonth)}
              >
                {payment?.status === "paid" ? "Оплачено" : "Отметить оплаченным"}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {insight ? <p className="insight">{insight}</p> : null}

      {cards.length > 0 ? (
        <div>
          <p className="section-title">Коммунальные услуги</p>
          <div className="grid-2">
            {cards.map((card) => (
              <Card key={card.category} size="sm">
                <div className="row">
                  <div className="icon-wrap">{categoryIcon(card.category)}</div>
                </div>
                <p className="small" style={{ marginTop: 10 }}>
                  {card.category}
                </p>
                <p className="h3">{formatRub(card.amount)}</p>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <Card>
        <div className="cta-card">
          <div>
            <p className="caption">Показания до {apartment.readingDueDay} числа</p>
            <p className="h3" style={{ marginTop: 4 }}>
              Передать показания
            </p>
          </div>
          <Button variant="tertiary" onClick={() => setTab("readings")}>
            Открыть →
          </Button>
        </div>
      </Card>
    </div>
  );
}
