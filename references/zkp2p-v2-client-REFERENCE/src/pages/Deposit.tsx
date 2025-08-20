import React, { useEffect } from 'react';
import styled from "styled-components";

import { Deposit } from "@components/Deposits";

import useDeposits from '@hooks/contexts/useDeposits';
import useBalances from '@hooks/contexts/useBalance';
import useMediaQuery from '@hooks/useMediaQuery';
import { Helmet } from 'react-helmet-async';
import TallySupportButton from '@components/common/TallySupportButton';


export const DepositPage: React.FC = () => {
  /*
   * Contexts
   */

  const currentDeviceSize = useMediaQuery();

  const {
    refetchDepositViews,
    shouldFetchDepositViews,
    refetchIntentViews,
    shouldFetchIntentViews,
  } = useDeposits();

  const { refetchUsdcBalance, shouldFetchUsdcBalance } = useBalances();

  /*
   * Hooks
   */

  useEffect(() => {
    if (shouldFetchDepositViews) {
      refetchDepositViews?.();
    }

    if (shouldFetchIntentViews) {
      refetchIntentViews?.();
    }

    if (shouldFetchUsdcBalance) {
      refetchUsdcBalance?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Helmet>
        <title>ZKP2P | Sell Crypto to Venmo, Zelle, Revolut and Bank Accounts</title>
        <meta 
          name="description" 
          content="Sell crypto globally like USDC directly to Venmo, Wise, Revolut, Zelle, Cashapp. Fast, no fee, permissionless crypto off-ramp." 
        />
      </Helmet>
      <PageWrapper $isMobile={currentDeviceSize === 'tablet' || currentDeviceSize === 'mobile'}>
        <Main>
          <Deposit />
        </Main>
      </PageWrapper>
    </>
  );
};

const PageWrapper = styled.div<{ $isMobile: boolean }>`
  display: flex;
  flex-direction: column;
  padding-bottom: 7rem;
  
  @media (min-width: 600px) {
    padding: 12px 8px;
    padding-bottom: 3rem;
  }
`;

const Main = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
