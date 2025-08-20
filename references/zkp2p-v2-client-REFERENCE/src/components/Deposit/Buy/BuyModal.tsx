import React, { useState, useEffect, useCallback } from "react";
import styled from 'styled-components';
import { X, RefreshCw } from 'react-feather';
import { parseUnits, formatUnits } from 'viem';

import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { Button } from '@components/common/Button';
import { AutoColumn } from '@components/layouts/Column';
import { CustomConnectButton } from '@components/common/ConnectButton';
import { Input } from '@components/common/Input';
import { Overlay } from '@components/modals/Overlay';
import Spinner from '@components/common/Spinner';

import { CurrencyType, currencyInfo } from '@helpers/types/currency';
import { PaymentPlatformType, paymentPlatformInfo } from '@helpers/types/paymentPlatform';
import { tokenUnitsToReadable } from '@helpers/units';
import useMediaQuery from "@hooks/useMediaQuery";
import { ZERO } from '@helpers/constants';
import { usdcInfo } from "@helpers/types/tokens";
import { calculateFiatFromRequestedUSDC } from '@helpers/intentHelper';

import useSignalIntent from '@hooks/transactions/useSignalIntent';
import useSignIntent from '@hooks/backend/useSignIntent';
import useAccount from '@hooks/contexts/useAccount';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import useOnRamperIntents from "@hooks/contexts/useOnRamperIntents";
import useBackend from '@hooks/contexts/useBackend';
import useQuoteStorage from "@hooks/useQuoteStorage";
import { extractIntentHashFromLogs } from '@helpers/eventParser';


const SignalIntentStatus = {
  DEFAULT: 'default',
  INVALID_AMOUNT: 'invalid-amount',
  CREATE_ORDER: 'create-order',
  FETCHING_SIGNED_INTENT: 'fetching-signed-intent',
  FAILED_TO_FETCH_SIGNED_INTENT: 'failed-to-fetch-signed-intent',
  SIGNAL_INTENT_TRANSACTION_LOADING: 'transaction-loading',
  SIGNAL_INTENT_TRANSACTION_MINING: 'transaction-mining',
  SIGNAL_INTENT_TRANSACTION_FAILED: 'transaction-failed',
  DONE: 'done'
}

type SignalIntentStatusType = typeof SignalIntentStatus[keyof typeof SignalIntentStatus];
interface BuyModalProps {
  depositId: string;
  platform: PaymentPlatformType;
  currency: CurrencyType;
  conversionRate: string;
  hashedOnchainId: string;
  availableLiquidity: string;
  minOrderAmount: string;
  maxOrderAmount: string;
  onBackClick: () => void;
  onOrderCreated: () => void;
}

export const BuyModal: React.FC<BuyModalProps> = ({
  depositId,
  platform,
  currency,
  conversionRate,
  hashedOnchainId,
  availableLiquidity,
  minOrderAmount,
  maxOrderAmount,
  onBackClick,
  onOrderCreated,
}) => {
  const isMobile = useMediaQuery() === 'mobile';
  
  /*
   * Contexts & Hooks
   */
  const { isLoggedIn, loggedInEthereumAddress } = useAccount();
  const { platformToVerifierAddress, usdcAddress, chainId } = useSmartContracts();
  const { refetchIntentView } = useOnRamperIntents();
  const { clearPayeeDetails } = useBackend();
  const { saveQuoteData } = useQuoteStorage();

  /*
   * State
   */
  const [fiatAmount, setFiatAmount] = useState<string>('');
  const [tokenAmount, setTokenAmount] = useState<bigint>(ZERO);
  const [isExactFiatInput, setIsExactFiatInput] = useState<boolean>(false);
  const [signalIntentStatus, setSignalIntentStatus] = useState<SignalIntentStatusType>(SignalIntentStatus.DEFAULT);

  const [errorMessage, setErrorMessage] = useState<string>('');

  /*
   * API Hooks
   */
  const {
    data: signedIntentResponse,
    isLoading: isFetchingSignedIntent,
    error: signedIntentError,
    fetchSignedIntent
  } = useSignIntent();

  /*
   * Contract Writes
   */
  const onSignalIntentSuccessCallback = useCallback((data: any) => {
    console.log('writeSignalIntentAsync successful: ', data);

    if (data && data.logs) {
      let intentHash = extractIntentHashFromLogs(data.logs) || '';
      
      const quoteData = {
        usdcAmount: tokenAmount.toString(),
        fiatAmount: fiatAmount,
        fiatCurrency: currency,
        token: usdcInfo.tokenId,
        recipientAddress: loggedInEthereumAddress || '',
        paymentPlatform: platform,
        transactionHash: data.hash || undefined,
        intentHash: intentHash || undefined
      };

      // Use logged-in address as the key - available immediately
      saveQuoteData(loggedInEthereumAddress || '', intentHash, quoteData);
    }  

    setShouldConfigureSignalIntentWrite(false);
    clearPayeeDetails();
    refetchIntentView?.();
  }, [refetchIntentView, tokenAmount, fiatAmount, currency, loggedInEthereumAddress, platform, saveQuoteData]);

  const onSignalIntentFailedCallback = async (data: any) => {
    console.log('writeSignalIntentAsync failed: ', data);

    setSignalIntentStatus(SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_FAILED);
    setErrorMessage('Transaction failed. Please try again.');
  };

  const {
    writeSignalIntentAsync,
    setDepositIdInput,
    setTokenAmountInput,
    setRecipientAddressInput,
    setVerifierAddressInput,
    setCurrencyCodeHashInput,
    setGatingServiceSignatureInput,
    signSignalIntentTransactionStatus,
    mineSignalIntentTransactionStatus,
    shouldConfigureSignalIntentWrite,
    setShouldConfigureSignalIntentWrite
  } = useSignalIntent(
    onSignalIntentSuccessCallback, 
    onSignalIntentFailedCallback
  );

  /*
   * Effects
   */
  
  // Calculate token amount when fiat amount changes
  useEffect(() => {
    if (isExactFiatInput && fiatAmount && parseFloat(fiatAmount) > 0 && conversionRate) {
      try {
        // 1 USDC = X fiat, so fiatAmount / conversionRate = USDC amount
        const rate = parseFloat(conversionRate);
        if (rate > 0) {
          const calculatedUsdcAmount = parseFloat(fiatAmount) / rate;
          
          // Round down to 6 decimal places for USDC
          const roundedDownUsdc = Math.floor(calculatedUsdcAmount * 1e6) / 1e6;
          
          // Convert to BigNumber with 6 decimals (USDC)
          const usdcAmountBn = parseUnits(roundedDownUsdc.toFixed(6), 6);
          setTokenAmount(usdcAmountBn);
        }
      } catch (error) {
        console.error('Error calculating token amount:', error);
        setTokenAmount(ZERO);
      }
    }
  }, [fiatAmount, conversionRate, isExactFiatInput]);

  // Calculate fiat amount when token amount changes
  useEffect(() => {
    if (!isExactFiatInput && tokenAmount !== 0n && conversionRate) {
      try {
        // Convert rate to BigNumber with the right precision
        const rateBN = parseUnits(conversionRate, 18);
        
        // Use the helper function to calculate fiat with proper rounding
        const fiatAmountBN = calculateFiatFromRequestedUSDC(
          tokenAmount,
          rateBN,
          6 // USDC decimals
        );
        
        // Convert to displayable string (with 18 decimals precision)
        const fiatValue = formatUnits(fiatAmountBN, 6);
        
        // Format with 2 decimal places for display
        setFiatAmount(Number(fiatValue).toFixed(2));
      } catch (error) {
        console.error('Error calculating fiat amount:', error);
        setFiatAmount('');
      }
    }
  }, [tokenAmount, conversionRate, isExactFiatInput]);

  // Validate amounts and set error message
  useEffect(() => {
    let invalidAmount = false;

    if (fiatAmount === '' || fiatAmount === '0' || fiatAmount === '0.') {
      setSignalIntentStatus(SignalIntentStatus.DEFAULT);
      return;
    }
    
    if (isExactFiatInput) {
      if (parseFloat(fiatAmount) <= 0) {
        setErrorMessage('Please enter a valid amount');
        invalidAmount = true;
      }

      const minFiatAmount = paymentPlatformInfo[platform].minFiatAmount;
      if (parseFloat(fiatAmount) < parseFloat(minFiatAmount)) {
        setErrorMessage(`Minimum amount is ${currencyInfo[currency].currencySymbol}${minFiatAmount}`);
        invalidAmount = true;
      }
    } else {
      if (tokenAmount === 0n) {
        setErrorMessage('Please enter a valid amount');
        invalidAmount = true;
      }

      const minFiatAmount = paymentPlatformInfo[platform].minFiatAmount;
      const minTokenAmount = parseFloat(minFiatAmount) / parseFloat(conversionRate);
      if (parseFloat(tokenUnitsToReadable(tokenAmount, 6, 6)) < minTokenAmount) {
        setErrorMessage(`Minimum amount is ${minTokenAmount.toFixed(2)} USDC`);
        invalidAmount = true;
      }
    }

    // Check if requested amount exceeds available liquidity
    if (availableLiquidity && tokenAmount !== 0n) {
      const availableLiquidityBn = parseUnits(availableLiquidity, 6);
      if (tokenAmount > availableLiquidityBn) {
        setErrorMessage(`Insufficient liquidity. Maximum available: ${availableLiquidity} USDC`);
        invalidAmount = true;
      }
    }

    // Check against deposit min/max order limits
    const tokenAmountDecimal = parseFloat(tokenUnitsToReadable(tokenAmount, 6, 6));
    if (tokenAmountDecimal < parseFloat(minOrderAmount) && tokenAmountDecimal > 0) {
      setErrorMessage(`Order amount less than minimum: ${minOrderAmount} USDC`);
      invalidAmount = true;
    }
    
    if (tokenAmountDecimal > parseFloat(maxOrderAmount) && tokenAmountDecimal > 0) {
      setErrorMessage(`Order amount greater than maximum: ${maxOrderAmount} USDC`);
      invalidAmount = true;
    }

    if (invalidAmount) {
      setSignalIntentStatus(SignalIntentStatus.INVALID_AMOUNT);
    } else {
      setSignalIntentStatus(SignalIntentStatus.CREATE_ORDER);
      setErrorMessage('');
    }
  }, [
    fiatAmount,
    tokenAmount,
    isExactFiatInput
  ]);

  useEffect(() => {
    if (signedIntentResponse) {
      console.log("signedIntentResponse success: ", signedIntentResponse);

      setRecipientAddressInput(loggedInEthereumAddress || '');
      setVerifierAddressInput(platformToVerifierAddress[platform] ?? "");
      setCurrencyCodeHashInput(currencyInfo[currency].currencyCodeHash);
      setGatingServiceSignatureInput(signedIntentResponse.responseObject.signedIntent);

      setShouldConfigureSignalIntentWrite(true);
    }
  }, [
    signedIntentResponse, 
    platform, 
    currency, 
    loggedInEthereumAddress, 
    platformToVerifierAddress, 
    setRecipientAddressInput, 
    setVerifierAddressInput, 
    setCurrencyCodeHashInput, 
    setGatingServiceSignatureInput
  ]);

  useEffect(() => {
    if (signedIntentError) {
      console.log("signedIntentError: ", signedIntentError);
      setErrorMessage('Failed to fetch signed intent. Please try again.');

      setSignalIntentStatus(SignalIntentStatus.CREATE_ORDER);
    }
  }, [signedIntentError]);

  useEffect(() => {
    const updateSignalIntentStatus = async () => {
      const successfulVerificationTransaction = mineSignalIntentTransactionStatus === 'success';
      if (successfulVerificationTransaction) {
        setSignalIntentStatus(SignalIntentStatus.DONE);
      } else {
        const signingSignalIntentTransaction = signSignalIntentTransactionStatus === 'loading';
        const miningSignalIntentTransaction = mineSignalIntentTransactionStatus === 'loading';

        if (signingSignalIntentTransaction) {
          setSignalIntentStatus(SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_LOADING);
        } else if (miningSignalIntentTransaction) {
          setSignalIntentStatus(SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_MINING);
        }
      }
    }

    updateSignalIntentStatus();
  }, [
      signSignalIntentTransactionStatus,
      mineSignalIntentTransactionStatus,
    ]
  );

  useEffect(() => {
    const executeSignalIntent = async () => {
      const statusForExecution = 
        signSignalIntentTransactionStatus === 'idle' || 
        signSignalIntentTransactionStatus === 'error' ||
        signSignalIntentTransactionStatus === 'success';

      if (shouldConfigureSignalIntentWrite && writeSignalIntentAsync && statusForExecution) {
        try {
          setShouldConfigureSignalIntentWrite(false);
          await writeSignalIntentAsync();
        } catch (error) {
          console.error('writeSignalIntentAsync failed: ', error);
          setErrorMessage('Failed to create order. Please try again.');
        }
      }
    };

    executeSignalIntent();
  }, [
    shouldConfigureSignalIntentWrite, 
    writeSignalIntentAsync, 
    signSignalIntentTransactionStatus
  ]);

  /*
   * Handlers
   */
  const handleFiatInputChange = (value: string) => {
    // Reset error message when user types
    setErrorMessage('');
    setIsExactFiatInput(true);
    
    if (value === "" || value === "0") {
      setFiatAmount(value);
      setTokenAmount(ZERO); // Also reset token amount when fiat is cleared
    } else if (value === ".") {
      setFiatAmount('0.');
    } else if (isValidFiatInput(value)) {
      setFiatAmount(value);
    }
  };

  const handleTokenInputChange = (value: string) => {
    // Reset error message when user types
    setErrorMessage('');
    setIsExactFiatInput(false);
    
    if (value === "" || value === "0") {
      setTokenAmount(ZERO);
      setFiatAmount('0'); // Also reset fiat amount when token is cleared
    } else if (value === ".") {
      setTokenAmount(ZERO);
      setFiatAmount('0');
    } else if (isValidTokenInput(value)) {
      try {
        const tokenAmountBn = parseUnits(value, 6);
        setTokenAmount(tokenAmountBn);
      } catch (error) {
        console.error('Error parsing token amount:', error);
      }
    }
  };

  const handleFlipInputMode = () => {
    if (flipInputDisabled()) {
      return;
    }

    // Before flipping, ensure that the current values are properly calculated if we have data
    if (isExactFiatInput && !fiatAmount) {
      // If we're in fiat mode but have no fiat amount, reset token amount
      setTokenAmount(ZERO);
    } else if (!isExactFiatInput && tokenAmount === 0n) {
      // If we're in token mode but have no token amount, reset fiat amount
      setFiatAmount('');
    }
    
    // Flip the input mode
    setIsExactFiatInput(!isExactFiatInput);
  };

  const handleCreateOrder = async () => {
    if (signalIntentStatus !== SignalIntentStatus.CREATE_ORDER) {
      return;
    }

    try {
      setSignalIntentStatus(SignalIntentStatus.FETCHING_SIGNED_INTENT);
      setErrorMessage('');
      
      // Set depositId before fetching signed intent
      setDepositIdInput(Number(depositId));
      setTokenAmountInput(tokenAmount.toString());

      await fetchSignedIntent({
        processorName: platform,
        depositId: depositId,
        tokenAmount: tokenAmount.toString(),
        payeeDetails: hashedOnchainId,
        toAddress: loggedInEthereumAddress || '',
        fiatCurrencyCode: currencyInfo[currency].currencyCodeHash,
        chainId: chainId || ''
      });
    } catch (error) {
      console.error('Error creating order:', error);
      setSignalIntentStatus(SignalIntentStatus.FAILED_TO_FETCH_SIGNED_INTENT);
      setErrorMessage('Failed to create order. Please try again.');
    }
  };

  /*
   * Helpers
   */
  function isValidFiatInput(value: any) {
    const isValid = /^-?\d*(\.\d{0,2})?$/.test(value);
    return !isNaN(value) && parseFloat(value) >= 0 && isValid;
  }

  function isValidTokenInput(value: any) {
    const isValid = /^-?\d*(\.\d{0,6})?$/.test(value);
    return !isNaN(value) && parseFloat(value) >= 0 && isValid;
  }

  const flipInputDisabled = () => {
    return signalIntentStatus === SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_LOADING ||
      signalIntentStatus === SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_MINING ||
      signalIntentStatus === SignalIntentStatus.DONE;
  }

  const ctaDisabled = () => {
    switch (signalIntentStatus) {
      case SignalIntentStatus.DEFAULT:
      case SignalIntentStatus.INVALID_AMOUNT:
      case SignalIntentStatus.FETCHING_SIGNED_INTENT:
      case SignalIntentStatus.FAILED_TO_FETCH_SIGNED_INTENT:
      case SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_LOADING:
      case SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_MINING:
        return true;
      default:
        return false;
    }
  }

  const ctaLoading = () => {
    return signalIntentStatus === SignalIntentStatus.FETCHING_SIGNED_INTENT ||
      signalIntentStatus === SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_LOADING ||
      signalIntentStatus === SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_MINING;
  }

  const ctaText = () => {
    switch (signalIntentStatus) {
      case SignalIntentStatus.DEFAULT:
        return 'Start Order';
      case SignalIntentStatus.INVALID_AMOUNT:
        return 'Invalid amount';
      case SignalIntentStatus.CREATE_ORDER:
        return 'Start Order';
      case SignalIntentStatus.FETCHING_SIGNED_INTENT:
        return 'Fetching signed intent'; 
      case SignalIntentStatus.FAILED_TO_FETCH_SIGNED_INTENT:
        return 'Failed to fetch signed intent';
      case SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_LOADING:
        return 'Signing Transaction';
      case SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_MINING:
        return 'Mining Transaction';
      case SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_FAILED:
        return 'Transaction failed';
      case SignalIntentStatus.DONE:
        return 'Send Payment ↗';
      default:
        return 'Start Order';
    }
  }

  const ctaOnClick = () => {
    if (ctaDisabled()) {
      return;
    }

    if (signalIntentStatus === SignalIntentStatus.CREATE_ORDER) {
      handleCreateOrder();
    } else if (signalIntentStatus === SignalIntentStatus.DONE) {
      onOrderCreated();
    }
  }

  return (
    <>
      <Overlay onClick={onBackClick} />
      <ModalContainer>
        <Header>
          <ThemedText.HeadlineSmall>Buy USDC</ThemedText.HeadlineSmall>
          <CloseButton onClick={onBackClick}>
            <X size={24} />
          </CloseButton>
        </Header>

        <Content>
          <DetailsSection>
            <DetailRow>
              <DetailLabel>Payment Platform</DetailLabel>
              <DetailValue>{paymentPlatformInfo[platform].platformName}</DetailValue>
            </DetailRow>
            
            <DetailRow>
              <DetailLabel>Rate</DetailLabel>
              <DetailValue>{conversionRate} {currencyInfo[currency].currencyCode} / USDC</DetailValue>
            </DetailRow>

            <DetailRow>
              <DetailLabel>Available Liquidity</DetailLabel>
              <DetailValue>{parseFloat(availableLiquidity)} USDC</DetailValue>
            </DetailRow>
            
            <DetailRow>
              <DetailLabel>Order Limits</DetailLabel>
              <DetailValue>{parseFloat(minOrderAmount)} - {parseFloat(maxOrderAmount)} USDC</DetailValue>
            </DetailRow>
          </DetailsSection>

          <InputSection>
            <InputContainer>
              <InputWrapper order={isExactFiatInput ? 1 : 2}>
                <Input
                  label={`You Send`}
                  name="fiatAmount"
                  value={fiatAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFiatInputChange(e.target.value)}
                  placeholder={`0.00`}
                  type="number"
                  iconElement={
                    <InputLabelWithIcon>
                      <FlagIcon className={`fi fi-${currencyInfo[currency].countryCode}`} />
                      <CurrencyLabel>{currencyInfo[currency].currencyCode}</CurrencyLabel>
                    </InputLabelWithIcon>
                  }
                  readOnly={!isExactFiatInput}
                  locked={!isExactFiatInput}
                />
              </InputWrapper>

              <FlipButtonContainer isExactFiatInput={isExactFiatInput}>
                <FlipButton onClick={handleFlipInputMode} flipped={!isExactFiatInput} disabled={flipInputDisabled()}>
                  <StyledRefreshCw size={24} flipped={!isExactFiatInput} />
                </FlipButton>
              </FlipButtonContainer>

              <InputWrapper order={isExactFiatInput ? 2 : 1}>
                <Input
                  label={`You Receive`}
                  name="tokenAmount"
                  // show 3 decimal places for USDC to ensure user knows when we are exceeding max
                  value={tokenAmount === 0n ? '0' : tokenUnitsToReadable(tokenAmount, 6, isExactFiatInput ? 3 : 6).replace(/\.?0+$/, '')}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTokenInputChange(e.target.value)}
                  placeholder={`0.00`}
                  type="number"
                  iconElement={
                    <InputLabelWithIcon>
                      <TokenIconContainer>
                        <TokenSvg src={usdcInfo.icon} />
                      </TokenIconContainer>
                      <CurrencyLabel>USDC</CurrencyLabel>
                    </InputLabelWithIcon>
                  }
                  readOnly={isExactFiatInput}
                  locked={isExactFiatInput}
                  enableMax={!isExactFiatInput}
                  maxButtonOnClick={() => {
                    // Set to the minimum of available liquidity and max order amount
                    const maxLiquidity = parseFloat(availableLiquidity);
                    const maxOrder = parseFloat(maxOrderAmount);
                    const maxAmount = Math.min(maxLiquidity, maxOrder);

                    // Convert to token amount (no need to round down, just use the precise value)
                    const maxTokenAmount = parseUnits(maxAmount.toString(), 6);

                    // This button is active only when isExactFiatInput is false; so set the token amount
                    // and let the useEffect update the fiat amount
                    setTokenAmount(maxTokenAmount);
                  }}
                />
              </InputWrapper>
            </InputContainer>
          </InputSection>

          {errorMessage && (
            <ErrorMessage>{errorMessage}</ErrorMessage>
          )}

          {!isLoggedIn ? (
            <CustomConnectButton fullWidth={true} />
          ) : (
            <ButtonRow>
              <SubmitButton
                onClick={ctaOnClick}
                fullWidth={true}
                disabled={ctaDisabled() || tokenAmount === 0n}
              >
                {ctaLoading() ? (
                  <ButtonContentWrapper>
                    <StyledSpinner size={20} />
                    {ctaText()}
                  </ButtonContentWrapper>
                ) : (
                  ctaText()
                )}
              </SubmitButton>
            </ButtonRow>
          )}
        </Content>
      </ModalContainer>
    </>
  );
};

const ModalContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-56%, -54%);
  width: 90%;
  max-width: 440px;
  background-color: ${colors.container};
  border-radius: 16px;
  border: 1px solid ${colors.defaultBorderColor};
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.25);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 600px) {
    transform: translate(-50%, -55%);
    max-height: 80vh;
    overflow-y: auto;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${colors.defaultBorderColor};
  color: ${colors.white};

  @media (max-width: 600px) {
    padding: 0.5rem 1rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${colors.white};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const Content = styled(AutoColumn)`
  padding: 1.5rem;
  gap: 1rem;

  @media (max-width: 600px) {
    padding: 0.5rem 1rem;
  }
`;

const DetailsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: ${colors.defaultInputColor};
  border-radius: 8px;
  padding: 1rem;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DetailLabel = styled(ThemedText.BodySmall)`
  color: ${colors.grayText};
`;

const DetailValue = styled(ThemedText.BodySmall)`
  font-weight: 500;
  color: ${colors.white};
`;

const CurrencySelectorContainer = styled.div`
  pointer-events: none;
`;

const InputSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  margin: 12px 0;
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  font-size: 14px;
  text-align: center;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

const SubmitButton = styled(Button)`
  width: 100%;
  height: 48px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
`;

const ButtonContentWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StyledSpinner = styled(Spinner)`
  margin-right: 8px;
`;

const FlipButtonContainer = styled.div<{ isExactFiatInput: boolean }>`
  display: flex;
  justify-content: center;
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: ${props => props.isExactFiatInput ? 'translateY(-60%)' : 'translateY(-40%)'};
  z-index: 10;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InputWrapper = styled.div<{ order: number }>`
  order: ${props => props.order};
`;

const FlipButton = styled.button<{ flipped: boolean, disabled: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => props.disabled ? colors.buttonDisabled : colors.buttonDefault};
  border: 1px solid ${props => props.disabled ? colors.buttonDisabled : colors.buttonDefault};
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.15);
  
  &:hover {
    background-color: ${colors.buttonHover};
    transform: scale(1.05);
  }
`;

const StyledRefreshCw = styled(RefreshCw)<{ size?: number; flipped?: boolean }>`
  transform: ${props => props.flipped ? 'rotate(90deg)' : 'rotate(-90deg)'};
  stroke-width: 2.5px;
  transition: transform 0.3s ease;
`; 

const TokenIconContainer = styled.div`
  position: relative;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const TokenSvg = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 12px;
`;

const FlagIcon = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 18px;
  display: inline-block;
  background-size: 150%;
  background-position: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const InputLabelWithIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 20px;
  font-weight: 600;
  color: ${colors.darkText};
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-radius: 24px;
  background: ${colors.selectorColor};
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 4px 8px 4px 4px;
  gap: 6px;
  min-width: 80px;
`; 

const CurrencyLabel = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #FFF;
  padding-top: 2px;
`;