/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
  readonly VITE_API_URL: string;
  readonly VITE_ASSETS_BASE?: string;
  readonly MAP_PROVIDER?: string;
  readonly VITE_MAP_PROVIDER?: string;
  readonly LEAFLET_ENABLED?: string;
  readonly VITE_LEAFLET_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
