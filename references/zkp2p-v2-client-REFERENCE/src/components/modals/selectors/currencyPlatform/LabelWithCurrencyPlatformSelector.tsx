import React from 'react';
import styled from 'styled-components';
import { CurrencyPlatformSelector } from '@components/modals/selectors/currencyPlatform/CurrencyPlatformSelector';
import { CurrencyType, PaymentPlatformType } from '@helpers/types';
import { colors } from '@theme/colors';
import { currencies } from '@helpers/types/currency';

interface LabelWithCurrencyPlatformSelectorProps {
  label: string;
  selectedCurrency: CurrencyType | null;
  setSelectedCurrency: (currency: CurrencyType) => void;
  selectedPlatform: PaymentPlatformType | null;
  setSelectedPlatform: (platform: PaymentPlatformType) => void;
  allPlatforms?: PaymentPlatformType[];
  displayMode?: 'currency' | 'platform' | 'both';
}

export const LabelWithCurrencyPlatformSelector: React.FC<LabelWithCurrencyPlatformSelectorProps> = ({
  label,
  selectedCurrency,
  setSelectedCurrency,
  selectedPlatform,
  setSelectedPlatform,
  allPlatforms,
  displayMode = 'both'
}) => {
  return (
    <Container>
      <Label>
        {label}
      </Label>
      <SelectorWrapper>
        <CurrencyPlatformSelector
          selectedCurrency={selectedCurrency}
          setSelectedCurrency={setSelectedCurrency}
          allCurrencies={currencies}
          selectedPlatform={selectedPlatform}
          setSelectedPlatform={setSelectedPlatform}
          allPlatforms={allPlatforms}
          displayMode={displayMode}
        />
      </SelectorWrapper>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid ${colors.defaultBorderColor};
  background-color: ${colors.defaultInputColor};

  &:focus-within {
    border-color: #CED4DA;
    border-width: 1px;
  }
`;

const Label = styled.label`
  display: flex;
  font-size: 14px;
  font-weight: 550;
  color: #CED4DA;
`;

const SelectorWrapper = styled.div`
  display: flex;
  align-items: center;
`; 