import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { AutoColumn } from '@components/layouts/Column';
import { NewPosition } from '@components/Deposits/NewDeposit';
import { DepositTable } from '@components/Deposits/DepositTable';
import { DEPOSIT_REFETCH_INTERVAL } from '@helpers/constants';

import useDeposits from '@hooks/contexts/useDeposits';
import TallySupportButton from '@components/common/TallySupportButton';

export const Deposit: React.FC = () => {
  
  Deposit.displayName = 'Deposit';

  /*
   * Contexts
   */
  const {
    refetchDepositViews,
    shouldFetchDepositViews,
    shouldFetchIntentViews,
    refetchIntentViews,
  } = useDeposits();

  /*
   * State
   */
  const [isAddPosition, setIsAddPosition] = useState<boolean>(false);

  /*
   * Hooks
   */
  useEffect(() => {
    if (shouldFetchDepositViews) {
      const intervalId = setInterval(() => {
        refetchDepositViews?.();
      }, DEPOSIT_REFETCH_INTERVAL);
  
      return () => clearInterval(intervalId);
    }
  }, [shouldFetchDepositViews, refetchDepositViews]);

  useEffect(() => {
    if (shouldFetchIntentViews) {
      const intervalId = setInterval(() => {
        refetchIntentViews?.();
      }, DEPOSIT_REFETCH_INTERVAL);
  
      return () => clearInterval(intervalId);
    }
  }, [shouldFetchIntentViews, refetchIntentViews]);

  /*
   * Handlers
   */
  const handleUpdateClick = () => {
    setIsAddPosition(true);
  }

  const handleBackClickOnNewDeposit = () => {
    setIsAddPosition(false);
    // Immediately refetch when returning from creating a deposit
    // This ensures we show the latest data without waiting for the 5-minute interval
    if (refetchDepositViews) {
      refetchDepositViews();
    }
    if (refetchIntentViews) {
      refetchIntentViews();
    }
  }

  /*
   * Component
   */
  function renderContent() {
    if (isAddPosition) {
      return (
        <NewPositionContainer>
          <NewPosition handleBackClick={handleBackClickOnNewDeposit} />
        </NewPositionContainer>
      );
    }

    return (
      <ContentContainer>
        <DepositTable handleNewPositionClick={handleUpdateClick} />
      </ContentContainer>
    );
  }

  return (
    <Wrapper>
      <Content>
        {renderContent()}
      </Content>

      {isAddPosition ? (
        <TallySupportButton
          page="newDeposit"
        />
      ) : (
        <TallySupportButton
          page="deposit"
        />
      )}
    </Wrapper>
  )
}

const Wrapper = styled(AutoColumn)`
  max-width: 920px;
  width: 100%;
`;

const Content = styled.main`
  gap: 1rem;
`;

const NewPositionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 600px) {
    max-width: 98%;
    margin: 0 auto;
  }
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;
