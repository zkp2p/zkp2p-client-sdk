import React, { useEffect } from 'react';
import styled from "styled-components";

import { Deposit } from "@components/Deposit/index";

import useDeposits from '@hooks/contexts/useDeposits';
import useBalances from '@hooks/contexts/useBalance';
import useMediaQuery from '@hooks/useMediaQuery';
import TallySupportButton from '@components/common/TallySupportButton';

export const DepositDetail: React.FC = () => {
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
    <PageWrapper $isMobile={currentDeviceSize === 'tablet' || currentDeviceSize === 'mobile'}>
      <Main>
        <Deposit />
      </Main>   

      <TallySupportButton
        page="depositDetails"
      />
    </PageWrapper>
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
