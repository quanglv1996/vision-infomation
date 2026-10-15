/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API base URL. Defaults to '/api' (proxied by Vite in dev). */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
