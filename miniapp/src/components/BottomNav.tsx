import type { TabId } from "../types";
import { ChartIcon, GaugeIcon, HistoryIcon, HomeIcon, SettingsIcon } from "./Icons";

const ITEMS: Array<{ id: TabId; label: string; icon: typeof HomeIcon }> = [
  { id: "home", label: "Главная", icon: HomeIcon },
  { id: "readings", label: "Показания", icon: GaugeIcon },
  { id: "stats", label: "Статистика", icon: ChartIcon },
  { id: "history", label: "История", icon: HistoryIcon },
  { id: "settings", label: "Настройки", icon: SettingsIcon },
];

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      <div className="bottom-nav__inner">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              className={`bottom-nav__item${isActive ? " is-active" : ""}`}
              onClick={() => onChange(item.id)}
              type="button"
            >
              <Icon />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
