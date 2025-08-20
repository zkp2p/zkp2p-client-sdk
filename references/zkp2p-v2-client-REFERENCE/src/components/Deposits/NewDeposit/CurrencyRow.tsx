import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { colors } from '@theme/colors';
import { SimpleInput } from '@components/common/SimpleInput';
import { CurrencyType } from '@helpers/types';
import { usdcInfo } from '@helpers/types/tokens';
import { CurrencySelector } from '@components/modals/selectors/currency/CurrencySelector';

interface CurrencyRowProps {
  currency: CurrencyType;
  setConversionRate: (currency: CurrencyType, rate: string) => void;
  depositToken: string;
  supportedCurrencies: CurrencyType[];
  onSelectCurrency: (prevCurrency: CurrencyType, newCurrency: CurrencyType) => void;
  conversionRate?: string;
}

export const CurrencyRow: React.FC<CurrencyRowProps> = ({
  currency,
  setConversionRate,
  depositToken,
  supportedCurrencies,
  onSelectCurrency,
  conversionRate = '',
}) => {

  /*
   * State
   */

  const [conversionRateValue, setConversionRateValue] = useState<string | null>(conversionRate);

  /*
   * Effects
   */

  useEffect(() => {
    if (conversionRateValue !== null) {
      if (conversionRateValue !== "" && conversionRateValue !== "0." && conversionRateValue !== "." && Number(conversionRateValue) > 0) {
        setConversionRate(currency, conversionRateValue);
      } else {
        setConversionRate(currency, '0');
      }
    }
  }, [
    conversionRateValue, 
    currency,
  ]);

  // Sync conversionRateValue with the conversionRate prop when currency changes
  useEffect(() => {
    setConversionRateValue(conversionRate);
  }, [currency]); // Add conversionRate as a dependency
  
  /*
   * Handlers
   */

  function isValidInput(value: string) {
    const isValid = /^-?\d*(\.\d{0,4})?$/.test(value);
    
    return parseFloat(value) >= 0 && isValid;
  }

  const handleCurrencyChange = (newCurrency: CurrencyType) => {
    const prevCurrency = currency;
    setConversionRate(prevCurrency, '0');
    
    onSelectCurrency(prevCurrency, newCurrency);
  };

  const handleConversionRateChange = (value: string) => {
    if (value === "") {
      setConversionRateValue('');
    } else if (value === ".") {
      setConversionRateValue('0.');
    } else if (isValidInput(value)) {
      setConversionRateValue(value);
    }
  };

  const isSelected = conversionRateValue !== null && conversionRateValue !== '' && conversionRateValue !== '0.' && conversionRateValue !== '0';
  
  /*
   * Render
   */
  return (
    <RowContainer selected={isSelected}>

      <SellLabel>
        Sell   1
      </SellLabel>

      <TokenContainer>
        <TokenSvg src={usdcInfo.icon} />

        <TokenLabel>
          {usdcInfo.ticker}
        </TokenLabel>
      </TokenContainer>

      <ForLabel>
        for
      </ForLabel>
      
      <InputContainer>
        <SimpleInput
          label="Conversion Rate"
          name="conversionRate"
          value={conversionRateValue || ''}
          onChange={(e) => handleConversionRateChange(e.target.value)}
          placeholder="Rate"
        />
      </InputContainer>
      
      <CurrencySelector
        selectedCurrency={currency}
        setSelectedCurrency={handleCurrencyChange}
        allCurrencies={supportedCurrencies}
        width={80}
      />
    </RowContainer>
  );
};

const RowContainer = styled.div<{ selected: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0px 12px 16px;
  gap: 1px;
  opacity: 1;
  background: ${props => props.selected ? 'transparent' : colors.container};
  border-radius: 8px;
  flex-wrap: wrap;
`;

const SellLabel = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #FFF;
  padding-top: 2px;
  flex: 0.15;
  white-space: nowrap;

  @media (max-width: 600px) {
    flex: 0.2;
    font-size: 14px;
  }
`;

const ForLabel = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #FFF;
  padding-top: 2px;
  flex: 0.05;
`;

const TokenLabel = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #FFF;
  padding-top: 2px;

  @media (max-width: 600px) {
    font-size: 14px;
  }
`;

const TokenContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-radius: 24px;
  background: ${colors.selectorColor};
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0px 4px;
  height: 32px;
  gap: 6px;
  cursor: pointer;
  flex: 0.1;

  &:hover {
    background-color: ${colors.selectorHover};
    border: 1px solid ${colors.selectorHoverBorder};
  }
`;

const InputContainer = styled.div`
  flex: 0.5;
  min-width: 120px;

  @media (max-width: 600px) {
    flex: 0.5;
    min-width: 80px;
  }
`;

const TokenSvg = styled.img`
  border-radius: 18px;
  width: 24px;
  height: 24px;
`;  