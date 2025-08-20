import type { Execute, GetPriceParameters, GetQuoteParameters, ProgressData } from '@reservoir0x/relay-sdk';

// Bridge provider identifiers
export enum BridgeProvider {
  RELAY = 'RELAY',
  BUNGEE = 'BUNGEE'
}

// Bridge provider capabilities
export interface BridgeProviderCapabilities {
  supportsERC4337: boolean;
  supportsGasSponsorship: boolean;
  supportsPartialFill: boolean;
  maxTransactionValueUsd?: number;
  minTransactionValueUsd?: number;
  supportedFeatures: string[];
}

// Chain support configuration
export interface ChainSupport {
  origins: number[];
  destinations: number[];
  crossChainPairs?: Array<{ from: number; to: number }>;
  restrictions?: {
    minAmountUsd?: number;
    maxAmountUsd?: number;
    supportedTokens?: string[];
    blockedTokens?: string[];
  };
}

// Provider-specific configuration
export interface BridgeProviderConfig {
  provider: BridgeProvider;
  enabled: boolean;
  priority: number; // 1 = highest priority
  supportedChains: ChainSupport;
  capabilities: BridgeProviderCapabilities;
  timeouts: {
    quoteTimeoutMs: number;
    executionTimeoutMs: number;
  };
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    baseDelayMs: number;
  };
  apiConfig?: {
    apiKey?: string;
    baseUrl?: string;
    rateLimit?: {
      requestsPerSecond: number;
      burstLimit: number;
    };
  };
}

// Overall bridge configuration
export interface BridgeConfig {
  providers: Record<BridgeProvider, BridgeProviderConfig>;
  fallbackEnabled: boolean;
  monitoring: {
    metricsRetentionDays: number;
    performanceThresholds: {
      minSuccessRate: number; // percentage (0-100)
      maxExecutionTimeMs: number;
      maxCostUsd: number;
    };
  };
  defaults: {
    primaryProvider: BridgeProvider;
    fallbackProvider: BridgeProvider;
    enableAutoFallback: boolean;
    maxProvidersToTry: number;
  };
}

// Provider selection result
export interface BridgeProviderSelection {
  primary: BridgeProvider;
  fallback: BridgeProvider[];
  reasoning: string[];
}

// Unified bridge provider interface
export interface UnifiedBridgeProvider {
  // Core functionality
  getPrice: (params: GetPriceParameters) => Promise<any | null>;
  getQuote: (params: GetQuoteParameters) => Promise<Execute | null>;
  execute: (quote: Execute, onProgress?: (progress: ProgressData) => void) => Promise<any>;
  
  // Provider metadata
  name: BridgeProvider;
  isSupported: (fromChain: number, toChain: number, token?: string) => boolean;
  getCapabilities: () => BridgeProviderCapabilities;
  
  // Health and status
  isHealthy: () => Promise<boolean>;
  getEstimatedGasCost: (fromChain: number, toChain: number) => Promise<string | null>;
}


// Bridge execution context
export interface BridgeExecutionContext {
  sessionId: string;
  timestamp: number;
  provider: BridgeProvider;
  fallbackAttempts?: Array<{
    provider: BridgeProvider;
    reason: string;
    timestamp: number;
  }>;
  userAgent?: string;
  chainData: {
    fromChain: number;
    toChain: number;
    fromToken: string;
    toToken: string;
  };
}

// Provider health check result
export interface ProviderHealthStatus {
  provider: BridgeProvider;
  isHealthy: boolean;
  lastChecked: number;
  responseTimeMs?: number;
  errorMessage?: string;
  metrics: {
    uptime: number; // percentage
    avgResponseTime: number; // ms
    errorRate: number; // percentage
  };
}

// Bridge monitoring integration types
export interface BridgeAttemptMetadata {
  provider: BridgeProvider;
  isFallback: boolean;
  attemptNumber: number;
  selectionReason: string[];
  alternativesConsidered: BridgeProvider[];
  executionContext: BridgeExecutionContext;
}