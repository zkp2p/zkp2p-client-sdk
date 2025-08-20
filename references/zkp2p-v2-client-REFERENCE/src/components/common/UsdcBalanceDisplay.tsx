import React from 'react';
import styled from 'styled-components';

import useBalances from '@hooks/contexts/useBalance';
import { tokenUnitsToReadable } from '@helpers/units';
import { usdcInfo } from '@helpers/types/tokens';
import usdcSvg from '@assets/images/tokens/usdc.svg';

interface UsdcBalanceDisplayProps {
  integrated?: boolean;
}

export const UsdcBalanceDisplay: React.FC<UsdcBalanceDisplayProps> = ({ integrated = false }) => {
  const { usdcBalance } = useBalances();

  const formattedBalance = usdcBalance 
    ? tokenUnitsToReadable(usdcBalance, usdcInfo.decimals) 
    : '0';

  // Format large numbers with commas and limit decimal places
  const displayBalance = usdcBalance === null
    ? '...'
    : parseFloat(formattedBalance).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });

  return (
    <Container $integrated={integrated}>
      <UsdcIcon src={usdcSvg} alt="USDC" />
      <BalanceText>{displayBalance}</BalanceText>
    </Container>
  );
};

const Container = styled.div<{ $integrated: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: ${props => props.$integrated ? '0 16px 0 12px' : '6px 16px 6px 12px'};
  background: ${props => props.$integrated ? 'transparent' : '#1A1B1F'};
  border-radius: ${props => props.$integrated ? '0' : '24px'};
  cursor: default;
  height: 100%;
`;

const UsdcIcon = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
`;

const BalanceText = styled.span`
  font-family: 'Graphik';
  font-weight: 600;
  font-size: 14px;
  color: #ffffff;
  letter-spacing: 0.5px;
`;