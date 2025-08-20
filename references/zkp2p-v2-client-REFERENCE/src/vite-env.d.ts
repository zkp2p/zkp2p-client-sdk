/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly VITE_ALCHEMY_API_KEY: string;
  readonly VITE_COINBASE_DEV_API_KEY: string;
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string;
  readonly VITE_DEPLOYMENT_ENVIRONMENT: 'LOCAL' | 'STAGING' | 'STAGING_TESTNET' | 'PRODUCTION';
  readonly VITE_PRIVY_APP_ID: string;
  readonly VITE_ZERODEV_APP_ID: string;
  readonly VITE_SOCKET_API_KEY: string;
  readonly VITE_ALCHEMY_SOLANA_API_KEY: string;
  readonly VITE_ROLLBAR_ACCESS_TOKEN: string;
  readonly VITE_CURRENCY_PRICE_API_KEY: string;
  readonly VITE_DUNE_API_KEY: string;
  readonly VITE_CURATOR_API_URL: string;
  readonly VITE_PUBLIC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}