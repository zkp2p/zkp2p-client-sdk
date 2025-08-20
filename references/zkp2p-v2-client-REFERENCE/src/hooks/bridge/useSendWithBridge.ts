import { useCallback, useState, useRef, useEffect } from 'react';
import { type Address, isAddress } from 'viem';
import { useWallets } from '@privy-io/react-auth';
import useSendTransaction from '@hooks/transactions/useSendTransaction';
import useBridgeProvider from './useBridgeProvider';
import { TokenData } from '@helpers/types/tokens';
import { BASE_CHAIN_ID, BASE_USDC_ADDRESS, HYPERLIQUID_CHAIN_ID, HYPERLIQUID_USDC_ADDRESS, SOLANA_CHAIN_ID, HYPEREVM_CHAIN_ID } from '@helpers/constants';
import { GetPriceParameters, GetQuoteParameters } from '@reservoir0x/relay-sdk';
import { tokenUnits } from '@helpers/units';
import useAccount from '@hooks/contexts/useAccount';
import useSmartAccount from '@hooks/contexts/useSmartAccount';
import { BridgeProvider } from '@helpers/types/bridge';

interface SendWithBridgeParams {
  amount: string; // Amount in human-readable format (e.g., "0.2" for 0.2 USDC)
  recipient: Address;
  fromChain: number;
  toChain: number;
  toToken: TokenData;
  onTransactionSigned?: (txHashes: { txHash: string; chainId: number }[]) => void; // Called when tx is signed
}

interface BridgeQuote {
  provider: string;
  estimatedTime: number;
  totalFee: string;
  gasFeesInUsd: string;
  relayerFeeInUsd: string;
  outputAmount: string;
  outputAmountFormatted: string;
  // Multi-provider enhancements
  selectedProvider: BridgeProvider;
  fallbackProviders?: BridgeProvider[];
  selectionReason?: string[];
}

export function useSendWithBridge() {
  const { executeSend } = useSendTransaction();
  const { 
    getPrice, 
    getQuote, 
    executeQuote, 
    selectProvider,
    getCurrentProvider,
    isLoading: isBridgeLoading,
    error: bridgeError,
    lastAttemptProvider,
    fallbackAttempts
  } = useBridgeProvider({
    enableFallback: true,
    onProviderSwitch: (from, to, reason) => {
      console.log(`[BRIDGE] Provider switch: ${from} → ${to} (${reason})`);
    },
  });
  const { wallets } = useWallets();
  const { loggedInEthereumAddress } = useAccount();
  const { isSmartAccountEnabled } = useSmartAccount();
  const [bridgeQuote, setBridgeQuote] = useState<BridgeQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteFetchStartTime, setQuoteFetchStartTime] = useState<number | null>(null);
  
  // Quote cache with TTL, size limit, and LRU eviction
  const quoteCacheRef = useRef<Map<string, { quote: BridgeQuote; timestamp: number; lastAccessed: number }>>(new Map());
  const QUOTE_CACHE_TTL = 30000; // 30 seconds
  const MAX_CACHE_SIZE = 50; // Maximum number of cached quotes
  
  // Track completion state for bridge execution
  const completionRef = useRef(false);
  const bridgeTxHashesRef = useRef<{ txHash: string; chainId: number }[]>([]);
  
  // Store functions in refs to avoid recreating callbacks on every render
  const getPriceRef = useRef(getPrice);
  const selectProviderRef = useRef(selectProvider);
  const getCurrentProviderRef = useRef(getCurrentProvider);
  const getQuoteRef = useRef(getQuote);
  const executeQuoteRef = useRef(executeQuote);
  const executeSendRef = useRef(executeSend);
  
  useEffect(() => {
    getPriceRef.current = getPrice;
    selectProviderRef.current = selectProvider;
    getCurrentProviderRef.current = getCurrentProvider;
    getQuoteRef.current = getQuote;
    executeQuoteRef.current = executeQuote;
    executeSendRef.current = executeSend;
  }, [getPrice, selectProvider, getCurrentProvider, getQuote, executeQuote, executeSend])

  const getBridgeQuote = useCallback(async (params: SendWithBridgeParams): Promise<BridgeQuote | null> => {
    const { amount, recipient, fromChain, toChain, toToken } = params;

    // If same chain AND same token (USDC to USDC), no bridge needed
    if (fromChain === toChain && toToken.address.toLowerCase() === BASE_USDC_ADDRESS.toLowerCase()) {
      setBridgeQuote(null);
      return null;
    }
    
    // Generate cache key including provider to prevent stale cache during fallback
    const currentProvider = getCurrentProviderRef.current();
    const cacheKey = `${fromChain}-${toChain}-${amount}-${toToken.address}-${currentProvider || 'default'}`;
    
    // Check cache with LRU access tracking
    const cached = quoteCacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < QUOTE_CACHE_TTL) {
      console.log('[BRIDGE] Using cached quote for:', cacheKey);
      // Update last accessed time for LRU
      cached.lastAccessed = Date.now();
      setBridgeQuote(cached.quote);
      return cached.quote;
    }

    // Set immediate loading feedback
    setIsLoadingQuote(true);
    setQuoteFetchStartTime(Date.now());
    
    try {
      // Validate amount before processing with safety limits
      const parsedAmount = parseFloat(amount);
      
      // Configure limits based on environment
      const isProduction = import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT === 'PRODUCTION';
      const MIN_BRIDGE_AMOUNT = isProduction ? 0.10 : 0.01; // $0.10 for prod, $0.01 for staging/dev
      
      if (!parsedAmount || parsedAmount <= 0 || isNaN(parsedAmount)) {
        throw new Error('Invalid amount for bridge quote');
      }
      
      if (parsedAmount < MIN_BRIDGE_AMOUNT) {
        throw new Error(`Amount must be at least $${MIN_BRIDGE_AMOUNT} USD`);
      }
      
      // Convert amount from human-readable to token units (USDC has 6 decimals)
      const amountInTokenUnits = tokenUnits(amount, 6).toString();
      const amountUsd = parsedAmount; // Simple USD approximation for USDC
      
      // Validate user address - required for bridge operations
      if (!loggedInEthereumAddress || !isAddress(loggedInEthereumAddress)) {
        throw new Error('Valid user address required for bridge operations');
      }
      const userAddress = loggedInEthereumAddress;
      
      // Select provider based on config and chain support - use ref to avoid dependency
      const providerSelection = selectProviderRef.current({ fromChainId: fromChain, toChainId: toChain });
      
      // Note: Special chain handling (Hyperliquid, Solana) is now centralized in useBridgeProvider
      // The provider will automatically transform parameters as needed
      
      const priceParams: GetPriceParameters = {
        user: userAddress as Address,
        recipient: recipient,
        originChainId: fromChain,
        destinationChainId: toChain,
        originCurrency: BASE_USDC_ADDRESS, // Always bridging from USDC
        destinationCurrency: toToken.address, // Provider will handle special cases
        amount: amountInTokenUnits,
        tradeType: 'EXACT_INPUT',
      };

      // Use ref to avoid dependency changes
      const quote = await getPriceRef.current(priceParams);
      console.log('[BRIDGE] Price quote received:', quote);

      if (!quote) {
        console.log('[BRIDGE] No quote received from any provider, setting bridgeQuote to null');
        setBridgeQuote(null);
        return null;
      }

      // Get the current provider that was actually used - use ref
      const currentProvider = getCurrentProviderRef.current();
      
      // Use the output amount as-is from the quote
      // Relay API already provides correctly formatted amounts
      const outputAmount = quote.details?.currencyOut?.amount || '0';
      const outputAmountFormatted = quote.details?.currencyOut?.amountFormatted || '0';
      
      const bridgeQuoteData: BridgeQuote = {
        provider: currentProvider || providerSelection.primary, // Display name
        estimatedTime: quote.details?.timeEstimate || 60,
        totalFee: (Number(quote.fees?.gas?.amountUsd || 0) + Number(quote.fees?.relayer?.amountUsd || 0)).toFixed(2),
        gasFeesInUsd: quote.fees?.gas?.amountUsd || '0',
        relayerFeeInUsd: quote.fees?.relayer?.amountUsd || '0',
        outputAmount: outputAmount,
        outputAmountFormatted: outputAmountFormatted,
        // Multi-provider data
        selectedProvider: currentProvider || providerSelection.primary,
        fallbackProviders: providerSelection.fallback,
        selectionReason: providerSelection.reasoning,
      };

      // Cache the quote with size limit enforcement
      quoteCacheRef.current.set(cacheKey, {
        quote: bridgeQuoteData,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
      });
      
      // Enforce cache size limit with LRU eviction
      if (quoteCacheRef.current.size > MAX_CACHE_SIZE) {
        // Find least recently used entry
        let lruKey: string | null = null;
        let lruTime = Date.now();
        
        for (const [key, value] of quoteCacheRef.current.entries()) {
          // Skip the entry we just added
          if (key === cacheKey) continue;
          
          // Find the least recently accessed entry
          if (value.lastAccessed < lruTime) {
            lruTime = value.lastAccessed;
            lruKey = key;
          }
        }
        
        // Remove the LRU entry
        if (lruKey) {
          console.log('[BRIDGE] Evicting LRU cache entry:', lruKey);
          quoteCacheRef.current.delete(lruKey);
        }
      }
      
      // Clean expired cache entries
      for (const [key, value] of quoteCacheRef.current.entries()) {
        if (Date.now() - value.timestamp > QUOTE_CACHE_TTL) {
          quoteCacheRef.current.delete(key);
        }
      }
      
      // Add a minimum loading time for better UX (prevent flashing)
      const elapsedTime = Date.now() - (quoteFetchStartTime || Date.now());
      const MIN_LOADING_TIME = 300; // 300ms minimum
      if (elapsedTime < MIN_LOADING_TIME) {
        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsedTime));
      }
      
      console.log('[BRIDGE] Setting bridgeQuote:', bridgeQuoteData);
      setBridgeQuote(bridgeQuoteData);
      return bridgeQuoteData;
    } catch (error) {
      console.error('Failed to get bridge quote:', error);
      setBridgeQuote(null);
      
      // If there were fallback attempts, log them for debugging
      if (fallbackAttempts.length > 0) {
        console.log('Bridge fallback attempts:', fallbackAttempts);
      }
      
      // Re-throw the error so the UI can catch and display it
      throw error;
    } finally {
      setIsLoadingQuote(false);
      setQuoteFetchStartTime(null);
    }
  }, [loggedInEthereumAddress]); // Only depend on stable values - refs are updated in useEffect

  const executeWithBridge = useCallback(async (params: SendWithBridgeParams): Promise<any> => {
    const { amount, recipient, fromChain, toChain, toToken, onTransactionSigned } = params;

    // If same chain AND same token (USDC to USDC), use direct send
    if (fromChain === toChain && toToken.address.toLowerCase() === BASE_USDC_ADDRESS.toLowerCase()) {
      // Direct send on same chain
      return executeSendRef.current({
        to: recipient,
        amount,
        token: toToken,
        chainId: toChain,
      });
    }

    // Validate amount before processing with safety limits
    const parsedAmount = parseFloat(amount);
    
    // Configure limits based on environment
    const isProduction = import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT === 'PRODUCTION';
    const MIN_BRIDGE_AMOUNT = isProduction ? 0.10 : 0.01; // $0.10 for prod, $0.01 for staging/dev
    
    if (!parsedAmount || parsedAmount <= 0 || isNaN(parsedAmount)) {
      throw new Error('Invalid amount for bridge execution');
    }
    
    if (parsedAmount < MIN_BRIDGE_AMOUNT) {
      throw new Error(`Amount must be at least $${MIN_BRIDGE_AMOUNT} USD`);
    }
    
    // Convert amount from human-readable to token units (USDC has 6 decimals)
    const amountInTokenUnits = tokenUnits(amount, 6).toString();
    
    // Validate user address - required for bridge operations
    if (!loggedInEthereumAddress || !isAddress(loggedInEthereumAddress)) {
      throw new Error('Valid user address required for bridge operations');
    }
    const userAddress = loggedInEthereumAddress;
    
    // Note: Special chain handling (Hyperliquid, Solana) is now centralized in useBridgeProvider
    // The provider will automatically transform parameters as needed
    
    // Get the detailed quote for execution using multi-provider system
    const relayQuote = await getQuoteRef.current({
      wallet: undefined as any, // Will be set by the hook
      chainId: fromChain,
      toChainId: toChain,
      amount: amountInTokenUnits,
      currency: BASE_USDC_ADDRESS,
      toCurrency: toToken.address, // Provider will handle special cases
      tradeType: 'EXACT_INPUT',
      recipient: recipient,
    });

    if (!relayQuote) {
      throw new Error('Failed to get bridge quote');
    }

    // Reset completion tracking for new execution
    completionRef.current = false;
    bridgeTxHashesRef.current = [];
    
    // Transaction visibility rules:
    // - Relay + EOA wallet: 2 hashes visible (source + destination)
    // - Relay + Embedded wallet: 1 hash visible (source only)
    // - Bungee + ANY wallet: 2 hashes visible (always returns both)
    // Note: Destination chain type (Solana/Hyperliquid/EVM) is irrelevant
    
    // Determine expected transaction count based on provider and wallet type
    const currentProvider = getCurrentProviderRef.current();
    const activeWallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0];
    const isEmbeddedWallet = activeWallet?.walletClientType === 'privy';
    const isBungeeProvider = currentProvider === 'BUNGEE' || lastAttemptProvider === 'BUNGEE';
    
    // Bungee always returns 2 hashes, Relay depends on wallet type
    const expectedTxCount = isBungeeProvider ? 2 : (isEmbeddedWallet ? 1 : 2);
    console.log(`[Bridge] Provider: ${currentProvider}, Wallet: ${isEmbeddedWallet ? 'embedded' : 'EOA'}, Expected txs: ${expectedTxCount}`);
    
    // Create a promise that can be resolved early for embedded wallets
    let resolveEarly: ((value: any) => void) | undefined;
    const earlyCompletionPromise = new Promise((resolve) => {
      resolveEarly = resolve;
    });
    
    // Track if we've called the onTransactionSigned callback
    let hasCalledOnTransactionSigned = false;
    
    // Execute the quote using multi-provider system with automatic fallback
    const bridgeExecutionPromise = executeQuoteRef.current(
      relayQuote,
      (progress: any) => {
        console.log('Bridge progress:', progress);
        
        // Check if bridge is complete
        const { steps, currentStepItem, txHashes, fillStatuses } = progress;
        
        // Collect transaction hashes atomically
        if (txHashes && txHashes.length > 0) {
          txHashes.forEach((tx: any) => {
            if (!bridgeTxHashesRef.current.find(existing => existing.txHash === tx.txHash)) {
              bridgeTxHashesRef.current.push(tx);
            }
          });
          
          // Call the onTransactionSigned callback the first time we get transaction hashes
          // This means the user has signed the transaction
          if (!hasCalledOnTransactionSigned && onTransactionSigned && bridgeTxHashesRef.current.length > 0) {
            hasCalledOnTransactionSigned = true;
            onTransactionSigned(bridgeTxHashesRef.current);
          }
        }
        
        // Track when we first see a Solana bridge with a transaction
        // Check for successful completion - multiple ways to detect:
        // 1. Last step is complete
        const lastStep = steps?.[steps.length - 1];
        const isLastStepComplete = lastStep?.items?.every((item: any) => 
          item.progressState === 'complete' || item.status === 'success'
        );
        
        // 2. Current step indicates completion
        const isCurrentStepComplete = currentStepItem?.progressState === 'complete' || 
                                    currentStepItem?.status === 'success';
        
        // 3. We have transactions on both chains
        const hasSourceTx = bridgeTxHashesRef.current.some(tx => tx.chainId === fromChain);
        const hasDestTx = bridgeTxHashesRef.current.some(tx => tx.chainId === toChain);
        const hasBothTxs = hasSourceTx && hasDestTx;
        
        // 4. Check the fill status if available
        const fillStatus = fillStatuses?.[0];
        const isFillComplete = fillStatus?.status === 'success';
        
        // 5. Check if we have the expected number of transactions
        const hasExpectedTxCount = bridgeTxHashesRef.current.length >= expectedTxCount;
        const isValidatingWithExpectedTxs = currentStepItem?.progressState === 'validating' && hasExpectedTxCount;
        
        // 6. Provider-specific completion checks
        // Bungee: Always wait for both transactions  
        // Relay + Embedded: Complete after source transaction only
        // Relay + EOA: For now, consider complete after source tx is confirmed (not pending)
        //              This ensures we wait for user signature and tx confirmation
        const hasConfirmedSourceTx = bridgeTxHashesRef.current.some(tx => 
          tx.chainId === fromChain && !tx.txHash?.startsWith('pending-')
        );
        
        const isComplete = isBungeeProvider 
          ? hasBothTxs // Bungee always needs both
          : (isEmbeddedWallet 
              ? hasConfirmedSourceTx // Embedded: complete after confirmed source tx
              : hasConfirmedSourceTx); // EOA: also complete after confirmed source tx to avoid indefinite waiting
        
        // Determine if we should mark as complete
        const shouldComplete = isComplete || isValidatingWithExpectedTxs || isLastStepComplete || isCurrentStepComplete || isFillComplete;
        
        if (shouldComplete && !completionRef.current) {
          completionRef.current = true;
                
          // Log successful completion with provider information
          const currentProvider = getCurrentProviderRef.current();
          console.log('Bridge completed successfully:', {
            provider: currentProvider,
            bridgeTxHashes: bridgeTxHashesRef.current,
            fillStatus,
            lastStep,
            currentStepItem,
            hasSourceTx,
            hasDestTx,
            fallbackAttempts: fallbackAttempts.length > 0 ? fallbackAttempts : undefined,
          });
          
          // For Relay + embedded wallets, resolve early since we won't see the destination transaction
          // Bungee always provides both transactions regardless of wallet type
          if (!isBungeeProvider && isEmbeddedWallet && resolveEarly) {
            resolveEarly({
              success: true,
              txHashes: bridgeTxHashesRef.current
            });
          }
        }
      }
    );
    
    // Execute the bridge - use race for Relay+embedded wallets to enable early completion
    // Bungee always waits for full completion regardless of wallet type
    const bridgeResult = (!isBungeeProvider && isEmbeddedWallet)
      ? await Promise.race([bridgeExecutionPromise, earlyCompletionPromise])
      : await bridgeExecutionPromise;
    
    // Check if bridgeResult already has txHashes (from ERC-4337 path or early completion)
    if (bridgeResult && typeof bridgeResult === 'object' && 'txHashes' in bridgeResult) {
      return bridgeResult;
    }
    
    // Otherwise return with collected transaction hashes
    return {
      ...bridgeResult,
      txHashes: bridgeTxHashesRef.current
    };
  }, [loggedInEthereumAddress]); // Only depend on stable values - refs are updated in useEffect

  return {
    executeWithBridge,
    getBridgeQuote,
    bridgeQuote,
    isLoadingQuote: isLoadingQuote || isBridgeLoading,
    quoteFetchStartTime,
    // Multi-provider information
    currentProvider: getCurrentProviderRef.current(),
    lastAttemptProvider,
    fallbackAttempts,
    bridgeError,
    // Provider selection utilities
    selectProvider,
  };
}