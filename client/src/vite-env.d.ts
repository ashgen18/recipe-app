/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_SW?: string;
  /** Absolute API base including `/api`, e.g. https://recipe-api.onrender.com/api */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
