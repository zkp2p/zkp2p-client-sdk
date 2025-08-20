import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { RefreshCw, ChevronDown } from 'react-feather';
import { parseUnits, formatUnits } from 'viem';

import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { Button } from '@components/common/Button';
import { CustomConnectButton } from '@components/common/ConnectButton';
import { Input } from '@components/common/Input';
import { Slider } from '@components/common/Slider';
import Spinner from '@components/common/Spinner';

import { CurrencyType, currencyInfo } from '@helpers/types/currency';
import { PaymentPlatformType, paymentPlatformInfo, PaymentPlatform } from '@helpers/types';
import { tokenUnitsToReadable } from '@helpers/units';
import { ZERO } from '@helpers/constants';
import { usdcInfo } from '@helpers/types/tokens';
import { calculateFiatFromRequestedUSDC, calculateUSDCFromFiat } from '@helpers/intentHelper';

import useSignalIntent from '@hooks/transactions/useSignalIntent';
import useSignIntent from '@hooks/backend/useSignIntent';
import useAccount from '@hooks/contexts/useAccount';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import useOnRamperIntents from '@hooks/contexts/useOnRamperIntents';
import useQuoteStorage from '@hooks/useQuoteStorage';
import { extractIntentHashFromLogs } from '@helpers/eventParser';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@hooks/useDebounce';

interface OrderData {
  depositId: string;
  depositor: string;
  availableLiquidity: string;
  currency: CurrencyType;
  conversionRate: string;
  platform: PaymentPlatformType;
  intentAmountRange: {
    min: string;
    max: string;
  };
  apr: number | null;
  spread: number | null;
  hashedOnchainId: string;
}

interface OrderBookBuyPanelProps {
  order: OrderData | null;
  platformGroups?: Map<string, OrderData[]>;
  selectedPrice?: number;
  onOrderChange?: (order: OrderData | null) => void;
  onOrderCreated: () => void;
}

const SignalIntentStatus = {
  DEFAULT: 'default',
  INVALID_AMOUNT: 'invalid-amount',
  CREATE_ORDER: 'create-order',
  FETCHING_SIGNED_INTENT: 'fetching-signed-intent',
  FAILED_TO_FETCH_SIGNED_INTENT: 'failed-to-fetch-signed-intent',
  SIGNAL_INTENT_TRANSACTION_LOADING: 'transaction-loading',
  SIGNAL_INTENT_TRANSACTION_MINING: 'transaction-mining',
  DONE: 'done'
}

type SignalIntentStatusType = typeof SignalIntentStatus[keyof typeof SignalIntentStatus];

export const OrderBookBuyPanel: React.FC<OrderBookBuyPanelProps> = React.memo(({
  order,
  platformGroups = new Map(),
  selectedPrice = 0,
  onOrderChange,
  onOrderCreated
}) => {
  const navigate = useNavigate();
  
  const { isLoggedIn, loggedInEthereumAddress } = useAccount();
  const { platformToVerifierAddress, chainId } = useSmartContracts();
  const { refetchIntentView } = useOnRamperIntents();
  const { saveQuoteData } = useQuoteStorage();

  const [desiredAmount, setDesiredAmount] = useState<string>('');
  const [fiatAmount, setFiatAmount] = useState<string>('');
  const [tokenAmount, setTokenAmount] = useState<bigint>(ZERO);
  const [isExactFiatInput, setIsExactFiatInput] = useState<boolean>(true);
  const [signalIntentStatus, setSignalIntentStatus] = useState<SignalIntentStatusType>(SignalIntentStatus.DEFAULT);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<PaymentPlatformType | null>(null);
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState<boolean>(false);
  const platformDropdownRef = useRef<HTMLDivElement>(null);

  // Use custom debounce hook
  const debouncedAmount = useDebounce(desiredAmount, 1000);

  const {
    data: signedIntentResponse,
    fetchSignedIntent
  } = useSignIntent();

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
    setShouldConfigureSignalIntentWrite,
    setSignSignalIntentTransactionStatus,
    setMineSignalIntentTransactionStatus
  } = useSignalIntent();

  // Get the currency from the first order in the platform groups
  const displayCurrency = useMemo(() => {
    if (platformGroups.size === 0) return null;
    const firstPlatform = Array.from(platformGroups.values())[0];
    return firstPlatform[0]?.currency;
  }, [platformGroups]);

  // Aggregate platform data and filter by desired amount
  const aggregatedPlatforms = useMemo(() => {
    const platforms: Array<{
      platform: PaymentPlatformType;
      totalAvailable: number;
      minLimit: number;
      maxLimit: number;
      orderCount: number;
      bestOrder: OrderData;
    }> = [];

    // Parse desired amount once
    const desiredUSDC = debouncedAmount ? parseFloat(debouncedAmount) : 0;

    platformGroups.forEach((orders, platformKey) => {
      if (!orders || orders.length === 0) return;
      
      // Platform key is already of type string matching PaymentPlatformType
      const platform = platformKey as PaymentPlatformType;
      
      // Skip unknown platforms
      if (!paymentPlatformInfo[platform]) {
        console.warn(`Skipping unknown platform in aggregation: ${platform}`);
        return;
      }
      
      // Pre-parse all numeric values once
      const parsedOrders = orders.map((order: OrderData) => ({
        order,
        available: parseFloat(order.availableLiquidity) || 0,
        min: parseFloat(order.intentAmountRange.min) || 0,
        max: parseFloat(order.intentAmountRange.max) || 0
      }));
      
      // Calculate aggregates in single pass
      let totalAvailable = 0;
      let minLimit = Number.MAX_VALUE;
      let maxLimit = 0;
      let bestOrder = parsedOrders[0];
      
      for (const parsed of parsedOrders) {
        totalAvailable += parsed.available;
        minLimit = Math.min(minLimit, parsed.min);
        maxLimit = Math.max(maxLimit, parsed.max);
        if (parsed.available > bestOrder.available) {
          bestOrder = parsed;
        }
      }
      
      // Ensure minLimit is valid
      if (minLimit === Number.MAX_VALUE) minLimit = 0;
      
      // Apply effective max limit
      const effectiveMaxLimit = Math.min(maxLimit, totalAvailable);

      // Filter based on desired amount if provided
      if (desiredUSDC > 0) {
        // Check if this platform can handle the desired amount
        if (desiredUSDC >= minLimit && desiredUSDC <= effectiveMaxLimit) {
          platforms.push({
            platform,
            totalAvailable,
            minLimit,
            maxLimit: effectiveMaxLimit,
            orderCount: orders.length,
            bestOrder: bestOrder.order
          });
        }
      } else {
        // No filter, show all platforms
        platforms.push({
          platform,
          totalAvailable,
          minLimit,
          maxLimit: effectiveMaxLimit,
          orderCount: orders.length,
          bestOrder: bestOrder.order
        });
      }
    });

    // Sort by total available liquidity
    return platforms.sort((a, b) => b.totalAvailable - a.totalAvailable);
  }, [platformGroups, debouncedAmount]);

  const minAmount = order ? parseFloat(order.intentAmountRange.min) : 0;
  const maxAmount = order ? parseFloat(order.intentAmountRange.max) : 0;
  const availableAmount = order ? parseFloat(order.availableLiquidity) : 0;
  const conversionRate = order ? parseFloat(order.conversionRate) : selectedPrice;

  // Update fiat amount when token amount changes and not in fiat input mode
  useEffect(() => {
    if (!isExactFiatInput && conversionRate > 0) {
      if (tokenAmount > ZERO) {
        try {
          // Convert rate to BigInt with the right precision
          const rateBN = parseUnits(conversionRate.toString(), 18);
          
          // Use the helper function to calculate fiat with proper rounding
          const fiatAmountBN = calculateFiatFromRequestedUSDC(
            tokenAmount,
            rateBN,
            6 // USDC decimals
          );
          
          // Convert to displayable string (with 6 decimals precision)
          const fiatValue = formatUnits(fiatAmountBN, 6);
          
          // Format with 2 decimal places for display
          const calculatedFiatAmount = Number(fiatValue).toFixed(2);
          
          setFiatAmount(calculatedFiatAmount);
        } catch (error) {
          console.error('Error calculating fiat amount:', error);
          // Don't clear fiat amount on calculation error to preserve user's input
        }
      } else {
        // When token amount is 0, set fiat to 0
        setFiatAmount('0');
      }
    }
  }, [tokenAmount, conversionRate, isExactFiatInput]);

  // Update token amount when fiat amount changes and in fiat input mode
  useEffect(() => {
    if (isExactFiatInput && conversionRate > 0) {
      if (fiatAmount && parseFloat(fiatAmount) > 0) {
        try {
          // Convert fiat string to BigInt with same decimals as token (6 for USDC)
          // The calculateUSDCFromFiat expects fiat in token decimal format
          const fiatAmountBn = parseUnits(fiatAmount, 6);
          
          // Convert rate to BigInt with proper precision
          const rateBn = parseUnits(conversionRate.toString(), 18);
          
          // Use the helper function to calculate USDC with proper precision
          const usdcAmountBn = calculateUSDCFromFiat(
            fiatAmountBn,
            rateBn,
            6 // USDC decimals
          );
          
          setTokenAmount(usdcAmountBn);
        } catch (error) {
          console.error('Error calculating token amount:', error);
          // Don't clear token amount on calculation error to preserve user's input
        }
      } else {
        // When fiat amount is 0 or empty, set token to 0
        setTokenAmount(ZERO);
      }
    }
  }, [fiatAmount, conversionRate, isExactFiatInput]);

  const handleFiatInputChange = (value: string) => {
    setErrorMessage('');
    setIsExactFiatInput(true);
    
    if (value === "" || value === "0") {
      setFiatAmount(value);
      setTokenAmount(ZERO);
    } else if (value === ".") {
      setFiatAmount('0.');
    } else if (isValidFiatInput(value)) {
      setFiatAmount(value);
    }
  };

  const handleTokenInputChange = (value: string) => {
    setErrorMessage('');
    setIsExactFiatInput(false);
    
    if (value === "" || value === "0") {
      setTokenAmount(ZERO);
      setFiatAmount('0');
    } else if (value === ".") {
      setTokenAmount(ZERO);
      setFiatAmount('0');
    } else if (isValidTokenInput(value)) {
      try {
        const tokenAmountBn = parseUnits(value, 6);
        setTokenAmount(tokenAmountBn);
        
        // Validate against limits
        const numValue = parseFloat(value);
        if (numValue < minAmount && numValue > 0) {
          setErrorMessage(`Minimum amount is ${minAmount} USDC`);
        } else if (numValue > maxAmount) {
          setErrorMessage(`Maximum amount is ${maxAmount} USDC`);
        } else if (numValue > availableAmount) {
          setErrorMessage(`Only ${availableAmount} USDC available`);
        }
      } catch (error) {
        console.error('Error parsing token amount:', error);
      }
    }
  };

  const handleFlipInputMode = () => {
    if (signalIntentStatus === SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_LOADING ||
        signalIntentStatus === SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_MINING) {
      return;
    }
    
    // When flipping, we want to recalculate the OUTPUT based on the current INPUT
    // The field that was the output becomes the new input (keeps its value)
    // The field that was the input becomes the new output (gets recalculated)
    
    if (isExactFiatInput) {
      // Currently fiat is input, token is output
      // After flip: token will be input (keep current token value), fiat will be output (recalculate)
      // The useEffect will handle recalculating fiat from token
      setIsExactFiatInput(false);
    } else {
      // Currently token is input, fiat is output  
      // After flip: fiat will be input (keep current fiat value), token will be output (recalculate)
      // The useEffect will handle recalculating token from fiat
      setIsExactFiatInput(true);
    }
  };

  function isValidFiatInput(value: string): boolean {
    // Only allow positive numbers with up to 2 decimal places
    const isValid = /^\d*(\.\d{0,2})?$/.test(value);
    const numValue = parseFloat(value);
    return !isNaN(numValue) && numValue >= 0 && isValid;
  }

  function isValidTokenInput(value: string): boolean {
    // Only allow positive numbers with up to 6 decimal places
    const isValid = /^\d*(\.\d{0,6})?$/.test(value);
    const numValue = parseFloat(value);
    return !isNaN(numValue) && numValue >= 0 && isValid;
  }

  const handleCreateOrder = async () => {
    if (!order || tokenAmount === ZERO || errorMessage) return;

    setSignalIntentStatus(SignalIntentStatus.FETCHING_SIGNED_INTENT);
    setErrorMessage('');
    
    try {
      // Set inputs for the transaction hook
      setDepositIdInput(Number(order.depositId));
      setTokenAmountInput(tokenAmount.toString());
      
      await fetchSignedIntent({
        processorName: order.platform,
        depositId: order.depositId,
        tokenAmount: tokenAmount.toString(),
        payeeDetails: order.hashedOnchainId,
        toAddress: loggedInEthereumAddress || '',
        fiatCurrencyCode: currencyInfo[order.currency].currencyCodeHash,
        chainId: chainId?.toString() || ''
      });
    } catch (error) {
      console.error('Error creating order:', error);
      setSignalIntentStatus(SignalIntentStatus.FAILED_TO_FETCH_SIGNED_INTENT);
      setErrorMessage('Failed to prepare order. Please try again.');
      return;
    }
  };

  // Handle signed intent response
  useEffect(() => {
    if (signedIntentResponse && order) {
      console.log("signedIntentResponse success: ", signedIntentResponse);
      
      setRecipientAddressInput(loggedInEthereumAddress || '');
      setVerifierAddressInput(platformToVerifierAddress[order.platform] || '');
      setCurrencyCodeHashInput(currencyInfo[order.currency].currencyCodeHash);
      setGatingServiceSignatureInput(signedIntentResponse.responseObject.signedIntent);
      
      setShouldConfigureSignalIntentWrite(true);
    }
  }, [signedIntentResponse, order, loggedInEthereumAddress, platformToVerifierAddress]);

  // Handle transaction status updates
  useEffect(() => {
    const updateSignalIntentStatus = async () => {
      const successfulTransaction = mineSignalIntentTransactionStatus === 'success';
      const transactionFailed = signSignalIntentTransactionStatus === 'error' || mineSignalIntentTransactionStatus === 'error';
      
      if (successfulTransaction) {
        setSignalIntentStatus(SignalIntentStatus.DONE);
        
        // Save quote data for later reference
        const quoteData = {
          usdcAmount: tokenAmount.toString(),
          fiatAmount: fiatAmount,
          fiatCurrency: order?.currency || '',
          token: usdcInfo.tokenId,
          recipientAddress: loggedInEthereumAddress || '',
          paymentPlatform: order?.platform || '',
        };
        
        saveQuoteData(loggedInEthereumAddress || '', '', quoteData);
        
        await refetchIntentView();
        navigate('/swap?view=sendPayment');
        onOrderCreated();
      } else if (transactionFailed) {
        // Reset to default state when transaction fails or is cancelled
        setSignalIntentStatus(SignalIntentStatus.DEFAULT);
        setSignSignalIntentTransactionStatus('idle');
        setMineSignalIntentTransactionStatus('idle');
        // Don't set error message - just reset to allow retry
      } else {
        const signingTransaction = signSignalIntentTransactionStatus === 'loading';
        const miningTransaction = mineSignalIntentTransactionStatus === 'loading';
        
        if (signingTransaction) {
          setSignalIntentStatus(SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_LOADING);
        } else if (miningTransaction) {
          setSignalIntentStatus(SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_MINING);
        }
      }
    };
    
    updateSignalIntentStatus();
  }, [signSignalIntentTransactionStatus, mineSignalIntentTransactionStatus]);

  // Execute transaction when ready
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
          setSignalIntentStatus(SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_FAILED);
          setErrorMessage('Transaction failed. Please try again.');
        }
      }
    };
    
    executeSignalIntent();
  }, [shouldConfigureSignalIntentWrite, writeSignalIntentAsync, signSignalIntentTransactionStatus]);

  const isLoading = signalIntentStatus === SignalIntentStatus.FETCHING_SIGNED_INTENT ||
                    signalIntentStatus === SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_LOADING ||
                    signalIntentStatus === SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_MINING;

  // Auto-select first available platform when price level is selected
  useEffect(() => {
    if (selectedPrice > 0 && aggregatedPlatforms.length > 0 && !order) {
      // Auto-select the first/best platform
      const firstPlatform = aggregatedPlatforms[0];
      if (firstPlatform && firstPlatform.bestOrder) {
        onOrderChange?.(firstPlatform.bestOrder);
        setSelectedPlatform(firstPlatform.platform);
        // Initialize slider to 50%
        setSliderValue(50);
      }
    }
  }, [selectedPrice, aggregatedPlatforms, order, onOrderChange]);

  // When a platform is selected, set the order and reset to neutral state
  const handlePlatformSelect = (platformData: typeof aggregatedPlatforms[0]) => {
    onOrderChange?.(platformData.bestOrder);
    setSelectedPlatform(platformData.platform);
    // Reset to neutral state when platform changes
    setSliderValue(50);
    setTokenAmount(ZERO);
    setFiatAmount('0');
    setIsExactFiatInput(false);
    setErrorMessage('');
  };

  // Handle slider change
  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    setIsExactFiatInput(false);
    
    // Calculate token amount based on slider percentage
    const effectiveMax = Math.min(availableAmount, maxAmount);
    const calculatedAmount = (effectiveMax * value) / 100;
    
    // Set minimum to the min amount if slider is very low
    const finalAmount = value > 0 ? Math.max(calculatedAmount, minAmount) : 0;
    
    if (finalAmount > 0) {
      const tokenAmountBn = parseUnits(finalAmount.toFixed(6), 6);
      setTokenAmount(tokenAmountBn);
    } else {
      setTokenAmount(ZERO);
    }
  };

  // Update slider when token amount changes from input
  useEffect(() => {
    if (!isExactFiatInput && tokenAmount > ZERO && order) {
      const tokenAmountDecimal = parseFloat(formatUnits(tokenAmount, 6));
      const effectiveMax = Math.min(availableAmount, maxAmount);
      
      if (effectiveMax > 0) {
        const percentage = (tokenAmountDecimal / effectiveMax) * 100;
        setSliderValue(Math.min(100, Math.max(0, percentage)));
      }
    }
  }, [tokenAmount, isExactFiatInput, order, availableAmount, maxAmount]);

  // Reset to neutral state when order changes (new row clicked)
  useEffect(() => {
    if (order) {
      setSliderValue(50);
      setTokenAmount(ZERO);
      setFiatAmount('0');
      setIsExactFiatInput(false);
      setErrorMessage('');
    }
  }, [order]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (platformDropdownRef.current && !platformDropdownRef.current.contains(event.target as Node)) {
        setShowPlatformDropdown(false);
      }
    };

    if (showPlatformDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showPlatformDropdown]);

  return (
    <Container>
      <Header>
        <ThemedText.SubHeaderLarge>Buy USDC</ThemedText.SubHeaderLarge>
      </Header>

      {/* Platform Selection Dropdown - Only show when order is selected */}

      {/* Selected Order Details */}
      {order && (
        <>
          <OrderDetails>
            <DetailRow>
              <DetailLabel>Platform</DetailLabel>
              <PlatformSelector ref={platformDropdownRef}>
                <PlatformDropdownTrigger 
                  onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                >
                  {selectedPlatform && paymentPlatformInfo[selectedPlatform] ? (
                    <>
                      {(selectedPlatform === PaymentPlatform.VENMO || selectedPlatform === PaymentPlatform.PAYPAL) ? (
                        <PlatformLogoFallbackTiny 
                          $backgroundColor={paymentPlatformInfo[selectedPlatform].platformColor}
                        >
                          {selectedPlatform === PaymentPlatform.VENMO ? 'V' : 'P'}
                        </PlatformLogoFallbackTiny>
                      ) : paymentPlatformInfo[selectedPlatform].platformLogo ? (
                        <PlatformLogoTiny 
                          src={paymentPlatformInfo[selectedPlatform].platformLogo} 
                          alt={paymentPlatformInfo[selectedPlatform].platformName}
                        />
                      ) : (
                        <PlatformLogoFallbackTiny 
                          $backgroundColor={paymentPlatformInfo[selectedPlatform].platformColor || 'rgba(255, 255, 255, 0.1)'}
                        >
                          {paymentPlatformInfo[selectedPlatform].platformName?.[0] || '?'}
                        </PlatformLogoFallbackTiny>
                      )}
                      <PlatformValue>
                        {paymentPlatformInfo[selectedPlatform].platformName}
                      </PlatformValue>
                    </>
                  ) : (
                    <PlatformValue $noLogo>
                      Select Platform
                    </PlatformValue>
                  )}
                  <ChevronIcon $isOpen={showPlatformDropdown}>
                    <ChevronDown size={14} />
                  </ChevronIcon>
                </PlatformDropdownTrigger>
                
                {showPlatformDropdown && (
                  <PlatformDropdownMenu>
                    {aggregatedPlatforms.map((platformData) => {
                      const platformInfo = paymentPlatformInfo[platformData.platform];
                      if (!platformInfo) return null;
                      const isSelected = platformData.platform === selectedPlatform;
                      
                      return (
                        <PlatformDropdownOption
                          key={platformData.platform}
                          $isSelected={isSelected}
                          onClick={() => {
                            handlePlatformSelect(platformData);
                            setShowPlatformDropdown(false);
                          }}
                        >
                          <ProviderInfo>
                            {(platformData.platform === PaymentPlatform.VENMO || platformData.platform === PaymentPlatform.PAYPAL) ? (
                              <PlatformLogoFallback 
                                $backgroundColor={platformInfo.platformColor}
                              >
                                {platformData.platform === PaymentPlatform.VENMO ? 'V' : 'P'}
                              </PlatformLogoFallback>
                            ) : platformInfo.platformLogo ? (
                              <ProviderPlatformLogo 
                                src={platformInfo.platformLogo} 
                                alt={platformInfo.platformName}
                              />
                            ) : (
                              <PlatformLogoFallback 
                                $backgroundColor={platformInfo.platformColor || 'rgba(255, 255, 255, 0.1)'}
                              >
                                {platformInfo.platformName?.[0] || '?'}
                              </PlatformLogoFallback>
                            )}
                            <ProviderDetails>
                              <ProviderPlatform>{platformInfo.platformName}</ProviderPlatform>
                              <ProviderAmount>{platformData.totalAvailable.toFixed(0)} USDC available</ProviderAmount>
                            </ProviderDetails>
                          </ProviderInfo>
                        </PlatformDropdownOption>
                      );
                    })}
                  </PlatformDropdownMenu>
                )}
              </PlatformSelector>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Price</DetailLabel>
              <DetailValue>{conversionRate.toFixed(4)} {order.currency}/USDC</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Available</DetailLabel>
              <DetailValue>{availableAmount.toFixed(2)} USDC</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Limits</DetailLabel>
              <DetailValue>{minAmount} - {maxAmount} USDC</DetailValue>
            </DetailRow>
          </OrderDetails>
          
          <InputSection>
        <AmountSection>
          <SliderHeader>
            <MaxButton
              onClick={() => {
                setSliderValue(100);
                handleSliderChange(100);
              }}
            >
              Max
            </MaxButton>
          </SliderHeader>
          <SliderWrapper>
            <Slider
              value={sliderValue}
              onChange={handleSliderChange}
              min={0}
              max={100}
              step={1}
              showLabels
              formatLabel={(value) => `${value}%`}
            />
          </SliderWrapper>
        </AmountSection>
        
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
                <IconWrapper>
                  <InputLabelWithIcon>
                    <FlagIcon className={`fi fi-${currencyInfo[order.currency].countryCode}`} />
                    <CurrencyLabel>{currencyInfo[order.currency].currencyCode}</CurrencyLabel>
                  </InputLabelWithIcon>
                </IconWrapper>
              }
              readOnly={!isExactFiatInput}
              locked={!isExactFiatInput}
            />
          </InputWrapper>

          <FlipButtonContainer isExactFiatInput={isExactFiatInput}>
            <FlipButton onClick={handleFlipInputMode} flipped={!isExactFiatInput} disabled={isLoading}>
              <StyledRefreshCw size={24} $flipped={!isExactFiatInput} />
            </FlipButton>
          </FlipButtonContainer>

          <InputWrapper order={isExactFiatInput ? 2 : 1}>
            <Input
              label={`You Receive`}
              name="tokenAmount"
              value={tokenAmount === ZERO ? '0' : tokenUnitsToReadable(tokenAmount, 6, isExactFiatInput ? 3 : 6).replace(/\.?0+$/, '')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTokenInputChange(e.target.value)}
              placeholder={`0.00`}
              type="number"
              iconElement={
                <IconWrapper>
                  <InputLabelWithIcon>
                    <TokenIconContainer>
                      <TokenSvg src={usdcInfo.icon} />
                    </TokenIconContainer>
                    <CurrencyLabel>USDC</CurrencyLabel>
                  </InputLabelWithIcon>
                </IconWrapper>
              }
              readOnly={isExactFiatInput}
              locked={isExactFiatInput}
            />
          </InputWrapper>
        </InputContainer>
        
        {errorMessage && (
          <ErrorText>{errorMessage}</ErrorText>
        )}
      </InputSection>

        <ButtonSection>
        {!isLoggedIn ? (
          <CustomConnectButton fullWidth />
        ) : (
          <Button
            onClick={handleCreateOrder}
            disabled={tokenAmount === ZERO || !!errorMessage || isLoading}
            fullWidth
          >
            {isLoading ? (
              <>
                <Spinner size={16} />
                {signalIntentStatus === SignalIntentStatus.FETCHING_SIGNED_INTENT && 'Preparing...'}
                {signalIntentStatus === SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_LOADING && 'Confirming...'}
                {signalIntentStatus === SignalIntentStatus.SIGNAL_INTENT_TRANSACTION_MINING && 'Processing...'}
              </>
            ) : (
              'Create Order'
            )}
          </Button>
        )}
      </ButtonSection>

        <InfoText>
        After creating the order, you'll be redirected to complete the payment via {paymentPlatformInfo[order.platform]?.platformName}.
      </InfoText>
        </>
      )}
    </Container>
  );
});

const Container = styled.div`
  width: 100%;
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: fit-content;
`;

const Header = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const OrderDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid ${colors.defaultBorderColor};
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DetailLabel = styled.span`
  font-size: 13px;
  color: ${colors.grayText};
`;

const DetailValue = styled.span`
  font-size: 14px;
  color: ${colors.white};
  font-weight: 500;
`;

const InputSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
`;

const InputWrapper = styled.div<{ order: number }>`
  order: ${props => props.order};
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

const FlipButton = styled.button<{ flipped: boolean; disabled: boolean }>`
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

const StyledRefreshCw = styled(RefreshCw)<{ $flipped?: boolean }>`
  color: ${colors.white};
  transform: ${props => props.$flipped ? 'rotate(90deg)' : 'rotate(-90deg)'};
  transition: transform 0.3s ease;
  stroke-width: 2.5px;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  background: rgba(19, 26, 42, 0.6);
  border-radius: 8px;
  padding: 4px 8px;
`;

const FlagIcon = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 18px;
  display: inline-block;
  background-size: 150%;
`;

const InputLabelWithIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 20px;
  font-weight: 600;
`;

const CurrencyLabel = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #FFF;
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

const ErrorText = styled.div`
  color: ${colors.warningRed};
  font-size: 12px;
  margin-top: 0.5rem;
`;

const ButtonSection = styled.div`
  width: 100%;
`;

const InfoText = styled.div`
  font-size: 12px;
  color: ${colors.grayText};
  text-align: center;
  line-height: 1.4;
`;

const ProviderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${colors.defaultBorderColor};
`;

const ProviderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ProviderLabel = styled.div`
  font-size: 12px;
  color: ${colors.grayText};
  text-transform: uppercase;
  font-weight: 500;
`;

const ChangeProviderButton = styled.button`
  background: none;
  border: none;
  color: ${colors.buttonDefault};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.2s ease;
  transform: translateY(-0.5px);
  
  &:hover {
    opacity: 0.8;
  }
`;

const ProviderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ProviderOption = styled.div<{ isSelected: boolean; isDisabled?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem;
  background: ${props => props.isSelected ? 'rgba(255, 63, 62, 0.1)' : colors.container};
  border: 1px solid ${props => props.isSelected ? colors.buttonDefault : colors.defaultBorderColor};
  border-radius: 8px;
  cursor: ${props => props.isDisabled ? 'not-allowed' : props.isSelected ? 'default' : 'pointer'};
  opacity: ${props => props.isDisabled ? 0.5 : 1};
  transition: all 0.2s ease;
  
  &:hover:not([isSelected=true]):not([isDisabled=true]) {
    background: rgba(255, 255, 255, 0.05);
    border-color: ${colors.lightGrayText};
  }
`;

const ProviderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ProviderPlatformLogo = styled.img`
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 4px;
`;

const ProviderDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const ProviderPlatform = styled.div`
  font-size: 13px;
  color: ${colors.white};
  font-weight: 500;
`;

const ProviderAmount = styled.div`
  font-size: 11px;
  color: ${colors.lightGrayText};
`;

const ProviderLimits = styled.div`
  font-size: 10px;
  color: ${colors.grayText};
`;

const AmountSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
`;

const SliderHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0;
  width: 92.5%;
  margin-left: auto;
  margin-right: auto;
`;

const SliderWrapper = styled.div`
  width: 92.5%;
  margin: 0 auto;
`;

const MaxButton = styled.div`
  color: ${colors.darkText};
  font-size: 14px;
  font-weight: 600;
  padding-bottom: 1px;
  cursor: pointer;
`;

const AmountHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: ${colors.grayText};
  font-size: 13px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
`;

const PlatformLogoFallback = styled.div<{ $backgroundColor?: string }>`
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background-color: ${props => props.$backgroundColor || 'rgba(255, 255, 255, 0.1)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: #FFFFFF;
`;

const PlatformLogoFallbackSmall = styled.div<{ $backgroundColor?: string }>`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background-color: ${props => props.$backgroundColor || 'rgba(255, 255, 255, 0.1)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  color: #FFFFFF;
`;

const PlatformSelector = styled.div`
  position: relative;
`;

const PlatformDropdownTrigger = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const PlatformValue = styled.span<{ $noLogo?: boolean }>`
  font-size: 14px;
  color: ${colors.linkBlue};
  font-weight: 500;
  ${props => props.$noLogo && 'margin-left: 0;'}
`;

const PlatformLogoTiny = styled.img`
  width: 16px;
  height: 16px;
  border-radius: 3px;
  object-fit: contain;
`;

const PlatformLogoFallbackTiny = styled.div<{ $backgroundColor?: string }>`
  width: 16px;
  height: 16px;
  border-radius: 3px;
  background-color: ${({ $backgroundColor }) => $backgroundColor || 'rgba(255, 255, 255, 0.1)'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 10px;
`;

const ChevronIcon = styled.div<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  color: ${colors.lightGrayText};
  transition: transform 0.2s;
  transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0)'};
`;

const PlatformDropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 200px;
  background: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  padding: 0.25rem;
`;

const PlatformDropdownOption = styled.div<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.6rem;
  background: ${props => props.$isSelected ? colors.rowSelectorColor : 'transparent'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.25rem;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:hover {
    background: ${props => props.$isSelected ? colors.rowSelectorColor : colors.rowSelectorHover};
  }
`;

const PlatformLogoSmall = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  object-fit: contain;
`;