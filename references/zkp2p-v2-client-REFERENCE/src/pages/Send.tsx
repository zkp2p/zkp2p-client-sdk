import React, { useEffect } from 'react';
import styled from "styled-components";

import SendForm from "@components/Send";
import useBalances from '@hooks/contexts/useBalance';
import useMediaQuery from '@hooks/useMediaQuery';
import TallySupportButton from '@components/common/TallySupportButton';

export const Send: React.FC = () => {
  /*
   * Contexts
   */

  const currentDeviceSize = useMediaQuery();

  const { refetchUsdcBalance, shouldFetchUsdcBalance, refetchEthBalance, shouldFetchEthBalance } = useBalances();

  /*
   * Hooks
   */

  useEffect(() => {
    if (shouldFetchUsdcBalance) {
      refetchUsdcBalance?.();
    }

    if (shouldFetchEthBalance) {
      refetchEthBalance?.();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageWrapper $isMobile={currentDeviceSize === 'tablet' || currentDeviceSize === 'mobile'}>
      <Main>
        <SendForm />
      </Main>

      <TallySupportButton
        page="send"
      />
    </PageWrapper>
  );
};

const PageWrapper = styled.div<{ $isMobile: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
