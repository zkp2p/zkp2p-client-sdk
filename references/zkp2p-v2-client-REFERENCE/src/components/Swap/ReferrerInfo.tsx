import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { Trash2 } from 'react-feather';

import useQuery from '@hooks/useQuery';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import { tokenUnitsToReadable } from '@helpers/units';
import { usdcInfo, isUsdcToken } from '@helpers/types/tokens';
import { getRecipientAddressDisplay } from '@helpers/recipientAddress';
import useTokenData from '@hooks/contexts/useTokenData';
import { RedirectCloseModal } from '@components/modals/RedirectCloseModal';

interface ReferrerInfoProps {
  className?: string;
  onCloseClick: () => void;
}

export const ReferrerInfo: React.FC<ReferrerInfoProps> = ({ 
  className,
  onCloseClick
}) => {
  
  ReferrerInfo.displayName = 'ReferrerInfo';

  /*
   * Hooks
   */

  const { queryParams } = useQuery();
  const { blockscanUrl } = useSmartContracts();
  const { tokenInfo, isLoading: isTokenDataLoading, refetchToken } = useTokenData();

  /*
   * State
   */
  const { 
    REFERRER: referrer, 
    REFERRER_LOGO: referrerLogo, 
    REFERRER_TO_TOKEN: toTokenRaw, 
    REFERRER_AMOUNT_USDC: amountUsdc, 
    REFERRER_RECIPIENT_ADDRESS: recipientAddress 
  } = queryParams;
  
  // Normalize token to lowercase for consistent lookups
  const toToken = toTokenRaw ? (toTokenRaw as string).toLowerCase() : toTokenRaw;
  
  const [isSpecificTokenLoading, setIsSpecificTokenLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  
  // Reset hasAttemptedFetch when token changes
  useEffect(() => {
    setHasAttemptedFetch(false);
  }, [toToken]);

  /*
   * Effects
   */

  // Effect to ensure the specific token is loaded if needed
  useEffect(() => {
    const loadSpecificToken = async () => {
      if (!toToken || isTokenDataLoading || hasAttemptedFetch) return;
      
      if (isUsdcToken(toToken)) {
        return;
      }
      
      // Check if we already have this token's info
      if (!tokenInfo[toToken]) {
        console.log('Token info not found, fetching specific token:', toToken);
        setIsSpecificTokenLoading(true);
        setHasAttemptedFetch(true); // Mark that we've attempted to fetch
        try {
          const fetchedToken = await refetchToken(toToken);
          if (!fetchedToken) {
            console.log('Token not found in API:', toToken);
          }
        } catch (error) {
          console.error('Failed to fetch token info:', error);
        } finally {
          setIsSpecificTokenLoading(false);
        }
      }
    };

    loadSpecificToken();
  }, [
    toToken, 
    tokenInfo, 
    isTokenDataLoading, 
    refetchToken,
    isUsdcToken,
    hasAttemptedFetch
  ]);

  /*
   * Handlers
   */
  const handleCloseButtonClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmClose = () => {
    setShowConfirmModal(false);
    onCloseClick();
  };

  const handleCancelClose = () => {
    setShowConfirmModal(false);
  };

  if (!referrer) return null;
  
  // Return a loading state while token data is being fetched
  if ((isTokenDataLoading || isSpecificTokenLoading) && toToken) {
    return (
      <Container className={className}>
        <ContentWrapper>
          <ThemedText.SubHeader>
            Loading request information...
          </ThemedText.SubHeader>
        </ContentWrapper>
      </Container>
    );
  }

  /*
   * Helpers
   */

  const getRequestLabel = () => {
    let tokenLabel = '';
    let tokenChain = '';

    // Set token info first
    if (amountUsdc) {
      tokenLabel = `${tokenUnitsToReadable(amountUsdc, 6, 2)} USDC`;
      tokenChain = 'Base';
    } else if (toToken && isUsdcToken(toToken as string)) {
      // Handle USDC token specifically
      tokenLabel = 'USDC';
      tokenChain = 'Base';
    } else if (toToken && tokenInfo[toToken as string]) {
      tokenLabel = `${tokenInfo[toToken as string]?.ticker}`;
      tokenChain = tokenInfo[toToken as string]?.chainName || 'Unknown';
    } else {
      tokenLabel = 'funds';
      tokenChain = 'Base';
    }
    
    // Only show recipient address if we have token data or it's a USDC token
    let recipientAddressDisplay = null;
    if (recipientAddress) {
      if (amountUsdc || (toToken && isUsdcToken(toToken as string))) {
        // Use USDC token data
        recipientAddressDisplay = getRecipientAddressDisplay({
          recipientAddress: recipientAddress,
          tokenData: usdcInfo,
          defaultBlockExplorerUrl: blockscanUrl ?? ''
        });
      } else if (toToken && tokenInfo[toToken as string]) {
        // Use specific token data
        recipientAddressDisplay = getRecipientAddressDisplay({
          recipientAddress: recipientAddress,
          tokenData: tokenInfo[toToken as string],
          defaultBlockExplorerUrl: blockscanUrl ?? ''
        });
      }
    }

    return (
      <RequestLabel>
        {referrer} is requesting {tokenLabel} to {recipientAddressDisplay?.value} on {tokenChain}.
      </RequestLabel>
    );
  };

  const getTokenIcon = () => {
    if (amountUsdc || (toToken && isUsdcToken(toToken as string))) {
      return usdcInfo.icon;
    } else if (toToken && tokenInfo[toToken as string]) {
      return tokenInfo[toToken as string]?.icon || `${import.meta.env.VITE_PUBLIC_URL || ''}/logo192.png`;
    }
    return `${import.meta.env.VITE_PUBLIC_URL || ''}/logo192.png`;
  };

  const renderLogos = () => {
    if (!referrerLogo) {
      return (  
        <LogoContainer>
          <IconStack>
            <ReferrerIcon src={`${import.meta.env.VITE_PUBLIC_URL || ''}/logo192.png`} alt="ZKP2P logo" />
            <TokenIcon src={getTokenIcon()} alt="Token icon" />
          </IconStack>
        </LogoContainer>
      );
    } else {
      return (
        <LogoContainer>
          <IconStack>
            <ReferrerIcon src={referrerLogo} alt={referrer} />
            <TokenIcon src={getTokenIcon()} alt="Token icon" />
          </IconStack>
        </LogoContainer>
      );
    }
  };

  /*
   * Render
   */

  return (
    <>
      <Container className={className}>
        <ContentWrapper>
          {renderLogos()}
          <TextContainer>
            <ThemedText.SubHeader>
              {getRequestLabel()}
            </ThemedText.SubHeader>
          </TextContainer>
          <CloseButton onClick={handleCloseButtonClick}>
            <Trash2 size={16} />
          </CloseButton>
        </ContentWrapper>
      </Container>
      
      {showConfirmModal && (
        <RedirectCloseModal 
          onBackClick={handleCancelClose}
          onConfirmClick={handleConfirmClose}
        />
      )}
    </>
  );
};

const Container = styled.div`
  padding: 16px;
  background-color: ${colors.container};
  border-radius: 16px;
  border: 1px solid ${colors.defaultBorderColor};
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  width: 100%;
  justify-content: space-between;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
`;

const IconStack = styled.div`
  position: relative;
  width: 54px;
  height: 32px;
`;

const ReferrerIcon = styled.img`
  position: absolute;
  left: 0;
  width: 32px;
  height: 32px;
  z-index: 1;
`;

const TokenIcon = styled.img`
  position: absolute;
  left: 20px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  z-index: 2;
`;

const TextContainer = styled.div`
  text-align: left;
  flex: 1;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 1px;
  color: ${colors.lightGrayText};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${colors.darkText};
  }
`;

const RequestLabel = styled.div`  font-size: 16px;
  line-height: 1.5;
  color: ${colors.darkText};
`;

export default ReferrerInfo; 
