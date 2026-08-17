import {
  dayFromIsoDate,
  dueDateIso,
  formatDueDate,
  lastDayOfMonth,
} from "../lib/format";

interface Props {
  monthKey: string;
  day: number;
  onChange: (day: number) => void;
}

export function DueDatePicker({ monthKey, day, onChange }: Props) {
  const [yearText, monthText] = monthKey.split("-");
  const last = lastDayOfMonth(Number(yearText), Number(monthText));
  const min = `${yearText}-${monthText}-01`;
  const max = `${yearText}-${monthText}-${String(last).padStart(2, "0")}`;

  return (
    <label className="field">
      Передать показания до
      <input
        type="date"
        value={dueDateIso(monthKey, day)}
        min={min}
        max={max}
        aria-label="Срок передачи показаний"
        onChange={(event) => {
          const nextDay = dayFromIsoDate(event.target.value);
          if (nextDay !== null) {
            onChange(nextDay);
          }
        }}
      />
      <span className="hint">
        Сейчас {formatDueDate(day, monthKey)}. Этот день повторяется каждый месяц.
      </span>
    </label>
  );
}
