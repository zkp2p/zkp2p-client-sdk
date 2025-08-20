import React from 'react';
import styled from 'styled-components';
import { AlertTriangle, RefreshCw, Clock, Info } from 'react-feather';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { BridgeErrorType } from '@helpers/bridgeErrors';

interface BridgeErrorDetails {
  type: BridgeErrorType;
  message: string;
  isRetryable: boolean;
}

interface BridgeErrorDisplayProps {
  errorDetails: BridgeErrorDetails;
  retryCount?: number;
  maxRetries?: number;
  onManualRetry?: () => void;
  isRetrying?: boolean;
  estimatedRetryTime?: number;
}

const ErrorContainer = styled.div<{ severity: 'low' | 'medium' | 'high' }>`
  background-color: ${({ severity }) => {
    switch (severity) {
      case 'high': return '#FEF2F2';
      case 'medium': return '#FEF3C7';
      case 'low': return '#F0F9FF';
      default: return '#F3F4F6';
    }
  }};
  border: 1px solid ${({ severity }) => {
    switch (severity) {
      case 'high': return '#FECACA';
      case 'medium': return '#FDE68A';
      case 'low': return '#BFDBFE';
      default: return '#D1D5DB';
    }
  }};
  border-radius: 8px;
  padding: 16px;
  margin: 12px 0;
`;

const ErrorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const ErrorIcon = styled.div<{ severity: 'low' | 'medium' | 'high' }>`
  color: ${({ severity }) => {
    switch (severity) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#3B82F6';
      default: return '#6B7280';
    }
  }};
  display: flex;
  align-items: center;
`;

const ErrorTitle = styled(ThemedText.SubHeader)`
  color: ${colors.textPrimary};
  font-weight: 600;
  margin: 0;
`;

const ErrorDescription = styled(ThemedText.BodyPrimary)`
  color: ${colors.textSecondary};
  margin-bottom: 16px;
  line-height: 1.5;
`;

const RecoverySection = styled.div`
  margin-top: 16px;
`;

const RecoveryTitle = styled(ThemedText.LabelSmall)`
  color: ${colors.textPrimary};
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const RecoveryList = styled.ul`
  margin: 0;
  padding-left: 18px;
  color: ${colors.textSecondary};
`;

const RecoveryItem = styled.li`
  margin-bottom: 4px;
  font-size: 14px;
  line-height: 1.4;
`;

const RetrySection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${colors.defaultBorderColor};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const RetryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${colors.textSecondary};
  font-size: 14px;
`;

const RetryButton = styled.button<{ disabled: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: ${({ disabled }) => disabled ? colors.backgroundSecondary : colors.buttonDefault};
  color: ${({ disabled }) => disabled ? colors.textSecondary : 'white'};
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ disabled }) => disabled ? colors.backgroundSecondary : colors.buttonHover};
  }

  ${({ disabled }) => disabled && `
    opacity: 0.6;
  `}
`;

const getErrorSeverity = (errorType: BridgeErrorType): 'low' | 'medium' | 'high' => {
  switch (errorType) {
    case BridgeErrorType.INSUFFICIENT_BALANCE:
    case BridgeErrorType.NO_ROUTES:
    case BridgeErrorType.USER_REJECTED:
      return 'high';
    case BridgeErrorType.NETWORK_ERROR:
      return 'medium';
    case BridgeErrorType.UNKNOWN_ERROR:
    default:
      return 'medium';
  }
};

const getErrorIcon = (errorType: BridgeErrorType, severity: 'low' | 'medium' | 'high') => {
  if (errorType === BridgeErrorType.NETWORK_ERROR) {
    return <Clock size={20} />;
  }
  if (severity === 'low') {
    return <Info size={20} />;
  }
  return <AlertTriangle size={20} />;
};

export const BridgeErrorDisplay: React.FC<BridgeErrorDisplayProps> = ({
  errorDetails,
  retryCount = 0,
  maxRetries = 10,
  onManualRetry,
  isRetrying = false,
  estimatedRetryTime,
}) => {
  const severity = getErrorSeverity(errorDetails.type);
  const icon = getErrorIcon(errorDetails.type, severity);
  
  // Determine if manual retry should be enabled
  const canManualRetry = errorDetails.isRetryable && 
                        retryCount < maxRetries && 
                        onManualRetry && 
                        !isRetrying;

  const getRetryStatusText = () => {
    if (isRetrying) {
      return estimatedRetryTime ? 
        `Retrying in ${Math.ceil(estimatedRetryTime / 1000)}s...` : 
        'Retrying...';
    }
    if (retryCount >= maxRetries) {
      return `Max retries reached (${maxRetries})`;
    }
    if (retryCount > 0) {
      return `Attempt ${retryCount + 1} of ${maxRetries + 1}`;
    }
    return null;
  };

  return (
    <ErrorContainer severity={severity}>
      <ErrorHeader>
        <ErrorIcon severity={severity}>
          {icon}
        </ErrorIcon>
        <ErrorTitle>{errorDetails.message}</ErrorTitle>
      </ErrorHeader>

      <ErrorDescription>
        {getBridgeErrorDescription(errorDetails.type)}
      </ErrorDescription>


      {errorDetails.isRetryable && (
        <RetrySection>
          <RetryInfo>
            {getRetryStatusText() && (
              <>
                <Clock size={16} />
                {getRetryStatusText()}
              </>
            )}
          </RetryInfo>
          
          {canManualRetry && (
            <RetryButton 
              disabled={!canManualRetry}
              onClick={onManualRetry}
            >
              <RefreshCw size={16} />
              Try Again
            </RetryButton>
          )}
        </RetrySection>
      )}
    </ErrorContainer>
  );
};

// Helper function to get detailed error descriptions
const getBridgeErrorDescription = (errorType: BridgeErrorType): string => {
  switch (errorType) {
    case BridgeErrorType.INSUFFICIENT_BALANCE:
      return 'Your wallet does not have enough tokens to complete this transaction.';
    case BridgeErrorType.NO_ROUTES:
      return 'No route found for this token pair. The token may not be supported on the destination chain.';
    case BridgeErrorType.NETWORK_ERROR:
      return 'A network error occurred. Please check your connection and try again.';
    case BridgeErrorType.USER_REJECTED:
      return 'You cancelled the transaction in your wallet.';
    case BridgeErrorType.UNKNOWN_ERROR:
    default:
      return 'An error occurred during the bridge process. Please try again.';
  }
};

export default BridgeErrorDisplay;