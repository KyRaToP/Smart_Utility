import { BottomNav } from "./components/BottomNav";
import { AddServiceScreen } from "./screens/AddServiceScreen";
import { ApartmentEditScreen } from "./screens/ApartmentEditScreen";
import { BaselineScreen } from "./screens/BaselineScreen";
import { CalculationScreen } from "./screens/CalculationScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { MonthDetailScreen } from "./screens/MonthDetailScreen";
import { NotificationsScreen } from "./screens/NotificationsScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { ReadingsScreen } from "./screens/ReadingsScreen";
import { ServicesScreen } from "./screens/ServicesScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { StatisticsScreen } from "./screens/StatisticsScreen";
import { useApp } from "./state/AppContext";
import type { ScreenName } from "./types";

export function App() {
  const { data, tab, setTab, stack, mode, setMode, ready, apiError } = useApp();
  const top = stack[stack.length - 1];

  if (!ready) {
    return (
      <div className="app-shell app-shell--stack">
        <DevMode mode={mode} onChange={setMode} />
        <div className="app-content">
          <p className="small">Загрузка…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={top || !data.onboarded ? "app-shell app-shell--stack" : "app-shell"}>
      <DevMode mode={mode} onChange={setMode} />
      {apiError ? (
        <div className="dev-banner">
          <span>{apiError}</span>
        </div>
      ) : null}
      {!data.onboarded ? (
        <OnboardingScreen />
      ) : top ? (
        <StackScreen name={top.name} />
      ) : (
        <>
          <div className="app-content">
            {tab === "home" ? <HomeScreen /> : null}
            {tab === "readings" ? (
              <ReadingsScreen key={data.activeApartmentId ?? "none"} />
            ) : null}
            {tab === "stats" ? <StatisticsScreen /> : null}
            {tab === "history" ? <HistoryScreen /> : null}
            {tab === "settings" ? <SettingsScreen /> : null}
          </div>
          <BottomNav active={tab} onChange={setTab} />
        </>
      )}
    </div>
  );
}

function StackScreen({ name }: { name: ScreenName }) {
  if (name === "calculation") {
    return <CalculationScreen />;
  }
  if (name === "month-detail") {
    return <MonthDetailScreen />;
  }
  if (name === "add-service") {
    return <AddServiceScreen />;
  }
  if (name === "notifications") {
    return <NotificationsScreen />;
  }
  if (name === "profile") {
    return <ProfileScreen />;
  }
  if (name === "services") {
    return <ServicesScreen />;
  }
  if (name === "apartment-edit") {
    return <ApartmentEditScreen />;
  }
  if (name === "baseline") {
    return <BaselineScreen />;
  }
  return null;
}

function DevMode({
  mode,
  onChange,
}: {
  mode: "mock" | "empty";
  onChange: (mode: "mock" | "empty") => void;
}) {
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="dev-banner">
      <span>Режим вёрстки: {mode === "mock" ? "demo-данные" : "как у пользователя"}</span>
      <button
        type="button"
        onClick={() => onChange(mode === "mock" ? "empty" : "mock")}
      >
        Переключить
      </button>
    </div>
  );
}
