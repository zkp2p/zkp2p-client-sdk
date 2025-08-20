import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import styled from 'styled-components';
import { colors } from '@theme/colors';


import { Button } from '@components/common/Button';
import { AutoColumn } from '@components/layouts/Column';
import { CustomConnectButton } from "@components/common/ConnectButton";

import Spinner  from '@components/common/Spinner';
import { InputWithCurrencySelector } from "@components/modals/selectors/currency";
import { InputWithTokenSelector } from "@components/modals/selectors/token/InputWithTokenSelector";
import { LabelWithPlatformSelector } from '@components/modals/selectors/platform';
import { AccessoryButton } from '@components/common/AccessoryButton';
import { Input } from "@components/common/Input";
import { IntegrationModal } from '@components/modals/IntegrationModal';
import TallySupportButton from '@components/common/TallySupportButton';
import { QUOTE_DEFAULT_SOL_ADDRESS, QUOTE_DEFAULT_ADDRESS, TRON_CHAIN_ID,QUOTE_DEFAULT_TRON_ADDRESS,ZERO } from '@helpers/constants';
import { BASE_USDC_ADDRESS, BASE_CHAIN_ID, SOLANA_CHAIN_ID, HYPERLIQUID_CHAIN_ID} from '@helpers/constants';
import { Address, LoginStatus } from "@helpers/types";
import { etherUnitsToReadable, tokenUnits, tokenUnitsToReadable } from '@helpers/units';
import { CurrencyType, currencyInfo } from "@helpers/types";
import { PaymentPlatform, paymentPlatformInfo, PaymentPlatformType, paymentPlatforms}  from "@helpers/types";
import { QuoteState, QuoteStateType } from "@helpers/types/status/quoteStatus";
import { extractIntentHashFromLogs } from '@helpers/eventParser';
import { relayTokenAmountToReadable } from "@helpers/units";

import useSignalIntent from "@hooks/transactions/useSignalIntent";
import useSignIntent from "@hooks/backend/useSignIntent";
import useQuoteMaxTokenForExactFiat from "@hooks/backend/useQuoteMaxTokenForFiat";

import useAccount from '@hooks/contexts/useAccount';
import useBalances from '@hooks/contexts/useBalance';
import useBackend from '@hooks/contexts/useBackend';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import useOnRamperIntents from "@hooks/contexts/useOnRamperIntents";
import useMediaQuery from "@hooks/useMediaQuery";
import useIsTouchDevice from "@hooks/useIsTouchDevice";
import useCanInstallExtensions from "@hooks/useCanInstallExtensions";
import useBridgeProvider from '@hooks/bridge/useBridgeProvider';
import { GetPriceParameters } from "@reservoir0x/relay-sdk";
import useQuery from "@hooks/useQuery";
import { useBrowserDetection } from '@hooks/useBrowserDetection';
import { QuoteDetails } from "./QuoteDetails";
import useLocalStorage from '@hooks/useLocalStorage';
import useGeolocation from '@hooks/contexts/useGeolocation';
import { isSupportedCurrency } from "@helpers/types/currency";
import useSessionStorage from '@hooks/useSessionStorage';
import { WarningTextBox } from "@components/common/WarningTextBox";
import { commonStrings } from "@helpers/strings";
import { OnRamperIntentInfo } from "./OnRamperIntentInfo";
import useQuoteMinFiatForToken from "@hooks/backend/useQuoteMinFiatForToken";
import ReferrerInfo from './ReferrerInfo';
import useQuoteStorage from '@hooks/useQuoteStorage';
import useTokenData from '@hooks/contexts/useTokenData';

import { InputWithCurrencyPlatformSelector } from "@components/modals/selectors/currencyPlatform";
import { LabelWithCurrencyPlatformSelector } from '@components/modals/selectors/currencyPlatform';
import QuoteSelectionDisplay from './QuoteSelectionDisplay';
import { SwapQuote } from "@helpers/types/swapQuote";
import { isUsdcToken } from "@helpers/types/tokens";
import { UnverifiedTokenModal } from '@components/modals/UnverifiedTokenModal';
import { useErrorLogger } from '@hooks/useErrorLogger';
import { ErrorCategory, generateCorrelationId } from '@helpers/types/errors';
import useSmartAccount from '@hooks/contexts/useSmartAccount';


const ZERO_QUOTE: SwapQuote = {
  depositId: 0,
  hashedOnchainId: '',
  fiatAmount: ZERO,
  usdcAmount: ZERO,
  usdcToFiatRate: '',
  outputTokenAmount: ZERO,
  outputTokenDecimals: 18,
  outputTokenFormatted: ''
};


interface SwapFormProps {
  onCompleteOrderClick: () => void;
}

const SwapForm: React.FC<SwapFormProps> = ({
  onCompleteOrderClick,
}: SwapFormProps) => {

  /*
   * Contexts
   */

  const isTouchDevice = useIsTouchDevice();
  const deviceSize = useMediaQuery();
  const isMobile = deviceSize === 'mobile';
  const canInstallExtensions = useCanInstallExtensions();
  const { detectBrowser } = useBrowserDetection();
  const browserInfo = detectBrowser();
  // For desktop users, check if browser is allowed. Mobile users see mobile-specific message.
  const canCreateOrders = canInstallExtensions && browserInfo.isAllowedBrowser;

  const { usdcBalance } = useBalances();
  const { tokens, tokenInfo, TOKEN_USDC, refetchToken } = useTokenData();
  const { isLoggedIn, loggedInEthereumAddress, loginStatus } = useAccount();
  const { platformToVerifierAddress, usdcAddress, chainId, escrowAddress } = useSmartContracts();
  const { currentIntentHash, refetchIntentView } = useOnRamperIntents();
  
  const { fetchPayeeDetails, clearPayeeDetails } = useBackend();
  const { 
    getPrice: getBridgePrice,
    isLoading: isBridgeLoading,
    error: bridgeError 
  } = useBridgeProvider({
    enableFallback: true,
    onProviderSwitch: (from, to, reason) => {
      console.log(`[BRIDGE] Provider switch in Swap quotes: ${from} → ${to} (${reason})`);
    },
  });
  
  // Use ref to avoid dependency issues in useEffect
  const getBridgePriceRef = useRef(getBridgePrice);
  useEffect(() => {
    getBridgePriceRef.current = getBridgePrice;
  }, [getBridgePrice]);
  
  const { saveQuoteData } = useQuoteStorage();

  const { queryParams, updateQueryParams, clearReferrerQueryParams } = useQuery();
  const { currencyCode } = useGeolocation();
  const { logError } = useErrorLogger();
  const { isSmartAccountEnabled, eip7702AuthorizationStatus } = useSmartAccount();

  /*
   * Helper function to validate initial values
   */
  const getInitialValues = useMemo(() => {
    const referrer = queryParams.REFERRER;
    const amountFromQuery = queryParams.REFERRER_INPUT_AMOUNT;
    const currencyFromQuery = queryParams.REFERRER_FROM_CURRENCY as CurrencyType;
    const platformFromQuery = queryParams.REFERRER_PAYMENT_PLATFORM as PaymentPlatformType;
    const tokenFromQuery = queryParams.REFERRER_TO_TOKEN ? (queryParams.REFERRER_TO_TOKEN as string).toLowerCase() : undefined;
    const recipientAddressFromQuery = queryParams.REFERRER_RECIPIENT_ADDRESS;
    const amountUsdcFromQuery = queryParams.REFERRER_AMOUNT_USDC;

    const values = {
      fiatAmount: amountFromQuery && isValidFiatInput(amountFromQuery) ? amountFromQuery : '',
      fiatCurrency: isSupportedCurrency(currencyFromQuery) ? currencyFromQuery : (
        currencyCode && isSupportedCurrency(currencyCode) ? currencyCode : 'USD'
      ),
      paymentPlatform: platformFromQuery && Object.values(PaymentPlatform).includes(platformFromQuery) 
        ? platformFromQuery 
        : PaymentPlatform.VENMO,
      token: amountUsdcFromQuery ? TOKEN_USDC : (
        // Allow any token from URL to be set initially, will be validated in useEffect
        tokenFromQuery ? (isUsdcToken(tokenFromQuery) ? TOKEN_USDC : tokenFromQuery) : TOKEN_USDC
      ),
      recipientAddress: recipientAddressFromQuery || '',
      showRecipientInput: !!recipientAddressFromQuery,
      showIntegrationModal: !!referrer,
      usdcAmount: amountUsdcFromQuery ? tokenUnitsToReadable(amountUsdcFromQuery, 6, 2) : '',
      isUsdcAmountFromQuery: !!amountUsdcFromQuery && isValidUsdcInput(amountUsdcFromQuery),
      isExactOutput: !!amountUsdcFromQuery 
        && isValidUsdcInput(amountUsdcFromQuery) 
        && !!recipientAddressFromQuery 
        && isValidAddress(recipientAddressFromQuery, BASE_CHAIN_ID),
    };

    return values;
  }, [queryParams, currencyCode, tokens]);

  const initialValues = getInitialValues;

  /*
   * State
   */
  const [quoteState, setQuoteState] = useState<QuoteStateType>(QuoteState.DEFAULT);
  const [currentQuote, setCurrentQuote] = useState<SwapQuote>(ZERO_QUOTE);
  // Todo: rename to just allQuotes or something
  const [potentialQuotes, setPotentialQuotes] = useState<SwapQuote[]>([]);
  const [selectedQuoteIndex, setSelectedQuoteIndex] = useState<number | null>(null);
  const [isProcessingQuotes, setIsProcessingQuotes] = useState<boolean>(false);
  const [failedQuoteIndices, setFailedQuoteIndices] = useState<Set<number>>(new Set());
  const [quoteFailureWarning, setQuoteFailureWarning] = useState<string | null>(null);
  
  const [fiatAmount, setFiatAmount] = useSessionStorage<string>(
    'lastUsedFiatAmount', 
    initialValues.fiatAmount
  );
  const [fiatCurrency, setFiatCurrency] = useSessionStorage<CurrencyType>(
    'lastUsedFiatCurrency',
    initialValues.fiatCurrency
  );
  const [paymentPlatform, setPaymentPlatform] = useSessionStorage<PaymentPlatformType>(
    'lastUsedPaymentPlatform', 
    initialValues.paymentPlatform
  );
  const [allCurrencyPlatforms, setAllCurrencyPlatforms] = useState<PaymentPlatformType[]>(paymentPlatforms);
  const [token, setToken] = useSessionStorage<string>('token', initialValues.token);

  const [recipientAddress, setRecipientAddress] = useSessionStorage<string>(
    'recipientAddress', 
    initialValues.recipientAddress
  );
  const [showRecipientInput, setShowRecipientInput] = useSessionStorage<boolean>(
    'showRecipientInput', 
    initialValues.showRecipientInput
  );

  const [formattedTokenAmount, setFormattedTokenAmount] = useState<string>(
    initialValues.usdcAmount
  );
  const [formattedTokenAmountInUsd, setFormattedTokenAmountInUsd] = useState<string>(
    initialValues.usdcAmount
  );


  const [showIntegrationModal, setShowIntegrationModal] = useSessionStorage<boolean>(
    'showIntegrationModal', 
    initialValues.showIntegrationModal
  );
  
  const [isExactOutput, setIsExactOutput] = useSessionStorage<boolean>(
    'isExactOutput',
    initialValues.isExactOutput
  );

  const [showQuoteSelection, setShowQuoteSelection] = useState<boolean>(false);
  
  // State for unverified token warning
  const [showUnverifiedWarning, setShowUnverifiedWarning] = useState<boolean>(false);
  const [pendingUnverifiedToken, setPendingUnverifiedToken] = useState<string | null>(null);
  
  // Track approved unverified tokens in session storage
  const [approvedUnverifiedTokens, setApprovedUnverifiedTokens] = useSessionStorage<string[]>(
    'approvedUnverifiedTokens',
    []
  );
  
  const [correlationId] = useState<string>(generateCorrelationId());

  /*
   * Helpers
   */
  const handleUnverifiedToken = useCallback((tokenId: string) => {
    // Only set as pending if user hasn't already approved this unverified token
    if (!approvedUnverifiedTokens.includes(tokenId)) {
      setPendingUnverifiedToken(tokenId);
    }
  }, [approvedUnverifiedTokens]);

  /*
   * Contract Writes
   */
  
  const onSignalIntentSuccessCallback = useCallback(async (data: any) => {
    setShouldConfigureSignalIntentWrite(false);
    
    let intentHash = '';
    
    // Save quote (with swap) data to localStorage; even though one user would have only one
    // open intent at a time, we save it against the intent hash to avoid collision 
    // when multiple users have open intents at the same time on the same device
    if (data && (data.logs || (data.transactionHash && data.transactionHash.logs))) {
      const logs = data.logs || (data.transactionHash && data.transactionHash.logs);
      intentHash = extractIntentHashFromLogs(logs) || '';

      const quoteData = {
        fiatAmount: fiatAmount,
        fiatCurrency: fiatCurrency,
        token: token,
        usdcAmount: currentQuote.usdcAmount.toString(),
        tokenAmount: formattedTokenAmount,
        recipientAddress: recipientAddress,
        outputTokenAmount: currentQuote.outputTokenAmount.toString(),
        outputTokenDecimals: currentQuote.outputTokenDecimals,
        outputTokenAmountInUsd: currentQuote.outputTokenAmountInUsd,
        usdcToFiatRate: currentQuote.usdcToFiatRate,
        usdcToTokenRate: currentQuote.usdcToTokenRate,
        gasFeesInUsd: currentQuote.gasFeesInUsd,
        appFeeInUsd: currentQuote.appFeeInUsd,
        relayerFeeInUsd: currentQuote.relayerFeeInUsd,
        relayerGasFeesInUsd: currentQuote.relayerGasFeesInUsd,
        relayerServiceFeesInUsd: currentQuote.relayerServiceFeesInUsd,
        timeEstimate: currentQuote.timeEstimate,
        paymentPlatform: paymentPlatform,
        transactionHash: data.hash || undefined,
        intentHash: intentHash || undefined
      };
      
      // Use logged-in address as the key - available immediately
      if (loggedInEthereumAddress) {
        saveQuoteData(loggedInEthereumAddress, intentHash, quoteData);
      }
    }

    // Fetch intent from chain and payee details in parallel
    try {
      await Promise.all([
        refetchIntentView(),
        fetchPayeeDetails(currentQuote.hashedOnchainId, paymentPlatform)
      ]);
    } catch (error) {
      // Log the error but don't block navigation - the transaction has already succeeded
      console.error('Failed to fetch post-transaction data:', error);
      
      // Log to error tracking service
      logError(
        'Post-transaction data fetch failed',
        ErrorCategory.API_ERROR,
        {
          error: (error as any)?.message || error,
          intentHash: intentHash,
          paymentPlatform,
          // Transaction was successful, this is just supplementary data
          transactionSuccessful: true,
        },
        correlationId
      );
    }

    // Set state to done and clear form regardless of fetch success
    // The transaction has succeeded, so we should always navigate
    setQuoteState(QuoteState.DONE);
    setFiatAmount('');
    setCurrentQuote(ZERO_QUOTE);
    setPotentialQuotes([]);
    setSelectedQuoteIndex(null);
    setFailedQuoteIndices(new Set());

    // Complete order - navigate to Send page
    onCompleteOrderClick();
  }, [
    refetchIntentView, 
    paymentPlatform, 
    currentQuote, 
    fiatAmount, 
    fiatCurrency, 
    token, 
    formattedTokenAmount, 
    recipientAddress,  
    saveQuoteData, 
    loggedInEthereumAddress,
    logError,
    correlationId
  ]);

  const [shouldRetryWithNextQuote, setShouldRetryWithNextQuote] = useState(false);

  const onSignalIntentFailedCallback = useCallback(async (error: any) => {
    console.error('writeSignalIntentAsync failed: ', error);

    // Reset the signed intent configuration to prevent stale data
    setShouldConfigureSignalIntentWrite(false);

    // Check if this is a user rejection (EIP-1193 error code 4001)
    const isUserRejection = error?.cause?.code === 4001 || 
                           error?.cause?.cause?.code === 4001 ||
                           error?.code === 4001 ||
                           error?.message?.includes('User denied') ||
                           error?.message?.includes('User rejected');

    if (isUserRejection) {
      // User cancelled - don't mark quote as failed, just reset the transaction state
      setQuoteState(QuoteState.FETCH_QUOTE_SUCCESS);
      return;
    }

    // This is a real error, not a user rejection
    // Log transaction failure
    logError(
      'Signal intent transaction failed',
      ErrorCategory.CONTRACT_ERROR,
      {
        error: error?.message || error,
        errorStack: error?.stack,
        errorCode: error?.code,
        selectedQuoteIndex,
        totalQuotes: potentialQuotes.length,
        failedQuoteCount: failedQuoteIndices.size,
        currentQuote: selectedQuoteIndex !== null ? {
          depositId: potentialQuotes[selectedQuoteIndex]?.depositId,
          usdcAmount: potentialQuotes[selectedQuoteIndex]?.usdcAmount?.toString(),
        } : null,
        fiatAmount,
        fiatCurrency,
        paymentPlatform,
        // Don't log full recipient address for PII
        hasRecipientAddress: !!recipientAddress,
        smartAccountState: {
          isEnabled: isSmartAccountEnabled,
          isAuthorized: eip7702AuthorizationStatus === 'authorized'
        },
      },
      correlationId
    );
    
    // Check if we have more quotes to try
    if (selectedQuoteIndex !== null && potentialQuotes.length > selectedQuoteIndex + 1) {
      // Mark current quote as failed
      setFailedQuoteIndices(prev => new Set([...prev, selectedQuoteIndex]));
      
      // Set flag to trigger retry in useEffect
      setShouldRetryWithNextQuote(true);
    } else {
      // No more quotes to try
      setPotentialQuotes([]);
      setSelectedQuoteIndex(null);
      setQuoteState(QuoteState.FAILED_TO_FETCH_SIGNED_INTENT);
      refetchIntentView?.();
    }
  }, [refetchIntentView, selectedQuoteIndex, potentialQuotes, setQuoteState]);

  const {
    writeSignalIntentAsync,
    setDepositIdInput,
    setTokenAmountInput,
    recipientAddressInput,
    setRecipientAddressInput,
    setVerifierAddressInput,
    setCurrencyCodeHashInput,
    setGatingServiceSignatureInput,
    shouldConfigureSignalIntentWrite,
    setShouldConfigureSignalIntentWrite,
    signSignalIntentTransactionStatus,
    mineSignalIntentTransactionStatus
  } = useSignalIntent(
    onSignalIntentSuccessCallback, 
    onSignalIntentFailedCallback
  );

  /*
   * Fetch Quote from Backend
   */

  const {
    data: quoteResponse,
    isLoading: isFetchingQuote,
    error: quoteError,
    fetchQuote: quoteMaxTokenForExactFiat
  } = useQuoteMaxTokenForExactFiat();

  const {
    data: quoteMinFiatForTokenResponse,
    isLoading: isFetchingQuoteMinFiatForToken,
    error: quoteMinFiatForTokenError,
    fetchQuote: quoteMinFiatForToken
  } = useQuoteMinFiatForToken();

  /*
   * Process Quote
   */
  const _processSingleRawQuote = useCallback(async (rawQuote: any, inputFiatAmount: string): Promise<SwapQuote | null> => {
    try {
      const usdcAmountBigNum = BigInt(rawQuote.tokenAmount);
      const conversionRate = etherUnitsToReadable(BigInt(rawQuote.conversionRate), 4);
      let processedQuote: SwapQuote = {
        ...ZERO_QUOTE,
        fiatAmount: tokenUnits(inputFiatAmount, 6), // Assuming 6 decimals for fiat input display consistency
        usdcAmount: usdcAmountBigNum,
        depositId: Number(rawQuote.intent.depositId),
        hashedOnchainId: rawQuote.intent.payeeDetails,
        usdcToFiatRate: conversionRate,
      };

      if (token === TOKEN_USDC) {
        processedQuote = {
          ...processedQuote,
          outputTokenAmount: usdcAmountBigNum,
          outputTokenDecimals: 6, // USDC decimals
          outputTokenFormatted: tokenUnitsToReadable(usdcAmountBigNum, 6, 2),
          outputTokenAmountInUsd: tokenUnitsToReadable(usdcAmountBigNum, 6, 2),
        };
      } else {
        // Skip processing if token address is invalid
        if (!tokenInfo[token].address) {
          console.error("Invalid token address for", token);
          return null;
        }
        const originChainId = BASE_CHAIN_ID;
        const destinationChainId = tokenInfo[token].chainId;
        const params: GetPriceParameters = {
          user: loggedInEthereumAddress as Address || QUOTE_DEFAULT_ADDRESS,
          recipient: tokenInfo[token] && tokenInfo[token].chainId === SOLANA_CHAIN_ID 
            ? QUOTE_DEFAULT_SOL_ADDRESS as any 
            : tokenInfo[token].chainId === TRON_CHAIN_ID
              ? QUOTE_DEFAULT_TRON_ADDRESS as any
              : tokenInfo[token].chainId === HYPERLIQUID_CHAIN_ID
                ? QUOTE_DEFAULT_ADDRESS // Use default EVM address for Hyperliquid
                : QUOTE_DEFAULT_ADDRESS,
          originChainId,
          destinationChainId,
          originCurrency: BASE_USDC_ADDRESS,
          destinationCurrency: tokenInfo[token].address,
          amount: rawQuote.tokenAmount.toString(),
          tradeType: 'EXACT_INPUT',
        };

        const relayResult = await getBridgePriceRef.current(params);
        
        // If no relay routes available, skip this quote
        if (!relayResult) {
          return null;
        }
        
        const outAmount = relayResult?.details?.currencyOut?.amount ?? '0';
        processedQuote = {
          ...processedQuote,
          outputTokenAmount: BigInt(outAmount),
          outputTokenDecimals: tokenInfo[token].decimals,
          outputTokenFormatted: relayTokenAmountToReadable(relayResult?.details?.currencyOut?.amountFormatted),
          outputTokenAmountInUsd: Number(relayResult?.details?.currencyOut?.amountUsd).toFixed(2),
          gasFeesInUsd: Number(relayResult?.fees?.gas?.amountUsd).toFixed(4),
          appFeeInUsd: Number(relayResult?.fees?.app?.amountUsd).toFixed(4),
          relayerFeeInUsd: Number(relayResult?.fees?.relayer?.amountUsd).toFixed(4),
          relayerGasFeesInUsd: Number(relayResult?.fees?.relayerGas?.amountUsd).toFixed(4),
          relayerServiceFeesInUsd: Number(relayResult?.fees?.relayerService?.amountUsd).toFixed(4),
          usdcToTokenRate: relayResult?.details?.rate,
          timeEstimate: relayResult?.details?.timeEstimate?.toString(),
        };
      }
      return processedQuote;
    } catch (err: any) {
      // Only log unexpected errors, not "no routes" scenarios
      if (!err.message?.includes('No routes found')) {
        console.error("Error processing single raw quote:", err);
      }
      return null; // Return null or a specific error structure if a quote fails processing
    }
  }, [token, TOKEN_USDC, tokenInfo, loggedInEthereumAddress]);

  useEffect(() => {
    if (quoteResponse && !isExactOutput) { // Process multiple quotes only if not exact output
      const { quotes: rawQuotes } = quoteResponse.responseObject;

      if (!rawQuotes || rawQuotes.length === 0) {
        updateQuoteErrorState(QuoteState.FAILED_TO_FETCH_QUOTE);
        setPotentialQuotes([]);
        setSelectedQuoteIndex(null);
        setFailedQuoteIndices(new Set());
        return;
      }

      // Process all quotes
      const processAllQuotes = async () => {
        setIsProcessingQuotes(true);
        try {
          const processedQuotesPromises = rawQuotes.map(
            (rawQuote: any) => _processSingleRawQuote(rawQuote, fiatAmount || "0")
          );
          const settledQuotes = await Promise.allSettled(processedQuotesPromises);

          const successfulQuotes = settledQuotes
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => (result as PromiseFulfilledResult<SwapQuote>).value);


          if (successfulQuotes.length > 0) {
            setPotentialQuotes(successfulQuotes);
            // Find first non-failed quote
            let bestQuoteIndex = 0;
            while (bestQuoteIndex < successfulQuotes.length && failedQuoteIndices.has(bestQuoteIndex)) {
              bestQuoteIndex++;
            }
            
            let selectedQuote: SwapQuote;
            if (bestQuoteIndex < successfulQuotes.length) {
              selectedQuote = successfulQuotes[bestQuoteIndex];
              setSelectedQuoteIndex(bestQuoteIndex);
              setCurrentQuote(selectedQuote);
            } else {
              // All quotes have failed before, reset failed indices
              setFailedQuoteIndices(new Set());
              selectedQuote = successfulQuotes[0];
              setSelectedQuoteIndex(0);
              setCurrentQuote(selectedQuote);
            }

            // Update inputs needed for signalIntent based on the auto-selected quote
            setDepositIdInput(Number(selectedQuote.depositId));
            setTokenAmountInput(selectedQuote.usdcAmount.toString());

            // Validate address with the new auto-selected quote's context
            const isRecipientValid = isValidAddress(recipientAddress, tokenInfo[token].chainId);
            if (!isRecipientValid) {
              updateQuoteErrorState(QuoteState.INVALID_RECIPIENT_ADDRESS);
              return;
            }

            setQuoteState(QuoteState.FETCH_QUOTE_SUCCESS);
          } else {
            updateQuoteErrorState(QuoteState.FAILED_TO_FETCH_QUOTE);
            setPotentialQuotes([]);
            setSelectedQuoteIndex(null);
            setFailedQuoteIndices(new Set());
          }
        } catch (error) {
          updateQuoteErrorState(QuoteState.FAILED_TO_FETCH_QUOTE);
        } finally {
          setIsProcessingQuotes(false);
        }
      };

      processAllQuotes();

    } else if (quoteResponse && isExactOutput) { // Existing logic for exact output
      const { quotes } = quoteResponse.responseObject;
      const quote = quotes[0];
      setDepositIdInput(Number(quote.intent.depositId));
      setTokenAmountInput(quote.tokenAmount.toString());

      const conversionRate = etherUnitsToReadable(BigInt(quote.conversionRate), 4);

      // Create a new quote object to avoid partial updates
      const newQuote = {
        ...ZERO_QUOTE,
        usdcAmount: BigInt(quote.tokenAmount),
        depositId: Number(quote.intent.depositId),
        hashedOnchainId: quote.intent.payeeDetails,
        usdcToFiatRate: conversionRate,
      };
      
      if (token === TOKEN_USDC) {
        setCurrentQuote(newQuote);
        setQuoteState(QuoteState.FETCH_QUOTE_SUCCESS);
      } else {
        // Non-USDC quotes that require a conversion (this part remains similar)
        const doConversion = async () => {
          try {
            // Skip processing if token address is invalid
            if (!tokenInfo[token].address || tokenInfo[token].address === '0x0000000000000000000000000000000000000000') {
              console.error("Invalid token address for", token);
              setQuoteState(QuoteState.FAILED_TO_FETCH_QUOTE);
              return;
            }
            const originChainId = BASE_CHAIN_ID;
            const destinationChainId = tokenInfo[token].chainId;
            const params: GetPriceParameters = {
              user: loggedInEthereumAddress as Address || QUOTE_DEFAULT_ADDRESS,
              recipient: tokenInfo[token] && tokenInfo[token].chainId === SOLANA_CHAIN_ID 
                ? QUOTE_DEFAULT_SOL_ADDRESS as any 
                : tokenInfo[token].chainId === TRON_CHAIN_ID
                  ? QUOTE_DEFAULT_TRON_ADDRESS as any
                  : QUOTE_DEFAULT_ADDRESS,
              originChainId,
              destinationChainId,
              originCurrency: BASE_USDC_ADDRESS,
              destinationCurrency: tokenInfo[token].address,
              amount: quote.tokenAmount.toString(),
              tradeType: 'EXACT_INPUT',
            };
  
            const relayResult = await getBridgePriceRef.current(params);
            
            // If no relay routes available, show appropriate error
            if (!relayResult) {
              setQuoteState(QuoteState.FAILED_TO_FETCH_QUOTE);
              return;
            }
            
  
            const outAmount = relayResult?.details?.currencyOut?.amount ?? '0';
            
            setCurrentQuote({
              ...newQuote,
              outputTokenAmount: BigInt(outAmount),
              outputTokenDecimals: tokenInfo[token].decimals,
              outputTokenFormatted: relayTokenAmountToReadable(relayResult?.details?.currencyOut?.amountFormatted),
              outputTokenAmountInUsd: Number(relayResult?.details?.currencyOut?.amountUsd).toFixed(2),
              gasFeesInUsd: Number(relayResult?.fees?.gas?.amountUsd).toFixed(4),
              appFeeInUsd: Number(relayResult?.fees?.app?.amountUsd).toFixed(4),
              relayerFeeInUsd: Number(relayResult?.fees?.relayer?.amountUsd).toFixed(4),
              relayerGasFeesInUsd: Number(relayResult?.fees?.relayerGas?.amountUsd).toFixed(4),
              relayerServiceFeesInUsd: Number(relayResult?.fees?.relayerService?.amountUsd).toFixed(4),
              usdcToTokenRate: relayResult?.details?.rate,
              timeEstimate: relayResult?.details?.timeEstimate?.toString(),
            });

            const isRecipientValid = isValidAddress(recipientAddress, tokenInfo[token].chainId);
            if (!isRecipientValid) {
              updateQuoteErrorState(QuoteState.INVALID_RECIPIENT_ADDRESS);
              return;
            }
            setQuoteState(QuoteState.FETCH_QUOTE_SUCCESS);
          } catch (err: any) {
            // Only log unexpected errors, not "no routes" scenarios
            if (!err.message?.includes('No routes found')) {
              console.error("Aggregator conversion error (exact output):", err);
            }
            setCurrentQuote(ZERO_QUOTE);
            setQuoteState(QuoteState.FAILED_TO_FETCH_QUOTE);
          }
        };
        doConversion();
      }
    }
  }, [
    quoteResponse, 
    token, 
    usdcAddress, 
    // isExactOutput, 
    // _processSingleRawQuote, 
    // loggedInEthereumAddress, 
    // tokenInfo, 
    // recipientAddress, 
    // quoteState
  ]);


  useEffect(() => {
    if (currentIntentHash) {
      updateQuoteErrorState(QuoteState.EXCEEDS_ORDER_COUNT);
      setPotentialQuotes([]);
      setSelectedQuoteIndex(null);
      setFailedQuoteIndices(new Set());
      return;
    }

    if (quoteMinFiatForTokenResponse) {

      const { quotes } = quoteMinFiatForTokenResponse.responseObject;
      const quote = quotes[0];
      const usdcAmount = quote.tokenAmount.toString();
      const usdcToFiatRate = etherUnitsToReadable(BigInt(quote.conversionRate), 4);

      setDepositIdInput(Number(quote.intent.depositId));
      setFiatAmount(tokenUnitsToReadable(quote.fiatAmount, 6, 2));
      setTokenAmountInput(usdcAmount.toString());

      const newQuote = {
        ...ZERO_QUOTE,
        fiatAmount: BigInt(quote.fiatAmount),
        usdcAmount: BigInt(usdcAmount),
        depositId: Number(quote.intent.depositId),
        hashedOnchainId: quote.intent.payeeDetails,
        usdcToFiatRate: usdcToFiatRate,
      };

      setCurrentQuote(newQuote);
      setQuoteState(QuoteState.FETCH_QUOTE_SUCCESS);
    }
  }, [quoteMinFiatForTokenResponse]);

  useEffect(() => {
    if (quoteError) {
      console.error("quoteError: ", quoteError);

      // Reset state
      setPotentialQuotes([]);
      setSelectedQuoteIndex(null);
      setFailedQuoteIndices(new Set());
      setQuoteFailureWarning(null);
      
      // Log quote fetching error
      logError(
        'Quote fetching failed',
        ErrorCategory.API_ERROR,
        {
          error: quoteError?.message || quoteError,
          errorStack: (quoteError as any)?.stack,
          isRateLimitError: quoteError.message.includes('Too Many Requests'),
          fiatAmount,
          fiatCurrency,
          paymentPlatform,
          token,
          // Don't log full addresses for PII
          hasRecipientAddress: !!recipientAddress,
          hasUserAddress: !!loggedInEthereumAddress,
          smartAccountState: {
            isEnabled: isSmartAccountEnabled,
            isAuthorized: eip7702AuthorizationStatus === 'authorized'
          },
        },
        correlationId
      );

      // Update error state
      if (quoteError.message.includes('Too Many Requests')) {
        updateQuoteErrorState(QuoteState.TOO_MANY_REQUESTS_FAILED_TO_FETCH_QUOTE);
      } else {
        updateQuoteErrorState(QuoteState.FAILED_TO_FETCH_QUOTE);
      }
    }
  }, [quoteError, fiatAmount, fiatCurrency, paymentPlatform, token, recipientAddress, loggedInEthereumAddress, logError, correlationId, isSmartAccountEnabled, eip7702AuthorizationStatus]);

  useEffect(() => {
    if (currentIntentHash) {
      updateQuoteErrorState(QuoteState.EXCEEDS_ORDER_COUNT);
      setPotentialQuotes([]);
      setSelectedQuoteIndex(null);
      setFailedQuoteIndices(new Set());
      return;
    }

    if (quoteMinFiatForTokenError) {
      setFiatAmount('');
      updateQuoteErrorState(QuoteState.FAILED_TO_FETCH_QUOTE);
    }
  }, [quoteMinFiatForTokenError]);

  const updateQuoteErrorState = useCallback((error: QuoteStateType) => {
    setQuoteState(error);
    setShouldConfigureSignalIntentWrite(false);
  }, [setShouldConfigureSignalIntentWrite]);

  const handleQuoteSelected = useCallback((quote: SwapQuote, index: number) => {
    setSelectedQuoteIndex(index);
    setCurrentQuote(quote); // Set the main currentQuote to the selected one
    
    // Update inputs needed for signalIntent based on the selected quote
    setDepositIdInput(Number(quote.depositId));
    setTokenAmountInput(quote.usdcAmount.toString()); // Assuming signal intent always uses USDC amount from the chosen quote

    const isRecipientValid = isValidAddress(recipientAddress, tokenInfo[token].chainId);
    if (!isRecipientValid) {
      updateQuoteErrorState(QuoteState.INVALID_RECIPIENT_ADDRESS);
    } else {
      setQuoteState(QuoteState.FETCH_QUOTE_SUCCESS); // Move to success state, ready for submission
    }
  }, [recipientAddress, token, tokenInfo, setDepositIdInput, setTokenAmountInput, updateQuoteErrorState, setQuoteState]);

  /*
   * Fetch Signed Intent from Backend
   */

  const {
    data: signedIntentResponse,
    isLoading: isFetchingSignedIntent,
    error: signedIntentError,
    fetchSignedIntent
  } = useSignIntent();

  useEffect(() => {
    if (signedIntentResponse) {

      // If user is swapping to another token on any chain (native or non-native), use the logged 
      // in ethereum address (embedded or injected) for receiving intermediary USDC
      const usdcRecipientAddress = token !== TOKEN_USDC ? loggedInEthereumAddress : recipientAddress;

      setRecipientAddressInput(usdcRecipientAddress);
      setVerifierAddressInput(platformToVerifierAddress[paymentPlatform] ?? "");
      setCurrencyCodeHashInput(currencyInfo[fiatCurrency].currencyCodeHash);
      setGatingServiceSignatureInput(signedIntentResponse.responseObject.signedIntent);

      setShouldConfigureSignalIntentWrite(true);
    }
  }, [signedIntentResponse]);

  useEffect(() => {
    if (signedIntentError) {
      console.error("signedIntentError: ", signedIntentError);
      
      // Log signed intent error
      logError(
        'Signed intent verification failed',
        ErrorCategory.API_ERROR,
        {
          error: signedIntentError?.message || signedIntentError,
          errorStack: (signedIntentError as any)?.stack,
          selectedQuoteIndex,
          totalQuotes: potentialQuotes.length,
          failedQuoteCount: failedQuoteIndices.size,
          currentQuote: selectedQuoteIndex !== null ? {
            depositId: potentialQuotes[selectedQuoteIndex]?.depositId,
            usdcAmount: potentialQuotes[selectedQuoteIndex]?.usdcAmount?.toString(),
          } : null,
          fiatAmount,
          fiatCurrency,
          paymentPlatform,
          // Don't log full recipient address for PII
          hasRecipientAddress: !!recipientAddress,
        },
        correlationId
      );

      // Check if we have more quotes to try
      if (selectedQuoteIndex !== null && potentialQuotes.length > selectedQuoteIndex + 1) {
        // Mark current quote as failed
        setFailedQuoteIndices(prev => new Set([...prev, selectedQuoteIndex]));
        
        // Find next valid quote (skip any previously failed ones)
        let nextIndex = selectedQuoteIndex + 1;
        while (nextIndex < potentialQuotes.length && failedQuoteIndices.has(nextIndex)) {
          nextIndex++;
        }
        
        if (nextIndex < potentialQuotes.length) {
          // Select next quote but don't submit automatically
          const nextQuote = potentialQuotes[nextIndex];
          setQuoteFailureWarning(commonStrings.get('QUOTE_FAILED_TRY_NEXT'));
          handleQuoteSelected(nextQuote, nextIndex);
          
          // Update quote state to be ready for user action
          setQuoteState(QuoteState.FETCH_QUOTE_SUCCESS);
        } else {
          // No more quotes available
          updateQuoteErrorState(QuoteState.FAILED_TO_FETCH_SIGNED_INTENT);
          setQuoteFailureWarning(commonStrings.get('ALL_QUOTES_FAILED'));
        }
      } else {
        // No more quotes to try
        updateQuoteErrorState(QuoteState.FAILED_TO_FETCH_SIGNED_INTENT);
      }
    }
  }, [signedIntentError, selectedQuoteIndex, potentialQuotes, failedQuoteIndices, handleQuoteSelected]);

  /*
   * Hooks
   */

  useEffect(() => {
    if (currencyCode) {
      // Only set if there's no existing stored value
      const storedCurrency = window.sessionStorage.getItem('lastUsedFiatCurrency');
      if (!storedCurrency) {
        const currencyFromQuery = queryParams.REFERRER_FROM_CURRENCY;
        if (currencyFromQuery && isSupportedCurrency(currencyFromQuery)) {
          setFiatCurrency(currencyFromQuery);
        } else if (isSupportedCurrency(currencyCode)) {
          setFiatCurrency(currencyCode);
        } else {
          setFiatCurrency('USD');
        }
      }
    }
  }, [currencyCode]);

  useEffect(() => {

    if (!tokenInfo[token] || !tokenInfo[token].chainId) {
      return;
    }

    const recipientAddressFromQuery = queryParams.REFERRER_RECIPIENT_ADDRESS;
    const recipientAddressIsValid = recipientAddressFromQuery && isValidOrEmptyAddress(recipientAddressFromQuery, tokenInfo[token].chainId);
    if (recipientAddressIsValid) {
      setRecipientAddress(recipientAddressFromQuery);
      setShowRecipientInput(true);
      return;
    }

    if (isLoggedIn && loggedInEthereumAddress) {
      // If user is receiving SOL/ETH/POLYGON/SONIC and is logged in using embedded wallet,
      // set the recipient address to empty string and show the recipient input field
      if (
        tokenInfo[token].vmType !== 'evm' ||
        (
          tokenInfo[token].vmType === 'evm' 
          && tokenInfo[token].chainId !== BASE_CHAIN_ID
          && loginStatus === LoginStatus.AUTHENTICATED)
      ) {
        setRecipientAddress('');
        setShowRecipientInput(true);
      } else {
        setRecipientAddress(loggedInEthereumAddress);
      }
    }
  }, [isLoggedIn, loggedInEthereumAddress, token]);


  useEffect(() => {
    const fetchUsdcQuote = async () => {
      const amountUsdcFromQuery = queryParams.REFERRER_AMOUNT_USDC;
      const amountUsdcIsValid = amountUsdcFromQuery && isValidUsdcInput(amountUsdcFromQuery);
      
      // Return early if any required condition is not met
      if (amountUsdcIsValid && paymentPlatform && usdcAddress && fiatCurrency) {
        try {
          setQuoteState(QuoteState.FETCHING_QUOTE);

          await quoteMinFiatForToken({
            paymentPlatforms: [paymentPlatform],
            fiatCurrency: fiatCurrency,
            user: loggedInEthereumAddress || QUOTE_DEFAULT_ADDRESS,
            recipient: recipientAddress || QUOTE_DEFAULT_ADDRESS,
            destinationChainId: Number(chainId),
            destinationToken: usdcAddress,
            exactTokenAmount: amountUsdcFromQuery
          });
        } catch (error) {
          console.error('Error fetching USDC quote:', error);
          // Reset flag if there's an error
          setQuoteState(QuoteState.FAILED_TO_FETCH_QUOTE);
        }
      }
    };
    
    if (isExactOutput && !currentIntentHash) {
      fetchUsdcQuote();
    }
  }, [
    paymentPlatform,
    usdcAddress,
    fiatCurrency,
    quoteMinFiatForToken,
    isExactOutput,
    currentIntentHash
  ]);

  useEffect(() => {
    const allCurrencyPlatforms = Object.values(paymentPlatformInfo).filter(platform => 
      platform.platformCurrencies.includes(fiatCurrency)
    ).map(platform => platform.platformId);

    if (allCurrencyPlatforms.length > 0) {
      // If current platform doesn't support this currency, switch to first supported platform
      if (!allCurrencyPlatforms.includes(paymentPlatform)) {
        setPaymentPlatform(allCurrencyPlatforms[0]);
      }
    }
    setAllCurrencyPlatforms(allCurrencyPlatforms);
  }, [fiatCurrency, setPaymentPlatform]);

  useEffect(() => {
    if (!canInstallExtensions) {
      // Only set the state without clearing the quote
      updateQuoteErrorState(QuoteState.PLATFORM_NOT_SUPPORTED_ON_MOBILE);
    }
  }, [canInstallExtensions]);

  /*
   * Quote State
   */

  useEffect(() => {
    if (currentIntentHash) {
      updateQuoteErrorState(QuoteState.EXCEEDS_ORDER_COUNT);
      return;
    }
  }, [currentIntentHash]);

  useEffect(() => {

    if (!tokenInfo[token] || !tokenInfo[token].chainId) {
      return;
    }

    if (currentIntentHash || isExactOutput) {
      return;
    }

    if (fiatAmount === '' || fiatAmount === '0' || fiatAmount === '0.') {
      updateQuoteErrorState(QuoteState.DEFAULT);
      setCurrentQuote(ZERO_QUOTE);
      setPotentialQuotes([]);
      setSelectedQuoteIndex(null);
      setFailedQuoteIndices(new Set());
      return;
    }

    const usdcDecimals = 6; // USDC Decimals
    const fiatBn = tokenUnits(fiatAmount, usdcDecimals)
    const minFiatAmountPlatform = paymentPlatformInfo[paymentPlatform]?.minFiatAmount;
    if (minFiatAmountPlatform) { // Ensure minFiatAmountPlatform is defined
      const minFiatBn = tokenUnits(minFiatAmountPlatform, usdcDecimals);
      if (fiatBn < minFiatBn) {
        updateQuoteErrorState(QuoteState.AMOUNT_BELOW_TRANSFER_MIN);
        return;
      }
    }

    const isRecipientValidOrEmpty = isValidOrEmptyAddress(recipientAddress, tokenInfo[token].chainId);
    if (!isRecipientValidOrEmpty) {
      updateQuoteErrorState(QuoteState.INVALID_RECIPIENT_ADDRESS);
      return;
    }


    const fetchQuote = async () => {
      if (usdcAddress) {
        setQuoteState(QuoteState.FETCHING_QUOTE);
        setPotentialQuotes([]); // Clear old quotes when fetching new ones
        setSelectedQuoteIndex(null);
        setFailedQuoteIndices(new Set());

        await quoteMaxTokenForExactFiat({
          paymentPlatforms: [paymentPlatform],
          fiatCurrency: fiatCurrency,
          user: loggedInEthereumAddress || QUOTE_DEFAULT_ADDRESS,
          recipient: recipientAddress || QUOTE_DEFAULT_ADDRESS,
          destinationChainId: Number(chainId) || BASE_CHAIN_ID,
          destinationToken: usdcAddress,
          exactFiatAmount: fiatBn.toString(),
        });
      }
    }

    fetchQuote();
  }, [
    fiatAmount,
    paymentPlatform,
    token,
    fiatCurrency,
    usdcAddress,
    currentIntentHash,
    recipientAddress,
    loggedInEthereumAddress,
    quoteMaxTokenForExactFiat,
  ]);

  useEffect(() => {
    const updateSignalIntentStatus = async () => {
      const successfulVerificationTransaction = mineSignalIntentTransactionStatus === 'success';
      if (successfulVerificationTransaction) {
        // do nothing
      } else {
        const signingSignalIntentTransaction = signSignalIntentTransactionStatus === 'loading';
        const miningSignalIntentTransaction = mineSignalIntentTransactionStatus === 'loading';

        if (signingSignalIntentTransaction) {
          setQuoteState(QuoteState.SIGNAL_INTENT_TRANSACTION_LOADING);
        } else if (miningSignalIntentTransaction) {
          setQuoteState(QuoteState.SIGNAL_INTENT_TRANSACTION_MINING);
        }
      }
    }

    updateSignalIntentStatus();
  }, [
      signSignalIntentTransactionStatus,
      mineSignalIntentTransactionStatus,
    ]
  );

  useEffect(() => {
    const executeSignalIntent = async () => {
      const statusForExecution = 
        signSignalIntentTransactionStatus === 'idle' || 
        signSignalIntentTransactionStatus === 'error' ||
        signSignalIntentTransactionStatus === 'success';

      if (shouldConfigureSignalIntentWrite && writeSignalIntentAsync && statusForExecution) {
        try {
          setShouldConfigureSignalIntentWrite(false);

          await writeSignalIntentAsync();
        } catch (error) {
          console.error('writeSignalIntentAsync failed: ', error);
          
          // Log execution error
          logError(
            'Signal intent execution failed',
            ErrorCategory.CONTRACT_ERROR,
            {
              error: (error as any)?.message || error,
              errorStack: (error as any)?.stack,
              errorCode: (error as any)?.code,
              selectedQuoteIndex,
              totalQuotes: potentialQuotes.length,
              currentQuote: selectedQuoteIndex !== null && potentialQuotes[selectedQuoteIndex] ? {
                depositId: potentialQuotes[selectedQuoteIndex]?.depositId,
                usdcAmount: potentialQuotes[selectedQuoteIndex]?.usdcAmount?.toString(),
              } : {
                depositId: currentQuote?.depositId,
                usdcAmount: currentQuote?.usdcAmount?.toString(),
              },
              // Don't log full recipient address for PII
              hasRecipientAddress: !!recipientAddressInput,
              fiatAmount,
              fiatCurrency,
              paymentPlatform,
              smartAccountState: {
                isEnabled: isSmartAccountEnabled,
                isAuthorized: eip7702AuthorizationStatus === 'authorized'
              },
            },
            correlationId
          );
          
          updateQuoteErrorState(QuoteState.SIGNAL_INTENT_TRANSACTION_FAILED);
        }
      }
    };

    executeSignalIntent();
  }, [
    shouldConfigureSignalIntentWrite, 
    writeSignalIntentAsync, 
    signSignalIntentTransactionStatus
  ]);

  useEffect(() => {
    if (token === TOKEN_USDC) {
      const usdcAmount = selectedQuoteIndex !== null && potentialQuotes[selectedQuoteIndex]
        ? tokenUnitsToReadable(potentialQuotes[selectedQuoteIndex].usdcAmount, 6, 2)
        : tokenUnitsToReadable(currentQuote.usdcAmount, 6, 2);
      const finalUsdcAmount = usdcAmount !== '0' ? usdcAmount : '0.00';
      setFormattedTokenAmount(finalUsdcAmount);
      setFormattedTokenAmountInUsd(finalUsdcAmount !== '0.00' ? `$${finalUsdcAmount}` : '');

    } else if (selectedQuoteIndex !== null && potentialQuotes[selectedQuoteIndex]) {
      const selected = potentialQuotes[selectedQuoteIndex];
      setFormattedTokenAmount(selected.outputTokenFormatted);
      setFormattedTokenAmountInUsd(selected.outputTokenAmountInUsd ? `$${selected.outputTokenAmountInUsd}` : '');
    } else {
      // Fallback or initial state if no potential quote is selected yet, or for exact output
      setFormattedTokenAmount(currentQuote.outputTokenFormatted);
      setFormattedTokenAmountInUsd(currentQuote.outputTokenAmountInUsd ? `$${currentQuote.outputTokenAmountInUsd}` : '');
    }
  }, [
    currentQuote, // Keep currentQuote for exact output and initial display
    potentialQuotes,
    selectedQuoteIndex,
    token,
    TOKEN_USDC
  ]);

  useEffect(() => {
    const tokenToFetch = queryParams.REFERRER_TO_TOKEN ? (queryParams.REFERRER_TO_TOKEN as string).toLowerCase() : undefined;
    
    if (tokenToFetch && !isUsdcToken(tokenToFetch) && !tokenInfo[tokenToFetch]) {
      const fetchToken = async () => {
        const fetchedToken = await refetchToken(tokenToFetch);
        if (!fetchedToken) {
          setToken(TOKEN_USDC);
        } else {
          // Always set the token
          setToken(tokenToFetch);
          
          // Set pending token if unverified
          if (!fetchedToken.verified) {
            handleUnverifiedToken(tokenToFetch);
          }
        }
      };
      fetchToken();
    } else if (tokenToFetch && isUsdcToken(tokenToFetch)) {
      setToken(TOKEN_USDC);
    } else if (tokenToFetch && tokenInfo[tokenToFetch]) {
      // Always set the token
      setToken(tokenToFetch);
      
      // Set pending token if unverified
      if (!tokenInfo[tokenToFetch].verified) {
        handleUnverifiedToken(tokenToFetch);
      }
    }
  }, [queryParams.REFERRER_TO_TOKEN, tokenInfo, refetchToken, TOKEN_USDC, handleUnverifiedToken]);


  // Handle showing unverified token warning with stabilization delay
  useEffect(() => {
    const timer = setTimeout(() => {
      // Show warning if we have a pending unverified token and integration modal is not showing
      if (pendingUnverifiedToken && !showIntegrationModal && tokenInfo[pendingUnverifiedToken]) {
        setShowUnverifiedWarning(true);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [pendingUnverifiedToken, showIntegrationModal, tokenInfo]);

  // Manage quote selection display with smooth transitions
  useEffect(() => {
    const shouldShow = !isMobile && !isExactOutput && (potentialQuotes.length > 0 || quoteState === QuoteState.FETCHING_QUOTE);
    
    if (shouldShow && !showQuoteSelection) {
      // Show immediately when needed
      setShowQuoteSelection(true);
    } else if (!shouldShow && showQuoteSelection) {
      // Hide with delay to allow exit transition
      const timer = setTimeout(() => {
        setShowQuoteSelection(false);
      }, 300); // Match the CSS transition duration
      
      return () => clearTimeout(timer);
    }
  }, [isMobile, isExactOutput, potentialQuotes.length, quoteState, showQuoteSelection]);

  /*
   * Event Handlers
   */
  
  const handleCancelUnverifiedToken = () => {
    setShowUnverifiedWarning(false);
    setPendingUnverifiedToken(null);
    // Default to USDC if user cancels
    setToken(TOKEN_USDC);
  };
  
  const handleConfirmUnverifiedToken = () => {
    // Add token to approved list and close the warning
    if (pendingUnverifiedToken && !approvedUnverifiedTokens.includes(pendingUnverifiedToken)) {
      setApprovedUnverifiedTokens([...approvedUnverifiedTokens, pendingUnverifiedToken]);
    }
    setShowUnverifiedWarning(false);
    setPendingUnverifiedToken(null);
  };

  // Reset isHandlingInitialUsdc when user manually edits fiat amount
  const handleFiatInputChange = (value: string) => {
    setIsExactOutput(false); // Entering fiat amount means not exact output

    if (value === "") {
      setFiatAmount('');
      setCurrentQuote(ZERO_QUOTE);
    } else if (value === ".") {
      setFiatAmount('0.');
      setCurrentQuote(ZERO_QUOTE);
    } else if (isValidFiatInput(value)) {
      setFiatAmount(value);
      setCurrentQuote({
        ...currentQuote, 
        fiatAmount: tokenUnits(value, 6) // USDC Decimals
      });
    }
  };

  const handleRecipientAddressChange = (value: string) => {
    setRecipientAddress(value);
    if (potentialQuotes.length > 0 && selectedQuoteIndex !== null) {
        const currentSelectedQuote = potentialQuotes[selectedQuoteIndex];
        // Check if the current tokenInfo is available before accessing chainId
        const chainIdForValidation = tokenInfo[token]?.chainId || (currentSelectedQuote.outputTokenDecimals === 0 ? BASE_CHAIN_ID : undefined);
        if (chainIdForValidation !== undefined) {
          const isRecipientValid = isValidAddress(value, chainIdForValidation);
          if (!isRecipientValid) {
            updateQuoteErrorState(QuoteState.INVALID_RECIPIENT_ADDRESS);
          } else {
            // If address becomes valid, and we were in an error state, revert to FETCH_QUOTE_SUCCESS
            if (quoteState === QuoteState.INVALID_RECIPIENT_ADDRESS) {
              setQuoteState(QuoteState.FETCH_QUOTE_SUCCESS);
            }
          }
        } else {
          // Handle case where chainId cannot be determined, perhaps log or set a specific error
        }
    }
  };

  const handleEnterPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAdd(event as any);
    }
  };

  const handleAdd = (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setCurrentQuote(ZERO_QUOTE);
    setPotentialQuotes([]);
    setSelectedQuoteIndex(null);
    setFailedQuoteIndices(new Set());
  };

  const handleSubmitIntent = async () => {
    
    // If not exact output, ensure a quote is selected (should be auto-selected if available)
    if (!isExactOutput && (selectedQuoteIndex === null || !potentialQuotes[selectedQuoteIndex])) {
      // This state should ideally not be reached if auto-selection works and CTA is disabled correctly.
      updateQuoteErrorState(QuoteState.FAILED_TO_FETCH_QUOTE); // Or a more generic error
      return;
    }

    const quoteToSubmit = selectedQuoteIndex !== null && potentialQuotes[selectedQuoteIndex]
      ? potentialQuotes[selectedQuoteIndex]
      : currentQuote;

    if (quoteToSubmit === ZERO_QUOTE && quoteState !== QuoteState.EXCEEDS_ORDER_COUNT) {
        console.error("Attempted to submit with a zero quote.");
        // Potentially set an error state here
        return;
    }

    setQuoteState(QuoteState.FETCHING_SIGNED_INTENT);
    
    if (chainId && recipientAddress && loggedInEthereumAddress && quoteToSubmit) {
      const usdcRecipientAddress = token !== TOKEN_USDC ? loggedInEthereumAddress : recipientAddress;
      
      
      await fetchSignedIntent({
        processorName: paymentPlatform,
        depositId: quoteToSubmit.depositId.toString(),
        tokenAmount: quoteToSubmit.usdcAmount.toString(),
        payeeDetails: quoteToSubmit.hashedOnchainId,
        toAddress: usdcRecipientAddress,
        fiatCurrencyCode: currencyInfo[fiatCurrency].currencyCodeHash,
        chainId: chainId
      });
    }
  };

  // Handle retry with next quote after signal intent failure
  useEffect(() => {
    if (shouldRetryWithNextQuote && selectedQuoteIndex !== null) {
      // Find next valid quote (skip any previously failed ones)
      let nextIndex = selectedQuoteIndex + 1;
      while (nextIndex < potentialQuotes.length && failedQuoteIndices.has(nextIndex)) {
        nextIndex++;
      }
      
      if (nextIndex < potentialQuotes.length) {
        // Select next quote but don't submit automatically
        const nextQuote = potentialQuotes[nextIndex];
        setQuoteFailureWarning(commonStrings.get('QUOTE_FAILED_TRY_NEXT'));
        
        // Reset quote state and select new quote
        setQuoteState(QuoteState.FETCH_QUOTE_SUCCESS);
        handleQuoteSelected(nextQuote, nextIndex);
      } else {
        // No more quotes available
        setQuoteFailureWarning(commonStrings.get('ALL_QUOTES_FAILED'));
        setQuoteState(QuoteState.FAILED_TO_FETCH_SIGNED_INTENT);
      }
      
      // Reset the flag
      setShouldRetryWithNextQuote(false);
    }
  }, [shouldRetryWithNextQuote, selectedQuoteIndex, potentialQuotes, failedQuoteIndices, handleQuoteSelected]);

  const handleCancelIntent = () => {
    clearPayeeDetails();    // clear payee details after successful cancel intent
    setQuoteState(QuoteState.DEFAULT);
    setPotentialQuotes([]);
    setSelectedQuoteIndex(null);
    setFailedQuoteIndices(new Set());
  };

  const handleReferrerCloseClick = () => {
    clearReferrerQueryParams();
    setIsExactOutput(false);

    if (queryParams.REFERRER_RECIPIENT_ADDRESS) {
      if (isLoggedIn && loggedInEthereumAddress) {
        // If user is receiving SOL/ETH/POLYGON/SONIC and is logged in using embedded wallet,
        // set the recipient address to empty string and show the recipient input field
        if (
          tokenInfo[token] && 
          (
            tokenInfo[token].vmType !== 'evm' ||
            (
              tokenInfo[token].vmType === 'evm' 
              && tokenInfo[token].chainId !== BASE_CHAIN_ID
              && loginStatus === LoginStatus.AUTHENTICATED
            )
          )
        ) {
          setRecipientAddress('');
          setShowRecipientInput(true);
        } else {
          setRecipientAddress(loggedInEthereumAddress);
          setShowRecipientInput(false);
        }
      }
    }
  };

  /*
   * Helpers
   */

  function isValidFiatInput(value: any) {
    const isValid = /^-?\d*(\.\d{0,2})?$/.test(value);
    return !isNaN(value) && parseFloat(value) >= 0 && isValid;
  }

  function isValidUsdcInput(value: any) {
    const isValid = /^\d+$/.test(value);
    return !isNaN(value) && parseFloat(value) >= 0 && isValid;
  }

  function isValidAddress(address: string, chainId: number) {
    if (chainId === SOLANA_CHAIN_ID) {
      // Check if it's a base58 encoded string of exactly 32 bytes (44 characters)
      // Todo: Move validation logic to where the chain is defined, and use it from there.
      return /^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(address);
    } else {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
  }

  function isValidOrEmptyAddress(address: string, chainId: number) {
    if (address === '') {
      return true;
    }

    return isValidAddress(address, chainId);
  }

  const tokenBalanceLabel = useMemo(() => {
    if (isLoggedIn && token === TOKEN_USDC) {
      return `Balance: ${tokenUnitsToReadable(usdcBalance ?? ZERO, 6)}`
    } else {
      return '';
    }
  }, [usdcBalance, isLoggedIn, token, TOKEN_USDC]);

  const outputTokenDisplay = useMemo(() => {
    return tokenInfo[token]?.ticker || token;
  }, [token, tokenInfo]);

  const isQuotesLoading = useMemo(() => {
    return quoteState === QuoteState.FETCHING_QUOTE || isProcessingQuotes;
  }, [quoteState, isProcessingQuotes]);

  const recipientPlaceholderLabel = useMemo(() => {
    return "Wallet address";
  }, []);

  const getButtonText = () => {
    const platformName = paymentPlatformInfo[paymentPlatform].platformName;
    const minFiatAmount = paymentPlatformInfo[paymentPlatform].minFiatAmount;
    const fiatCurrencySymbol = currencyInfo[fiatCurrency].currencySymbol;

    const showSpinner = [
      QuoteState.FETCHING_QUOTE,
      QuoteState.FETCHING_SIGNED_INTENT,
      QuoteState.SIGNAL_INTENT_TRANSACTION_LOADING,
      QuoteState.SIGNAL_INTENT_TRANSACTION_MINING
    ].includes(quoteState);

    // Show mobile-specific message on mobile devices
    if (!canInstallExtensions) {
      return (
        <ButtonContentWrapper>
          <span>Browser does not support extensions</span>
        </ButtonContentWrapper>
      );
    }
    
    // Show browser-specific message on incompatible desktop browsers
    if (!canCreateOrders) {
      return (
        <ButtonContentWrapper>
          <span>Use a Chromium-based browser to create orders</span>
        </ButtonContentWrapper>
      );
    }

    const text = (() => {
      switch (quoteState) {
        case QuoteState.EXCEEDS_ORDER_COUNT:
          return 'Complete existing order';
        case QuoteState.INVALID_RECIPIENT_ADDRESS:
          return 'Enter a valid recipient address';
        case QuoteState.MAINTENANCE:
          return 'Under maintenance';
        case QuoteState.INVALID_FIAT_CURRENCY:
          return 'Invalid currency';
        case QuoteState.FETCHING_QUOTE:
          return 'Fetching quotes';
        case QuoteState.PLATFORM_NOT_SUPPORTED_ON_MOBILE:
          return `${platformName} not supported on mobile`;
        case QuoteState.TOO_MANY_REQUESTS_FAILED_TO_FETCH_QUOTE:
          return 'Too many quote requests - Try again later';
        case QuoteState.FAILED_TO_FETCH_QUOTE:
          return 'No quote found';
        case QuoteState.FETCHING_SIGNED_INTENT:
          return 'Fetching signed intent';
        case QuoteState.FAILED_TO_FETCH_SIGNED_INTENT:
          return 'Failed to fetch signed intent - Try again';
        case QuoteState.AMOUNT_BELOW_TRANSFER_MIN:
          return `Send amount less than minimum ${fiatCurrencySymbol}${minFiatAmount}`;
        case QuoteState.SIGNAL_INTENT_TRANSACTION_FAILED:
          return 'Transaction failed - Try again';
        case QuoteState.SIGNAL_INTENT_TRANSACTION_LOADING:
          return 'Signing transaction';
        case QuoteState.SIGNAL_INTENT_TRANSACTION_MINING:
          return 'Mining transaction';
        case QuoteState.FETCH_QUOTE_SUCCESS:
          // Check for existing intent to handle race condition on page refresh
          // where quote might succeed before EXCEEDS_ORDER_COUNT state is set
          return currentIntentHash ? 'Complete existing order' : 'Start Order';
        case QuoteState.DEFAULT:
        default:
          return `Input ${fiatCurrency} amount`;
      }
    })();

    return (
      <ButtonContentWrapper>
        {showSpinner && <StyledSpinner size={20} />}
        <span>{text}</span>
      </ButtonContentWrapper>
    );
  };

  const ctaDisabled = () => {
    // Always disable the button on mobile devices
    if (!canInstallExtensions) {
      return true;
    }
    
    // Disable button on incompatible browsers
    if (!canCreateOrders) {
      return true;
    }

    switch (quoteState) {
      case QuoteState.DEFAULT:
      case QuoteState.INVALID_FIAT_CURRENCY:
      case QuoteState.FETCHING_QUOTE:
      case QuoteState.FAILED_TO_FETCH_QUOTE:
      case QuoteState.FETCHING_SIGNED_INTENT:
      case QuoteState.AMOUNT_BELOW_TRANSFER_MIN:
      case QuoteState.INVALID_RECIPIENT_ADDRESS:
      case QuoteState.TOO_MANY_REQUESTS_FAILED_TO_FETCH_QUOTE:
      case QuoteState.SIGNAL_INTENT_TRANSACTION_LOADING:
      case QuoteState.SIGNAL_INTENT_TRANSACTION_MINING:
      case QuoteState.MAINTENANCE:
      case QuoteState.PLATFORM_NOT_SUPPORTED_ON_MOBILE:
        return true;
      
      case QuoteState.EXCEEDS_ORDER_COUNT:
      case QuoteState.FAILED_TO_FETCH_SIGNED_INTENT:
      case QuoteState.SIGNAL_INTENT_TRANSACTION_FAILED:
      case QuoteState.FETCH_QUOTE_SUCCESS:
        return false;
    }
    return true;
  };

  const ctaClick = () => {
    
    if (quoteState === QuoteState.EXCEEDS_ORDER_COUNT) {
      onCompleteOrderClick();
    } else {
      handleSubmitIntent();
    }
  };

  /*
   * Component
   */

  return (
    <Wrapper>
      {showIntegrationModal && (
        <IntegrationModal
          onBackClick={() => setShowIntegrationModal(false)}
        />
      )}

      <SwapLayoutContainer>
        <SwapFormContainer>
          {(!canInstallExtensions || !canCreateOrders) && (
            <WarningTextBox
              text={
                !canInstallExtensions 
                  ? "Preview only. Use a desktop browser that supports extensions to create orders."
                  : "Preview only. Use a Chromium-based browser (Chrome, Brave, Edge, etc.) to create orders."
              }
              showCloseClick={false}
              size="s"
              type="info"
              fontSize="16px"
            />
          )}
        
          
          {currentIntentHash && (
            <OnRamperIntentInfo
              onCompleteOrderClick={onCompleteOrderClick}
              onCancelIntent={handleCancelIntent}
            />
          )}

          {queryParams.REFERRER && (
            <ReferrerInfo
              onCloseClick={handleReferrerCloseClick}
            />
          )}

          {queryParams.REFERRER && currentIntentHash && (
            <WarningTextBox
              text={commonStrings.get('REDIRECT_FLOW_EXISTING_ORDER_WARNING')}
              showCloseClick={false}
              size="l"
              fontSize="16px"
            />
          )}

          {quoteFailureWarning && (
            <WarningTextBox
              text={quoteFailureWarning}
              showCloseClick={true}
              onCloseClick={() => setQuoteFailureWarning(null)}
              size="m"
              type="warning"
              fontSize="14px"
            />
          )}

          <MainContentWrapper>
            <SwapInputContainer>
              {isMobile ? (
                <InputWithCurrencySelector
                  label="You send"
                  name={`fiatAmount`}
                  value={fiatAmount}
                  onChange={(e) => handleFiatInputChange(e.target.value)}
                  onKeyDown={handleEnterPress}
                  type="number"
                  placeholder="0.00"
                  hasSelector={true}
                  selectorDisabled={true}
                  selectedCurrency={fiatCurrency}
                  setSelectedCurrency={setFiatCurrency}
                  readOnly={isExactOutput}
                  isPulsing={isExactOutput && quoteState === QuoteState.FETCHING_QUOTE}
                />
              ) : (
                <InputWithCurrencyPlatformSelector
                  label="You send"
                  name={`fiatAmount`}
                  value={fiatAmount}
                  onChange={(e) => handleFiatInputChange(e.target.value)}
                  onKeyDown={handleEnterPress}
                  type="number"
                  placeholder="0.00"
                  hasSelector={true}
                  selectorDisabled={false}
                  selectedCurrency={fiatCurrency}
                  setSelectedCurrency={setFiatCurrency}
                  selectedPlatform={paymentPlatform}
                  setSelectedPlatform={setPaymentPlatform}
                  allPlatforms={allCurrencyPlatforms}
                  readOnly={isExactOutput }
                  isPulsing={isExactOutput && quoteState === QuoteState.FETCHING_QUOTE}
                  displayMode="currency"
                />
              )}

              {isMobile ? (
                <LabelWithPlatformSelector
                  label="Paying using"
                  selectedPlatform={paymentPlatform}
                  setSelectedPlatform={setPaymentPlatform}
                  allPlatforms={allCurrencyPlatforms}
                />
              ) : (
                <LabelWithCurrencyPlatformSelector
                  label="Paying using"
                  selectedCurrency={fiatCurrency}
                  setSelectedCurrency={setFiatCurrency}
                  selectedPlatform={paymentPlatform}
                  setSelectedPlatform={setPaymentPlatform}
                  allPlatforms={allCurrencyPlatforms}
                  displayMode="platform"
                />
              )}

              <InputWithTokenSelector
                label="You receive"
                name={`tokenAmount`}
                value={formattedTokenAmount}
                onChange={() => {}} // Read-only, value comes from selected quote or calculation
                type="number"
                accessoryLabel={tokenBalanceLabel}
                placeholder="0.00"
                readOnly={true}
                hasSelector={true} // Allow token selection unless specific conditions lock it
                selectedToken={token}
                setSelectedToken={(newToken) => {
                  // todo: move this to a handler
                  setToken(newToken);
                  setPotentialQuotes([]); // Clear quotes if token changes
                  setSelectedQuoteIndex(null);
                  setCurrentQuote(ZERO_QUOTE);
                  setFailedQuoteIndices(new Set());
                  if (quoteState === QuoteState.FETCH_QUOTE_SUCCESS) {
                    setQuoteState(QuoteState.DEFAULT);
                  }
                }}
                isPulsing={!isExactOutput && quoteState === QuoteState.FETCHING_QUOTE}
                leftAccessoryLabel={formattedTokenAmountInUsd}
                stopSelection={isExactOutput}
                lockLabel={
                  isExactOutput ? 
                  "You cannot change the token and amount you are receiving. Clear the request above to change token."
                  : ''
                }
              />
            </SwapInputContainer>

            {(quoteState === QuoteState.FETCH_QUOTE_SUCCESS && selectedQuoteIndex === null && !isExactOutput && potentialQuotes.length <=1) || (quoteState === QuoteState.FETCH_QUOTE_SUCCESS && isExactOutput) || (quoteState === QuoteState.FETCH_QUOTE_SUCCESS && selectedQuoteIndex !== null) ? (
              <QuoteDetails
                currency={fiatCurrency}
                token={token}
                fiatAmount={fiatAmount}
                usdcAmount={currentQuote.usdcAmount}
                usdcToFiatRate={currentQuote.usdcToFiatRate}
                usdcToTokenRate={currentQuote.usdcToTokenRate}
                outputTokenAmount={currentQuote.outputTokenAmount}
                outputTokenDecimals={currentQuote.outputTokenDecimals}
                outputTokenAmountInUsd={currentQuote.outputTokenAmountInUsd}
                gasFeesInUsd={currentQuote.gasFeesInUsd}
                appFeeInUsd={currentQuote.appFeeInUsd}
                relayerFeeInUsd={currentQuote.relayerFeeInUsd}
                relayerGasFeesInUsd={currentQuote.relayerGasFeesInUsd}
                relayerServiceFeesInUsd={currentQuote.relayerServiceFeesInUsd}
                timeEstimate={currentQuote.timeEstimate}
              />
            ) : null}


            <AddRecipientButtonContainer>
              <AccessoryButton
                onClick={() => setShowRecipientInput(!showRecipientInput)}
                height={36}
                icon={showRecipientInput ? 'minus' : 'plus'}
                title={'Add Custom Recipient'}
                iconPosition='left'
                textAlign='right'
                fullWidth={false}
              />
            </AddRecipientButtonContainer>

            {showRecipientInput && (
              <Input
                label="Recipient Address"
                name="recipientAddress"
                value={recipientAddress}
                placeholder={recipientPlaceholderLabel}
                onChange={(e: any) => handleRecipientAddressChange(e.target.value)}
                valueFontSize="16px"
                readOnly={isExactOutput}
                locked={isExactOutput}
                lockLabel={
                  (isExactOutput) ? 
                  "You cannot change the recipient address. Clear the request above to change recipient."
                  : ''
                }
              />
            )}
            
            {!isLoggedIn ? (
              <CustomConnectButton fullWidth={true} />
            ) : (
            <CTAButton
              disabled={ctaDisabled()}
              onClick={ctaClick}
            >
              {getButtonText()}
            </CTAButton>
            )}
          </MainContentWrapper>
        </SwapFormContainer>
        
        {showQuoteSelection && (
          <>
            <QuoteSelectionDisplay
              quotes={potentialQuotes}
              onSelect={handleQuoteSelected}
              selectedIndex={selectedQuoteIndex}
              inputFiatCurrency={fiatCurrency}
              outputToken={outputTokenDisplay}
              isQuotesLoading={isQuotesLoading}
              failedQuoteIndices={failedQuoteIndices}
            />
          </>
        )}
      </SwapLayoutContainer>

      <TallySupportButton 
        page="swap"
        currentIntentHash={currentIntentHash || ''}
      />
      
      {/* Unverified token warning modal */}
      {showUnverifiedWarning && pendingUnverifiedToken && tokenInfo[pendingUnverifiedToken] && (
        <UnverifiedTokenModal
          token={tokenInfo[pendingUnverifiedToken]}
          onCancel={handleCancelUnverifiedToken}
          onConfirm={handleConfirmUnverifiedToken}
        />
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  min-height: 600px;

  @media (max-width: 600px) {
    max-width: 100%;
    padding: 0;
    box-sizing: border-box;
  }
`;

const SwapLayoutContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  width: 100%;
  justify-content: center;
  align-items: flex-start;
  transition: all 0.3s ease-in-out;

  @media (max-width: 800px) { /* Stack columns on smaller screens */
    flex-direction: column;
    align-items: center;
    max-width: 480px; 
  }
`;

const SwapFormContainer = styled(AutoColumn)`
  padding: 1rem;
  gap: 0.5rem;
  background-color: ${colors.container};
  box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.25);
  border-radius: 16px;
  border: 1px solid ${colors.defaultBorderColor};
  width: 100%;
  max-width: 470px;
  min-width: 380px;
  
  @media (max-width: 800px) {
    width: 90%;
    margin: 0 auto;
  }
  @media (max-width: 600px) { // Original mobile breakpoint
    width: 90%;
    margin: 0 auto;
  }
`;


const AddRecipientButtonContainer = styled.div`
  display: grid;
  justify-content: flex-start;
  /* Removing align-items: center as it might not be needed with grid and single item */
`;

const TitleContainer = styled.div`
  display: flex;
  margin: 0rem 0.25rem;
  justify-content: space-between;
  align-items: center;
`;

const MainContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-self: center;
  border-radius: 4px;
  justify-content: center;
  width: 100%; /* Ensure it takes available width */
`;

const SwapInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CTAButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px !important;
  padding: 1rem;
  font-size: 20px;
  font-weight: 550;
  transition: all 75ms;
`;

const VerticalDivider = styled.div`
  height: 24px;
  border-left: 1px solid ${colors.defaultBorderColor};
  margin: 0 auto;
`;

const ButtonContentWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StyledSpinner = styled(Spinner)`
  margin-left: 8px;
`;


export default SwapForm;
