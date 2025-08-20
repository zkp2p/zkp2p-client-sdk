import React, { useMemo, useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { colors } from '@theme/colors';
import { ThemedText } from '@theme/text';
import { CurrencyType } from '@helpers/types';
import { PaymentPlatformType } from '@helpers/types';
import useCurrencyPrices from '@hooks/useCurrencyPrices';
import { Currency } from '@helpers/types/currency';
import { currencies } from '@helpers/types';
import { OrderBookRow } from './OrderBookRow';
import { OrderBookMobile } from './OrderBookMobile';
import { OrderBookBuyPanel } from './OrderBookBuyPanel';
import useMediaQuery from '@hooks/useMediaQuery';

interface LiquidityRowData {
  depositId: string;
  depositor: string;
  availableLiquidity: string;
  currency: CurrencyType;
  conversionRate: string;
  platform: PaymentPlatformType;
  intentAmountRange: {
    min: string;
    max: string;
  };
  apr: number | null;
  spread: number | null;
  hashedOnchainId: string;
}

interface OrderLevel {
  price: number;
  totalAmount: number;
  cumulativeTotal?: number;
  orders: LiquidityRowData[];
  orderCount: number;
  platforms: Set<PaymentPlatformType>;
  maxAPR: number | null;
}

interface OrderBookViewProps {
  liquidityRows: LiquidityRowData[];
  selectedCurrency: CurrencyType | null;
  onOrderSelect?: (order: LiquidityRowData) => void;
}

export const OrderBookView: React.FC<OrderBookViewProps> = ({
  liquidityRows,
  selectedCurrency,
  onOrderSelect
}) => {
  // ========== HOOKS SECTION - All hooks must be called unconditionally ==========
  // Device and media query hooks
  const currentDeviceSize = useMediaQuery();
  const isMobile = currentDeviceSize === 'mobile';
  
  // Data fetching hooks
  const { prices: currencyPrices } = useCurrencyPrices(currencies, Currency.USD);
  
  // State hooks
  const [selectedOrder, setSelectedOrder] = useState<LiquidityRowData | null>(null);
  const [selectedPriceLevel, setSelectedPriceLevel] = useState<number | null>(null);
  const [hasUserSelected, setHasUserSelected] = useState(false);

  // Group and sort orders by price
  const { orderLevels, midPrice, bestPrice, worstPrice } = useMemo(() => {
    if (!selectedCurrency || liquidityRows.length === 0) {
      return { orderLevels: [], midPrice: 0, bestPrice: 0, worstPrice: 0 };
    }

    const currencyPrice = currencyPrices[selectedCurrency] || 1;
    
    // Group orders by price level
    const priceGroups = new Map<number, OrderLevel>();
    
    liquidityRows.forEach(row => {
      if (row.currency !== selectedCurrency) return;
      
      const price = parseFloat(row.conversionRate);
      const amount = parseFloat(row.availableLiquidity);
      
      if (!priceGroups.has(price)) {
        priceGroups.set(price, {
          price,
          totalAmount: 0,
          orders: [],
          orderCount: 0,
          platforms: new Set(),
          maxAPR: null
        });
      }
      
      const level = priceGroups.get(price)!;
      level.totalAmount += amount;
      level.orders.push(row);
      level.orderCount++;
      level.platforms.add(row.platform);
      
      // Track max APR at this price level
      if (row.apr !== null) {
        level.maxAPR = level.maxAPR === null ? row.apr : Math.max(level.maxAPR, row.apr);
      }
    });

    // Convert to array and sort by price (best to worst for buyers)
    const sortedLevels = Array.from(priceGroups.values()).sort((a, b) => a.price - b.price);
    
    // Calculate cumulative totals
    let cumulativeTotal = 0;
    sortedLevels.forEach(level => {
      cumulativeTotal += level.totalAmount;
      (level as any).cumulativeTotal = cumulativeTotal;
    });
    
    // Best price is the lowest (best for buyers)
    const best = sortedLevels.length > 0 ? sortedLevels[0].price : 0;
    const worst = sortedLevels.length > 0 ? sortedLevels[sortedLevels.length - 1].price : 0;

    return {
      orderLevels: sortedLevels,
      midPrice: currencyPrice,
      bestPrice: best,
      worstPrice: worst
    };
  }, [liquidityRows, selectedCurrency, currencyPrices]);

  // Auto-select best price level when currency changes (but not a specific order)
  useEffect(() => {
    if (!hasUserSelected && orderLevels.length > 0 && selectedCurrency) {
      // Select the best price level only
      setSelectedOrder(null);
      setSelectedPriceLevel(orderLevels[0].price);
    }
  }, [selectedCurrency, orderLevels, hasUserSelected]);

  // Reset selection when currency changes
  useEffect(() => {
    setSelectedOrder(null);
    setSelectedPriceLevel(null);
    setHasUserSelected(false);
  }, [selectedCurrency]);

  // Get all orders at the selected price level, grouped by payment platform
  // This must be before any conditional returns
  const ordersAtSelectedPrice = useMemo(() => {
    if (!selectedPriceLevel) return new Map<string, LiquidityRowData[]>();
    const level = orderLevels.find(l => l.price === selectedPriceLevel);
    if (!level) return new Map<string, LiquidityRowData[]>();
    
    // Group all orders by payment platform (Revolut, Monzo, etc.)
    const platformGroups = new Map<string, LiquidityRowData[]>();
    level.orders.forEach(order => {
      const platform = order.platform;
      if (!platformGroups.has(platform)) {
        platformGroups.set(platform, []);
      }
      platformGroups.get(platform)!.push(order);
    });
    
    // Return the raw platform groups - we'll aggregate in the BuyPanel
    return platformGroups;
  }, [selectedPriceLevel, orderLevels]);

  // Handler functions defined before conditional returns
  const handlePriceLevelClick = useCallback((level: OrderLevel) => {
    // Batch state updates to prevent multiple renders
    React.startTransition(() => {
      setSelectedOrder(null);
      setSelectedPriceLevel(level.price);
      setHasUserSelected(true);
    });
  }, []);

  const handleOrderChange = useCallback((order: LiquidityRowData | null) => {
    setSelectedOrder(order);
  }, []);

  const handleOrderCreated = useCallback(() => {
    // Keep the selected order after creation for continuous trading
    onOrderSelect?.(selectedOrder!);
  }, [selectedOrder, onOrderSelect]);

  const maxTotal = useMemo(() => Math.max(...orderLevels.map(l => l.cumulativeTotal || l.totalAmount), 1), [orderLevels]);

  // ========== RENDER SECTION - Conditional returns are safe after all hooks ==========
  if (isMobile) {
    return (
      <OrderBookMobile
        orderLevels={orderLevels}
        midPrice={midPrice}
        bestPrice={bestPrice}
        currency={selectedCurrency}
        onOrderSelect={onOrderSelect}
      />
    );
  }

  if (!selectedCurrency) {
    return (
      <EmptyStateContainer>
        <ThemedText.BodyPrimary>
          Please select a currency to view the order book
        </ThemedText.BodyPrimary>
      </EmptyStateContainer>
    );
  }

  if (liquidityRows.length === 0) {
    return (
      <EmptyStateContainer>
        <ThemedText.BodyPrimary>
          No orders available for {selectedCurrency}
        </ThemedText.BodyPrimary>
      </EmptyStateContainer>
    );
  }

  return (
    <Container>
      <MainContent>
        <OrderBookSection>
          
          <ColumnHeaders>
            <ColumnHeader>Price</ColumnHeader>
            <ColumnHeader>Spread</ColumnHeader>
            <ColumnHeader>Amount</ColumnHeader>
            <ColumnHeader>Total</ColumnHeader>
            <ColumnHeader>Providers</ColumnHeader>
          </ColumnHeaders>

          <OrderBookContent>
            {orderLevels.map((level, index) => {
              // Find if this is the mid-price level
              const showMidPriceAbove = index === 0 ? false : 
                orderLevels[index - 1].price < midPrice && level.price >= midPrice;
              
              return (
                <React.Fragment key={`level-${level.price}`}>
                  {showMidPriceAbove && (
                    <MidPriceIndicator>
                      <MidPriceLine />
                      <MidPriceLabel>
                        Market: {midPrice.toFixed(4)} {selectedCurrency}
                      </MidPriceLabel>
                      <MidPriceLine />
                    </MidPriceIndicator>
                  )}
                  <OrderBookRow
                    level={level}
                    midPrice={midPrice}
                    maxTotal={maxTotal}
                    onSelect={() => handlePriceLevelClick(level)}
                    isSelected={selectedPriceLevel === level.price}
                  />
                </React.Fragment>
              );
            })}
          </OrderBookContent>
        </OrderBookSection>

        <BuyPanelContainer>
          {selectedPriceLevel !== null && ordersAtSelectedPrice.size > 0 ? (
            <OrderBookBuyPanel
              order={selectedOrder}
              platformGroups={ordersAtSelectedPrice}
              selectedPrice={selectedPriceLevel}
              onOrderChange={handleOrderChange}
              onOrderCreated={handleOrderCreated}
            />
          ) : (
            <EmptyBuyPanel>
              <EmptyBuyPanelContent>
                <ThemedText.SubHeaderLarge>Select an Order</ThemedText.SubHeaderLarge>
                <EmptyBuyPanelText>
                  Click on any price level in the order book to view details and create a buy order
                </EmptyBuyPanelText>
                {orderLevels.length > 0 && (
                  <SuggestedAction>
                    <ThemedText.BodySmall style={{ color: colors.grayText }}>
                      Best available price: {bestPrice.toFixed(4)} {selectedCurrency}/USDC
                    </ThemedText.BodySmall>
                  </SuggestedAction>
                )}
              </EmptyBuyPanelContent>
            </EmptyBuyPanel>
          )}
        </BuyPanelContainer>
      </MainContent>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.div`
  display: flex;
  gap: 1.5rem;
  width: 100%;
  flex: 1;
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  box-sizing: border-box;
  overflow: hidden;
  min-height: 0;
`;

const OrderBookSection = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  max-width: calc(100% - 344px); /* 320px panel + 24px gap */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: ${colors.grayText};
`;


const ColumnHeaders = styled.div`
  display: grid;
  grid-template-columns: 100px 90px 120px 120px 120px;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  padding-left: 0.75rem;
  color: ${colors.grayText};
  font-size: 14px;
  min-width: 640px;
`;

const MidPriceIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0.75rem;
  margin: 0.25rem 0;
`;

const MidPriceLine = styled.div`
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
`;

const MidPriceLabel = styled.div`
  font-size: 12px;
  color: ${colors.white};
  font-weight: 600;
  white-space: nowrap;
`;

const ColumnHeader = styled.div`
  font-weight: 500;
`;

const OrderBookContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  min-height: 0;
  max-height: 500px;
  
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${colors.defaultBorderColor};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-corner {
    background: transparent;
  }
`;

const BuyPanelContainer = styled.div`
  width: 320px;
  flex: 0 0 320px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
`;

const EmptyBuyPanel = styled.div`
  width: 100%;
  height: fit-content;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 350px;
`;

const EmptyBuyPanelContent = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 240px;
`;

const EmptyBuyPanelText = styled.div`
  color: ${colors.grayText};
  font-size: 13px;
  line-height: 1.4;
`;

const SuggestedAction = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid ${colors.defaultBorderColor};
`;