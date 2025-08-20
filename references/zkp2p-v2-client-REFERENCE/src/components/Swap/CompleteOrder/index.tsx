import React, { useCallback, useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { ArrowLeft } from 'react-feather';
import { useWindowSize } from '@uidotdev/usehooks';
import Confetti from 'react-confetti';
import { Execute, GetQuoteParameters, ProgressData } from '@reservoir0x/relay-sdk';

import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { parseIntentData } from '@helpers/intentHelper';
import {
  LoginStatus,
  paymentPlatformInfo,
  PaymentPlatformType,
  ProofGenerationStatus,
  ProofGenerationStatusType,
} from '@helpers/types';

import { Proof } from '@helpers/types';
import { safeStringify } from '@helpers/bigIntSerialization';
import { ExtensionProofForm } from './ExtensionProofForm';
import { encodeProofAsBytes } from '@helpers/types';
import { useErrorLogger } from '@hooks/useErrorLogger';
import { ErrorCategory } from '@helpers/types/errors';
import { categorizeBridgeError, getBridgeErrorMessage, BridgeErrorType } from '@helpers/bridgeErrors';
import { toast } from 'react-toastify';

import useFulfillIntentTransaction from '@hooks/transactions/useFulfillIntent';

import { Z_INDEX } from '@theme/zIndex';

import useQuery from '@hooks/useQuery';
import useAccount from '@hooks/contexts/useAccount';
import useBalances from '@hooks/contexts/useBalance';
import { useWallets } from '@privy-io/react-auth';
import useOnramperIntents from '@hooks/contexts/useOnRamperIntents';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import useSmartAccount from '@hooks/contexts/useSmartAccount';
import useBridgeProvider from '@hooks/bridge/useBridgeProvider';
import { ParsedQuoteData, parseExecuteQuoteResponse } from '@hooks/bridge/useRelayBridge';
import { BridgeProvider } from '@helpers/types/bridge';
import { BASE_CHAIN_ID, BASE_USDC_ADDRESS, SOLANA_CHAIN_ID, HYPERLIQUID_CHAIN_ID, HYPEREVM_CHAIN_ID } from '@helpers/constants';
import useMediaQuery from '@hooks/useMediaQuery';
import { Breadcrumb, BreadcrumbStep } from '@components/common/Breadcrumb';
import useExtensionProxyProofs from '@hooks/contexts/useExtensionProxyProofs';
import { isVersionOutdated } from '@helpers/sidebar';
import useQuoteStorage from '@hooks/useQuoteStorage';
import useTokenData from '@hooks/contexts/useTokenData';
import { usdcInfo } from '@helpers/types/tokens';
import { encodeMultipleProofs, encodeProofAndPaymentMethodAsBytes } from '@helpers/types/proxyProof';
import TallySupportButton from '@components/common/TallySupportButton';
import useBackend from '@hooks/contexts/useBackend';

const RELAY_QUOTE_REFRESH_INTERVAL = 25000; // 25 seconds - default for successful quotes
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000, 32000]; // exponential backoff delays in ms
const MAX_RETRIES = 10; // increased from 3 to 10 retries

// Bridge completion timeout configuration
// Some chains (like Solana) may stay in 'pending' state indefinitely
// This timeout serves as a fallback mechanism to mark bridges as complete
const BRIDGE_COMPLETION_TIMEOUT_MS = 180000; // 3 minutes (configurable per environment if needed)

// Enhanced quote data type with provider information
type EnhancedQuoteData = ParsedQuoteData & {
  bridgeProvider: BridgeProvider | string;
  fallbackAttempts: number;
};

// Helper function to map simulation status to proof generation status
const mapSimulationStatusToProofStatus = (
  simulationStatus: 'idle' | 'simulating' | 'success' | 'error',
  currentProofStatus: ProofGenerationStatusType
): ProofGenerationStatusType => {
  let result: ProofGenerationStatusType;
  switch (simulationStatus) {
    case 'simulating':
      result = ProofGenerationStatus.TRANSACTION_SIMULATING;
      break;
    case 'success':
      result = ProofGenerationStatus.TRANSACTION_SIMULATION_SUCCESSFUL;
      break;
    case 'error':
      result = ProofGenerationStatus.TRANSACTION_SIMULATION_FAILED;
      break;
    case 'idle':
    default:
      // Don't override if we're in a different phase
      if (currentProofStatus === ProofGenerationStatus.TRANSACTION_CONFIGURED) {
        result = currentProofStatus;
      } else {
        result = currentProofStatus;
      }
      break;
  }
  return result;
};

// Styled components moved before the main component
const Container = styled.div`
  margin: auto;
  padding: 1.5rem;
  background-color: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;

  @media (min-width: 600px) {
    border-radius: 16px;
    width: 400px;
  }

  @media (max-width: 600px) {
    width: 98%;
    margin: 0 auto;
    box-sizing: border-box;
  }
`;

const ConfettiContainer = styled.div`
  z-index: ${Z_INDEX.confetti};
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 0;
  overflow: visible;
`;

const TitleContainer = styled.div`
  padding: 0;
  width: 100%;
`;

const StyledArrowLeft = styled(ArrowLeft)`
  color: ${colors.white};
`;

const StyledRowBetween = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  
  > div:first-child {
    padding-left: 0.5rem;
  }
  
  > div:last-child {
    padding-right: 0.5rem;
  }
`;

interface CompleteOrderFormProps {
  handleBackClick: () => void;
  handleGoBackToSwap: () => void;
};

export const CompleteOrderForm: React.FC<CompleteOrderFormProps> = ({
  handleBackClick,
  handleGoBackToSwap: originalHandleGoBackToSwap
}) => {
  const size = useWindowSize();

  /*
   * Context
   */

  const currentDeviceSize = useMediaQuery();
  const isMobile = currentDeviceSize === 'mobile';

  const { queryParams, clearReferrerQueryParams } = useQuery();
  const { refetchUsdcBalance, refetchTokenBalance } = useBalances();
  const { currentIntentView, refetchIntentView } = useOnramperIntents();
  const { isSidebarInstalled, sideBarVersion } = useExtensionProxyProofs();
  const { addressToPlatform, usdcAddress } = useSmartContracts();
  const { clearPayeeDetails } = useBackend();
  const { getQuoteData, clearQuoteData } = useQuoteStorage();
  const { loginStatus, loggedInEthereumAddress } = useAccount();
  const { tokenInfo } = useTokenData();
  const { isSmartAccountEnabled } = useSmartAccount();
  const { logError } = useErrorLogger();
  const { wallets } = useWallets();
  
  // Always prioritize embedded wallets over external wallets (consistent with useRelayBridge)
  const activeWallet = wallets.find(wallet => wallet.walletClientType === 'privy') || wallets[0];
  const isEmbeddedWallet = activeWallet?.walletClientType === 'privy';

  /*
   * State
   */

  const [paymentPlatform, setPaymentPlatform] = useState<PaymentPlatformType | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<number>(0);
  const [storedQuoteData, setStoredQuoteData] = useState<any>(null);

  const [proofGenerationStatus, setProofGenerationStatus] = useState<ProofGenerationStatusType>(ProofGenerationStatus.NOT_STARTED);
  const [simulationErrorMessage, setSimulationErrorMessage] = useState<string | null>(null);
  const [bridgeErrorDetails, setBridgeErrorDetails] = useState<{
    type: BridgeErrorType;
    message: string;
    isRetryable: boolean;
  } | null>(null);

  const [paymentProofs, setPaymentProofs] = useState<Proof[] | null>(null);

  
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  const [bridgingNeeded, setBridgingNeeded] = useState<boolean>(false);
  const [bridgeQuoteToExecute, setBridgeQuoteToExecute] = useState<Execute | null>(null);
  const [bridgeQuoteFormatted, setBridgeQuoteFormatted] = useState<EnhancedQuoteData | null>(null);
  const [bridgeTransactions, setBridgeTransactions] = useState<{
    txHash: string;
    chainId: number;
  }[] | null>(null);

  const [shouldPollQuote, setShouldPollQuote] = useState<boolean>(true);
  const [bridgeRetryCount, setBridgeRetryCount] = useState<number>(0);
  const [quoteRetryCount, setQuoteRetryCount] = useState<number>(0);
  const [executionRetryCount, setExecutionRetryCount] = useState<number>(0);
  
  // Refs for retry count logic to avoid triggering re-renders
  const quoteRetryCountRef = useRef<number>(0);
  const executionRetryCountRef = useRef<number>(0);
  const bridgeRetryCountRef = useRef<number>(0);
  
  // Ref for managing retry timeouts
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Flag to prevent concurrent executions of the effect
  const isEffectRunning = useRef<boolean>(false);

  const [title, setTitle] = useState<string>('Payment');
  const [breadcrumbStep, setBreadcrumbStep] = useState<BreadcrumbStep>(BreadcrumbStep.AUTHENTICATE);

  const [isSidebarNeedsUpdate, setIsSidebarNeedsUpdate] = useState<boolean>(false);
  
  const [shouldShowProofDetails, setShouldShowProofDetails] = useState<boolean>(false);
  
  // Ref for managing polling interval
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  /**
   * Calculate retry delay with exponential backoff
   * @param retryCount - Current retry count (0-based)
   * @param operationType - Type of operation for logging
   * @returns Delay in milliseconds
   */
  const getRetryDelay = useCallback((retryCount: number, operationType: 'quote' | 'execution'): number => {
    const delayIndex = Math.min(retryCount, RETRY_DELAYS.length - 1);
    const baseDelay = RETRY_DELAYS[delayIndex];
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * baseDelay;
    const finalDelay = baseDelay + jitter;
    
    console.log(`[RetryLogic] ${operationType} retry ${retryCount + 1}/${MAX_RETRIES}, delay: ${Math.round(finalDelay)}ms`);
    
    return finalDelay;
  }, []);
  
  /**
   * Clear all retry-related timeouts and intervals
   */
  const clearRetryTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);
  
  /**
   * Reset all retry counters
   */
  const resetRetryCounters = useCallback(() => {
    setBridgeRetryCount(0);
    setQuoteRetryCount(0);
    setExecutionRetryCount(0);
    quoteRetryCountRef.current = 0;
    executionRetryCountRef.current = 0;
    bridgeRetryCountRef.current = 0;
  }, []);
  
  /*
   * Simple handlers without callbacks
   */
  
  // Track when we first see a bridge transaction (for timeout fallback)
  const bridgeTransactionFirstSeenRef = useRef<number | null>(null);

  const handleBridgeProgress = useCallback((progress: ProgressData) => {
    const { currentStepItem, txHashes, error } = progress;

    if (error) {
      setProofGenerationStatus(ProofGenerationStatus.SWAP_TRANSACTION_FAILED);
      executionRetryCountRef.current += 1;
      setExecutionRetryCount(executionRetryCountRef.current);

      // Log bridge failures
      logError(
        'Relay bridge error - handleBridgeProgress',
        ErrorCategory.BRIDGE_ERROR,
        {
          error: (error as any)?.message || error,
          errorStack: (error as any)?.stack,
          intentHash: currentIntentView?.intentHash,
          platform: paymentPlatform,
          paymentMethod,
          bridgeRoute: storedQuoteData ? {
            fromChain: BASE_CHAIN_ID,
            toChain: tokenInfo[storedQuoteData.token]?.chainId,
            fromToken: BASE_USDC_ADDRESS,
            toToken: tokenInfo[storedQuoteData.token]?.address,
            amount: storedQuoteData.usdcAmount
          } : null,
          currentStep: (currentStepItem as any)?.id,
          stepStatus: currentStepItem?.progressState,
          txHashes: txHashes || null,
          retryCount: executionRetryCountRef.current,
          totalQuoteRetries: quoteRetryCountRef.current,
          extensionVersion: sideBarVersion
        }
      );
      return;
    }

    // Get destination chain for logging
    const destinationChainId = storedQuoteData && tokenInfo[storedQuoteData.token]?.chainId;
    const destinationChainName = storedQuoteData && tokenInfo[storedQuoteData.token]?.chainName;
    
    // IMPORTANT: Transaction count depends on wallet type, NOT destination chain type
    // EOA wallets + Relay = always 2 hashes (source + destination) for cross-chain
    // Embedded wallets + Relay = only 1 hash visible (source chain only) for cross-chain
    // This is NOT related to the destination chain (Solana/Hyperliquid/etc.)
    
    // All cross-chain bridges execute 2 transactions (source + destination)
    // Visibility depends on provider AND wallet type, NOT destination chain type:
    // - Bungee: Always shows both transactions regardless of wallet
    // - Relay: Shows based on wallet (EOA=2, Embedded=1)
    
    // Track when we first see any bridge transaction (for timeout fallback)
    if (txHashes && txHashes.length >= 1 && !bridgeTransactionFirstSeenRef.current) {
      bridgeTransactionFirstSeenRef.current = Date.now();
      console.log(`[Bridge] Bridge transaction detected for ${destinationChainName || 'chain'} (ID: ${destinationChainId}), starting ${BRIDGE_COMPLETION_TIMEOUT_MS/1000}s timeout timer`);
    }
    
    // Transaction visibility rules:
    // - Relay + EOA wallet: 2 hashes visible (source + destination)
    // - Relay + Embedded wallet: 1 hash visible (source only)
    // - Bungee + ANY wallet: 2 hashes visible (always returns both)
    // Note: Destination chain type (Solana/Hyperliquid/EVM) is irrelevant
    
    const currentProvider = getCurrentProvider();
    const isBungeeProvider = currentProvider === 'BUNGEE' || lastAttemptProvider === 'BUNGEE';
    
    // Bungee always returns 2 hashes, Relay depends on wallet type
    const expectedTxCount = isBungeeProvider ? 2 : (isEmbeddedWallet ? 1 : 2);
    const isStandardCompletion = currentStepItem?.progressState === 'validating' && 
                                 txHashes?.length && 
                                 txHashes.length >= expectedTxCount;
    
    if (isStandardCompletion) {
      console.log(`[Bridge] Provider: ${currentProvider}, Wallet: ${isEmbeddedWallet ? 'embedded' : 'EOA'}, Got ${txHashes.length} tx(s), expected ${expectedTxCount}`);
    }
    
    // Provider-specific completion: Relay+embedded sees 1 tx, all others see 2 txs
    const isEmbeddedWalletCompletion = !isBungeeProvider && isEmbeddedWallet && 
                                       txHashes?.length === 1 &&
                                       txHashes[0]?.txHash &&
                                       !txHashes[0]?.txHash.startsWith('pending-');
    
    if (isEmbeddedWalletCompletion) {
      console.log(`[Bridge] Relay + embedded wallet completion - proceeding with single source transaction`);
    }
    
    // Bridge completion via timeout (fallback for any network)
    // Some chains (like Solana) may stay in 'pending' state indefinitely
    const isBridgeTimeout = (currentStepItem?.progressState as string) === 'pending' && 
                            txHashes && txHashes.length >= 1 && 
                            bridgeTransactionFirstSeenRef.current && 
                            (Date.now() - bridgeTransactionFirstSeenRef.current) > BRIDGE_COMPLETION_TIMEOUT_MS;
    
    if (isBridgeTimeout) {
      const elapsedSeconds = Math.round((Date.now() - bridgeTransactionFirstSeenRef.current!) / 1000);
      console.log(`[Bridge] Bridge completion assumed after ${elapsedSeconds}s timeout for ${destinationChainName || 'destination chain'} - transaction likely succeeded`);
    }
    
    // Wait for bridge completion
    if (isStandardCompletion || isEmbeddedWalletCompletion || isBridgeTimeout) {
      // Reset bridge timeout tracking
      bridgeTransactionFirstSeenRef.current = null;
      setShouldPollQuote(false);
      resetRetryCounters(); // Reset all retry counters on success
      clearRetryTimers(); // Clear any pending timers
      
      setProofGenerationStatus(ProofGenerationStatus.DONE);
      setBridgeTransactions(txHashes || null);

      refetchTokenBalance?.(storedQuoteData?.token);  // fetch token balance for the token that was swapped to (in case 
      // it landed in the embedded wallet)
      refetchIntentView?.();  // refresh intent state to clear active order
      refetchUsdcBalance?.();  // refresh USDC balance after bridging

      if (loggedInEthereumAddress) {
        clearQuoteData(loggedInEthereumAddress);
      }
    }
  }, [currentIntentView, clearQuoteData, refetchTokenBalance, refetchIntentView, refetchUsdcBalance, storedQuoteData, logError, paymentPlatform, paymentMethod, tokenInfo, resetRetryCounters, clearRetryTimers, loggedInEthereumAddress]);
  
  /*
   * Contract writes - using dummy callbacks
   */
  
  const onFulfillIntentSuccess = useCallback((data: any) => {
    if (bridgingNeeded) {
      setProofGenerationStatus(ProofGenerationStatus.SWAP_QUOTE_REQUESTING);
    } else {
      setProofGenerationStatus(ProofGenerationStatus.DONE);

      if (loggedInEthereumAddress) {
        clearQuoteData(loggedInEthereumAddress);
      }
    }

    clearPayeeDetails();    // clear payee details after successful fulfill intent

    refetchUsdcBalance?.();
    refetchIntentView?.();  // refresh intent state to clear active order

    refetchTokenBalance?.(usdcInfo.tokenId);  // for redundancy    
  }, [
    refetchUsdcBalance,
    refetchIntentView,
    bridgingNeeded,
    currentIntentView,
    clearQuoteData
  ]);

  const onPrepareFulfillIntentError = useCallback((error: any) => {
    setProofGenerationStatus(ProofGenerationStatus.TRANSACTION_SIMULATION_FAILED);
      
    const errorMessage = error?.message || '';
    const reasonMatch = errorMessage.match(/reason:\s*([^"\n]+)/);
    const reason = reasonMatch ? reasonMatch[1].trim() : 'Unknown error';
    setSimulationErrorMessage(reason);

    // Log simulation failures with enhanced Rollbar
    logError(
      'Transaction simulation failed - fulfillIntent',
      ErrorCategory.SIMULATION_ERROR,
      {
        error: error?.message || error,
        errorStack: error?.stack,
        intentHash: currentIntentView?.intentHash,
        platform: paymentPlatform,
        paymentMethod,
        simulationReason: reason,
        // Sanitize proof data - only log structure not content
        proofDataStructure: paymentProofs ? 'present' : 'missing',
        proofCount: paymentProofs?.length || 0,
        hasProofInput: !!paymentProofInput,
        contractAddress: addressToPlatform ? Object.keys(addressToPlatform).find(key => addressToPlatform[key] === paymentPlatform) : undefined,
        // Don't log full user address for PII
        hasUserAddress: !!currentIntentView?.intent.owner,
        extensionVersion: sideBarVersion
      }
    );
  }, [currentIntentView, setSimulationErrorMessage, logError, paymentPlatform, paymentMethod, paymentProofs, addressToPlatform]);

  const {
    writeFulfillIntentAsync,
    intentHashInput,
    paymentProofInput,
    setIntentHashInput,
    setPaymentProofInput,
    shouldConfigureFulfillIntentWrite,
    setShouldConfigureFulfillIntentWrite,
    isWriteFulfillIntentPrepareError,
    signFulfillIntentTransactionStatus,
    mineFulfillIntentTransactionStatus,
    isPreparingTransaction,
    isWriteFulfillIntentSimulationSuccess,
    writeFulfillIntentConfig,
    transactionHash,
    simulationStatus,
  } = useFulfillIntentTransaction(onFulfillIntentSuccess, onPrepareFulfillIntentError);

  const {
    getQuote,
    executeQuote,
    selectProvider,
    getCurrentProvider,
    lastAttemptProvider,
    fallbackAttempts,
  } = useBridgeProvider({
    enableFallback: true,
    onProviderSwitch: (from, to, reason) => {
      console.log(`[BRIDGE] Provider switch in CompleteOrder: ${from} → ${to} (${reason})`);
    },
  });
  
  /*
   * Effects
   */

  // Load stored quote data from localStorage
  useEffect(() => {
    // No need to wait for currentIntentView - use logged-in address immediately
    if (loggedInEthereumAddress) {
      const data = getQuoteData(loggedInEthereumAddress);

      if (data) {
        setStoredQuoteData(data);
        setPaymentMethod(data.paymentMethod || 0);
        setBridgingNeeded(data.token !== usdcInfo.tokenId);
      }
    }
  }, [getQuoteData, loggedInEthereumAddress]);

  useEffect(() => {
    const shouldConfigure = proofGenerationStatus === ProofGenerationStatus.TRANSACTION_CONFIGURED;

    setShouldConfigureFulfillIntentWrite(shouldConfigure);
  }, [proofGenerationStatus, setShouldConfigureFulfillIntentWrite]);

  // Auto-trigger simulation when transaction is configured
  useEffect(() => {
    const shouldAutoTriggerSimulation = 
      proofGenerationStatus === ProofGenerationStatus.TRANSACTION_CONFIGURED &&
      shouldConfigureFulfillIntentWrite &&
      paymentProofInput &&
      intentHashInput &&
      simulationStatus === 'idle' && // IMPORTANT: Only trigger when no simulation is in progress to prevent race conditions
      loginStatus === LoginStatus.AUTHENTICATED &&
      isSmartAccountEnabled;

    if (shouldAutoTriggerSimulation) {
      // Call the write function which will trigger simulation
      // The actual transaction execution will happen in the auto-complete effect
      // after simulation succeeds
      writeFulfillIntentAsync();
    }
  }, [
    proofGenerationStatus,
    shouldConfigureFulfillIntentWrite,
    paymentProofInput,
    intentHashInput,
    simulationStatus,
    loginStatus,
    isSmartAccountEnabled,
    writeFulfillIntentAsync
  ]);

  useEffect(() => {

    if (currentIntentView) {
      const intentData = parseIntentData(currentIntentView, addressToPlatform);
      
      // Mobile detection is kept for future mobile messaging
      // For now, we always use the extension flow

      setIntentHashInput(currentIntentView.intentHash);
      setPaymentPlatform(intentData.paymentPlatform);
    }
  }, [currentIntentView, paymentMethod, isMobile]);

  useEffect(() => {
    if (isSidebarInstalled && sideBarVersion && paymentPlatform && paymentMethod) {
      const needsUpdate = isVersionOutdated(sideBarVersion, paymentMethod, paymentPlatform);
      setIsSidebarNeedsUpdate(needsUpdate);
    }
  }, [isSidebarInstalled, sideBarVersion, paymentPlatform]);

  // Effect to sync simulation status from hook
  useEffect(() => {
    // Only update status if we're in the transaction phase
    const isInTransactionPhase = 
      proofGenerationStatus === ProofGenerationStatus.TRANSACTION_CONFIGURED ||
      proofGenerationStatus === ProofGenerationStatus.TRANSACTION_SIMULATING ||
      proofGenerationStatus === ProofGenerationStatus.TRANSACTION_SIMULATION_SUCCESSFUL ||
      proofGenerationStatus === ProofGenerationStatus.TRANSACTION_SIMULATION_FAILED;

    if (isInTransactionPhase && shouldConfigureFulfillIntentWrite) {
      const newStatus = mapSimulationStatusToProofStatus(simulationStatus, proofGenerationStatus);
      if (newStatus !== proofGenerationStatus) {
        setProofGenerationStatus(newStatus);
      }
    }
  }, [simulationStatus, shouldConfigureFulfillIntentWrite, proofGenerationStatus]);

  // Fulfill intent transaction effects - keep this to handle other states
  useEffect(() => {
    const didFulfillIntentTransactionSucceed = mineFulfillIntentTransactionStatus === 'success';
    if (!didFulfillIntentTransactionSucceed) {
      const paymentProofSelected = paymentProofInput !== null;
      const intentAndPaymentProofSelected = intentHashInput !== null && paymentProofSelected;

      if (intentAndPaymentProofSelected) {
        const signingTransaction = signFulfillIntentTransactionStatus === 'loading';
        const miningTransaction = mineFulfillIntentTransactionStatus === 'loading';

        let newStatus;
        if (signingTransaction) {
          newStatus = ProofGenerationStatus.TRANSACTION_LOADING;
        } else if (miningTransaction) {
          newStatus = ProofGenerationStatus.TRANSACTION_MINING;
        } else {
          newStatus = ProofGenerationStatus.TRANSACTION_CONFIGURED;
        }

        setProofGenerationStatus(newStatus);
      } else {
        setProofGenerationStatus(ProofGenerationStatus.NOT_STARTED);
      }
    }
  }, [
    paymentProofInput,
    intentHashInput,
    signFulfillIntentTransactionStatus,
    mineFulfillIntentTransactionStatus,
  ]);

  useEffect(() => {
    if (paymentProofs && paymentProofs[0] && paymentPlatform) {

      try {
        let encodedProof;
        let proofBytes;

        // todo: check if just encodeMultipleProofs is enough
        const requiredProofs = paymentPlatformInfo[paymentPlatform].paymentMethods[paymentMethod].verifyConfig.totalProofs;
        if (paymentProofs.length === requiredProofs) {
          if (paymentProofs.length === 1) {
            proofBytes = encodeProofAsBytes(paymentProofs[0]);
          } else {
            proofBytes = encodeMultipleProofs(paymentProofs);
          }
        } else {
          return; // Not enough proofs yet
        }

        if (paymentPlatformInfo[paymentPlatform].hasMultiplePaymentMethods) {
          // attach payment method information to the proof
          encodedProof = encodeProofAndPaymentMethodAsBytes(proofBytes, paymentMethod);
        } else {
          // no need to attach payment method information to the proof
          encodedProof = proofBytes;
        }

        setPaymentProofInput(encodedProof);
      } catch (error) {
        console.error('Error encoding proof: ', error);
        
        // Log proof encoding errors with enhanced Rollbar
        logError(
          'Proof encoding failed',
          ErrorCategory.PROOF_ERROR,
          {
            error: (error as any)?.message || error,
            errorStack: (error as any)?.stack,
            intentHash: currentIntentView?.intentHash,
            platform: paymentPlatform,
            paymentMethod,
            proofCount: paymentProofs?.length || 0,
            requiredProofs: paymentPlatformInfo[paymentPlatform]?.paymentMethods[paymentMethod]?.verifyConfig?.totalProofs,
            hasMultiplePaymentMethods: paymentPlatformInfo[paymentPlatform]?.hasMultiplePaymentMethods,
            extensionVersion: sideBarVersion
          }
        );
        
        setProofGenerationStatus(ProofGenerationStatus.ERROR_FAILED_TO_PROVE);
      }
    }
  }, [paymentProofs, logError, currentIntentView, paymentPlatform, paymentMethod, paymentPlatformInfo]);

  useEffect(() => {
    if (proofGenerationStatus === ProofGenerationStatus.DONE) {
      setShowConfetti(true);

      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    }
  }, [proofGenerationStatus])

  useEffect(() => {
    // Prevent concurrent executions
    if (isEffectRunning.current) {
      return;
    }
    
    // Create AbortController for cleanup
    const abortController = new AbortController();
    
    /**
     * Enhanced fetch bridge quote with exponential backoff retry logic
     */
    const fetchBridgeQuote = async () => {
      if (!storedQuoteData || !storedQuoteData.token || !storedQuoteData.recipientAddress || !storedQuoteData.usdcAmount) {
        console.error('Missing required data for bridging');
        
        // Log validation errors with enhanced Rollbar
        logError(
          'Bridge quote validation failed - missing data',
          ErrorCategory.VALIDATION_ERROR,
          {
            intentHash: currentIntentView?.intentHash,
            hasStoredQuoteData: !!storedQuoteData,
            hasToken: !!storedQuoteData?.token,
            hasRecipientAddress: !!storedQuoteData?.recipientAddress,
            hasUsdcAmount: !!storedQuoteData?.usdcAmount,
            platform: paymentPlatform,
            paymentMethod,
            extensionVersion: sideBarVersion
          }
        );
        
        return;
      }
      
      // Check if aborted
      if (abortController.signal.aborted) return;

      try {
        const token = storedQuoteData.token;
        const destinationChainId = tokenInfo[token].chainId;
        const tokenAddress = tokenInfo[token].address;
  
        const params: GetQuoteParameters = {
          recipient: storedQuoteData.recipientAddress,
          chainId: BASE_CHAIN_ID, // Always Base
          toChainId: destinationChainId,
          currency: BASE_USDC_ADDRESS, // Always Base USDC
          toCurrency: tokenAddress,
          amount: storedQuoteData.usdcAmount, // in wei
          tradeType: 'EXACT_INPUT'
        };
  
        const quoteRes = await getQuote(params);
        
        // Check if aborted before updating state
        if (abortController.signal.aborted) return;
        
        // Check if quote is null
        if (!quoteRes) {
          throw new Error('Failed to get bridge quote');
        }
        
        setBridgeQuoteToExecute(quoteRes);

        const quoteData = parseExecuteQuoteResponse(quoteRes, token);
        
        // Enhance quote data with provider information
        const currentProvider = getCurrentProvider();
        const enhancedQuoteData: EnhancedQuoteData = {
          ...quoteData,
          bridgeProvider: currentProvider || 'Unknown',
          fallbackAttempts: fallbackAttempts.length,
        };
        
        setBridgeQuoteFormatted(enhancedQuoteData);
        
        // Reset quote retry count on success
        quoteRetryCountRef.current = 0;
        setQuoteRetryCount(0);
        
        setProofGenerationStatus(ProofGenerationStatus.SWAP_QUOTE_SUCCESS);
        
        console.log('[BridgeQuote] Successfully fetched bridge quote');
      } catch (err: any) {
        // Ignore abort errors
        if (err.name === 'AbortError' || abortController.signal.aborted) return;
        
        console.error('Error bridging flow:', err);
        setBridgeQuoteToExecute(null);
        setBridgeQuoteFormatted(null);
        
        const isNoRoutesError = err.message?.includes('No routes found');
        quoteRetryCountRef.current += 1;
        const newQuoteRetryCount = quoteRetryCountRef.current;
        setQuoteRetryCount(newQuoteRetryCount);
        
        // Enhanced bridge error handling with user-friendly messages
        const bridgeErrorMessage = getBridgeErrorMessage(err, {
          bridgeProvider: 'relay',
          retryCount: newQuoteRetryCount,
          transactionType: 'quote',
          tokenSymbol: tokenInfo[storedQuoteData.token]?.ticker,
          networkName: tokenInfo[storedQuoteData.token]?.chainName,
        });

        setBridgeErrorDetails({
          type: categorizeBridgeError(err, {
            bridgeProvider: 'relay',
            retryCount: newQuoteRetryCount,
            transactionType: 'quote',
          }),
          message: bridgeErrorMessage.title,
          isRetryable: bridgeErrorMessage.isRetryable,
        });

        // Set user-friendly error message for UI display
        setSimulationErrorMessage(`${bridgeErrorMessage.title}: ${bridgeErrorMessage.description}`);
        
        // Log bridge quote failures with enhanced Rollbar
        logError(
          'Bridge quote failed',
          ErrorCategory.BRIDGE_ERROR,
          {
            error: err?.message || err,
            errorStack: err?.stack,
            errorCode: err?.code,
            intentHash: currentIntentView?.intentHash,
            platform: paymentPlatform,
            paymentMethod,
            quoteRetryCount: newQuoteRetryCount,
            executionRetryCount,
            totalRetries: bridgeRetryCount,
            bridgeRoute: {
              fromChain: BASE_CHAIN_ID,
              toChain: tokenInfo[storedQuoteData.token]?.chainId,
              fromToken: BASE_USDC_ADDRESS,
              toToken: tokenInfo[storedQuoteData.token]?.address,
              amount: storedQuoteData.usdcAmount
            },
            isNoRoutesError,
            tokenSymbol: tokenInfo[storedQuoteData.token]?.ticker,
            destinationNetwork: tokenInfo[storedQuoteData.token]?.chainName,
            willRetry: newQuoteRetryCount < MAX_RETRIES,
            // Enhanced error categorization
            bridgeErrorType: categorizeBridgeError(err),
            bridgeErrorSeverity: bridgeErrorMessage.severity,
            bridgeErrorCategory: bridgeErrorMessage.category,
            extensionVersion: sideBarVersion
          }
        );
  
        setProofGenerationStatus(ProofGenerationStatus.SWAP_QUOTE_FAILED);
        bridgeRetryCountRef.current += 1;
        setBridgeRetryCount(bridgeRetryCountRef.current);
      }
    };
    
    /**
     * Schedule retry with exponential backoff
     */
    const scheduleRetry = (retryCount: number, operation: () => void) => {
      const delay = getRetryDelay(retryCount, 'quote');
      
      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      retryTimeoutRef.current = setTimeout(() => {
        if (!abortController.signal.aborted) {
          operation();
        }
      }, delay);
    };

    // Clear any existing timers first
    clearRetryTimers();
    
    // Set effect running flag
    isEffectRunning.current = true;

    if (shouldPollQuote && bridgingNeeded && (
        proofGenerationStatus === ProofGenerationStatus.SWAP_QUOTE_REQUESTING ||
        proofGenerationStatus === ProofGenerationStatus.SWAP_QUOTE_FAILED ||
        proofGenerationStatus === ProofGenerationStatus.SWAP_TRANSACTION_FAILED
      )) {
      
      // Determine which retry count to use based on the failure type
      const currentRetryCount = proofGenerationStatus === ProofGenerationStatus.SWAP_TRANSACTION_FAILED 
        ? executionRetryCountRef.current 
        : quoteRetryCountRef.current;
      
      // Stop polling if we've hit max retries for failed states
      if ((proofGenerationStatus === ProofGenerationStatus.SWAP_QUOTE_FAILED || 
           proofGenerationStatus === ProofGenerationStatus.SWAP_TRANSACTION_FAILED) && 
          currentRetryCount >= MAX_RETRIES) {

        setShouldPollQuote(false);
        clearRetryTimers();
        
        const failureReason = executionRetryCountRef.current >= MAX_RETRIES 
          ? `Bridge execution failed after ${MAX_RETRIES} attempts. This may be due to network congestion or insufficient liquidity.`
          : `Bridge quote failed after ${MAX_RETRIES} attempts. This may be due to network issues or route unavailability.`;
        
        setSimulationErrorMessage(failureReason + ' Please try again later or contact support if the issue persists.');
        
        console.log(`[BridgeQuote] Max retries (${MAX_RETRIES}) exceeded for ${proofGenerationStatus}`);
        return;
      }
      
      console.log(`[BridgeQuote] Starting quote fetch, status: ${proofGenerationStatus}, quoteRetryCount: ${quoteRetryCountRef.current}, executionRetryCount: ${executionRetryCountRef.current}`);
      
      // For initial request or successful retries, fetch immediately
      if (proofGenerationStatus === ProofGenerationStatus.SWAP_QUOTE_REQUESTING || currentRetryCount === 0) {
        fetchBridgeQuote();
        
        // Set up regular polling interval for successful quotes
        intervalRef.current = setInterval(() => {
          if (!abortController.signal.aborted) {
            fetchBridgeQuote();
          }
        }, RELAY_QUOTE_REFRESH_INTERVAL);
      } else {
        // For retries after failures, use exponential backoff
        scheduleRetry(currentRetryCount, () => {
          fetchBridgeQuote();
          
          // Resume regular polling after retry
          if (!abortController.signal.aborted) {
            intervalRef.current = setInterval(() => {
              if (!abortController.signal.aborted) {
                fetchBridgeQuote();
              }
            }, RELAY_QUOTE_REFRESH_INTERVAL);
          }
        });
      }
    }

    // Cleanup interval and abort controller on unmount or when status changes
    return () => {
      abortController.abort();
      clearRetryTimers();
      isEffectRunning.current = false;
    };
  }, [
    proofGenerationStatus,
    shouldPollQuote,
    storedQuoteData,
    bridgingNeeded,
    logError,
    currentIntentView,
    paymentPlatform,
    paymentMethod,
    tokenInfo,
    getRetryDelay,
    clearRetryTimers
  ]);

  // Auto complete steps when the user has logged in via privy
  useEffect(() => {
    // Check that proof is ready (after successful simulation and configuration)
    const isTransactionReady = 
      proofGenerationStatus === ProofGenerationStatus.TRANSACTION_SIMULATION_SUCCESSFUL &&
      simulationStatus === 'success';
    const isSwapQuoteReady = proofGenerationStatus === ProofGenerationStatus.SWAP_QUOTE_SUCCESS;
    const isUserAuthenticated = loginStatus === LoginStatus.AUTHENTICATED;

    const handleAutoComplete = async () => {
      // Check if smart account is enabled before auto-executing
      if (!isSmartAccountEnabled) {
        console.log('[CompleteOrderForm] Auto-execution - Smart account check failed:', {
          timestamp: new Date().toISOString(),
          isSmartAccountEnabled: false,
          action: 'showing toast',
          context: 'Auto-complete blocked'
        });
        toast.info('Please enable smart account features to complete the transaction');
        return;
      }

      // Only execute if simulation is already successful
      // The simulation itself is triggered by the auto-trigger effect
      if (simulationStatus !== 'success') {
        return;
      }

      // Additional safeguard: Ensure we're not in a loading state
      // This prevents race conditions where simulationStatus might be 'success'
      // but a new simulation is being triggered
      if (signFulfillIntentTransactionStatus === 'loading' || mineFulfillIntentTransactionStatus === 'loading') {
        return;
      }

      try {
        const result = await writeFulfillIntentAsync();
        if (result?.hash) {
          console.log('Auto-complete: Fulfill intent transaction submitted:', result.hash);
          // Success callback in the hook will handle completion
        }
      } catch (error) {
        console.error('Error completing order:', error);
        // Error is already handled by onError callback in the hook
      }
    }

    const handleAutoSwap = async () => {

      // Check if smart account is enabled before auto-executing swap
      if (!isSmartAccountEnabled) {
        console.log('Smart account not enabled, waiting for user to enable before auto-executing swap');
        toast.info('Please enable smart account features to complete the swap');
        return;
      }

      try {
        if (!bridgeQuoteToExecute) {
          throw new Error('No bridge quote to execute');
        }
  
        // Pause polling for the quote
        setShouldPollQuote(false);
        setProofGenerationStatus(ProofGenerationStatus.SWAP_TRANSACTION_SIGNING);
        
        console.log(`[AutoSwap] Starting bridge execution, executionRetryCount: ${executionRetryCountRef.current}`);

        await executeQuote(bridgeQuoteToExecute, handleBridgeProgress);
      } catch (error) {
        console.error('[AutoSwap] Bridge execution failed:', error);
        
        executionRetryCountRef.current += 1;
        const newExecutionRetryCount = executionRetryCountRef.current;
        setExecutionRetryCount(newExecutionRetryCount);
        bridgeRetryCountRef.current += 1;
        setBridgeRetryCount(bridgeRetryCountRef.current);
        
        // Check if we should retry
        if (newExecutionRetryCount < MAX_RETRIES) {
          console.log(`[AutoSwap] Will retry execution (${newExecutionRetryCount}/${MAX_RETRIES})`);
          
          // Schedule retry with exponential backoff
          const delay = getRetryDelay(newExecutionRetryCount - 1, 'execution');
          
          setTimeout(() => {
            setShouldPollQuote(true);
            setProofGenerationStatus(ProofGenerationStatus.SWAP_QUOTE_REQUESTING);
          }, delay);
        } else {
          console.log(`[AutoSwap] Max execution retries (${MAX_RETRIES}) exceeded`);
          setShouldPollQuote(false);
          setProofGenerationStatus(ProofGenerationStatus.SWAP_TRANSACTION_FAILED);
        }
        
        // Enhanced bridge error handling with user-friendly messages
        const bridgeErrorMessage = getBridgeErrorMessage(error, {
          bridgeProvider: 'relay',
          retryCount: newExecutionRetryCount,
          transactionType: 'execute',
          tokenSymbol: storedQuoteData ? tokenInfo[storedQuoteData.token]?.ticker : undefined,
          networkName: storedQuoteData ? tokenInfo[storedQuoteData.token]?.chainName : undefined,
        });

        setBridgeErrorDetails({
          type: categorizeBridgeError(error, {
            bridgeProvider: 'relay',
            retryCount: newExecutionRetryCount,
            transactionType: 'execute',
          }),
          message: bridgeErrorMessage.title,
          isRetryable: bridgeErrorMessage.isRetryable,
        });

        // Set user-friendly error message for UI display
        if (newExecutionRetryCount >= MAX_RETRIES) {
          setSimulationErrorMessage(`${bridgeErrorMessage.title}: ${bridgeErrorMessage.description}. Please try again later or contact support if the issue persists.`);
        } else {
          setSimulationErrorMessage(`${bridgeErrorMessage.title}: ${bridgeErrorMessage.description}. Retrying automatically...`);
        }

        // Log bridge failures with enhanced details
        logError(
          'Relay bridge execution failed - handleAutoSwap',
          ErrorCategory.BRIDGE_ERROR,
          {
            error: (error as any)?.message || error,
            errorStack: (error as any)?.stack,
            intentHash: currentIntentView?.intentHash,
            platform: paymentPlatform,
            paymentMethod,
            executionRetryCount: newExecutionRetryCount,
            quoteRetryCount: quoteRetryCountRef.current,
            totalRetries: bridgeRetryCountRef.current,
            willRetry: newExecutionRetryCount < MAX_RETRIES,
            nextRetryDelay: newExecutionRetryCount < MAX_RETRIES ? getRetryDelay(newExecutionRetryCount - 1, 'execution') : null,
            bridgeRoute: storedQuoteData ? {
              fromChain: BASE_CHAIN_ID,
              toChain: tokenInfo[storedQuoteData.token]?.chainId,
              fromToken: BASE_USDC_ADDRESS,
              toToken: tokenInfo[storedQuoteData.token]?.address,
              amount: storedQuoteData.usdcAmount
            } : null,
            quoteId: (bridgeQuoteToExecute as any)?.quote?.id,
            hasQuote: !!bridgeQuoteToExecute,
            isAutoExecution: true,
            // Enhanced error categorization
            bridgeErrorType: categorizeBridgeError(error),
            bridgeErrorSeverity: bridgeErrorMessage.severity,
            bridgeErrorCategory: bridgeErrorMessage.category,
            extensionVersion: sideBarVersion
          }
        );
      }  
    }

    if (isTransactionReady && isUserAuthenticated) {
      handleAutoComplete();
    }

    if (isSwapQuoteReady && isUserAuthenticated) {
      handleAutoSwap();
    }
  }, [
    proofGenerationStatus, 
    loginStatus, 
    writeFulfillIntentAsync, 
    isSmartAccountEnabled, 
    simulationStatus, 
    signFulfillIntentTransactionStatus, 
    mineFulfillIntentTransactionStatus,
    bridgeQuoteToExecute,
    executeQuote,
    handleBridgeProgress,
    setShouldPollQuote,
    setBridgeRetryCount,
    toast
  ]);

  /*
   * Handlers
   */

  const handleGoBackToSwap = useCallback(() => {
    setShouldPollQuote(true);
    originalHandleGoBackToSwap();
  }, [originalHandleGoBackToSwap]);

  const handleGoBackToSwapOrCallbackUrl = useCallback(() => {
    if (queryParams.REFERRER_CALLBACK_URL) {
      window.open(queryParams.REFERRER_CALLBACK_URL, '_blank');
    } else {
      handleGoBackToSwap();
    }

    clearReferrerQueryParams();
  }, [queryParams, handleGoBackToSwap, clearReferrerQueryParams]);

  const handleBackButtonClick = useCallback(() => {
    setSimulationErrorMessage(null);
    if (proofGenerationStatus === ProofGenerationStatus.DONE) {
      handleGoBackToSwap();
    } else {
      handleBackClick();
    }
  }, [handleBackClick, handleGoBackToSwap, proofGenerationStatus]);

  const handleCompleteOrderClick = useCallback(async () => {


    // Ensure we're in the right state
    if (simulationStatus !== 'success' && 
        proofGenerationStatus !== ProofGenerationStatus.TRANSACTION_SIMULATION_SUCCESSFUL) {

      return;
    }

    try {
      const result = await writeFulfillIntentAsync();
      if (result?.hash) {
        console.log('Fulfill intent transaction submitted:', result.hash);
        // Success callback in the hook will handle completion
      }
    } catch (error) {
      console.error('Error completing order:', error);
      // Error is already handled by onError callback in the hook
    }
  }, [writeFulfillIntentAsync, simulationStatus, proofGenerationStatus]);

  const handleSubmitSwapClick = useCallback(async () => {
    try {
      if (!bridgeQuoteToExecute) {
        throw new Error('No bridge quote to execute');
      }

      setProofGenerationStatus(ProofGenerationStatus.SWAP_TRANSACTION_SIGNING);
      
      console.log(`[ManualSwap] Starting bridge execution, executionRetryCount: ${executionRetryCountRef.current}`);
      
      await executeQuote(bridgeQuoteToExecute, handleBridgeProgress);
    } catch (error) {
      console.error('[ManualSwap] Bridge execution failed:', error);
      
      executionRetryCountRef.current += 1;
      const newExecutionRetryCount = executionRetryCountRef.current;
      setExecutionRetryCount(newExecutionRetryCount);
      bridgeRetryCountRef.current += 1;
      setBridgeRetryCount(bridgeRetryCountRef.current);
      setProofGenerationStatus(ProofGenerationStatus.SWAP_TRANSACTION_FAILED);

      // Enhanced bridge error handling with user-friendly messages
      const bridgeErrorMessage = getBridgeErrorMessage(error, {
        bridgeProvider: 'relay',
        retryCount: newExecutionRetryCount,
        transactionType: 'execute',
        tokenSymbol: storedQuoteData ? tokenInfo[storedQuoteData.token]?.ticker : undefined,
        networkName: storedQuoteData ? tokenInfo[storedQuoteData.token]?.chainName : undefined,
      });

      setBridgeErrorDetails({
        type: categorizeBridgeError(error, {
          bridgeProvider: 'relay',
          retryCount: newExecutionRetryCount,
          transactionType: 'execute',
        }),
        message: bridgeErrorMessage.title,
        isRetryable: bridgeErrorMessage.isRetryable,
      });

      // Set user-friendly error message for UI display
      setSimulationErrorMessage(`${bridgeErrorMessage.title}: ${bridgeErrorMessage.description}`);

      // Log bridge failures with enhanced Rollbar  
      logError(
        'Relay bridge error - handleSubmitSwapClick',
        ErrorCategory.BRIDGE_ERROR,
        {
          error: (error as any)?.message || error,
          errorStack: (error as any)?.stack,
          intentHash: currentIntentView?.intentHash,
          platform: paymentPlatform,
          paymentMethod,
          executionRetryCount: newExecutionRetryCount,
          quoteRetryCount: quoteRetryCountRef.current,
          totalRetries: bridgeRetryCountRef.current,
          bridgeRoute: storedQuoteData && bridgeQuoteToExecute ? {
            fromChain: BASE_CHAIN_ID,
            toChain: tokenInfo[storedQuoteData.token]?.chainId,
            fromToken: BASE_USDC_ADDRESS,
            toToken: tokenInfo[storedQuoteData.token]?.address,
            amount: storedQuoteData.usdcAmount
          } : null,
          quoteId: (bridgeQuoteToExecute as any)?.quote?.id,
          hasQuote: !!bridgeQuoteToExecute,
          isManualRetry: true,
          canRetryMore: newExecutionRetryCount < MAX_RETRIES,
          // Enhanced error categorization
          bridgeErrorType: categorizeBridgeError(error),
          bridgeErrorSeverity: bridgeErrorMessage.severity,
          bridgeErrorCategory: bridgeErrorMessage.category,
          extensionVersion: sideBarVersion
        }
      );
    }
  }, [bridgeQuoteToExecute, executeQuote, handleBridgeProgress, currentIntentView, logError, paymentPlatform, paymentMethod, bridgeRetryCount, executionRetryCount, quoteRetryCount, storedQuoteData, tokenInfo]);

  const handleManualRetryBridgeQuote = useCallback(() => {
    console.log('[ManualRetry] User initiated manual retry');
    
    // Clear any error messages
    setSimulationErrorMessage(null);
    
    // Reset all retry counters
    resetRetryCounters();
    
    // Clear any pending timers
    clearRetryTimers();
    
    // Ensure polling is enabled
    setShouldPollQuote(true);
    
    // Reset status to trigger quote fetching
    setProofGenerationStatus(ProofGenerationStatus.SWAP_QUOTE_REQUESTING);
    
    // Log manual retry attempt
    logError(
      'Manual bridge retry initiated',
      ErrorCategory.BRIDGE_ERROR,
      {
        intentHash: currentIntentView?.intentHash,
        platform: paymentPlatform,
        paymentMethod,
        previousQuoteRetries: quoteRetryCountRef.current,
        previousExecutionRetries: executionRetryCountRef.current,
        previousTotalRetries: bridgeRetryCountRef.current,
        action: 'manual_retry_reset',
        extensionVersion: sideBarVersion
      }
    );
    
  }, [resetRetryCounters, clearRetryTimers, currentIntentView, paymentPlatform, paymentMethod, logError]);
  
  /*
   * Component
   */
  
  return (
    <Container>
      <TitleContainer>
        <StyledRowBetween>
          <div style={{ flex: 0.25 }}>
            <button
              onClick={handleBackButtonClick}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <StyledArrowLeft/>
            </button>
          </div>

          <ThemedText.HeadlineSmall style={{ flex: '1', margin: 'auto', textAlign: 'center' }}>
            {title}
          </ThemedText.HeadlineSmall>

          <div style={{ flex: 0.2 }}/>
        </StyledRowBetween>

        <Breadcrumb
          currentStep={breadcrumbStep}
          showExtensionStep={!isSidebarInstalled || isSidebarNeedsUpdate}
        />
      </TitleContainer>

      {paymentPlatform && intentHashInput && (
        <ExtensionProofForm
          intentHash={intentHashInput}
          paymentPlatform={paymentPlatform}
          paymentMethod={paymentMethod}
          paymentProofs={paymentProofs}
          setPaymentProofs={setPaymentProofs}
          proofGenerationStatus={proofGenerationStatus}
          setProofGenerationStatus={setProofGenerationStatus}
          handleCompleteOrderClick={handleCompleteOrderClick}
          onProofGenCompletion={handleGoBackToSwapOrCallbackUrl}
          completeOrderTransactionSigningStatus={signFulfillIntentTransactionStatus}
          completeOrderTransactionMiningStatus={mineFulfillIntentTransactionStatus}
          completeOrderTransactionHash={transactionHash || ''}
          showUseReclaimFlow={false}
          handleUseReclaimFlowClick={() => {}}
          bridgingNeeded={bridgingNeeded}
          quoteData={bridgeQuoteFormatted}
          bridgeTransactions={bridgeTransactions}
          handleSubmitSwapClick={handleSubmitSwapClick}
          simulationErrorMessage={simulationErrorMessage}
          setSimulationErrorMessage={setSimulationErrorMessage}
          setTitle={setTitle}
          setBreadcrumbStep={setBreadcrumbStep}
          shouldShowProofDetails={shouldShowProofDetails}
          setShouldShowProofDetails={setShouldShowProofDetails}
          handleManualRetryBridgeQuote={handleManualRetryBridgeQuote}
          bridgeRetryCount={bridgeRetryCount}
          quoteRetryCount={quoteRetryCount}
          executionRetryCount={executionRetryCount}
          maxRetries={MAX_RETRIES}
          bridgeErrorDetails={bridgeErrorDetails}
        />
      )}

      <TallySupportButton
        page="provePayment"
        currentIntentHash={currentIntentView?.intentHash || ''}
        errorMessage={simulationErrorMessage || ''}
        paymentProof={paymentProofs ? safeStringify(paymentProofs) : ''}
      />
    </Container>
  );
};