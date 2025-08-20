import React from "react";
import styled from 'styled-components';
import { ENSName, AddressDisplayEnum } from 'react-ens-name';
import Link from '@mui/material/Link';
import { colors } from '@theme/colors';


import { PaymentPlatformType, CurrencyType, currencyInfo, PaymentPlatform } from '@helpers/types';
import { paymentPlatformInfo } from '@helpers/types';
import { usdcInfo } from '@helpers/types/tokens';
import { ensProvider } from "@helpers/ensProvider";

import useSmartContracts from "@hooks/contexts/useSmartContracts";

interface LiquidityRowMobileProps {
  depositor: string;
  // token: string;
  availableLiquidity: string;
  currency: CurrencyType;
  conversionRate: string;
  platform: PaymentPlatformType;
  limits: {
    min: string;
    max: string;
  };
  apr: number | null;
  spread: number | null;
}

export const LiquidityRowMobile: React.FC<LiquidityRowMobileProps> = ({
  depositor,
  // token,
  availableLiquidity,
  currency,
  conversionRate,
  platform, 
  limits,
  apr,
  spread
}) => {

  /*
   * Contexts
   */

  const {
    blockscanUrl
  } = useSmartContracts();
  
  /*
   * Constants
   */

  const tokenTicker = usdcInfo.ticker;
  const depositorEtherscanLink = `${blockscanUrl}/address/${depositor}`;
  const platformName = paymentPlatformInfo[platform] ? paymentPlatformInfo[platform].platformName : '-';

  /*
   * Component
   */

  return (
    <Container>
      <PriceHeader>
        <PriceSection>
          <FlagIcon className={`fi fi-${currencyInfo[currency].countryCode}`} />
          <PriceInfo>
            <PriceText>{conversionRate} {currency}</PriceText>
            <PriceSubtext>Price per 1 {tokenTicker}</PriceSubtext>
          </PriceInfo>
        </PriceSection>
        {spread !== null && (
          <SpreadBadge>
            {spread.toFixed(2)}% spread
          </SpreadBadge>
        )}
      </PriceHeader>

      <RowContent>
        {/* Depositor Info */}
        <DepositorSection>
          <ByText>
            By
          </ByText>
          <Link href={depositorEtherscanLink} target="_blank">
            <ENSNameWrapper>
              <ENSName
                provider={ensProvider}
                address={depositor}
                displayType={AddressDisplayEnum.FIRST6}
              />
            </ENSNameWrapper>
          </Link>
          {apr !== null && (
            <APRBadge>
              {apr.toFixed(2)}% APR
            </APRBadge>
          )}
        </DepositorSection>

        {/* Available & Limits */}
        <InfoSection>
          <InfoRow>
            <Label>Available</Label>
            <Value>{availableLiquidity} {tokenTicker}</Value>
          </InfoRow>
          <InfoRow>
            <Label>Limits</Label>
            <Value>{limits.min} – {limits.max} {currency}</Value>
          </InfoRow>
          <InfoRow>
            <Label>Payment Method</Label>
            <PlatformValue>
              <PlatformLogo platform={platform} />
              <Value>{platformName}</Value>
            </PlatformValue>
          </InfoRow>
        </InfoSection>
      </RowContent>
    </Container>
  );
};

const Container = styled.div`
  background: ${colors.container};
  padding: 16px;
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 16px;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
`;

const PriceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const PriceSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PriceInfo = styled.div`
  display: flex;
  flex-direction: column;
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
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
  line-height: 1.2;
`;

const PriceSubtext = styled.span`
  font-size: 14px;
  color: ${colors.grayText};
`;


const RowContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const DepositorSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ByText = styled.span`
  color: ${colors.grayText};
  font-size: 14px;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Label = styled.span`
  color: ${colors.grayText};
  font-size: 14px;
`;

const Value = styled.span`
  color: #FFFFFF;
  font-size: 14px;
`;

const ENSNameWrapper = styled.div`
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 500;
`;

const SpreadBadge = styled.div`
  background-color: rgba(108, 117, 125, 0.2);
  color: ${colors.grayText};
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 8px;
  font-weight: 500;
`;

const APRBadge = styled.div`
  background-color: rgba(40, 167, 69, 0.2);
  color: #28a745;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 8px;
  font-weight: 500;
  margin-left: auto;
`;

const PlatformValue = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const PlatformLogoFallback = styled.div<{ $backgroundColor?: string }>`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background-color: ${props => props.$backgroundColor || 'rgba(255, 255, 255, 0.1)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  color: #FFFFFF;
`;

const PlatformLogoImg = styled.img`
  width: 20px;
  height: 20px;
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
