import React, { useEffect, useState } from "react";
import styled from 'styled-components';
import { ENSName, AddressDisplayEnum } from 'react-ens-name';
import Link from '@mui/material/Link';
import { useNavigate } from "react-router-dom";
import { Tooltip } from '@mui/material';

import { PaymentPlatformType, CurrencyType, currencyInfo, PaymentPlatform } from '@helpers/types';
import { paymentPlatformInfo } from '@helpers/types';
import { usdcInfo } from '@helpers/types/tokens';
import { ensProvider } from "@helpers/ensProvider";

import useSmartContracts from "@hooks/contexts/useSmartContracts";
import { AccessoryButton } from "@components/common/AccessoryButton";
import { BuyModal } from '@components/Deposit/Buy/BuyModal';
import useOnRamperIntents from "@hooks/contexts/useOnRamperIntents";
import useAccount from "@hooks/contexts/useAccount";

interface LiquidityRowProps {
  depositId: string;
  depositor: string;
  availableLiquidity: string;
  currency: CurrencyType;
  conversionRate: string;
  platform: PaymentPlatformType;
  rowIndex: number;
  limits: {
    min: string;
    max: string;
  };
  apr: number | null;
  spread: number | null;
  hashedOnchainId: string;
}


export const LiquidityRow: React.FC<LiquidityRowProps> = ({
  depositId,
  depositor,
  // token,
  availableLiquidity,
  currency,
  conversionRate,
  platform,
  rowIndex,
  limits,
  apr,
  spread,
  hashedOnchainId
}) => {
  const navigate = useNavigate();
  
  const { currentIntentHash } = useOnRamperIntents();
  const { loggedInEthereumAddress } = useAccount();
  const {
    blockscanUrl
  } = useSmartContracts();
  

  /*
   * State
   */

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [isSeller, setIsSeller] = useState(false);

  /*
   * Effects
   */

  useEffect(() => {
    setIsSeller(depositor === loggedInEthereumAddress);
  }, [depositor, loggedInEthereumAddress]);

  /*
   * Helpers
   */

  const tokenTicker = usdcInfo.ticker;
  const platformName = paymentPlatformInfo[platform] ? paymentPlatformInfo[platform].platformName : '-';
  const depositorEtherscanLink = `${blockscanUrl}/address/${depositor}`;

  const getFormattedAmount = (amount: string) => {
    return parseFloat(amount).toLocaleString('en-US') + ' ' + tokenTicker;
  }

  const getFormattedAmountRange = (min: string, max: string) => {
    return parseFloat(min).toLocaleString('en-US') + ' – ' + parseFloat(max).toLocaleString('en-US') + ' ' + tokenTicker;
  }

  /*
   * Handlers
   */

  const handleBuyButtonClick = () => {
    setShowBuyModal(true);
  }

  /*
   * Component
   */

  return (
    <Container>
      <RowContent>
        {/* Price */}
        <PriceSection>
          <FlagIcon className={`fi fi-${currencyInfo[currency].countryCode}`} />
          <PriceInfo>
            <PriceText>{conversionRate} {currency}</PriceText>
            {spread !== null && <SpreadBadge isNegative={spread < 0}>{spread}%</SpreadBadge>}
          </PriceInfo>
        </PriceSection>

        {/* APR */}
        <AvailableSection>  
          <APRContainer>
            <Value>{apr !== null ? `${apr}\u00A0%` : '-'}</Value>
          </APRContainer>
        </AvailableSection>

        {/* Depositor */}
        <Section>
          <Value>
            <Link href={depositorEtherscanLink} target="_blank">
              <ENSNameWrapper>
                <ENSName
                  provider={ensProvider}
                  address={depositor}
                  displayType={AddressDisplayEnum.FIRST6}
                />
              </ENSNameWrapper>
            </Link>
          </Value>
        </Section>

        {/* Platform */}
        <Section>
          <PlatformContainer>
            <PlatformLogo platform={platform} />
            <Value>{platformName}</Value>
          </PlatformContainer>
        </Section>

        {/* Available Amount */}
        <AvailableSection>
          <Value>{getFormattedAmount(availableLiquidity)}</Value>
        </AvailableSection>

        <AvailableSection>
          <Value>{getFormattedAmountRange(limits.min, limits.max)}</Value>
        </AvailableSection>

        {/* Amounts Section */}
      
        <ButtonSection>
          <Tooltip
            title={isSeller ? "You are the seller" : currentIntentHash ? "Go to Buy to complete your existing order" : ""}
            placement="top"
            arrow
          >
            <span>
              <AccessoryButton
                borderRadius={16}
                onClick={handleBuyButtonClick}
                height={42}
                width={80}
                textAlign="center"
                useSecondaryColors={isSeller ? false : currentIntentHash ? false : true}
                disabled={isSeller || !!currentIntentHash}
              >
                Buy
              </AccessoryButton>
            </span>
          </Tooltip>
        </ButtonSection>
      </RowContent>

      {showBuyModal && (
        <BuyModal
          depositId={depositId}
          platform={platform}
          currency={currency}
          conversionRate={conversionRate}
          hashedOnchainId={hashedOnchainId}
          availableLiquidity={availableLiquidity}
          minOrderAmount={limits.min}
          maxOrderAmount={limits.max}
          onBackClick={() => setShowBuyModal(false)}
          onOrderCreated={() => {
            setShowBuyModal(false);
            navigate('/swap?view=sendPayment');
          }}
        />
      )}
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
`;

const RowContent = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.2fr 1fr;
  gap: 1.5rem;
  padding: 0rem 1.5rem;
  align-items: center;
  min-height: 60px;
`;

const RowIndex = styled.span`
  color: #6C757D;
  font-size: 14px;
`;

const Section = styled.div`
  display: flex;
  font-size: 15px;
  color: #FFFFFF;
  align-items: center;
`;

const ButtonSection = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
`;

const PriceSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PriceInfo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const FlagIcon = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 18px;
  display: inline-block;
  background-size: 150%;
  background-position: center;
`;

const PriceText = styled.span`
  font-size: 20px;
  font-weight: 500;
  color: #FFFFFF;
`;

const AvailableSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const Value = styled.span`
  color: #FFFFFF;
  font-size: 15px;

  @media (max-width: 600px) {
    font-size: 14px;
  };
`;

const ENSNameWrapper = styled.div`
  max-width: 144px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const APRContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SpreadBadge = styled.span<{ isNegative?: boolean }>`
  background-color: rgba(108, 117, 125, 0.2);
  color: ${props => props.isNegative ? '#FF4D4D' : '#9AA3AF'};
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  height: fit-content;
  display: inline-flex;
  align-items: center;
`;

const PlatformContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PlatformLogoFallback = styled.div<{ $backgroundColor?: string }>`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background-color: ${props => props.$backgroundColor || 'rgba(255, 255, 255, 0.1)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: #FFFFFF;
`;

const PlatformLogoImg = styled.img`
  width: 24px;
  height: 24px;
  object-fit: contain;
`;

const PlatformLogo: React.FC<{ platform: PaymentPlatformType }> = ({ platform }) => {
  const platformConfig = paymentPlatformInfo[platform];
  
  // For Venmo and PayPal, use letter fallbacks with their brand colors
  if (platform === PaymentPlatform.VENMO) {
    return <PlatformLogoFallback $backgroundColor={platformConfig?.platformColor}>V</PlatformLogoFallback>;
  }
  if (platform === PaymentPlatform.PAYPAL) {
    return <PlatformLogoFallback $backgroundColor={platformConfig?.platformColor}>P</PlatformLogoFallback>;
  }
  
  // For other platforms, show logo if available
  if (platformConfig?.platformLogo) {
    return <PlatformLogoImg src={platformConfig.platformLogo} alt={platformConfig.platformName} />;
  }
  
  // Generic fallback with platform color if available
  return (
    <PlatformLogoFallback $backgroundColor={platformConfig?.platformColor}>
      {platformConfig?.platformName?.[0] || '?'}
    </PlatformLogoFallback>
  );
};

