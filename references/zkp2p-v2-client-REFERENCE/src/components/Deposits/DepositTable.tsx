import React, { useEffect, useState, useCallback } from 'react';
import { Inbox } from 'react-feather';
import styled, { css } from 'styled-components';
import { colors } from '@theme/colors';

import { ThemedText } from '@theme/text';
import { Button } from '@components/common/Button';
import { DepositRow } from "@components/Deposits/DepositRow";
import { CustomConnectButton } from "@components/common/ConnectButton";
import { CurrencyType, getCurrencyInfoFromHash, PaymentPlatformType } from '@helpers/types';
import { etherUnitsToReadable, tokenUnitsToReadable } from '@helpers/units';
import { usdcInfo } from '@helpers/types/tokens';

import useAccount from '@hooks/contexts/useAccount';
import useDeposits from '@hooks/contexts/useDeposits';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import { UpdateDepositModal } from '../Deposit/UpdateDepositModal';
import useMediaQuery from '@hooks/useMediaQuery';
import { DepositStatus } from '@helpers/types/curator';
import { AccessoryButton } from '@components/common/AccessoryButton';
import useBackend from '@hooks/contexts/useBackend';
import useSessionStorage from '@hooks/useSessionStorage';
import { DepositRowMobile } from "@components/Deposits/DepositRowMobile";

type TabType = 'activeDeposits' | 'pastDeposits';

interface DepositTableProps {
  handleNewPositionClick: () => void;
}

interface DepositRowData {
  depositId: string;
  tokenTicker: string;
  tokenIcon: string;
  conversionRates: Map<PaymentPlatformType, Map<CurrencyType, string>>;
  originalAmount: string;
  availableLiquidity: string;
  activeOrders: string[];
  amountLockedInIntents: string;
  status: DepositStatus;
  intentAmountRange: {
    min: string;
    max: string;
  },
}

export const DepositTable: React.FC<DepositTableProps> = ({
  handleNewPositionClick
}) => {
  DepositTable.displayName = 'DepositTable';

  /*
   * State
   */
  const [activeTab, setActiveTab] = useSessionStorage<TabType>('activeDepositsTab', 'activeDeposits');
  const [activeDepositRows, setActiveDepositRows] = useState<DepositRowData[]>([]);
  const [pastDepositRows, setPastDepositRows] = useState<DepositRowData[]>([]);
  const [showUpdateRateModal, setShowUpdateRateModal] = useState(false);
  const [selectedDepositDetails, setSelectedDepositDetails] = useState<{
    depositId: string;
    platform: string;
    currency: string;
    currentRate: string;
  } | null>(null);

  /*
   * Contexts
   */
  const currentDeviceSize = useMediaQuery(); 
  const isMobile = currentDeviceSize === 'mobile';

  const { isLoggedIn, loggedInEthereumAddress } = useAccount();
  const { usdcAddress, addressToPlatform } = useSmartContracts();
  const { depositViews, refetchDepositViews } = useDeposits();
  
  /*
   * Backend data
   */
  const { 
    ownerDeposits, 
    isLoadingOwnerDeposits, 
    ownerDepositsError, 
    refetchOwnerDeposits
  } = useBackend();

  /*
   * Effects
   */
  

  // Process active deposits from depositViews
  useEffect(() => {
    if (depositViews) {
      const depositRowsData = depositViews.map((depositView) => {
        const deposit = depositView.deposit;
        const depositId = depositView.depositId.toString();
        const tokenDecimals = usdcInfo.decimals;
        const tokenTicker = usdcInfo.ticker;
        const tokenIcon = usdcInfo.icon;

        const originalAmount = tokenUnitsToReadable(deposit.depositAmount, tokenDecimals);
        const availableLiquidity = tokenUnitsToReadable(depositView.availableLiquidity, tokenDecimals);
        const intentAmountRangeMin = tokenUnitsToReadable(
          deposit.intentAmountRange.min, tokenDecimals
        );
        const intentAmountRangeMax = tokenUnitsToReadable(
          deposit.intentAmountRange.max, tokenDecimals
        );

        const conversionRates = new Map<PaymentPlatformType, Map<CurrencyType, string>>();
        
        depositView.verifiers.forEach(verifier => {
          const platform = addressToPlatform[verifier.verifier];
          if (!platform) {
            return;
          }
          
          if (!conversionRates.has(platform)) {
            conversionRates.set(platform, new Map<CurrencyType, string>());
          }
          
          const platformMap = conversionRates.get(platform);
          verifier.currencies.forEach(currency => {
            const _currency = getCurrencyInfoFromHash(currency.code)?.currency;
            platformMap?.set(
              _currency ?? '',
              etherUnitsToReadable(currency.conversionRate, 4)
            );
          });
        });

        const activeOrders = deposit.intentHashes;
        const amountLockedInIntents = tokenUnitsToReadable(
          deposit.outstandingIntentAmount, tokenDecimals
        );

        const status =  deposit.acceptingIntents ? 
          DepositStatus.ACTIVE 
          : DepositStatus.WITHDRAWN; // not accepting intents

        return {
          depositId,
          tokenTicker,
          tokenIcon,
          conversionRates,
          originalAmount,
          availableLiquidity,
          intentAmountRange: {
            min: intentAmountRangeMin,
            max: intentAmountRangeMax,
          },
          activeOrders,
          amountLockedInIntents,
          status,
        }
      });

      setActiveDepositRows(depositRowsData);
    }
  }, [depositViews, addressToPlatform]);

  // Process past deposits from backend
  useEffect(() => {
    if (ownerDeposits) {
      const depositRowsData = ownerDeposits
        .sort((a, b) => b.id - a.id)
        .map((deposit) => {
          const depositId = deposit.id.toString();
          const tokenDecimals = usdcInfo.decimals;
          const tokenTicker = usdcInfo.ticker;
          const tokenIcon = usdcInfo.icon;
    
          const originalAmount = tokenUnitsToReadable(deposit.amount, tokenDecimals);
          const availableLiquidity = tokenUnitsToReadable(deposit.availableLiquidity, tokenDecimals);
          const intentAmountRangeMin = tokenUnitsToReadable(
            deposit.intentAmountMin, tokenDecimals
          );
          const intentAmountRangeMax = tokenUnitsToReadable(
            deposit.intentAmountMax, tokenDecimals
          );
    
          const conversionRates = new Map<PaymentPlatformType, Map<CurrencyType, string>>();
            
          deposit.verifiers.forEach(verifier => {
            const platform = addressToPlatform[verifier.verifier];
            if (!platform) {
              return;
            }
            
            if (!conversionRates.has(platform)) {
              conversionRates.set(platform, new Map<CurrencyType, string>());
            }
            
            const platformMap = conversionRates.get(platform);
            verifier.currencies.forEach(currency => {
              const _currency = getCurrencyInfoFromHash(currency.currencyCode)?.currency;
              platformMap?.set(
                _currency ?? '',
                etherUnitsToReadable(currency.conversionRate, 4)
              );
            });
          });
    
          const amountLockedInIntents = tokenUnitsToReadable(
            deposit.outstandingIntentAmount, tokenDecimals
          );
    
          const status = deposit.status;

          if (status !== DepositStatus.CLOSED) {
            return null;
          }

          return {
            depositId,
            tokenTicker,
            tokenIcon,
            conversionRates,
            originalAmount,
            availableLiquidity,
            intentAmountRange: {
              min: intentAmountRangeMin,
              max: intentAmountRangeMax,
            },
            activeOrders: [],
            amountLockedInIntents,
            status,
          }
        });

      setPastDepositRows(depositRowsData.filter((depositRow) => depositRow !== null) as DepositRowData[]);
    }
  }, [ownerDeposits, addressToPlatform]);

  /*
   * Handlers
   */
  const handleRefreshClick = useCallback(() => {
    if (activeTab === 'pastDeposits' && loggedInEthereumAddress) {
      refetchOwnerDeposits();
    } else if (activeTab === 'activeDeposits') {
      refetchDepositViews?.();
    }
  }, [activeTab, refetchOwnerDeposits, refetchDepositViews]);

  /*
   * Render helpers
   */
  const renderDepositsTable = () => {
    const rows = activeTab === 'activeDeposits' ? activeDepositRows : pastDepositRows;
    const isLoading = activeTab === 'activeDeposits' ? false : isLoadingOwnerDeposits;
    
    if (isLoading) {
      return (
        <PositionsContainer>
          {!isMobile ? (
            <>
              <TableHeaderRow isMobile={isMobile}>
                <ColumnHeader>#</ColumnHeader>
                <ColumnHeader>Amount</ColumnHeader>
                <ColumnHeader>Available</ColumnHeader>
                <ColumnHeader>Platforms</ColumnHeader>
                <ColumnHeader>Currencies</ColumnHeader>
                <ColumnHeader>Status</ColumnHeader>
              </TableHeaderRow>

              <Table>
                {Array.from({ length: 3 }).map((_, index) => (
                  <PositionRowStyled key={`skeleton-${index}`}>
                    <DepositRow
                      rowIndex={index}
                      depositId=""
                      // token={usdcInfo.tokenId}
                      amount=""
                      availableLiquidity=""
                      status={DepositStatus.ACTIVE}
                      activeOrders={[]}
                      conversionRates={new Map()}
                      onWithdrawClick={() => {}}
                      onEditClick={() => {}}
                      isLoading={true}
                    />
                  </PositionRowStyled>
                ))}
              </Table>
            </>
          ) : (
            <MobileContainer>
              {Array.from({ length: 3 }).map((_, index) => (
                <DepositRowMobile
                  key={`mobile-skeleton-${index}`}
                  depositId=""
                  // token={usdcInfo.tokenId}
                  amount=""
                  availableLiquidity=""
                  status={DepositStatus.ACTIVE}
                  activeOrders={[]}
                  conversionRates={new Map()}
                  isLoading={true}
                />
              ))}
            </MobileContainer>
          )}
        </PositionsContainer>
      );
    }

    if (!rows || rows.length === 0) {
      return (
        <ErrorContainer>
          <ThemedText.DeprecatedBody textAlign="center">
            <InboxIcon strokeWidth={1} style={{ marginTop: '2em' }} />
            <div>
              You have no {activeTab === 'activeDeposits' ? 'active' : 'closed'} deposits
            </div>
          </ThemedText.DeprecatedBody>
        </ErrorContainer>
      );
    }

    return (
      <>
        {!isMobile ? (
          <PositionsContainer>
            <TableHeaderRow isMobile={isMobile}>
              <ColumnHeader>#</ColumnHeader>
              <ColumnHeader>Amount</ColumnHeader>
              <ColumnHeader>Available</ColumnHeader>
              <ColumnHeader>Platforms</ColumnHeader>
              <ColumnHeader>Currencies</ColumnHeader>
              <ColumnHeader>Status</ColumnHeader>
            </TableHeaderRow>

            <Table>
              {rows.map((depositRow, rowIndex) => (
                <PositionRowStyled key={rowIndex}>
                  <DepositRow
                    rowIndex={rowIndex}
                    depositId={depositRow.depositId}
                    // token={usdcInfo.tokenId}
                    amount={depositRow.originalAmount}
                    availableLiquidity={depositRow.availableLiquidity}
                    status={depositRow.status}
                    activeOrders={depositRow.activeOrders}
                    conversionRates={depositRow.conversionRates}
                    onWithdrawClick={() => {}}
                    onEditClick={() => {}}
                    isWithdrawLoading={false}
                  />
                </PositionRowStyled>
              ))}
            </Table>
            </PositionsContainer>
        ) : (
          <MobileContainer>
            {rows.map((depositRow, rowIndex) => (
              <DepositRowMobile
                key={`mobile-${rowIndex}`}
                depositId={depositRow.depositId}
                // token={usdcInfo.tokenId}
                amount={depositRow.originalAmount}
                availableLiquidity={depositRow.availableLiquidity}
                status={depositRow.status}
                activeOrders={depositRow.activeOrders}
                conversionRates={depositRow.conversionRates}
              />
            ))}
          </MobileContainer>
        )}
      </>
    );
  };

  /*
   * Render
   */
  return (
    <Container>
      <TabScrollContainer>
        <TabsAndButtonContainer>
          <TabContainer>
            <TabButton 
              active={activeTab === 'activeDeposits'} 
              onClick={() => setActiveTab('activeDeposits')}
            >
              Deposits
            </TabButton>
            <TabButton 
              active={activeTab === 'pastDeposits'} 
              onClick={() => setActiveTab('pastDeposits')}
            >
              Closed
            </TabButton>
          </TabContainer>
          
          <ButtonGroup>
            {isLoggedIn && activeTab === 'pastDeposits' && (
              !isMobile && (
                <AccessoryButton 
                  onClick={handleRefreshClick}
                  icon="refresh"
                  height={40}
                  title="Refresh"
                  textAlign="center"
                  iconPosition="left"
                />
              )
            )}
            {isLoggedIn && (
              <Button 
                onClick={handleNewPositionClick} 
                height={40}
                width={isMobile ? 130 : undefined}
              >
                {isMobile ? "+ Deposit" : "+ New Deposit"}
              </Button>
            )}
          </ButtonGroup>
        </TabsAndButtonContainer>
      </TabScrollContainer>

      <Content>
        {!isLoggedIn ? (
          <ErrorContainer>
            <ThemedText.DeprecatedBody textAlign="center">
              <InboxIcon strokeWidth={1} style={{ marginTop: '2em' }} />
              <div>
                Your {activeTab === 'activeDeposits' ? 'active' : 'closed'} deposits will appear here.
              </div>
            </ThemedText.DeprecatedBody>
            <CustomConnectButton width={152} />
          </ErrorContainer>
        ) : (
          renderDepositsTable()
        )}
      </Content>

      {showUpdateRateModal && selectedDepositDetails && (
        <UpdateDepositModal
          depositId={selectedDepositDetails.depositId}
          platform={selectedDepositDetails.platform}
          currency={selectedDepositDetails.currency}
          currentRate={selectedDepositDetails.currentRate}
          onBackClick={() => {
            setShowUpdateRateModal(false);
            setSelectedDepositDetails(null);
            
            // Refresh data after updating rate
            handleRefreshClick();
          }}
        />
      )}
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;

  @media (max-width: 600px) {
    max-width: 98%;
    margin: 0 auto;
  }
`;

const Content = styled.main`
  display: flex;
  flex-direction: column;

  @media (min-width: 600px) {
    background-color: ${colors.container};
    box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
      0px 24px 32px rgba(0, 0, 0, 0.01);
    border: 1px solid ${colors.defaultBorderColor};  
  }
    
  overflow: hidden;
  position: relative;
  border-radius: 16px;

  @media (max-width: 600px) {
    width: 98%;
    margin: 0 auto;
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
    border: 1px solid ${colors.defaultBorderColor};
    border-radius: 16px;
    box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
      0px 24px 32px rgba(0, 0, 0, 0.01);
    margin-bottom: 12px;
    width: 80%;
    max-width: 100%;
  }
`;

const IconStyle = css`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`;

const InboxIcon = styled(Inbox)`
  ${IconStyle}
`;

const PositionsContainer = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: flex-start;
  width: 100%;
`;

const Table = styled.div`
  width: 100%;
  border-radius: 8px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.25);
  font-size: 16px;
  color: #616161;
  box-sizing: border-box;

  & > * {
    border-bottom: 1px solid ${colors.defaultBorderColor};
  }

  & > *:last-child {
    border-bottom: none;
  }
`;

const TableHeaderRow = styled.div<{ isMobile: boolean }>`
  display: grid;
  grid-template-columns: ${props => props.isMobile ? '1fr 1.5fr' : '0.2fr 1fr 0.8fr 1.2fr 1.2fr 0.8fr'};
  gap: ${props => props.isMobile ? '3.5rem' : '1.5rem'};
  padding: ${props => props.isMobile ? '1rem 1rem 0.75rem 1rem' : '1rem 1.5rem 0.75rem 1.5rem'};
  text-align: left;
  color: ${colors.darkText};
  border-bottom: 1px solid ${colors.defaultBorderColor};
  width: 100%;
  box-sizing: border-box;
`;

const ColumnHeader = styled.div`
  text-align: left;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${colors.lightGrayText};
  @media (max-width: 600px) {
    font-size: 13px;
  };
`;

const ActionsColumnHeader = styled(ColumnHeader)`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PositionRowStyled = styled.div`
  &:last-child {
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
  }
`;

const TabScrollContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: 2rem;

  @media (max-width: 600px) {
    gap: 1rem;
  }
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 8px 0;
  background: transparent;
  border: none;
  color: ${props => props.active ? colors.darkText : colors.grayText};
  font-weight: ${props => props.active ? '500' : '100'};
  cursor: pointer;
  font-size: 22px;
  white-space: nowrap;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    color: ${colors.darkText};
  }
`;

const TabsAndButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const MobileContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`; 