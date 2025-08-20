import React, { useEffect, useState, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { ArrowLeft } from 'react-feather';
import QRCode from 'react-qr-code';
import Link from '@mui/material/Link';

import { Button } from '@components/common/Button';
import { Details } from '@components/Swap/SendPayment/Details';
import { PaymentMethodSelector } from '@components/Swap/SendPayment/PaymentMethodSelector';
import { Breadcrumb, BreadcrumbStep } from '@components/common/Breadcrumb';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { paymentPlatformInfo } from '@helpers/types';
import { parseIntentData, ParsedIntentData } from '@helpers/intentHelper';
import { WarningTextBox } from '@components/common/WarningTextBox';
import Spinner from '@components/common/Spinner';

import useAccount from '@hooks/contexts/useAccount';
import useBackend from '@hooks/contexts/useBackend';
import useOnRamperIntents from '@hooks/contexts/useOnRamperIntents';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import useMediaQuery from '@hooks/useMediaQuery';
import { AccessoryButton } from '@components/common/AccessoryButton';
import useExtensionProxyProofs from '@hooks/contexts/useExtensionProxyProofs';
import { PaymentPlatformDefaultPaymentMode } from '@helpers/types/paymentPlatform';
import { isVersionOutdated } from '@helpers/sidebar';
import useQuoteStorage from '@hooks/useQuoteStorage';
import { QuoteData } from '@hooks/useQuoteStorage';
import { usdcInfo } from '@helpers/types/tokens';
import TallySupportButton from '@components/common/TallySupportButton';

interface ViewConfig {
  showQRCodePayment: boolean;
  showSendPaymentOnDesktopOption: boolean;
  showTroubleScanningQRCodeLink: boolean;
  expandDetails: boolean;
  showSendPaymentButton: boolean;
  isConfirmationButtonAccessory: boolean;
}

interface SendPaymentFormProps {
  onBackClick: () => void
  onCompleteClick: () => void
}

// Create an extended interface that includes our additional data
interface EnhancedIntentData extends ParsedIntentData {
  // Additional fields from localStorage quotes
  token: string;
  formattedTokenAmount?: string;
  tokenAmountInUsd?: string;
  tokenRecipientAddress: string;
}

export const SendPaymentForm: React.FC<SendPaymentFormProps> = ({
  onBackClick,
  onCompleteClick,
}) => {

  /*
   * Context
   */

  const currentDeviceSize = useMediaQuery();
  const isMobile = currentDeviceSize === 'mobile';

  const { rawPayeeDetails, fetchPayeeDetails, isFetchingRawPayeeDetails } = useBackend();
  const { loggedInEthereumAddress } = useAccount();
  const { currentIntentView, currentIntentHash, isLoadingIntentView, refetchIntentView } = useOnRamperIntents();
  const { addressToPlatform } = useSmartContracts();
  const { isSidebarInstalled, sideBarVersion } = useExtensionProxyProofs();
  const { getQuoteData, updateQuoteDataPaymentMethod } = useQuoteStorage();

  /*
   * State
   */

  const [intentData, setIntentData] = useState<EnhancedIntentData | null>(null);
  const [storedQuoteData, setStoredQuoteData] = useState<QuoteData | null>(null);
  const [viewConfig, setViewConfig] = useState<ViewConfig>({
    showQRCodePayment: false,
    showSendPaymentOnDesktopOption: false,
    showTroubleScanningQRCodeLink: false,
    expandDetails: false,
    showSendPaymentButton: false,
    isConfirmationButtonAccessory: false,
  });
  const [link, setLink] = useState<string | null>(null);
  const [troubleScanningQRCodeLink, setTroubleScanningQRCodeLink] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [paymentWarning, setPaymentWarning] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<string | null>(null);
  const [isSidebarNeedsUpdate, setIsSidebarNeedsUpdate] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number>(0);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Ref to track if initial data loading has been completed to prevent re-initialization
  const hasInitializedFromStorageRef = useRef(false);
  
  /*
   * Effects
   */

  // Reset initialization flag when address changes
  useEffect(() => {
    hasInitializedFromStorageRef.current = false;
  }, [loggedInEthereumAddress]);

  // Load stored quote data from localStorage and initialize provisional intent data
  useEffect(() => {
    // Only run this initialization once per address change
    if (loggedInEthereumAddress && !hasInitializedFromStorageRef.current) {
      const data = getQuoteData(loggedInEthereumAddress);
      if (data) {
        console.log('Loaded quote data from localStorage:', data);
        setStoredQuoteData(data);

        // Update the payment method to the stored quote data
        if (data.paymentMethod) {
          setSelectedPaymentMethod(data.paymentMethod);
        }

        // Create provisional intent data from localStorage while waiting for blockchain
        // This provides immediate UI feedback while blockchain data loads
        const provisionalData: EnhancedIntentData = {
          // Required ParsedIntentData fields
          depositId: '0', // Will be filled from blockchain
          paymentPlatform: data.paymentPlatform,
          depositorOnchainPayeeDetails: '', // Will be filled from blockchain
          receiveToken: usdcInfo.tokenId,
          amountTokenToReceive: data.usdcAmount,
          sendCurrency: data.fiatCurrency,
          amountFiatToSend: data.fiatAmount,
          expirationTimestamp: 'Loading...', // Will be filled from blockchain
          intentTimestamp: 'Loading...', // Will be filled from blockchain
          recipientAddress: data.recipientAddress,
          // Enhanced fields
          token: data.token,
          formattedTokenAmount: data.tokenAmount,
          tokenAmountInUsd: data.outputTokenAmountInUsd,
          tokenRecipientAddress: data.recipientAddress
        };
        setIntentData(provisionalData);

        // Set up view config based on provisional data
        const platform = paymentPlatformInfo[data.paymentPlatform];
        const defaultMethod = platform.paymentMethods[0];
        const defaultPaymentMode = defaultMethod.sendConfig.defaultPaymentMode;
        const supportsSendingPaymentOnWeb = defaultMethod.sendConfig.supportsSendingPaymentOnWeb;
        const showTroubleScanningQRCodeLink = defaultMethod.sendConfig.showTroubleScanningQRCodeLink;

        const isDefaultPaymentModeQRCode = defaultPaymentMode === PaymentPlatformDefaultPaymentMode.QR_CODE;
        const isDefaultPaymentModeDesktop = defaultPaymentMode === PaymentPlatformDefaultPaymentMode.WEB_PAYMENT;
        const isDesktop = !isMobile;

        if (isDefaultPaymentModeQRCode && isDesktop) {
          setViewConfig({
            showQRCodePayment: true,
            showSendPaymentOnDesktopOption: supportsSendingPaymentOnWeb,
            showTroubleScanningQRCodeLink: showTroubleScanningQRCodeLink,
            expandDetails: false,
            showSendPaymentButton: false,
            isConfirmationButtonAccessory: false,
          });
        } else if (isDefaultPaymentModeDesktop && isDesktop) {
          setViewConfig({
            showQRCodePayment: false,
            showSendPaymentOnDesktopOption: false,
            showTroubleScanningQRCodeLink: showTroubleScanningQRCodeLink,
            expandDetails: true,
            showSendPaymentButton: true,
            isConfirmationButtonAccessory: true,
          });
        } else if (isMobile) {
          setViewConfig({
            showQRCodePayment: false,
            showSendPaymentOnDesktopOption: false,
            showTroubleScanningQRCodeLink: showTroubleScanningQRCodeLink,
            expandDetails: false,
            showSendPaymentButton: true,
            isConfirmationButtonAccessory: true,
          });
        }

        // Mark as initialized to prevent re-running
        hasInitializedFromStorageRef.current = true;
      }
    }
    // Using the ref ensures initialization only happens once per address change.
  }, [loggedInEthereumAddress, getQuoteData, isMobile]);

  // Add timeout for loading intent view
  useEffect(() => {
    if (isLoadingIntentView) {
      const timeout = setTimeout(() => {
        if (!currentIntentView) {
          setLoadingError('Failed to load order details. Please try refreshing the page.');
        }
      }, 30000); // 30 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoadingIntentView, currentIntentView]);

  // Refetch intent view if it's missing but we have a logged-in address
  useEffect(() => {
    // Only refetch if:
    // 1. We don't have currentIntentView (it's null)
    // 2. We have a logged-in address
    // 3. We're not already loading
    // 4. There's no loading error
    if (!currentIntentView && loggedInEthereumAddress && !isLoadingIntentView && !loadingError) {
      console.log('Intent view missing, refetching...');
      refetchIntentView();
    }
  }, [currentIntentView, loggedInEthereumAddress, isLoadingIntentView, loadingError, refetchIntentView]);

  useEffect(() => {
    if (currentIntentView) {
      const parsedData = parseIntentData(currentIntentView, addressToPlatform);
      
      // Create enhanced data object with additional swap data 
      const enhancedData: EnhancedIntentData = {
        ...parsedData,
        token: storedQuoteData?.token || usdcInfo.tokenId,
        formattedTokenAmount: storedQuoteData?.tokenAmount,
        tokenAmountInUsd: storedQuoteData?.outputTokenAmountInUsd,
        tokenRecipientAddress: storedQuoteData?.recipientAddress || ''
      };
    
      setIntentData(enhancedData);
      
      // Get the default payment config from the platform
      // If multiple payment methods, use the first one's config
      const platform = paymentPlatformInfo[enhancedData.paymentPlatform];
      const defaultMethod = platform.paymentMethods[0];
      const defaultPaymentMode = defaultMethod.sendConfig.defaultPaymentMode;
      const supportsSendingPaymentOnWeb = defaultMethod.sendConfig.supportsSendingPaymentOnWeb;
      const showTroubleScanningQRCodeLink = defaultMethod.sendConfig.showTroubleScanningQRCodeLink;
      const supportsAppclip = defaultMethod.verifyConfig.supportsAppclip;

      const isDefaultPaymentModeQRCode = defaultPaymentMode === PaymentPlatformDefaultPaymentMode.QR_CODE;
      const isDefaultPaymentModeDesktop = defaultPaymentMode === PaymentPlatformDefaultPaymentMode.WEB_PAYMENT;
      const isDesktop = !isMobile;

      if (
        isDefaultPaymentModeQRCode
        && isDesktop
      ) {
        setViewConfig({
          showQRCodePayment: true,
          showSendPaymentOnDesktopOption: supportsSendingPaymentOnWeb,
          showTroubleScanningQRCodeLink: showTroubleScanningQRCodeLink,
          expandDetails: false,
          showSendPaymentButton: false,
          isConfirmationButtonAccessory: false,
        });
      } else if (
        isDefaultPaymentModeDesktop
        && isDesktop
      ) {
        setViewConfig({
          showQRCodePayment: false,
          showSendPaymentOnDesktopOption: false,
          showTroubleScanningQRCodeLink: showTroubleScanningQRCodeLink,
          expandDetails: true,
          showSendPaymentButton: true,
          isConfirmationButtonAccessory: true,
        });
      } else if (isMobile) {
        setViewConfig({
          showQRCodePayment: false,
          showSendPaymentOnDesktopOption: false,
          showTroubleScanningQRCodeLink: showTroubleScanningQRCodeLink,
          expandDetails: false,
          showSendPaymentButton: true,
          isConfirmationButtonAccessory: true,
        });
      }
    }
  }, [currentIntentView, addressToPlatform, storedQuoteData, isMobile]);

  useEffect(() => {
    if (isSidebarInstalled && sideBarVersion && intentData) {
      const needsUpdate = isVersionOutdated(sideBarVersion, selectedPaymentMethod, intentData.paymentPlatform);
      setIsSidebarNeedsUpdate(needsUpdate);
    }
  }, [isSidebarInstalled, sideBarVersion, intentData, selectedPaymentMethod]);

  useEffect(() => {
    if (intentData && !rawPayeeDetails && !isFetchingRawPayeeDetails) {
      fetchPayeeDetails(
        intentData.depositorOnchainPayeeDetails, 
        intentData.paymentPlatform
      );
    }
  }, [intentData?.depositorOnchainPayeeDetails, intentData?.paymentPlatform, fetchPayeeDetails, rawPayeeDetails, isFetchingRawPayeeDetails]);

  // Update links and warning information when payment method changes
  useEffect(() => {
    if (intentData && rawPayeeDetails) {
      const platform = paymentPlatformInfo[intentData.paymentPlatform];
      const paymentMethod = platform.paymentMethods[selectedPaymentMethod];
      const { sendCurrency, amountFiatToSend } = intentData;

      // Use the send config of the selected payment method
      const formattedTroubleScanningQRCodeLink = paymentMethod.sendConfig.troubleScanningQRCodeLink(
        rawPayeeDetails, sendCurrency, amountFiatToSend
      );
      const formattedLink = paymentMethod.sendConfig.getFormattedSendLink(
        rawPayeeDetails, sendCurrency, amountFiatToSend
      );
      
      setTroubleScanningQRCodeLink(formattedTroubleScanningQRCodeLink);
      setLink(formattedLink);
      
      // Set payment warning for the selected method
      if (paymentMethod.sendConfig.sendPaymentWarning) {
        const warning = paymentMethod.sendConfig.sendPaymentWarning(sendCurrency, amountFiatToSend);
        setPaymentWarning(warning);
      } else {
        setPaymentWarning(null);
      }
      
      // Set payment info for the selected method if available
      if (paymentMethod.sendConfig.sendPaymentInfo) {
        const info = paymentMethod.sendConfig.sendPaymentInfo(sendCurrency, amountFiatToSend);
        setPaymentInfo(info);
      } else {
        setPaymentInfo(null);
      }
    }
  }, [intentData, rawPayeeDetails, selectedPaymentMethod]);

  useEffect(() => {
    if (loggedInEthereumAddress && intentData) {
      const platform = paymentPlatformInfo[intentData.paymentPlatform];
      if (platform.hasMultiplePaymentMethods) {
        updateQuoteDataPaymentMethod(loggedInEthereumAddress, selectedPaymentMethod);
      }
    }
  }, [intentData, selectedPaymentMethod, loggedInEthereumAddress, updateQuoteDataPaymentMethod]);

  /*
   * Helpers
   */

  const getTitle = () => {
    return 'Complete Payment'
  }

  const renderQRCode = () => {
    if (!intentData || !link || !rawPayeeDetails || isLoadingPayeeDetails) {
      return (
        <QRContainer $loading={true}>
          <QRSkeletonContent>
            <ThemedText.BodySmall style={{ color: colors.grayText }}>
              Loading payment QR code...
            </ThemedText.BodySmall>
          </QRSkeletonContent>
        </QRContainer>
      );
    }

    const platform = paymentPlatformInfo[intentData.paymentPlatform];
    let useCustomQRCode = platform.paymentMethods[selectedPaymentMethod].sendConfig.useCustomQRCode || false;

    if (useCustomQRCode || imageError) {
      return (
        <QRContainer $loading={false}>
          <QRCode
            value={link}
            size={162}
          />
        </QRContainer>
      );
    }

    return (
      <QRContainer $loading={false}>
        <QRImage
          src={link}
          alt={`${paymentPlatformInfo[intentData.paymentPlatform].platformName} QR Code`}
          onError={() => {
            console.error('Failed to load QR code image:', link);
            setImageError(true);
          }}
        />
      </QRContainer>
    );
  };

  const getPayeeDetailPrefix = () => {
    if (!intentData) return '';
    
    const platform = paymentPlatformInfo[intentData.paymentPlatform];
    
    if (platform.hasMultiplePaymentMethods) {
      const method = platform.paymentMethods[selectedPaymentMethod];
      return method?.sendConfig.payeeDetailPrefix || '';
    } else if (platform.paymentMethods.length > 0) {
      return platform.paymentMethods[0].sendConfig.payeeDetailPrefix || '';
    }
    
    return '';
  };

  /*
   * Helpers
   */

  const isLoadingPayeeDetails = isFetchingRawPayeeDetails || (!rawPayeeDetails && intentData !== null);
  
  // Check if we have enough data to show the UI structure
  const hasBasicData = storedQuoteData !== null;
  
  // Check if blockchain data is fully ready
  const isBlockchainDataReady = !isLoadingIntentView && intentData !== null && !loadingError;
  
  // Check if all data is ready for full functionality
  const isFullyReady = isBlockchainDataReady && !isLoadingPayeeDetails;

  /*
   * Component
   */

  return (
    <Container>
      <TitleContainer>
        <StyledRowBetween>
          <div style={{ flex: 0.25 }}>
            <button
              onClick={onBackClick}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <StyledArrowLeft/>
            </button>
          </div>

          <ThemedText.HeadlineSmall style={{ flex: '1', margin: 'auto', textAlign: 'center' }}>
            {getTitle()}
          </ThemedText.HeadlineSmall>

          <div style={{ flex: 0.25 }}/>
        </StyledRowBetween>

        <Breadcrumb
          currentStep={BreadcrumbStep.PAYMENT}
          showExtensionStep={!isSidebarInstalled || isSidebarNeedsUpdate}
        />
      </TitleContainer>

      {/* Show error state if there's a loading error */}
      {loadingError ? (
        <LoadingStateContainer>
          <ThemedText.BodyPrimary style={{ color: colors.buttonDisabled, textAlign: 'center' }}>
            {loadingError}
          </ThemedText.BodyPrimary>
          <ButtonWrapper>
            <Button
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </ButtonWrapper>
        </LoadingStateContainer>
      ) : !hasBasicData && isLoadingIntentView ? (
        /* Only show full loading state if we don't have localStorage data */
        <LoadingStateContainer>
          <Spinner size={40} />
          <ThemedText.BodySecondary style={{ marginTop: '1rem' }}>
            Loading order details...
          </ThemedText.BodySecondary>
        </LoadingStateContainer>
      ) : (
        <>
          {intentData && paymentPlatformInfo[intentData.paymentPlatform].hasMultiplePaymentMethods && (
            <PaymentMethodSelector 
              paymentPlatform={intentData.paymentPlatform}
              selectedPaymentMethod={selectedPaymentMethod}
              setSelectedPaymentMethod={setSelectedPaymentMethod}
            />
          )}

          {viewConfig && viewConfig.showQRCodePayment && (
        <QRAndLabelContainer>
          
          {renderQRCode()}
        
          {intentData?.paymentPlatform && (
            <QRLabel>
              {troubleScanningQRCodeLink && !isLoadingPayeeDetails ? (
                <Link href={troubleScanningQRCodeLink || ''} target='_blank'>  
                  {viewConfig.showSendPaymentOnDesktopOption ? `Pay on Desktop ↗` : 
                  viewConfig.showTroubleScanningQRCodeLink ? `Trouble Scanning QR? ↗` : ''}
                </Link>
              ) : viewConfig.showSendPaymentOnDesktopOption || viewConfig.showTroubleScanningQRCodeLink ? (
                <ThemedText.BodySmall style={{ color: colors.grayText }}>
                  Loading payment link...
                </ThemedText.BodySmall>
              ) : null}
            </QRLabel>
          )}
        </QRAndLabelContainer>
      )}
        
      {intentData && ( 
        <Details
          intentData={intentData}
          selectedPaymentMethod={selectedPaymentMethod}
          initOpen={viewConfig.expandDetails}
          payeeDetailPrefix={getPayeeDetailPrefix()}
        />
      )}

      {paymentWarning && (
        <WarningContainer>
          <WarningTextBox 
            text={paymentWarning} 
            type='warning'
            size="s"
            fontSize="16px"
          />
        </WarningContainer>
      )}

      {paymentInfo && (
        <WarningContainer>
          <WarningTextBox 
            text={paymentInfo} 
            type='info'
            size="s"
            fontSize="16px"
          />
        </WarningContainer>
      )}

      {/* Show loading indicator when waiting for blockchain data */}
      {!isBlockchainDataReady && hasBasicData && (
        <LoadingIndicator>
          <Spinner size={16} />
          <ThemedText.BodySmall style={{ color: colors.grayText }}>
            Verifying order details...
          </ThemedText.BodySmall>
        </LoadingIndicator>
      )}

      <ButtonContainer>
        {viewConfig && viewConfig.showSendPaymentButton && (
          <Button
            fullWidth
            height={48}
            onClick={() => {
              window.open(troubleScanningQRCodeLink || '', '_blank');
            }}
            disabled={!isFullyReady || !troubleScanningQRCodeLink}
          >
            Send Payment
          </Button>
        )}
      
        {(viewConfig && !viewConfig.isConfirmationButtonAccessory) ? (
          <Button
            fullWidth
            height={48}
            onClick={onCompleteClick}
            disabled={!isBlockchainDataReady}
          >
            I have completed payment
          </Button>
        ) : (
          <AccessoryButton
            fullWidth
            height={48}
            borderRadius={24}
            textAlign='center'
            title="I have completed payment"
            onClick={onCompleteClick}
            disabled={!isBlockchainDataReady}
          />
        )}
      </ButtonContainer>

      <TallySupportButton
        page="sendPayment"
        currentIntentHash={currentIntentHash || ''}
      />
        </>
      )}
    </Container>
  );
};

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;


const Container = styled.div`
  margin: auto;
  padding: 1.5rem;
  background-color: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px;
  display: flex;
  gap: 1.5rem;  
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  
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

const TitleContainer = styled.div`
  padding: 0;
  width: 100%;
`;

const QRAndLabelContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const QRContainer = styled.div<{ $loading: boolean }>`
  padding: 1.25rem 1.25rem 1rem 1.25rem;
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 16px;
  background-color: ${colors.white};
  ${props => props.$loading && css`
    background-color: ${colors.defaultBorderColor};
    animation: ${pulse} 1.5s ease-in-out infinite;
  `}
  width: 162px;
  height: 162px;
  display: flex;
  align-items: center;
  justify-content: center;
`;


const QRImage = styled.img`
  width: 192px;
  height: 192px;
`;


const StyledArrowLeft = styled(ArrowLeft)`
  color: ${colors.white};
`;

const VerticalDivider = styled.div`
  height: 24px;
  width: 1px;
  background-color: ${colors.defaultBorderColor};
  margin: 0 auto;
`;


const QRLabel = styled.div`
  font-size: 14px;
  text-align: center;
  padding-top: 10px;
  line-height: 1.5;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;

  @media (max-width: 600px) {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
`;


const WarningContainer = styled.div`
  width: 100%;
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

const LoadingRectangle = styled.div`
  width: 100%;
  height: 24px;
  background: ${colors.defaultBorderColor};
  border-radius: 4px;
  animation: pulse 1.5s infinite;
  align-self: center;    

  @keyframes pulse {
    0% {
      opacity: 0.6;
    }
    50% {
      opacity: 0.3;
    }
    100% {
      opacity: 0.6;
    }
  }
`;

const LoadingStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  width: 100%;
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  width: 100%;
`;

const QRSkeletonContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
`;

const ButtonWrapper = styled.div`
  margin-top: 1rem;
`;