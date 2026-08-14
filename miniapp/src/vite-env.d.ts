/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface TelegramUser {
  first_name?: string;
  last_name?: string;
  username?: string;
  id?: number;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramUser;
  };
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}
