import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';

import { ProofGenerationStatus, ProofGenerationStatusType } from '@helpers/types';
import { parseExtensionProof } from '@helpers/types';
import { ExtensionRequestMetadata } from '@helpers/types';
import { Proof } from '@helpers/types';
import { formatDateTime } from '@helpers/dateFormat';
import { PaymentPlatformType, paymentPlatformInfo } from '@helpers/types/paymentPlatform';
import { safeStringify } from '@helpers/bigIntSerialization';

import { BreadcrumbStep } from '@components/common/Breadcrumb';
import { ProvePayment } from '@components/Swap/CompleteOrder/ProvePayment';
import { PaymentTable } from '@components/Swap/CompleteOrder/PaymentTable';

import useQuery from '@hooks/useQuery';
import { ParsedQuoteData } from '@hooks/bridge/useRelayBridge';
import useExtensionProxyProofs from '@hooks/contexts/useExtensionProxyProofs';
import { useErrorLogger } from '@hooks/useErrorLogger';
import { ErrorCategory } from '@helpers/types/errors';
import { ProofGenerationError, parseProofGenerationError } from '@helpers/proofErrorParser';


const PROOF_FETCH_INTERVAL = 3000;
const PROOF_GENERATION_TIMEOUT = 60000; // 60 seconds timeout

export type ParsedPayment = {
  amount: string;
  timestamp: string;
  recipientId: string;
  index: number;
};


interface ExtensionProofFormProps {
  intentHash: string;
  paymentPlatform: PaymentPlatformType;
  paymentMethod: number;
  paymentProofs: Proof[] | null;
  setPaymentProofs: React.Dispatch<React.SetStateAction<Proof[] | null>>;
  proofGenerationStatus: ProofGenerationStatusType;
  setProofGenerationStatus: (status: ProofGenerationStatusType) => void;
  handleCompleteOrderClick: () => void;
  onProofGenCompletion: () => void;
  handleSubmitSwapClick: () => void;
  completeOrderTransactionSigningStatus: string;
  completeOrderTransactionMiningStatus: string;
  completeOrderTransactionHash: string;
  showUseReclaimFlow: boolean;
  handleUseReclaimFlowClick: () => void;
  bridgingNeeded: boolean;
  quoteData: ParsedQuoteData | null;
  bridgeTransactions: {
    txHash: string;
    chainId: number;
  }[] | null;
  simulationErrorMessage: string | null;
  setSimulationErrorMessage: (message: string | null) => void;
  setTitle: (title: string) => void;
  setBreadcrumbStep: (step: BreadcrumbStep) => void;
  shouldShowProofDetails?: boolean;
  setShouldShowProofDetails?: (show: boolean) => void;
  handleManualRetryBridgeQuote: () => void;
  bridgeRetryCount: number;
  quoteRetryCount: number;
  executionRetryCount: number;
  maxRetries: number;
  bridgeErrorDetails?: {
    type: import('@helpers/bridgeErrors').BridgeErrorType;
    message: string;
    isRetryable: boolean;
  } | null;
}

const Container = styled.div`
  width: 100%;
`;

export const ExtensionProofForm: React.FC<ExtensionProofFormProps> = ({
  intentHash,
  paymentPlatform,
  paymentMethod,
  paymentProofs,
  setPaymentProofs,
  proofGenerationStatus,
  setProofGenerationStatus,
  handleCompleteOrderClick,
  onProofGenCompletion,
  handleSubmitSwapClick,
  completeOrderTransactionSigningStatus,
  completeOrderTransactionMiningStatus,
  completeOrderTransactionHash,
  showUseReclaimFlow,
  handleUseReclaimFlowClick,
  bridgingNeeded,
  quoteData,
  bridgeTransactions,
  simulationErrorMessage,
  setSimulationErrorMessage,
  setTitle,
  setBreadcrumbStep,
  shouldShowProofDetails = false,
  setShouldShowProofDetails,
  handleManualRetryBridgeQuote,
  bridgeRetryCount,
  quoteRetryCount,
  executionRetryCount,
  maxRetries,
  bridgeErrorDetails,
}) => {
  // Removed displayName assignment - might cause issues in Vite
  
  /*
   * Context
   */

  const { navigateWithQuery } = useQuery();
  const { logError } = useErrorLogger();

  const {
    paymentProof: extensionPaymentProof,
    fetchPaymentProof,
    generatePaymentProof,
    resetProofState,
    sideBarVersion
  } = useExtensionProxyProofs();
  
  /*
   * State
   */

  const [selectedPayment, setSelectedPayment] = useState<ExtensionRequestMetadata | null>(null);
  const [shouldShowVerificationModal, setShouldShowVerificationModal] = useState<boolean>(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [triggerProofFetchPolling, setTriggerProofFetchPolling] = useState<boolean>(false);
  const [currentProofIndex, setCurrentProofIndex] = useState<number>(0);
  const [proofError, setProofError] = useState<string | null>(null);
  const [structuredProofError, setStructuredProofError] = useState<ProofGenerationError | null>(null);

  // Controls the auto selection of payment in PaymentTable; Store it here to run the auto selection only once 
  // when the payment table is mounted, subsequent selections are done manually by the user
  const [autoVerificationAttempted, setAutoVerificationAttempted] = useState<boolean>(false);

  /*
   * Hooks
   */

  useEffect(() => {
    if (extensionPaymentProof) {
      let transferProof = extensionPaymentProof;
      console.log('---------transferProof---------', transferProof);

      switch (transferProof.status) {
        case 'pending':
          break;
        case 'success':
          console.log('---------setting payment proof---------');
          const parsedProof = parseExtensionProof(transferProof.proof);
          
          // Store the proof in our array
          setPaymentProofs(prev => {
            const newProofs = prev ? [...prev] : [];
            newProofs[currentProofIndex] = parsedProof;
            return newProofs;
          });

          // If we have more proofs to generate, trigger the next one
          const requiredProofs = paymentPlatformInfo[paymentPlatform].paymentMethods[paymentMethod].verifyConfig.totalProofs;
          
          if (currentProofIndex < requiredProofs - 1) {
            const intentHashDecimals = BigInt(intentHash).toString();

            // trigger the next proof generation
            generatePaymentProof(
              paymentPlatform, 
              intentHashDecimals, 
              selectedPayment?.originalIndex || 0, 
              currentProofIndex + 1
            );

            // increment the proof index
            setCurrentProofIndex(prev => prev + 1);
          } else if (currentProofIndex === requiredProofs - 1) {            
            
            // Reached the required number of proofs, reset the proof state
            resetProofState();
            setCurrentProofIndex(0);
          }
          break;
        case 'error':
          // Parse the error into a structured format
          const parsedError = parseProofGenerationError(
            transferProof,
            paymentPlatform,
            paymentMethod
          );
          
          setProofGenerationStatus(ProofGenerationStatus.ERROR_FAILED_TO_PROVE);
          setStructuredProofError(parsedError);
          setProofError(safeStringify(transferProof)); // Keep for backwards compatibility

          // Log proof gen failures
          logError(
            'Extension proof generation failed',
            ErrorCategory.PROOF_ERROR,
            {
              error: 'Failed to generate proof',
              proofStatus: transferProof.status,
              // Don't log full proof data for security
              hasProofData: !!transferProof.proof,
              paymentPlatform,
              paymentMethod,
              intentHash,
              currentProofIndex,
              requiredProofs: paymentPlatformInfo[paymentPlatform].paymentMethods[paymentMethod].verifyConfig.totalProofs,
              // Sanitize payment info - no PII
              hasSelectedPayment: !!selectedPayment,
              paymentAmount: selectedPayment?.amount,
              // Add parsed error info
              errorType: parsedError.type,
              errorField: parsedError.field,
              extensionVersion: sideBarVersion
            }
          );
          break;
      }
    }
  }, [
    extensionPaymentProof
  ]);

  // Setup interval for proof fetching
  useEffect(() => {
    if (triggerProofFetchPolling && paymentPlatform) {
      console.log('---------setting interval for proof fetching---------');
      if (intervalId) clearInterval(intervalId);
      
      const id = setInterval(
        () => {
          console.log('fetching proof');
          fetchPaymentProof(paymentPlatform);
        }, 
        PROOF_FETCH_INTERVAL
      );
      setIntervalId(id);

      // Add timeout
      const timeoutId = setTimeout(() => {
        if (intervalId) clearInterval(intervalId);
        setTriggerProofFetchPolling(false);
        setProofGenerationStatus(ProofGenerationStatus.ERROR_FAILED_TO_PROVE);
        
        logError(
          'Extension proof generation timeout',
          ErrorCategory.TIMEOUT_ERROR,
          {
            paymentPlatform,
            paymentMethod,
            intentHash,
            timeoutDuration: PROOF_GENERATION_TIMEOUT,
            currentProofIndex,
            // Sanitize payment info - no PII
            hasSelectedPayment: !!selectedPayment,
            paymentAmount: selectedPayment?.amount,
            extensionVersion: sideBarVersion
          }
        );
      }, PROOF_GENERATION_TIMEOUT);

      return () => {
        if (intervalId) clearInterval(intervalId);
        clearTimeout(timeoutId);
      };
    } 
  }, [paymentPlatform, fetchPaymentProof, triggerProofFetchPolling]);

  // Clear interval when payment proof is generated
  useEffect(() => {
    const requiredProofs = paymentPlatformInfo[paymentPlatform].paymentMethods[paymentMethod].verifyConfig.totalProofs;
    if (paymentProofs !== null && intervalId !== null && paymentProofs.length === requiredProofs) {
      console.log('---------clearing interval---------');
      clearInterval(intervalId);
      setTriggerProofFetchPolling(false);
    }
  }, [
    paymentProofs, 
    intervalId,
  ]);

  /*
   * Handlers
   */

  const handleVerifyPaymentWithMetadata = useCallback(async (payment: ExtensionRequestMetadata) => {
    setSelectedPayment(payment);
    setShouldShowVerificationModal(true);
    setCurrentProofIndex(0); // Reset proof index

    if (payment && intentHash && paymentPlatform) {
      // simulate proof request success
      setProofGenerationStatus(ProofGenerationStatus.REQUESTING_PROOF);

      await new Promise(resolve => setTimeout(resolve, 500))

      setProofGenerationStatus(ProofGenerationStatus.REQUESTING_PROOF_SUCCESS);

      await new Promise(resolve => setTimeout(resolve, 100))

      // start proof generation; The calling component will handle moving this to the next status
      setProofGenerationStatus(ProofGenerationStatus.GENERATING_PROOF);

      const intentHashDecimals = BigInt(intentHash).toString();

      setTriggerProofFetchPolling(false);

      if (intervalId) clearInterval(intervalId);    // clear interval before generating proof

      setPaymentProofs(null);    // clear payment proof before generating proof
      setProofError(null);       // clear any previous proof error
      setStructuredProofError(null); // clear structured error

      // Generate initial proof
      generatePaymentProof(paymentPlatform, intentHashDecimals, payment.originalIndex);

      setTriggerProofFetchPolling(true);    // start polling for proof
    }
  }, [generatePaymentProof, intentHash, intervalId, paymentPlatform, setPaymentProofs, setProofGenerationStatus]);

  const handleRetryProofGen = useCallback(() => {
    if (selectedPayment) {
      handleVerifyPaymentWithMetadata(selectedPayment);
    }
  }, [handleVerifyPaymentWithMetadata, selectedPayment]);

  const handleModalBackClicked = () => {
    // Clear proof generation if back button is clicked
    if (intervalId) clearInterval(intervalId);
    setSimulationErrorMessage(null);
    setShouldShowVerificationModal(false);
  }

  const handleReturnToPaymentSelection = useCallback(() => {
    // Clear any proof generation state
    if (intervalId) clearInterval(intervalId);
    setSimulationErrorMessage(null); 
    setShouldShowVerificationModal(false);
    setSelectedPayment(null);
    setProofGenerationStatus(ProofGenerationStatus.NOT_STARTED); // reset proof generation status
    setAutoVerificationAttempted(true); // Explicitly set to true to prevent auto-verification from running
  }, [intervalId, setSimulationErrorMessage, setProofGenerationStatus]);

  // Add helper functions to extract payment details
  const getPaymentSubject = useCallback((payment: ExtensionRequestMetadata | null) => {
    if (!payment || !paymentPlatform) return "";
    return paymentPlatformInfo[paymentPlatform].paymentMethods[paymentMethod].verifyConfig.getSubjectText(payment);
  }, [paymentPlatform, paymentMethod]);
  
  const getPaymentDate = useCallback((payment: ExtensionRequestMetadata | null) => {
    if (!payment || !paymentPlatform) return "";
    return formatDateTime(payment.date ?? '', paymentPlatform);
  }, [paymentPlatform]);

  /*
   * Component
   */

  return (
    <>
      {paymentPlatform && (
        <Container>
          {shouldShowVerificationModal ? (
            <ProvePayment
              title={"Verify Payment"}
              // We are not showing the proofs in modal anymore, so we just show the first proof
              proof={paymentProofs ? safeStringify(paymentProofs[0]) : ''}
              proofError={proofError || undefined}
              structuredError={structuredProofError || undefined}
              onBackClick={handleModalBackClicked}
              onProofGenCompletion={onProofGenCompletion}
              status={proofGenerationStatus}
              platform={paymentPlatform}
              buttonTitle={'Complete Order'}
              submitTransactionStatus={completeOrderTransactionSigningStatus}
              isSubmitMining={completeOrderTransactionMiningStatus === 'loading'}
              setProofGenStatus={setProofGenerationStatus}
              handleSubmitVerificationClick={handleCompleteOrderClick}
              handleReturnToPaymentSelection={handleReturnToPaymentSelection}
              transactionAddress={completeOrderTransactionHash}
              provingFailureErrorCode={1}
              bridgingNeeded={bridgingNeeded}
              quoteData={quoteData}
              bridgeTransactions={bridgeTransactions}
              handleSubmitSwapClick={handleSubmitSwapClick}
              isAppclipFlow={false}
              simulationErrorMessage={simulationErrorMessage}
              displayType="page"
              paymentSubject={getPaymentSubject(selectedPayment)}
              paymentDate={getPaymentDate(selectedPayment)}
              selectedPayment={selectedPayment || undefined}
              shouldShowProofAndSignals={shouldShowProofDetails}
              setShouldShowProofAndSignals={setShouldShowProofDetails}
              retryProofGen={handleRetryProofGen}
              handleManualRetryBridgeQuote={handleManualRetryBridgeQuote}
              bridgeRetryCount={bridgeRetryCount}
              quoteRetryCount={quoteRetryCount}
              executionRetryCount={executionRetryCount}
              maxRetries={maxRetries}
              bridgeErrorDetails={bridgeErrorDetails}
            />
          ) : (
            <PaymentTable
              paymentPlatform={paymentPlatform}
              paymentMethod={paymentMethod}
              setSelectedPayment={setSelectedPayment}
              handleVerifyPaymentWithMetadata={handleVerifyPaymentWithMetadata}
              isProofModalOpen={shouldShowVerificationModal}
              showUseReclaimFlow={showUseReclaimFlow}
              handleUseReclaimFlowClick={handleUseReclaimFlowClick}
              setTitle={setTitle}
              setBreadcrumbStep={setBreadcrumbStep}
              autoVerificationAttempted={autoVerificationAttempted}
              setAutoVerificationAttempted={setAutoVerificationAttempted}
            />
          )}
        </Container>
      )}
    </>
  )
};

ExtensionProofForm.displayName = "ExtensionProofForm";
