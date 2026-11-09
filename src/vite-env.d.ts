/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE: 'sheets' | 'mock';
  readonly VITE_APPS_SCRIPT_URL: string;
  readonly VITE_APP_AUTH_TOKEN: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_DEFAULT_CURRENCY: string;
  readonly VITE_TIMEZONE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
