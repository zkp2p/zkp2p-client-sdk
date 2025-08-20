import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { ChevronDown } from 'react-feather';
import { colors } from '@theme/colors';

import { DetailsItem } from '@components/Swap/SendPayment/DetailsItem';
import { paymentPlatformInfo, currencyInfo } from '@helpers/types';
import { usdcInfo } from '@helpers/types/tokens';

import useSmartContracts from '@hooks/contexts/useSmartContracts';
import useBackend from '@hooks/contexts/useBackend';
import useQuery from '@hooks/useQuery';
import { CopyButton } from '@components/common/CopyButton';
import { getRecipientAddressDisplay } from '@helpers/recipientAddress';
import useTokenData from '@hooks/contexts/useTokenData';

interface DetailsProps {
  intentData: {
    paymentPlatform: string;
    depositorOnchainPayeeDetails: string;
    receiveToken: string;
    amountTokenToReceive: string;
    sendCurrency: string;
    amountFiatToSend: string;
    expirationTimestamp: string;
    recipientAddress: string;
    token: string;
    formattedTokenAmount?: string;
    tokenAmountInUsd?: string;
    tokenRecipientAddress: string;
  };
  selectedPaymentMethod: number;
  initOpen?: boolean;
  payeeDetailPrefix?: string;
};

export const Details: React.FC<DetailsProps> = ({
  intentData,
  selectedPaymentMethod,
  initOpen = false,
  payeeDetailPrefix = "",
}) => {

  /*
   * Context
   */

  const { blockscanUrl } = useSmartContracts();
  const { rawPayeeDetails, depositorTgUsername } = useBackend();
  const { queryParams } = useQuery();
  const { tokenInfo } = useTokenData();

  /*
   * State
   */

  const [isOpen, setIsOpen] = useState(initOpen);
  const [receiveTokenLabel, setReceiveTokenLabel] = useState<string>('');
  const [receivingChain, setReceivingChain] = useState<string>('');
  const [receiveTokenSubtext, setReceiveTokenSubtext] = useState<string>('');
  const [recipientDetails, setRecipientDetails] = useState<{ 
    label: string; 
    value: React.ReactNode 
  } | null>(null);

  /*
   * Effects
   */
  
  useEffect(() => {
    if (intentData) {
      const { 
        token, 
        amountTokenToReceive: usdcAmount,  
        recipientAddress: usdcRecipientAddress, 
        formattedTokenAmount, 
        tokenAmountInUsd,
        tokenRecipientAddress
      } = intentData;

      // Set receive token label using only the intentData
      let tokenAmountText, tokenSubtext, currRecipientAddress;

      if (token == usdcInfo.tokenId) {
        tokenAmountText = `${usdcAmount} USDC`;
        tokenSubtext = `($${usdcAmount})`;
        currRecipientAddress = usdcRecipientAddress;
      } else {
        tokenAmountText = `~${formattedTokenAmount} ${tokenInfo[token]?.ticker}`;
        tokenSubtext = `($${tokenAmountInUsd})`;
        currRecipientAddress = tokenRecipientAddress;
      }
      
      const details = getRecipientAddressDisplay({
        recipientAddress: currRecipientAddress,
        tokenData: tokenInfo[token],
        defaultBlockExplorerUrl: blockscanUrl || ''
      });

      setReceivingChain(tokenInfo[token]?.chainName || '');
      setReceiveTokenLabel(tokenAmountText);
      setReceiveTokenSubtext(tokenSubtext);
      setRecipientDetails(details);
    }
  }, [intentData, blockscanUrl]);

  /*
   * Helpers
   */

  const getPaymentMethodName = () => {
    const platformData = paymentPlatformInfo[intentData.paymentPlatform];

    const platformName = platformData.platformName;
    const paymentMethodName = platformData.paymentMethods[selectedPaymentMethod].sendConfig.paymentMethodName;

    const paymentMethodString = platformData.hasMultiplePaymentMethods ? 
      ` (${paymentMethodName})` : '';

    return `${platformName}${paymentMethodString}`;
  }

  /*
   * Component
   */

  return (
    <Container>
      <TitleLabelAndDropdownIconContainer $isOpen={isOpen}>
        {rawPayeeDetails ? (
          <TitleLabel>
            {`Send ${currencyInfo[intentData.sendCurrency].currencySymbol}${intentData.amountFiatToSend} to ${payeeDetailPrefix}`}
            <TitlePayeeContainer>
              {rawPayeeDetails}
              <CopyButton textToCopy={rawPayeeDetails} size="sm" />
            </TitlePayeeContainer>
          </TitleLabel>
        ) : (
          <TitleLabel>
            <LoadingRectangle />
          </TitleLabel>
        )}
        
        <StyledChevronDown
          onClick={() => setIsOpen(!isOpen)}
          $isOpen={isOpen}
        />
      </TitleLabelAndDropdownIconContainer>

      <DetailsDropdown $isOpen={isOpen}>
        <PaymentDetailsListContainer>
          {intentData && (
            <>
              <DetailsItem
                label={"Send on"}
                value={getPaymentMethodName()}
              />

              {depositorTgUsername && (
                <DetailsItem
                  label={`Seller's Telegram`}
                  value={depositorTgUsername}
                  copyable={true}
                  labelHelperText={`If you want to contact the seller, you can use their Telegram username.`}
                />
              )}

              <DetailsItem 
                label={"Receive"}
                value={
                  <ReceiveTokenContainer>
                    {receiveTokenLabel} <UsdValueText>{receiveTokenSubtext}</UsdValueText>
                  </ReceiveTokenContainer>
                }
              />

              {recipientDetails && (
                <DetailsItem
                  label={recipientDetails.label}
                  value={recipientDetails.value}
                />
              )}

              {receivingChain && (
                <DetailsItem
                  label={"Receive on"}
                  value={receivingChain}
                />
              )}

              <DetailsItem
                label={"Order expires at"}
                value={intentData.expirationTimestamp}
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
  overflow: hidden;
  width: 100%;
`;

const TitleLabelAndDropdownIconContainer = styled.div<{ $isOpen: boolean }>`
  min-height: 48px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 20px;  
  width: 90%;
  border-bottom: ${({ $isOpen }) => $isOpen ? `1px solid ${colors.defaultBorderColor}` : 'none'};
  position: relative;
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

const ReceiveTokenContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UsdValueText = styled.span`
  color: ${colors.grayText};
  font-size: 0.9em;
`;

const TitleLabel = styled.div`
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  padding: 0 20px;
  line-height: 1.5;

  @media (max-width: 600px) {
    font-size: 16px;
  }
`;

const TitlePayeeContainer = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

interface StyledChevronDownProps {
  $isOpen?: boolean;
};

const StyledChevronDown = styled(ChevronDown)<StyledChevronDownProps>`
  position: absolute;
  right: 15px;
  width: 20px;
  height: 20px;
  color: ${colors.darkText};
  cursor: pointer;
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
