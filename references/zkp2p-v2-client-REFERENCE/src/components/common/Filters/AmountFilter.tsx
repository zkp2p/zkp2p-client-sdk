import React from 'react';
import styled from 'styled-components';

import { FilterInput, FilterIcon, FilterTextInput, FilterValue } from './FilterInput';
import { usdcInfo } from '@helpers/types/tokens';
import useTokenData from '@hooks/contexts/useTokenData';

interface AmountFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  selectedToken?: string;
  width?: string;
}

export const AmountFilter: React.FC<AmountFilterProps> = ({
  value,
  onChange,
  placeholder = "0.00",
  selectedToken,
  width = '140px'
}) => {
  const { tokenInfo } = useTokenData();
  const token = selectedToken ? tokenInfo[selectedToken] : null;
  // Handle both logoURI (Relay API) and icon (local) properties
  const tokenIcon = token ? ((token as any).logoURI || (token as any).icon) : usdcInfo.icon;
  const tokenSymbol = token?.ticker || 'USDC';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === '' || /^\d*\.?\d{0,6}$/.test(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <FilterInput isActive={!!value} width={width}>
      <FilterTextInput
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
      />
      <TokenDisplay>
        <FilterIcon>
          <img src={tokenIcon} alt={tokenSymbol} />
        </FilterIcon>
        <FilterValue>{tokenSymbol}</FilterValue>
      </TokenDisplay>
    </FilterInput>
  );
};

const TokenDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding-left: 8px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
`;