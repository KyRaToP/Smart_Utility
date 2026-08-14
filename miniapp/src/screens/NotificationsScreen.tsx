import { BackRow } from "../components/BackRow";
import { Card } from "../components/Card";
import { Field } from "../components/Field";
import { useApp } from "../state/AppContext";

export function NotificationsScreen() {
  const { data, back, updateNotifications } = useApp();
  const settings = data.notifications;

  return (
    <div className="app-content screen-enter stack">
      <BackRow title="Уведомления" onBack={back} />
      <p className="small">
        Эти флаги будет читать Telegram-бот. Пока backend не подключён, настройки
        сохраняются только на этом устройстве.
      </p>

      <Card>
        <ToggleRow
          title="Передать показания"
          on={settings.readingsEnabled}
          onToggle={() =>
            updateNotifications({ readingsEnabled: !settings.readingsEnabled })
          }
        />
        <Field
          label="За сколько дней до срока"
          value={String(settings.readingsDaysBefore)}
          inputMode="numeric"
          onChange={(value) =>
            updateNotifications({ readingsDaysBefore: Number(value) || 0 })
          }
        />
      </Card>

      <Card>
        <ToggleRow
          title="Напоминать об оплате"
          on={settings.paymentEnabled}
          onToggle={() =>
            updateNotifications({ paymentEnabled: !settings.paymentEnabled })
          }
        />
        <Field
          label="За сколько дней"
          value={String(settings.paymentDaysBefore)}
          inputMode="numeric"
          onChange={(value) =>
            updateNotifications({ paymentDaysBefore: Number(value) || 0 })
          }
        />
      </Card>

      <Card>
        <ToggleRow
          title="Ежемесячный отчёт"
          on={settings.reportEnabled}
          onToggle={() => updateNotifications({ reportEnabled: !settings.reportEnabled })}
        />
        <Field
          label="Дата отчёта, число месяца"
          value={String(settings.reportDay)}
          inputMode="numeric"
          onChange={(value) => updateNotifications({ reportDay: Number(value) || 1 })}
        />
      </Card>
    </div>
  );
}

function ToggleRow({
  title,
  on,
  onToggle,
}: {
  title: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="row" style={{ marginBottom: 12 }}>
      <span>{title}</span>
      <button
        type="button"
        className={`toggle${on ? " is-on" : ""}`}
        onClick={onToggle}
        aria-pressed={on}
      />
    </div>
  );
}
