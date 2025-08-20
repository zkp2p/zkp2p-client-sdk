import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { ChevronDown } from 'react-feather';
import { colors } from '@theme/colors';

import { DetailsItem } from '@components/Swap/SendPayment/DetailsItem';
import { relayTokenAmountToReadable } from '@helpers/units';
import useTokenData from '@hooks/contexts/useTokenData';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import { ParsedQuoteData } from '@hooks/bridge/useRelayBridge';
import { BridgeProvider } from '@helpers/types/bridge';
import { getRecipientAddressDisplay } from '@helpers/recipientAddress';

// Enhanced quote data type with provider information
type EnhancedQuoteData = ParsedQuoteData & {
  bridgeProvider?: BridgeProvider | string;
  fallbackAttempts?: number;
};

interface SwapDetailsProps {
  isLoading: boolean;
  quoteData: EnhancedQuoteData;
  countdown: number;
};

export const SwapDetails: React.FC<SwapDetailsProps> = ({
  isLoading,
  quoteData,
  countdown,
}) => {

  /*
   * Context
   */

  const { blockscanUrl } = useSmartContracts();
  const { tokenInfo } = useTokenData();
  /*
   * State
   */

  const [isOpen, setIsOpen] = useState(false);
  const [recipientDetails, setRecipientDetails] = useState<{ 
    label: string; 
    value: React.ReactNode 
  } | null>(null);

  /*
   * Hooks
   */

  // Don't open even when loaded
  // useEffect(() => {
  //   if (isLoading) {
  //     setIsOpen(false);
  //   } else {
  //     setIsOpen(true);
  //   }
  // }, [isLoading]);

  useEffect(() => {
    if (quoteData && quoteData.token && quoteData.recipientAddress) {
      const details = getRecipientAddressDisplay({
        recipientAddress: quoteData.recipientAddress,
        tokenData: tokenInfo[quoteData.token],
        defaultBlockExplorerUrl: blockscanUrl || ''
      });
      
      setRecipientDetails(details);
    } else {
      setRecipientDetails(null);
    }
  }, [quoteData, blockscanUrl]);

  /*
   * Helpers
   */

  const formatTokenAmount = () => {
    return `${relayTokenAmountToReadable(quoteData.outAmountFormatted)} ${tokenInfo[quoteData.token].name}`;
  }

  const formatUsdValue = () => {
    return `($${Number(quoteData.outAmountInUsd).toFixed(3)})`;
  }

  const getFeeHelperText = () => {
    return `Network fees: $${Number(quoteData.totalGasFeesInUsd).toFixed(3)}` +
    `\nZKP2P fee: $${Number(quoteData.zkp2pFeeInUsd).toFixed(3)}` +
    `\nRelayer fee: $${Number(quoteData.relayerFeeInUsd).toFixed(3)}`;
  }

  const getTotalFeesInUsd = () => {
    const totalFees = Number(quoteData.totalGasFeesInUsd) + Number(quoteData.zkp2pFeeInUsd) + Number(quoteData.relayerFeeInUsd);
    return `$${totalFees.toFixed(4)}`;
  }


  /*
   * Component
  */

  return (
    <Container>
      <TitleLabelAndDropdownIconContainer $isOpen={isOpen}>
        <TitleLabel>
          {"Swap Details"}
        </TitleLabel>
        
        <StyledChevronDown
          onClick={() => setIsOpen(!isOpen)}
          $isOpen={isOpen}
        />
      </TitleLabelAndDropdownIconContainer>

      <DetailsDropdown $isOpen={isOpen}>
        <PaymentDetailsListContainer>
          {quoteData && (
            <>
              <DetailsItem 
                label={"Send Amount"}
                value={`${Number(quoteData.inAmountUsdcFormatted).toFixed(2)} USDC`}
              />
              
              <DetailsItem 
                label={"Receive Amount"}
                value={
                  <ReceiveTokenContainer>
                    {formatTokenAmount()} <UsdValueText>{formatUsdValue()}</UsdValueText>
                  </ReceiveTokenContainer>
                }
              />

              {recipientDetails && (
                <DetailsItem
                  label={recipientDetails.label}
                  value={recipientDetails.value}
                />
              )}

              <DetailsItem
                label={"Fees"}
                value={getTotalFeesInUsd()}
                helperText={getFeeHelperText()}
              />

              {quoteData.bridgeProvider && (
                <DetailsItem
                  label={"Bridge Provider"}
                  value={quoteData.bridgeProvider}
                  helperText={
                    quoteData.fallbackAttempts && quoteData.fallbackAttempts > 0
                      ? `Using fallback provider after ${quoteData.fallbackAttempts} attempts`
                      : undefined
                  }
                />
              )}

              <DetailsItem
                label={"Arrival Time"}
                value={`${quoteData.serviceTimeSeconds}s`}
              />
              <DetailsItem
                label={"Quote Refreshes every"}
                value={`${countdown}s`}
              />
            </>
          )}
        </PaymentDetailsListContainer>
      </DetailsDropdown>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 16px;
  background: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  overflow: hidden;
  width: 100%;
`;

const TitleLabelAndDropdownIconContainer = styled.div<{ $isOpen: boolean }>`
  min-height: 48px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;  
  width: 100%;
  border-bottom: ${({ $isOpen }) => $isOpen ? `1px solid ${colors.defaultBorderColor}` : 'none'};
`;

const TitleLabel = styled.div`
  font-size: 14px;
  padding: 0 20px;

  @media (max-width: 600px) {
    font-size: 13px;
  }
`;

interface StyledChevronDownProps {
  $isOpen?: boolean;
};

const StyledChevronDown = styled(ChevronDown)<StyledChevronDownProps>`
  width: 20px;
  height: 20px;
  color: ${colors.darkText};
  padding: 0 20px;

  transition: transform 0.4s;
  transform: ${({ $isOpen }) => $isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

interface DetailsDropdownProps {
  $isOpen?: boolean;
};

const DetailsDropdown = styled.div<DetailsDropdownProps>`
  width: 100%;
  display: flex;
  flex-direction: column;
  background: ${colors.container};
  color: ${colors.darkText};
  align-items: center;
  overflow: hidden;

  max-height: ${({ $isOpen }) => $isOpen ? '500px' : '0px'};
  transition: max-height 0.4s ease-out;
`;

const PaymentDetailsListContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
`;

const ReceiveTokenContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UsdValueText = styled.span`
  color: ${colors.grayText};
  font-size: 0.9em;
`;
