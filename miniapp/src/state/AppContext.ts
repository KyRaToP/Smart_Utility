import { createContext, useContext } from "react";
import type {
  AppData,
  DataMode,
  NotificationSettings,
  Route,
  ServiceInput,
  TabId,
} from "../types";

export interface AppContextValue {
  mode: DataMode;
  setMode: (mode: DataMode) => void;
  data: AppData;
  tab: TabId;
  setTab: (tab: TabId) => void;
  stack: Route[];
  push: (route: Route) => void;
  back: () => void;
  telegramName: string;
  currentMonth: string;
  ready: boolean;
  apiError: string | null;
  completeOnboarding: (
    apartments: Array<{ name: string; rooms: string; areaM2: string }>,
  ) => Promise<void>;
  setActiveApartment: (id: string) => Promise<void>;
  saveReadings: (values: Record<string, number>, month?: string) => Promise<void>;
  saveBaseline: (
    values: Record<string, number>,
    month: string,
    markPaid?: boolean,
  ) => Promise<void>;
  saveCalculation: (month?: string, values?: Record<string, number>) => Promise<void>;
  markPaid: (apartmentId: string, month: string) => Promise<void>;
  addService: (input: ServiceInput) => Promise<void>;
  updateService: (id: string, input: ServiceInput) => Promise<void>;
  updateApartment: (
    id: string,
    patch: { name: string; rooms: string; areaM2: string; readingDueDay: string },
  ) => Promise<void>;
  updateNotifications: (patch: Partial<NotificationSettings>) => Promise<void>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("useApp must be used inside AppProvider");
  }
  return value;
}
