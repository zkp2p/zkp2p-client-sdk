import { 
  BridgeConfig, 
  BridgeProvider, 
  BridgeProviderSelection,
  ChainSupport
} from '@helpers/types/bridge';
import { 
  SOLANA_CHAIN_ID, 
  TRON_CHAIN_ID, 
  HYPEREVM_CHAIN_ID, 
  HYPERLIQUID_CHAIN_ID,
  HYPERLIQUID_USDC_ADDRESS 
} from '@helpers/constants';

// Bungee supported chain IDs
// Note: Bungee uses chain ID 89999 for Solana, while we use 792703809 internally - conversion handled in useBridgeProvider.ts
const BUNGEE_SUPPORTED_CHAINS = [
  137,        // Polygon
  1,          // Ethereum Mainnet
  100,        // Gnosis (xDai)
  42161,      // Arbitrum One
  250,        // Fantom
  10,         // Optimism
  43114,      // Avalanche
  56,         // BSC (Binance Smart Chain)
  1313161554, // Aurora
  1101,       // Polygon zkEVM
  324,        // zkSync Era
  7777777,    // Zora
  8453,       // Base
  59144,      // Linea
  5000,       // Mantle
  534352,     // Scroll
  81457,      // Blast
  34443,      // Mode
  57073,      // Avail
  89999,      // Solana (Bungee's chain ID for Solana)
  42220,      // Celo
  1088,       // Metis
  8008,       // Polygon Hermez
  25,         // Cronos
  128,        // Huobi ECO Chain
  106,        // Velas
  40,         // Telos
  288,        // Boba Network
  66,         // OKExChain
  321,        // KCC
  4689,       // IoTeX
  888,        // Wanchain
  2020,       // Ronin
  592,        // Astar
  30,         // RSK
  199,        // BitTorrent Chain
  336,        // Shiden
  1284,       // Moonbeam
  1285,       // Moonriver
  2001,       // Milkomeda C1
  9001,       // Evmos
  1313161555, // Aurora Testnet
  80001,      // Polygon Mumbai (testnet)
  421611,     // Arbitrum Rinkeby (testnet)
  69,         // Optimism Kovan (testnet)  
  97,         // BSC Testnet
  84531,      // Base Goerli (testnet)
  84532,      // Base Sepolia (testnet)
];

// Relay supports all EVM chains plus additional non-EVM chains
// Note: Hyperliquid uses a special USDC token with 8 decimals at address 0x00000000000000000000000000000000
const RELAY_SUPPORTED_CHAINS = [
  ...BUNGEE_SUPPORTED_CHAINS, // Includes Bungee's chain IDs
  SOLANA_CHAIN_ID, // Relay uses native Solana chain ID (792703809), Bungee uses 89999
  TRON_CHAIN_ID, // Only Relay supports Tron
  HYPEREVM_CHAIN_ID, // HyperEVM (999) - Relay supports this, Bungee does not
  HYPERLIQUID_CHAIN_ID, // Hyperliquid (1337) - Relay supports with special USDC token
  // Additional chains that Relay supports but Bungee doesn't
  480, // World Chain
  1301, // Unichain
  33139, // Ape Chain
  80084, // Berachain testnet (bArtio)
  8333, // B3
];

// Default bridge configuration
const DEFAULT_BRIDGE_CONFIG: BridgeConfig = {
  providers: {
    [BridgeProvider.RELAY]: {
      provider: BridgeProvider.RELAY,
      enabled: true,
      priority: 1, // Primary provider
      supportedChains: {
        origins: RELAY_SUPPORTED_CHAINS,
        destinations: RELAY_SUPPORTED_CHAINS,
        restrictions: {
          minAmountUsd: 1,
          maxAmountUsd: 1000000, // 1M USD limit
        },
      },
      capabilities: {
        supportsERC4337: true,
        supportsGasSponsorship: true,
        supportsPartialFill: true,
        maxTransactionValueUsd: 1000000,
        minTransactionValueUsd: 1,
        supportedFeatures: ['cross-chain', 'non-evm', 'solana', 'tron'],
      },
      timeouts: {
        quoteTimeoutMs: 10000, // 10 seconds
        executionTimeoutMs: 120000, // 2 minutes
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 1.5,
        baseDelayMs: 1000,
      },
      apiConfig: {
        // Relay uses Reservoir SDK - no API key needed
        baseUrl: 'https://api.relay.link',
      },
    },
    
    [BridgeProvider.BUNGEE]: {
      provider: BridgeProvider.BUNGEE,
      enabled: true,
      priority: 2, // Fallback provider for EVM chains
      supportedChains: {
        origins: BUNGEE_SUPPORTED_CHAINS,
        destinations: BUNGEE_SUPPORTED_CHAINS,
        restrictions: {
          minAmountUsd: 1,
          maxAmountUsd: 500000,
        },
      },
      capabilities: {
        supportsERC4337: true,
        supportsGasSponsorship: true,
        supportsPartialFill: true,
        maxTransactionValueUsd: 500000,
        minTransactionValueUsd: 1,
        supportedFeatures: ['evm-optimized', 'competitive-rates'],
      },
      timeouts: {
        quoteTimeoutMs: 8000,
        executionTimeoutMs: 100000,
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 1.8,
        baseDelayMs: 1200,
      },
      apiConfig: {
        apiKey: import.meta.env.VITE_SOCKET_API_KEY,
        baseUrl: 'https://api.socket.tech/v2',
        rateLimit: {
          requestsPerSecond: 10,
          burstLimit: 15,
        },
      },
    },
  },
  
  fallbackEnabled: import.meta.env.VITE_BRIDGE_FALLBACK_ENABLED !== 'false',
  
  monitoring: {
    metricsRetentionDays: 7,
    performanceThresholds: {
      minSuccessRate: 85, // 85% minimum success rate
      maxExecutionTimeMs: 120000, // 2 minutes max
      maxCostUsd: 10, // $10 max cost
    },
  },
  
  defaults: {
    primaryProvider: BridgeProvider.RELAY,
    fallbackProvider: BridgeProvider.BUNGEE,
    enableAutoFallback: true,
    maxProvidersToTry: 3,
  },
};

// Export final configuration
export const BRIDGE_CONFIG = DEFAULT_BRIDGE_CONFIG;

// Utility functions for provider selection
export const getEnabledProviders = (): BridgeProvider[] => {
  return Object.values(BridgeProvider).filter(
    provider => BRIDGE_CONFIG.providers[provider].enabled
  );
};

export const getProvidersForChainPair = (fromChain: number, toChain: number): BridgeProvider[] => {
  return getEnabledProviders().filter(provider => {
    const config = BRIDGE_CONFIG.providers[provider];
    
    // Handle Solana chain ID mapping (internal 792703809 vs Bungee's 89999)
    const normalizeChainId = (chainId: number): number => {
      if (chainId === SOLANA_CHAIN_ID) {
        // For Bungee, check if 89999 is in the supported list
        if (provider === BridgeProvider.BUNGEE) {
          return 89999;
        }
      }
      return chainId;
    };
    
    const normalizedFromChain = normalizeChainId(fromChain);
    const normalizedToChain = normalizeChainId(toChain);
    
    return (
      config.supportedChains.origins.includes(normalizedFromChain) &&
      config.supportedChains.destinations.includes(normalizedToChain)
    );
  });
};

export const isChainPairSupported = (fromChain: number, toChain: number): boolean => {
  return getProvidersForChainPair(fromChain, toChain).length > 0;
};

export const getProviderPriority = (provider: BridgeProvider): number => {
  return BRIDGE_CONFIG.providers[provider].priority;
};

export const sortProvidersByPriority = (providers: BridgeProvider[]): BridgeProvider[] => {
  return providers.sort((a, b) => getProviderPriority(a) - getProviderPriority(b));
};

// Simple provider selection based on config and chain support
export const getProviderForRoute = (fromChain: number, toChain: number): BridgeProviderSelection => {
  const supportedProviders = getProvidersForChainPair(fromChain, toChain);
  
  if (supportedProviders.length === 0) {
    throw new Error(`No bridge providers support route ${fromChain} → ${toChain}`);
  }
  
  // Special case: Prefer Relay for same-chain swaps (better DEX aggregation)
  const isSameChainSwap = fromChain === toChain;
  if (isSameChainSwap && supportedProviders.includes(BridgeProvider.RELAY)) {
    return {
      primary: BridgeProvider.RELAY,
      fallback: supportedProviders.filter(p => p !== BridgeProvider.RELAY),
      reasoning: [`Using Relay for same-chain swap (DEX aggregation)`],
    };
  }
  
  // Special case: Prefer Relay for Solana routes (better native support)
  const involvesSolana = fromChain === SOLANA_CHAIN_ID || toChain === SOLANA_CHAIN_ID;
  if (involvesSolana && supportedProviders.includes(BridgeProvider.RELAY)) {
    return {
      primary: BridgeProvider.RELAY,
      fallback: supportedProviders.filter(p => p !== BridgeProvider.RELAY),
      reasoning: [`Using Relay for Solana route (native support)`],
    };
  }
  
  const primaryProvider = BRIDGE_CONFIG.defaults.primaryProvider;
  const fallbackProvider = BRIDGE_CONFIG.defaults.fallbackProvider;
  
  // Check if primary provider supports this route
  if (supportedProviders.includes(primaryProvider)) {
    const fallbacks = supportedProviders.filter(p => p !== primaryProvider);
    return {
      primary: primaryProvider,
      fallback: fallbacks,
      reasoning: [`Using configured primary provider: ${primaryProvider}`],
    };
  }
  
  // If primary doesn't support, try fallback
  if (supportedProviders.includes(fallbackProvider)) {
    return {
      primary: fallbackProvider,
      fallback: supportedProviders.filter(p => p !== fallbackProvider),
      reasoning: [`Primary provider ${primaryProvider} not supported, using fallback: ${fallbackProvider}`],
    };
  }
  
  // Use first supported provider
  const primary = supportedProviders[0];
  return {
    primary,
    fallback: supportedProviders.slice(1),
    reasoning: [`Using first supported provider: ${primary}`],
  };
};

// Helper function to determine if a chain pair requires special handling
export const isSpecialChainPair = (fromChain: number, toChain: number): boolean => {
  const specialChains = [SOLANA_CHAIN_ID, TRON_CHAIN_ID, HYPEREVM_CHAIN_ID, HYPERLIQUID_CHAIN_ID];
  return specialChains.includes(fromChain) || specialChains.includes(toChain);
};