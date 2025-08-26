/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ZKP2P_API_KEY: string
  readonly VITE_ZKP2P_RPC_URL?: string
  readonly VITE_WALLET_CONNECT_PROJECT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  ethereum?: any
}