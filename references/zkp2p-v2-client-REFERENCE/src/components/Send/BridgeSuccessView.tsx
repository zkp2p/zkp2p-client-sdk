import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { Button } from '@components/common/Button';
import { Link as LinkIcon } from 'react-feather';
import { TokenData } from '@helpers/types/tokens';

interface BridgeSuccessViewProps {
  sourceAmount: string;
  destinationAmount: string;
  sourceToken: TokenData;
  destinationToken: TokenData;
  txHashes?: { txHash: string; chainId: number }[];
  bridgeTime?: number; // in seconds
  bridgeFee?: string;
  isInProgress?: boolean;
  onNewTransaction: () => void;
  blockscanUrls?: Record<number, string>;
  bridgeProvider?: 'RELAY' | 'BUNGEE';
}

export const BridgeSuccessView: React.FC<BridgeSuccessViewProps> = ({
  sourceAmount,
  destinationAmount,
  sourceToken,
  destinationToken,
  txHashes,
  bridgeTime = 0,
  bridgeFee,
  isInProgress = false,
  onNewTransaction,
  blockscanUrls = {},
  bridgeProvider,
}) => {
  // Track elapsed time while in progress
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Estimated times for bridge providers (hardcoded as requested)
  const estimatedTime = bridgeProvider === 'RELAY' ? 10 : 60; // 10s for Relay, 60s for Bungee

  useEffect(() => {
    if (isInProgress) {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      // Reset when complete
      setElapsedTime(0);
    }
  }, [isInProgress]);
  // Format bridge time
  const formatTime = (seconds: number, isEstimate: boolean = false) => {
    // For completed bridges, never show less than 2 seconds
    const displaySeconds = (!isInProgress && !isEstimate && seconds < 2) ? 2 : seconds;
    
    const hours = Math.floor(displaySeconds / 3600);
    const minutes = Math.floor((displaySeconds % 3600) / 60);
    const secs = displaySeconds % 60;
    
    // For estimates, use simpler format
    if (isEstimate) {
      if (hours > 0) {
        return `${hours}h`;
      } else if (minutes > 0) {
        return `${minutes}m`;
      } else {
        return `${secs}s`;
      }
    }
    
    // For actual elapsed/completed time, use detailed format
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    } else if (minutes > 0) {
      return `${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    } else {
      return `${secs.toString().padStart(2, '0')}s`;
    }
  };

  // Get explorer URL for transaction
  const getExplorerUrl = (txHash: string, chainId: number) => {
    const baseUrl = blockscanUrls[chainId];
    if (!baseUrl) return '';
    return `${baseUrl}/tx/${txHash}`;
  };

  // Get Relay.link tracking URL (uses source transaction hash)
  const getRelayTrackingUrl = () => {
    if (!txHashes || txHashes.length === 0) return null;
    // Find the source transaction (first transaction typically)
    const sourceTx = txHashes.find(tx => tx.chainId === sourceToken.chainId) || txHashes[0];
    return `https://relay.link/transaction/${sourceTx.txHash}`;
  };


  return (
    <Container>
      <SuccessIconContainer>
        <ChainLogoContainer>
          <ChainLogoLarge src={sourceToken.chainIcon} alt={sourceToken.chainName} />
        </ChainLogoContainer>
        <Connector />
        {!isInProgress ? (
          <CheckIcon>✓</CheckIcon>
        ) : (
          <LoadingSpinner />
        )}
        <Connector />
        <ChainLogoContainer>
          <ChainLogoLarge src={destinationToken.chainIcon} alt={destinationToken.chainName} />
        </ChainLogoContainer>
      </SuccessIconContainer>

      <TimeDisplay>{formatTime(isInProgress ? elapsedTime : Math.max(bridgeTime, 2))}</TimeDisplay>
      
      <ThemedText.SubHeader color={colors.textSecondary} style={{ fontWeight: 500 }}>
        {isInProgress ? 'Bridge in progress...' : 'Send successful!'}
      </ThemedText.SubHeader>

      <DetailsContainer>
        <DetailRow>
          <DetailLabel>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            {isInProgress ? 'Estimated time' : 'Bridge time'}
          </DetailLabel>
          <DetailValue success={!isInProgress}>
            {isInProgress ? (
              <>
                ~{formatTime(estimatedTime, true)}
                <span style={{ color: colors.textSecondary, fontSize: '12px', marginLeft: '8px' }}>
                  ({formatTime(elapsedTime)} elapsed)
                </span>
              </>
            ) : (
              <>
                {formatTime(Math.max(bridgeTime, 2))}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              </>
            )}
          </DetailValue>
        </DetailRow>

        <DetailRow>
          <DetailLabel>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            Amount sent
          </DetailLabel>
          <DetailValue>
            <AmountContainer>
              <TokenIconContainer>
                <TokenLogo src={sourceToken.icon} alt={sourceToken.ticker} />
                <ChainIconWrapper>
                  <ChainLogo src={sourceToken.chainIcon} alt={sourceToken.chainName} />
                </ChainIconWrapper>
              </TokenIconContainer>
              {Number(sourceAmount).toFixed(2)} {sourceToken.ticker}
            </AmountContainer>
          </DetailValue>
        </DetailRow>

        <DetailRow>
          <DetailLabel>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l-7 7 7 7"/>
            </svg>
            Amount received
          </DetailLabel>
          <DetailValue>
            <AmountContainer>
              <TokenIconContainer>
                <TokenLogo src={destinationToken.icon} alt={destinationToken.ticker} />
                <ChainIconWrapper>
                  <ChainLogo src={destinationToken.chainIcon} alt={destinationToken.chainName} />
                </ChainIconWrapper>
              </TokenIconContainer>
              {Number(destinationAmount).toFixed(3)} {destinationToken.ticker}
            </AmountContainer>
          </DetailValue>
        </DetailRow>

        {bridgeFee && (
          <DetailRow>
            <DetailLabel>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              Net fee
            </DetailLabel>
            <DetailValue>
              <FeeDisplay>
                ${bridgeFee}
              </FeeDisplay>
            </DetailValue>
          </DetailRow>
        )}

        {/* Source Transaction */}
        {txHashes && txHashes.length > 0 && (
          <>
            {txHashes.filter(tx => tx.chainId === sourceToken.chainId).map((tx, index) => (
              <DetailRow key={`source-${index}`}>
                <DetailLabel>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/>
                  </svg>
                  Source Transaction
                </DetailLabel>
                <ExplorerBadgesContainer>
                  {bridgeProvider === 'RELAY' && getRelayTrackingUrl() ? (
                    <ExplorerBadge
                      href={getRelayTrackingUrl()!}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View bridge progress on Relay.link"
                      $animate={true}
                    >
                      <BadgeChainName>Track on Relay.link</BadgeChainName>
                      <LinkIcon size={12} />
                    </ExplorerBadge>
                  ) : (
                    <ExplorerBadge
                      href={getExplorerUrl(tx.txHash, tx.chainId)}
                      target="_blank"
                      $animate={true}
                      rel="noopener noreferrer"
                      title={`View source transaction on ${sourceToken.chainName} explorer`}
                    >
                      <BadgeChainName>{sourceToken.chainName}</BadgeChainName>
                      <BadgeHash>{`0x${tx.txHash.slice(2, 5)}...${tx.txHash.slice(-3)}`}</BadgeHash>
                      <LinkIcon size={12} />
                    </ExplorerBadge>
                  )}
                </ExplorerBadgesContainer>
              </DetailRow>
            ))}
            
            {/* Destination Transaction */}
            {txHashes.filter(tx => tx.chainId === destinationToken.chainId).map((tx, index) => (
              <DetailRow key={`dest-${index}`}>
                <DetailLabel>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/>
                  </svg>
                  Destination Transaction
                </DetailLabel>
                <ExplorerBadgesContainer>
                  <ExplorerBadge
                    href={getExplorerUrl(tx.txHash, tx.chainId)}
                    target="_blank"
                    $animate={true}
                    rel="noopener noreferrer"
                    title={`View destination transaction on ${destinationToken.chainName} explorer`}
                  >
                    <BadgeChainName>{destinationToken.chainName}</BadgeChainName>
                    <BadgeHash>{`0x${tx.txHash.slice(2, 5)}...${tx.txHash.slice(-3)}`}</BadgeHash>
                    <LinkIcon size={12} />
                  </ExplorerBadge>
                </ExplorerBadgesContainer>
              </DetailRow>
            ))}
            
            {/* Show waiting for destination if only source exists */}
            {isInProgress && 
             txHashes.some(tx => tx.chainId === sourceToken.chainId) &&
             !txHashes.some(tx => tx.chainId === destinationToken.chainId) && (
              <DetailRow>
                <DetailLabel>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/>
                  </svg>
                  Destination Transaction
                </DetailLabel>
                <DetailValue>
                  <span style={{ color: colors.textSecondary, fontSize: '13px' }}>
                    Waiting for confirmation...
                  </span>
                </DetailValue>
              </DetailRow>
            )}
          </>
        )}
      </DetailsContainer>

      <ActionButtonsContainer>
        <Button
          fullWidth
          onClick={onNewTransaction}
          disabled={isInProgress}
        >
          {isInProgress ? 'Bridge in progress...' : 'Initiate new transaction'}
        </Button>
      </ActionButtonsContainer>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SuccessIconContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  margin: 2.5rem 0;
  position: relative;
`;

const ChainLogoContainer = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${colors.backgroundSecondary} 0%, ${colors.container} 100%);
  border: 2px solid ${colors.defaultBorderColor};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  position: relative;
  z-index: 2;
  
  &::after {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
    z-index: -1;
  }
`;

const ChainLogoLarge = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
`;

const CheckIcon = styled.div`
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(76, 217, 100, 0.3) 0%, rgba(76, 217, 100, 0.1) 100%);
  border: 3px solid #4CD964;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: #4CD964;
  font-weight: bold;
  position: relative;
  z-index: 3;
`;

const LoadingSpinner = styled.div`
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 3px solid ${colors.defaultBorderColor};
  border-top: 3px solid ${colors.textSecondary};
  animation: spin 1s linear infinite;
  position: relative;
  z-index: 3;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Connector = styled.div`
  width: 45px;
  height: 3px;
  background: linear-gradient(90deg, ${colors.defaultBorderColor} 0%, #4CD964 50%, ${colors.defaultBorderColor} 100%);
  position: relative;
  z-index: 1;
`;

const TimeDisplay = styled.div`
  font-size: 48px;
  font-weight: 300;
  color: #4CD964;
  letter-spacing: 2px;
`;

const DetailsContainer = styled.div`
  background: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 1.5rem;
  width: 400px;
  max-width: 100%;
  box-sizing: border-box;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid ${colors.defaultBorderColor}20;
    padding-bottom: 0.5rem;
    margin-bottom: 0.5rem;
  }
`;

const DetailLabel = styled.span`
  color: ${colors.textSecondary};
  font-size: 13px;
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 6px;
  
  svg {
    opacity: 0.7;
  }
`;

const DetailValue = styled.span<{ success?: boolean }>`
  color: ${props => props.success ? '#4CD964' : colors.darkText};
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AmountContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TokenIconContainer = styled.div`
  position: relative;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
`;

const TokenLogo = styled.img`
  width: 16px;
  height: 16px;
  border-radius: 12px;
`;

const ChainIconWrapper = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #1E2230;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #1E2230;
`;

const ChainLogo = styled.img`
  width: 8px;
  height: 8px;
  border-radius: 50%;
`;

const ExplorerBadgesContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
  max-width: 60%;
`;

const ExplorerBadge = styled.a<{ $animate?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${colors.backgroundSecondary};
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px;
  padding: 4px 8px;
  text-decoration: none;
  transition: all 0.2s ease;
  animation: ${props => props.$animate ? 'slideIn 0.3s ease-out' : 'none'};
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  &:hover {
    background: ${colors.container};
    border-color: ${colors.textSecondary};
    transform: translateY(-1px);
    
    svg {
      opacity: 1;
    }
  }
  
  svg {
    stroke: ${colors.textSecondary};
    opacity: 0.6;
    transition: opacity 0.2s ease;
  }
`;

const BadgeChainName = styled.span`
  color: ${colors.textPrimary};
  font-size: 12px;
  font-weight: 500;
`;

const BadgeHash = styled.span`
  color: ${colors.textSecondary};
  font-size: 11px;
  font-family: monospace;
`;

const ActionButtonsContainer = styled.div`
  width: 100%;
  margin-top: 2rem;
`;

const FeeDisplay = styled.span`
  color: ${colors.darkText};
  font-size: 14px;
  font-weight: 600;
`;

export default BridgeSuccessView;