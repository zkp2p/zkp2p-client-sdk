import React from "react";
import styled from 'styled-components';

import { AutoColumn } from '@components/layouts/Column';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { Currency, PaymentPlatform, paymentPlatforms } from "@helpers/types";
import { usdcInfo } from "@helpers/types/tokens";

import { InputWithCurrencySelector } from "@components/modals/selectors/currency";
import { LabelWithPlatformSelector } from "@components/modals/selectors/platform";
import { InputWithTokenSelector } from "@components/modals/selectors/token/InputWithTokenSelector";

export type SwapQuote = {
  requestedUSDC: string;
  fiatToSend: string;
  depositId: bigint;
};


const SwapPreview: React.FC = () => {
  /*
   * Component
   */

  return (
    <Wrapper>
      <SwapModalContainer>
        <TitleContainer>
          <ThemedText.HeadlineMedium>
            Buy
          </ThemedText.HeadlineMedium>
        </TitleContainer>

        <MainContentWrapper>
          <InputWithCurrencySelector
            label="You send"
            name={`fiatToSend`}
            value={undefined}
            onChange={() => {}}
            onKeyDown={() => {}}
            type="number"
            placeholder="0.00"
            readOnly
            hasSelector={true}
            selectedCurrency={Currency.USD}
          />
          <LabelWithPlatformSelector
            label="Paying using"
            selectedPlatform={PaymentPlatform.VENMO}
            setSelectedPlatform={() => {}}
            allPlatforms={paymentPlatforms}
          />
          <InputWithTokenSelector
            label="You receive"
            name={`requestedUSDC`}
            value={undefined}
            onChange={() => {}}
            type="number"
            placeholder="0"
            readOnly
            selectedToken={usdcInfo.tokenId}
          />
        </MainContentWrapper>
      </SwapModalContainer>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  margin-top: 50px;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0), #171717FF);
    pointer-events: none;
  }
`;

const SwapModalContainer = styled(AutoColumn)`
  border-radius: 16px;
  border: 1px solid #DEE2E6;
  padding: 1rem;
  gap: 1rem;
  background-color: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.25);

  &:hover {
    border: 1px solid #DF2E2D;
    transform: translateY(-5px);
  }
`;

const TitleContainer = styled.div`
  display: flex;
  margin-left: 0.75rem;
`;

const MainContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-self: center;
  border-radius: 4px;
  justify-content: center;
`;

export default SwapPreview;
