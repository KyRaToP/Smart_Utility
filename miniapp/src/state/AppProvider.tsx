import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api, telegramInitDataPresent } from "../api";
import { draftsToCharges, buildMonthCharges, monthTotal } from "../calc/month";
import { createEmptyData, createMockData } from "../data/seed";
import { createId, currentMonthKey } from "../lib/format";
import type {
  AppData,
  DataMode,
  Meter,
  NotificationSettings,
  Route,
  ServiceInput,
  TabId,
} from "../types";
import { AppContext } from "./AppContext";

const MOCK_STORAGE = "smart-utility-mock";

function loadMock(): AppData {
  const raw = window.localStorage.getItem(MOCK_STORAGE);
  if (raw) {
    try {
      return JSON.parse(raw) as AppData;
    } catch {
      return createMockData();
    }
  }
  return createMockData();
}

function telegramFirstName(): string {
  return window.Telegram?.WebApp.initDataUnsafe?.user?.first_name ?? "";
}

interface Props {
  children: ReactNode;
}

export function AppProvider({ children }: Props) {
  const [mode, setModeState] = useState<DataMode>(() =>
    import.meta.env.DEV ? "mock" : "empty",
  );
  const [data, setData] = useState<AppData>(() =>
    mode === "mock" ? loadMock() : createEmptyData(),
  );
  const [ready, setReady] = useState(mode === "mock");
  const [apiError, setApiError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("home");
  const [stack, setStack] = useState<Route[]>([]);
  const currentMonth = currentMonthKey();
  const telegramName = telegramFirstName() || data.displayName || "пользователь";

  useEffect(() => {
    window.Telegram?.WebApp.ready();
    window.Telegram?.WebApp.expand();
  }, []);

  useEffect(() => {
    if (mode === "mock") {
      window.localStorage.setItem(MOCK_STORAGE, JSON.stringify(data));
    }
  }, [data, mode]);

  useEffect(() => {
    if (mode === "mock") {
      setReady(true);
      setApiError(null);
      return;
    }

    let cancelled = false;
    setReady(false);
    api
      .getState()
      .then((state) => {
        if (!cancelled) {
          setData(state);
          setApiError(null);
          setReady(true);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          const hint = !import.meta.env.DEV && !telegramInitDataPresent()
            ? "Нет подписи Telegram. Откройте приложение кнопкой внутри бота."
            : error.message;
          setApiError(hint);
          setReady(true);
          console.error(error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mode]);

  const applyRemote = async (action: () => Promise<AppData>) => {
    try {
      const next = await action();
      setData(next);
      setApiError(null);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить данные.";
      setApiError(message);
      throw error;
    }
  };

  const value = useMemo(
    () => ({
      mode,
      setMode: (next: DataMode) => {
        setModeState(next);
        setTab("home");
        setStack([]);
        if (next === "mock") {
          setData(loadMock());
          setReady(true);
          setApiError(null);
        }
      },
      data,
      tab,
      setTab: (next: TabId) => {
        setTab(next);
        setStack([]);
      },
      stack,
      push: (route: Route) => setStack((current) => [...current, route]),
      back: () => setStack((current) => current.slice(0, -1)),
      telegramName,
      currentMonth,
      ready,
      apiError,
      completeOnboarding: async (
        apartments: Array<{ name: string; rooms: string; areaM2: string }>,
      ) => {
        if (mode === "empty") {
          await applyRemote(() => api.completeOnboarding(apartments));
          setTab("home");
          setStack([]);
          return;
        }
        const created = apartments.map((item) => ({
          id: createId("apt"),
          name: item.name.trim(),
          rooms: item.rooms ? Number(item.rooms) : null,
          areaM2: item.areaM2 ? Number(item.areaM2) : null,
          readingDueDay: 25,
        }));
        setData({
          ...createEmptyData(),
          onboarded: true,
          displayName: telegramFirstName() || "Пользователь",
          apartments: created,
          activeApartmentId: created[0]?.id ?? null,
        });
        setTab("home");
        setStack([]);
      },
      setActiveApartment: async (id: string) => {
        if (mode === "empty") {
          await applyRemote(() => api.setActiveApartment(id));
          return;
        }
        setData((current) => ({ ...current, activeApartmentId: id }));
      },
      saveReadings: async (values: Record<string, number>, month = currentMonth) => {
        if (mode === "empty") {
          await applyRemote(() => api.saveReadings(month, values));
          return;
        }
        setData((current) => {
          const nextReadings = current.readings.filter((item) => {
            const keepOtherMonth = item.month !== month;
            const keepOtherMeter = values[item.meterId] === undefined;
            return keepOtherMonth || keepOtherMeter;
          });
          for (const [meterId, value] of Object.entries(values)) {
            const hasHistory = current.readings.some(
              (item) => item.meterId === meterId && item.month < month,
            );
            nextReadings.push({
              id: createId("reading"),
              meterId,
              month,
              value,
              isInitial: !hasHistory,
            });
          }
          return { ...current, readings: nextReadings };
        });
      },
      saveBaseline: async (
        values: Record<string, number>,
        month: string,
        markPaidFlag = true,
      ) => {
        if (mode === "empty") {
          await applyRemote(() => api.saveBaseline(month, values, markPaidFlag));
          return;
        }
        setData((current) => {
          const apartmentId = current.activeApartmentId;
          const nextReadings = current.readings.filter((item) => {
            const keepOtherMonth = item.month !== month;
            const keepOtherMeter = values[item.meterId] === undefined;
            return keepOtherMonth || keepOtherMeter;
          });
          for (const [meterId, value] of Object.entries(values)) {
            const hasHistory = current.readings.some(
              (item) => item.meterId === meterId && item.month < month,
            );
            nextReadings.push({
              id: createId("reading"),
              meterId,
              month,
              value,
              isInitial: !hasHistory,
            });
          }
          let payments = current.payments;
          if (markPaidFlag && apartmentId) {
            payments = [
              ...current.payments.filter(
                (item) => !(item.apartmentId === apartmentId && item.month === month),
              ),
              {
                id: createId("pay"),
                apartmentId,
                month,
                amount: 0,
                paidAt: `${month}-28`,
                status: "paid" as const,
              },
            ];
          }
          return { ...current, readings: nextReadings, payments };
        });
      },
      saveCalculation: async (
        month = currentMonth,
        values: Record<string, number> = {},
      ) => {
        if (mode === "empty") {
          await applyRemote(() => api.saveCalculation(month, values));
          return;
        }
        setData((current) => {
          const apartmentId = current.activeApartmentId;
          if (!apartmentId) {
            return current;
          }
          const drafts = buildMonthCharges(current, apartmentId, month, values);
          const charges = [
            ...current.charges.filter(
              (item) => !(item.apartmentId === apartmentId && item.month === month),
            ),
            ...draftsToCharges(apartmentId, month, drafts),
          ];
          const amount = drafts.reduce((sum, item) => sum + item.amount, 0);
          const payments = [
            ...current.payments.filter(
              (item) => !(item.apartmentId === apartmentId && item.month === month),
            ),
            {
              id: createId("pay"),
              apartmentId,
              month,
              amount,
              paidAt: null,
              status: "pending" as const,
            },
          ];
          return { ...current, charges, payments };
        });
      },
      markPaid: async (apartmentId: string, month: string) => {
        if (mode === "empty") {
          await applyRemote(() =>
            api.markPaid(apartmentId, month, new Date().toISOString().slice(0, 10)),
          );
          return;
        }
        setData((current) => ({
          ...current,
          payments: current.payments.map((item) =>
            item.apartmentId === apartmentId && item.month === month
              ? {
                  ...item,
                  status: "paid",
                  paidAt: new Date().toISOString().slice(0, 10),
                  amount: monthTotal(current, apartmentId, month) || item.amount,
                }
              : item,
          ),
        }));
      },
      addService: async (input: ServiceInput) => {
        if (mode === "empty") {
          await applyRemote(() => api.addService(input));
          return;
        }
        setData((current) => {
          const apartmentId = current.activeApartmentId;
          if (!apartmentId) {
            return current;
          }
          const serviceId = createId("svc");
          return {
            ...current,
            meters: ensureServiceMeters(current.meters, serviceId, input),
            services: [
              ...current.services,
              {
                id: serviceId,
                apartmentId,
                name: input.name.trim(),
                category: input.category.trim() || input.name.trim(),
                calcType: input.calcType,
                unit: input.unit.trim() || "₽",
                tariff: Number(input.tariff) || 0,
                hasMeter: input.hasMeter,
                isActive: true,
              },
            ],
          };
        });
      },
      updateService: async (id: string, input: ServiceInput) => {
        if (mode === "empty") {
          await applyRemote(() => api.updateService(id, input));
          return;
        }
        setData((current) => {
          const existing = current.services.find((item) => item.id === id);
          if (!existing) {
            return current;
          }
          return {
            ...current,
            meters: ensureServiceMeters(current.meters, id, input),
            services: current.services.map((item) =>
              item.id === id
                ? {
                    ...item,
                    name: input.name.trim(),
                    category: input.category.trim() || input.name.trim(),
                    calcType: input.calcType,
                    unit: input.unit.trim() || "₽",
                    tariff: Number(input.tariff) || 0,
                    hasMeter: input.hasMeter,
                  }
                : item,
            ),
          };
        });
      },
      updateApartment: async (
        id: string,
        patch: { name: string; rooms: string; areaM2: string; readingDueDay: string },
      ) => {
        if (mode === "empty") {
          await applyRemote(() => api.updateApartment(id, patch));
          return;
        }
        setData((current) => ({
          ...current,
          apartments: current.apartments.map((item) =>
            item.id === id
              ? {
                  ...item,
                  name: patch.name.trim() || item.name,
                  rooms: patch.rooms ? Number(patch.rooms) : null,
                  areaM2: patch.areaM2 ? Number(patch.areaM2) : null,
                  readingDueDay: Number(patch.readingDueDay) || item.readingDueDay,
                }
              : item,
          ),
        }));
      },
      updateNotifications: async (patch: Partial<NotificationSettings>) => {
        if (mode === "empty") {
          await applyRemote(() => api.updateNotifications(patch));
          return;
        }
        setData((current) => ({
          ...current,
          notifications: { ...current.notifications, ...patch },
        }));
      },
    }),
    [mode, data, tab, stack, telegramName, currentMonth, ready, apiError],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function ensureServiceMeters(
  meters: Meter[],
  serviceId: string,
  input: ServiceInput,
): Meter[] {
  if (!input.hasMeter) {
    return meters;
  }

  const existing = meters.filter((item) => item.serviceId === serviceId);
  const next = [...meters];

  if (input.calcType === "two_zone") {
    if (!existing.some((item) => item.zone === "day")) {
      next.push({
        id: createId("meter"),
        serviceId,
        name: "День",
        zone: "day",
      });
    }
    if (!existing.some((item) => item.zone === "night")) {
      next.push({
        id: createId("meter"),
        serviceId,
        name: "Ночь",
        zone: "night",
      });
    }
    return next;
  }

  if (existing.length === 0) {
    next.push({
      id: createId("meter"),
      serviceId,
      name: input.name.trim(),
      zone: "single",
    });
  }

  return next;
}
