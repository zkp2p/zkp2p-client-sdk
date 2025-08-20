import React, { useState } from 'react';
import styled from 'styled-components';
import { ChevronDown } from 'react-feather';
import { colors } from '@theme/colors';

import { ZERO } from '@helpers/constants';
import { DetailsItem } from '@components/Swap/SendPayment/DetailsItem';
import { tokenUnitsToReadable } from '@helpers/units';
import useAccount from '@hooks/contexts/useAccount';
import { currencyInfo, LoginStatus } from '@helpers/types';
import useTokenData  from '@hooks/contexts/useTokenData';

interface QuoteDetailsProps {
  currency: string;
  fiatAmount: string;
  token: string;
  usdcAmount: bigint;
  usdcToFiatRate: string;
  outputTokenAmount?: bigint;
  outputTokenDecimals?: number;
  outputTokenAmountInUsd?: string;
  gasFeesInUsd?: string;
  appFeeInUsd?: string;
  relayerFeeInUsd?: string;
  relayerGasFeesInUsd?: string;
  relayerServiceFeesInUsd?: string;
  usdcToTokenRate?: string;
  timeEstimate?: string;
}

export const QuoteDetails: React.FC<QuoteDetailsProps> = ({
  currency,
  token,
  fiatAmount,
  usdcAmount,
  usdcToFiatRate,
  usdcToTokenRate,
  outputTokenAmount,
  outputTokenDecimals,
  outputTokenAmountInUsd,
  gasFeesInUsd,
  appFeeInUsd,
  relayerFeeInUsd,
  relayerGasFeesInUsd,
  relayerServiceFeesInUsd,
  timeEstimate,
}) => {

  /*
   * Context
   */
  const { tokenInfo, TOKEN_USDC } = useTokenData();

  /*
   * State
   */

  const [isOpen, setIsOpen] = useState(false);

  const { loginStatus } = useAccount();
  const isEmbedded = loginStatus === LoginStatus.AUTHENTICATED;

  /*
   * Helpers
   */

  const getTotalFeesInUsd = () => {
    const totalFees = Number(gasFeesInUsd) + 
      Number(appFeeInUsd) + 
      Number(relayerFeeInUsd) + 
      Number(relayerGasFeesInUsd) + 
      Number(relayerServiceFeesInUsd);
    return `$${totalFees.toFixed(2)}`;
  }

  const getTotalRelayerFeesInUsd = () => {
    const totalRelayerFees = Number(relayerFeeInUsd) + 
      Number(relayerGasFeesInUsd) + 
      Number(relayerServiceFeesInUsd);
    return `$${totalRelayerFees.toFixed(2)}`;
  }

  const getTokenPerUsdc = () => {
    console.log("usdcToTokenRate", usdcToTokenRate);
    return `${Number(Number(usdcToTokenRate).toFixed(6))} ${tokenInfo[token].ticker} / USDC`;
  }

  const getTokenPriceInUsd = () => {
    return `($${(1/Number(usdcToTokenRate)).toFixed(2)})`;
  }

  const getTitleAndSuffix = () => {
    const readableUsdcAmount = tokenUnitsToReadable(usdcAmount, 6, 2);
    let title = ''
    let suffix = '';
    
    title = `${Number(fiatAmount)} ${currency}`;        // Add currency
    title += ` → ${Number(readableUsdcAmount)} USDC`;   // Add usdc


    if (outputTokenAmount && outputTokenAmount !== ZERO && outputTokenDecimals && token !== TOKEN_USDC) {
      const readableOutputTokenAmount = tokenUnitsToReadable(outputTokenAmount, outputTokenDecimals, 6);
      title += ` → ${Number(readableOutputTokenAmount)} ${tokenInfo[token].ticker}`;
      suffix = ` ($${Number(outputTokenAmountInUsd)})`;
    } else {
      suffix = ` ($${Number(readableUsdcAmount).toFixed(2)})`;
    }

    return { title, suffix };
  }

  const { title, suffix } = getTitleAndSuffix();


  /* 
   * Render
   */

  return (
    <Container>
      <TitleLabelAndDropdownIconContainer $isOpen={isOpen}>
        <TitleAndSuffixContainer>
          <TitleLabel>
            {title}
          </TitleLabel>

        <SuffixLabel> 
          {suffix}
          </SuffixLabel>
        </TitleAndSuffixContainer>

        <StyledChevronDown
          onClick={() => setIsOpen(!isOpen)}
          $isOpen={isOpen}
        />
      </TitleLabelAndDropdownIconContainer>

      <DetailsDropdown $isOpen={isOpen}>
        <PaymentDetailsListContainer>
            {usdcToFiatRate && (
              <DetailsItem
                label={`USDC price`}
                value={`${Number(usdcToFiatRate).toString()} ${currency} / USDC`}
                suffixValue={`(${currencyInfo[currency].currencySymbol}${Number(usdcToFiatRate).toFixed(2)})`}
                padding="0"
                fontSize="12px"
                labelHelperText={`Conversion rate set by your counterparty`}
              />
            )}

            {outputTokenAmount !== ZERO && token !== TOKEN_USDC && (
              <DetailsItem 
                label={`${tokenInfo[token].ticker} price`}
                value={getTokenPerUsdc()}
                suffixValue={getTokenPriceInUsd()}
                padding="0"
                fontSize="12px"
                labelHelperText={`USDC to ${tokenInfo[token].ticker} conversion rate fetched from Relay.Link`}
              />
            )}

            {/* {gasFeesInUsd && (
              <DetailsItem
                label={"Gas Fees"}
                value={`${isEmbedded ? '$0' : `$${Number(gasFeesInUsd).toFixed(3)}`}`}
                suffixValue={`${isEmbedded ? '(Free)' : ''}`}
                padding="0"
                fontSize="12px"
                labelHelperText={`Gas fees for the transaction on origin chain`}
              />
            )} */}

            <DetailsItem
              label={"ZKP2P Fees"}
              value={Number(appFeeInUsd || 0) === 0 ? '✨ Zero ✨' : `$${Number(appFeeInUsd).toFixed(2)}`}
              padding="0"
              fontSize="12px"
              labelHelperText={`Fees taken by ZKP2P`}
            />

            {relayerGasFeesInUsd && (
              <DetailsItem
                label={"Relayer Fees"}
                value={getTotalRelayerFeesInUsd()}
                padding="0"
                fontSize="12px"
                labelHelperText={`Fees taken by maker for USDC -> ${tokenInfo[token].ticker} conversion`}
              />
            )}


            {timeEstimate && (
              <DetailsItem
                label={"Arrival Time"}
                value={`${timeEstimate}s`}
                padding="0"
                fontSize="12px"
                labelHelperText={`Estimated time for the transaction to arrive on the destination chain`}
              />
            )}
            
        </PaymentDetailsListContainer>
      </DetailsDropdown>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 16px;
  background: ${colors.container};
  width: 100%;
  padding: 0rem 0.5rem;
  box-sizing: border-box;
`;

const TitleLabelAndDropdownIconContainer = styled.div<{ $isOpen: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0.1rem 0rem;
  border-bottom: ${({ $isOpen }) => $isOpen ? `1px solid ${colors.defaultBorderColor}` : 'none'};
  position: relative;
  width: 100%;
`;

const TitleAndSuffixContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: left;
  gap: 0.2rem;
`;

const TitleLabel = styled.div`
  text-align: left;
  font-size: 12px;
`;

const SuffixLabel = styled.div`
  text-align: left;
  font-size: 12px;
  color: ${colors.grayText};
`;

interface StyledChevronDownProps {
  $isOpen?: boolean;
}

const StyledChevronDown = styled(ChevronDown)<StyledChevronDownProps>`
  width: 20px;
  height: 20px;
  color: ${colors.darkText};
  cursor: pointer;
  transition: transform 0.4s;
  transform: ${({ $isOpen }) => $isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

interface DetailsDropdownProps {
  $isOpen?: boolean;
}

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
  gap: 0.5rem;
  padding: 0.5rem 0;
`;