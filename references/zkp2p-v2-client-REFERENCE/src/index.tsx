// All imports must come first in ES modules
import React from "react";
import ReactDOM from "react-dom/client";
import { Connection } from "@solana/web3.js";
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { baseSepolia, base, hardhat } from 'viem/chains';

import { createClient, convertViemChainToRelayChain, MAINNET_RELAY_API } from '@reservoir0x/relay-sdk';
import { Provider as RollbarProvider, ErrorBoundary as RollbarErrorBoundary } from '@rollbar/react';
import "./index.css";
import ReactErrorBoundary from './ErrorBoundary';
import App from "./App";
import { wagmiConfig } from './config/wagmi';


const getDefaultChain = (env: any) => {
  if (env === 'STAGING' || env === 'PRODUCTION') {
    return base;
  } else if (env === 'STAGING_TESTNET') {
    return baseSepolia;
  } else {
    return hardhat;
  }
};

const getChainsForEnvironment = (env: any) => {
  if (env === 'STAGING' || env === 'PRODUCTION') {
    return [base];
  } else if (env === 'STAGING_TESTNET') {
    return [baseSepolia];
  } else {
    return [hardhat];
  }
};

import { alchemySolanaEndpoint, alchemyMainnetRpcUrl, alchemyBaseRpcUrl, alchemyBaseSepoliaRpcUrl } from './helpers/config';

const env = import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT;
const chains = getChainsForEnvironment(env);

// Export chains and RPC URL for use in SmartAccountContext
export const selectedChains = chains;
export const alchemyRpcUrl = env === 'STAGING_TESTNET' ? alchemyBaseSepoliaRpcUrl : alchemyBaseRpcUrl;

export const alchemySolanaConnection = new Connection(alchemySolanaEndpoint, 'confirmed');

// Re-export for backward compatibility
export { alchemyMainnetRpcUrl };

// Create a client for TanStack Query
const queryClient = new QueryClient();

// Initialize Relay SDK client
createClient({
  baseApiUrl: MAINNET_RELAY_API,
  chains: chains.map(chain => convertViemChainToRelayChain(chain))
});

const rollbarConfig = {
  accessToken: import.meta.env.VITE_ROLLBAR_ACCESS_TOKEN || '',
  environment: import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT || '',
  autoInstrument: {
    log: false,
    network: false,
    dom: false,
    navigation: false,
  }
};

const container = document.getElementById("root");
if (!container) {
  throw new Error('Root element not found');
}
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <ReactErrorBoundary>
      <RollbarProvider config={rollbarConfig}>
        <RollbarErrorBoundary>
              <PrivyProvider
                appId={import.meta.env.VITE_PRIVY_APP_ID || ''}
                config={{
                  embeddedWallets: {
                    createOnLogin: 'users-without-wallets'
                  },
                  loginMethodsAndOrder: {
                    primary: ['email', 'google', 'twitter', 'coinbase_wallet'],
                    overflow: ['metamask', 'rabby_wallet', 'rainbow', 'phantom', 'detected_wallets']
                  },
                  appearance: {
                    theme: "#0E111C",
                    accentColor: "#df2e2d",
                  },
                  externalWallets: {
                    coinbaseWallet: {
                      connectionOptions: 'smartWalletOnly',
                    },
                  },
                  defaultChain: getDefaultChain(env),
                  supportedChains: chains
                }}
              >
                <QueryClientProvider client={queryClient}>
                  <WagmiProvider config={wagmiConfig}>
                    <HelmetProvider>
                      <App />
                    </HelmetProvider>
                  </WagmiProvider>
                </QueryClientProvider>
              </PrivyProvider>
        </RollbarErrorBoundary>
      </RollbarProvider>
    </ReactErrorBoundary>
  </React.StrictMode>
);