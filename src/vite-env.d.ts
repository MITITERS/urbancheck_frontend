/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the UrbanCheck API. Leave it empty to use same-origin relative
   * paths, which the Vite dev server (and nginx in production) proxy to the
   * backend — that is the default and avoids CORS entirely.
   */
  readonly VITE_API_URL: string
  /** Where the dev-server proxy forwards `/api` and `/_allauth`. Dev only. */
  readonly VITE_API_PROXY_TARGET?: string
  /** Set to 'true' to watch files by polling (bind mounts inside Docker). */
  readonly VITE_USE_POLLING?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
