import React from 'react';
import styled from 'styled-components';
import { colors } from '@theme/colors';
import { ThemedText } from '@theme/text';
import { CurrencyType } from '@helpers/types';
import { PaymentPlatformType, paymentPlatformInfo, PaymentPlatform } from '@helpers/types';

interface OrderLevel {
  price: number;
  totalAmount: number;
  orders: any[];
  orderCount: number;
  platforms: Set<PaymentPlatformType>;
  maxAPR: number | null;
}

interface OrderBookMobileProps {
  orderLevels: OrderLevel[];
  midPrice: number;
  bestPrice: number;
  currency: CurrencyType | null;
  onOrderSelect?: (order: any) => void;
}

export const OrderBookMobile: React.FC<OrderBookMobileProps> = ({
  orderLevels,
  midPrice,
  bestPrice,
  currency,
  onOrderSelect
}) => {
  const formatPrice = (price: number) => price.toFixed(4);
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(2);
  };

  const formatAPR = (apr: number | null) => {
    if (apr === null || isNaN(apr)) return null;
    return `${apr.toFixed(1)}% APR`;
  };

  const worstPrice = orderLevels.length > 0 ? orderLevels[orderLevels.length - 1].price : 0;
  const priceRange = bestPrice > 0 && worstPrice > 0 ? ((worstPrice - bestPrice) / bestPrice) * 100 : 0;

  // Calculate total liquidity
  const totalLiquidity = orderLevels.reduce((sum, level) => sum + level.totalAmount, 0);
  const totalOrders = orderLevels.reduce((sum, level) => sum + level.orderCount, 0);

  return (
    <Container>
      <SummaryCard>
        <MarketTitle>
          <ThemedText.SubHeaderSmall>Market Overview</ThemedText.SubHeaderSmall>
        </MarketTitle>
        <SummaryGrid>
          <SummaryItem>
            <SummaryLabel>Best Price</SummaryLabel>
            <BestPriceValue>
              {bestPrice > 0 ? formatPrice(bestPrice) : '-'}
              {currency && <CurrencyLabel>{currency}/USDC</CurrencyLabel>}
            </BestPriceValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Mid Price</SummaryLabel>
            <SummaryValue>
              {formatPrice(midPrice)}
              {currency && <CurrencyLabel>{currency}/USDC</CurrencyLabel>}
            </SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Total Liquidity</SummaryLabel>
            <SummaryValue>
              {formatAmount(totalLiquidity)} USDC
            </SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Active Orders</SummaryLabel>
            <SummaryValue>{totalOrders}</SummaryValue>
          </SummaryItem>
        </SummaryGrid>
      </SummaryCard>

      <OrdersHeader>
        <ThemedText.BodyPrimary>Order Book</ThemedText.BodyPrimary>
        <OrderCount>{orderLevels.length} price levels</OrderCount>
      </OrdersHeader>

      <OrdersContainer>
        {orderLevels.length === 0 ? (
          <EmptyState>
            <ThemedText.BodySecondary>
              No orders available
            </ThemedText.BodySecondary>
          </EmptyState>
        ) : (
          orderLevels.map((level, index) => {
            const spread = midPrice > 0 ? ((level.price - midPrice) / midPrice) * 100 : 0;
            const isBetter = level.price < midPrice;
            const depthPercentage = (level.totalAmount / totalLiquidity) * 100;
            
            // Find if this is the mid-price level
            const showMidPriceAbove = index === 0 ? false : 
              orderLevels[index - 1].price < midPrice && level.price >= midPrice;
            
            return (
              <React.Fragment key={`level-${level.price}`}>
                {showMidPriceAbove && (
                  <MidPriceIndicator>
                    <MidPriceLine />
                    <MidPriceLabel>Market {formatPrice(midPrice)}</MidPriceLabel>
                    <MidPriceLine />
                  </MidPriceIndicator>
                )}
                
                <OrderCard
                  isBetter={isBetter}
                  depthPercentage={depthPercentage}
                >
                <DepthBar percentage={depthPercentage} isBetter={isBetter} />
                
                <OrderContent>
                  <LeftSection>
                    <PriceRow>
                      <OrderPrice isBetter={isBetter}>
                        {formatPrice(level.price)}
                      </OrderPrice>
                      <SpreadBadge spread={spread}>
                        {spread >= 0 ? '+' : ''}{spread.toFixed(1)}%
                      </SpreadBadge>
                    </PriceRow>
                    
                    <InfoRow>
                      <OrderAmount>{formatAmount(level.totalAmount)} USDC</OrderAmount>
                      <OrderMeta>• {level.orderCount} {level.orderCount === 1 ? 'order' : 'orders'}</OrderMeta>
                      {level.maxAPR !== null && !isNaN(level.maxAPR) && (
                        <APRText>• {formatAPR(level.maxAPR)}</APRText>
                      )}
                    </InfoRow>
                  </LeftSection>
                  
                  {level.platforms.size > 0 && (
                    <PlatformList>
                      {Array.from(level.platforms).map((platform) => {
                        const platformConfig = paymentPlatformInfo[platform];
                        
                        // Skip unknown platforms
                        if (!platformConfig) {
                          console.warn(`Skipping unknown platform in orderbook: ${platform}`);
                          return null;
                        }
                        
                        // For Venmo and PayPal, show letter fallbacks
                        if (platform === PaymentPlatform.VENMO || platform === PaymentPlatform.PAYPAL) {
                          return (
                            <PlatformLogoFallback 
                              key={platform}
                              $backgroundColor={platformConfig.platformColor}
                            >
                              {platform === PaymentPlatform.VENMO ? 'V' : 'P'}
                            </PlatformLogoFallback>
                          );
                        }
                        
                        // For other platforms with logos
                        if (platformConfig.platformLogo) {
                          return (
                            <PlatformLogo 
                              key={platform}
                              src={platformConfig.platformLogo} 
                              alt={platformConfig.platformName}
                            />
                          );
                        }
                        
                        // Generic fallback for recognized platforms without logos
                        return (
                          <PlatformLogoFallback 
                            key={platform}
                            $backgroundColor={platformConfig.platformColor}
                          >
                            {platformConfig.platformName[0] || '?'}
                          </PlatformLogoFallback>
                        );
                      })}
                    </PlatformList>
                  )}
                </OrderContent>
              </OrderCard>
              </React.Fragment>
            );
          })
        )}
      </OrdersContainer>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem;
  max-width: 100%;
`;

const SummaryCard = styled.div`
  background: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const MarketTitle = styled.div`
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${colors.defaultBorderColor};
  margin-bottom: 0.5rem;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SummaryLabel = styled.div`
  font-size: 11px;
  color: ${colors.grayText};
  text-transform: uppercase;
  font-weight: 500;
`;

const SummaryValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${colors.white};
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const BestPriceValue = styled(SummaryValue)`
  color: ${colors.validGreen};
`;

const CurrencyLabel = styled.span`
  font-size: 10px;
  color: ${colors.grayText};
  font-weight: 400;
`;

const OrdersHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.5rem;
`;

const OrderCount = styled.span`
  font-size: 12px;
  color: ${colors.grayText};
`;

const OrdersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  background: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px;
`;

const OrderCard = styled.div<{ isBetter: boolean; depthPercentage: number }>`
  background: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  border-left: 3px solid ${props => props.isBetter ? colors.validGreen : colors.lightGrayText};
  border-radius: 8px;
  padding: 0.625rem;
  position: relative;
  overflow: hidden;
`;

const DepthBar = styled.div<{ percentage: number; isBetter: boolean }>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: ${props => Math.min(props.percentage * 0.5, 50)}%;
  background: ${props => props.isBetter 
    ? 'rgba(75, 181, 67, 0.15)' 
    : 'rgba(223, 46, 45, 0.12)'};
  pointer-events: none;
  z-index: 0;
  border-radius: 8px 0 0 8px;
`;

const OrderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
  gap: 0.5rem;
`;

const LeftSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const OrderPrice = styled.div<{ isBetter: boolean }>`
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.isBetter ? colors.validGreen : colors.white};
`;

const SpreadBadge = styled.span<{ spread: number }>`
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 3px;
  background: ${props => props.spread < 0 ? 'rgba(75, 181, 67, 0.15)' : 'rgba(223, 46, 45, 0.08)'};
  color: ${props => props.spread < 0 ? colors.validGreen : colors.lightGrayText};
  font-weight: 500;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
`;

const OrderAmount = styled.span`
  font-size: 12px;
  color: ${colors.white};
  font-weight: 500;
`;

const OrderMeta = styled.span`
  font-size: 11px;
  color: ${colors.grayText};
`;

const APRText = styled.span`
  font-size: 11px;
  color: ${colors.validGreen};
  font-weight: 500;
`;

const PlatformList = styled.div`
  display: flex;
  align-items: center;
  gap: -4px;
  flex-shrink: 0;
`;

const PlatformLogo = styled.img`
  width: 20px;
  height: 20px;
  object-fit: contain;
  border-radius: 3px;
  border: 1px solid ${colors.container};
  background: ${colors.container};
  margin-left: -4px;
  
  &:first-child {
    margin-left: 0;
  }
`;

const PlatformLogoFallback = styled.div<{ $backgroundColor?: string }>`
  width: 20px;
  height: 20px;
  border-radius: 3px;
  background-color: ${props => props.$backgroundColor || 'rgba(255, 255, 255, 0.1)'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 11px;
  color: #FFFFFF;
  border: 1px solid ${colors.container};
  margin-left: -4px;
  
  &:first-child {
    margin-left: 0;
  }
`;

const MidPriceIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  margin: 0.25rem 0;
`;

const MidPriceLine = styled.div`
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
`;

const MidPriceLabel = styled.div`
  font-size: 11px;
  color: ${colors.white};
  font-weight: 600;
  white-space: nowrap;
`;