import React from "react";
import styled from 'styled-components';
import { colors } from '@theme/colors';
import useTokenData from '@hooks/contexts/useTokenData';

interface TokenRowProps {
  token: string;
  isSelected: boolean;
  tokenSvg: string;
  onRowClick: () => void;
}

export const TokenRow: React.FC<TokenRowProps> = ({
  token,
  isSelected, 
  tokenSvg,
  onRowClick
}: TokenRowProps) => {
  TokenRow.displayName = "TokenRow";

  /*
   * Contexts
   */
  const { tokenInfo } = useTokenData();
  const tokenData = tokenInfo[token];

  if (!tokenData) {
    return null;
  }

  return (
    <Container
      onClick={onRowClick}
      selected={isSelected}
    >
      <DetailsContainer>
        <TokenIconContainer>
          <TokenSvg src={tokenData.icon} />
          <ChainIconWrapper>
            <ChainSvg src={tokenData.chainIcon} />
          </ChainIconWrapper>
        </TokenIconContainer>
        <TokenAndNameLabel>
          <TokenTicker>{tokenData.ticker}</TokenTicker>
          <NameContainer>
            <TokenName>{tokenData.name}</TokenName>
            <TokenChain>{tokenData.chainName}</TokenChain>
          </NameContainer>
        </TokenAndNameLabel>
      </DetailsContainer>
    </Container>
  );
};

const Container = styled.div<{ selected: boolean }>`
  display: flex;
  flex-direction: row;
  height: 54px;
  padding: 12px 24px 12px 20px;

  ${({ selected }) => selected && `
    background-color: ${colors.rowSelectorColor};
    box-shadow: none;
  `}

  ${({ selected }) => !selected && `
    &:hover {
      background-color: ${colors.rowSelectorHover};
      box-shadow: none;
    }
  `}
`;

const DetailsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex: 1;
`;

const TokenAndNameLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-grow: 1;
`;

const TokenTicker = styled.div`
  display: flex;
  flex-direction: row;
  padding-top: 2px;
  color: #FFFFFF;
`;

const NameContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TokenName = styled.div`
  color: ${colors.grayText};
  font-size: 14px;
  text-align: right;
`;

const TokenIconContainer = styled.div`
  position: relative;
  width: 36px;
  height: 36px;
`;

const TokenSvg = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 18px;
`;

const ChainIconWrapper = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1E2230;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #1E2230;
`;

const ChainSvg = styled.img`
  width: 14px;
  height: 14px;
  border-radius: 50%;
`;

const TokenChain = styled.div`
  color: ${colors.grayText};
  font-size: 12px;
  opacity: 0.7;
  text-align: right;
`;
