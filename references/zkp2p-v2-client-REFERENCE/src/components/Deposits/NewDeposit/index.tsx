import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { ArrowLeft } from 'react-feather';
import styled from 'styled-components';
import { colors } from '@theme/colors';
import { encodeAbiParameters, parseAbiParameters } from 'viem';

import { ThemedText } from '@theme/text';
import { Input } from '@components/common/Input';
import { Button } from "@components/common/Button";
import { RowBetween } from '@components/layouts/Row';
import { 
  CurrencyType, 
  NewDepositTransactionStatus,
  NewDepositTransactionStatusType,
  EscrowDepositVerifierData,
  PaymentPlatformType,
  paymentPlatformInfo,
  paymentPlatforms,
  currencyInfo,
} from '@helpers/types';
import { usdcInfo } from '@helpers/types/tokens';
import { 
  etherUnits,
  tokenUnits,
  tokenUnitsToReadable
} from '@helpers/units';
import { ZERO, DEFAULT_MAX_ORDER_LIMIT } from '@helpers/constants';
import { MODALS } from '@helpers/types';
import { NewPaymentPlatform } from '@components/Deposits/NewDeposit/PaymentPlatform';
import { InputWithTokenSelector } from '@components/modals/selectors/token/InputWithTokenSelector';
import { PostDepositDetailsRequest } from '@helpers/types';
import { AccessoryButton } from '@components/common/AccessoryButton';
import Spinner from '@components/common/Spinner';

import useAccount from '@hooks/contexts/useAccount';
import useBalances from '@hooks/contexts/useBalance';
import useDeposits from '@hooks/contexts/useDeposits';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import useModal from '@hooks/contexts/useModal';

import useCreateDeposit from '@hooks/transactions/useCreateDeposit';
import useTokenApprove from '@hooks/transactions/useTokenApprove';
import usePostDepositDetails from '@hooks/backend/usePostDepositDetails';
import { MINIMUM_DEPOSIT_AMOUNT } from '@helpers/constants';

import { esl } from '@helpers/constants';
import useLocalStorage from '@hooks/useLocalStorage';
import useLiquidity from '@hooks/contexts/useLiquidity';
import { AdvancedSettings } from './AdvancedSettings';

interface NewPositionProps {
  handleBackClick: () => void;
}
 
export const NewPosition: React.FC<NewPositionProps> = ({
  handleBackClick
}) => {
  NewPosition.displayName = 'NewPosition';

  /*
   * Contexts
   */

  const { isLoggedIn, loginStatus } = useAccount();
  const { 
    usdcAddress,
    platformToVerifierAddress,
    gatingServiceAddress,
    witnessAddresses
  } = useSmartContracts();
  const { 
    usdcApprovalToEscrow, 
    usdcBalance, 
    refetchUsdcApprovalToEscrow, 
    refetchUsdcBalance,
  } = useBalances();
  const { refetchDepositViews: refetchLiquidityDepositViews } = useLiquidity();
  const { triggerDepositRefresh } = useDeposits();
  const { openModal } = useModal();

  /*
   * State
   */
  
  const [depositState, setDepositState] = useState<NewDepositTransactionStatusType>(NewDepositTransactionStatus.DEFAULT);
  
  const [depositToken, setDepositToken] = useState<string>(usdcInfo.tokenId);
  const [depositAmountValue, setDepositAmountValue] = useState<string>('');
  const [minAmountValue, setMinAmountValue] = useState<string>('0.1');
  const [maxAmountValue, setMaxAmountValue] = useState<string>('');

  const [platforms, setPlatforms] = useState<PaymentPlatformType[]>([paymentPlatforms[0]]);
  const [platformPayeeDetails, setPlatformPayeeDetails] = useState<Map<PaymentPlatformType, string>>(
    new Map([[paymentPlatforms[0], '']])
  );
  const [platformConversionRates, setPlatformConversionRates] = useState<Map<PaymentPlatformType, Map<CurrencyType, string>>>(
    new Map([[paymentPlatforms[0], new Map()]])
  );

  const [hashedPayeeDetails, setHashedPayeeDetails] = useState<Map<PaymentPlatformType, string>>(new Map());
  const [allPayeeDetailsPosted, setAllPayeeDetailsPosted] = useState<boolean>(false);

  const [storedPayeeDetails, setStoredPayeeDetails] = useLocalStorage<{[key: string]: string}>('STORED_PAYEE_DETAILS', {});

  const [telegramUsername, setTelegramUsername] = useState<string>('');
  
  // Track if we're in the approval flow to prevent state flickering
  const [isInApprovalFlow, setIsInApprovalFlow] = useState<boolean>(false);

  /*
   * Backend writes
   */

  const { 
    postDepositDetails, 
    isLoading: postDepositDetailsIsLoading,
    error: postDepositDetailsError
  } = usePostDepositDetails();

  /*
   * Contract Writes
   */

  const onSuccessCreateDeposit = useCallback((data: any) => {
    // Refetch balances and approvals immediately
    if (refetchUsdcBalance) refetchUsdcBalance();
    if (refetchUsdcApprovalToEscrow) refetchUsdcApprovalToEscrow();
    
    // Trigger smart polling for deposits - will poll for 10 seconds then stop
    if (triggerDepositRefresh) triggerDepositRefresh();
    if (refetchLiquidityDepositViews) refetchLiquidityDepositViews();

    setDepositState(NewDepositTransactionStatus.TRANSACTION_SUCCEEDED);
    
    // Navigate back - deposits will update via polling
    handleBackClick();
  }, [refetchUsdcBalance, refetchUsdcApprovalToEscrow, triggerDepositRefresh, refetchLiquidityDepositViews, handleBackClick]);

  const {
    writeCreateDepositAsync,
    setTokenInput: setDepositTokenInput,
    setAmountInput: setDepositAmountInput,
    setIntentAmountRangeInput,
    setVerifiersInput,
    setVerifierDataInput,
    setCurrenciesInput,
    shouldConfigureCreateDepositWrite,
    setShouldConfigureCreateDepositWrite,
    signCreateDepositTransactionStatus,
    mineCreateDepositTransactionStatus,
  } = useCreateDeposit(onSuccessCreateDeposit);

  //
  // approve(address spender, uint256 value)
  //

  // Use a ref to store the success callback to avoid circular dependency
  const onSuccessApproveRef = useRef<((data: any) => void) | null>(null);
  
  // Define the hook with a wrapper callback
  const {
    writeApproveAsync,
    setTokenAddressInput: setApproveTokenAddressInput,
    setAmountToApproveInput,
    setShouldConfigureApproveWrite,
    signApproveTransactionStatus,
    mineApproveTransactionStatus,
    resetTransactionStatus: resetApprovalTransactionStatus,
    currentAllowance,
    refetchAllowance,
    isRefetchingAllowance,
  } = useTokenApprove((data) => {
    onSuccessApproveRef.current?.(data);
  });

  // Define the actual callback
  const onSuccessApprove = useCallback((data: any) => {
    // Set flag to indicate we're in approval flow to prevent state flickering
    setIsInApprovalFlow(true);
    
    // Refetch balance
    refetchUsdcBalance?.();
    
    // Manually trigger allowance refetch to ensure we get the latest value
    if (refetchAllowance) {
      setTimeout(() => {
        refetchAllowance();
      }, 2000); // Give RPC nodes time to sync
    }
  }, [refetchUsdcBalance, refetchAllowance]);

  // Set the ref to the callback
  useEffect(() => {
    onSuccessApproveRef.current = onSuccessApprove;
  }, [onSuccessApprove]);

  /*
   * Hooks
   */

  // Initialize platform conversion rates when platforms change
  useEffect(() => {
    // Only run when platforms actually change
    setPlatformConversionRates(prevConversionRates => {
      const newRates = new Map(prevConversionRates);
      let hasChanges = false;
      
      platforms.forEach(platform => {
        const platformCurrencies = paymentPlatformInfo[platform].platformCurrencies;
        
        // Check if this platform already exists
        if (!newRates.has(platform)) {
          newRates.set(platform, new Map());
          hasChanges = true;
        }
        
        const platformRateMap = newRates.get(platform)!;
        
        platformCurrencies.forEach((currency: string) => {
          // Only set if not already present to avoid unnecessary updates
          if (!platformRateMap.has(currency)) {
            platformRateMap.set(currency, '');
            hasChanges = true;
          }
        });
      });
      
      // Only return new object if there were actual changes
      return hasChanges ? newRates : prevConversionRates;
    });
  }, [platforms]); // Removed depositToken from dependencies as it doesn't affect rate initialization

  useEffect(() => {
    // Debounce the state update to prevent rapid re-renders
    // Use longer debounce during approval flow to reduce flickering
    const debounceTime = isInApprovalFlow ? 300 : 100;
    const timeoutId = setTimeout(() => {
      const updateDepositState = async () => {
        const successfulDepositTransaction = mineCreateDepositTransactionStatus === 'success';

      if (successfulDepositTransaction) {
        // the state is sent in the onSuccessCreateDeposit callback
        return;
      } else {
        const currentTokenBalance = usdcBalance;
        // Always use wagmi's currentAllowance as single source of truth
        const currentTokenApprovalToEscrow = currentAllowance;

        if (depositAmountValue !== '' && currentTokenBalance !== null && currentTokenApprovalToEscrow !== undefined) {
          const depositAmountBN = tokenUnits(depositAmountValue, usdcInfo.decimals);
          const isDepositAmountGreaterThanBalance = depositAmountBN > currentTokenBalance;
          const isDepositAmountLessThanMinDepositSize = depositAmountBN < MINIMUM_DEPOSIT_AMOUNT;
          // Handle case where allowance is still loading
          const isDepositAmountGreaterThanApprovedBalance = currentTokenApprovalToEscrow === undefined ? true : depositAmountBN > currentTokenApprovalToEscrow;
          
          if (isDepositAmountGreaterThanBalance) {
            setDepositState(NewDepositTransactionStatus.INSUFFICIENT_BALANCE);
          } else if (isDepositAmountLessThanMinDepositSize) {
            setDepositState(NewDepositTransactionStatus.MIN_DEPOSIT_THRESHOLD_NOT_MET);
          } else {
            if (maxAmountValue !== '' && minAmountValue !== '') {
              const maxPerOrderBN = tokenUnits(maxAmountValue, usdcInfo.decimals);
              const minPerOrderBN = tokenUnits(minAmountValue, usdcInfo.decimals);
              const isMaxPerOrderGreaterThanDepositAmount = maxPerOrderBN > depositAmountBN;
              const isMinPerOrderGreaterThanMaxPerOrder = minPerOrderBN > maxPerOrderBN;
              const isMinPerOrderLessThanMinimumAmount = minPerOrderBN < MINIMUM_DEPOSIT_AMOUNT;

              if (isMaxPerOrderGreaterThanDepositAmount) {
                setDepositState(NewDepositTransactionStatus.MAX_PER_ORDER_GREATER_THAN_DEPOSIT_AMOUNT);
              } else if (isMinPerOrderGreaterThanMaxPerOrder) {
                setDepositState(NewDepositTransactionStatus.MIN_PER_ORDER_GREATER_THAN_MAX_PER_ORDER);
              } else if (isMinPerOrderLessThanMinimumAmount) {
                setDepositState(NewDepositTransactionStatus.MIN_PER_ORDER_LESS_THAN_MINIMUM_AMOUNT);
              } else {
                const platformsWithMissingPayeeDetails = platforms.filter((platform) => {
                  const payeeDetails = platformPayeeDetails.get(platform);
                  return !payeeDetails || payeeDetails.trim() === '';
                });

                const platformsWithMissingRates = platforms.filter((platform: PaymentPlatformType) => {
                  let atleastOneRateSet = false;
                  const platformCurrencies = paymentPlatformInfo[platform].platformCurrencies;
                  for (const currency of platformCurrencies) {
                    const rate = platformConversionRates.get(platform)?.get(currency);
                    if (rate !== '0' && rate !== undefined && rate !== '' && rate !== '0.') {
                      atleastOneRateSet = true;
                      break;
                    }
                  }
                  return !atleastOneRateSet;
                });


                // Calculate new state first, then update only if different
                let newState: typeof NewDepositTransactionStatus[keyof typeof NewDepositTransactionStatus];
                
                if(platforms.length === 0) {
                  newState = NewDepositTransactionStatus.MISSING_PLATFORMS;
                } else if (platformsWithMissingPayeeDetails.length > 0) {
                  newState = NewDepositTransactionStatus.MISSING_PAYEE_DETAILS;
                } else if (platformsWithMissingRates.length > 0) {
                  newState = NewDepositTransactionStatus.INVALID_PLATFORM_CURRENCY_RATES;
                } else {
                  if (allPayeeDetailsPosted) {
                    const signingApproveTransaction = signApproveTransactionStatus === 'loading';
                    const miningApproveTransaction = mineApproveTransactionStatus === 'loading';
                    const successfulApproveTransaction = mineApproveTransactionStatus === 'success';

                    // Priority 1: Check if we're currently processing transactions
                    if (signingApproveTransaction) {
                      newState = NewDepositTransactionStatus.TRANSACTION_SIGNING;
                    } else if (miningApproveTransaction) {
                      newState = NewDepositTransactionStatus.TRANSACTION_MINING;
                    } else if (signCreateDepositTransactionStatus === 'loading') {
                      newState = NewDepositTransactionStatus.TRANSACTION_SIGNING;
                    } else if (mineCreateDepositTransactionStatus === 'loading') {
                      newState = NewDepositTransactionStatus.TRANSACTION_MINING;
                    }
                    // Priority 2: Check if approval is needed
                    else if (isDepositAmountGreaterThanApprovedBalance) {
                      // If we're in the approval flow (just approved), keep showing mining state
                      // This prevents flickering back to "Approve" button
                      if (isInApprovalFlow && successfulApproveTransaction) {
                        newState = NewDepositTransactionStatus.TRANSACTION_MINING;
                      } else if (!isInApprovalFlow) {
                        // Not in approval flow, show approval required
                        newState = NewDepositTransactionStatus.APPROVAL_REQUIRED;
                      } else {
                        // In approval flow but transaction not successful yet
                        newState = NewDepositTransactionStatus.APPROVAL_REQUIRED;
                      }
                    }
                    // Priority 3: Ready for deposit
                    else {
                      newState = NewDepositTransactionStatus.VALID;
                    }
                  } else {
                    newState = NewDepositTransactionStatus.VALIDATE_PAYEE_DETAILS;
                  }
                }
                
                // Only update state if it actually changed
                setDepositState(prev => prev !== newState ? newState : prev);
              } 
            } else {
              setDepositState(prev => prev !== NewDepositTransactionStatus.MISSING_MIN_MAX_AMOUNTS ? NewDepositTransactionStatus.MISSING_MIN_MAX_AMOUNTS : prev);
            }
          }
        } else {
          setDepositState(prev => prev !== NewDepositTransactionStatus.MISSING_AMOUNTS ? NewDepositTransactionStatus.MISSING_AMOUNTS : prev);
        }
      }
    }

      updateDepositState();
    }, debounceTime);
    
    return () => clearTimeout(timeoutId);
  }, [
      depositAmountValue,
      minAmountValue,
      maxAmountValue,
      depositToken,
      platforms,
      platformPayeeDetails,
      platformConversionRates,
      usdcBalance,
      usdcApprovalToEscrow,
      currentAllowance,
      allPayeeDetailsPosted,
      signApproveTransactionStatus,
      mineApproveTransactionStatus,
      signCreateDepositTransactionStatus,
      mineCreateDepositTransactionStatus,
      resetApprovalTransactionStatus,
      isRefetchingAllowance,
      isInApprovalFlow
    ]
  );

  useEffect(() => {
    const isApprovalRequired = depositState === NewDepositTransactionStatus.APPROVAL_REQUIRED;
    setShouldConfigureApproveWrite(isApprovalRequired);
    
    // Reset approval transaction status when we transition to VALID state
    // This ensures clean state for next approval if needed
    if (depositState === NewDepositTransactionStatus.VALID) {
      // Clear the approval flow flag as we've successfully transitioned
      if (isInApprovalFlow) {
        setIsInApprovalFlow(false);
      }
      
      // Reset approval status if it was successful
      if (mineApproveTransactionStatus === 'success') {
        resetApprovalTransactionStatus();
      }
    }
  }, [depositState, mineApproveTransactionStatus, resetApprovalTransactionStatus, isInApprovalFlow]);

  useEffect(() => {
    if (usdcAddress) {
      setApproveTokenAddressInput(usdcAddress);
      setDepositTokenInput(usdcAddress);
    }
  }, [depositToken, usdcAddress]);

  useEffect(() => {
    if (depositAmountValue !== '' && isValidInput(depositAmountValue)) {
      setDepositAmountInput(tokenUnits(depositAmountValue, 6).toString());
    } else {
      setDepositAmountInput('0');
    }
  }, [depositAmountValue]);

  useEffect(() => {
    if (depositAmountValue !== '' && isValidInput(depositAmountValue)) {
      const maxUsdcValue = Math.min(parseFloat(depositAmountValue), DEFAULT_MAX_ORDER_LIMIT).toString();
      setMaxAmountValue(maxUsdcValue);
    }
  }, [depositAmountValue]);

  useEffect(() => {
    if (minAmountValue !== '' && isValidInput(minAmountValue) && maxAmountValue !== '' && isValidInput(maxAmountValue)) {
      setIntentAmountRangeInput({
        min: tokenUnits(minAmountValue, usdcInfo.decimals),
        max: tokenUnits(maxAmountValue, usdcInfo.decimals)
      });
    } else {
      setIntentAmountRangeInput({
        min: ZERO,
        max: ZERO
      });
    }
  }, [minAmountValue, maxAmountValue, depositToken]);

  useEffect(() => {
    setVerifiersInput(platforms.map(
      (platform) => platformToVerifierAddress[platform as PaymentPlatformType] as `0x${string}` ?? null
    ));
  }, [platforms]);

  useEffect(() => {
    setHashedPayeeDetails(new Map());
    setAllPayeeDetailsPosted(false);
  }, [platforms, platformPayeeDetails]);

  // Memoize currenciesInput calculation to prevent unnecessary updates
  const calculatedCurrenciesInput = useMemo(() => {
    return platforms.map((platform) => {
      const platformCurrencies = paymentPlatformInfo[platform].platformCurrencies;
      const platformRates = platformConversionRates.get(platform);
      return platformCurrencies
        .map((currency) => {
          const rate = platformRates?.get(currency);
          if (!rate || rate === '' || rate === '0') return null;

          try {
            const conversionRate = etherUnits(rate);
            if (conversionRate === ZERO) return null;
            return {
              code: currencyInfo[currency].currencyCodeHash,
              conversionRate: conversionRate.toString()
            };  
          } catch (error) {
            console.error('Failed to convert rate:', error);
            return null;
          }
        })
        .filter((currency): currency is { code: string, conversionRate: string } => currency !== null);
    });
  }, [platforms, platformConversionRates]);

  useEffect(() => {
    setCurrenciesInput(calculatedCurrenciesInput);
  }, [calculatedCurrenciesInput]);

  useEffect(() => {
    setShouldConfigureCreateDepositWrite(depositState === NewDepositTransactionStatus.VALID);
  }, [depositState]);

  useEffect(() => {
    // Always use wagmi's currentAllowance as single source of truth
    if (depositAmountValue === '' || currentAllowance === undefined) {
      setAmountToApproveInput(ZERO.toString());
    } else {
      const depositAmountBN = tokenUnits(depositAmountValue, usdcInfo.decimals);
      const approvalDifference = depositAmountBN - currentAllowance;

      if (approvalDifference > ZERO) {
        setAmountToApproveInput(depositAmountBN.toString());
      } else {
        setAmountToApproveInput(ZERO.toString());
      }
    }
    
  }, [depositAmountValue, currentAllowance]);


  useEffect(() => {
    if (allPayeeDetailsPosted && witnessAddresses) {
      const verifierDataInput: EscrowDepositVerifierData[] = platforms.map((platform) => {
        const hashedOnchainId = hashedPayeeDetails.get(platform) ?? '';
        const depositData = encodeAbiParameters(
          parseAbiParameters('address[]'),
          [witnessAddresses as `0x${string}`[]]
        );
        return {
          intentGatingService: gatingServiceAddress as `0x${string}`,
          payeeDetails: hashedOnchainId,
          data: depositData
        };
      });

      setVerifierDataInput(verifierDataInput);
    }
  }, [allPayeeDetailsPosted, hashedPayeeDetails, witnessAddresses]);


  /*
   * Helpers
   */

  const postAllPayeeDetails = async () => {
    const requests: PostDepositDetailsRequest[] = [];

    platforms.forEach(platform => {
      const payeeDetail = platformPayeeDetails.get(platform) ?? '';
      if (payeeDetail) {
        requests.push({
          depositData: paymentPlatformInfo[platform].depositConfig.getDepositData(payeeDetail, telegramUsername),
          processorName: platform
        });
      }
    });

    try {
      setDepositState(NewDepositTransactionStatus.POSTING_PAYEE_DETAILS);
      const responses = await Promise.all(
        requests.map(request => postDepositDetails(request))
      );

      const hasError = responses.some(response => !response);
      if (hasError) {
        setDepositState(NewDepositTransactionStatus.INVALID_PAYEE_DETAILS);
        return;
      }

      responses.forEach((response) => {
        if (response?.responseObject) {
          const platform = response.responseObject.processorName;
          const payeeDetail = platformPayeeDetails.get(platform) ?? '';
          
          setStoredPayeeDetails((prev: {[key: string]: string}) => ({
            ...prev,
            [platform]: payeeDetail
          }));

          setHashedPayeeDetails(
            prevHashedPayeeDetails => new Map(prevHashedPayeeDetails).set(
              platform,
              response.responseObject.hashedOnchainId
            )
          );
        }
      });

      setAllPayeeDetailsPosted(true);

    } catch (error) {
      console.error('Error posting payee details:', error);
      setDepositState(NewDepositTransactionStatus.INVALID_PAYEE_DETAILS);
    }
  };

  function isValidInput(value: string) {
    const isValid = /^-?\d*(\.\d{0,6})?$/.test(value);
    
    return parseFloat(value) >= 0 && isValid;
  }

  const ctaDisabled = (): boolean => {
    switch (depositState) {
      case NewDepositTransactionStatus.INSUFFICIENT_BALANCE:
      case NewDepositTransactionStatus.APPROVAL_REQUIRED:
      case NewDepositTransactionStatus.VALIDATE_PAYEE_DETAILS:
      case NewDepositTransactionStatus.VALID:
      case NewDepositTransactionStatus.TRANSACTION_SUCCEEDED:
        return false;

      default:
        return true;
    }
  }

  const ctaLoading = (): boolean => {
    switch (depositState) {
      case NewDepositTransactionStatus.TRANSACTION_SIGNING:
      case NewDepositTransactionStatus.TRANSACTION_MINING:
      case NewDepositTransactionStatus.POSTING_PAYEE_DETAILS:
        return true;

      default:
        return false;
    }
  };

  const ctaText = (): string => {

    const minimumDepositAmountString = tokenUnitsToReadable(MINIMUM_DEPOSIT_AMOUNT, usdcInfo.decimals);

    switch (depositState) {
      case NewDepositTransactionStatus.MISSING_AMOUNTS:
        return 'Input deposit amount';

      case NewDepositTransactionStatus.MISSING_MIN_MAX_AMOUNTS:
        return 'Input min and max per order amounts';
      
      case NewDepositTransactionStatus.MISSING_PLATFORMS:
        return 'Add at least one payment platform';

      case NewDepositTransactionStatus.MISSING_PAYEE_DETAILS:
        return 'Missing payee details';

      case NewDepositTransactionStatus.VALIDATE_PAYEE_DETAILS:
        return 'Validate payee details';

      case NewDepositTransactionStatus.POSTING_PAYEE_DETAILS:
        return 'Posting payee details';

      case NewDepositTransactionStatus.INVALID_PAYEE_DETAILS:
        return 'Payee details validation failed. Please enter valid payee details';

      case NewDepositTransactionStatus.INVALID_PLATFORM_CURRENCY_RATES:
        return 'Each platform must have at least one currency rate set';

      case NewDepositTransactionStatus.INSUFFICIENT_BALANCE:
        return `Insufficient balance — Deposit USDC`;
      
      case NewDepositTransactionStatus.MIN_DEPOSIT_THRESHOLD_NOT_MET:
        return `Minimum deposit amount is ${minimumDepositAmountString}`;

      case NewDepositTransactionStatus.MAX_PER_ORDER_GREATER_THAN_DEPOSIT_AMOUNT:
        return `Max per order cannot be greater than deposit amount`;

      case NewDepositTransactionStatus.MIN_PER_ORDER_GREATER_THAN_MAX_PER_ORDER:
        return `Min per order cannot be greater than max per order`;

      case NewDepositTransactionStatus.MIN_PER_ORDER_LESS_THAN_MINIMUM_AMOUNT:
        return `Min per order cannot be less than ${minimumDepositAmountString}`;

      case NewDepositTransactionStatus.TRANSACTION_SIGNING:
        return 'Signing Transaction';

      case NewDepositTransactionStatus.TRANSACTION_MINING:
        // Show specific message when waiting for allowance to update after approval
        if (mineApproveTransactionStatus === 'success') {
          return 'Verifying Approval...';
        }
        return 'Mining Transaction';

      case NewDepositTransactionStatus.APPROVAL_REQUIRED:
        return `Approve ${usdcInfo.ticker}`;

      case NewDepositTransactionStatus.VALID:
        return 'Create Deposit';

      case NewDepositTransactionStatus.TRANSACTION_SUCCEEDED:
        return 'Go to Deposits';

      case NewDepositTransactionStatus.DEFAULT:
      default:
        return 'Create Deposit';
    }
  }

  const ctaOnClick = async () => {
    switch (depositState) {
      case NewDepositTransactionStatus.APPROVAL_REQUIRED:
        try {
          // Set flag when starting approval to prevent state flickering
          setIsInApprovalFlow(true);
          const result = await writeApproveAsync?.();
        } catch (error) {
          // Error is already handled by onError callback
          // Clear flag on error
          setIsInApprovalFlow(false);
        }
        break;

      case NewDepositTransactionStatus.VALIDATE_PAYEE_DETAILS:
        try {
          await postAllPayeeDetails();
          // postAllPayeeDetails handles its own success/error states
        } catch (error) {
          console.error('postAllPayeeDetails failed:', error);
          // Error state is set within postAllPayeeDetails
        }
        break;

      case NewDepositTransactionStatus.VALID:
        try {
          const result = await writeCreateDepositAsync?.();
        } catch (error) {
          // Error is already handled by onError callback
        }
        break;

      case NewDepositTransactionStatus.TRANSACTION_SUCCEEDED:
        handleBackClick();
        break;

      case NewDepositTransactionStatus.INSUFFICIENT_BALANCE:
        openModal(MODALS.RECEIVE);
        break;

      default:
        break;
    }
  }

  const tokenBalanceLabel = useMemo(() => {
    if (isLoggedIn) {
      return `${tokenUnitsToReadable(usdcBalance ?? ZERO, 6)} USDC`
    } else {
      return '';
    }
  }, [usdcBalance, isLoggedIn]);

  /*
   * Handlers
   */

  const handleDepositAmountChange = (value: string) => {
    if (value === "") {
      setDepositAmountValue('');
    } else if (value === ".") {
      setDepositAmountValue('0.');
    } else if (isValidInput(value)) {
      setDepositAmountValue(value);
    }
  };

  const handleMaxButtonClick = () => {
    setDepositAmountValue(tokenUnitsToReadable(usdcBalance ?? ZERO, 6));
  };

  const handleAddPlatformButtonClick = () => {
    // Initialize a new platform with default values
    const newPlatform = getAvailablePlatforms(platforms.length)[0];
    
    setPlatforms(prevPlatforms => [...prevPlatforms, newPlatform]);
    setPlatformPayeeDetails(prevPayeeDetails => new Map(prevPayeeDetails).set(newPlatform, ''));
    setPlatformConversionRates(prevConversionRates => new Map(prevConversionRates).set(newPlatform, new Map()));
  };

  const handleRemovePlatformButtonClick = (platform: PaymentPlatformType) => {
    setPlatforms(prevPlatforms => prevPlatforms.filter(p => p !== platform));
    setPlatformPayeeDetails(prevPayeeDetails => new Map(prevPayeeDetails).set(platform, ''));
    setPlatformConversionRates(prevConversionRates => new Map(prevConversionRates).set(platform, new Map()));
  };

  const handleMinAmountChange = (value: string) => {
    if (value === "") {
      setMinAmountValue('');
    } else if (value === ".") {
      setMinAmountValue('0.');
    } else if (isValidInput(value)) {
      setMinAmountValue(value);
    }
  };

  const handleMaxAmountChange = (value: string) => {
    if (value === "") {
      setMaxAmountValue('');
    } else if (value === ".") {
      setMaxAmountValue('0.');
    } else if (isValidInput(value)) {
      setMaxAmountValue(value);
    }
  };

  const handleMaxPerOrderButtonClick = () => {
    setMaxAmountValue(depositAmountValue);
  };

  /*
   * Helpers
   */

  const getAvailablePlatforms = (currentIndex: number) => {
    return paymentPlatforms.filter((platform) => {
      const isNotAlreadySelected = !platforms.includes(platform) || platforms[currentIndex] === platform;
      return isNotAlreadySelected;
    });
  };
  
  const addPlatform = (index: number): ((platform: PaymentPlatformType) => void) => {
    return (platform: PaymentPlatformType) => {
      setPlatforms(prevPlatforms => [...prevPlatforms.slice(0, index), platform, ...prevPlatforms.slice(index + 1)]);
    };
  };

  const getPayeeDetailsSetter = (platform: PaymentPlatformType) => {
    return (details: string) => {
      setPlatformPayeeDetails(prevPayeeDetails => new Map(prevPayeeDetails).set(platform, details));
    };
  };

  const getConversionRateSetter = (platform: PaymentPlatformType): ((currency: CurrencyType, rate: string) => void) => {
    return (currency: CurrencyType, rate: string) => {
      setPlatformConversionRates(
        prevConversionRates => new Map(prevConversionRates).set(
          platform,
          new Map(prevConversionRates.get(platform)).set(currency, rate)
        )
      );
    };
  };

  /*
   * Component
   */

  return (
    <Container>
      <RowBetween style={{ padding: '0.25rem 0rem 1.5rem 0rem' }}>
        <div style={{ flex: 0.5 }}>
          <button
            onClick={handleBackClick}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <StyledArrowLeft/>
          </button>
        </div>

        <ThemedText.HeadlineSmall style={{ flex: '1', margin: 'auto', textAlign: 'center' }}>
          New Deposit
        </ThemedText.HeadlineSmall>

        <div style={{ flex: 0.5 }}/>
      </RowBetween>

      <Body>        
        <InputsContainer>
          <InputWithTokenSelector
            label="Deposit Amount"
            name={`depositAmount`}
            value={depositAmountValue}
            onChange={(e) => handleDepositAmountChange(e.currentTarget.value)}
            type="number"
            inputLabel="USDC"
            placeholder="0"
            accessoryLabel={tokenBalanceLabel}
            enableMax={true}
            maxButtonOnClick={handleMaxButtonClick}
            hasSelector={true}
            selectedToken={depositToken}
            setSelectedToken={setDepositToken}
            onlyShowDepositAllowedTokens={true}
            showBalance={true}
            onlyShowCurrentNetwork={true}
          />

          <Input
            label="Telegram Username (Recommended)"
            name="telegramUsername"
            value={telegramUsername}
            onChange={(e) => setTelegramUsername(e.currentTarget.value)}
            placeholder="@username"
            helperText='This will help your counterparty find you on Telegram if they need to contact you.'
          />

          <NewPaymentPlatformContainer>
            {platforms.map((platform, index) => 
              <NewPaymentPlatform
                key={index}
                depositToken={depositToken}
                selectedPlatform={platform}
                allPlatforms={getAvailablePlatforms(index)}
                setSelectedPlatform={addPlatform(index)}
                payeeDetails={platformPayeeDetails.get(platform) ?? ''}
                setPayeeDetails={getPayeeDetailsSetter(platform)}
                conversionRates={platformConversionRates.get(platform) ?? new Map()}
                setConversionRates={getConversionRateSetter(platform)}
                handleRemovePlatform={() => handleRemovePlatformButtonClick(platform)}
              />
            )}
          </NewPaymentPlatformContainer> 

          {getAvailablePlatforms(platforms.length).length > 0 && (
            <AddPaymentPlatformButtonContainer>
              <AccessoryButton
                onClick={handleAddPlatformButtonClick}
                height={36}
                icon="plus"
                title="Add Payment Platform"
                iconPosition='left'
                textAlign='right'
                fullWidth={false}
              />
            </AddPaymentPlatformButtonContainer>
          )}

          <AdvancedSettings
            minAmountValue={minAmountValue}
            maxAmountValue={maxAmountValue}
            handleMinAmountChange={handleMinAmountChange}
            handleMaxAmountChange={handleMaxAmountChange}
            handleMaxPerOrderButtonClick={handleMaxPerOrderButtonClick}
          />

          <ButtonContainer>
            <Button
              fullWidth={true}
              disabled={ctaDisabled()}
              onClick={ctaOnClick}
            >
              <ButtonContentWrapper>
                {ctaLoading() && <StyledSpinner size={20} />}
                <span>{ctaText()}</span>
              </ButtonContentWrapper>
            </Button>
          </ButtonContainer>
        </InputsContainer>
      </Body>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background-color: ${colors.container};
  border-radius: 16px;
  border: 1px solid ${colors.defaultBorderColor};

  @media (min-width: 600px) {
    min-width: 484px;
    max-width: 484px;
  }

  @media (max-width: 600px) {
    padding: 12px;
  }
`;


const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: ${colors.container};
`;

const InputsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ButtonContainer = styled.div`
  display: grid;
`;

const StyledArrowLeft = styled(ArrowLeft)`
  color: #FFF;
`;

const NewPaymentPlatformContainer = styled.div`
  width: 100%;
  display: grid;
  gap: 1rem;
`;

const AddPaymentPlatformButtonContainer = styled.div`
  display: grid;
  justify-content: flex-end;
`;

const ButtonContentWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StyledSpinner = styled(Spinner)`
  margin-left: 8px;
`;