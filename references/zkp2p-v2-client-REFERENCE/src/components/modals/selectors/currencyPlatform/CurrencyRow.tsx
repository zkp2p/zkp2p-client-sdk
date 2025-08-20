import React from 'react';
import styled from 'styled-components';
import "flag-icons/css/flag-icons.min.css";

import { CurrencyType, currencyInfo } from '@helpers/types';
import { colors } from '@theme/colors';


export interface CurrencyRowProps {
  currency: CurrencyType;
  isSelected: boolean;
  onRowClick: () => void;
  isLastRow: boolean;
}

export const CurrencyRow: React.FC<CurrencyRowProps> = ({ 
  currency, 
  isSelected, 
  onRowClick,
  isLastRow
}) => {
  return (
    <RowContainer 
      onClick={onRowClick} 
      $isSelected={isSelected}
      $isLastRow={isLastRow}
    >
      <RowLeft>
        <FlagIconRow className={`fi fi-${currencyInfo[currency].countryCode}`} />
        <RowContent>
          <CurrencyCode>{currencyInfo[currency].currencyCode}</CurrencyCode>
          <CurrencyName>{currencyInfo[currency].currencyName}</CurrencyName>
        </RowContent>
      </RowLeft>
    </RowContainer>
  );
}; 


const RowContainer = styled.div<{ $isSelected: boolean; $isLastRow?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 12px;
  // height: 36px;
  cursor: pointer;
  margin-bottom: 4px;
  background-color: ${props => props.$isSelected ? colors.iconButtonActive : 'transparent'};
  border-radius: 12px;
  
  &:hover {
    background-color: ${props => props.$isSelected ? colors.iconButtonActive : colors.selectorHover};
    border-radius: 12px;
  }
`;

const RowLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const RowContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 36px;
`;

const FlagIconRow = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 45%;
  display: inline-block;
  background-size: cover;
  background-position: center;
`;

const CurrencyCode = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
`;

const CurrencyName = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
`;