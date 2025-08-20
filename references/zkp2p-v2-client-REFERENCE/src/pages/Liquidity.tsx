import React, { useEffect } from 'react';
import styled from "styled-components";

import LiqudityTable from "@components/Liquidity"

import useEscrowState from '@hooks/contexts/useEscrowState';
import useLiquidity from '@hooks/contexts/useLiquidity';
import useMediaQuery from '@hooks/useMediaQuery';
import { Helmet } from 'react-helmet-async';
import TallySupportButton from '@components/common/TallySupportButton';

export const Liquidity: React.FC = () => {
  /*
   * Contexts
   */

  const currentDeviceSize = useMediaQuery();

  const {
    refetchDepositCounter,
    shouldFetchEscrowState
  } = useEscrowState();
  const {
    refetchDepositViews,
    shouldFetchDepositViews
  } = useLiquidity();

  /*
   * Hooks
   */

  useEffect(() => {
    if (shouldFetchEscrowState) {
      refetchDepositCounter?.();
    }

    if (shouldFetchDepositViews) {
      refetchDepositViews?.();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Helmet>
        <title>ZKP2P | Provide Liquidity and Earn Yield</title>
        <meta 
          name="description" 
          content="Provide liquidity and earn yield on your stablecoins. Fast, no fee, permissionless crypto on-ramp." 
        />
      </Helmet>
    
      <PageWrapper $isMobile={currentDeviceSize === 'tablet' || currentDeviceSize === 'mobile'}>
        <Main>
          <LiqudityTable />
        </Main>

        <TallySupportButton
          page="liquidity"
        />
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
