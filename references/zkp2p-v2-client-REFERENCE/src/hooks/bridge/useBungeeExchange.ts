import { useCallback, useRef, useState, useEffect } from 'react'
import { type Address, type WalletClient, createWalletClient, custom, erc20Abi, encodeFunctionData } from 'viem'
import { base } from 'viem/chains'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { usePublicClient } from 'wagmi'
import { getDynamicGasPricing } from '@helpers/gas'
import { useBridgeMonitoring } from './useBridgeMonitoring'
import { useErrorLogger } from '@hooks/useErrorLogger'
import { categorizeBridgeError, getBridgeErrorMessage } from '@helpers/bridgeErrors'
import { ErrorCategory } from '@helpers/types/errors'
import useSmartAccount from '@hooks/contexts/useSmartAccount'
import { BASE_CHAIN_ID, BASE_USDC_ADDRESS, SOLANA_CHAIN_ID, TRON_CHAIN_ID, HYPERLIQUID_CHAIN_ID } from '@helpers/constants'
import type { Execute, GetPriceParameters, GetQuoteParameters, ProgressData } from '@reservoir0x/relay-sdk'

// Bungee quote request parameters
type BungeeQuoteRequestParams = {
  toChainId: string,
  toTokenAddress: string,
  fromAmount: string,
  userAddress: string
  recipient?: string,
}

const API_KEY = import.meta.env.VITE_SOCKET_API_KEY || "";

// Bungee supported chain IDs (includes Solana via chain ID 89999)
const SUPPORTED_CHAIN_IDS = [
  137,      // Polygon
  1,        // Ethereum Mainnet
  100,      // Gnosis (xDai)
  42161,    // Arbitrum One
  250,      // Fantom
  10,       // Optimism
  43114,    // Avalanche
  56,       // BSC (Binance Smart Chain)
  1313161554, // Aurora
  1101,     // Polygon zkEVM
  324,      // zkSync Era
  7777777,  // Zora
  8453,     // Base
  59144,    // Linea
  5000,     // Mantle
  534352,   // Scroll
  81457,    // Blast
  34443,    // Mode
  57073,    // Avail
  89999,    // Solana (Bungee's chain ID for Solana)
  146,      // 
  2741,     // 
  8333,     // 
  130,      // 
  80094,    // 
  480,      // 
];

/**
 * Check if a chain ID is supported by Bungee
 */
const isSupportedChain = (chainId: number): boolean => {
  return SUPPORTED_CHAIN_IDS.includes(chainId);
};

/**
 * Validate chain compatibility
 * Note: Bungee supports Solana via chain ID 89999, but not Tron or Hyperliquid
 */
const validateChainSupport = (originChainId: number, destinationChainId: number): void => {
  // Convert our internal Solana chain ID to Bungee's Solana chain ID
  const normalizedOriginId = originChainId === SOLANA_CHAIN_ID ? 89999 : originChainId;
  const normalizedDestId = destinationChainId === SOLANA_CHAIN_ID ? 89999 : destinationChainId;
  
  if (!isSupportedChain(normalizedOriginId)) {
    if (originChainId === TRON_CHAIN_ID) {
      throw new Error('Bungee does not support bridging from Tron. Please use Relay bridge.');
    } else if (originChainId === HYPERLIQUID_CHAIN_ID) {
      throw new Error('Bungee does not support Hyperliquid. Please use Relay bridge.');
    } else {
      throw new Error(`Chain ${originChainId} is not supported by Bungee bridge.`);
    }
  }
  
  if (!isSupportedChain(normalizedDestId)) {
    if (destinationChainId === TRON_CHAIN_ID) {
      throw new Error('Bungee does not support bridging to Tron. Please use Relay bridge.');
    } else if (destinationChainId === HYPERLIQUID_CHAIN_ID) {
      throw new Error('Bungee does not support Hyperliquid. Please use Relay bridge.');
    } else {
      throw new Error(`Chain ${destinationChainId} is not supported by Bungee bridge.`);
    }
  }
};

// Parse Bungee quote to match Relay's format
export const parseExecuteQuoteResponse = (bungeeRoute: any, to_token: string) => {
  const route = bungeeRoute.route || bungeeRoute;
  
  // Calculate fees
  const gasFeeUsd = route.gasFees?.feesInUsd || '0';
  const bridgeFeeUsd = route.bridgeFee?.feesInUsd || '0';
  const totalFeesUsd = (parseFloat(gasFeeUsd) + parseFloat(bridgeFeeUsd)).toFixed(2);
  
  return {
    token: to_token,
    inAmountUsdcFormatted: route.fromAmount,
    outAmountFormatted: route.toAmount,
    outAmountInUsd: route.outputValueInUsd || '0',
    recipientAddress: route.recipient || '',
    totalGasFeesInUsd: gasFeeUsd,
    zkp2pFeeInUsd: '0', // Bungee doesn't have this
    relayerFeeInUsd: bridgeFeeUsd,
    serviceTimeSeconds: route.serviceTime || 300, // Default 5 min
    totalFeesInUsd: totalFeesUsd,
  };
}

type OnProgressCallback = (progress: ProgressData) => void;

export default function useBungeeExchange() {
  const { wallets } = useWallets();
  const publicClient = usePublicClient();
  const activeWallet = wallets.find(wallet => wallet.walletClientType === 'privy') || wallets[0];
  const { logError } = useErrorLogger();
  const { kernelClient, isSmartAccountEnabled } = useSmartAccount();

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
          chain: base, // Always use Base as the source chain for bridges
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
   * Get Bungee/Socket price quote (simplified version)
   */
  const getBungeePrice = useCallback(
    async (params: GetPriceParameters) => {
      // Validate chain support early
      try {
        validateChainSupport(params.originChainId, params.destinationChainId);
      } catch (error: any) {
        console.log('[BUNGEE] Chain not supported:', error.message);
        // Return null for unsupported chains instead of throwing
        // This allows fallback to other bridge providers
        return null;
      }

      // Start monitoring for price fetch
      const attemptId = startBridgeAttempt('BUNGEE', 'QUOTE_FETCH', {
        fromChain: params.originChainId,
        toChain: params.destinationChainId,
        fromToken: params.originCurrency,
        toToken: params.destinationCurrency,
        amount: params.amount,
        recipient: params.recipient,
      });

      try {
        // Quote fetched successfully

        // Convert Relay params to Bungee format
        const bungeeParams: BungeeQuoteRequestParams = {
          toChainId: params.destinationChainId.toString(),
          toTokenAddress: params.destinationCurrency,
          fromAmount: params.amount || '0',
          userAddress: (params.user || '0x0000000000000000000000000000000000000000') as string,
          recipient: params.recipient as string | undefined,
        };

        // Use Socket API endpoint
        const quotesRequest = {
          fromChainId: params.originChainId.toString(),
          toChainId: bungeeParams.toChainId,
          fromTokenAddress: params.originCurrency,
          toTokenAddress: bungeeParams.toTokenAddress,
          fromAmount: bungeeParams.fromAmount,
          userAddress: bungeeParams.userAddress,
          singleTxOnly: 'true',
          sort: 'output',
          uniqueRoutesPerBridge: 'true'
        } as any;

        if (bungeeParams.recipient) {
          quotesRequest.recipient = bungeeParams.recipient;
        }

        const apiUrl = 'https://api.socket.tech/v2/quote';
        const queryParams = new URLSearchParams(quotesRequest).toString();
        const urlWithParams = `${apiUrl}?${queryParams}`;

        const response = await fetch(urlWithParams, {
          method: 'GET',
          headers: {
            'API-KEY': API_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Bungee API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Complete monitoring with success
        completeBridgeAttempt(attemptId, {});
        
        // Return the best route in a format similar to Relay
        if (data.result?.routes?.length > 0) {
          const bestRoute = data.result.routes[0];
          
          // Bungee returns amounts in raw units (smallest unit)
          // We need to format them for display
          const toTokenDecimals = bestRoute.toAsset?.decimals || 6; // Default to 6 for USDC
          const fromTokenDecimals = bestRoute.fromAsset?.decimals || 6;
          
          // Convert raw amounts to human-readable format
          const fromAmountFormatted = (Number(bestRoute.fromAmount) / Math.pow(10, fromTokenDecimals)).toString();
          const toAmountFormatted = (Number(bestRoute.toAmount) / Math.pow(10, toTokenDecimals)).toString();
          
          return {
            // Simplified price response matching Relay's structure
            details: {
              currencyIn: {
                currency: {
                  chainId: params.originChainId,
                  address: params.originCurrency,
                },
                amount: bestRoute.fromAmount, // Keep raw units for amount
                amountFormatted: fromAmountFormatted, // Human-readable format
              },
              currencyOut: {
                currency: {
                  chainId: params.destinationChainId,
                  address: params.destinationCurrency,
                },
                amount: bestRoute.toAmount, // Keep raw units for amount
                amountFormatted: toAmountFormatted, // Human-readable format
                amountUsd: bestRoute.outputValueInUsd,
              },
              recipient: params.recipient,
              timeEstimate: bestRoute.serviceTime || 300,
            },
            fees: {
              gas: {
                amountUsd: bestRoute.gasFees?.feesInUsd || '0',
              },
              relayer: {
                amountUsd: bestRoute.bridgeFee?.feesInUsd || '0',
              },
            },
            // Store the full route for later execution
            _bungeeRoute: bestRoute,
          };
        }
        
        return null;
      } catch (err: any) {
        // "No routes found" is expected when Bungee doesn't support the token pair
        if (err.message?.includes('No routes found')) {
          completeBridgeAttempt(attemptId, {});
          return null;
        }
        
        // Log error for monitoring
        failBridgeAttempt(attemptId, {
          code: 'PRICE_FETCH_ERROR',
          message: err.message || 'Failed to fetch Bungee price',
          category: ErrorCategory.BRIDGE_ERROR,
        });
        
        console.error('Failed to fetch Bungee price:', err)
        throw err
      }
    },
    [startBridgeAttempt, updateBridgeAttempt, completeBridgeAttempt, failBridgeAttempt]
  )

  /*
   * Get detailed Bungee quote (full quote with execution data)
   */
  const getBungeeQuote = useCallback(
    async (params: GetQuoteParameters, context?: { retryCount?: number; tokenSymbol?: string; networkName?: string }) => {
      // Validate chain support early
      validateChainSupport(params.chainId, params.toChainId);

      // Start monitoring for quote fetch
      const attemptId = startBridgeAttempt('BUNGEE', 'QUOTE_FETCH', {
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

        // Get price quote first (which includes the route)
        const priceQuote = await getBungeePrice({
          user: ((params.wallet as any)?.account?.address || activeWallet?.address || '0x0000000000000000000000000000000000000000') as `0x${string}`,
          recipient: params.recipient as `0x${string}`,
          originChainId: params.chainId,
          destinationChainId: params.toChainId,
          originCurrency: params.currency,
          destinationCurrency: params.toCurrency,
          amount: params.amount,
          tradeType: params.tradeType,
        });

        if (!priceQuote || !priceQuote._bungeeRoute) {
          throw new Error('No Bungee routes available');
        }

        const route = priceQuote._bungeeRoute;

        // Get transaction data for the route
        const apiUrl = 'https://api.socket.tech/v2/build-tx';
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'API-KEY': API_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ route })
        });

        if (!response.ok) {
          throw new Error(`Failed to build transaction: ${response.status}`);
        }

        const txData = await response.json();
        
        // Extract cost information from quote
        const gasCostUsd = route.gasFees?.feesInUsd;
        const bridgeFeeUsd = route.bridgeFee?.feesInUsd;
        
        completeBridgeAttempt(attemptId, {
          costs: {
            gasCostUsd,
            bridgeFeeUsd,
          },
        });

        // Return a quote object that mimics Relay's Execute structure
        return {
          details: priceQuote.details,
          fees: priceQuote.fees,
          steps: [{
            id: 'bungee-bridge',
            action: 'bridge',
            description: 'Bridge via Bungee',
            kind: 'transaction',
            items: [{
              status: 'incomplete',
              data: {
                to: txData.result?.txTarget as Address,
                data: txData.result?.txData as `0x${string}`,
                value: txData.result?.value || '0x00',
                from: (params.wallet as any)?.account?.address || activeWallet?.address,
                chainId: txData.result?.chainId || params.chainId,
              }
            }]
          }],
          _bungeeRoute: route,
          _bungeeTxData: txData.result,
          _approvalData: txData.result?.approvalData,
        } as unknown as Execute;
      } catch (err: any) {
        // Enhanced error categorization and logging
        const bridgeErrorMessage = getBridgeErrorMessage(err, {
          bridgeProvider: 'bungee' as 'bungee',
          retryCount: context?.retryCount,
          transactionType: 'quote',
          tokenSymbol: context?.tokenSymbol,
          networkName: context?.networkName,
        });

        // Log error for monitoring
        failBridgeAttempt(attemptId, {
          code: err.code || 'QUOTE_FETCH_ERROR',
          message: bridgeErrorMessage.title,
          category: bridgeErrorMessage.category,
        });

        // Log detailed error information
        logError(
          'Bungee bridge quote fetch failed',
          ErrorCategory.BRIDGE_ERROR,
          {
            error: err?.message || err,
            errorStack: err?.stack,
            errorCode: err?.code,
            bridgeProvider: 'bungee' as 'bungee',
            retryCount: context?.retryCount || 0,
            tokenSymbol: context?.tokenSymbol,
            networkName: context?.networkName,
            bridgeErrorType: categorizeBridgeError(err),
            bridgeErrorSeverity: bridgeErrorMessage.severity,
            bridgeErrorCategory: bridgeErrorMessage.category,
            isRetryable: bridgeErrorMessage.isRetryable,
          }
        );

        console.error('Failed to fetch Bungee quote:', err)
        throw err;
      }
    },
    [walletClient, activeWallet, getBungeePrice, startBridgeAttempt, updateBridgeAttempt, completeBridgeAttempt, failBridgeAttempt, incrementRetryCount, logError]
  )

  /*
   * Execute Bungee bridge transaction
   */
  const executeBungeeQuote = useCallback(
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
      const attemptId = startBridgeAttempt('BUNGEE', 'TRANSACTION_EXECUTION', {
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

        // Get dynamic gas pricing based on network conditions
        let dynamicGasPrice;
        try {
          dynamicGasPrice = await getMinGasPrice();
          console.log('[BUNGEE] Using dynamic gas pricing:', {
            priority: dynamicGasPrice.priority.toString(),
            max: dynamicGasPrice.max.toString()
          });
        } catch (error) {
          console.error('[BUNGEE] Failed to get dynamic gas pricing, using fallback:', error);
          dynamicGasPrice = {
            priority: BigInt(2000000000), // 2 gwei
            max: BigInt(4000000000), // 4 gwei
          };
        }

        // Check if we should use ERC-4337 path for Privy wallets
        if (shouldUseSmartAccount) {
          
          // Extract transaction data from the quote
          const txItem = quote.steps?.[0]?.items?.[0];
          if (!txItem?.data) {
            throw new Error('No transaction data found in Bungee quote');
          }
          
          const calls = [];
          
          // Check if approval is needed and add to calls
          const approvalData = (quote as any)._approvalData;
          if (approvalData) {
            
            // Check current allowance
            const allowance = await publicClient.readContract({
              address: approvalData.approvalTokenAddress as Address,
              abi: erc20Abi,
              functionName: 'allowance',
              args: [kernelClient.account?.address || activeWallet?.address as Address, approvalData.allowanceTarget as Address],
            });
            
            if (BigInt(allowance) < BigInt(approvalData.minimumApprovalAmount)) {
              // Encode approval call
              const approveCalldata = encodeFunctionData({
                abi: erc20Abi,
                functionName: 'approve',
                args: [approvalData.allowanceTarget as Address, BigInt(approvalData.minimumApprovalAmount)],
              });
              
              calls.push({
                to: approvalData.approvalTokenAddress as Address,
                data: approveCalldata,
                value: 0n,
              });
            }
          }
          
          // Add the bridge transaction
          calls.push({
            to: txItem.data.to as Address,
            data: txItem.data.data as `0x${string}`,
            value: txItem.data.value ? 
              (txItem.data.value.startsWith('0x') ? BigInt(txItem.data.value) : BigInt(`0x${txItem.data.value}`)) : 
              0n,
          });
          
          
          try {
            // Send UserOperation with the kernelClient
            const userOpHash = await kernelClient.sendUserOperation({
              calls,
            });
            
            
            // Wait for UserOperation receipt
            const receipt = await kernelClient.waitForUserOperationReceipt({
              hash: userOpHash,
              timeout: 120_000, // 2 minutes timeout
            });
            
            
            if (!receipt.success) {
              throw new Error('UserOperation failed');
            }
            
            // Get the transaction hash from the receipt
            const txHash = receipt.receipt.transactionHash;
            const originChainId = quote.details?.currencyIn?.currency?.chainId || 0;
            const destChainId = quote.details?.currencyOut?.currency?.chainId || 0;
            
            // Monitor bridge status
            await monitorBridgeStatus(txHash, destChainId.toString(), onProgress);
            
            completeBridgeAttempt(attemptId, {});
            
            return {
              userOpHash,
              transactionHash: txHash,
              success: true,
            };
          } catch (error) {
            console.error('[BUNGEE] ERC-4337 execution failed:', error);
            throw error;
          }
        }
        
        // Regular wallet client path
        const txItem = quote.steps?.[0]?.items?.[0];
        if (!txItem?.data) {
          throw new Error('No transaction data found in Bungee quote');
        }

        // Check if approval is needed
        const approvalData = (quote as any)._approvalData;
        if (approvalData) {
          // Check current allowance
          const allowance = await publicClient.readContract({
            address: approvalData.approvalTokenAddress as Address,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [activeWallet?.address as Address, approvalData.allowanceTarget as Address],
          });
          
          // If allowance is insufficient, approve the token
          if (BigInt(allowance) < BigInt(approvalData.minimumApprovalAmount)) {
            
            const approvalHash = await walletClient!.writeContract({
              address: approvalData.approvalTokenAddress as Address,
              abi: erc20Abi,
              functionName: 'approve',
              args: [approvalData.allowanceTarget as Address, BigInt(approvalData.minimumApprovalAmount)],
              account: activeWallet?.address as Address,
              chain: base, // Explicitly use Base chain
              maxFeePerGas: dynamicGasPrice.max,
              maxPriorityFeePerGas: dynamicGasPrice.priority,
            });
            
            
            // Wait for approval confirmation
            const approvalReceipt = await publicClient.waitForTransactionReceipt({
              hash: approvalHash,
              confirmations: 1,
            });
            
            if (approvalReceipt.status !== 'success') {
              throw new Error('Token approval failed');
            }
            
          }
        }

        // Apply gas optimizations
        const optimizedTx = {
          to: txItem.data.to as Address,
          data: txItem.data.data as `0x${string}`,
          value: txItem.data.value ? 
            (txItem.data.value.startsWith('0x') ? BigInt(txItem.data.value) : BigInt(`0x${txItem.data.value}`)) : 
            0n,
          maxFeePerGas: dynamicGasPrice.max,
          maxPriorityFeePerGas: dynamicGasPrice.priority,
          account: activeWallet?.address as Address,
          chain: base, // Explicitly use Base chain
        };


        // Execute transaction
        const hash = await walletClient!.sendTransaction(optimizedTx);

        // Monitor bridge status
        const destChainId = quote.details?.currencyOut?.currency?.chainId || 0;
        await monitorBridgeStatus(hash, destChainId.toString(), onProgress);

        completeBridgeAttempt(attemptId, {});

        return {
          transactionHash: hash,
          success: true,
        };
      } catch (err: any) {
        // Enhanced error categorization and logging
        const bridgeErrorMessage = getBridgeErrorMessage(err, {
          bridgeProvider: 'bungee' as 'bungee',
          retryCount: context?.retryCount,
          transactionType: 'execute',
        });

        // Log error for monitoring
        failBridgeAttempt(attemptId, {
          code: err.code || 'EXECUTION_ERROR',
          message: bridgeErrorMessage.title,
          category: bridgeErrorMessage.category,
        });

        // Log detailed error information
        logError(
          'Bungee bridge execution failed',
          ErrorCategory.BRIDGE_ERROR,
          {
            error: err?.message || err,
            errorStack: err?.stack,
            errorCode: err?.code,
            bridgeProvider: 'bungee' as 'bungee',
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

        console.error('Failed to execute Bungee quote:', err);
        throw err;
      }
    },
    [walletClient, kernelClient, activeWallet, isSmartAccountEnabled, getMinGasPrice, startBridgeAttempt, updateBridgeAttempt, completeBridgeAttempt, failBridgeAttempt, incrementRetryCount, logError]
  );

  /*
   * Monitor bridge status
   */
  const monitorBridgeStatus = async (txHash: string, toChainId: string, onProgress?: OnProgressCallback, abortSignal?: AbortSignal) => {
    
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5 second intervals
    const pollInterval = 5000;
    const absoluteTimeout = 300000; // 5 minute absolute timeout in ms
    
    // Set up absolute timeout
    const timeoutId = setTimeout(() => {
      if (abortSignal && !abortSignal.aborted) {
        abortSignal.dispatchEvent(new Event('abort'));
      }
    }, absoluteTimeout);
    
    try {
      while (attempts < maxAttempts) {
        // Check if operation was aborted
        if (abortSignal?.aborted) {
          throw new Error('Bridge monitoring aborted');
        }
        
        try {
        const apiUrl = `https://api.socket.tech/v2/bridge-status`;
        const urlWithParams = `${apiUrl}?transactionHash=${txHash}&toChainId=${toChainId}&fromChainId=${BASE_CHAIN_ID}`;

        const response = await fetch(urlWithParams, {
          method: 'GET',
          headers: {
            'API-KEY': API_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const status = data.result;
          
          // Check if both source and destination are completed
          const isCompleted = status?.destinationTxStatus === 'COMPLETED' && 
                            status?.sourceTxStatus === 'COMPLETED';
          const statusText = isCompleted ? 'COMPLETED' : 
                           status?.destinationTxStatus || status?.sourceTxStatus || 'PENDING';
          
          
          // Convert Bungee status to Relay-like progress
          if (onProgress) {
            const progress: any = {
              steps: [],
              currentStepItem: {
                progressState: isCompleted ? 'complete' : 'pending',
                status: isCompleted ? 'success' : 'pending',
              },
              txHashes: [],
            };

            // Add source transaction
            if (status?.sourceTransactionHash) {
              progress.txHashes.push({
                txHash: status.sourceTransactionHash,
                chainId: status.fromChainId || BASE_CHAIN_ID,
              });
            }

            // Add destination transaction if available
            if (status?.destinationTransactionHash) {
              progress.txHashes.push({
                txHash: status.destinationTransactionHash,
                chainId: parseInt(toChainId),
              });
              
              // If we have destination tx, set validating state for UI completion detection
              if (isCompleted) {
                progress.currentStepItem.progressState = 'validating';
              }
            }

            onProgress(progress);
          }

          // Check if bridge is complete
          if (isCompleted) {
            return status;
          }
        }
      } catch (error) {
        console.error('[BUNGEE] Error checking bridge status:', error);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
    }

    throw new Error('Bridge transaction timeout');
    } finally {
      // Clean up timeout on completion or error
      clearTimeout(timeoutId);
    }
  };

  return {
    getBungeePrice,
    getBungeeQuote,
    executeBungeeQuote,
  }
}