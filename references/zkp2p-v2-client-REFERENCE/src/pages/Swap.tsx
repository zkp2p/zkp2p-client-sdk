import React, { useEffect, useState } from 'react';
import styled from "styled-components";
import { useLocation, useNavigate } from 'react-router-dom';

import SwapForm from "@components/Swap";
import SendForm from "@components/Send";
import { CompleteOrderForm } from '@components/Swap/CompleteOrder/index';
import { SendPaymentForm } from '@components/Swap/SendPayment';
import { Helmet } from 'react-helmet-async';
import useOnRamperIntents from '@hooks/contexts/useOnRamperIntents';
import useEscrowState from '@hooks/contexts/useEscrowState';
import useBalances from '@hooks/contexts/useBalance';
import useMediaQuery from '@hooks/useMediaQuery';
import { colors } from '@theme/colors';
import useSessionStorage from '@hooks/useSessionStorage';

export const Swap: React.FC = () => {
  const currentDeviceSize = useMediaQuery();
  const location = useLocation();
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  const view = queryParams.get('view');
  const tabParam = queryParams.get('tab');
  const showSendPayment = view === 'sendPayment';

  const { refetchUsdcBalance, shouldFetchUsdcBalance } = useBalances();
  const { refetchIntentView, shouldFetchIntentView } = useOnRamperIntents();
  const { refetchDepositCounter, shouldFetchEscrowState } = useEscrowState();

  const [showCompleteOrder, setShowCompleteOrder] = useState<boolean>(false);
  const [showSendModal, setShowSendModal] = useState<boolean>(showSendPayment);
  const [activeTab, setActiveTab] = useState<'buy' | 'send'>(tabParam === 'send' ? 'send' : 'buy');
  const [showMobileWarning, setShowMobileWarning] = useSessionStorage<boolean>('showMobileWarning', true);

  const isMobile = currentDeviceSize === 'tablet' || currentDeviceSize === 'mobile';

  // Add the useEffect hooks from the original component
  useEffect(() => {
    if (shouldFetchUsdcBalance) {
      refetchUsdcBalance?.();
    }

    if (shouldFetchIntentView) {
      refetchIntentView?.();
    }

    if (shouldFetchEscrowState) {
      refetchDepositCounter?.();
    }

    // Clear the sendPayment query param if it exists
    if (showSendPayment) {
      const newParams = new URLSearchParams(location.search);
      newParams.delete('view');
      navigate(`${location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`, { replace: true });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update URL when tab changes
  useEffect(() => {
    // Initially set the URL tab param if not already present
    const newParams = new URLSearchParams(location.search);
    const currentTabParam = newParams.get('tab');
    
    if (!currentTabParam) {
      newParams.set('tab', activeTab);
      navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update active tab when URL changes
  useEffect(() => {
    const tabFromUrl = queryParams.get('tab');
    if (tabFromUrl === 'send' || tabFromUrl === 'buy') {
      setActiveTab(tabFromUrl);
    }
  }, [location.search, queryParams]);

  const handleTabChange = (tab: 'buy' | 'send') => {
    if (tab === activeTab) return;
    
    setActiveTab(tab);
    
    // Update URL with new tab parameter while preserving other params
    const newParams = new URLSearchParams(location.search);
    newParams.set('tab', tab);
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
  };

  const renderComponent = () => {
    if (showCompleteOrder) {
      return <CompleteOrderForm 
        handleBackClick={() => {
          setShowCompleteOrder(false);
          setShowSendModal(true);
        }}
        handleGoBackToSwap={() => {
          setShowCompleteOrder(false);
          setShowSendModal(false);
          
          // Refresh data after order completion
          refetchIntentView?.();
          refetchUsdcBalance?.();
        }}
      />;
    }

    if (showSendModal) {
      return <SendPaymentForm
        onBackClick={() => setShowSendModal(false)}
        onCompleteClick={() => {
          setShowSendModal(false);
          setShowCompleteOrder(true);
        }}
      />;
    }

    return (
      <TabAndFormContainer>
        <TabContainer>
          <Tab 
            active={activeTab === 'buy'} 
            onClick={() => handleTabChange('buy')}
          >
            Buy
          </Tab>
          <Tab 
            active={activeTab === 'send'} 
            onClick={() => handleTabChange('send')}
          >
            Send
          </Tab>
        </TabContainer>
        {
          activeTab === 'buy' ? 
            <>
              <SwapForm 
                onCompleteOrderClick={() => setShowSendModal(true)}
              />
            </> : 
            <SendForm />
        }
      </TabAndFormContainer>
    );
  }

  return (
    <>
      <Helmet>
        <title>ZKP2P | Buy crypto with Venmo, Zelle and Bank Transfer</title>
        <meta 
          name="description" 
          content="Buy crypto like USDC globally using Venmo, Wise, Revolut, Zelle, Cashapp. Fast, no fee, permissionless crypto on-ramp." 
        />
      </Helmet>
      <PageWrapper $isMobile={isMobile}>
        {renderComponent()}
      </PageWrapper>
    </>
  );
};

const PageWrapper = styled.div<{ $isMobile: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${props => props.$isMobile ? '0' : '4px 8px'};
  padding-bottom: ${props => props.$isMobile ? '4.5rem' : '2rem'};
  height: ${props => props.$isMobile ? '100%' : 'auto'};
  overflow: ${props => props.$isMobile ? 'hidden' : 'visible'};
  margin: 0 auto;

  @media (max-width: 600px) {
    width: 98%;
    margin: 0 auto;
  }
`;

const TabAndFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;

const TabContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  margin-bottom: 5px;
  padding: 5px;
  gap: 10px;

  @media (max-width: 600px) {
    width: 98%;
    margin: 20px auto 5px auto;
    padding-left: 10px;
  }
`;

const Tab = styled.button<{ active: boolean }>`
  background: ${props => props.active ? colors.iconButtonDefault : 'transparent'};
  color: ${props => props.active ? colors.white : colors.grayText};
  border: none;
  border-radius: 12px;
  padding: 8px 8px;
  font-size: 16px;
  max-width: 100px;
  width: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.5s ease;
  flex: 1;
  
  &:hover {
    background: ${props => props.active ? colors.iconButtonDefault : 'rgba(255, 255, 255, 0.05)'};
  }
  
  &:focus {
    outline: none;
  }
`;