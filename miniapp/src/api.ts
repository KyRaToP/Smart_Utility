import type { AppData, NotificationSettings } from "./types";

async function request(path: string, init?: RequestInit): Promise<AppData> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  const initData = window.Telegram?.WebApp.initData;
  if (initData) {
    headers["X-Telegram-Init-Data"] = initData;
  } else if (import.meta.env.DEV) {
    headers["X-Dev-Telegram-Id"] = "1001";
  }

  const response = await fetch(path, { ...init, headers });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API error ${response.status}`);
  }
  return (await response.json()) as AppData;
}

export const api = {
  health: async () => {
    const response = await fetch("/api/health");
    if (!response.ok) {
      throw new Error("API is not running");
    }
  },
  getState: () => request("/api/state"),
  completeOnboarding: (
    apartments: Array<{ name: string; rooms: string; areaM2: string }>,
  ) =>
    request("/api/onboarding", {
      method: "POST",
      body: JSON.stringify({ apartments }),
    }),
  setActiveApartment: (id: string) =>
    request("/api/apartments/active", {
      method: "POST",
      body: JSON.stringify({ id }),
    }),
  updateApartment: (
    id: string,
    patch: { name: string; rooms: string; areaM2: string; readingDueDay: string },
  ) =>
    request(`/api/apartments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  addService: (input: {
    name: string;
    category: string;
    unit: string;
    tariff: string;
    hasMeter: boolean;
    calcType: string;
  }) =>
    request("/api/services", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  saveReadings: (month: string, values: Record<string, number>) =>
    request("/api/readings", {
      method: "POST",
      body: JSON.stringify({ month, values }),
    }),
  saveCalculation: (month: string, values: Record<string, number>) =>
    request("/api/calculations", {
      method: "POST",
      body: JSON.stringify({ month, values }),
    }),
  markPaid: (apartmentId: string, month: string, paidAt: string) =>
    request("/api/payments/paid", {
      method: "POST",
      body: JSON.stringify({ apartmentId, month, paidAt }),
    }),
  updateNotifications: (patch: Partial<NotificationSettings>) =>
    request("/api/notifications", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
};
