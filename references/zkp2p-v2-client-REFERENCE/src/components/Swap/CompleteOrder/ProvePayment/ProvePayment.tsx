import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from 'styled-components';
import { ArrowLeft } from 'react-feather';
import { ThemedText } from '@theme/text';
import { useWindowSize } from '@uidotdev/usehooks';
import { colors } from '@theme/colors';
import { Z_INDEX } from '@theme/zIndex';
import reclaimSvg from '@assets/images/reclaim.svg'


import { commonStrings } from "@helpers/strings";
import { relayTokenAmountToReadable } from "@helpers/units";
import { LoginStatus, ProofGenerationStatus } from  "@helpers/types";
import { PaymentPlatformType } from "@helpers/types";
import { ExtensionRequestMetadata } from "@helpers/types";
import { getTransactionExplorerUrl } from '@helpers/blockExplorers';
import { ZKP2P_TG_SUPPORT_CHAT_LINK } from "@helpers/docUrls";
import { ParsedIntentData, parseIntentData } from "@helpers/intentHelper";
import { BASE_CHAIN_ID } from '@helpers/constants';
import BridgeErrorDisplay from '@components/common/BridgeErrorDisplay';

import Spinner from '@components/common/Spinner';
import { Button } from "@components/common/Button";
import { Overlay } from '@components/modals/Overlay';
import { LabeledSwitch } from "@components/common/LabeledSwitch";
import { LabeledTextArea } from '@components/legacy/LabeledTextArea';
import { AccessoryButton } from "@components/common/AccessoryButton";
import { ContactSellerModal } from "@components/modals/ContactSellerModal";
import { ContactSupportModal } from "@components/modals/ContactSupportModal";
import { CopyButton } from "@components/common/CopyButton";
import { ProofErrorDisplay } from "@components/common/ProofErrorDisplay";
import { ProofGenerationError } from '@helpers/proofErrorParser';

import { SwapDetails } from "./SwapDetails";
import { VerificationStepRow, VerificationState, VerificationStepType } from "./VerificationStepRow";

import useQuery from "@hooks/useQuery";
import useMediaQuery from "@hooks/useMediaQuery";
import useQuoteStorage from "@hooks/useQuoteStorage";
import { ParsedQuoteData } from "@hooks/bridge/useRelayBridge";

import useAccount from '@hooks/contexts/useAccount';
import useBackend from "@hooks/contexts/useBackend";
import useTokenData from '@hooks/contexts/useTokenData';
import useSmartContracts from "@hooks/contexts/useSmartContracts";
import useOnRamperIntents from "@hooks/contexts/useOnRamperIntents";


const ModalAndOverlayContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  position: fixed;
  align-items: flex-start;
  top: 0;
  left: 0;
  z-index: ${Z_INDEX.overlay};
`;

const ModalContainer = styled.div`
  width: 80vw;
  max-width: 412px;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.25rem;
  background-color: ${colors.container};
  justify-content: space-between;
  align-items: center;
  z-index: 20;
  gap: 1.3rem;
  
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const TitleRowContainer = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 0.3fr 1.1fr 0.85fr;
  align-items: center;
  justify-content: space-between;
`;

const StyledArrowLeft = styled(ArrowLeft)`
  color: #FFF;
`;

const Title = styled.div`
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
`;

const VerificationStepsContainer = styled.div`
  width: 100%;
`;

const ProofAndSignalsContainer = styled.div`
  width: 100%;
  background: #eeeee;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const Link = styled.a`
  white-space: pre;
  display: inline-block;
  color: #1F95E2;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const ConfettiContainer = styled.div`
  z-index: 20;
`;

const LinkContainers = styled.div`
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TransactionLinkContainer = styled.div`
  margin: auto;
  display: flex;
  flex-direction: row;
  &:hover {
    cursor: pointer;
  }
`;

const BridgeTransactionLinksContainer = styled.div`
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: space-between;
  align-items: center;
`;

const PageContainer = styled.div`
  width: 100%;
  max-width: 412px;
  display: flex;
  flex-direction: column;
  padding: 0rem 0rem 0rem 0rem;
  gap: 1.3rem;
  margin: 0 auto;
`;

const PoweredByContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 15px;
  gap: 5px;
`;

const PoweredByText = styled.div`
  font-size: 12px;
  text-align: top;
  padding-top: 2px;
  line-height: 1.5;
  color: #FFF;
`;

const ReclaimLogo = styled.img`
  height: 20px;
  vertical-align: middle;
`;

const ButtonContentWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StyledSpinner = styled(Spinner)`
  margin-left: 8px;
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  font-size: 16px;
  text-align: center;
  width: 100%;
`;

const SupportLink = styled.a`
  white-space: pre;
  display: inline-block;
  color: #1F95E2;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const ErrorSupportBox = styled.div`
  background-color: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: ${fadeIn} 0.3s ease-out;

  @media (max-width: 600px) {
    padding: 1rem;
    margin-top: 1rem;
  }
`;

const ErrorSupportContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ErrorSupportText = styled.div`
  font-size: 14px;
  color: ${colors.white};
  line-height: 1.5;
  opacity: 0.85;
  
  @media (max-width: 600px) {
    font-size: 13px;
  }
`;

const CopyErrorButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.75rem 1.25rem;
  border-radius: 24px;
  background-color: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  width: 100%;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const CopyErrorText = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${colors.white};
  transition: all 0.2s ease;
`;

const CopyDetailsLink = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0.25rem;
  color: ${colors.white};
  font-size: 13px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 1;
  }
  
  span {
    text-decoration: underline;
  }
`;

interface ProvePaymentProps {
  title: string;
  proof: string;
  proofError?: string;
  structuredError?: ProofGenerationError;
  onBackClick: () => void
  status: string;
  platform: PaymentPlatformType;
  buttonTitle: string;
  submitTransactionStatus: string;
  isSubmitMining: boolean;
  handleSubmitVerificationClick?: () => void;
  handleSubmitSwapClick?: () => void;
  handleReturnToPaymentSelection?: () => void;
  setProofGenStatus?: (status: string) => void;
  onProofGenCompletion?: () => void;
  isAppclipFlow?: boolean;
  appclipRequestURL?: string;
  transactionAddress?: string | null;
  provingFailureErrorCode: number | null;
  bridgingNeeded: boolean;
  quoteData: ParsedQuoteData | null;
  bridgeTransactions: {
    txHash: string;
    chainId: number;
  }[] | null;
  displayType?: 'modal' | 'page';
  simulationErrorMessage: string | null;
  paymentSubject?: string;
  paymentDate?: string;
  selectedPayment?: ExtensionRequestMetadata;
  shouldShowProofAndSignals?: boolean;
  retryProofGen?: () => void;
  setShouldShowProofAndSignals?: (show: boolean) => void;
  handleManualRetryBridgeQuote?: () => void;
  bridgeRetryCount?: number;
  quoteRetryCount?: number;
  executionRetryCount?: number;
  maxRetries?: number;
  bridgeErrorDetails?: {
    type: import('@helpers/bridgeErrors').BridgeErrorType;
    message: string;
    isRetryable: boolean;
  } | null;
}

export const ProvePayment: React.FC<ProvePaymentProps> = ({
  title,
  proof,
  proofError,
  structuredError,
  onBackClick,
  status,
  platform,
  buttonTitle,
  submitTransactionStatus,
  isSubmitMining,
  transactionAddress,
  setProofGenStatus,
  handleSubmitVerificationClick = () => {},
  handleSubmitSwapClick = () => {},
  handleReturnToPaymentSelection,
  onProofGenCompletion,
  provingFailureErrorCode,
  isAppclipFlow,
  appclipRequestURL,
  bridgingNeeded,
  quoteData,
  bridgeTransactions,
  displayType = 'modal',
  simulationErrorMessage,
  paymentSubject,
  paymentDate,
  selectedPayment,
  shouldShowProofAndSignals = false,
  setShouldShowProofAndSignals,
  retryProofGen,
  handleManualRetryBridgeQuote,
  bridgeRetryCount = 0,
  quoteRetryCount = 0,
  executionRetryCount = 0,
  maxRetries = 10,
  bridgeErrorDetails,
}) => {

  ProvePayment.displayName = "ProvePaymentModal";
  /*
   * Context
   */

  const { loginStatus, loggedInEthereumAddress } = useAccount();
  const size = useWindowSize();
  const isMobile = useMediaQuery() === 'mobile';
  const { addressToPlatform } = useSmartContracts();
  const { currentIntentView } = useOnRamperIntents();
  const { depositorTgUsername } = useBackend();
  const { queryParams } = useQuery();
  const { getQuoteData: getStoredQuoteData } = useQuoteStorage();
  const { tokenInfo, getChainName } = useTokenData();

  /*
   * State
   */


  const [intentData, setIntentData] = useState<ParsedIntentData | null>(null);
  const [ctaButtonTitle, setCtaButtonTitle] = useState<string>("");

  const [showAccessoryCta, setShowAccessoryCta] = useState<boolean>(false);
  const [showPoweredByReclaim, setShowPoweredByReclaim] = useState<boolean>(isMobile);
  
  const [swapToken, setSwapToken] = useState<string | null>(null);
  const [fiatCurrency, setFiatCurrency] = useState<string | null>(null);

  // Add new state for modals
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  
  // Error details state
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [errorCopied, setErrorCopied] = useState<boolean>(false);
  
  // Loading state for retry button
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  /*
   * Handlers
   */

  const handleOverlayClick = () => {
    onBackClick();
  }

  const handleCopyError = () => {
    if (errorDetails) {
      navigator.clipboard.writeText(errorDetails).then(() => {
        setErrorCopied(true);
        setTimeout(() => setErrorCopied(false), 2000);
      });
    }
  };

  /*
   * Hooks
   */

  useEffect(() => {
    if (currentIntentView && loggedInEthereumAddress) {
      const intentData = parseIntentData(currentIntentView, addressToPlatform);
      setIntentData(intentData);

      // Use logged-in address for consistent quote retrieval
      const storedQuoteData = getStoredQuoteData(loggedInEthereumAddress);
      setSwapToken(storedQuoteData?.token as string);
      setFiatCurrency(storedQuoteData?.fiatCurrency as string);
    }
  }, [currentIntentView, addressToPlatform, getStoredQuoteData, loggedInEthereumAddress]);

  useEffect(() => {
    if (isMobile) {
      setShowPoweredByReclaim(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (setProofGenStatus) {
      switch (submitTransactionStatus) {
        case "error":
          setProofGenStatus(ProofGenerationStatus.TRANSACTION_CONFIGURED);
          break;

        case "loading":
          setProofGenStatus(ProofGenerationStatus.TRANSACTION_LOADING);
          break;

        default:
          break;
      }
    }
  }, [submitTransactionStatus, setProofGenStatus]);

  // Reset isRetrying when status changes
  useEffect(() => {
    if (status === ProofGenerationStatus.SWAP_QUOTE_REQUESTING && isRetrying) {
      // Reset after a short delay to ensure button updates
      setTimeout(() => setIsRetrying(false), 100);
    }
  }, [status, isRetrying]);

  // Capture error details when proof generation fails
  useEffect(() => {
    if (status === ProofGenerationStatus.ERROR_FAILED_TO_PROVE) {
      // Determine the error message
      let proofErrorMessage = 'Attestor server not responding';
      
      if (proofError) {
        // Parse proofError to extract the error message
        try {
          const parsedError = JSON.parse(proofError);
          proofErrorMessage = parsedError?.error?.message || parsedError?.message || 'Unknown error';
        } catch (e) {
          // If parsing fails, use proofError as is
          proofErrorMessage = proofError;
        }
      }
      
      const errorData = {
        timestamp: new Date().toISOString(),
        intentHash: currentIntentView?.intentHash || 'N/A',
        platform: platform,
        errorType: ProofGenerationStatus.ERROR_FAILED_TO_PROVE,
        paymentDetails: {
          amount: intentData?.amountFiatToSend || 'N/A',
          currency: fiatCurrency || 'N/A',
          recipient: intentData?.recipientAddress || 'N/A',
          depositId: intentData?.depositId || 'N/A'
        },
        paymentSubject: paymentSubject || 'N/A',
        paymentDate: paymentDate || 'N/A',
        selectedPaymentMetadata: selectedPayment || null,
        proofError: proofErrorMessage,
        sellerTelegram: depositorTgUsername || 'N/A',
      };
      
      setErrorDetails(JSON.stringify(errorData, null, 2));
    }
  }, [status, currentIntentView, platform, intentData, fiatCurrency, paymentSubject, paymentDate, selectedPayment, proofError, depositorTgUsername]);

  useEffect(() => {
    if (isSubmitMining && setProofGenStatus) {
      setProofGenStatus(ProofGenerationStatus.TRANSACTION_MINING);
    }
  }, [isSubmitMining, setProofGenStatus]);

  useEffect(() => {
    switch (status) {

      case ProofGenerationStatus.NOT_STARTED:
      case ProofGenerationStatus.REQUESTING_PROOF:
        if (isAppclipFlow) {
          if (isMobile) {
            setCtaButtonTitle("Generating Link");
          } else {
            setCtaButtonTitle("Generating QR code");
          }
        } else {
          setCtaButtonTitle("Requesting Notarization");
        }
        break;

      case ProofGenerationStatus.REQUESTING_PROOF_FAILED:
        if (isAppclipFlow) {
          if (isMobile) {
            setCtaButtonTitle("Failed to Generate Link");
          } else {
            setCtaButtonTitle("Failed to Generate QR");
          }
        } else {
          setCtaButtonTitle("Failed to Request Notarization");
        }
        break;

      case ProofGenerationStatus.REQUESTING_PROOF_SUCCESS:
        if (isAppclipFlow) {
          if (isMobile) {
            setCtaButtonTitle("Generate Proof");
          } else {
            setCtaButtonTitle("Scan QR code to verify payment");
          }
        } else {
          setCtaButtonTitle("Complete Order");
        }
        break;

      case ProofGenerationStatus.GENERATING_PROOF:
        setCtaButtonTitle("Verifying Payment");
        break;

      case ProofGenerationStatus.TRANSACTION_SIMULATING:
        setCtaButtonTitle("Complete Order");
        break;

      case ProofGenerationStatus.TRANSACTION_SIMULATION_SUCCESSFUL:
        setCtaButtonTitle("Complete Order");
        break;

      case ProofGenerationStatus.TRANSACTION_CONFIGURED:
        setCtaButtonTitle("Complete Order");
        break;

      case ProofGenerationStatus.TRANSACTION_SIMULATION_SUCCESSFUL:
        setCtaButtonTitle("Complete Order");
        break;

      case ProofGenerationStatus.TRANSACTION_LOADING:
        setCtaButtonTitle("Signing Transaction");
        break;

      case ProofGenerationStatus.TRANSACTION_MINING:
        setCtaButtonTitle("Mining Transaction");
        break;

      case ProofGenerationStatus.TRANSACTION_SIMULATION_FAILED:
        if (simulationErrorMessage) {
          setCtaButtonTitle("Verification Failed: " + simulationErrorMessage);
        } else {
          setCtaButtonTitle("Payment verification failed");
        }
        break;

      case ProofGenerationStatus.SWAP_QUOTE_REQUESTING:
        setCtaButtonTitle('Fetching Swap Quote');
        setShowAccessoryCta(true);    // show when starting to fetch swap quote
        setShowPoweredByReclaim(false); // hide powered by reclaim when onramp is completed
        break;

      case ProofGenerationStatus.SWAP_QUOTE_FAILED:
        if (quoteRetryCount >= maxRetries) {
          setCtaButtonTitle('Retry Bridge Quote');
        } else {
          setCtaButtonTitle(`Retrying quote... (${quoteRetryCount}/${maxRetries})`);
        }
        break;

      case ProofGenerationStatus.SWAP_QUOTE_SUCCESS:
        setCtaButtonTitle('Swap USDC to ' + tokenInfo[quoteData?.token ?? 'USDC'].ticker);
        break;

      case ProofGenerationStatus.SWAP_TRANSACTION_SIGNING:
        const tokenName = tokenInfo[quoteData?.token ?? 'USDC'].name;
        const chainName = tokenInfo[quoteData?.token ?? 'USDC'].chainName;
        setCtaButtonTitle(
          'Swapping to ' + tokenName + ' (' + chainName + ')'
        );
        setShowAccessoryCta(false);    // hide when starting to user goes ahead and signs swap transaction
        break;

      case ProofGenerationStatus.SWAP_TRANSACTION_MINING:
        setCtaButtonTitle('Mining Swap Transaction');
        break;

      case ProofGenerationStatus.SWAP_TRANSACTION_FAILED:
        if (executionRetryCount >= maxRetries) {
          setCtaButtonTitle('Swap Failed - Try Again');
        } else {
          setCtaButtonTitle(`Retrying swap... (${executionRetryCount}/${maxRetries})`);
        }
        setShowAccessoryCta(true);    // show when swap transaction fails; give user to exit swap and keep USDC
        break;

      case ProofGenerationStatus.ERROR_FAILED_TO_PROVE:
        setCtaButtonTitle('Proof Gen Failed - Try again');
        break;

      case ProofGenerationStatus.DONE:
        if (queryParams.REFERRER_CALLBACK_URL && queryParams.REFERRER) {
          setCtaButtonTitle('Go to ' + queryParams.REFERRER);
        } else {
          setCtaButtonTitle('Go to Buy');
        }
        break;
        
      default:
        setCtaButtonTitle(buttonTitle);
        break;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, buttonTitle, bridgeRetryCount, structuredError, quoteRetryCount, executionRetryCount, maxRetries]);

  /*
   * Helpers
   */

  const ctaDisabled = useMemo(() => {
    switch (status) {
      case ProofGenerationStatus.REQUESTING_PROOF:
      case ProofGenerationStatus.REQUESTING_PROOF_FAILED:
      case ProofGenerationStatus.TRANSACTION_SIMULATION_FAILED:
      case ProofGenerationStatus.TRANSACTION_LOADING:
      case ProofGenerationStatus.TRANSACTION_MINING:
      case ProofGenerationStatus.TRANSACTION_FAILED:
      case ProofGenerationStatus.SWAP_QUOTE_REQUESTING:
      case ProofGenerationStatus.SWAP_TRANSACTION_SIGNING:
      case ProofGenerationStatus.SWAP_TRANSACTION_MINING:
      case ProofGenerationStatus.GENERATING_PROOF:
      case ProofGenerationStatus.SWAP_TRANSACTION_FAILED:
      case ProofGenerationStatus.TRANSACTION_CONFIGURED:
      case ProofGenerationStatus.TRANSACTION_SIMULATING:
        return true;
      
      case ProofGenerationStatus.ERROR_FAILED_TO_PROVE:
      case ProofGenerationStatus.TRANSACTION_SIMULATION_SUCCESSFUL:
      case ProofGenerationStatus.SWAP_QUOTE_SUCCESS:
      case ProofGenerationStatus.DONE:
        return false;

      case ProofGenerationStatus.REQUESTING_PROOF_SUCCESS:
        if (isAppclipFlow && isMobile) {
          return false;
        }
        return true;

      case ProofGenerationStatus.SWAP_QUOTE_FAILED:
        // Enable manual retry after max attempts
        return quoteRetryCount < maxRetries;

      default:
        return true;
    }
  }, [status, bridgeRetryCount, quoteRetryCount, executionRetryCount, maxRetries]);

  const ctaLoading = useMemo(() => {
    switch (status) {
      // all the "ing" states
      case ProofGenerationStatus.REQUESTING_PROOF:
      case ProofGenerationStatus.TRANSACTION_LOADING:
      case ProofGenerationStatus.TRANSACTION_MINING:
      case ProofGenerationStatus.GENERATING_PROOF:
      case ProofGenerationStatus.TRANSACTION_SIMULATING:
      case ProofGenerationStatus.SWAP_QUOTE_REQUESTING:
      case ProofGenerationStatus.SWAP_TRANSACTION_SIGNING:
      case ProofGenerationStatus.SWAP_TRANSACTION_MINING:
      case ProofGenerationStatus.TRANSACTION_SIMULATING:
        return true;

      default:
        return false;
    }
  }, [status]);

  const getButtonHandler = () => {
    if (status === ProofGenerationStatus.DONE) {
      onProofGenCompletion?.();
    } else if (status === ProofGenerationStatus.ERROR_FAILED_TO_PROVE) {
      retryProofGen?.();
    } else if (status === ProofGenerationStatus.REQUESTING_PROOF_SUCCESS) {
      if (isMobile && appclipRequestURL) {
        window.open(appclipRequestURL, '_blank');
      }
    } else if (
      status === ProofGenerationStatus.SWAP_QUOTE_SUCCESS ||
      status === ProofGenerationStatus.SWAP_TRANSACTION_FAILED
    ) {
      handleSubmitSwapClick();
    } else if (
      status === ProofGenerationStatus.SWAP_QUOTE_FAILED && 
      quoteRetryCount >= maxRetries && 
      handleManualRetryBridgeQuote
    ) {
      setIsRetrying(true);
      handleManualRetryBridgeQuote();
    } else {
      handleSubmitVerificationClick();
    }
  };

  const getTelegramSupportLink = () => {
    if (depositorTgUsername) {
      const cleanedUsername = depositorTgUsername.startsWith('@')
        ? depositorTgUsername.slice(1)
        : depositorTgUsername;

      return `https://t.me/${cleanedUsername}`;
    }
    return ZKP2P_TG_SUPPORT_CHAT_LINK;
  }

  const handleSkipSwapClick = () => {
    onProofGenCompletion?.();
  }

  /*
   * Component
   */

  const renderVerificationSteps = () => {
    let selectedPaymentStepState = VerificationState.COMPLETE;
    let requestStepState = VerificationState.DEFAULT;
    let proveStepState = VerificationState.DEFAULT;
    let submitStepState = VerificationState.DEFAULT;
    let swapStepState = VerificationState.DEFAULT;

    switch (status) {
      case "not-started":
      case "requesting-proof":
        requestStepState = VerificationState.LOADING;
        break;

      case "requesting-proof-success":
        requestStepState = VerificationState.COMPLETE;
        break;

      case "generating-proof":
        requestStepState = VerificationState.COMPLETE;
        proveStepState = VerificationState.LOADING;
        break;

      case "error-failed-to-prove":
        requestStepState = VerificationState.COMPLETE;
        proveStepState = VerificationState.ERROR;
        break;

      case "transaction-simulating":
        requestStepState = VerificationState.COMPLETE;
        proveStepState = VerificationState.COMPLETE;
        submitStepState = VerificationState.LOADING;
        break;

      case "transaction-simulation-successful":
        requestStepState = VerificationState.COMPLETE;
        proveStepState = VerificationState.COMPLETE;
        submitStepState = VerificationState.LOADING;
        break;

      case "transaction-configured":
        requestStepState = VerificationState.COMPLETE;
        proveStepState = VerificationState.COMPLETE;
        submitStepState = VerificationState.LOADING;
        break;

      case "transaction-loading":
      case "transaction-mining":
        requestStepState = VerificationState.COMPLETE;
        proveStepState = VerificationState.COMPLETE;
        submitStepState = VerificationState.LOADING;
        break;

      case "swap-quote-requesting":
      case "swap-quote-loading":
      case "swap-quote-success":
        requestStepState = VerificationState.COMPLETE;
        proveStepState = VerificationState.COMPLETE;
        submitStepState = VerificationState.COMPLETE;
        swapStepState = VerificationState.LOADING;
        break;

      case "swap-transaction-signing":
      case "swap-transaction-mining":
        requestStepState = VerificationState.COMPLETE;
        proveStepState = VerificationState.COMPLETE;
        submitStepState = VerificationState.COMPLETE;
        swapStepState = VerificationState.LOADING;
        break;

      case "swap-quote-failed":
      case "swap-transaction-failed":
        requestStepState = VerificationState.COMPLETE;
        proveStepState = VerificationState.COMPLETE;
        submitStepState = VerificationState.COMPLETE;
        swapStepState = VerificationState.ERROR;
        break;

      case "transaction-simulation-failed":
        requestStepState = VerificationState.COMPLETE;
        proveStepState = VerificationState.COMPLETE;
        submitStepState = VerificationState.ERROR;
        break;

      case "done":
        requestStepState = VerificationState.COMPLETE;
        proveStepState = VerificationState.COMPLETE;
        submitStepState = VerificationState.COMPLETE;
        swapStepState = VerificationState.COMPLETE;
        break;
    }

    const verificationStepRows = [];

    let showRequestStep = false;
    if (isAppclipFlow && isMobile) {
      showRequestStep = true;
    }

    // Hide request step for now
    if (showRequestStep) {
      verificationStepRows.push(
        <VerificationStepRow
          key={VerificationStepType.REQUEST}
          type={VerificationStepType.REQUEST}
          progress={requestStepState}
          isAppclipFlow={isAppclipFlow}
          isFirstStep={true}
        />
      );
    }

    if (!isMobile) {
      verificationStepRows.push(
        <VerificationStepRow
          key={VerificationStepType.SELECTED_PAYMENT}
          type={VerificationStepType.SELECTED_PAYMENT}
          progress={selectedPaymentStepState}
          paymentSubject={paymentSubject}
          paymentDate={paymentDate}
          paymentPlatform={platform}
          fiatCurrency={fiatCurrency as string}
          isFirstStep={!showRequestStep}
        />
      );
    }

    verificationStepRows.push(
      <VerificationStepRow
        key={VerificationStepType.PROVE}
        type={VerificationStepType.PROVE}
        progress={proveStepState}
        isAppclipFlow={isAppclipFlow}
        fiatCurrency={fiatCurrency as string}
      />
    );

    verificationStepRows.push(
      <VerificationStepRow
        key={VerificationStepType.SUBMIT}
        type={VerificationStepType.SUBMIT}
        progress={submitStepState}
        isLastStep={!bridgingNeeded}
      />
    );

    if (bridgingNeeded) {
      verificationStepRows.push(
        <VerificationStepRow
          key={VerificationStepType.SWAP}
          type={VerificationStepType.SWAP}
          progress={swapStepState}
          swapToken={swapToken as string}
          isLastStep={true}
        />
      );
    }

    return verificationStepRows;
  };

  const content = (
    <>
      <VerificationStepsContainer>
        {renderVerificationSteps()}
      </VerificationStepsContainer>

      { 
      bridgingNeeded 
      && loginStatus !== LoginStatus.AUTHENTICATED // don't show swap details if user is signed in via privy
      && quoteData 
      && (
        <SwapDetails
          isLoading={false}
          quoteData={quoteData}
          countdown={10}
        />
      )}

      { shouldShowProofAndSignals && (
        <ProofAndSignalsContainer>
          <LabeledTextArea
            label="Proof Output"
            value={proof}
            disabled={true}
            height={"24vh"} 
          />
        </ProofAndSignalsContainer>
        )
      }

      {/* Enhanced bridge error display with recovery actions */}
      {bridgeErrorDetails ? (
        <BridgeErrorDisplay
          errorDetails={bridgeErrorDetails}
          retryCount={Math.max(bridgeRetryCount, quoteRetryCount, executionRetryCount)}
          maxRetries={maxRetries}
          onManualRetry={handleManualRetryBridgeQuote}
          isRetrying={status === ProofGenerationStatus.SWAP_QUOTE_REQUESTING ||
                     status === ProofGenerationStatus.SWAP_TRANSACTION_SIGNING}
        />
      ) : simulationErrorMessage && (
        <ErrorMessage>{`Error: ${simulationErrorMessage}`}</ErrorMessage>
      )}

      {(transactionAddress || (bridgeTransactions && bridgeTransactions.length > 0)) && (
        <LinkContainers>
          { transactionAddress && transactionAddress?.length > 0 && !bridgingNeeded && (
            <TransactionLinkContainer>
              <Link
                href={getTransactionExplorerUrl(transactionAddress, BASE_CHAIN_ID)}
                target="_blank"
                rel="noopener noreferrer">
                  <ThemedText.LabelSmall textAlign="left" paddingBottom={"0.75rem"}>
                    {intentData?.amountTokenToReceive ? 
                      `Received ${Number(intentData.amountTokenToReceive).toFixed(2)} USDC on Base ↗` :
                      `Received USDC on Base ↗`
                    }
                  </ThemedText.LabelSmall>
              </Link>
            </TransactionLinkContainer>
          )}

          { bridgeTransactions && bridgeTransactions?.length > 0 && (
            <BridgeTransactionLinksContainer>
              {(() => {
                // TODO: Handle other bridge providers too; currently only supports RelayÅ
                // When using Relay with Privy embedded wallet (EIP 7702), only source transaction is returned
                // For standard bridges, both source and destination transactions are available
                const isSingleTransaction = bridgeTransactions.length === 1;
                const transaction = isSingleTransaction 
                  ? bridgeTransactions[0] 
                  : bridgeTransactions[bridgeTransactions.length - 1];
                
                // Use Relay.link for single transaction (Relay with embedded wallet)
                // Use blockchain explorer for destination transaction (standard bridges)
                const linkUrl = isSingleTransaction
                  ? `https://relay.link/transaction/${transaction.txHash}`
                  : getTransactionExplorerUrl(transaction.txHash, transaction.chainId);

                const tokenTicker = tokenInfo[quoteData?.token ?? 'USDC'].ticker;
                const chainName = tokenInfo[quoteData?.token ?? 'USDC'].chainName;
                const receivedAmount = relayTokenAmountToReadable(quoteData?.outAmountFormatted);

                return (
                  <Link
                    key={transaction.txHash}
                    href={linkUrl}
                    target="_blank"
                    rel="noopener noreferrer">
                    <ThemedText.LabelSmall textAlign="left">
                      Received {receivedAmount} {tokenTicker} on {chainName} ↗
                    </ThemedText.LabelSmall>
                  </Link>
                );
              })()}
            </BridgeTransactionLinksContainer>
          )}
        </LinkContainers>
      )}

      { status === ProofGenerationStatus.ERROR_FAILED_TO_PROVE && structuredError && (
        <ProofErrorDisplay
          error={structuredError}
          platform={platform}
        />
      )}

      { status === ProofGenerationStatus.TRANSACTION_SIMULATION_FAILED && (
        <TransactionLinkContainer>
          <SupportLink 
            onClick={(e) => {
              e.preventDefault();
              setShowContactModal(true);
            }}
          >
            <ThemedText.LabelSmall textAlign="left" paddingBottom={"0.75rem"}>
              {`Need help? Contact ${depositorTgUsername ? 'seller' : 'support'} ↗`}
            </ThemedText.LabelSmall>
          </SupportLink>
        </TransactionLinkContainer>
      )}

      <ButtonContainer>
        <Button
          disabled={ctaDisabled || isRetrying}
          onClick={getButtonHandler}
          fullWidth={true}
        >
          <ButtonContentWrapper>
            {(ctaLoading || isRetrying) && <StyledSpinner size={20} />}
            <span>{ctaButtonTitle}</span>
          </ButtonContentWrapper>
        </Button>

        {
          (
            status === ProofGenerationStatus.TRANSACTION_SIMULATION_FAILED || 
            status === ProofGenerationStatus.ERROR_FAILED_TO_PROVE
          ) && handleReturnToPaymentSelection && (
          <AccessoryButton
            onClick={handleReturnToPaymentSelection}
            title="Select Another Payment"
            fullWidth={true}
            textAlign="center"
            borderRadius={24}
          />
        )}

        { 
          showAccessoryCta && 
          // don't show accessory cta if user is signed in via privy
          loginStatus !== LoginStatus.AUTHENTICATED && (
            <AccessoryButton
              onClick={handleSkipSwapClick}
              title={"Skip Swap. Go Back"}
              fullWidth={true}
              textAlign="center"
              borderRadius={24}
            />
        )}
      </ButtonContainer>

      {/* Error Support Box - Shows when proof generation fails */}
      {status === ProofGenerationStatus.ERROR_FAILED_TO_PROVE && errorDetails && (
        <ErrorSupportBox>
          <ErrorSupportContent>
            <ErrorSupportText>
            <strong>Need support?</strong> {depositorTgUsername 
              ? `Contact the seller below or reach ZKP2P support in the bottom right` 
              : `Reach ZKP2P support in the bottom right to send your case details below.`}
            </ErrorSupportText>
          </ErrorSupportContent>
          {depositorTgUsername ? (
            <>
              <CopyErrorButton onClick={() => setShowContactModal(true)}>
                <CopyErrorText>
                  Contact Seller
                </CopyErrorText>
              </CopyErrorButton>
              <CopyDetailsLink onClick={handleCopyError}>
                <CopyButton textToCopy={errorDetails} size="sm" />
                <span>{errorCopied ? 'Copied!' : 'Copy details for support'}</span>
              </CopyDetailsLink>
            </>
          ) : (
            <CopyErrorButton onClick={handleCopyError}>
              <CopyErrorText>
                {errorCopied ? 'Copied to clipboard!' : 'Copy details for support'}
              </CopyErrorText>
              <CopyButton textToCopy={errorDetails} size="sm" />
            </CopyErrorButton>
          )}
        </ErrorSupportBox>
      )}

      {showPoweredByReclaim && (
        <PoweredByContainer>
          <PoweredByText>Powered by</PoweredByText>
          <ReclaimLogo src={reclaimSvg} alt="Reclaim Protocol" />
        </PoweredByContainer>
      )}



      {showContactModal && depositorTgUsername && (
        <ContactSellerModal
          onCloseClick={() => setShowContactModal(false)}
          orderDetails={{
            intentHash: currentIntentView?.intentHash || '',
            amount: intentData?.amountFiatToSend || '',
            currency: intentData?.sendCurrency || '',
            paymentPlatform: platform,
            recipientAddress: intentData?.recipientAddress || '',
            depositId: intentData?.depositId || ''
          }}
          depositorTgUsername={depositorTgUsername}
        />
      )}

      {showContactModal && !depositorTgUsername && (
        <ContactSupportModal
          onCloseClick={() => setShowContactModal(false)}
          intentHash={currentIntentView?.intentHash || ''}
          errorMessage={simulationErrorMessage || ''}
          paymentProof={proof}
        />
      )}
    </>
  );

  if (displayType === 'page') {
    return (
      <PageContainer>
        {content}
      </PageContainer>
    );
  }

  return (
    <ModalAndOverlayContainer>
      <Overlay />
      <ModalContainer>
        <TitleRowContainer>
          <button
            onClick={handleOverlayClick}
            disabled={status === ProofGenerationStatus.GENERATING_PROOF}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              opacity: status === ProofGenerationStatus.GENERATING_PROOF ? 0.5 : 1,
            }}
            >

            <StyledArrowLeft/>
          </button>

          <Title>
            <ThemedText.HeadlineSmall style={{ flex: '0', textAlign: 'right' }}>
              {!isMobile ? title : 'Verify'}
            </ThemedText.HeadlineSmall>
          </Title>

          {!isMobile ? (
            <LabeledSwitch
              switchChecked={shouldShowProofAndSignals}
              checkedLabel={"Hide"}
              uncheckedLabel={"Show"}
              helperText={commonStrings.get('PROOF_TOOLTIP')}
              onSwitchChange={(checked: boolean) => {
                if (setShouldShowProofAndSignals) {
                  setShouldShowProofAndSignals(checked);
                }
              }}
            />
          ) : (
            <div></div> // Leave empty div in so title remains centered
          )}
        </TitleRowContainer>

        {content}
      </ModalContainer>
    </ModalAndOverlayContainer>
  );
};

export default ProvePayment;