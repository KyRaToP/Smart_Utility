import type { AppData, NotificationSettings, ServiceInput } from "./types";

/** Base URL for API. Empty = same origin (local Vite proxy or Railway static). */
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

function hasSignedInitData(initData: string | undefined): boolean {
  return Boolean(initData && initData.includes("hash="));
}

export function telegramInitDataPresent(): boolean {
  return hasSignedInitData(window.Telegram?.WebApp.initData);
}

function humanApiError(status: number, body: string): string {
  let detail = body.trim();
  try {
    const parsed = JSON.parse(body) as { detail?: unknown };
    if (typeof parsed.detail === "string") {
      detail = parsed.detail;
    }
  } catch {
    // keep raw body
  }

  if (status === 403 || /private/i.test(detail)) {
    return "Доступ закрыт: вашего Telegram ID нет в ALLOWED_TELEGRAM_IDS на Railway.";
  }
  if (status === 503 && /ALLOWED_TELEGRAM_IDS/i.test(detail)) {
    return "На Railway пустой ALLOWED_TELEGRAM_IDS. Добавьте свой числовой Telegram ID в Variables и перезапустите сервис.";
  }
  if (status === 503 && /BOT_TOKEN/i.test(detail)) {
    return "На Railway пустой BOT_TOKEN — сервер не может проверить вход из Telegram.";
  }
  if (status === 401 && /expired/i.test(detail)) {
    return "Сессия Telegram устарела. Закройте приложение и откройте его снова из бота.";
  }
  if (status === 401) {
    return "Нет подписи Telegram. Откройте приложение кнопкой внутри бота (не из обычного браузера и не со старой ссылки Pages).";
  }
  if (!status) {
    return "Нет связи с сервером. Проверьте, что в BotFather указан URL Railway и сервис Online.";
  }
  return detail || `Ошибка сервера (${status})`;
}

async function request(path: string, init?: RequestInit): Promise<AppData> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  const initData = window.Telegram?.WebApp.initData;
  if (hasSignedInitData(initData)) {
    headers["X-Telegram-Init-Data"] = initData!;
  } else if (import.meta.env.DEV) {
    // Local browser / phone on Wi-Fi: no Telegram signature → DEV user 1001
    headers["X-Dev-Telegram-Id"] = "1001";
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), { ...init, headers });
  } catch {
    throw new Error(humanApiError(0, ""));
  }
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(humanApiError(response.status, detail));
  }
  return (await response.json()) as AppData;
}

export const api = {
  health: async () => {
    const response = await fetch(apiUrl("/api/health"));
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
  addService: (input: ServiceInput) =>
    request("/api/services", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateService: (id: string, input: ServiceInput) =>
    request(`/api/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  saveReadings: (month: string, values: Record<string, number>) =>
    request("/api/readings", {
      method: "POST",
      body: JSON.stringify({ month, values }),
    }),
  saveBaseline: (
    month: string,
    values: Record<string, number>,
    markPaid = true,
    paidAt?: string,
  ) =>
    request("/api/baseline", {
      method: "POST",
      body: JSON.stringify({ month, values, markPaid, paidAt }),
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
