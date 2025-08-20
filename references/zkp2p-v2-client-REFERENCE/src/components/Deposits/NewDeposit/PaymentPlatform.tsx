import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { colors } from '@theme/colors';
import { Trash2, Check, X } from 'react-feather';
import Link from '@mui/material/Link';
import Spinner from '@components/common/Spinner';
import { CurrencyRow } from './CurrencyRow';
import { RowBetween } from '@components/layouts/Row';
import { Input } from '@components/common/Input';
import { PlatformSelector } from '@components/modals/selectors/platform';
import QuestionHelper from '@components/common/QuestionHelper';
import { CurrencyType, PaymentPlatformType, paymentPlatformInfo } from '@helpers/types';
import { ZKP2P_LIQUIDITY_PROVIDERS_FORM_LINK } from '@helpers/docUrls';

import useValidatePayeeDetails from '@hooks/backend/useValidatePayeeDetails';
import useLocalStorage from '@hooks/useLocalStorage';
import { ThemedText } from '@theme/text';
import { AccessoryButton } from '@components/common/AccessoryButton';


interface NewPaymentPlatformProps {
  depositToken: string;
  selectedPlatform: PaymentPlatformType;
  setSelectedPlatform: (platform: PaymentPlatformType) => void;
  payeeDetails: string;
  setPayeeDetails: (payeeDetails: string) => void;
  conversionRates: Map<CurrencyType, string>;
  setConversionRates: (currency: CurrencyType, rate: string) => void;
  allPlatforms: PaymentPlatformType[];
  handleRemovePlatform: () => void;
}

export const NewPaymentPlatform: React.FC<NewPaymentPlatformProps> = ({
  depositToken,
  selectedPlatform,
  setSelectedPlatform,
  payeeDetails,
  setPayeeDetails,
  conversionRates,
  setConversionRates,
  allPlatforms,
  handleRemovePlatform
}) => {
  NewPaymentPlatform.displayName = 'NewPaymentPlatform';
  /*
   * States
   */
  
  const [supportedCurrencies, setSupportedCurrencies] = useState<CurrencyType[]>([]);
  const [remainingCurrencies, setRemainingCurrencies] = useState<CurrencyType[]>([]);
  
  const [storedPayeeDetails, setStoredPayeeDetails] = useLocalStorage<{[key: string]: string}>('STORED_PAYEE_DETAILS', {});
  
  /*
   * Hooks
   */
  const { 
    isLoading, 
    data: validationData, 
    fetchValidatePayeeDetails 
  } = useValidatePayeeDetails();
  

  /*
   * Effects
   */

  useEffect(() => {
    if (!selectedPlatform) {
      setSelectedPlatform(allPlatforms[0]);
    }
  }, [allPlatforms]);

  useEffect(() => {
    if (selectedPlatform) {
      const platformCurrencies = paymentPlatformInfo[selectedPlatform].platformCurrencies;
      setSupportedCurrencies([platformCurrencies[0]]);
      setRemainingCurrencies(platformCurrencies.slice(1));
    }
  }, [selectedPlatform]);

  useEffect(() => {
    if (selectedPlatform && storedPayeeDetails[selectedPlatform] && !payeeDetails) {
      setPayeeDetails(storedPayeeDetails[selectedPlatform]);
    }
  }, [selectedPlatform, storedPayeeDetails]);

  useEffect(() => {
    if (payeeDetails && selectedPlatform) {
      fetchValidatePayeeDetails({
        processorName: selectedPlatform,
        depositData: paymentPlatformInfo[selectedPlatform].depositConfig.getDepositData(payeeDetails)
      });
    }
  }, [payeeDetails, selectedPlatform]);

  /*
   * Helpers
   */

  const getHelperText = (): string => {
    return paymentPlatformInfo[selectedPlatform].depositConfig.payeeDetailInputHelperText;
  };

  const getPlaceholderText = (): string => {
    return paymentPlatformInfo[selectedPlatform].depositConfig.payeeDetailInputPlaceholder;
  };

  const getValidationFailureMessage = (): string => {
    return paymentPlatformInfo[selectedPlatform].depositConfig.payeeDetailValidationFailureMessage;
  };

  /*
   * Handlers
   */

  const onPayeeDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPayeeDetails(e.currentTarget.value);
  };

  const handleAddCurrencyRow = () => {
    const newCurrency = remainingCurrencies[0];
    
    setRemainingCurrencies(prev => prev.slice(1));
    setSupportedCurrencies(prev => [...prev, newCurrency]);
  };

  const handleSelectCurrency = (prevCurrency: CurrencyType, newCurrency: CurrencyType) => {
    setRemainingCurrencies(prev => [...prev, prevCurrency].filter(c => c !== newCurrency));
    setSupportedCurrencies(prev => {
      const index = prev.indexOf(prevCurrency);
      if (index !== -1) {
        const newArray = [...prev];
        newArray[index] = newCurrency;
        return newArray;
      }
      return prev;
    });
  };

  const handleDeleteCurrency = (currencyToDelete: CurrencyType) => {
    setRemainingCurrencies(prev => [...prev, currencyToDelete]);
    setSupportedCurrencies(prev => {
      const index = prev.indexOf(currencyToDelete);
      if (index !== -1) {
        const newArray = [...prev];
        newArray.splice(index, 1);
        return newArray;
      }
      return prev;
    });
    
    setConversionRates(currencyToDelete, '');
  };

  /*
   * Render
   */

  const renderValidationIcon = () => {
    if (!payeeDetails) {
      return null;
    }
    if (isLoading) {
      return <Spinner size={20} color="#ADB5BD" />;
    }
    if (validationData?.responseObject) {
      return <StyledCheck />;
    }
    if (validationData && !validationData.responseObject) {
      return (
        <>
          <StyledX />
          <QuestionHelper text={getValidationFailureMessage()} />
        </>
      );
    }
    return null;
  };

  const showValidationForm = useMemo(() => {
    return paymentPlatformInfo[selectedPlatform].depositConfig.depositRequiresApproval && 
           validationData && 
           !validationData.responseObject;
  }, [selectedPlatform, validationData]);

  return (
    <Container>      
      <RowBetween style={{ padding: '0.25rem 0rem 1.5rem 0rem' }}>
        <div style={{ flex: 0.65 }}>
          <PlatformSelector
            paymentPlatform={selectedPlatform}
            setPaymentPlatform={setSelectedPlatform}
            allPlatforms={allPlatforms}
          />
        </div>

        <div style={{ flex: 0.1 }}>
          <RemovePlatformButton
            onClick={handleRemovePlatform}
          >
            <StyledTrash2/>
          </RemovePlatformButton>
        </div>

      </RowBetween>

      <PayeeDetailsContainer>
        <div>
          <Input
            label="Payee Details"
            name="payeeDetails"
            value={payeeDetails}
            onChange={onPayeeDetailsChange}
            type="string"
            placeholder={getPlaceholderText()}
            helperText={getHelperText()}
          />
          <ValidationIconContainer>
            {renderValidationIcon()}
          </ValidationIconContainer>
        </div>

        {showValidationForm && (
          <ValidationForm>
            <ThemedText.BodySmall>
              Wise currently requires manual approval. Please submit your Wisetag below and allow us up to 24 hours for approval.
            </ThemedText.BodySmall>
            <Link href={ZKP2P_LIQUIDITY_PROVIDERS_FORM_LINK} target="_blank">
              <ThemedText.BodySmall>
                Click here to fill out the form ↗
              </ThemedText.BodySmall>
            </Link>
          </ValidationForm>
        )}
      </PayeeDetailsContainer>

      {supportedCurrencies.map((currCurrency, index) => (
        <RowContainer key={index}>
          <CurrencyRow
            currency={currCurrency}
            conversionRate={conversionRates.get(currCurrency)}
            setConversionRate={setConversionRates}
            depositToken={depositToken}
            supportedCurrencies={[currCurrency, ...remainingCurrencies]}
            onSelectCurrency={handleSelectCurrency}
          />
          {supportedCurrencies.length > 1 && (
            <RemoveCurrencyButton
              onClick={() => handleDeleteCurrency(currCurrency)}
            >
              <StyledTrash2 />
            </RemoveCurrencyButton>
          )}
        </RowContainer>
      ))}

      {remainingCurrencies.length > 0 && (
        <AddCurrencyButtonContainer>
          <AccessoryButton
            onClick={handleAddCurrencyRow}
            height={36}
            icon="plus"
            title="Add Currency"
            iconPosition='left'
            textAlign='right'
            fullWidth={false}
          />
        </AddCurrencyButtonContainer>
      )}
    </Container>
  )
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px;
  padding: 16px;

  @media (max-width: 600px) {
    padding: 12px;
  }
`;

const StyledTrash2 = styled(Trash2)`
  width: 20px;
  height: 20px;
  color: #adb5bd;
`;

const RemovePlatformButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 16px;
  background: none;
  border: none;
  cursor: pointer;
`;

const PayeeDetailsContainer = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ValidationIconContainer = styled.div`
  position: absolute;
  right: 12px;
  top: 55px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ValidationForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border: 1px solid ${colors.warningRed};
  border-radius: 8px;
`;

const StyledCheck = styled(Check)`
  width: 20px;
  height: 20px;
  color: ${colors.connectionStatusGreen};
`;

const StyledX = styled(X)`
  width: 20px;
  height: 20px;
  color: ${colors.connectionStatusRed};
`;

const AddCurrencyButtonContainer = styled.div`
  display: grid;
  justify-content: flex-end;
  margin-top: 0.5rem;
`;

const RowContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RemoveCurrencyButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  
  &:hover {
    opacity: 0.8;
  }
`;