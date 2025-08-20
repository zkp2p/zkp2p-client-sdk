import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { ThemedText } from '@theme/text'
import { colors } from '@theme/colors';
import { FileText, Inbox } from 'react-feather';

import { ConfirmRelease } from '@components/modals/ConfirmRelease';
import { OrderRow, OrderRowData } from "@components/Deposit/Orders/OrderRow";
import { CustomConnectButton } from "@components/common/ConnectButton";
import { OrderRowMobile } from '@components/Deposit/Orders/OrderRowMobile';
import { tokenUnitsToReadable } from '@helpers/units';
import { getCurrencyInfoFromHash } from '@helpers/types';
import { calculateFiatFromRequestedUSDC, calculateRemainingTimeForExpiration } from '@helpers/intentHelper';
import SortableColumnHeader from '@components/common/SortableColumnHeader';
import QuestionHelper from '@components/common/QuestionHelper';

import useSmartContracts from '@hooks/contexts/useSmartContracts';
import useAccount from '@hooks/contexts/useAccount';
import useMediaQuery from "@hooks/useMediaQuery";
import useGetDepositOrders from '@hooks/backend/useGetDepositOrders';
import { AccessoryButton } from '@components/common/AccessoryButton';

interface OrdersTableProps {
  selectedRow?: number;
  rowsPerPage?: number;
  depositId: string;
  depositOwner: string | null;
}

const ROWS_PER_PAGE = 10; // Match LiquidityTable's pagination size

export const OrdersTable: React.FC<OrdersTableProps> = ({
  depositId,
  depositOwner,
  selectedRow,
  rowsPerPage = ROWS_PER_PAGE,
}) => {
  /*
   * Contexts
   */
  const {
    addressToPlatform,
    usdcAddress
  } = useSmartContracts();

  const { isLoggedIn, loggedInEthereumAddress } = useAccount();

  const {
    data: ownerIntents,
    isLoading: isFetchingDepositOrders,
    error: fetchingDepositOrdersError,
    fetchDepositOrders
  } = useGetDepositOrders();

  /*
   * State
   */
  const [shouldShowReleaseModal, setShouldShowReleaseModal] = useState<boolean>(false);
  const [selectedReleaseIntentHash, setSelectedReleaseIntentHash] = useState<string>("");
  const [selectedReleaseIntentTokenToSend, setSelectedReleaseIntentTokenToSend] = useState<string>("");
  const [selectedReleaseIntentAmount, setSelectedReleaseIntentAmount] = useState<string>("");
  const [activeOrdersRowData, setActiveOrdersRowData] = useState<OrderRowData[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [paginatedData, setPaginatedData] = useState<OrderRowData[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [fetchingOrders, setFetchingOrders] = useState<boolean>(false);
  const [lastDepositOrdersFetchTime, setLastDepositOrdersFetchTime] = useState<number | null>(null);
  
  const isMobile = useMediaQuery() === 'mobile';

  /*
   * Hooks
   */
  useEffect(() => {
    if (isLoggedIn && depositId) {
      fetchDepositOrders(depositId).then(() => {
        setLastDepositOrdersFetchTime(Date.now());
      });
    }
  }, [isLoggedIn, depositId, fetchDepositOrders]);

  useEffect(() => {
    setFetchingOrders(isFetchingDepositOrders);
  }, [isFetchingDepositOrders]);

  useEffect(() => {
    console.log("OrdersTable depositOwner:", depositOwner);
  }, [depositOwner]);

  useEffect(() => {
    if (ownerIntents) {
      const sanitizedIntents: OrderRowData[] = ownerIntents
        .sort((a, b) => b.signalTimestamp.getTime() - a.signalTimestamp.getTime())
        .map((intent, index) => {
          const verifierAddress = intent.verifier;
          const paymentPlatform = addressToPlatform[verifierAddress];

          const amountToken = BigInt(intent.amount);
          const tokenDecimals = 6;
          const tokenToSend = 'USDC';
          const tokenAmountToSend = tokenUnitsToReadable(amountToken, tokenDecimals);

          const fiatToReceive = getCurrencyInfoFromHash(intent.fiatCurrency)?.currencyCode || "";
          const tokenToFiatConversionRate = BigInt(intent.conversionRate);
          const fiatAmountToReceiveBN = calculateFiatFromRequestedUSDC(
            amountToken, 
            tokenToFiatConversionRate, 
            tokenDecimals
          );
          const fiatAmountToReceive = tokenUnitsToReadable(fiatAmountToReceiveBN, tokenDecimals);

          // Use the utility function for calculating expiration time
          const expirationAt = calculateRemainingTimeForExpiration(intent.signalTimestamp);

          return {
            index,
            intentHash: intent.intentHash,
            depositId: intent.depositId.toString(),
            paymentPlatform,
            onRamper: intent.owner,
            currencyToReceive: fiatToReceive,
            fiatAmountToReceive,
            tokenToSend,
            tokenAmountToSend,
            expirationAt,
            status: intent.status,
            signalTimestamp: intent.signalTimestamp,
            fulfillTimestamp: intent.fulfillTimestamp,
            fulfillTxHash: intent.fulfillTxHash,
            prunedTimestamp: intent.prunedTimestamp,
            handleReleaseClick: () => {
              onReleaseIntentClick(intent.intentHash, tokenToSend, tokenAmountToSend);
            }
          };
        });

      setActiveOrdersRowData(sanitizedIntents);
    } else {
      setActiveOrdersRowData([]);
    }

  }, [ownerIntents, addressToPlatform]);

  // Add sorting handler
  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  // Modify sorting logic
  const getSortedData = useCallback((data: OrderRowData[]) => {
    let sortedData = [...data];
    
    // Always do initial sort by date, latest first
    sortedData.sort((a, b) => {
      const getRelevantDate = (data: OrderRowData) => {
        switch (data.status) {
          case 'SIGNALED':
            return data.signalTimestamp;
          case 'FULFILLED':
            return data.fulfillTimestamp;
          case 'PRUNED':
            return data.prunedTimestamp;
          default:
            return new Date(0);
        }
      };

      const aDate = getRelevantDate(a);
      const bDate = getRelevantDate(b);
      
      if (!aDate) return 1;
      if (!bDate) return -1;
      
      return bDate.getTime() - aDate.getTime(); // Latest first
    });

    // Then apply any column sorting if selected
    if (sortColumn) {
      sortedData.sort((a, b) => {
        const multiplier = sortDirection === 'asc' ? 1 : -1;

        switch (sortColumn) {
          case 'release':
            const aRelease = parseFloat(a.tokenAmountToSend);
            const bRelease = parseFloat(b.tokenAmountToSend);
            return (aRelease - bRelease) * multiplier;

          case 'receive':
            const aReceive = parseFloat(a.fiatAmountToReceive);
            const bReceive = parseFloat(b.fiatAmountToReceive);
            return (aReceive - bReceive) * multiplier;

          default:
            return 0;
        }
      });
    }

    return sortedData;
  }, [sortColumn, sortDirection]);

  // Update pagination effect to use sorted data
  useEffect(() => {
    if (activeOrdersRowData) {
      const sortedData = getSortedData(activeOrdersRowData);
      setTotalPages(Math.ceil(sortedData.length / ROWS_PER_PAGE));
      setPaginatedData(sortedData.slice(
        currentPage * ROWS_PER_PAGE,
        (currentPage + 1) * ROWS_PER_PAGE
      ));
    }
  }, [activeOrdersRowData, currentPage, getSortedData]);

  const handleChangePage = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const renderPageUpdateButtons = () => {
    if (activeOrdersRowData.length === 0 || totalPages === 0 || activeOrdersRowData.length <= ROWS_PER_PAGE) {
      return null;
    }

    return (
      <PaginationContainer>
        <PaginationButton 
          disabled={currentPage === 0} 
          onClick={() => handleChangePage(currentPage - 1)}
        >
          &#8249;
        </PaginationButton>
        <PageInfo>
          {totalPages === 0 ? '0 of 0' : `${currentPage + 1} of ${totalPages}`}
        </PageInfo>
        <PaginationButton
          disabled={currentPage === totalPages - 1 || totalPages === 0}
          onClick={() => handleChangePage(currentPage + 1)}
        >
          &#8250;
        </PaginationButton>
      </PaginationContainer>
    );
  };

  /*
   * Handlers
   */
  const onReleaseIntentClick = (intentHash: string, tokenToSend: string, tokenAmountToSend: string) => {
    setSelectedReleaseIntentHash(intentHash);
    setSelectedReleaseIntentTokenToSend(tokenToSend);
    setSelectedReleaseIntentAmount(tokenAmountToSend);
    setShouldShowReleaseModal(true);
  };

  const onCloseReleaseModal = (wasSuccessful?: boolean) => {
    setShouldShowReleaseModal(false);
    setSelectedReleaseIntentHash("");
    setSelectedReleaseIntentTokenToSend("");
    setSelectedReleaseIntentAmount("");

    // If release was successful, force refresh the orders
    if (wasSuccessful && isLoggedIn && depositId) {
      // Add a 5 second delay before fetching orders
      setFetchingOrders(true);
      setTimeout(() => {
        fetchDepositOrders(depositId).then(() => {
          setLastDepositOrdersFetchTime(Date.now());
          setFetchingOrders(false);
        });
      }, 5000);
    }
  };

  // Format the timestamp
  const formatLastFetchTime = useCallback(() => {
    if (!lastDepositOrdersFetchTime) return 'Never';
    return new Date(lastDepositOrdersFetchTime).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }, [lastDepositOrdersFetchTime]);

  // Modify the refresh function to use fetchDepositOrders
  const refreshOrders = useCallback(() => {
    if (isLoggedIn && depositId) {
      fetchDepositOrders(depositId).then(() => {
        setLastDepositOrdersFetchTime(Date.now());
      });
    }
  }, [isLoggedIn, depositId, fetchDepositOrders]);

  /*
   * Render
   */
  return (
    <Container>
      <TitleContainer>
        <Title>Orders</Title>
        <AccessoryButton
          onClick={refreshOrders}
          title="Refresh"
          icon="refresh"
          height={36}
        />
      </TitleContainer>

      <Content>
        {!isLoggedIn ? (
          <ErrorContainerWithBackground>
            <ThemedText.DeprecatedBody textAlign="center">
              <OrdersIcon strokeWidth={1} style={{ marginTop: '2em' }} />
              <div>
                Deposit orders will appear here
              </div>
            </ThemedText.DeprecatedBody>
            <CustomConnectButton width={152} />
          </ErrorContainerWithBackground>
        ) : (
            <PositionsContainer>
              {fetchingDepositOrdersError ? (
                <ErrorContainer>
                  <ThemedText.DeprecatedBody textAlign="center">
                    Error loading orders. Please try again.
                  </ThemedText.DeprecatedBody>
                </ErrorContainer>
              ) : fetchingOrders ? (
                <Table>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <OrderRow
                      key={`loading-row-${index}`}
                      index={index}
                      isLoading={true}
                      // Pass minimal required props
                      depositId=""
                      depositOwner=""
                      paymentPlatform=""
                      onRamper=""
                      currencyToReceive=""
                      fiatAmountToReceive=""
                      tokenToSend=""
                      tokenAmountToSend=""
                      expirationAt=""
                      status="SIGNALED"
                      intentHash=""
                      refreshAllOrdersForDeposit={() => {}}
                    />
                  ))}
                </Table>
              ) : !activeOrdersRowData || activeOrdersRowData.length === 0 ? (
                <ErrorContainer>
                  <ThemedText.DeprecatedBody textAlign="center">
                    <OrdersIcon strokeWidth={1} style={{ marginTop: '2em' }} />
                    <div>
                      You have no orders on this deposit
                    </div>
                  </ThemedText.DeprecatedBody>
                </ErrorContainer>
              ) : (
                <>
                  {!isMobile ? (
                    <>
                      <TableHeaderRow>
                        <ColumnHeader>#</ColumnHeader>
                        <ColumnHeader>Buyer</ColumnHeader>
                        <SortableColumnHeader
                          onSort={() => handleSort('release')}
                          column='release'
                          currentSortColumn={sortColumn}
                          sortDirection={sortDirection}
                        >
                          Release
                        </SortableColumnHeader>
                        <SortableColumnHeader
                          onSort={() => handleSort('receive')}
                          column='receive'
                          currentSortColumn={sortColumn}
                          sortDirection={sortDirection}
                        >
                          Receive
                        </SortableColumnHeader>
                        <ColumnHeader>Platform</ColumnHeader>
                        <StatusColumnHeader>
                          Status
                          <QuestionHelper 
                            text="Orders are sorted by date, with most recent first. Active orders show expiration time, completed orders show completion time, and orders cancelled by the counterparty show cancellation time."
                            size="sm"
                          />
                        </StatusColumnHeader>
                        <ColumnHeader>Updated At</ColumnHeader>
                      </TableHeaderRow>

                      <Table>
                        {paginatedData.map((rowData, index) => (
                          <OrderRow
                            key={`row-${index}`}
                            {...rowData}
                            depositOwner={depositOwner}
                            isLoading={fetchingOrders}
                            refreshAllOrdersForDeposit={refreshOrders}
                          />
                        ))}
                      </Table>
                    </>
                  ) : (
                    <MobileContainer>
                      {paginatedData.map((rowData, index) => (
                        <OrderRowMobile
                          key={`mobile-row-${index}`}
                          {...rowData}
                          index={index}
                          depositOwner={depositOwner}
                          isLoading={fetchingOrders}
                          refreshAllOrdersForDeposit={refreshOrders}
                        />
                      ))}
                    </MobileContainer>
                  )}
                </>
              )}
            </PositionsContainer>
          )}
      </Content>

      {shouldShowReleaseModal && (
        <ConfirmRelease
          onBackClick={onCloseReleaseModal}
          intentHash={selectedReleaseIntentHash}
          tokenToSend={selectedReleaseIntentTokenToSend}
          amountTokenToSend={selectedReleaseIntentAmount}
        />
      )}

      {/* Add the timestamp display */}
      {isLoggedIn && !fetchingOrders && (
        <>
          {/* <LastFetchTimeContainer>
            Last updated: {formatLastFetchTime()}
          </LastFetchTimeContainer> */}

          {renderPageUpdateButtons()}
        </>
      )}

    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-self: flex-start;
  justify-content: center;
  overflow: hidden;
  gap: 0.6rem;

  @media (max-width: 600px) {
    max-width: 98%;
    margin: 0 auto;
  }
`;

const TitleContainer = styled.div`
  display: flex;
  padding: 0.5rem 1rem;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const Title = styled.h2`
  color: ${colors.white};
  font-size: 20px;
  font-weight: 500;
  margin: 0;
`;

const Content = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-self: flex-start;
  justify-content: center;
  gap: 1rem;
`;

const PositionsContainer = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: flex-start;

  @media (min-width: 600px) {
    background-color: ${colors.container};
    border: 1px solid ${colors.defaultBorderColor};
    border-radius: 16px;
    box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
      0px 24px 32px rgba(0, 0, 0, 0.01);
  }
`;

const TableHeaderRow = styled.div`
  display: grid;
  grid-template-columns: 0.2fr 1fr 1.5fr 1.5fr 1fr 1fr 1.2fr;
  gap: 1.5rem;
  padding: 1rem 1.5rem 0.75rem 1.5rem;
  text-align: left;
  color: ${colors.darkText};
  border-bottom: 1px solid ${colors.defaultBorderColor};
  width: 100%;
  box-sizing: border-box;
`;

const ColumnHeader = styled.div`
  text-align: left;
  font-size: 14px;
  color: ${colors.lightGrayText};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ActionsColumnHeader = styled(ColumnHeader)`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Table = styled.div`
  width: 100%;
  font-size: 16px;
  color: #616161;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  overflow: hidden;

  & > * {
    border-bottom: 1px solid ${colors.defaultBorderColor};
  }

  & > *:last-child {
    border-bottom: none;
  }
`;

const ErrorContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  padding: 36px;
  max-width: 380px;
  min-height: 25vh;
  gap: 36px;


  @media (max-width: 600px) {
    background-color: ${colors.container};
    border: 1px solid ${colors.defaultBorderColor};
    border-radius: 16px;
    box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
      0px 24px 32px rgba(0, 0, 0, 0.01);
    width: 80%;
  }
`;

const ErrorContainerWithBackground = styled.div`
  align-items: center;
  min-height: 25vh;
  padding: 36px;
  gap: 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 16px;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
`;

const OrdersIcon = styled(Inbox)`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`;

const RefreshContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid ${colors.defaultBorderColor};
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: ${colors.linkBlue};
  cursor: pointer;
  font-size: 14px;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  
  &:hover {
    background-color: ${colors.buttonHover};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RefreshIcon = styled(FileText)`
  color: ${colors.linkBlue};
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0px 16px;
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
  color: ${colors.darkText};
  font-size: 14px;
`;

// Add styled components for sorting
const SortIcon = styled.span`
  margin-left: 4px;
  display: inline-flex;
  align-items: center;
`;

const ArrowIcon = styled.div<{ isActive: boolean }>`
  color: ${props => props.isActive ? colors.darkText : colors.grayText};
  display: flex;
  align-items: center;
  margin-left: 4px;
`;

const StatusColumnHeader = styled(ColumnHeader)`
  display: flex;
  align-items: center;
  gap: 6px;
`;

// Add styled component for the timestamp
const LastFetchTimeContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  color: ${colors.grayText};
  font-size: 12px;
  padding: 8px 16px;
  margin-top: 4px;
`;

const MobileContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.2rem;
`; 