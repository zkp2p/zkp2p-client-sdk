import { useCallback, useRef, useState, useEffect } from 'react'
import { Execute, getClient, GetPriceParameters, GetQuoteParameters, ProgressData } from '@reservoir0x/relay-sdk'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { createWalletClient, custom, type WalletClient, type Address } from 'viem'
import { usePublicClient } from 'wagmi'
import { getDynamicGasPricing } from '@helpers/gas'
import { useBridgeMonitoring } from './useBridgeMonitoring'
import { useErrorLogger } from '@hooks/useErrorLogger'
import { categorizeBridgeError, getBridgeErrorMessage, BridgeErrorType } from '@helpers/bridgeErrors'
import { ErrorCategory } from '@helpers/types/errors'
import useSmartAccount from '@hooks/contexts/useSmartAccount'

// Relay Status API types
interface RelayStatusResponse {
  status: 'refund' | 'delayed' | 'waiting' | 'failure' | 'pending' | 'success';
  details?: string;
  inTxHashes: string[];      // Source chain transactions
  txHashes: string[];         // Destination chain transactions
  time: number;               // Last update timestamp
  originChainId: number;
  destinationChainId: number;
}

interface PollOptions {
  maxAttempts?: number;
  intervalMs?: number;
  backoffMultiplier?: number;
  maxInterval?: number;
}

// Polling configuration constants
const POLLING_CONFIG = {
  MAX_ATTEMPTS: 60,        // 60 attempts = 10 minutes max with initial 3s interval
  INITIAL_INTERVAL: 3000,  // Start with 3 seconds
  BACKOFF_MULTIPLIER: 1.5, // Progressive backoff: 3s -> 4.5s -> 6.75s -> 10s -> 15s -> 22.5s -> 30s
  MAX_INTERVAL: 30000,     // Cap at 30 seconds
} as const;

// Request deduplication configuration
const CACHE_CONFIG = {
  REQUEST_TTL: 5000,       // 5 seconds TTL for deduplication
} as const;

// Gas configuration for transactions
const GAS_CONFIG = {
  FALLBACK_PRIORITY_FEE: BigInt(2000000000), // 2 gwei fallback
  FALLBACK_MAX_FEE: BigInt(4000000000),      // 4 gwei fallback
  USER_OP_TIMEOUT: 120_000,                  // 2 minutes timeout for UserOperations
} as const;

export type ParsedQuoteData = {
  token: string;
  inAmountUsdcFormatted: string;
  outAmountFormatted: string;
  outAmountInUsd: string;
  recipientAddress: string;
  totalGasFeesInUsd: string;
  zkp2pFeeInUsd: string;
  relayerFeeInUsd: string;
  serviceTimeSeconds: number;
  totalFeesInUsd: string;
}

export const parseExecuteQuoteResponse = (quoteRes: Execute, to_token: string): ParsedQuoteData => {
  const inAmount = quoteRes.details?.currencyIn?.amountFormatted;
  const outAmount = quoteRes.details?.currencyOut?.amountFormatted;
  const outAmountInUsd = quoteRes.details?.currencyOut?.amountUsd;
  const serviceTimeSeconds = quoteRes.details?.timeEstimate ?? 0;
  const totalGasFeesInUsd = quoteRes.fees?.gas?.amountUsd ?? '0';
  const zkp2pFeeInUsd = quoteRes.fees?.app?.amountUsd ?? '0';
  const relayerFeeInUsd = quoteRes.fees?.relayer?.amountUsd ?? '0';

  return {
    token: to_token,
    inAmountUsdcFormatted: inAmount,
    outAmountFormatted: outAmount,
    outAmountInUsd: outAmountInUsd,
    recipientAddress: quoteRes.details?.recipient ?? '',
    totalGasFeesInUsd,
    zkp2pFeeInUsd,
    relayerFeeInUsd,
    serviceTimeSeconds,
  } as ParsedQuoteData;
}

type OnProgressCallback = (progress: ProgressData) => void;

export default function useRelayBridge() {
  const { wallets } = useWallets();
  const publicClient = usePublicClient();
  // Always prioritize embedded wallets over external wallets
  const activeWallet = wallets.find(wallet => wallet.walletClientType === 'privy') || wallets[0];
  const { logError } = useErrorLogger();
  const { kernelClient, isSmartAccountEnabled } = useSmartAccount();
  
  // Store AbortController for polling cleanup
  const pollingAbortControllerRef = useRef<AbortController | null>(null);
  
  // Request deduplication cache
  const requestCacheRef = useRef<Map<string, { promise: Promise<any>; timestamp: number }>>(new Map())

  /*
   * State
   */
  const [walletClient, setWalletClient] = useState<WalletClient | undefined>(undefined);
  const onProgressRef = useRef<OnProgressCallback | undefined>(undefined);
  
  // Bridge monitoring integration
  const {
    startBridgeAttempt,
    updateBridgeAttempt,
    completeBridgeAttempt,
    failBridgeAttempt,
    incrementRetryCount,
  } = useBridgeMonitoring();

  /**
   * Get dynamic gas pricing using shared utility
   */
  const getMinGasPrice = useCallback(async () => {
    const gasPricing = await getDynamicGasPricing(publicClient);
    return {
      priority: gasPricing.priority,
      max: gasPricing.max
    };
  }, [publicClient]);

  /**
   * Poll Relay Status API for bridge completion
   */
  const pollRelayBridgeStatus = useCallback(async (
    requestId: string,
    options: PollOptions & { signal?: AbortSignal } = {}
  ): Promise<RelayStatusResponse> => {
    const {
      maxAttempts = POLLING_CONFIG.MAX_ATTEMPTS,
      intervalMs = POLLING_CONFIG.INITIAL_INTERVAL,
      backoffMultiplier = POLLING_CONFIG.BACKOFF_MULTIPLIER,
      maxInterval = POLLING_CONFIG.MAX_INTERVAL,
      signal
    } = options;
    
    let attempts = 0;
    let currentInterval = intervalMs;
    
    const sleep = (ms: number) => new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);
      // Clean up timeout if aborted
      signal?.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('Polling aborted'));
      });
    });
    
    while (attempts < maxAttempts) {
      // Check if aborted before making request
      if (signal?.aborted) {
        throw new Error('Polling aborted');
      }
      
      try {
        const response = await fetch(
          `https://api.relay.link/intents/status/v2?requestId=${requestId}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            signal // Pass abort signal to fetch
          }
        );
        
        if (!response.ok) {
          throw new Error(`Status API error: ${response.statusText}`);
        }
        
        const status: RelayStatusResponse = await response.json();
        
        console.log('[RELAY] Status API response:', {
          status: status.status,
          sourceTxs: status.inTxHashes?.length || 0,
          destTxs: status.txHashes?.length || 0,
          attempt: attempts + 1
        });
        
        // Check for terminal states
        if (status.status === 'success' || status.status === 'failure' || status.status === 'refund') {
          return status;
        }
        
        // Wait and retry with backoff
        await sleep(currentInterval);
        currentInterval = Math.min(currentInterval * backoffMultiplier, maxInterval);
        attempts++;
      } catch (error: any) {
        // Categorize error types for appropriate handling
        const isAbortError = error.name === 'AbortError' || error.message === 'Polling aborted';
        const isNetworkError = error.name === 'NetworkError' || error.message?.includes('fetch');
        const isTimeoutError = error.name === 'TimeoutError';
        
        // Re-throw abort errors immediately
        if (isAbortError) {
          console.log('[RELAY] Status polling aborted');
          throw error;
        }
        
        // Log different error types with appropriate context
        if (isNetworkError) {
          console.warn('[RELAY] Network error during status polling, will retry:', error.message);
        } else if (isTimeoutError) {
          console.warn('[RELAY] Timeout during status polling, will retry');
        } else {
          console.error('[RELAY] Unexpected error during status polling:', error);
        }
        
        // Continue polling for recoverable errors
        await sleep(currentInterval);
        currentInterval = Math.min(currentInterval * backoffMultiplier, maxInterval);
        attempts++;
      }
    }
    
    throw new Error('Bridge status polling timeout');
  }, []);

  // Create a wallet client from the Privy wallet
  useEffect(() => {
    const createClient = async () => {
      if (!activeWallet) {
        setWalletClient(undefined);
        return;
      }

      try {
        const provider = await activeWallet.getEthereumProvider();
        const client = createWalletClient({
          account: activeWallet.address as `0x${string}`,
          transport: custom(provider),
        });
        setWalletClient(client);
      } catch (error) {
        console.error('Failed to create wallet client:', error);
        setWalletClient(undefined);
      }
    };

    createClient();
  }, [activeWallet]);

  /*
   * Effect
   */
  const getRelayPrice = useCallback(
    async (params: GetPriceParameters) => {
      // Generate cache key for deduplication
      const cacheKey = `price-${params.originChainId}-${params.destinationChainId}-${params.amount}-${params.originCurrency}-${params.destinationCurrency}`;
      
      // Check for existing in-flight request
      const cached = requestCacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_CONFIG.REQUEST_TTL) {
        console.log('[RELAY] Reusing in-flight price request:', cacheKey);
        return cached.promise;
      }
      
      // Clean up expired cache entries
      for (const [key, value] of requestCacheRef.current.entries()) {
        if (Date.now() - value.timestamp > CACHE_CONFIG.REQUEST_TTL) {
          requestCacheRef.current.delete(key);
        }
      }
      
      // Create new request promise
      const requestPromise = (async () => {
        // Start monitoring for price fetch
        const attemptId = startBridgeAttempt('RELAY', 'QUOTE_FETCH', {
          fromChain: params.originChainId,
          toChain: params.destinationChainId,
          fromToken: params.originCurrency,
          toToken: params.destinationCurrency,
          amount: params.amount || '',
          recipient: params.recipient || '',
        });

        try {
          // Quote fetched successfully

          const client = getClient();
          if (!client) throw new Error('Not initialized')

          const request: GetPriceParameters = {
            ...params,
            options: {
              appFees: [{
                recipient: '0x0bC26FF515411396DD588Abd6Ef6846E04470227', // ZKP2P SAFE
                fee: "0" // 0 bps
              }]
            } as any
          }

          const price = await client.actions.getPrice(request);
          
          // Complete monitoring with success
          completeBridgeAttempt(attemptId, {});
          
          return price
        } catch (err: any) {
        // Log error for monitoring
        failBridgeAttempt(attemptId, {
          code: err.message?.includes('No routes found') ? 'NO_ROUTES' : 'PRICE_FETCH_ERROR',
          message: err.message || 'Failed to fetch Relay price',
          category: ErrorCategory.BRIDGE_ERROR,
        });
        
        // "No routes found" should trigger fallback to another provider
        if (err.message?.includes('No routes found')) {
          console.log('Relay: No routes available for this token pair - will try fallback provider');
          throw new Error('No routes found');
        }
        
          console.error('Failed to fetch Relay price via SDK:', err)
          throw err
        } finally {
          // Clean up cache entry after completion
          requestCacheRef.current.delete(cacheKey);
        }
      })();
      
      // Store in cache for deduplication
      requestCacheRef.current.set(cacheKey, {
        promise: requestPromise,
        timestamp: Date.now(),
      });
      
      return requestPromise;
    },
    [startBridgeAttempt, updateBridgeAttempt, completeBridgeAttempt, failBridgeAttempt]
  )

  const getRelayQuote = useCallback(
    async (params: GetQuoteParameters, context?: { retryCount?: number; tokenSymbol?: string; networkName?: string }) => {
      // Generate cache key for deduplication
      const cacheKey = `quote-${params.chainId}-${params.toChainId}-${params.amount}-${params.currency}-${params.toCurrency}-${params.recipient}`;
      
      // Check for existing in-flight request
      const cached = requestCacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_CONFIG.REQUEST_TTL) {
        console.log('[RELAY] Reusing in-flight quote request:', cacheKey);
        return cached.promise;
      }
      
      // Clean up expired cache entries
      for (const [key, value] of requestCacheRef.current.entries()) {
        if (Date.now() - value.timestamp > CACHE_CONFIG.REQUEST_TTL) {
          requestCacheRef.current.delete(key);
        }
      }
      
      // Create new request promise
      const requestPromise = (async () => {
        // Start monitoring for quote fetch
        const attemptId = startBridgeAttempt('RELAY', 'QUOTE_FETCH', {
          fromChain: params.chainId,
          toChain: params.toChainId,
          fromToken: params.currency,
          toToken: params.toCurrency,
          amount: params.amount,
          recipient: params.recipient,
        });

        // Track retry count if provided
        if (context?.retryCount) {
          for (let i = 0; i < context.retryCount; i++) {
            incrementRetryCount(attemptId);
          }
        }

        try {
          // Quote fetched successfully

          const client = getClient();
          if (!client) throw new Error('Relay client not initialized');

          // Check if this is a Privy wallet that will use ERC-4337
          const isPrivyWallet = activeWallet?.walletClientType === 'privy';
          const willUseSmartAccount = isPrivyWallet && isSmartAccountEnabled && kernelClient;
        
        // Type-safe options with proper extension
        const quoteOptions: any = {
          referrer: 'zkp2p.xyz',
          appFees: [{
            recipient: '0x0bC26FF515411396DD588Abd6Ef6846E04470227', // ZKP2P SAFE
            fee: "0" // 0 bps
          }]
        };
        
        // Add userOperationGasOverhead only for smart accounts
        // This is a custom field not in standard types but accepted by API
        if (willUseSmartAccount) {
          quoteOptions.userOperationGasOverhead = 500000; // Higher overhead for ERC-4337
        } else {
          quoteOptions.userOperationGasOverhead = 300000; // Standard overhead
        }
        
        const request: GetQuoteParameters = {
          wallet: walletClient,
          chainId: params.chainId,
          toChainId: params.toChainId,
          amount: params.amount,
          currency: params.currency,
          toCurrency: params.toCurrency,
          tradeType: params.tradeType,
          recipient: params.recipient,
          options: quoteOptions
        }

        const quote = await client.actions.getQuote(request);
        
        // Extract cost information from quote if available
        const gasCostUsd = quote.fees?.gas?.amountUsd;
        const bridgeFeeUsd = quote.fees?.relayer?.amountUsd;
        
        completeBridgeAttempt(attemptId, {
          costs: {
            gasCostUsd,
            bridgeFeeUsd,
          },
        });

        return quote;
      } catch (err: any) {
        // Enhanced error categorization and logging
        const bridgeErrorMessage = getBridgeErrorMessage(err, {
          bridgeProvider: 'relay',
          retryCount: context?.retryCount,
          transactionType: 'quote',
          tokenSymbol: context?.tokenSymbol,
          networkName: context?.networkName,
        });

        // Log error for monitoring with enhanced categorization
        failBridgeAttempt(attemptId, {
          code: err.code || 'QUOTE_FETCH_ERROR',
          message: bridgeErrorMessage.title,
          category: bridgeErrorMessage.category,
        });

        // Log detailed error information
        logError(
          'Relay bridge quote fetch failed',
          ErrorCategory.BRIDGE_ERROR,
          {
            error: err?.message || err,
            errorStack: err?.stack,
            errorCode: err?.code,
            bridgeProvider: 'relay',
            retryCount: context?.retryCount || 0,
            tokenSymbol: context?.tokenSymbol,
            networkName: context?.networkName,
            bridgeErrorType: categorizeBridgeError(err),
            bridgeErrorSeverity: bridgeErrorMessage.severity,
            bridgeErrorCategory: bridgeErrorMessage.category,
            isRetryable: bridgeErrorMessage.isRetryable,
          }
        );

          console.error('Failed to fetch Relay quote via SDK:', err)
          throw err;
        } finally {
          // Clean up cache entry after completion
          requestCacheRef.current.delete(cacheKey);
        }
      })();
      
      // Store in cache for deduplication
      requestCacheRef.current.set(cacheKey, {
        promise: requestPromise,
        timestamp: Date.now(),
      });
      
      return requestPromise;
    },
    [walletClient, activeWallet, kernelClient, isSmartAccountEnabled, startBridgeAttempt, updateBridgeAttempt, completeBridgeAttempt, failBridgeAttempt, incrementRetryCount, logError]
  )

  const executeRelayQuote = useCallback(
    async (
      quote: Execute,
      onProgress?: OnProgressCallback,
      context?: { retryCount?: number }
    ) => {
      // Check if we should use smart account path for Privy wallets
      const isPrivyWallet = activeWallet?.walletClientType === 'privy';
      const shouldUseSmartAccount = isPrivyWallet && isSmartAccountEnabled && kernelClient;
      
      if (!walletClient && !shouldUseSmartAccount) {
        throw new Error('Wallet not connected');
      }

      // Start monitoring for transaction execution
      const attemptId = startBridgeAttempt('RELAY', 'TRANSACTION_EXECUTION', {
        fromChain: quote.details?.currencyIn?.currency?.chainId || 0,
        toChain: quote.details?.currencyOut?.currency?.chainId || 0,
        fromToken: quote.details?.currencyIn?.currency?.address || '',
        toToken: quote.details?.currencyOut?.currency?.address || '',
        amount: quote.details?.currencyIn?.amount || '',
        recipient: quote.details?.recipient,
      });

      // Track retry count if provided
      if (context?.retryCount) {
        for (let i = 0; i < context.retryCount; i++) {
          incrementRetryCount(attemptId);
        }
      }

      onProgressRef.current = onProgress;

      try {
        // Transaction sent successfully

        const client = getClient();

        // Get dynamic gas pricing based on network conditions
        let dynamicGasPrice;
        try {
          dynamicGasPrice = await getMinGasPrice();
          console.log('[RELAY] Using dynamic gas pricing:', {
            priority: dynamicGasPrice.priority.toString(),
            max: dynamicGasPrice.max.toString()
          });
        } catch (error) {
          console.error('[RELAY] Failed to get dynamic gas pricing, using fallback:', error);
          // Fallback to conservative values if dynamic pricing fails
          dynamicGasPrice = {
            priority: GAS_CONFIG.FALLBACK_PRIORITY_FEE,
            max: GAS_CONFIG.FALLBACK_MAX_FEE,
          };
        }

      // Check if we should use ERC-4337 path for Privy wallets
      if (shouldUseSmartAccount) {
        console.log('[RELAY] Using ERC-4337 path for Privy embedded wallet');
        
        // Extract transaction calls from the quote
        const calls: { to: Address; data?: `0x${string}`; value?: bigint }[] = [];
        
        // Parse the quote steps to extract transaction calls
        quote.steps?.forEach(step => {
          step.items?.forEach(item => {
            if (item.data?.to && item.data?.data) {
              calls.push({
                to: item.data.to as Address,
                data: item.data.data as `0x${string}`,
                value: item.data.value ? BigInt(item.data.value) : 0n,
              });
            }
          });
        });
        
        if (calls.length === 0) {
          throw new Error('No transaction calls found in relay quote');
        }
        
        console.log('[RELAY] Executing UserOperations:', calls);
        
        try {
          // Send UserOperation with the kernelClient
          const userOpHash = await kernelClient.sendUserOperation({
            calls,
          });
          
          console.log('[RELAY] UserOperation sent:', userOpHash);
          
          // Simulate progress updates for consistency with regular flow
          onProgress?.({
            steps: quote.steps || [],
            fees: quote.fees,
            details: quote.details,
            currentStepItem: { progressState: 'pending' },
            txHashes: [],
            userOpHash,
          } as any);
          
          // Wait for UserOperation receipt
          const receipt = await kernelClient.waitForUserOperationReceipt({
            hash: userOpHash,
            timeout: GAS_CONFIG.USER_OP_TIMEOUT,
          });
          
          console.log('[RELAY] UserOperation receipt:', receipt);
          
          if (!receipt.success) {
            throw new Error('UserOperation failed');
          }
          
          // Get the transaction hash from the receipt
          const txHash = receipt.receipt.transactionHash;
          const originChainId = quote.details?.currencyIn?.currency?.chainId || 0;
          const destChainId = quote.details?.currencyOut?.currency?.chainId || 0;
          
          // Extract requestId for status API polling
          let requestId: string | undefined;
          quote.steps?.forEach(step => {
            step.items?.forEach(item => {
              if ((item as any).check?.requestId) {
                requestId = (item as any).check.requestId;
              } else if ((item as any).requestId) {
                requestId = (item as any).requestId;
              } else if ((item as any).request_id) {
                requestId = (item as any).request_id;
              }
            });
          });
          
          console.log('[RELAY] Smart account requestId:', requestId);
          
          // Send initial progress update with source transaction
          onProgress?.({
            steps: quote.steps || [],
            fees: quote.fees,
            details: quote.details,
            currentStepItem: { progressState: 'pending' },
            txHashes: [{ txHash, chainId: originChainId }],
            userOpHash,
          } as any);
          
          // If we have a requestId, poll for actual completion status
          if (requestId) {
            try {
              const status = await pollRelayBridgeStatus(requestId, {
                maxAttempts: 120, // 10 minutes max
                intervalMs: 3000, // Start with 3 second intervals
              });
              
              if (status.status === 'success') {
                // Send final progress with actual transaction hashes from API
                onProgress?.({
                  steps: quote.steps || [],
                  fees: quote.fees,
                  details: quote.details,
                  currentStepItem: { progressState: 'complete' },
                  txHashes: [
                    ...status.inTxHashes.map(hash => ({ 
                      txHash: hash, 
                      chainId: status.originChainId 
                    })),
                    ...status.txHashes.map(hash => ({ 
                      txHash: hash, 
                      chainId: status.destinationChainId 
                    }))
                  ],
                  userOpHash,
                } as any);
                
                completeBridgeAttempt(attemptId, {});
                
                return {
                  userOpHash,
                  transactionHash: txHash,
                  success: true,
                  txHashes: [
                    ...status.inTxHashes.map(hash => ({ 
                      txHash: hash, 
                      chainId: status.originChainId 
                    })),
                    ...status.txHashes.map(hash => ({ 
                      txHash: hash, 
                      chainId: status.destinationChainId 
                    }))
                  ],
                };
              } else if (status.status === 'failure' || status.status === 'refund') {
                throw new Error(`Bridge ${status.status}: ${status.details || 'Unknown error'}`);
              }
            } catch (pollError) {
              console.error('[RELAY] Status polling failed for smart account:', pollError);
              // Fallback to SDK progress if polling fails
            }
          }
          
          // Fallback: return with only source transaction if polling fails
          completeBridgeAttempt(attemptId, {});
          
          return {
            userOpHash,
            transactionHash: txHash,
            success: true,
            txHashes: [{ txHash, chainId: originChainId }],
          };
        } catch (error) {
          console.error('[RELAY] ERC-4337 execution failed:', error);
          throw error;
        }
      }
      
      // Regular wallet client path (existing code)
      // First, try to extract requestId from quote steps
      let requestId: string | undefined;
      quote.steps?.forEach(step => {
        step.items?.forEach(item => {
          // The requestId might be in the check object or request_id field
          if ((item as any).check?.requestId) {
            requestId = (item as any).check.requestId;
          } else if ((item as any).requestId) {
            requestId = (item as any).requestId;
          } else if ((item as any).request_id) {
            requestId = (item as any).request_id;
          }
        });
      });
      
      console.log('[RELAY] Found requestId:', requestId);
      
      // Check if quote has steps with transaction items that need gas overrides
      const quoteWithMinGas = {
        ...quote,
        steps: quote.steps?.map(step => ({
          ...step,
          items: step.items?.map(item => {
            // Only modify transaction items with gas parameters
            if (item.data?.maxPriorityFeePerGas !== undefined) {
              const currentPriorityFee = BigInt(item.data.maxPriorityFeePerGas);
              const currentMaxFee = BigInt(item.data.maxFeePerGas || '0');

              // Use dynamic gas pricing instead of static values
              const requiredPriorityFee = dynamicGasPrice.priority;
              const requiredMaxFee = dynamicGasPrice.max;

              // Log if we're adjusting gas fees
              if (currentPriorityFee < requiredPriorityFee) {
                console.log('[RELAY] Adjusting low priority fee from', currentPriorityFee.toString(), 'to', requiredPriorityFee.toString());
              }
              if (currentMaxFee < requiredMaxFee) {
                console.log('[RELAY] Adjusting low max fee from', currentMaxFee.toString(), 'to', requiredMaxFee.toString());
              }

              return {
                ...item,
                data: {
                  ...item.data,
                  maxPriorityFeePerGas: currentPriorityFee < requiredPriorityFee
                    ? requiredPriorityFee.toString()
                    : item.data.maxPriorityFeePerGas,
                  maxFeePerGas: currentMaxFee < requiredMaxFee
                    ? requiredMaxFee.toString()
                    : item.data.maxFeePerGas
                }
              };
            }
            return item;
          })
        }))
      };

      const executeResult = await client.actions.execute({
        quote: quoteWithMinGas,
        wallet: walletClient!,
        onProgress: async (progress) => {
          onProgressRef.current?.(progress);
          onProgress?.(progress);
          
          // If we have a requestId and this is an embedded wallet, start polling
          if (requestId && activeWallet?.walletClientType === 'privy' && progress.txHashes && progress.txHashes.length > 0) {
            console.log('[RELAY] Starting status API polling for embedded wallet');
            
            // Clean up any existing polling
            if (pollingAbortControllerRef.current) {
              pollingAbortControllerRef.current.abort();
            }
            
            // Create new AbortController for this polling session
            const abortController = new AbortController();
            pollingAbortControllerRef.current = abortController;
            
            // Start polling in the background with abort signal
            pollRelayBridgeStatus(requestId, { signal: abortController.signal }).then(status => {
              // Safety check: Ensure component is still mounted and this is the current operation
              if (!abortController.signal.aborted && pollingAbortControllerRef.current === abortController) {
                if (status.status === 'success') {
                  // Send final progress update with actual tx hashes from API
                  const finalProgress: ProgressData = {
                    ...progress,
                    currentStepItem: { progressState: 'complete' } as any,
                    txHashes: [
                      ...status.inTxHashes.map(hash => ({ 
                        txHash: hash, 
                        chainId: status.originChainId 
                      })),
                      ...status.txHashes.map(hash => ({ 
                        txHash: hash, 
                        chainId: status.destinationChainId 
                      }))
                    ]
                  };
                  // Additional safety: Check refs are still valid before calling
                  if (onProgressRef.current) {
                    onProgressRef.current(finalProgress);
                  }
                  if (onProgress) {
                    onProgress(finalProgress);
                  }
                }
              }
              // Clear controller ref only if it's still the current one
              if (pollingAbortControllerRef.current === abortController) {
                pollingAbortControllerRef.current = null;
              }
            }).catch(error => {
              // Safety check: Only log if not aborted
              if (!abortController.signal.aborted) {
                if (error.message !== 'Polling aborted') {
                  console.error('[RELAY] Status polling failed:', error);
                }
              }
              // Clear controller ref only if it's still the current one
              if (pollingAbortControllerRef.current === abortController) {
                pollingAbortControllerRef.current = null;
              }
            });
          }
        },
      });
      
      return executeResult;
    } catch (err: any) {
      // Enhanced error categorization and logging
      const bridgeErrorMessage = getBridgeErrorMessage(err, {
        bridgeProvider: 'relay',
        retryCount: context?.retryCount,
        transactionType: 'execute',
      });

      // Log error for monitoring with enhanced categorization
      failBridgeAttempt(attemptId, {
        code: err.code || 'EXECUTION_ERROR',
        message: bridgeErrorMessage.title,
        category: bridgeErrorMessage.category,
      });

      // Log detailed error information
      logError(
        'Relay bridge execution failed',
        ErrorCategory.BRIDGE_ERROR,
        {
          error: err?.message || err,
          errorStack: err?.stack,
          errorCode: err?.code,
          bridgeProvider: 'relay',
          retryCount: context?.retryCount || 0,
          bridgeErrorType: categorizeBridgeError(err),
          bridgeErrorSeverity: bridgeErrorMessage.severity,
          bridgeErrorCategory: bridgeErrorMessage.category,
          isRetryable: bridgeErrorMessage.isRetryable,
          quoteDetails: {
            fromChain: quote.details?.currencyIn?.currency?.chainId,
            toChain: quote.details?.currencyOut?.currency?.chainId,
            fromToken: quote.details?.currencyIn?.currency?.address,
            toToken: quote.details?.currencyOut?.currency?.address,
            amount: quote.details?.currencyIn?.amount,
            recipient: quote.details?.recipient,
          },
        }
      );

      console.error('Failed to execute Relay quote:', err);
      throw err;
    }
  },
  [walletClient, kernelClient, activeWallet, isSmartAccountEnabled, getMinGasPrice, startBridgeAttempt, updateBridgeAttempt, completeBridgeAttempt, failBridgeAttempt, incrementRetryCount, pollRelayBridgeStatus]
);

  // Cleanup effect to abort polling on unmount
  useEffect(() => {
    return () => {
      if (pollingAbortControllerRef.current) {
        pollingAbortControllerRef.current.abort();
        pollingAbortControllerRef.current = null;
      }
    };
  }, []);

  return {
    getRelayPrice,
    getRelayQuote,
    executeRelayQuote,
  }
}