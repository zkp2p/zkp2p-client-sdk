import React from 'react';
import styled from 'styled-components';
import { colors } from '@theme/colors';
import { ThemedText } from '@theme/text';
import { CurrencyType } from '@helpers/types';

interface SpreadIndicatorProps {
  spread: number;
  midPrice: number;
  currency: CurrencyType | null;
}

export const SpreadIndicator: React.FC<SpreadIndicatorProps> = ({
  spread,
  midPrice,
  currency
}) => {
  const spreadPercentage = midPrice > 0 ? (spread / midPrice) * 100 : 0;
  
  return (
    <Container>
      <SpreadLine />
      <SpreadContent>
        <MidPriceSection>
          <Label>Mid Market</Label>
          <Price>{midPrice.toFixed(4)} {currency}</Price>
        </MidPriceSection>
        
        <SpreadSection>
          <Label>Spread</Label>
          <SpreadValue positive={spread >= 0}>
            {spread.toFixed(4)} ({spreadPercentage.toFixed(2)}%)
          </SpreadValue>
        </SpreadSection>
      </SpreadContent>
      <SpreadLine />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1rem 0;
  position: relative;
`;

const SpreadLine = styled.div`
  width: 100%;
  height: 1px;
  background: linear-gradient(
    90deg, 
    ${colors.warningRed}20 0%, 
    ${colors.defaultBorderColor} 45%,
    ${colors.defaultBorderColor} 55%,
    ${colors.validGreen}20 100%
  );
`;

const SpreadContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3rem;
  padding: 0.75rem 1.5rem;
  background: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 12px;
  margin: -0.5rem 0;
  z-index: 2;
`;

const MidPriceSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

const SpreadSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

const Label = styled.div`
  font-size: 11px;
  color: ${colors.grayText};
  text-transform: uppercase;
  font-weight: 500;
`;

const Price = styled.div`
  font-size: 16px;
  color: ${colors.white};
  font-weight: 600;
`;

const SpreadValue = styled.div<{ positive: boolean }>`
  font-size: 14px;
  color: ${props => props.positive ? colors.validGreen : colors.warningRed};
  font-weight: 600;
`;