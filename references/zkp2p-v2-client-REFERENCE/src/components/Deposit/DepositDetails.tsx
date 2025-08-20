import React, { useCallback, useEffect, useState } from "react";
import styled, { css } from 'styled-components';
import { Inbox } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from '@mui/material';

import { TransactionIconButton } from '@components/common/TransactionIconButton';
import QuestionHelper from '@components/common/QuestionHelper';
import { Skeleton } from '@components/common/Skeleton';

import useMediaQuery from "@hooks/useMediaQuery";
import useBalances from "@hooks/contexts/useBalance";
import useDeposits from "@hooks/contexts/useDeposits";
import useWithdrawDeposit from "@hooks/transactions/useWithdrawDeposit";
import useSmartContracts from "@hooks/contexts/useSmartContracts";
import useOnRamperIntents from "@hooks/contexts/useOnRamperIntents";

import { esl } from '@helpers/constants';
import { paymentPlatformInfo, PaymentPlatformType } from "@helpers/types/paymentPlatform";
import { currencyInfo, CurrencyType, getCurrencyInfoFromHash } from "@helpers/types";
import { usdcInfo } from "@helpers/types/tokens";
import { colors } from "@theme/colors";
import { Button } from "@components/common/Button";
import { UpdateDepositModal } from '@components/Deposit/UpdateDepositModal';
import { tokenUnitsToReadable, etherUnitsToReadable } from "@helpers/units";
import { DepositStatus } from "@helpers/types/curator";
import { ThemedText } from "@theme/text";
import useAccount from "@hooks/contexts/useAccount";
import { Deposit } from "@helpers/types/curator";
import { BuyModal } from '@components/Deposit/Buy/BuyModal';
import { getRecipientAddressDisplay } from "@helpers/recipientAddress";


interface DepositDetailsProps {
  depositId: string;
  deposit: Deposit | null;
  fetchDepositLoading: boolean;
  errorLoadingDeposit: Error | null;
  refreshDepositData: () => void;
  onBackClick: () => void;
}

export const DepositDetails: React.FC<DepositDetailsProps> = ({
  depositId,
  deposit,
  fetchDepositLoading,
  errorLoadingDeposit,
  refreshDepositData,
  onBackClick,
}) => {
  DepositDetails.displayName = "DepositDetails";

  const isMobile = useMediaQuery() === 'mobile';
  const navigate = useNavigate();
  
  /*
   * State
   */
  const [isWithdrawDepositLoading, setIsWithdrawDepositLoading] = useState(false);
  const [showUpdateRateModal, setShowUpdateRateModal] = useState(false);
  const [selectedDepositDetails, setSelectedDepositDetails] = useState<{
    depositId: string;
    platform: PaymentPlatformType;
    currency: CurrencyType;
    currentRate: string;
  } | null>(null);
  
  const [depositData, setDepositData] = useState<{
    tokenTicker: string;
    tokenIcon: string;
    conversionRates: Map<PaymentPlatformType, Map<CurrencyType, string>>;
    depositOwner: string;
    originalAmount: string;
    availableLiquidity: string;
    hashedOnchainIds: Map<PaymentPlatformType, string>;
    intentAmountRange: {
      min: string;
      max: string;
    };
    activeOrders: string[];
    amountLockedInIntents: string;
    status: DepositStatus;
  } | null>(null);

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedBuyDetails, setSelectedBuyDetails] = useState<{
    platform: PaymentPlatformType;
    currency: CurrencyType;
    hashedOnchainId: string;
    rate: string;
  } | null>(null);

  /*
   * Hooks
   */
  const { addressToPlatform, blockscanUrl } = useSmartContracts();
  const { isLoggedIn, loggedInEthereumAddress } = useAccount();
  const { currentIntentHash } = useOnRamperIntents();
  /*
   * Effects
   */
  useEffect(() => {
    if (deposit) {
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
      const hashedOnchainIds = new Map<PaymentPlatformType, string>();
        
      deposit.verifiers.forEach(verifier => {
        
        const platform = addressToPlatform[verifier.verifier];
        if (!platform) {
          return;
        }
        
        hashedOnchainIds.set(platform, verifier.payeeDetailsHash);
        
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

      setDepositData({
        tokenTicker,
        tokenIcon,
        conversionRates,
        hashedOnchainIds,
        depositOwner: deposit.depositor,
        originalAmount,
        availableLiquidity,
        intentAmountRange: {
          min: intentAmountRangeMin,
          max: intentAmountRangeMax,
        },
        activeOrders: [],
        amountLockedInIntents,
        status: deposit.status,
      });
    }
  }, [deposit, addressToPlatform]);

  /*
   * Contexts
   */
  const { refetchUsdcBalance } = useBalances();
  const {
    triggerDepositRefresh
  } = useDeposits();
  
  /*
   * Transactions
   */
  const onWithdrawDepositSuccess = useCallback((data: any) => {
    // Trigger smart polling for deposits - will poll for 15 seconds then stop
    if (triggerDepositRefresh) triggerDepositRefresh();
    if (refetchUsdcBalance) refetchUsdcBalance();
    
    onBackClick?.();
  }, [triggerDepositRefresh, refetchUsdcBalance, onBackClick]);

  const {
    writeWithdrawAsync,
    setDepositIdInput: setWithdrawDepositIdInput,
    shouldConfigureWithdrawWrite,
    setShouldConfigureWithdrawWrite,
    signWithdrawTransactionStatus,
    mineWithdrawTransactionStatus
  } = useWithdrawDeposit(onWithdrawDepositSuccess);

  /*
   * Hooks
   */
  useEffect(() => {
    if (depositId) {
      setWithdrawDepositIdInput(Number(depositId));
    }
  }, [depositId, setWithdrawDepositIdInput]);

  useEffect(() => {
    const executeWithdrawDeposit = async () => {
      const requiredStatusForExecution = signWithdrawTransactionStatus === 'idle' 
        || signWithdrawTransactionStatus === 'error'
        || signWithdrawTransactionStatus === 'success'
      ;

      if (shouldConfigureWithdrawWrite && writeWithdrawAsync && requiredStatusForExecution) {
        try {

          // Prevent multiple withdrawals from being triggered on re-render
          setShouldConfigureWithdrawWrite(false);

          await writeWithdrawAsync();
        } catch (error) {

          setShouldConfigureWithdrawWrite(false);
        }
      }
    };
  
    executeWithdrawDeposit();
  }, [
    shouldConfigureWithdrawWrite,
    writeWithdrawAsync,
    signWithdrawTransactionStatus,
    depositId,
    setShouldConfigureWithdrawWrite
  ]);

  useEffect(() => {
    setIsWithdrawDepositLoading(signWithdrawTransactionStatus === 'loading' || mineWithdrawTransactionStatus === 'loading');
  }, [signWithdrawTransactionStatus, mineWithdrawTransactionStatus]);

  /*
   * Handlers
   */
  const handleWithdrawClick = async () => {

    setShouldConfigureWithdrawWrite(true);
  };

  const handleEditRate = (platform: PaymentPlatformType, currency: CurrencyType, currentRate: string) => {
    setSelectedDepositDetails({ 
      depositId, 
      platform, 
      currency, 
      currentRate 
    });
    setShowUpdateRateModal(true);
  };

  const handleBuy = (platform: PaymentPlatformType, currency: CurrencyType, rate: string) => {
    const hashedOnchainId = depositData?.hashedOnchainIds.get(platform);
    setSelectedBuyDetails({ platform, currency, rate, hashedOnchainId: hashedOnchainId ?? '' });
    setShowBuyModal(true);
  };

  /*
   * Helpers
   */
  const getStatusText = (): string => {
    if (!depositData) return '';
    
    const hasLockedFunds = parseFloat(depositData.amountLockedInIntents) > 0;
    const hasAvailableFunds = parseFloat(depositData.availableLiquidity) > 0;

    if (depositData.status === DepositStatus.ACTIVE) {
      return `Deposit is active and accepting new orders. ${
        hasAvailableFunds ? 'Click on withdraw to withdraw the available amount.' : ''
      }`;
    } else if (depositData.status === DepositStatus.WITHDRAWN) {
      return `Deposit is inactive and NOT accepting new orders.${
        hasLockedFunds ? ' You can withdraw the locked amount once the active orders are cancelled, filled or expired.' : ''
      }${
        hasAvailableFunds ? ' You can withdraw the available amount.' : ''
      }`;
    } else {
      return `Deposit is closed and NOT accepting new orders.`;
    }
  };

  const getStatusLabel = (): string => {
    if (!depositData) return '';

    switch (depositData.status) {
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

  const recipientDetails = getRecipientAddressDisplay({
    recipientAddress: depositData?.depositOwner ?? '',
    tokenData: usdcInfo,
    defaultBlockExplorerUrl: blockscanUrl || ''
  });


  /*
   * Render
   */

  return (
    <Container>
      {fetchDepositLoading ? (
        <>
          <Header>
            <CoinSection>
              <Skeleton width="24px" height="24px" borderRadius="18px" />
              <Skeleton width="150px" height="24px" />
            </CoinSection>
            <Skeleton width="100px" height="32px" borderRadius="16px" />
          </Header>

          <VerticalSection>
            <SectionTitle>Deposit Information</SectionTitle>
            <SectionContent>
              {[...Array(6)].map((_, index) => (
                <InfoItem key={index}>
                  <Skeleton width="100px" />
                  <Skeleton width="120px" />
                </InfoItem>
              ))}
            </SectionContent>
          </VerticalSection>

          <VerticalSection>
            <SectionTitle>Conversion Rates</SectionTitle>
            {[...Array(1)].map((_, platformIndex) => (
              <PlatformGroup key={platformIndex} vertical>
                <Skeleton width="150px" height="20px" />
                <CurrenciesContainer>
                  {[...Array(1)].map((_, currencyIndex) => (
                    <CurrencyItem key={currencyIndex}>
                      <Skeleton width="60px" />
                      <RateContainer>
                        <Skeleton width="80px" />
                        <Skeleton width="24px" height="24px" borderRadius="50%" />
                      </RateContainer>
                    </CurrencyItem>
                  ))}
                </CurrenciesContainer>
              </PlatformGroup>
            ))}
          </VerticalSection>
        </>
      ) : errorLoadingDeposit ? (
        <ErrorContainer>
          <ThemedText.DeprecatedBody textAlign="center">
            <InboxIcon strokeWidth={1} style={{ marginTop: '2em' }} />
            <div>
              Error loading deposit: {errorLoadingDeposit.message}
            </div>
          </ThemedText.DeprecatedBody>
        </ErrorContainer>
      ): depositData && (
        <>
          <Header>
            <CoinSection>
              <TokenSvg src={depositData.tokenIcon} />
              <HeaderAmount>{parseFloat(depositData.originalAmount)} {depositData.tokenTicker}</HeaderAmount>
            </CoinSection>
            <StatusBadge 
              active={depositData.status === DepositStatus.ACTIVE} 
              paused={depositData.status === DepositStatus.WITHDRAWN}
            >
              {getStatusLabel()}
              <QuestionHelper text={getStatusText()} size="xsm" />
            </StatusBadge>
          </Header>

          <VerticalSection>
            {/* <SectionTitle>Deposit Information</SectionTitle> */}
            <SectionContent>
              <InfoItem>
                <InfoLabel>Deposit ID</InfoLabel>
                <InfoValue>{depositId}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Depositor</InfoLabel>
                <InfoValue>{recipientDetails?.value}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Deposited</InfoLabel>
                <InfoValue>{parseFloat(depositData.originalAmount)} {depositData.tokenTicker}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabelWithHelper>
                  <InfoLabel>Available</InfoLabel>
                  <QuestionHelper text="Amount available for takers. This amount is NOT locked and can be withdrawn." size="sm" />
                </InfoLabelWithHelper>
                <InfoValue>{parseFloat(depositData.availableLiquidity)} {depositData.tokenTicker}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabelWithHelper>
                  <InfoLabel>Locked</InfoLabel>
                  <QuestionHelper text="Amount locked by active orders. This amount is locked by takers and cannot be withdrawn immediately." size="sm" />
                </InfoLabelWithHelper>
                <InfoValue>{parseFloat(depositData.amountLockedInIntents)} USDC</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Active Orders</InfoLabel>
                <InfoValue>{depositData.activeOrders.length}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabelWithHelper>
                  <InfoLabel>Order Limit</InfoLabel>
                  <QuestionHelper text="Min and Max amount for takers per order." size="sm" />
                </InfoLabelWithHelper>
                <InfoValue>{parseFloat(depositData.intentAmountRange.min)} - {parseFloat(depositData.intentAmountRange.max)} USDC</InfoValue>
              </InfoItem>
            </SectionContent>
          </VerticalSection>

          <VerticalSection>
            <SectionTitle>Rates per USDC</SectionTitle>
            {Array.from(depositData.conversionRates.entries()).map(([platform, currencies]) => (
              <PlatformGroup key={platform} vertical>
                <PlatformName vertical>{paymentPlatformInfo[platform].platformName}</PlatformName>
                <CurrenciesContainer>
                  {Array.from(currencies.entries()).map(([currency, rate]) => (
                    <CurrencyItem key={currency}>
                      <CurrencyCode>{currencyInfo[currency].currencyCode}</CurrencyCode>
                      <RateContainer>
                        <ConversionRate>{rate}</ConversionRate>
                        {(
                          depositData.status === DepositStatus.ACTIVE &&
                          depositData.depositOwner === loggedInEthereumAddress
                        ) ? (
                          <TransactionIconButton
                            icon="edit"
                            text={`Edit ${currency} rate`}
                            loading={false}
                            onClick={() => handleEditRate(platform, currency, rate)}
                            size={18}
                            hasBackground={false}
                          />
                        ) : (
                          depositData.status === DepositStatus.ACTIVE && 
                          (!isMobile) && (
                            <Tooltip
                              title={currentIntentHash ? "Go to Buy to complete your existing order" : ""}
                              placement="top"
                              arrow
                            >
                              <span>  {/* Wrap Button in span for tooltip to work with disabled button */}
                                <Button
                                  onClick={() => handleBuy(platform, currency, rate)}
                                  height={28}
                                  width={60}
                                  fontSize={12}
                                  disabled={!!currentIntentHash}
                                >
                                  Buy
                                </Button>
                              </span>
                            </Tooltip>
                          )
                        )}
                      </RateContainer>
                    </CurrencyItem>
                  ))}
                </CurrenciesContainer>
              </PlatformGroup>
            ))}
          </VerticalSection>

          {(
            depositData.status !== DepositStatus.CLOSED &&
            depositData.depositOwner === loggedInEthereumAddress
          ) && (
            <ActionSection>
              <Button
                onClick={handleWithdrawClick}
                height={36}
                width={100}
                loading={isWithdrawDepositLoading}
                disabled={isWithdrawDepositLoading}
              >
                Withdraw
              </Button>
            </ActionSection>
          )}

          {showUpdateRateModal && selectedDepositDetails && (
            <UpdateDepositModal
              depositId={selectedDepositDetails.depositId}
              platform={selectedDepositDetails.platform}
              currency={selectedDepositDetails.currency}
              currentRate={selectedDepositDetails.currentRate}
              onBackClick={() => {
                setShowUpdateRateModal(false);
                setSelectedDepositDetails(null);
              }}
              onRateUpdated={() => {
                setShowUpdateRateModal(false);
                setSelectedDepositDetails(null);
                refreshDepositData();
              }}
            />
          )}

          {showBuyModal && selectedBuyDetails && (
            <BuyModal
              depositId={depositId}
              platform={selectedBuyDetails.platform}
              currency={selectedBuyDetails.currency}
              conversionRate={selectedBuyDetails.rate}
              hashedOnchainId={selectedBuyDetails.hashedOnchainId}
              availableLiquidity={depositData.availableLiquidity}
              minOrderAmount={depositData.intentAmountRange.min}
              maxOrderAmount={depositData.intentAmountRange.max}
              onBackClick={() => {
                setShowBuyModal(false);
                setSelectedBuyDetails(null);
              }}
              onOrderCreated={() => {
                setShowBuyModal(false);
                setSelectedBuyDetails(null);
                navigate('/swap?view=sendPayment');
              }}
            />
          )}
        </>
      )}
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  background-color: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 16px;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
`;


const ErrorContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  padding: 36px;
  max-width: 340px;
  min-height: 31.5vh;
  gap: 36px;
`;

const CoinSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TokenSvg = styled.img`
  border-radius: 18px;
  width: 24px;
  height: 24px;
`;


const PlatformGroup = styled.div<{ vertical?: boolean }>`
  display: flex;
  ${props => props.vertical ? 'flex-direction: column;' : ''}
  gap: 0.75rem;
  padding: 8px 0;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(108, 117, 125, 0.2);
    margin-bottom: 4px;
  }

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const PlatformName = styled.span<{ vertical?: boolean }>`
  color: ${props => props.vertical ? '#FFFFFF' : '#6C757D'};
  font-size: ${props => props.vertical ? '16px' : '14px'};
  font-weight: ${props => props.vertical ? '500' : 'normal'};
`;

const CurrencyCode = styled.span`
  color: #6C757D;
  font-size: 14px;
`;

const RateContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ConversionRate = styled.span`
  color: #FFFFFF;
  font-size: 14px;
  text-align: right;
`;


const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderAmount = styled.span`
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 500;
`;

const VerticalSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionTitle = styled.h3`
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const SectionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 4px;
`;

const InfoLabelWithHelper = styled.div`
  display: flex;
  align-items: center;
  color: ${colors.grayText};
  gap: 6px;
`;

const InfoLabel = styled.span`
  color: #6C757D;
  font-size: 14px;
`;

const InfoValue = styled.span`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
`;

const StatusBadge = styled.div<{ active: boolean, paused: boolean }>`
  padding: 6px 12px;
  border-radius: 16px;
  background-color: ${props => props.active ? 'rgba(0, 128, 0, 0.1)' : props.paused ? 'rgba(255, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)'};
  color: ${props => props.active ? '#00FF00' : props.paused ? '#FFFF00' : '#FF6666'};
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`;


const CurrenciesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
`;

const CurrencyItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: ${colors.defaultInputColor};
  border-radius: 8px;
`;

const ActionSection = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-end;
`;

const IconStyle = css`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`;

const InboxIcon = styled(Inbox)`
  ${IconStyle}
`;
