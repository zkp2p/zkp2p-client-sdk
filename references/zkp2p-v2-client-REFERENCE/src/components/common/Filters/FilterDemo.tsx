import React, { useState } from 'react';
import styled from 'styled-components';
import { colors } from '@theme/colors';
import { ThemedText } from '@theme/text';

import {
  CurrencyFilter,
  PlatformFilter,
  AmountFilter,
  SearchFilter,
  ToggleFilter
} from './index';

import { PaymentPlatformType, paymentPlatforms } from '@helpers/types';
import { CurrencyType, currencies } from '@helpers/types';

// Demo component to showcase all filter components with unified design
export const FilterDemo: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<PaymentPlatformType | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [showSmallOrders, setShowSmallOrders] = useState<boolean>(false);

  return (
    <Container>
      <Title>
        <ThemedText.HeadlineMedium>Unified Filter Components Demo</ThemedText.HeadlineMedium>
      </Title>
      
      <FilterRow>
        <FilterLabel>Amount Filter:</FilterLabel>
        <AmountFilter
          value={amount}
          onChange={setAmount}
          placeholder="0.00"
          width="140px"
        />
      </FilterRow>

      <FilterRow>
        <FilterLabel>Currency Filter:</FilterLabel>
        <CurrencyFilter
          selectedCurrency={selectedCurrency}
          setSelectedCurrency={setSelectedCurrency}
          allCurrencies={currencies}
          width="140px"
        />
      </FilterRow>

      <FilterRow>
        <FilterLabel>Platform Filter:</FilterLabel>
        <PlatformFilter
          selectedPlatform={selectedPlatform}
          setSelectedPlatform={setSelectedPlatform}
          allPlatforms={paymentPlatforms}
          width="140px"
        />
      </FilterRow>

      <FilterRow>
        <FilterLabel>Search Filter:</FilterLabel>
        <SearchFilter
          value={searchText}
          onChange={setSearchText}
          placeholder="Search..."
          width="200px"
        />
      </FilterRow>

      <FilterRow>
        <FilterLabel>Toggle Filter:</FilterLabel>
        <ToggleFilter
          checked={showSmallOrders}
          onChange={setShowSmallOrders}
          label="Low Liquidity"
        />
      </FilterRow>

      <StateDisplay>
        <ThemedText.BodySmall>Current State:</ThemedText.BodySmall>
        <pre>{JSON.stringify({
          selectedCurrency,
          selectedPlatform,
          amount,
          searchText,
          showSmallOrders
        }, null, 2)}</pre>
      </StateDisplay>
    </Container>
  );
};

const Container = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.div`
  margin-bottom: 2rem;
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px;
`;

const FilterLabel = styled.div`
  min-width: 150px;
  color: ${colors.lightGrayText};
  font-size: 14px;
`;

const StateDisplay = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  background: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px;
  
  pre {
    margin-top: 0.5rem;
    color: ${colors.lightGrayText};
    font-size: 12px;
    font-family: monospace;
  }
`;