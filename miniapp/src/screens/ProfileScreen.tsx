import { BackRow } from "../components/BackRow";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { monthTotal } from "../calc/month";
import { formatMonthTitle, formatRub } from "../lib/format";
import { useApp } from "../state/AppContext";

export function ProfileScreen() {
  const { data, telegramName, currentMonth, back, push, setActiveApartment } = useApp();

  const exportText = () => {
    const payload = {
      owner: telegramName,
      apartments: data.apartments.map((apartment) => ({
        name: apartment.name,
        currentMonth: formatMonthTitle(currentMonth),
        total: monthTotal(data, apartment.id, currentMonth),
      })),
      history: data.payments,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smart-utility-export.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasHistory = data.payments.length > 0 || data.charges.length > 0;

  return (
    <div className="app-content screen-enter stack">
      <BackRow title="Профиль" onBack={back} />

      <Card size="hero">
        <p className="caption">Telegram</p>
        <p className="h2">{telegramName}</p>
        <p className="small" style={{ marginTop: 6 }}>
          Данные привязаны к этому аккаунту. Разработчик не заполняет ваши тарифы.
        </p>
      </Card>

      <Card>
        <p className="section-title">Мои квартиры · {data.apartments.length}</p>
        {data.apartments.map((apartment) => (
          <button
            key={apartment.id}
            type="button"
            className="settings-item"
            style={{ padding: "10px 0" }}
            onClick={() => {
              setActiveApartment(apartment.id);
              push({ name: "apartment-edit" });
            }}
          >
            <div className="settings-item__text">
              <p>{apartment.name}</p>
              <p className="small">
                {formatRub(monthTotal(data, apartment.id, currentMonth))} за текущий месяц
              </p>
            </div>
          </button>
        ))}
      </Card>

      <Button variant="secondary" disabled={!hasHistory} onClick={exportText}>
        {hasHistory ? "Скачать историю" : "Экспорт появится после первого расчёта"}
      </Button>
    </div>
  );
}
