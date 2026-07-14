/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base do backend. Padrão '/api' (mesma origem no Vercel). */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
