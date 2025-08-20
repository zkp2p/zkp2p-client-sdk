import React from "react";
import styled from 'styled-components'
import { ENSName, AddressDisplayEnum } from 'react-ens-name';

import { ensProvider } from "@helpers/ensProvider";
import { SVGIconThemed } from '@components/SVGIcon/SVGIconThemed';
import { AccessoryButton } from '@components/common/AccessoryButton';
import { currencyInfo, paymentPlatformInfo, PaymentPlatformType } from "@helpers/types";
import { colors } from '@theme/colors';
import useSmartContracts from "@hooks/contexts/useSmartContracts";
import { IntentStatusType } from "@helpers/types/curator";
import { Skeleton } from "@components/common/Skeleton";
import useAccount from "@hooks/contexts/useAccount";

interface OrderRowMobileProps {
  index: number;
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

export const OrderRowMobile: React.FC<OrderRowMobileProps> = ({
  index,
  handleReleaseClick,
  paymentPlatform,
  onRamper,
  currencyToReceive,
  fiatAmountToReceive,
  tokenToSend,
  tokenAmountToSend,
  expirationAt,
  status,
  signalTimestamp,
  fulfillTimestamp,
  prunedTimestamp,
  fulfillTxHash,
  intentHash,
  depositOwner,
  refreshAllOrdersForDeposit,
  isLoading = false,
}) => {
  const { blockscanUrl } = useSmartContracts();
  const { isLoggedIn, loggedInEthereumAddress } = useAccount();

  
  const onRamperEtherscanLink = `${blockscanUrl}/address/${onRamper}`;
  const paymentPlatformName = paymentPlatform && paymentPlatformInfo[paymentPlatform]?.platformName || 'Unknown';

  const formatTimestamp = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = () => {
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
  
  // Check if this intent is still valid for release (same logic as OrderRow)
  const isUnknownStatus = React.useMemo(() => {
    // If not a SIGNALED intent, no need to check further
    if (depositOwner && loggedInEthereumAddress !== depositOwner) return false;
    if (status !== 'SIGNALED') return false;
    
    // We need to simulate the intentViews check here - in a real implementation
    // we would use the same hook/state as in OrderRow
    return false; // This would be replaced with actual logic
  }, [status, depositOwner, loggedInEthereumAddress]);

  if (isLoading) {
    return (
      <MobileRowContainer>
        <TopSection>
          <Skeleton width="60px" height="20px" />
          <Skeleton width="120px" />
        </TopSection>

        <DetailsGrid>
          {[...Array(4)].map((_, i) => (
            <DetailRow key={i}>
              <Skeleton width="60px" />
              <Skeleton width="100px" />
            </DetailRow>
          ))}
        </DetailsGrid>

        <ButtonContainer>
          <Skeleton width="100px" height="36px" borderRadius="4px" />
        </ButtonContainer>
      </MobileRowContainer>
    );
  }

  return (
    <MobileRowContainer>
      <TopSection>
        <IndexBadge>#{index + 1} by</IndexBadge>
        <Link href={onRamperEtherscanLink} target="_blank">
          <ENSName
            provider={ensProvider}
            address={onRamper}
            displayType={AddressDisplayEnum.FIRST6}
          />
        </Link>
      </TopSection>

      <DetailsGrid>
        <DetailRow>
          <Label>Release</Label>
          <Value>
            <SVGIconThemed icon={'usdc'} width={'16'} height={'16'} />
            <span>{parseFloat(tokenAmountToSend)} {tokenToSend}</span>
          </Value>
        </DetailRow>

        <DetailRow>
          <Label>Receive</Label>
          <Value>
            <FlagIcon className={`fi fi-${currencyInfo[currencyToReceive].countryCode}`} />
            <span>{parseFloat(fiatAmountToReceive)} {currencyToReceive}</span>
          </Value>
        </DetailRow>

        <DetailRow>
          <Label>Platform</Label>
          <Value>{paymentPlatformName}</Value>
        </DetailRow>

        <DetailRow>
          <Label>Status</Label>
          <StatusValue color={statusInfo.color}>
            {statusInfo.text}
            {statusInfo.subtext && (
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
          </StatusValue>
        </DetailRow>
      </DetailsGrid>

      <ButtonContainer>
        {status === 'SIGNALED' ? (
          isUnknownStatus ? (
            <AccessoryButton
              onClick={refreshAllOrdersForDeposit}
              height={36}
              width={100}
              loading={false}
              title={'Refresh'}
              icon={'refresh'}
            />
          ) : (isLoggedIn && depositOwner && loggedInEthereumAddress && 
            depositOwner.toLowerCase() === loggedInEthereumAddress.toLowerCase()) ? (
            <AccessoryButton
              onClick={handleReleaseClick}
              height={36}
              width={100}
              loading={false}
              title={'Release'}
              icon={'unlock'}
            />
          ) : null
        ) : null}
      </ButtonContainer>
    </MobileRowContainer>
  );
};

const MobileRowContainer = styled.div`
  padding: 1rem 1rem 0.5rem 1rem;
  background: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 16px;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  margin-bottom: 12px;
`;

const TopSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  margin-bottom: 1rem;
`;

const IndexBadge = styled.div`
  background: ${colors.container};
  color: ${colors.grayText};
  padding: 0.25rem 0.25rem;
  border-radius: 12px;
  font-size: 14px;
`;

const DetailsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Label = styled.span`
  color: ${colors.grayText};
  font-size: 14px;
`;

const Value = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${colors.darkText};
  font-size: 14px;
`;

const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;

const Link = styled.a`
  color: ${colors.linkBlue};
  text-decoration: none;
  font-size: 14px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const FlagIcon = styled.span`
  width: 16px;
  height: 16px;
  border-radius: 16px;
  display: inline-block;
  background-size: 150%;
  background-position: center;
`;

const StatusValue = styled.div<{ color: string }>`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  color: ${props => props.color};
  font-size: 14px;
`;

const TimeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
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