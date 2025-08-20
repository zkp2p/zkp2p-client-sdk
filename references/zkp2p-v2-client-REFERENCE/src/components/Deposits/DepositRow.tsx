import React from "react";
import styled from 'styled-components';
import { colors } from '@theme/colors';
import { DepositStatus } from "@helpers/types/curator";
import { CurrencyType, PaymentPlatformType, currencyInfo, paymentPlatformInfo } from "@helpers/types";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@components/common/Skeleton";
import { usdcInfo } from "@helpers/types/tokens";

interface DepositRowProps {
  rowIndex: number;
  depositId: string;
  // token: TokenType;
  amount: string;
  availableLiquidity: string;
  status: DepositStatus;
  activeOrders: string[];
  conversionRates: Map<PaymentPlatformType, Map<CurrencyType, string>>;
  onWithdrawClick: () => void;
  onEditClick: () => void;
  isWithdrawLoading?: boolean;
  isLoading?: boolean;
}

export const DepositRow: React.FC<DepositRowProps> = ({
  rowIndex,
  depositId,
  // token,
  amount,
  availableLiquidity,
  status,
  activeOrders,
  conversionRates,
  onWithdrawClick,
  onEditClick,
  isWithdrawLoading,
  isLoading = false
}) => {
  const navigate = useNavigate();
  const tokenTicker = usdcInfo.ticker;
  const tokenIcon = usdcInfo.icon;

  const getStatusLabel = (): string => {
    switch (status) {
      case DepositStatus.ACTIVE:
        return 'Active';
      case DepositStatus.WITHDRAWN:
        return 'Paused';
      case DepositStatus.CLOSED:
        return 'Closed';
      default:
        return 'Unknown';
    }
  };

  const handleRowClick = () => {
    navigate(`/deposit/${depositId}`);
  };

  const getPaymentPlatforms = (): string => {
    if (conversionRates instanceof Map) {
      const platforms = Array.from(
        conversionRates.keys()
      ).map(platform => paymentPlatformInfo[platform].platformName)
        .filter(platform => platform !== 'Unknown');
      
      return platforms.join(', ');
    }
    
    return '';
  };

  const getCurrencies = (): string[] => {
    // Get unique currencies from all platforms
    const uniqueCurrencies = new Set<string>();
    
    // Iterate through each platform's currencies
    conversionRates.forEach(currencyMap => {
      currencyMap.forEach((_, currency) => {
        if (currency) {
          uniqueCurrencies.add(currency);
        }
      });
    });
    
    // Convert to array and get currency codes
    return Array.from(uniqueCurrencies)
      .map(currency => currencyInfo[currency]?.currencyCode || currency)
      .filter(code => code !== 'Unknown');
  };

  const getCurrencyFlags = () => {
    return getCurrencies().map((currencyCode, index) => {
      const currency = Object.keys(currencyInfo).find(
        key => currencyInfo[key].currencyCode === currencyCode
      );
      if (!currency) return null;
      
      return (
        <FlagIcon 
          key={index}
          className={`fi fi-${currencyInfo[currency].countryCode}`} 
        />
      );
    });
  };

  return (
    <Container onClick={isLoading ? undefined : handleRowClick}>
      <RowContent>
        {isLoading ? (
          <>
            <RowIndex><Skeleton width="30px" /></RowIndex>
            <AmountSection>
              <Skeleton width="24px" height="24px" borderRadius="18px" />
              <Skeleton width="100px" height="20px" />
            </AmountSection>
            <Value><Skeleton width="80px" /></Value>
            <Value><Skeleton width="120px" /></Value>
            <Value><Skeleton width="100px" /></Value>
            <StatusContainer>
              <Skeleton width="70px" height="28px" borderRadius="16px" />
            </StatusContainer>
          </>
        ) : (
          <>
            <RowIndex>{depositId}</RowIndex>
            <AmountSection>
              <TokenIcon src={tokenIcon} />
              <Amount>{parseFloat(amount)} {tokenTicker}</Amount>
            </AmountSection>
            <Value>{Number(availableLiquidity) === 0 ? '-' : `${parseFloat(availableLiquidity)} ${tokenTicker}`}</Value>
            <Value>{getPaymentPlatforms()}</Value>
            <Value>
              <CurrencyContainer>
                <FlagContainer>
                  {getCurrencyFlags()}
                </FlagContainer>
                <CurrencyText>{getCurrencies().join(', ')}</CurrencyText>
              </CurrencyContainer>
            </Value>
            <StatusContainer>
              <StatusBadge 
                active={status === DepositStatus.ACTIVE}
                paused={status === DepositStatus.WITHDRAWN}
              >
                {getStatusLabel()}
              </StatusBadge>
              {activeOrders.length > 0 && 
                <OrdersBadge>
                  {activeOrders.length} {activeOrders.length === 1 ? 'order' : 'orders'}
                </OrdersBadge>
              }
            </StatusContainer>
          </>
        )}
      </RowContent>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  
  &:hover {
    cursor: pointer;
    background-color: ${colors.rowSelectorHover};
  }
`;

const RowContent = styled.div`
  display: grid;
  grid-template-columns: 0.2fr 1fr 0.8fr 1.2fr 1.2fr 0.8fr;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  align-items: center;
`;

const RowIndex = styled.span`
  color: ${colors.grayText};
  font-size: 14px;
`;

const AmountSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TokenIcon = styled.img`
  border-radius: 18px;
  width: 24px;
  height: 24px;
`;

const Amount = styled.span`
  color: ${colors.white};
  font-size: 16px;
  font-weight: 500;
`;

const Value = styled.span`
  color: ${colors.white};
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StatusBadge = styled.div<{ active: boolean, paused: boolean }>`
  padding: 6px 12px;
  border-radius: 16px;
  background-color: ${props => props.active ? 'rgba(0, 128, 0, 0.1)' : props.paused ? 'rgba(255, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)'};
  color: ${props => props.active ? '#00FF00' : props.paused ? '#FFFF00' : '#FF6666'};
  font-size: 14px;
  font-weight: 500;
  width: fit-content;
`;

const StatusContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const OrdersBadge = styled.span`
  background-color: rgba(108, 117, 125, 0.2);
  color: #9AA3AF;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  height: fit-content;
  display: inline-flex;
  align-items: center;
`;

const ActionsSection = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const FlagContainer = styled.div`
  display: flex;
  margin-right: 8px;
`;

const FlagIcon = styled.span`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-block;
  background-size: 150%;
  background-position: center;
  margin-left: -6px;
  border: 1px solid ${colors.container};
  
  &:first-child {
    margin-left: 0;
  }
`;

const CurrencyContainer = styled.div`
  display: flex;
  align-items: center;
`;

const CurrencyText = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`; 
