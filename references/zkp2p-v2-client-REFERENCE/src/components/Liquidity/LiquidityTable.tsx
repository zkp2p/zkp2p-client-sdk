import React, { useEffect, useState } from "react";
import { Link as LinkIcon, Filter, Sliders } from "react-feather";
import Link from "@mui/material/Link";
import styled, { css } from "styled-components";
import { colors } from "@theme/colors";
import { ThemedText } from "@theme/text";
import { useNavigate } from "react-router-dom";

import { CurrencyType, currencies, getCurrencyInfoFromHash } from "@helpers/types";
import { usdcInfo } from "@helpers/types/tokens";
import { PaymentPlatformType, paymentPlatformInfo, paymentPlatforms } from "@helpers/types";
import { tokenUnitsToReadable, etherUnitsToReadable, usdcUnits } from "@helpers/units";
import { Currency, isSupportedCurrency } from "@helpers/types/currency";
import { AccessoryButton } from "@components/common/AccessoryButton";
import SortableColumnHeader from "@components/common/SortableColumnHeader";
import { CurrencyFilter, PlatformFilter, AmountFilter } from "@components/common/Filters";
import { ZERO_ADDRESS, DUST_THRESHOLD_USD } from "@helpers/constants";
import { APR_DOCS_LINK } from "@helpers/docUrls";
import useGeolocation from "@hooks/contexts/useGeolocation";
import useMediaQuery from "@hooks/useMediaQuery";
import useLiquidity from "@hooks/contexts/useLiquidity";
import useSmartContracts from "@hooks/contexts/useSmartContracts";
import useCurrencyPrices from "@hooks/useCurrencyPrices";
import { useDuneVolume } from "@hooks/useDuneVolume";
import useOnRamperIntents from "@hooks/contexts/useOnRamperIntents";
import useAccount from "@hooks/contexts/useAccount";
import useSessionStorage from "@hooks/useSessionStorage";

import { LiquidityRow } from "./LiquidityRow";
import { LiquidityRowMobile } from "./LiquidityRowMobile";
import { OrderBookView } from "./OrderBook";
import { BuyModal } from "@components/Deposit/Buy/BuyModal";
import { MoreFiltersDropdown } from "./MoreFiltersDropdown";

import useQuery from "@hooks/useQuery";
import { calculateAPR } from "@helpers/aprHelper";

const DEFAULT_ROWS_PER_PAGE = 10;
const ROWS_PER_PAGE_OPTIONS = [10, 30];

interface LiquidityRowData {
  depositId: string;
  depositor: string;
  // token: TokenType;
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

export const LiquidityTable: React.FC = () => {
  LiquidityTable.displayName = "LiquidityTable";
  /*
   * Contexts
   */

  const navigate = useNavigate();
  const currentDeviceSize = useMediaQuery();
  const isMobile = currentDeviceSize === "mobile";

  const { addressToPlatform } = useSmartContracts();
  const { depositViews } = useLiquidity();
  const { currencyCode } = useGeolocation();
  const { queryParams } = useQuery();
  const { platformVolumes, platformLiquidities } = useDuneVolume();
  const { currentIntentHash } = useOnRamperIntents();
  const { loggedInEthereumAddress } = useAccount();

  /*
   * State
   */

  const [viewMode, setViewMode] = useState<"orderbook" | "table">(() => {
    const stored = sessionStorage.getItem("liquidityViewMode");
    return stored === "table" || stored === "orderbook" ? stored : "orderbook";
  });

  const [liquidityRows, setLiquidityRows] = useState<LiquidityRowData[]>([]);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [sortColumn, setSortColumn] = useState<string | null>("price");

  // Use useSessionStorage hook for currency (matching Swap page)
  const [selectedCurrency, setSelectedCurrency] = useSessionStorage<CurrencyType | null>(
    "lastUsedFiatCurrency",
    queryParams.REFERRER_FROM_CURRENCY
      ? isSupportedCurrency(queryParams.REFERRER_FROM_CURRENCY)
        ? queryParams.REFERRER_FROM_CURRENCY
        : "USD"
      : null
  );
  const [selectedPlatform, setSelectedPlatform] = useState<PaymentPlatformType | null>(null);
  const [allPlatforms, setAllPlatforms] = useState<PaymentPlatformType[]>(paymentPlatforms);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [paginatedData, setPaginatedData] = useState<LiquidityRowData[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_ROWS_PER_PAGE);

  const { prices: currencyPrices } = useCurrencyPrices(currencies, Currency.USD);

  const [usdcAmount, setUsdcAmount] = useState<string>("");

  const [selectedToken, setSelectedToken] = useState<string | null>(usdcInfo.tokenId);

  const [showSmallOrders, setShowSmallOrders] = useState<boolean>(false); // Default to hiding small orders

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LiquidityRowData | null>(null);

  const hasActiveFilters =
    selectedCurrency !== null ||
    selectedPlatform !== null ||
    !!usdcAmount ||
    selectedToken !== usdcInfo.tokenId ||
    showSmallOrders; // Count as active filter if user has checked to show small orders

  /*
   * Hooks
   */

  // Set default currency based on geolocation or query params
  useEffect(() => {
    // Only set if no currency is selected (first load)
    if (!selectedCurrency) {
      const currencyFromQuery = queryParams.REFERRER_FROM_CURRENCY;
      if (currencyFromQuery && isSupportedCurrency(currencyFromQuery)) {
        setSelectedCurrency(currencyFromQuery);
      } else if (currencyCode && isSupportedCurrency(currencyCode)) {
        setSelectedCurrency(currencyCode);
      } else {
        setSelectedCurrency("USD");
      }
    }
  }, [currencyCode, queryParams.REFERRER_FROM_CURRENCY]);

  useEffect(() => {
    setCurrentPage(0);

    if (!depositViews) return;

    let filteredViews = depositViews.filter(
      (depositView) =>
        depositView.deposit.depositor !== ZERO_ADDRESS &&
        depositView.availableLiquidity > usdcUnits(0.1) &&
        depositView.deposit.acceptingIntents
    );

    let liquidityRowsData: LiquidityRowData[] = [];

    filteredViews.forEach((depositView) => {
      const depositId = depositView.depositId.toString();
      const depositor = depositView.deposit.depositor;
      const availableLiquidity = depositView.availableLiquidity;
      const tokenDecimals = 6;
      const intentAmountRange = {
        min: tokenUnitsToReadable(depositView.deposit.intentAmountRange.min, tokenDecimals, 1),
        max: tokenUnitsToReadable(depositView.deposit.intentAmountRange.max, tokenDecimals, 1),
      };

      depositView.verifiers.forEach((verifier) => {
        const verifierAddress = verifier.verifier;
        const platform = addressToPlatform[verifierAddress];

        verifier.currencies.forEach((currency) => {
          const currencyCode = currency.code;
          const currencyInfo = getCurrencyInfoFromHash(currencyCode);
          const conversionRate = currency.conversionRate;

          if (!currencyInfo) return;

          // Filter by USDC amount if entered
          if (usdcAmount) {
            const usdcValue = usdcUnits(usdcAmount);
            const withinLimits =
              usdcValue >= depositView.deposit.intentAmountRange.min &&
              usdcValue <= depositView.deposit.intentAmountRange.max;
            const hasEnoughLiquidity = usdcValue <= depositView.availableLiquidity;

            if (!withinLimits || !hasEnoughLiquidity) return;
          }

          const currencyPrice = currencyPrices[currencyInfo.currencyCode];
          const { apr, spread } = currencyPrice
            ? calculateAPR(
                availableLiquidity,
                conversionRate,
                currencyPrice,
                platformVolumes[platform as keyof typeof platformVolumes],
                platformLiquidities[platform as keyof typeof platformLiquidities]
              )
            : { apr: null, spread: null };

          liquidityRowsData.push({
            depositId,
            depositor,
            // token,
            availableLiquidity: tokenUnitsToReadable(availableLiquidity, tokenDecimals),
            currency: currencyInfo.currencyCode,
            conversionRate: Number(etherUnitsToReadable(conversionRate, 4)).toString(),
            platform,
            intentAmountRange,
            apr: apr,
            spread: spread,
            hashedOnchainId: verifier.verificationData.payeeDetails,
          });
        });
      });
    });

    // Apply sorting
    if (sortColumn === "price") {
      liquidityRowsData.sort((a, b) => {
        const priceA = parseFloat(a.conversionRate);
        const priceB = parseFloat(b.conversionRate);
        return sortDirection === "asc" ? priceA - priceB : priceB - priceA;
      });
    } else if (sortColumn === "available") {
      liquidityRowsData.sort((a, b) => {
        const availableA = parseFloat(a.availableLiquidity);
        const availableB = parseFloat(b.availableLiquidity);
        return sortDirection === "asc" ? availableA - availableB : availableB - availableA;
      });
    } else if (sortColumn === "limits") {
      liquidityRowsData.sort((a, b) => {
        const maxLimitA = parseFloat(a.intentAmountRange.max);
        const maxLimitB = parseFloat(b.intentAmountRange.max);
        return sortDirection === "asc" ? maxLimitA - maxLimitB : maxLimitB - maxLimitA;
      });
    } else if (sortColumn === "apr") {
      liquidityRowsData.sort((a, b) => {
        const aprA = a.apr === null ? -1 : a.apr;
        const aprB = b.apr === null ? -1 : b.apr;
        return sortDirection === "asc" ? aprA - aprB : aprB - aprA;
      });
    }

    // Apply currency filter
    if (selectedCurrency) {
      liquidityRowsData = liquidityRowsData.filter((row) => row.currency === selectedCurrency);
    }

    // Apply platform filter
    if (selectedPlatform) {
      liquidityRowsData = liquidityRowsData.filter((row) => row.platform === selectedPlatform);
    }

    // Always filter out orders below minimum intent limits
    liquidityRowsData = liquidityRowsData.filter((row) => {
      const minLimit = parseFloat(row.intentAmountRange.min);
      return parseFloat(row.availableLiquidity) >= minLimit;
    });

    // Apply small orders filter - when disabled (default), hide orders under $5 USD
    if (!showSmallOrders) {
      liquidityRowsData = liquidityRowsData.filter((row) => {
        const currencyPrice = currencyPrices[row.currency];
        const usdValue = calculateUSDValue(row.availableLiquidity, row.conversionRate, currencyPrice);

        // If we can't calculate USD value (missing price data), treat as potentially low liquidity
        // and hide it when the toggle is off to be safe
        if (usdValue === 0 && (!currencyPrice || currencyPrice <= 0)) {
          return false;
        }

        // Filter out orders below $5 USD when "Low Liquidity" toggle is unchecked (default)
        return usdValue >= DUST_THRESHOLD_USD;
      });
    }

    setLiquidityRows(liquidityRowsData);
  }, [
    depositViews,
    selectedCurrency,
    selectedPlatform,
    sortColumn,
    sortDirection,
    platformVolumes,
    platformLiquidities,
    usdcAmount,
    selectedToken,
    showSmallOrders,
    currencyPrices,
  ]);

  useEffect(() => {
    if (liquidityRows) {
      setTotalPages(Math.ceil(liquidityRows.length / rowsPerPage));
      setPaginatedData(liquidityRows.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage));
    }
  }, [liquidityRows, currentPage, rowsPerPage]);

  useEffect(() => {
    if (selectedCurrency) {
      const platformsThatSupportCurrency = Object.entries(paymentPlatformInfo).filter(([_, platformData]) =>
        platformData.platformCurrencies.includes(selectedCurrency)
      );

      setAllPlatforms(platformsThatSupportCurrency.map(([platform]) => platform));
    }
  }, [selectedCurrency]);

  /*
   * Handlers
   */

  // Calculate USD value for dust filtering
  const calculateUSDValue = (
    availableLiquidity: string,
    conversionRate: string,
    currencyPrice: number | null
  ): number => {
    if (!currencyPrice || currencyPrice <= 0) {
      return 0;
    }

    const liquidityAmount = parseFloat(availableLiquidity);
    const rate = parseFloat(conversionRate);

    if (isNaN(liquidityAmount) || isNaN(rate)) {
      return 0;
    }

    // availableLiquidity (USDC) * conversionRate (fiat/USDC) / currencyPrice (fiat/USD) = USD
    const usdValue = (liquidityAmount * rate) / currencyPrice;
    return usdValue;
  };

  const handleChangePage = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setRowsPerPage(newSize);
    setCurrentPage(0); // Reset to first page when changing page size
  };

  const handleClearFilters = () => {
    setSelectedCurrency(null);
    setSelectedPlatform(null);
    setAllPlatforms(paymentPlatforms);
    setUsdcAmount("");
    setSelectedToken(usdcInfo.tokenId);
    setShowSmallOrders(false); // Reset to default (hide small orders)
  };

  const handleAddLiquidity = () => {
    navigate("/pool");
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle sort direction if clicking the same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleViewModeChange = (mode: "orderbook" | "table") => {
    setViewMode(mode);
    sessionStorage.setItem("liquidityViewMode", mode);
  };

  const handleOrderSelect = (order: LiquidityRowData) => {
    // Check if user can buy (not the seller and doesn't have existing intent)
    const isSeller = order.depositor === loggedInEthereumAddress;

    if (!isSeller && !currentIntentHash) {
      setSelectedOrder(order);
      setShowBuyModal(true);
    }
  };

  /*
   * Component
   */

  const renderPageSizeSelector = () => (
    <PageSizeSelector>
      <label>Rows per page:</label>
      <select value={rowsPerPage} onChange={(e) => handlePageSizeChange(Number(e.target.value))}>
        {ROWS_PER_PAGE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </PageSizeSelector>
  );

  const renderPageUpdateButtons = () => {
    if (liquidityRows.length === 0) {
      return null;
    }

    return (
      <PaginationContainer>
        <PageSizeContainer>{renderPageSizeSelector()}</PageSizeContainer>

        <PaginationControls>
          <PaginationButton disabled={currentPage === 0} onClick={() => handleChangePage(currentPage - 1)}>
            &#8249;
          </PaginationButton>
          <PageInfo>{totalPages === 0 ? "0 of 0" : `${currentPage + 1} of ${totalPages}`}</PageInfo>
          <PaginationButton
            disabled={currentPage === totalPages - 1 || totalPages === 0}
            onClick={() => handleChangePage(currentPage + 1)}
          >
            &#8250;
          </PaginationButton>
        </PaginationControls>

        <ResultsInfo>
          Showing {paginatedData.length} of {liquidityRows.length} deposits
        </ResultsInfo>
      </PaginationContainer>
    );
  };

  return (
    <Container>
      <TitleRow>
        <ThemedText.HeadlineMedium>Liquidity</ThemedText.HeadlineMedium>
      </TitleRow>

      <Content>
        <FiltersContainer>
          <LeftFiltersWrapper>
            {isMobile ? (
              <>
                <MobileFilterRow>
                  <AmountFilter
                    value={usdcAmount}
                    onChange={setUsdcAmount}
                    placeholder="Amount"
                    selectedToken={selectedToken || undefined}
                    width="50%"
                  />
                  <CurrencyFilter
                    selectedCurrency={selectedCurrency}
                    setSelectedCurrency={setSelectedCurrency}
                    allCurrencies={currencies}
                    width="50%"
                  />
                </MobileFilterRow>

                <MobileFilterRow>
                  <PlatformFilter
                    selectedPlatform={selectedPlatform}
                    setSelectedPlatform={setSelectedPlatform}
                    allPlatforms={allPlatforms}
                    width="35%"
                  />
                  <MoreFiltersDropdown
                    viewMode={viewMode}
                    onViewModeChange={handleViewModeChange}
                    showLowLiquidity={showSmallOrders}
                    onShowLowLiquidityChange={setShowSmallOrders}
                  />
                  <FilterButton
                    onClick={handleClearFilters}
                    active={hasActiveFilters || selectedToken !== usdcInfo.tokenId}
                    disabled={!hasActiveFilters && selectedToken === usdcInfo.tokenId}
                    title={
                      hasActiveFilters || selectedToken !== usdcInfo.tokenId ? "Clear filters" : "No active filters"
                    }
                  >
                    <Filter size={18} />
                  </FilterButton>
                </MobileFilterRow>
              </>
            ) : (
              <>
                <AmountFilter
                  value={usdcAmount}
                  onChange={setUsdcAmount}
                  placeholder="Amount"
                  selectedToken={selectedToken || undefined}
                  width="140px"
                />

                <CurrencyFilter
                  selectedCurrency={selectedCurrency}
                  setSelectedCurrency={setSelectedCurrency}
                  allCurrencies={currencies}
                  width="140px"
                />

                <PlatformFilter
                  selectedPlatform={selectedPlatform}
                  setSelectedPlatform={setSelectedPlatform}
                  allPlatforms={allPlatforms}
                  width="140px"
                />

                <MoreFiltersDropdown
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  showLowLiquidity={showSmallOrders}
                  onShowLowLiquidityChange={setShowSmallOrders}
                />

                <FilterButton
                  onClick={handleClearFilters}
                  active={hasActiveFilters || selectedToken !== usdcInfo.tokenId}
                  disabled={!hasActiveFilters && selectedToken === usdcInfo.tokenId}
                  title={hasActiveFilters || selectedToken !== usdcInfo.tokenId ? "Clear filters" : "No active filters"}
                >
                  <Filter size={18} />
                </FilterButton>
              </>
            )}
          </LeftFiltersWrapper>

          {!isMobile && (
            <AccessoryButton
              onClick={handleAddLiquidity}
              height={36}
              icon="plus"
              iconPosition="left"
              title="Add Liquidity"
            />
          )}
        </FiltersContainer>

        {liquidityRows?.length === 0 || liquidityRows == null ? (
          <ErrorContainer>
            <ThemedText.DeprecatedBody textAlign="center">
              <ChainLinkIcon strokeWidth={1} style={{ marginTop: "2em" }} />
              <div>No deposits found.</div>
            </ThemedText.DeprecatedBody>
          </ErrorContainer>
        ) : viewMode === "orderbook" ? (
          <OrderBookView
            liquidityRows={liquidityRows}
            selectedCurrency={selectedCurrency}
            onOrderSelect={handleOrderSelect}
          />
        ) : (
          <TableContainer>
            {!isMobile ? (
              <>
                <TableHeaderRow>
                  <SortableColumnHeader
                    column="price"
                    currentSortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    tooltip="Ask per USDC. Positive spread means the price is higher than the current market price of USD and vice versa. Spread updates every 3 hours."
                  >
                    Price <SpreadBadge>Spread</SpreadBadge>
                  </SortableColumnHeader>
                  <SortableColumnHeader
                    column="apr"
                    currentSortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    tooltip={
                      <>
                        Annual Percentage Rate and spread based on protocol volume, liquidity share, and conversion
                        rate. Updates every 3 hours.{" "}
                        <Link href={APR_DOCS_LINK} target="_blank" style={{ color: "inherit" }}>
                          Read more ↗
                        </Link>
                      </>
                    }
                  >
                    <APRHeaderContainer>APR</APRHeaderContainer>
                  </SortableColumnHeader>
                  <ColumnHeader>Depositor</ColumnHeader>
                  <ColumnHeader>Payment</ColumnHeader>
                  <SortableColumnHeader
                    column="available"
                    currentSortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    tooltip="Amount available to be taken. Click to sort by available liquidity"
                  >
                    Available
                  </SortableColumnHeader>
                  <SortableColumnHeader
                    column="limits"
                    currentSortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    tooltip="Minimum and maximum USDC amount that can be taken per order. Click to sort by limits"
                  >
                    <span>Limits</span>
                  </SortableColumnHeader>
                  <TradeColumnHeader>Trade</TradeColumnHeader>
                </TableHeaderRow>
                <Table>
                  {paginatedData.map((liquidityRow, rowIndex) => (
                    <PositionRowStyled key={rowIndex}>
                      <LiquidityRow
                        depositId={liquidityRow.depositId}
                        depositor={liquidityRow.depositor}
                        // token={liquidityRow.token}
                        availableLiquidity={liquidityRow.availableLiquidity}
                        currency={liquidityRow.currency}
                        conversionRate={liquidityRow.conversionRate}
                        platform={liquidityRow.platform}
                        rowIndex={rowIndex + currentPage * rowsPerPage}
                        limits={liquidityRow.intentAmountRange}
                        apr={liquidityRow.apr}
                        spread={liquidityRow.spread}
                        hashedOnchainId={liquidityRow.hashedOnchainId}
                      />
                    </PositionRowStyled>
                  ))}
                </Table>
              </>
            ) : (
              <>
                <TableMobile>
                  {paginatedData.map((liquidityRow, rowIndex) => (
                    <LiquidityRowMobile
                      key={rowIndex}
                      depositor={liquidityRow.depositor}
                      // token={liquidityRow.token}
                      availableLiquidity={liquidityRow.availableLiquidity}
                      currency={liquidityRow.currency}
                      conversionRate={liquidityRow.conversionRate}
                      platform={liquidityRow.platform}
                      limits={liquidityRow.intentAmountRange}
                      apr={liquidityRow.apr}
                      spread={liquidityRow.spread}
                    />
                  ))}
                </TableMobile>
              </>
            )}
          </TableContainer>
        )}
      </Content>

      {viewMode === "table" && renderPageUpdateButtons()}


      {showBuyModal && selectedOrder && (
        <BuyModal
          depositId={selectedOrder.depositId}
          platform={selectedOrder.platform}
          currency={selectedOrder.currency}
          conversionRate={selectedOrder.conversionRate}
          hashedOnchainId={selectedOrder.hashedOnchainId}
          availableLiquidity={selectedOrder.availableLiquidity}
          minOrderAmount={selectedOrder.intentAmountRange.min}
          maxOrderAmount={selectedOrder.intentAmountRange.max}
          onBackClick={() => {
            setShowBuyModal(false);
            setSelectedOrder(null);
          }}
          onOrderCreated={() => {
            setShowBuyModal(false);
            setSelectedOrder(null);
            navigate("/swap?view=sendPayment");
          }}
        />
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;

  @media (max-width: 600px) {
    margin: 0 auto;
    width: 98%;
  }
`;

const TitleRow = styled.div`
  display: flex;
  flex-direction: row;
  margin-bottom: 20px;
  height: 50px;
  align-items: flex-end;
  justify-content: space-between;
  color: #fff;
  padding: 0 1rem;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0;
  }
`;

const Content = styled.main`
  @media (min-width: 600px) {
    background-color: ${colors.container};
    box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
      0px 24px 32px rgba(0, 0, 0, 0.01);
    border: 1px solid ${colors.defaultBorderColor};
    border-radius: 16px;
    overflow: hidden;
  }
`;

const ErrorContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  padding: 36px;
  max-width: 340px;
  min-height: 25vh;
  gap: 36px;

  @media (max-width: 600px) {
    background-color: ${colors.container};
    box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
      0px 24px 32px rgba(0, 0, 0, 0.01);
    border: 1px solid ${colors.defaultBorderColor};
    border-radius: 16px;
  }
`;

const IconStyle = css`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`;

const ChainLinkIcon = styled(LinkIcon)`
  ${IconStyle}
`;

const TableContainer = styled.div`
  display: block;
`;

const TableHeaderRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.2fr 1fr;
  padding: 1.3rem 1.5rem 1rem 1.5rem;
  gap: 1.5rem;
  text-align: left;
  border-bottom: 1px solid ${colors.defaultBorderColor};

  // @media (min-width: 600px) {
  //   // grid-template-columns: .2fr .9fr .6fr 1.1fr repeat(2, minmax(0,1fr));
  //   // padding: 1.3rem 1.75rem 1rem 1.75rem;
  // }
`;

const Table = styled.div`
  width: 100%;
  border-radius: 8px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.25);
  font-size: 16px;
  color: #616161;

  @media (max-width: 600px) {
    font-size: 12px;
  }

  & > * {
    border-bottom: 1px solid ${colors.defaultBorderColor};
  }

  & > *:last-child {
    border-bottom: none;
  }
`;

const TableMobile = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ColumnHeader = styled.div`
  text-align: left;
  font-size: 14px;
  opacity: 0.7;

  @media (max-width: 600px) {
    font-size: 13px;
  }
`;

const TradeColumnHeader = styled.div`
  text-align: right;
  font-size: 14px;
  opacity: 0.7;
  margin-right: 0.5rem;

  @media (max-width: 600px) {
    font-size: 13px;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  gap: 1rem;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 0.8rem;
  }
`;

const PageSizeContainer = styled.div`
  display: flex;
  align-items: center;

  @media (max-width: 600px) {
    order: 3;
  }
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;

  @media (max-width: 600px) {
    order: 1;
  }
`;

const PaginationButton = styled.button`
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 8px 16px;
  margin: 0 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
  }

  &:disabled {
    background-color: rgba(0, 0, 0, 0.2);
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  color: rgba(255, 255, 255, 0.8);
  word-spacing: 2px;
  font-size: 16px;
`;

const PageSizeSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  label {
    font-size: 16px;
    color: ${colors.lightGrayText};
    white-space: nowrap;
  }

  select {
    background-color: ${colors.selectorColor};
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 24px;
    padding: 6px 14px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23FFF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 12px center;
    background-repeat: no-repeat;
    background-size: 16px;
    padding-right: 40px;

    &:hover {
      background-color: ${colors.selectorHover};
      border: 1px solid ${colors.selectorHoverBorder};
    }

    &:focus {
      outline: none;
      background-color: ${colors.selectorHover};
      border: 1px solid ${colors.buttonDefault};
    }

    option {
      background-color: ${colors.container};
      color: #fff;
    }
  }

  @media (max-width: 600px) {
    label {
      font-size: 14px;
    }

    select {
      font-size: 14px;
      padding: 4px 12px;
      padding-right: 32px;
      background-position: right 8px center;
      background-size: 14px;
      font-weight: 600;
    }
  }
`;

const ResultsInfo = styled.div`
  font-size: 16px;
  color: ${colors.lightGrayText};
  white-space: nowrap;

  @media (max-width: 600px) {
    order: 2;
    font-size: 14px;
  }
`;

const PositionRowStyled = styled.div`
  &:last-child {
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${colors.defaultBorderColor};

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
    padding: 0.75rem;
  }
`;

const LeftFiltersWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;

  @media (max-width: 600px) {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }
`;

const MobileFilterRow = styled.div`
  display: flex;
  gap: 0.375rem;
  width: 100%;
  align-items: center;
`;

const MobileFilterActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
  margin-left: auto;
`;

const FilterButton = styled.button<{ active: boolean }>`
  background: transparent;
  border: none;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;

  // Default/Idle state
  color: ${colors.lightGrayText};

  // Hover state
  &:hover:not(:disabled) {
    color: ${colors.buttonHover};
    cursor: pointer;
  }

  // Active/Filters Applied state
  ${(props) =>
    props.active &&
    css`
      color: ${colors.buttonDefault};

      &::after {
        content: "";
        position: absolute;
        top: 6px;
        right: 6px;
        width: 8px;
        height: 8px;
        background-color: ${colors.buttonDefault};
        border-radius: 50%;
      }

      &:hover {
        color: ${colors.buttonHover};

        &::after {
          background-color: ${colors.buttonHover};
        }
      }
    `}

  // Disabled state
  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

const APRHeaderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SpreadBadge = styled.span`
  background-color: rgba(108, 117, 125, 0.2);
  color: #9aa3af;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
`;

