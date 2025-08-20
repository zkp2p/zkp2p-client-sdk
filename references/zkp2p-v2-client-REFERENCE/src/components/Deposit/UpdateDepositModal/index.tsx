import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { ArrowLeft } from 'react-feather';

import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { Overlay } from '@components/modals/Overlay';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { Z_INDEX } from '@theme/zIndex';
import { currencyInfo, CurrencyType, paymentPlatformInfo, PaymentPlatformType } from '@helpers/types';
import { etherUnits } from '@helpers/units';

import useDeposits from '@hooks/contexts/useDeposits';
import useUpdateDepositConversionRate from '@hooks/transactions/useUpdateDepositConversionRate';
import useSmartContracts from '@hooks/contexts/useSmartContracts';

interface UpdateDepositModalProps {
  depositId: string;
  platform: PaymentPlatformType;
  currency: CurrencyType;
  currentRate: string;
  onBackClick: () => void;
  onRateUpdated?: () => void;
}

export const UpdateDepositModal: React.FC<UpdateDepositModalProps> = ({
  depositId,
  platform,
  currency,
  currentRate,
  onBackClick,
  onRateUpdated,
}) => {
  /*
   * Contexts
   */
  const { refetchDepositViews } = useDeposits();
  const { platformToVerifierAddress } = useSmartContracts();

  /*
   * States
   */
  
  const [isLoading, setIsLoading] = useState(false);
  const [newConversionRateValue, setNewConversionRateValue] = useState('');
  const [isUpdateRateDone, setIsUpdateRateDone] = useState(false);

  /*
   * Update Deposit Conversion Rate Transaction
   */
  
  const onUpdateRateSuccess = useCallback((data: any) => {
    console.log('updateRate successful: ', data);
    
    refetchDepositViews?.();
    setIsUpdateRateDone(true);
    setNewConversionRateValue('');
    onRateUpdated?.();

  }, [refetchDepositViews, onRateUpdated]);

  const {
    writeUpdateRateAsync,
    setDepositId: setUpdateRateDepositId,
    setVerifier,
    setFiatCurrency,
    newConversionRate,
    setNewConversionRate,
    shouldConfigureUpdateRateWrite,
    setShouldConfigureUpdateRateWrite,
    signUpdateRateTransactionStatus,
    mineUpdateRateTransactionStatus
  } = useUpdateDepositConversionRate(onUpdateRateSuccess);

  /*
   * Effects
   */

  useEffect(() => {
    setUpdateRateDepositId(depositId);
    setVerifier(platformToVerifierAddress[platform] || null);
    setFiatCurrency(currencyInfo[currency].currencyCodeHash);
  }, [depositId, platform, currency, setUpdateRateDepositId, setVerifier, setFiatCurrency]);

  useEffect(() => {
    setIsLoading(
      signUpdateRateTransactionStatus === 'loading' || 
      mineUpdateRateTransactionStatus === 'loading'
    );
  }, [signUpdateRateTransactionStatus, mineUpdateRateTransactionStatus]);


  useEffect(() => {
    const executeUpdateRate = async () => {
      const requiredStatusForExecution = signUpdateRateTransactionStatus === 'idle'
        || signUpdateRateTransactionStatus === 'error'
        || signUpdateRateTransactionStatus === 'success'
      ;

      if (shouldConfigureUpdateRateWrite && writeUpdateRateAsync && requiredStatusForExecution) {
        try {
          // Prevent multiple updates from being triggered on re-render
          setShouldConfigureUpdateRateWrite(false);

          await writeUpdateRateAsync();
        } catch (error) {
          console.log('writeUpdateRateAsync failed: ', error);
          setShouldConfigureUpdateRateWrite(false);
        }
      }
    };

    executeUpdateRate();
  }, [
    shouldConfigureUpdateRateWrite,
    writeUpdateRateAsync,
    signUpdateRateTransactionStatus,
  ]);


  /*
   * Handlers
   */
  
  const handleInputChange = (value: string) => {
    if (value === "") {
      setNewConversionRateValue('');
    } else if (value === ".") {
      setNewConversionRateValue('0.');
    } else if (isValidInput(value)) {
      setNewConversionRateValue(value);
      setNewConversionRate(etherUnits(value).toString());
    }
  };

  const handleOverlayClick = () => {
    onBackClick();
  };

  const handleUpdateRate = async () => {
    if (isUpdateRateDone) {
      setIsUpdateRateDone(false);
      onBackClick();
    } else {
      setShouldConfigureUpdateRateWrite(true);
    }
  };

  /*
   * Helpers
   */
  function isValidInput(value: string) {
    const isValid = /^-?\d*(\.\d{0,4})?$/.test(value);
    return parseFloat(value) >= 0 && isValid;
  }

  /*
   * Component
   */
  return (
    <ModalAndOverlayContainer>
      <Overlay onClick={handleOverlayClick}/>

      <ModalContainer>
        <RowBetween>
          <div style={{ flex: 0.25 }}>
            <button
              onClick={handleOverlayClick}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <StyledArrowLeft/>
            </button>
          </div>

          <ThemedText.HeadlineSmall style={{ flex: '1', margin: 'auto', textAlign: 'center' }}>
            Update Conversion Rate
          </ThemedText.HeadlineSmall>

          <div style={{ flex: 0.25 }}/>
        </RowBetween>

        <BodyContainer>
          <DetailsContainer>
            <DetailsRow>
              <DetailsLabel>Platform:</DetailsLabel>
              <DetailsValue>{paymentPlatformInfo[platform].platformName}</DetailsValue>
            </DetailsRow>
            <DetailsRow>
              <DetailsLabel>Currency:</DetailsLabel>
              <DetailsValue>{currencyInfo[currency].currencyCode}</DetailsValue>
            </DetailsRow>
            <DetailsRow>
              <DetailsLabel>Current Rate:</DetailsLabel>
              <DetailsValue>{currentRate}</DetailsValue>
            </DetailsRow>
          </DetailsContainer>

          <Input
            label="New Conversion Rate"
            name="rateInput"
            value={newConversionRateValue || ''}
            onChange={(e) => handleInputChange(e.currentTarget.value)}
            type="number"
            placeholder={currentRate}
          />

          <Button
            disabled={isUpdateRateDone ? false : (!newConversionRateValue || isLoading)}
            loading={isLoading}
            onClick={handleUpdateRate}
            fullWidth={true}
          >
            {isUpdateRateDone ? 'Go Back' : 'Update Rate'}
          </Button>
        </BodyContainer>
      </ModalContainer>
    </ModalAndOverlayContainer>
  );
};

const ModalAndOverlayContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  position: fixed;
  align-items: flex-start;
  top: 0;
  left: 0;
  z-index: ${Z_INDEX.overlay};
`;

const StyledArrowLeft = styled(ArrowLeft)`
  color: ${colors.darkText};
`;

const ModalContainer = styled.div`
  max-height: 80vh;
  width: 80vw;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  border: 1px solid ${colors.defaultBorderColor};
  padding: 1.5rem 1.5rem;
  background-color: ${colors.container};
  z-index: ${Z_INDEX.overlay};
  gap: 1rem;
  overflow-y: auto;

  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const RowBetween = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
`;

const BodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
`;

const DetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 0.75rem;
  border-radius: 16px;
  border: 1px solid ${colors.defaultBorderColor};
`;

const DetailsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DetailsLabel = styled.span`
  color: ${colors.grayText};
  font-size: 14px;
`;

const DetailsValue = styled.span`
  color: ${colors.darkText};
  font-size: 14px;
  font-weight: 500;
`;
