import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import { Button } from '@components/common/Button';
import { Overlay } from '@components/modals/Overlay';
import { CopyButton } from '@components/common/CopyButton';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import useQuery from '@hooks/useQuery';

import useTokenData from '@hooks/contexts/useTokenData';

interface IntegrationProps {
  onBackClick: () => void;
}

export const IntegrationModal: React.FC<IntegrationProps> = ({ onBackClick }) => {
  const { queryParams } = useQuery();
  const { tokenInfo, isLoading: isTokenDataLoading, refetchToken } = useTokenData();
  const [isSpecificTokenLoading, setIsSpecificTokenLoading] = useState(false);
  const [tokenFetchAttempted, setTokenFetchAttempted] = useState(false);
  
  /*
   * Handlers
   */
  const handleOverlayClick = () => {
    onBackClick();
  };

  /*
   * Effects
   */
  useEffect(() => {
    const loadSpecificToken = async () => {
      const toToken = queryParams.REFERRER_TO_TOKEN;
      if (!toToken) return;
      
      // Check if we need to fetch this specific token
      if (!tokenInfo[toToken as string] && !tokenFetchAttempted) {
        console.log('Fetching specific token in IntegrationModal:', toToken);
        setIsSpecificTokenLoading(true);
        setTokenFetchAttempted(true);
        
        try {
          const result = await refetchToken(toToken as string);
          console.log('Token fetch result:', result ? 'Success' : 'Not found');
        } catch (error) {
          console.error('Failed to fetch token:', error);
        } finally {
          setIsSpecificTokenLoading(false);
        }
      }
    };

    loadSpecificToken();
  }, [queryParams, tokenInfo, refetchToken, tokenFetchAttempted]);

  // Show loading indicator if tokens are still loading
  const isLoading = isTokenDataLoading || isSpecificTokenLoading;
  const toToken = queryParams.REFERRER_TO_TOKEN as string;
  const hasTokenData = toToken && tokenInfo[toToken];

  /*
   * Helpers
   */

  const networkName = (): string => {
    if (!hasTokenData) return 'Base';
    return tokenInfo[toToken].chainName || 'Base';
  };

  const instructionCopy = (): string => {
    const { REFERRER, REFERRER_RECIPIENT_ADDRESS } = queryParams;
    const tokenTicker = hasTokenData ? tokenInfo[toToken].ticker : 'USDC';
    
    if (!REFERRER_RECIPIENT_ADDRESS) {
      return `You've arrived from ${REFERRER}. Complete the Swap to receive ${tokenTicker}.`;
    }
    return `You've arrived from ${REFERRER}. Complete the Swap to receive ${tokenTicker} directly to the following wallet address:`;
  };

  const renderLogos = () => {
    const referrer = queryParams.REFERRER;
    const referrerLogo = queryParams.REFERRER_LOGO;

    if (!referrerLogo) {
      return (
        <StyledLogo>
          <img src={`${import.meta.env.VITE_PUBLIC_URL || ''}/logo192.png`} alt="ZKP2P logo" />
        </StyledLogo>
      );
    }

    return (
      <LogosContainer>
        <StyledLogo>
          <img src={`${import.meta.env.VITE_PUBLIC_URL || ''}/logo192.png`} alt="ZKP2P logo" />
        </StyledLogo>
        <CrossIcon>×</CrossIcon>
        <StyledLogo>
          <img src={referrerLogo} alt={`${referrer}`} />
        </StyledLogo>
      </LogosContainer>
    );
  };

  const renderIntegrationBenefits = () => (
    <BenefitsContainer>
      <BenefitItem>
        <ThemedText.SubHeaderSmall>🔒 Secure</ThemedText.SubHeaderSmall>
        <ThemedText.BodySmall style={{ color: colors.grayText }}>
          Onramp with zero counterparty risk
        </ThemedText.BodySmall>
      </BenefitItem>
      <BenefitItem>
        <ThemedText.SubHeaderSmall>💸 Best Rates</ThemedText.SubHeaderSmall>
        <ThemedText.BodySmall style={{ color: colors.grayText }}>
          No intermediaries, transact directly with a seller
        </ThemedText.BodySmall>
      </BenefitItem>
      <BenefitItem>
        <ThemedText.SubHeaderSmall>⚡ Fast Settlement</ThemedText.SubHeaderSmall>
        <ThemedText.BodySmall style={{ color: colors.grayText }}>
          Verify payment to instantly unlock crypto to your wallet
        </ThemedText.BodySmall>
      </BenefitItem>
    </BenefitsContainer>
  );

  const renderRecipientAddress = () => {
    if (!queryParams.REFERRER_RECIPIENT_ADDRESS) return null;
    
    return (
      <AccountAddressContainer>
        <ThemedText.LabelSmall style={{ textAlign: 'left', color: '#FFF' }}>
          Recipient Address {hasTokenData ? `(${networkName()})` : ''}
        </ThemedText.LabelSmall>

        <AddressRow>
          <AddressLabel>
            {queryParams.REFERRER_RECIPIENT_ADDRESS}
          </AddressLabel>
          <CopyButton textToCopy={queryParams.REFERRER_RECIPIENT_ADDRESS || ''} />
        </AddressRow>
      </AccountAddressContainer>
    );
  };

  return (
    <ModalAndOverlayContainer>
      <Overlay />

      <ModalContainer>
        <TitleCenteredRow>
          <ThemedText.HeadlineSmall style={{ flex: '1', margin: 'auto', textAlign: 'center' }}>
            Welcome to ZKP2P
          </ThemedText.HeadlineSmall>
        </TitleCenteredRow>

        {renderLogos()}

        <InstructionAndAddressContainer>
          <BenefitsContainer>{renderIntegrationBenefits()}</BenefitsContainer>
          <InstructionsContainer>
            <ThemedText.SubHeader style={{ flex: '1', margin: 'auto', textAlign: 'left' }}>
              {instructionCopy()}
            </ThemedText.SubHeader>
          </InstructionsContainer>

          {renderRecipientAddress()}
        </InstructionAndAddressContainer>
        
        <Button 
          onClick={onBackClick} 
          width={164}
        >
          Continue
        </Button>
      </ModalContainer>
    </ModalAndOverlayContainer>
  );
};

const ModalAndOverlayContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  position: fixed;
  align-items: flex-start;
  top: 0;
  left: 0;
  z-index: 10;
`;

const ModalContainer = styled.div`
  width: 80vw;
  max-width: 392px;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.5rem 1.25rem;
  background-color: ${colors.container};
  justify-content: space-between;
  align-items: center;
  z-index: 20;
  gap: 2rem;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const TitleCenteredRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
`;

const StyledLogo = styled.div<{ isReferrer?: boolean }>`
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fff;
  text-decoration: none;

  img {
    width: 92px;
    height: 92px;
    object-fit: cover;
  }
`;

const LogosContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const CrossIcon = styled.span`
  color: ${colors.white};
  font-size: 2rem;
`;

const InstructionAndAddressContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  align-items: center;
  color: #fff;
`;

const InstructionsContainer = styled.div`
  padding: 0 1.25rem;
`;

const AccountAddressContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: left;
  width: 100%;
  box-sizing: border-box;
`;

const AddressRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const AddressLabel = styled.div`
  max-width: calc(100% - 16px);
  font-size: 16px;
  word-break: break-all;
  line-height: 1.4;
`;

const SolanaAddressLabel = styled.div`
  max-width: calc(100% - 16px);
  font-size: 16px;
  word-break: break-all;
  line-height: 1.4;
`;

const BenefitsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  padding: 0 1.25rem;
`;

const BenefitItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${colors.darkText};
`;

export default IntegrationModal;