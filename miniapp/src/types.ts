export type CalcType = "metered" | "two_zone" | "fixed" | "by_area";
export type PaymentStatus = "paid" | "pending" | "overdue";
export type DataMode = "mock" | "empty";

export type TabId = "home" | "readings" | "stats" | "history" | "settings";

export type ScreenName =
  | TabId
  | "onboarding"
  | "calculation"
  | "month-detail"
  | "add-service"
  | "notifications"
  | "profile"
  | "services"
  | "apartment-edit"
  | "baseline";

export interface Route {
  name: ScreenName;
  month?: string;
  apartmentId?: string;
}

export interface Apartment {
  id: string;
  name: string;
  rooms: number | null;
  areaM2: number | null;
  readingDueDay: number;
}

export interface Service {
  id: string;
  apartmentId: string;
  name: string;
  category: string;
  calcType: CalcType;
  unit: string;
  tariff: number;
  nightTariff?: number;
  hasMeter: boolean;
  isActive: boolean;
}

export interface Meter {
  id: string;
  serviceId: string;
  name: string;
  zone: "single" | "day" | "night";
}

export interface Reading {
  id: string;
  meterId: string;
  month: string;
  value: number;
  isInitial?: boolean;
}

export interface Charge {
  id: string;
  apartmentId: string;
  month: string;
  serviceId: string;
  amount: number;
  consumption: number | null;
  formulaSnapshot: string;
}

export interface Payment {
  id: string;
  apartmentId: string;
  month: string;
  amount: number;
  paidAt: string | null;
  status: PaymentStatus;
}

export interface NotificationSettings {
  readingsEnabled: boolean;
  readingsDaysBefore: number;
  paymentEnabled: boolean;
  paymentDaysBefore: number;
  reportEnabled: boolean;
  reportDay: number;
}

export interface AppData {
  onboarded: boolean;
  displayName: string;
  apartments: Apartment[];
  activeApartmentId: string | null;
  services: Service[];
  meters: Meter[];
  readings: Reading[];
  charges: Charge[];
  payments: Payment[];
  notifications: NotificationSettings;
}

export const defaultNotifications = (): NotificationSettings => ({
  readingsEnabled: true,
  readingsDaysBefore: 3,
  paymentEnabled: true,
  paymentDaysBefore: 2,
  reportEnabled: true,
  reportDay: 1,
});
