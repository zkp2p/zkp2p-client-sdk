import React from 'react';
import styled from 'styled-components';
import { colors } from '@theme/colors';
import { Check } from 'react-feather';

export interface PlatformRowProps {
  platformName: string;
  platformLogo?: string;
  platformColor?: string;
  paymentMethods?: string[];
  isSelected: boolean;
  onRowClick: () => void;
  isLastRow?: boolean;
}

export const PlatformRow: React.FC<PlatformRowProps> = ({
  platformName,
  platformLogo,
  platformColor,
  paymentMethods = [],
  isSelected,
  onRowClick,
  isLastRow = false
}) => {
  return (
    <RowContainer 
      onClick={onRowClick} 
      $isSelected={isSelected}
      $isLastRow={isLastRow}
    >
      <RowLeft>
        <PlatformLogo>
          {platformLogo ? (
            <PlatformLogoImg src={platformLogo} alt={platformName} /> 
          ) : (
            <LogoFallback $backgroundColor={platformColor}>
              {platformName.charAt(0).toUpperCase()}
            </LogoFallback>
          )}
        </PlatformLogo>
        <PlatformName>{platformName}</PlatformName>
      </RowLeft>
      {paymentMethods.length > 1 && (
        <PaymentMethods>
          {paymentMethods.join(', ')}
        </PaymentMethods>
      )}
    </RowContainer>
  );
}; 


const RowContainer = styled.div<{ $isSelected: boolean; $isLastRow?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 12px;
  cursor: pointer;
  margin-bottom: 4px;
  background-color: ${props => props.$isSelected ? colors.iconButtonActive : 'transparent'};
  border-radius: 12px;
  height: 36px;
  
  &:hover {
    background-color: ${props => props.$isSelected ? colors.iconButtonActive : colors.selectorHover};
    border-radius: 12px;
  }
`;

const RowLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const PlatformLogo = styled.div`
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  font-weight: 600;
  font-size: 18px;
  overflow: hidden;
  padding: 0;
`;

const PlatformLogoImg = styled.img`
  width: 120%;
  height: 120%;
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
  transform: scale(1.1);
`;

const PlatformName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
`;

const PaymentMethods = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  text-align: right;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const LogoFallback = styled.div<{ $backgroundColor?: string }>`
  width: 28px;
  height: 28px;
  background-color: ${props => props.$backgroundColor || colors.defaultBorderColor};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  text-transform: uppercase;
`;

const StyledCheck = styled(Check)`
  color: ${colors.iconButtonActive};
`;