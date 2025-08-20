import React from "react";
import styled from 'styled-components';
import { colors } from '@theme/colors';
import { DepositStatus } from "@helpers/types/curator";
import { CurrencyType, PaymentPlatformType, currencyInfo, paymentPlatformInfo } from "@helpers/types";
import { usdcInfo } from "@helpers/types/tokens";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@components/common/Skeleton";

interface DepositRowMobileProps {
  depositId: string;
  // token: string;
  amount: string;
  availableLiquidity: string;
  status: DepositStatus;
  activeOrders: string[];
  conversionRates: Map<PaymentPlatformType, Map<CurrencyType, string>>;
  isLoading?: boolean;
}

export const DepositRowMobile: React.FC<DepositRowMobileProps> = ({
  depositId,
  // token,
  amount,
  availableLiquidity,
  status,
  activeOrders,
  conversionRates,
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
    const uniqueCurrencies = new Set<string>();
    
    conversionRates.forEach(currencyMap => {
      currencyMap.forEach((_, currency) => {
        if (currency) {
          uniqueCurrencies.add(currency);
        }
      });
    });
    
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

  if (isLoading) {
    return (
      <Container>
        <Header>
          <Skeleton width="100px" height="24px" />
          <StatusSkeleton>
            <Skeleton width="70px" height="28px" borderRadius="16px" />
          </StatusSkeleton>
        </Header>
        <Content>
          <AmountSection>
            <Skeleton width="24px" height="24px" borderRadius="18px" />
            <Skeleton width="120px" height="24px" />
          </AmountSection>
          
          <InfoSection>
            <InfoRow>
              <Label>Available</Label>
              <Skeleton width="80px" />
            </InfoRow>
            <InfoRow>
              <Label>Platforms</Label>
              <Skeleton width="120px" />
            </InfoRow>
            <InfoRow>
              <Label>Currencies</Label>
              <Skeleton width="100px" />
            </InfoRow>
          </InfoSection>
        </Content>
      </Container>
    );
  }

  return (
    <Container onClick={handleRowClick}>
      <Header>
        <DepositIdText>Deposit #{depositId}</DepositIdText>
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
      </Header>
      
      <Content>
        <AmountSection>
          <TokenIcon src={tokenIcon} />
          <Amount>{parseFloat(amount)} {tokenTicker}</Amount>
        </AmountSection>
        
        <InfoSection>
          {status !== DepositStatus.CLOSED && (
            <InfoRow>
              <Label>Available</Label>
              <Value>{Number(availableLiquidity) === 0 ? '-' : `${parseFloat(availableLiquidity)} ${tokenTicker}`}</Value>
            </InfoRow>
          )}
          <InfoRow>
            <Label>Platforms</Label>
            <Value>{getPaymentPlatforms()}</Value>
          </InfoRow>
          <InfoRow>
            <Label>Currencies</Label>
            <CurrencyContainer>
              <FlagContainer>
                {getCurrencyFlags()}
              </FlagContainer>
              <Value>{getCurrencies().join(', ')}</Value>
            </CurrencyContainer>
          </InfoRow>
        </InfoSection>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  background: ${colors.container};
  padding: 16px;
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  
  &:hover {
    background-color: ${colors.rowSelectorHover};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const DepositIdText = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: ${colors.white};
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const AmountSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TokenIcon = styled.img`
  border-radius: 18px;
  width: 24px;
  height: 24px;
`;

const Amount = styled.span`
  color: ${colors.white};
  font-size: 18px;
  font-weight: 500;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Label = styled.span`
  color: ${colors.grayText};
  font-size: 14px;
  margin-right: 20px;
`;

const Value = styled.span`
  color: ${colors.white};
  font-size: 14px;
  text-align: right;
`;

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusSkeleton = styled.div`
  height: 28px;
`;

const StatusBadge = styled.div<{ active: boolean, paused: boolean }>`
  padding: 4px 10px;
  border-radius: 16px;
  background-color: ${props => props.active ? 'rgba(0, 128, 0, 0.1)' : props.paused ? 'rgba(255, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)'};
  color: ${props => props.active ? '#00FF00' : props.paused ? '#FFFF00' : '#FF6666'};
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
`;

const OrdersBadge = styled.span`
  background-color: rgba(108, 117, 125, 0.2);
  color: #9AA3AF;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  height: fit-content;
  display: inline-flex;
  align-items: center;
`;

const FlagContainer = styled.div`
  display: flex;
  justify-content: flex-end;
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
  justify-content: flex-end;
`; 