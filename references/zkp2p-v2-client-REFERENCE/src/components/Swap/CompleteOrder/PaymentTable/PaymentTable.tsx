import React, { useEffect, useMemo, useState, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { Inbox, Lock } from 'react-feather';
import { colors } from '@theme/colors';
import { ThemedText } from '@theme/text';

import { ExtensionRequestMetadata } from '@helpers/types';
import { ValidatePaymentStatus } from '@helpers/types';
import { tokenUnits } from '@helpers/units';
import { calculateFiatFromRequestedUSDC } from '@helpers/intentHelper';
import { getCurrencyInfoFromHash } from '@helpers/types';
import { paymentPlatformInfo, PaymentPlatformType } from '@helpers/types/paymentPlatform';

import { Button } from '@components/common/Button'
import { InstallExtension } from '../Extension/InstallExtension';
import { PaymentRow } from '@components/Swap/CompleteOrder/PaymentTable/PaymentRow';
import { getRandomFunnyRestrictionsMessage } from '@helpers/funnyMessages';
import useTableScroll from '@hooks/useTableScroll';
import useBackend from '@hooks/contexts/useBackend';
import { formatDateTime } from '@helpers/dateFormat';
import useOnRamperIntents from '@hooks/contexts/useOnRamperIntents';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import useExtensionProxyProofs from '@hooks/contexts/useExtensionProxyProofs';
import { AccessoryButton } from '@components/common/AccessoryButton';
import { ConsentInstructions } from '@components/Swap/CompleteOrder/ConsentInstructions/ConsentInstructions';
import { isVersionOutdated } from '@helpers/sidebar';
import { BreadcrumbStep } from '@components/common/Breadcrumb';


const EXPIRY_AND_PROOF_GEN_BUFFER = 1000 * 30; // 30 seconds

const Container = styled.div`
  background-color: ${colors.container};
  border-radius: 16px;
  align-items: center;
  width: 100%;
`;

const IconStyle = css`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`;

const ButtonContainer = styled.div`
  display: grid;
`;

const EmptyPaymentsContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1.9rem 0rem;
  max-width: 75%;
  margin: auto;
  gap: 1rem;
`;

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  min-height: 25vh;
  line-height: 1.3;
  gap: 1rem;
`;


const LockIcon = styled(Lock)`
  ${IconStyle}
`;

const LoggedInContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TitleContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0px 1rem;
`;

const TitleAndSubHeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const SubHeaderContainer = styled.div`
  color: ${colors.lightGrayText};
`;

const LoginButtonContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 1rem;
  min-width: 50%;
`;

const StyledInbox = styled(Inbox)`
  color: #FFF;
  width: 28px;
  height: 28px;
`;

const TableContainer = styled.div`
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px;
  background-color: ${colors.container};
`;


const Table = styled.div`
  max-height: 40vh;
  border-radius: 8px;

  @media (max-width: 600px) {
    max-height: 30vh;
  }

  font-size: 16px;
  color: #616161;
  overflow-y: auto;
  scrollbar-width: thin;
  
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${colors.defaultBorderColor};
    border-radius: 4px;
  }

  & > *:last-child::after {
    display: none;
  }
`;

interface PaymentTableProps {
  paymentPlatform: PaymentPlatformType;
  paymentMethod: number;
  setSelectedPayment: (payment: ExtensionRequestMetadata) => void;
  handleVerifyPaymentWithMetadata: (payment: ExtensionRequestMetadata) => void;
  isProofModalOpen: boolean;
  handleUseReclaimFlowClick: () => void;
  showUseReclaimFlow: boolean;
  setTitle: (title: string) => void;
  setBreadcrumbStep: (step: BreadcrumbStep) => void;
  autoVerificationAttempted: boolean;
  setAutoVerificationAttempted: (attempted: boolean) => void;
};
  
export const PaymentTable: React.FC<PaymentTableProps> = ({
  paymentPlatform,
  paymentMethod,
  setSelectedPayment,
  handleVerifyPaymentWithMetadata,
  isProofModalOpen,
  showUseReclaimFlow,
  handleUseReclaimFlowClick,
  setTitle,
  setBreadcrumbStep,
  autoVerificationAttempted,
  setAutoVerificationAttempted
}) => {

  PaymentTable.displayName = "PaymentTable";

  /*
   * Context
   */

  const { currentIntentView } = useOnRamperIntents();
  const { usdcAddress } = useSmartContracts();
  const { rawPayeeDetails } = useBackend();
  const {
    openNewTab,
    isSidebarInstalled,
    sideBarVersion,
    platformMetadata,
    clearPlatformMetadata,
  } = useExtensionProxyProofs();
  const { tableRef, isScrolling } = useTableScroll();
  
  /*
   * State
   */

  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isPlatformAuthenticated, setIsPlatformAuthenticated] = useState<boolean>(false);

  const [paymentsMetadata, setPaymentsMetadata] = useState<ExtensionRequestMetadata[] | null>(null);
  const [paymentsMetadataExpiresAt, setPaymentsMetadataExpiresAt] = useState<number | null>(null);
  const [arePaymentsExpired, setArePaymentsExpired] = useState<boolean>(false);
  const [filteredPayments, setFilteredPayments] = useState<ExtensionRequestMetadata[]>([]);

  const [isScrollEnabled, setIsScrollEnabled] = useState(false);
  
  const [ctaButtonTitle, setCtaButtonTitle] = useState<string>('');
  const [ctaButtonDisabled, setCtaButtonDisabled] = useState<boolean>(false);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  const [validatePaymentStatus, setValidatePaymentStatus] = useState<string>(ValidatePaymentStatus.DEFAULT);

  const [triggerPaymentValidation, setTriggerPaymentValidation] = useState<number>(0);

  const [isSidebarNeedsUpdate, setIsSidebarNeedsUpdate] = useState<boolean>(false);

  /*
   * Hooks
   */

  useEffect(() => {
    if (!isSidebarInstalled || !sideBarVersion) {
      setTitle('Install PeerAuth Extension');
      setBreadcrumbStep(BreadcrumbStep.EXTENSION);
      return;
    } 

    const needsUpdate = isVersionOutdated(sideBarVersion, paymentMethod, paymentPlatform);
    setIsSidebarNeedsUpdate(needsUpdate);

    if (needsUpdate) {
      setTitle('Update Extension');
      setBreadcrumbStep(BreadcrumbStep.EXTENSION);
      return;
    }

    if (!isPlatformAuthenticated) {
      setTitle(`Sign in with ${getPlatformName()}`);
      setBreadcrumbStep(BreadcrumbStep.AUTHENTICATE);
    } else {
      setTitle(`Verify Payment`);
      setBreadcrumbStep(BreadcrumbStep.VERIFY);
    }
  }, [isSidebarInstalled, sideBarVersion, paymentMethod, paymentPlatform]);

  useEffect(() => {
    const platformData = platformMetadata[paymentPlatform];
    
    if (platformData) {
      setPaymentsMetadata(platformData.metadata);
      setPaymentsMetadataExpiresAt(platformData.expiresAt);
    } else {
      setPaymentsMetadata(null);
      setPaymentsMetadataExpiresAt(null);
    }

    setIsRefreshing(false);
    setArePaymentsExpired(false);
    setValidatePaymentStatus(ValidatePaymentStatus.DEFAULT);
    // Don't reset autoVerificationAttempted here - it should maintain its state
    // when platformMetadata updates (e.g., after clicking "Select Another Payment")
  }, [
    paymentPlatform, 
    platformMetadata,
  ]);

  useEffect(() => {
    if (paymentsMetadata !== null && !isPlatformAuthenticated) {
      setIsAuthenticating(false);
      setIsPlatformAuthenticated(true);

      setTitle(`Verify Payment`);
      setBreadcrumbStep(BreadcrumbStep.VERIFY);
    }
  }, [paymentsMetadata, isPlatformAuthenticated]);

  useEffect(() => {
    const lastPlatform = localStorage.getItem('lastPaymentPlatform');
    const lastPaymentMethod = localStorage.getItem('lastPaymentMethod');
    
    if (lastPlatform !== paymentPlatform || lastPaymentMethod !== String(paymentMethod)) {
      console.log('payment platform or method changed', paymentPlatform, paymentMethod);
      
      // Clear metadata in the context
      clearPlatformMetadata(paymentPlatform);
      
      // Reset local state
      setPaymentsMetadata(null);
      setIsPlatformAuthenticated(false);
      setIsAuthenticating(false);
      
      // Update stored values
      localStorage.setItem('lastPaymentPlatform', paymentPlatform);
      localStorage.setItem('lastPaymentMethod', String(paymentMethod));
    }
  }, [paymentPlatform, paymentMethod, clearPlatformMetadata]);

  useEffect(() => {
    const tableElement = tableRef.current;
    if (tableElement) {
      setIsScrollEnabled(tableElement.scrollHeight > tableElement.clientHeight);
    }
  }, [paymentsMetadata, tableRef]);

  const isPaymentValid = useCallback((
    metadata: ExtensionRequestMetadata
  ) => {
    if (!currentIntentView) {
      return false;
    }
    
    // First check if it's a sent payment
    const subjectText = paymentPlatformInfo[paymentPlatform].paymentMethods[paymentMethod].verifyConfig.getSubjectText(metadata);
    if (subjectText === '') {
      return false;
    }
    
    const parsedPayment = paymentPlatformInfo[paymentPlatform].paymentMethods[paymentMethod].verifyConfig.parseMetadata(metadata);
    const tokenDecimals = currentIntentView.deposit.deposit.token === usdcAddress ? 6 : 18;
    
    // Check amount (this could be optimized as it's being calculated per payment row)
    const requiredPaymentAmount = calculateFiatFromRequestedUSDC(
      currentIntentView.intent.amount, 
      currentIntentView.intent.conversionRate, 
      tokenDecimals
    );

    // Check amount
    if (!parsedPayment.amount || parsedPayment.amount === '') {
      return false;
    }
    let paymentAmount;
    try {
      paymentAmount = tokenUnits(parsedPayment.amount, tokenDecimals);
    } catch (error) {
      console.error('Error parsing token units:', error);
      return false;
    }
    
    if (
      parsedPayment.parsedAmount &&
      paymentAmount < requiredPaymentAmount
    ) {
      return false;
    }
    
    // Check currency
    const requiredCurrency = getCurrencyInfoFromHash(currentIntentView.intent.fiatCurrency)?.currency;
    if (
      parsedPayment.parsedCurrency &&
      parsedPayment.currency !== requiredCurrency
    ) {
      return false;
    }

    // Check timestamp
    const paymentTimestamp = new Date(parsedPayment.date + (parsedPayment.date.endsWith('Z') ? '' : 'Z')).getTime();
    const intentTimestamp = Number(currentIntentView.intent.timestamp) * 1000;
    if (
      parsedPayment.parsedDate &&
      paymentTimestamp < intentTimestamp
    ) {
      return false;
    }
       
    // Check recipient
    if (
      parsedPayment.parsedRecipientId &&
      parsedPayment.recipientId !== rawPayeeDetails
    ) {
      return false;
    }
    
    return true;
  }, [currentIntentView, paymentPlatform, usdcAddress, rawPayeeDetails]);

  // Effect for filtering and displaying payments (always runs when payments load)
  useEffect(() => {
    if (paymentsMetadata && paymentsMetadata.length > 0 && currentIntentView) {
      // Find payments that pass all validation checks
      let validPayments = paymentsMetadata.filter(metadata => isPaymentValid(metadata));

      const verifyConfig = paymentPlatformInfo[paymentPlatform].paymentMethods[paymentMethod].verifyConfig;
      const reverseTransactionHistoryOrder = verifyConfig.reverseTransactionHistoryOrder ?? false;
      if (reverseTransactionHistoryOrder) {
        validPayments = [...validPayments].reverse();
      }
      
      if (validPayments.length >= 1) {
        // Show valid payments for user to choose
        setFilteredPayments(validPayments);
      } else {
        // Just show all payments that have a subject (are sent payments)
        let sentPayments = paymentsMetadata.filter(metadata => 
          paymentPlatformInfo[paymentPlatform].paymentMethods[paymentMethod].verifyConfig.getSubjectText(metadata) !== ''
        );
        
        let processedPayments = sentPayments.length > 0 ? sentPayments : paymentsMetadata;
        
        // Apply platform-specific ordering to all payments
        if (reverseTransactionHistoryOrder) {
          processedPayments = [...processedPayments].reverse();
        }
        
        setFilteredPayments(processedPayments);
      }
    }
  }, [
    paymentsMetadata, 
    currentIntentView, 
    isPaymentValid, 
    paymentPlatform,
    paymentMethod
  ]);

  // Separate effect for auto-verification (only runs once)
  useEffect(() => {
    if (
      filteredPayments &&
      filteredPayments.length > 0 &&
      currentIntentView &&
      !autoVerificationAttempted && // Only proceed if we haven't attempted verification
      !isProofModalOpen // Don't auto-select if modal is already open
    ) {
      setAutoVerificationAttempted(true);
      
      // Find valid payments
      const validPayments = filteredPayments.filter(metadata => isPaymentValid(metadata));
      
      if (validPayments.length === 1) {
        setSelectedPayment(validPayments[0]);
        setValidatePaymentStatus(ValidatePaymentStatus.VALID);
        setSelectedIndex(0);
        
        // Start verification with selected payment directly
        handleVerifyPaymentWithMetadata(validPayments[0]);
      }
    }
  }, [
    filteredPayments,
    currentIntentView,
    isPaymentValid,
    handleVerifyPaymentWithMetadata, 
    autoVerificationAttempted,
    isProofModalOpen,
    isRefreshing
  ]);

  useEffect(() => {
    switch (validatePaymentStatus) {
      case ValidatePaymentStatus.DEFAULT:
        setCtaButtonTitle('Select Payment');
        break;
      
      case ValidatePaymentStatus.PAYMENTS_EXPIRED:
        setCtaButtonTitle('Please refresh to see payments');
        break;

      case ValidatePaymentStatus.VALID:
        if (isProofModalOpen) {
          setCtaButtonTitle('Verifying Payment');
        } else {
          setCtaButtonTitle('Verify Payment');
        }
        break;
    }
  }, [isProofModalOpen, validatePaymentStatus]);

  useEffect(() => {
    const checkExpiration = () => {
      // Expire payments before such that if they are chosen for proof generation, they don't expire while proof is being generated
      if (
        !isRefreshing 
        && paymentsMetadataExpiresAt 
        && new Date(paymentsMetadataExpiresAt).getTime() < Date.now() + EXPIRY_AND_PROOF_GEN_BUFFER
      ) {
        setValidatePaymentStatus(ValidatePaymentStatus.PAYMENTS_EXPIRED);
      }
    };

    const interval = setInterval(checkExpiration, 1000); // Check every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, [paymentsMetadataExpiresAt, isRefreshing]);

  /*
   * Handlers
   */

  const handleAuthClicked = () => {
    setIsAuthenticating(true);

    const paymentMethodData = paymentPlatformInfo[paymentPlatform].paymentMethods[paymentMethod];
    const actionType = paymentMethodData.verifyConfig.actionType;
    const actionPlatform = paymentMethodData.verifyConfig.actionPlatform;
    
    openNewTab(actionType, actionPlatform);  
  }

  const handleRefreshClicked = () => {
    setIsRefreshing(true);
    setAutoVerificationAttempted(false);

    const paymentMethodData = paymentPlatformInfo[paymentPlatform].paymentMethods[paymentMethod];
    const actionType = paymentMethodData.verifyConfig.actionType;
    const actionPlatform = paymentMethodData.verifyConfig.actionPlatform;
    
    openNewTab(actionType, actionPlatform);  
  }

  const handlePaymentRowClicked = (metadata: ExtensionRequestMetadata, index: number) => {
    if (validatePaymentStatus === ValidatePaymentStatus.PAYMENTS_EXPIRED) {
      return;
    }

    setSelectedPayment(metadata);
    setSelectedIndex(index);
    setValidatePaymentStatus(ValidatePaymentStatus.VALID);
  };

  const handleVerifyPaymentClick = useCallback(() => {
    if (selectedIndex !== null && filteredPayments.length > 0) {
      handleVerifyPaymentWithMetadata(filteredPayments[selectedIndex]);
    }
  }, [selectedIndex, filteredPayments, handleVerifyPaymentWithMetadata]);

  /*
   * Helpers
   */

  
  const getPlatformName = () => {
    const hasMultiplePaymentMethods = paymentPlatformInfo[paymentPlatform].paymentMethods.length > 1;
    const platformName = paymentPlatformInfo[paymentPlatform].platformName;
    const paymentMethodName = paymentPlatformInfo[paymentPlatform].paymentMethods[paymentMethod].sendConfig.paymentMethodName;

    return hasMultiplePaymentMethods ? `${paymentMethodName}` : platformName;
  }

  const getConsentInstructions = () => {
    return [
      `Instantly verify payment to complete your order`,
      `Extract select details from your last ${paymentPlatformInfo[paymentPlatform].paymentMethods[paymentMethod].verifyConfig.numPaymentsFetched} payments`,
      'Redact any sensitive information using zero-knowledge proofs',
      'Data never leaves your device'
    ];
  }
  
  const funnyRestrictionMessage = useMemo(() => getRandomFunnyRestrictionsMessage(), []);
  const getRestrictions = () => {
    return [
      'Make payments on your behalf',
      funnyRestrictionMessage
    ];
  }

  /*
   * Component
   */

  return (
    <Container>
      {
        !isSidebarInstalled || isSidebarNeedsUpdate ? (
          <InstallExtension
            handleUseReclaimFlowClick={handleUseReclaimFlowClick}
            showUseReclaimFlow={showUseReclaimFlow}
            paymentPlatform={paymentPlatform}
            paymentMethod={paymentMethod}
          />
        ) : (
          !isPlatformAuthenticated ? (
            <LoginContainer>
              <ConsentInstructions 
                instructionsTitle="This will allow ZKP2P to:"
                instructions={getConsentInstructions()}
                restrictionsTitle="This will NOT allow ZKP2P to:"
                restrictions={getRestrictions()}
              />

              <LoginButtonContainer>
                <Button
                  onClick={handleAuthClicked}
                  height={48}
                  width={280}
                >
                  Sign in with {getPlatformName()}
                </Button>
                {showUseReclaimFlow && 
                  <AccessoryButton
                    onClick={handleUseReclaimFlowClick}
                    title="Or Continue on Phone"
                    width={260}
                    textAlign="center"
                    borderRadius={24}
                    // icon={<Phone />}
                  />
                }
              </LoginButtonContainer>
            </LoginContainer>
          ) : (
            <LoggedInContainer>
              <TitleContainer>
                <TitleAndSubHeaderContainer>
                  <ThemedText.SubHeader textAlign="left">
                    Your {getPlatformName()} Payments
                  </ThemedText.SubHeader>
                  <SubHeaderContainer>
                    <ThemedText.BodySmall textAlign="left">
                      {`Select a payment to verify`}
                    </ThemedText.BodySmall>
                  </SubHeaderContainer>
                </TitleAndSubHeaderContainer>

                <AccessoryButton
                  onClick={handleRefreshClicked}
                  height={36}
                  title={'Refresh'}
                  icon={'refresh'}
                />
              </TitleContainer>

              <TableContainer>
                {paymentsMetadata && (
                  paymentsMetadata.length === 0 ? (
                    <EmptyPaymentsContainer>
                      <StyledInbox />
                      <ThemedText.SubHeaderSmall textAlign="center" lineHeight={1.3}>
                        { 'No send payments found' }
                      </ThemedText.SubHeaderSmall>
                    </EmptyPaymentsContainer>
                  ) : (
                    <Table ref={tableRef}>
                      {filteredPayments.map((metadata, index) => (
                        <PaymentRow
                          key={index}
                          isFirstRow={index === 0}
                          isLastRow={index === filteredPayments.length - 1}
                          subjectText={
                            validatePaymentStatus === ValidatePaymentStatus.PAYMENTS_EXPIRED 
                            ? 'Please refresh to see payments' 
                            : paymentPlatformInfo[paymentPlatform].paymentMethods[paymentMethod].verifyConfig.getSubjectText(metadata)
                          }
                          dateText={
                            validatePaymentStatus === ValidatePaymentStatus.PAYMENTS_EXPIRED 
                            ? '' 
                            : formatDateTime(metadata.date ?? '', paymentPlatform)
                          }
                          isSelected={selectedIndex === index}
                          onRowClick={() => handlePaymentRowClicked(metadata, index)}
                          isScrolling={isScrolling}
                        />
                      ))}
                    </Table>
                  )
                )}
              </TableContainer>

              <ButtonContainer>
                <Button
                  disabled={validatePaymentStatus !== ValidatePaymentStatus.VALID || selectedIndex === null || isProofModalOpen}
                  onClick={handleVerifyPaymentClick}
                >
                  {ctaButtonTitle}
                </Button>
              </ButtonContainer>
            </LoggedInContainer>
          )
      )
    }
    </Container>
  )
};

export default PaymentTable;