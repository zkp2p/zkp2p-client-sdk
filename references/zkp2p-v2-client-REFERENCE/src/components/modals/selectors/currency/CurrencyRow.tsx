import React from "react";
import styled from 'styled-components';
import { colors } from '@theme/colors';
import { currencyInfo, CurrencyType } from '@helpers/types/currency';

interface CurrencyRowProps {
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
}: CurrencyRowProps) => {
  CurrencyRow.displayName = "CurrencyRow";

  return (
    <Container
      onClick={onRowClick}
      selected={isSelected}
      isLastRow={isLastRow}
    >
      <DetailsContainer>
        <FlagIcon className={`fi fi-${currencyInfo[currency].countryCode}`} />
        <CurrencyLabelAndNameContainer>
          <CurrencyCode>{currencyInfo[currency].currencyCode}</CurrencyCode>
          <CurrencyName>{currencyInfo[currency].currencyName}</CurrencyName>
        </CurrencyLabelAndNameContainer>
      </DetailsContainer>
    </Container>
  );
};

const Container = styled.div<{ selected: boolean, isLastRow: boolean }>`
  display: flex;
  flex-direction: row;
  height: 54px;
  padding: 12px 24px 12px 24px;
  
  ${({ selected }) => selected && `
    background-color: ${colors.rowSelectorColor};
    box-shadow: none;
  `}

  ${({ selected, isLastRow }) => !selected && `
    &:hover {
      background-color: ${colors.rowSelectorHover};
      box-shadow: none;
      border-radius: ${isLastRow ? '0 0 16px 16px' : '0'};
    }
  `}
`;

const DetailsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex: 1;
`;

const CurrencyLabelAndNameContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-grow: 1;
`;

const CurrencyCode = styled.div`
  display: flex;
  flex-direction: row;
  padding-top: 2px;
  color: #FFFFFF;
`;

const CurrencyName = styled.div`
  color: ${colors.grayText};
  padding-top: 2px;
  text-align: right;

  @media (max-width: 600px) {
    font-size: 14px;
  }
`;

const FlagIcon = styled.span`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  display: inline-block;
  background-size: 150%;
  background-position: center;
`;
