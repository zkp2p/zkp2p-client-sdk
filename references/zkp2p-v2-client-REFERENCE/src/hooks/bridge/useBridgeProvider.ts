import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { isAddress } from 'viem';
import type { Execute, GetPriceParameters, GetQuoteParameters, ProgressData } from '@reservoir0x/relay-sdk';
import { 
  BridgeProvider, 
  BridgeProviderSelection,
  UnifiedBridgeProvider,
  BridgeExecutionContext,
  BridgeAttemptMetadata
} from '@helpers/types/bridge';
import { BRIDGE_CONFIG, getProviderForRoute, getProvidersForChainPair } from '@helpers/bridgeConfig';
import { useBridgeMonitoring } from './useBridgeMonitoring';
import { categorizeBridgeError, getBridgeErrorMessage, BridgeErrorType } from '@helpers/bridgeErrors';
import { ErrorCategory } from '@helpers/types/errors';
import { useErrorLogger } from '@hooks/useErrorLogger';
import { 
  SOLANA_CHAIN_ID, 
  HYPERLIQUID_CHAIN_ID, 
  HYPERLIQUID_USDC_ADDRESS 
} from '@helpers/constants';

// Import existing provider hooks
import useRelayBridge from './useRelayBridge';
import useBungeeExchange from './useBungeeExchange';

/**
 * Special case handlers for chain-specific logic
 * These are centralized here to avoid duplication across different flows
 */

// Normalize chain IDs for provider-specific mappings
export const normalizeChainIdForProvider = (chainId: number, provider: BridgeProvider): number => {
  // Bungee uses chain ID 89999 for Solana, while we use 792703809 internally
  if (chainId === SOLANA_CHAIN_ID && provider === BridgeProvider.BUNGEE) {
    return 89999;
  }
  return chainId;
};

// Get the correct token address for special chains
export const getTokenAddressForChain = (chainId: number, defaultAddress: string): string => {
  // Hyperliquid uses a special USDC token with 8 decimals at address 0x0000...
  if (chainId === HYPERLIQUID_CHAIN_ID) {
    return HYPERLIQUID_USDC_ADDRESS;
  }
  return defaultAddress;
};

// Check if a provider supports special chains with their requirements
export const providerSupportsSpecialChain = (provider: BridgeProvider, chainId: number): boolean => {
  // Hyperliquid is only supported by Relay
  if (chainId === HYPERLIQUID_CHAIN_ID) {
    return provider === BridgeProvider.RELAY;
  }
  
  // Solana is supported by both Relay and Bungee (with different chain IDs)
  if (chainId === SOLANA_CHAIN_ID) {
    return provider === BridgeProvider.RELAY || provider === BridgeProvider.BUNGEE;
  }
  
  return true; // Other chains don't have special provider restrictions
};

// Transform parameters for special chains before passing to providers
export const transformParamsForProvider = (
  params: GetPriceParameters | GetQuoteParameters,
  provider: BridgeProvider
): any => {
  const transformed = { ...params };
  
  // Normalize chain IDs
  if ('originChainId' in transformed) {
    transformed.originChainId = normalizeChainIdForProvider(transformed.originChainId, provider);
  }
  if ('destinationChainId' in transformed) {
    transformed.destinationChainId = normalizeChainIdForProvider(transformed.destinationChainId, provider);
  }
  if ('chainId' in transformed) {
    transformed.chainId = normalizeChainIdForProvider(transformed.chainId, provider);
  }
  if ('toChainId' in transformed) {
    transformed.toChainId = normalizeChainIdForProvider(transformed.toChainId, provider);
  }
  
  // Handle special token addresses - check original chain IDs before transformation
  if ('destinationCurrency' in params && 'destinationChainId' in params && params.destinationChainId === HYPERLIQUID_CHAIN_ID) {
    (transformed as any).destinationCurrency = HYPERLIQUID_USDC_ADDRESS;
  }
  if ('toCurrency' in params && 'toChainId' in params && params.toChainId === HYPERLIQUID_CHAIN_ID) {
    (transformed as any).toCurrency = HYPERLIQUID_USDC_ADDRESS;
  }
  
  return transformed;
};

interface UseBridgeProviderOptions {
  enableFallback?: boolean;
  maxRetries?: number;
  onProviderSwitch?: (from: BridgeProvider, to: BridgeProvider, reason: string) => void;
  onProgress?: (progress: ProgressData & { provider: BridgeProvider }) => void;
}

interface BridgeProviderHookResult {
  // Core functionality
  getPrice: (params: GetPriceParameters) => Promise<any | null>;
  getQuote: (params: GetQuoteParameters) => Promise<Execute | null>;
  executeQuote: (quote: Execute, onProgress?: (progress: ProgressData) => void) => Promise<any>;
  
  // Provider selection
  selectProvider: (params: { fromChainId: number; toChainId: number }) => BridgeProviderSelection;
  getCurrentProvider: () => BridgeProvider | null;
  getAvailableProviders: (fromChain: number, toChain: number) => BridgeProvider[];
  
  // Status and metadata
  isLoading: boolean;
  error: Error | null;
  lastAttemptProvider: BridgeProvider | null;
  fallbackAttempts: Array<{ provider: BridgeProvider; reason: string; timestamp: number }>;
  
  // Health checks
  checkProviderHealth: (provider: BridgeProvider) => Promise<boolean>;
}

export default function useBridgeProvider(options: UseBridgeProviderOptions = {}): BridgeProviderHookResult {
  const {
    enableFallback = BRIDGE_CONFIG.defaults.enableAutoFallback,
    maxRetries = BRIDGE_CONFIG.defaults.maxProvidersToTry,
    onProviderSwitch,
    onProgress
  } = options;

  // Bridge monitoring integration
  const { 
    startBridgeAttempt, 
    updateBridgeAttempt, 
    completeBridgeAttempt, 
    failBridgeAttempt
  } = useBridgeMonitoring();
  
  const { logError } = useErrorLogger();

  // Individual provider hooks
  const relayBridge = useRelayBridge();
  const bungeeBridge = useBungeeExchange();

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentProvider, setCurrentProvider] = useState<BridgeProvider | null>(null);
  const [lastAttemptProvider, setLastAttemptProvider] = useState<BridgeProvider | null>(null);
  const [fallbackAttempts, setFallbackAttempts] = useState<Array<{ provider: BridgeProvider; reason: string; timestamp: number }>>([]);

  // Execution context for tracking
  const executionContext = useRef<BridgeExecutionContext | null>(null);

  // Provider hook mapping - use stable ref without dependencies to prevent memory leaks
  // The hooks themselves are stable and don't need to be re-assigned
  const providerHooksRef = useRef<Record<BridgeProvider, any> | null>(null);
  
  // Initialize only once to prevent memory leaks from constant re-creation
  if (!providerHooksRef.current) {
    providerHooksRef.current = {
      [BridgeProvider.RELAY]: relayBridge,
      [BridgeProvider.BUNGEE]: bungeeBridge,
    };
  }
  
  // Update the ref values directly without effect to maintain fresh references
  // This avoids the memory leak while keeping the references current
  providerHooksRef.current[BridgeProvider.RELAY] = relayBridge;
  providerHooksRef.current[BridgeProvider.BUNGEE] = bungeeBridge;

  // Get unified provider interface for a specific provider
  const getProviderInterface = useCallback((provider: BridgeProvider): UnifiedBridgeProvider => {
    const hook = providerHooksRef.current?.[provider];
    
    // Create adapters for different provider interfaces  
    const createProviderInterface = (provider: BridgeProvider, hook: any): UnifiedBridgeProvider => {
      // Each provider has its own method naming convention
      
      if (provider === BridgeProvider.RELAY) {
        return {
          name: provider,
          getPrice: async (params: GetPriceParameters) => {
            const transformedParams = transformParamsForProvider(params, provider);
            return hook.getRelayPrice(transformedParams);
          },
          getQuote: async (params: GetQuoteParameters) => {
            const transformedParams = transformParamsForProvider(params, provider);
            return hook.getRelayQuote(transformedParams);
          },
          execute: hook.executeRelayQuote,
          isSupported: (fromChain: number, toChain: number) => {
            // Check special chain support first
            if (!providerSupportsSpecialChain(provider, fromChain) || 
                !providerSupportsSpecialChain(provider, toChain)) {
              return false;
            }
            
            // Then check config with normalized chain IDs
            const config = BRIDGE_CONFIG.providers[provider];
            const normalizedFromChain = normalizeChainIdForProvider(fromChain, provider);
            const normalizedToChain = normalizeChainIdForProvider(toChain, provider);
            
            return config.enabled && 
                   config.supportedChains.origins.includes(normalizedFromChain) &&
                   config.supportedChains.destinations.includes(normalizedToChain);
          },
          getCapabilities: () => BRIDGE_CONFIG.providers[provider].capabilities,
          isHealthy: async () => {
            try {
              return BRIDGE_CONFIG.providers[provider].enabled;
            } catch {
              return false;
            }
          },
          getEstimatedGasCost: async () => null,
        };
      } else if (provider === BridgeProvider.BUNGEE) {
        return {
          name: provider,
          getPrice: async (params: GetPriceParameters) => {
            const transformedParams = transformParamsForProvider(params, provider);
            return hook.getBungeePrice(transformedParams);
          },
          getQuote: async (params: GetQuoteParameters) => {
            const transformedParams = transformParamsForProvider(params, provider);
            return hook.getBungeeQuote(transformedParams);
          },
          execute: hook.executeBungeeQuote,
          isSupported: (fromChain: number, toChain: number) => {
            // Check special chain support first
            if (!providerSupportsSpecialChain(provider, fromChain) || 
                !providerSupportsSpecialChain(provider, toChain)) {
              return false;
            }
            
            // Then check config with normalized chain IDs
            const config = BRIDGE_CONFIG.providers[provider];
            const normalizedFromChain = normalizeChainIdForProvider(fromChain, provider);
            const normalizedToChain = normalizeChainIdForProvider(toChain, provider);
            
            return config.enabled && 
                   config.supportedChains.origins.includes(normalizedFromChain) &&
                   config.supportedChains.destinations.includes(normalizedToChain);
          },
          getCapabilities: () => BRIDGE_CONFIG.providers[provider].capabilities,
          isHealthy: async () => {
            try {
              return BRIDGE_CONFIG.providers[provider].enabled;
            } catch {
              return false;
            }
          },
          getEstimatedGasCost: async () => null,
        };
      } else {
        throw new Error(`Unknown bridge provider: ${provider}`);
      }
    };
    
    return createProviderInterface(provider, hook);
  }, []); // No dependencies needed as we use providerHooksRef

  // Provider selection logic
  const selectProvider = useCallback((params: { fromChainId: number; toChainId: number }): BridgeProviderSelection => {
    return getProviderForRoute(params.fromChainId, params.toChainId);
  }, []);

  // Get available providers for a chain pair
  const getAvailableProviders = useCallback((fromChain: number, toChain: number): BridgeProvider[] => {
    return getProvidersForChainPair(fromChain, toChain);
  }, []);

  // Check if provider supports the route
  const isProviderSupported = useCallback((provider: BridgeProvider, fromChain: number, toChain: number): boolean => {
    const providerInterface = getProviderInterface(provider);
    return providerInterface.isSupported(fromChain, toChain);
  }, [getProviderInterface]);

  // Determine if we should try fallback
  const shouldTryFallback = useCallback((error: Error, provider: BridgeProvider, attemptCount: number): boolean => {
    if (!enableFallback || attemptCount >= maxRetries) {
      return false;
    }

    const errorType = categorizeBridgeError(error);
    
    // Immediate fallback conditions - use simplified error types
    const immediateFailoverErrors = [
      BridgeErrorType.NO_ROUTES,
      BridgeErrorType.NETWORK_ERROR,
    ];

    return immediateFailoverErrors.includes(errorType);
  }, [enableFallback, maxRetries]);

  // Execute with fallback logic
  const executeWithFallback = useCallback(async <T>(
    operation: (provider: UnifiedBridgeProvider) => Promise<T | null>,
    params: { fromChainId: number; toChainId: number; token?: string },
    operationType: 'QUOTE_FETCH' | 'TRANSACTION_EXECUTION'
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    const selection = selectProvider(params);
    console.log(`[BRIDGE] Provider selection for ${params.fromChainId} → ${params.toChainId}:`, {
      primary: selection.primary,
      fallback: selection.fallback,
      reasoning: selection.reasoning
    });
    const providersToTry = [selection.primary, ...selection.fallback];
    
    // Create execution context
    executionContext.current = {
      sessionId: `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      provider: selection.primary,
      fallbackAttempts: [],
      chainData: {
        fromChain: params.fromChainId,
        toChain: params.toChainId,
        fromToken: params.token || '',
        toToken: params.token || ''
      },
    };

    let lastError: Error | null = null;
    let attemptCount = 0;

    for (const provider of providersToTry) {
      if (attemptCount >= maxRetries) break;
      
      attemptCount++;
      setCurrentProvider(provider);
      setLastAttemptProvider(provider);

      // Check if this provider supports the route
      const providerSupported = isProviderSupported(provider, params.fromChainId, params.toChainId);
      console.log(`[BRIDGE] Checking ${provider} support for ${params.fromChainId} → ${params.toChainId}: ${providerSupported}`);
      
      if (!providerSupported) {
        const skipReason = `Provider ${provider} does not support route ${params.fromChainId} → ${params.toChainId}`;
        console.log(`[BRIDGE] Skipping: ${skipReason}`);
        
        if (provider !== selection.primary) {
          setFallbackAttempts(prev => [...prev, {
            provider,
            reason: skipReason,
            timestamp: Date.now(),
          }]);
        }
        continue;
      }

      const providerInterface = getProviderInterface(provider);
      
      // Start monitoring attempt
      const attemptMetadata = {
        fromChain: params.fromChainId,
        toChain: params.toChainId,
        fromToken: params.token,
        toToken: params.token,
        amount: '0', // Will be filled by actual implementation
        recipient: '0x0000000000000000000000000000000000000000', // Will be filled by actual implementation
      };

      const attemptId = startBridgeAttempt(provider, operationType, attemptMetadata);

      try {
        console.log(`[BRIDGE] Attempting ${operationType} with ${provider} (attempt ${attemptCount})`);
        
        const result = await operation(providerInterface);
        
        // Check if the provider returned null (no routes available)
        if (result === null) {
          console.log(`[BRIDGE] ${provider} returned null (no routes available)`);
          
          // Complete the attempt as it technically succeeded
          completeBridgeAttempt(attemptId, {});
          
          // Treat null as a reason to try fallback
          const noRoutesError = new Error(`${provider}: No routes available`);
          lastError = noRoutesError;
          
          // Record fallback attempt if not primary
          if (provider !== selection.primary) {
            setFallbackAttempts(prev => [...prev, {
              provider,
              reason: noRoutesError.message,
              timestamp: Date.now(),
            }]);
          }
          
          // Check if we should try fallback
          const nextProvider = providersToTry[attemptCount];
          if (nextProvider && attemptCount < maxRetries) {
            console.log(`[BRIDGE] No routes from ${provider}, trying fallback ${nextProvider}`);
            
            // Update execution context
            if (executionContext.current) {
              executionContext.current.fallbackAttempts?.push({
                provider,
                reason: 'No routes available',
                timestamp: Date.now(),
              });
            }
            
            // Notify about provider switch
            onProviderSwitch?.(provider, nextProvider, 'No routes available');
            
            continue; // Try next provider
          } else {
            // No more providers to try, return null
            setIsLoading(false);
            return null;
          }
        }
        
        // Success - complete monitoring
        completeBridgeAttempt(attemptId, {});
        
        // Keep the provider set on success (don't clear it)
        // This ensures the provider is available when the quote is used
        setIsLoading(false);
        return result;

      } catch (err) {
        const error = err as Error;
        lastError = error;
        
        console.error(`[BRIDGE] ${provider} failed for ${operationType}:`, error);
        
        const errorType = categorizeBridgeError(error);
        const errorMessage = getBridgeErrorMessage(error, { 
          bridgeProvider: provider === 'BUNGEE' ? 'bungee' : 'relay',
          transactionType: operationType === 'QUOTE_FETCH' ? 'quote' : 'execute',
        });
        
        // Log error with monitoring
        failBridgeAttempt(attemptId, {
          code: error.name || 'UNKNOWN_ERROR',
          message: error.message,
          category: ErrorCategory.BRIDGE_ERROR,
        });

        // Log to error tracking  
        logError(error.message, ErrorCategory.BRIDGE_ERROR, {
          bridgeProvider: provider.toLowerCase() as any,
          retryCount: attemptCount,
          transactionType: operationType.toLowerCase() as any,
        });

        // Record fallback attempt if not primary
        if (provider !== selection.primary) {
          setFallbackAttempts(prev => [...prev, {
            provider,
            reason: error.message,
            timestamp: Date.now(),
          }]);
        }

        // Check if we should try fallback
        if (shouldTryFallback(error, provider, attemptCount)) {
          const nextProvider = providersToTry[attemptCount];
          if (nextProvider) {
            console.log(`[BRIDGE] Falling back from ${provider} to ${nextProvider}: ${error.message}`);
            
            // Update execution context
            if (executionContext.current) {
              executionContext.current.fallbackAttempts?.push({
                provider,
                reason: error.message,
                timestamp: Date.now(),
              });
            }

            // Notify about provider switch
            onProviderSwitch?.(provider, nextProvider, error.message);
            
            continue; // Try next provider
          }
        }

        // If this was the last provider or no fallback, break
        break;
      }
    }

    // All providers failed
    setIsLoading(false);
    setError(lastError);
    // Don't clear currentProvider here - keep the last attempted provider for reference
    
    if (lastError) {
      throw lastError;
    } else {
      const error = new Error('All bridge providers failed');
      logError(error.message, ErrorCategory.BRIDGE_ERROR, {
        bridgeProvider: 'all',
        transactionType: operationType.toLowerCase() as any,
        attemptCount: attemptCount,
      });
      throw error;
    }
  }, [
    selectProvider, 
    maxRetries, 
    isProviderSupported, 
    getProviderInterface, 
    shouldTryFallback, 
    startBridgeAttempt, 
    completeBridgeAttempt, 
    failBridgeAttempt, 
    logError, 
    onProviderSwitch
  ]);

  // Get price with fallback
  const getPrice = useCallback(async (params: GetPriceParameters): Promise<any | null> => {
    const selectionParams = {
      fromChainId: params.originChainId,
      toChainId: params.destinationChainId,
      token: 'USDC',
    };

    return executeWithFallback(
      async (provider) => provider.getPrice(params),
      selectionParams,
      'QUOTE_FETCH'
    );
  }, [executeWithFallback]);

  // Get quote with fallback
  const getQuote = useCallback(async (params: GetQuoteParameters): Promise<Execute | null> => {
    const selectionParams = {
      fromChainId: params.chainId,
      toChainId: params.toChainId || params.chainId,
      token: 'USDC',
    };

    return executeWithFallback(
      async (provider) => provider.getQuote(params),
      selectionParams,
      'QUOTE_FETCH'
    );
  }, [executeWithFallback]);

  // Execute quote with fallback
  const executeQuote = useCallback(async (
    quote: Execute, 
    progressCallback?: (progress: ProgressData) => void
  ): Promise<any> => {
    // Extract chain parameters from quote details
    // The Execute quote contains chain info in details.currencyIn/Out.currency.chainId
    const fromChainId = quote.details?.currencyIn?.currency?.chainId || 8453; // Fallback to Base if not found
    const toChainId = quote.details?.currencyOut?.currency?.chainId || 8453; // Fallback to Base if not found
    
    const selectionParams = {
      fromChainId,
      toChainId,
      token: 'USDC',
    };

    console.log(`[BRIDGE] Executing quote with chains ${fromChainId} → ${toChainId}`);

    return executeWithFallback(
      async (provider) => {
        // Wrap progress callback to include provider info
        const wrappedProgressCallback = progressCallback ? (progress: ProgressData) => {
          onProgress?.({ ...progress, provider: provider.name });
          progressCallback(progress);
        } : undefined;

        return provider.execute(quote, wrappedProgressCallback);
      },
      selectionParams,
      'TRANSACTION_EXECUTION'
    );
  }, [executeWithFallback, onProgress]);

  // Health check for specific provider
  const checkProviderHealth = useCallback(async (provider: BridgeProvider): Promise<boolean> => {
    try {
      const providerInterface = getProviderInterface(provider);
      return await providerInterface.isHealthy();
    } catch (error) {
      console.error(`Health check failed for ${provider}:`, error);
      return false;
    }
  }, [getProviderInterface]);

  // Get current provider
  const getCurrentProvider = useCallback(() => currentProvider, [currentProvider]);

  // Clear state when component unmounts or resets
  useEffect(() => {
    return () => {
      setCurrentProvider(null);
      setLastAttemptProvider(null);
      setFallbackAttempts([]);
      setError(null);
      executionContext.current = null;
    };
  }, []);

  return {
    // Core functionality
    getPrice,
    getQuote,
    executeQuote,
    
    // Provider selection
    selectProvider,
    getCurrentProvider,
    getAvailableProviders,
    
    // Status and metadata
    isLoading,
    error,
    lastAttemptProvider,
    fallbackAttempts,
    
    // Health checks
    checkProviderHealth,
  };
}