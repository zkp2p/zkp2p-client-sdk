import React, { useEffect, useState, useCallback } from "react";
import styled, { css } from 'styled-components';
import { Inbox } from 'react-feather';
import { colors } from '@theme/colors';
import { ArrowLeft } from 'react-feather';
import { ThemedText } from '@theme/text';
import { useParams } from 'react-router-dom';

import useMediaQuery from "@hooks/useMediaQuery";
import { useNavigate } from 'react-router-dom';
import { AutoColumn } from '@components/layouts/Column';

import { DepositDetails } from '@components/Deposit/DepositDetails';
import { OrdersTable } from "@components/Deposit/Orders/OrdersTable";
import { CustomConnectButton } from "@components/common/ConnectButton";

import useGetDeposit from "@hooks/backend/useGetDeposit";
import useAccount from "@hooks/contexts/useAccount";

const WAIT_TIME_FOR_DB_REFRESH = 3000;

export const Deposit: React.FC = () => {
  Deposit.displayName = 'Deposit';

  const { depositId } = useParams<{ depositId: string }>();
  const isMobile = useMediaQuery() === 'mobile';
  const navigate = useNavigate();

  const { isLoggedIn } = useAccount();

  /*
   * State
   */
  const [fetchDepositLoading, setFetchDepositLoading] = useState(false);
  const [depositOwner, setDepositOwner] = useState<string | null>(null);

  /*
   * Hooks
   */
  const { 
    data: deposit, 
    isLoading, 
    error: errorLoadingDeposit, 
    fetchDeposit 
  } = useGetDeposit();

  /*
   * Effects
   */
  useEffect(() => {
    if (isLoggedIn && depositId) {
      fetchDeposit(depositId);
    }
  }, [isLoggedIn, depositId, fetchDeposit]);

  useEffect(() => {
    setFetchDepositLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (deposit) {
      setDepositOwner(deposit.depositor);
    }
  }, [deposit]);

  /*
   * Handlers
   */
  const handleBackClick = () => {
    navigate(-1);
  };

  const refreshDepositData = useCallback(() => {
    setFetchDepositLoading(true);
    
    setTimeout(() => {
      if (depositId) {
        fetchDeposit(depositId);
        setFetchDepositLoading(false);
      }
    }, WAIT_TIME_FOR_DB_REFRESH);
  }, [depositId, fetchDeposit]);

  /*
   * Render
   */
  
  return (
    <Wrapper>
      <Content>
        <HeaderContainer>
          <StyledArrowLeft
            onClick={handleBackClick}
            height={40}
          />
          <ThemedText.HeadlineSmall>Deposit</ThemedText.HeadlineSmall>
        </HeaderContainer>

        {!isLoggedIn ? (
          <ErrorContainer>
            <ThemedText.DeprecatedBody textAlign="center">
              <InboxIcon strokeWidth={1} style={{ marginTop: '2em' }} />
              <div>
                Deposit details will appear here
              </div>
            </ThemedText.DeprecatedBody>
            <CustomConnectButton width={152} />
          </ErrorContainer>
        ) : depositId && (
          <DetailsContainer isMobile={isMobile}>
            <DepositDetailsContainer>
              <DepositDetails
                depositId={depositId}
                deposit={deposit}
                fetchDepositLoading={fetchDepositLoading}
                errorLoadingDeposit={errorLoadingDeposit}
                refreshDepositData={refreshDepositData}
                onBackClick={handleBackClick}
              />
            </DepositDetailsContainer>
          
            <OrdersContainer>
              <OrdersTable
                depositId={depositId}
                depositOwner={depositOwner}
              />
            </OrdersContainer>
          </DetailsContainer>
        )}
      </Content>
    </Wrapper>
  );
};

const Wrapper = styled(AutoColumn)`
  max-width: 1220px;
  width: 100%;

  @media (max-width: 600px) {
    width: 98%;
  }
`;

const Content = styled.main`
  gap: 1.5rem;
  display: flex;
  flex-direction: column;

  @media (max-width: 600px) {
    gap: 0.5rem;
  }
`;

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;

  @media (max-width: 600px) {
    gap: 1rem;
    padding: 0 1rem;
  }
`;

const DetailsContainer = styled.div<{ isMobile: boolean }>`
  display: flex;
  flex-direction: row;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const DepositDetailsContainer = styled.div`
  flex: 1;
`;

const OrdersContainer = styled.div`
  flex: 2.5;
  
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StyledArrowLeft = styled(ArrowLeft)`
  color: ${colors.white};
  cursor: pointer;
`;

const ErrorContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  padding: 36px;
  min-height: 31.5vh;
  gap: 36px;

  width: 100%;
  background-color: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 16px;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
`;


const IconStyle = css`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`;

const InboxIcon = styled(Inbox)`
  ${IconStyle}
`;
