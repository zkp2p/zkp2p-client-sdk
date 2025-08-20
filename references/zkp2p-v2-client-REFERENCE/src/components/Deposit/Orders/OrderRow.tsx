import React from "react";
import styled from 'styled-components'
import { ENSName, AddressDisplayEnum } from 'react-ens-name';

import { ensProvider } from "@helpers/ensProvider";
import { SVGIconThemed } from '@components/SVGIcon/SVGIconThemed';
import { AccessoryButton } from '@components/common/AccessoryButton';
import { paymentPlatformInfo, PaymentPlatformType } from "@helpers/types";
import { currencyInfo } from "@helpers/types";
import { IntentStatusType } from "@helpers/types/curator";

import useMediaQuery from "@hooks/useMediaQuery";
import useSmartContracts from "@hooks/contexts/useSmartContracts";
import { colors } from '@theme/colors';
import useDeposits from '@hooks/contexts/useDeposits';
import { Skeleton } from '@components/common/Skeleton';
import useAccount from "@hooks/contexts/useAccount";

interface OrderRowProps {
  index: number;
  depositId: string;
  handleReleaseClick?: () => void;
  paymentPlatform: PaymentPlatformType;
  onRamper: string;
  currencyToReceive: string;
  fiatAmountToReceive: string;
  tokenToSend: string;
  tokenAmountToSend: string;
  expirationAt: string;
  status: IntentStatusType;
  signalTimestamp?: Date;
  fulfillTimestamp?: Date | null;
  prunedTimestamp?: Date | null;
  fulfillTxHash?: string | null;
  intentHash: string;
  depositOwner: string | null;
  refreshAllOrdersForDeposit: () => void;
  isLoading?: boolean;
}

export type OrderRowData = Omit<OrderRowProps, 'refreshAllOrdersForDeposit' | 'depositOwner'>;

interface StatusInfo {
  text: string;
  color: string;
  subtext?: string;
  txHash?: string | null;
}

export const OrderRow: React.FC<OrderRowProps> = ({
  index,
  depositId,
  handleReleaseClick,
  paymentPlatform,
  onRamper,
  currencyToReceive,
  fiatAmountToReceive,
  tokenToSend,
  tokenAmountToSend,
  expirationAt,
  status,
  depositOwner,
  signalTimestamp,
  fulfillTimestamp,
  fulfillTxHash,
  prunedTimestamp,
  intentHash,
  isLoading = false,
  refreshAllOrdersForDeposit,
}: OrderRowProps) => {
  OrderRow.displayName = "OrderRow";

  /*
   * Context
   */

  const { blockscanUrl } = useSmartContracts();
  const isMobile = useMediaQuery() === 'mobile';
  const { 
    intentViews, 
    refetchIntentViews 
  } = useDeposits();
  const { isLoggedIn, loggedInEthereumAddress } = useAccount();
  
  /*
   * State
   */

  /*
   * Effects
   */

  /*
   * Helpers
   */

  const onRamperEtherscanLink = `${blockscanUrl}/address/${onRamper}`;
  const paymentPlatformName = paymentPlatform && paymentPlatformInfo[paymentPlatform]?.platformName || 'Unknown';
  
  /*
   * Component
   */

  const formatTimestamp = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (): StatusInfo => {
    switch (status) {
      case 'PRUNED':
        return {
          text: 'Cancelled',
          color: colors.warningYellow,
          subtext: prunedTimestamp ? formatTimestamp(prunedTimestamp) : undefined
        };
      case 'FULFILLED':
        return {
          text: 'Completed',
          color: colors.validGreen,
          subtext: fulfillTimestamp ? formatTimestamp(fulfillTimestamp) : undefined,
          txHash: fulfillTxHash
        };
      case 'SIGNALED':
        return {
          text: 'Active',
          color: colors.darkText,
          subtext: expirationAt
        };
      default:
        return {
          text: 'Unknown',
          color: colors.grayText
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Check if this intent is still valid for release
  const isUnknownStatus = React.useMemo(() => {
    // If not a SIGNALED intent, no need to check further
    if (depositOwner && loggedInEthereumAddress !== depositOwner) return false;
    if (status !== 'SIGNALED') return false;

    // If we don't have intentViews, refetch them
    if (!intentViews) {
      refetchIntentViews?.();
      return true;
    }

    // Check if this intent exists in intentViews and is still in a valid state
    const matchingIntent = intentViews.find(view => 
      view.intentHash === intentHash
    );
    
    // If the intent is not found in intentViews, it might have already been 
    // processed on-chain
    return (!matchingIntent);
  }, [intentViews, intentHash, refetchIntentViews, status]);

  /*
   * Render
   */

  return (
    <RowContainer>
      <IndexCell>{isLoading ? <Skeleton width="20px" /> : index + 1}</IndexCell>
      <AddressCell>
        {isLoading ? (
          <Skeleton width="120px" />
        ) : (
          <Link href={onRamperEtherscanLink} target="_blank">
            <ENSName
              provider={ensProvider}
              address={onRamper}
              displayType={AddressDisplayEnum.FIRST6}
            />
          </Link>
        )}
      </AddressCell>
      
      <AmountCell>
        {isLoading ? (
          <Skeleton width="100px" />
        ) : (
          <>
            {!isMobile && <SVGIconThemed icon={'usdc'} width={'20'} height={'20'} />}
            <span>{parseFloat(tokenAmountToSend)} {tokenToSend}</span>
          </>
        )}
      </AmountCell>
      
      <RateCell>
        {isLoading ? (
          <Skeleton width="100px" />
        ) : (
          <>
            {!isMobile && <FlagIcon className={`fi fi-${currencyInfo[currencyToReceive].countryCode}`} />}
            <span>{parseFloat(fiatAmountToReceive)} {currencyToReceive}</span>
          </>
        )}
      </RateCell>

      <PlatformCell>
        {isLoading ? (
          <>
            <Skeleton width="80px" />
            <Skeleton width="60px" height="12px" />
          </>
        ) : (
          <>
            {paymentPlatformName}
          </>
        )}
      </PlatformCell>

      <StatusCell color={isLoading ? colors.grayText : statusInfo.color}>
        {isLoading ? (
          <>
            <Skeleton width="60px" />
            <Skeleton width="100px" height="12px" />
          </>
        ) : (
          <>
            <StatusText isUnknownStatus={isUnknownStatus}>
              {isUnknownStatus ? '-' : statusInfo.text}
            </StatusText>
            {status === 'SIGNALED' && !isUnknownStatus && (
              <TimeInfoSubtext>
                {expirationAt}
              </TimeInfoSubtext>
            )}
          </>
        )}
      </StatusCell>
      
      <ActionCell>
        {isLoading ? (
          <Skeleton width="80px" height="36px" borderRadius="4px" />
        ) : (
          status === 'SIGNALED' ? (
            isUnknownStatus ? (
              <ButtonContainer>
                <AccessoryButton
                  onClick={refreshAllOrdersForDeposit}
                  height={36}
                  width={80}
                  loading={false}
                  title={'Refresh'}
                  icon={isMobile ? undefined : 'refresh'}
                />
              </ButtonContainer>
            ) : (isLoggedIn && depositOwner && loggedInEthereumAddress && 
                depositOwner.toLowerCase() === loggedInEthereumAddress.toLowerCase()) ? (
              <ButtonContainer>
                <AccessoryButton
                  onClick={handleReleaseClick}
                  height={36}
                  loading={false}
                  width={80}
                  title={'Release'}
                  icon={isMobile ? undefined : 'unlock'}
                />
              </ButtonContainer>
            ) : (
              '-'
            )
          ) : (
            <>
              {statusInfo.subtext && !isUnknownStatus && (
                <TimeInfo>
                  {statusInfo.subtext}
                  {statusInfo.txHash && (
                    <TxLink 
                      href={`${blockscanUrl}/tx/${statusInfo.txHash}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ↗
                    </TxLink>
                  )}
                </TimeInfo>
              )}
            </>
          )
        )}
      </ActionCell>
    </RowContainer>
  );
};

const RowContainer = styled.div`
  display: grid;
  grid-template-columns: 0.2fr 1fr 1.5fr 1.5fr 1fr 1fr 1.2fr;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  align-items: center;
  border-bottom: 1px solid ${colors.defaultBorderColor};
  
  &:hover {
    background-color: ${colors.container};
  }
  
  &:last-child {
    border-bottom: none;
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
  }
`;

const Cell = styled.div`
  font-size: 14px;
  color: ${colors.darkText};

  @media (max-width: 600px) {
    font-size: 12px;
  }
`;

const IndexCell = styled(Cell)`
  color: ${colors.grayText};
`;

const AddressCell = styled(Cell)`
  overflow: hidden;
  
  a {
    color: ${colors.linkBlue};
    text-decoration: none;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const AmountCell = styled(Cell)`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
`;

const RateCell = styled(AmountCell)``;

const PlatformCell = styled(Cell)`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PlatformSubtext = styled.span`
  color: ${colors.grayText};
  font-size: 12px;
`;

const ActionCell = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Link = styled.a`
  white-space: pre;
  display: inline-block;
  color: #1F95E2;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;


const FlagIcon = styled.span`
  width: 20px;
  height: 20px;
  border-radius: 18px;
  display: inline-block;
  background-size: 150%;
  background-position: center;
`;

const StatusCell = styled.div<{ color: string }>`
  font-size: 14px;
  color: ${props => props.color};
  display: flex;
  flex-direction: column;
  gap: 4px;

  @media (max-width: 600px) {
    font-size: 12px;
  }
`;

const StatusText = styled.span<{ isUnknownStatus: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${props => props.isUnknownStatus ? colors.grayText : props.color};
`;

const TimeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${colors.darkText};
  font-size: 12px;
`;

const TimeInfoSubtext = styled.span`
  color: ${colors.grayText};
  font-size: 12px;
`;

const TxLink = styled.a`
  color: ${colors.linkBlue};
  display: flex;
  align-items: center;
  opacity: 0.8;
  transition: opacity 0.2s;
  margin-left: 4px;

  &:hover {
    opacity: 1;
  }
`;
