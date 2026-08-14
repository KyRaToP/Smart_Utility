import { monthList, monthTotal, paymentFor } from "../calc/month";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { HistoryIcon } from "../components/Icons";
import { formatMonthTitle, formatRub } from "../lib/format";
import { useApp } from "../state/AppContext";
import type { PaymentStatus } from "../types";

function statusLabel(status: PaymentStatus | undefined, total: number): {
  tone: "success" | "warning" | "danger" | "neutral";
  text: string;
} {
  if (status === "paid") {
    return { tone: "success", text: "Оплачено" };
  }
  if (status === "overdue") {
    return { tone: "danger", text: "Просрочено" };
  }
  if (status === "pending" || total > 0) {
    return { tone: "warning", text: "Ожидает оплаты" };
  }
  return { tone: "neutral", text: "Нет расчёта" };
}

export function HistoryScreen() {
  const { data, currentMonth, push } = useApp();
  const apartmentId = data.activeApartmentId;
  if (!apartmentId) {
    return null;
  }

  const months = monthList(currentMonth, 8).reverse();
  const rows = months
    .map((month) => {
      const total = monthTotal(data, apartmentId, month);
      const payment = paymentFor(data, apartmentId, month);
      return { month, total, payment };
    })
    .filter((row) => row.total > 0 || row.payment);

  if (rows.length === 0) {
    return (
      <div className="screen-enter">
        <h1 className="h1">История</h1>
        <EmptyState
          icon={<HistoryIcon />}
          title="Сохраните первый расчёт"
          text="Месяцы появятся здесь после того, как вы посчитаете коммуналку."
        />
      </div>
    );
  }

  return (
    <div className="stack screen-enter">
      <h1 className="h1">История</h1>
      {rows.map((row) => {
        const status = statusLabel(row.payment?.status, row.total);
        return (
          <button
            key={row.month}
            type="button"
            onClick={() => push({ name: "month-detail", month: row.month })}
            style={{ border: 0, background: "transparent", padding: 0, textAlign: "left" }}
          >
            <Card>
              <div className="row">
                <div>
                  <p className="h3">{formatMonthTitle(row.month)}</p>
                  <p className="small" style={{ marginTop: 4 }}>
                    {row.payment?.paidAt
                      ? `${status.text} · ${row.payment.paidAt}`
                      : status.text}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="h3">{formatRub(row.total || row.payment?.amount || 0)}</p>
                  <div style={{ marginTop: 6 }}>
                    <Badge tone={status.tone}>{status.text}</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
