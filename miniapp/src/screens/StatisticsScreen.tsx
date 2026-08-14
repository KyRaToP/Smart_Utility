import { categoryTotals, monthList, monthTotal } from "../calc/month";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { ChartIcon } from "../components/Icons";
import { formatMonthShort, formatMonthTitle, formatRub } from "../lib/format";
import { useApp } from "../state/AppContext";

export function StatisticsScreen() {
  const { data, currentMonth, setTab } = useApp();
  const apartmentId = data.activeApartmentId;
  if (!apartmentId) {
    return null;
  }

  const months = monthList(currentMonth, 6);
  const totals = months.map((month) => monthTotal(data, apartmentId, month));
  const known = totals.filter((value) => value > 0);
  const categories = categoryTotals(data, apartmentId, currentMonth);
  const categorySum = categories.reduce((sum, item) => sum + item.amount, 0);
  const maxBar = Math.max(...totals, 1);

  if (known.length === 0) {
    return (
      <div className="screen-enter">
        <h1 className="h1">Статистика</h1>
        <EmptyState
          icon={<ChartIcon />}
          title="Мало истории"
          text="График появится после первого сохранённого расчёта. Мы не показываем выдуманные цифры."
          actionLabel="Перейти к показаниям"
          onAction={() => setTab("readings")}
        />
      </div>
    );
  }

  const min = Math.min(...known);
  const max = Math.max(...known);
  const avg = known.reduce((sum, item) => sum + item, 0) / known.length;

  return (
    <div className="stack screen-enter">
      <div>
        <h1 className="h1">Статистика</h1>
        <p className="small">{formatMonthTitle(currentMonth)}</p>
      </div>

      <Card size="hero">
        <p className="caption">Расходы</p>
        <p className="hero-amount">{formatRub(monthTotal(data, apartmentId, currentMonth))}</p>
        <p className="small" style={{ marginTop: 8 }}>
          {formatMonthTitle(currentMonth)}
        </p>
      </Card>

      <Card>
        <p className="section-title">Последние 6 месяцев</p>
        <div className="month-bar">
          {months.map((month, index) => (
            <div
              key={month}
              className={`month-bar__col${month === currentMonth ? " is-active" : ""}`}
            >
              <div
                className="month-bar__fill"
                style={{ height: `${Math.max((totals[index] / maxBar) * 100, 6)}%` }}
              />
              <span className="caption">{formatMonthShort(month)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid-2">
        <Card size="sm">
          <p className="caption">Средний</p>
          <p className="h3">{formatRub(avg)}</p>
        </Card>
        <Card size="sm">
          <p className="caption">Минимум</p>
          <p className="h3">{formatRub(min)}</p>
        </Card>
        <Card size="sm">
          <p className="caption">Максимум</p>
          <p className="h3">{formatRub(max)}</p>
        </Card>
        <Card size="sm">
          <p className="caption">Месяцев</p>
          <p className="h3">{known.length}</p>
        </Card>
      </div>

      {categories.length > 0 ? (
        <Card>
          <p className="section-title">Расходы по категориям</p>
          {categories.map((item) => {
            const percent = categorySum ? Math.round((item.amount / categorySum) * 100) : 0;
            return (
              <div key={item.category} style={{ marginBottom: 12 }}>
                <div className="row">
                  <span>{item.category}</span>
                  <span className="small">{percent}%</span>
                </div>
                <div className="progress" style={{ marginTop: 6 }}>
                  <div className="progress__bar" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </Card>
      ) : null}
    </div>
  );
}
