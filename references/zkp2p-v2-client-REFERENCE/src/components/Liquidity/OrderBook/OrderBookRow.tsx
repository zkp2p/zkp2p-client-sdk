import React from 'react';
import styled from 'styled-components';
import { colors } from '@theme/colors';
import { ThemedText } from '@theme/text';
import { PaymentPlatformType, paymentPlatformInfo, PaymentPlatform } from '@helpers/types';

interface OrderLevel {
  price: number;
  totalAmount: number;
  cumulativeTotal?: number;
  orders: any[];
  orderCount: number;
  platforms: Set<PaymentPlatformType>;
  maxAPR: number | null;
}

interface OrderBookRowProps {
  level: OrderLevel;
  midPrice: number;
  maxTotal: number;
  onSelect?: () => void;
  isSelected?: boolean;
}

export const OrderBookRow: React.FC<OrderBookRowProps> = React.memo(({
  level,
  midPrice,
  maxTotal,
  onSelect,
  isSelected = false
}) => {
  const depthPercentage = (level.totalAmount / maxTotal) * 100;
  const spread = midPrice > 0 ? ((level.price - midPrice) / midPrice) * 100 : 0;
  const isBetterThanMarket = level.price < midPrice;
  
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
    if (apr === null || isNaN(apr)) return '-';
    return `${apr.toFixed(1)}%`;
  };

  return (
    <Row onClick={onSelect} isBetter={isBetterThanMarket} isSelected={isSelected} depthPercentage={depthPercentage}>
      <DepthBar percentage={depthPercentage} isBetter={isBetterThanMarket} />
      
      <PriceCell isBetter={isBetterThanMarket}>
        {formatPrice(level.price)}
        {level.orderCount > 1 && (
          <OrderCount>({level.orderCount})</OrderCount>
        )}
      </PriceCell>
      
      <SpreadCell spread={spread}>
        {spread >= 0 ? '+' : ''}{spread.toFixed(2)}%
      </SpreadCell>
      
      <AmountCell>
        {formatAmount(level.totalAmount)}
      </AmountCell>
      
      <TotalCell>
        {formatAmount(level.cumulativeTotal || level.totalAmount)}
      </TotalCell>
      
      
      <ProvidersCell>
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
      </ProvidersCell>
    </Row>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  // Only re-render if selection state changes for THIS row or if data changes
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.level.price === nextProps.level.price &&
    prevProps.level.totalAmount === nextProps.level.totalAmount &&
    prevProps.level.orderCount === nextProps.level.orderCount &&
    prevProps.midPrice === nextProps.midPrice &&
    prevProps.maxTotal === nextProps.maxTotal
  );
});

const Row = styled.div<{ isBetter: boolean; isSelected: boolean; depthPercentage: number }>`
  display: grid;
  grid-template-columns: 100px 90px 120px 120px 120px;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  border-radius: 4px;
  background-color: ${props => props.isSelected ? 'rgba(109, 114, 130, 0.15)' : 'transparent'};
  border-left: 3px solid ${props => props.isSelected ? colors.buttonDefault : 'transparent'};
  min-width: 640px;
  
  &:hover {
    background-color: ${props => props.isSelected ? 'rgba(109, 114, 130, 0.2)' : 'rgba(255, 255, 255, 0.03)'};
  }
`;

const OrderCount = styled.span`
  color: ${colors.grayText};
  font-size: 11px;
  margin-left: 4px;
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
  border-radius: 4px 0 0 4px;
`;

const Cell = styled.div`
  position: relative;
  z-index: 1;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
`;

const PriceCell = styled(Cell)<{ isBetter: boolean }>`
  color: ${props => props.isBetter ? colors.validGreen : colors.white};
  font-weight: 600;
  font-size: 15px;
`;

const SpreadCell = styled(Cell)<{ spread: number }>`
  color: ${props => props.spread < 0 ? colors.validGreen : props.spread > 5 ? colors.warningRed : colors.lightGrayText};
  font-size: 14px;
`;

const AmountCell = styled(Cell)`
  color: ${colors.white};
`;

const TotalCell = styled(Cell)`
  color: ${colors.lightGrayText};
`;


const ProvidersCell = styled(Cell)`
  display: flex;
  align-items: center;
`;

const PlatformLogo = styled.img`
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 4px;
  margin-right: -6px;
  border: 1px solid ${colors.container};
  background: ${colors.container};
  
  &:last-child {
    margin-right: 0;
  }
`;

const PlatformLogoFallback = styled.div<{ $backgroundColor?: string }>`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background-color: ${props => props.$backgroundColor || 'rgba(255, 255, 255, 0.1)'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  color: #FFFFFF;
  margin-right: -6px;
  border: 1px solid ${colors.container};
  
  &:last-child {
    margin-right: 0;
  }
`;

