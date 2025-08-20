import { useState, useCallback, useEffect } from 'react';
import { type Address as ViemAddress, type Hex } from 'viem';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import usePrivyTransaction from '@hooks/usePrivyTransaction';

import { Address, EscrowRange, EscrowDepositVerifierData } from '@helpers/types';
import { usdcInfo } from '@helpers/types/tokens';

export default function useCreateDeposit(
  onSuccess?: (data: any) => void,
  onError?: (error: Error) => void
) {
  /*
   * Context
   */
  const { escrowAddress, escrowAbi } = useSmartContracts();

  /*
   * State
   */
  const [tokenInput, setTokenInput] = useState<string>(usdcInfo.tokenId);
  const [amountInput, setAmountInput] = useState<string>('0');
  const [intentAmountRangeInput, setIntentAmountRangeInput] = useState<EscrowRange | null>(null);
  const [verifiersInput, setVerifiersInput] = useState<Address[] | null>(null);
  const [verifierDataInput, setVerifierDataInput] = useState<EscrowDepositVerifierData[] | null>(null);
  const [currenciesInput, setCurrenciesInput] = useState<{ code: string, conversionRate: string }[][] | null>(null);
  const [shouldConfigureCreateDepositWrite, setShouldConfigureCreateDepositWrite] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>();
  const [signCreateDepositTransactionStatus, setSignCreateDepositTransactionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [mineCreateDepositTransactionStatus, setMineCreateDepositTransactionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  /*
   * Privy Transaction Hook
   */
  const {
    writeContractAsync,
    isLoading: isPrivyTxLoading,
    error: privyTxError,
    userOpHash,
  } = usePrivyTransaction({
    onSuccess: (hash) => {
      setTransactionHash(hash as `0x${string}`);
      setMineCreateDepositTransactionStatus('success');
      setShouldConfigureCreateDepositWrite(false);
      onSuccess?.({ transactionHash: hash });
    },
    onError: (error) => {
      setSignCreateDepositTransactionStatus('error');
      setMineCreateDepositTransactionStatus('error');
      setShouldConfigureCreateDepositWrite(false);
      onError?.(error);
    },
  });

  /*
   * Update status based on transaction state
   */
  useEffect(() => {
    if (isPrivyTxLoading) {
      if (!userOpHash) {
        setSignCreateDepositTransactionStatus('loading');
        setMineCreateDepositTransactionStatus('idle');
      } else {
        setSignCreateDepositTransactionStatus('success');
        setMineCreateDepositTransactionStatus('loading');
      }
    } else if (privyTxError) {
      setSignCreateDepositTransactionStatus('error');
      setMineCreateDepositTransactionStatus('error');
    } else if (userOpHash && !isPrivyTxLoading) {
      setSignCreateDepositTransactionStatus('success');
      setMineCreateDepositTransactionStatus('success');
    }
  }, [isPrivyTxLoading, privyTxError, userOpHash]);

  /*
   * Write Function
   */
  const writeCreateDepositAsync = useCallback(async () => {
    if (!shouldConfigureCreateDepositWrite) {
      return;
    }

    if (!escrowAddress || !escrowAbi) {
      const error = new Error('Smart contracts not initialized');
      console.error(error);
      onError?.(error);
      return;
    }

    if (!tokenInput || !amountInput || !intentAmountRangeInput || !verifiersInput || !verifierDataInput || !currenciesInput) {
      const error = new Error('Missing required inputs for createDeposit');
      console.error(error);
      onError?.(error);
      return;
    }

    try {
      setSignCreateDepositTransactionStatus('loading');
      
      // Format the arguments for the contract call
      const args = [
        tokenInput as ViemAddress,
        BigInt(amountInput),
        {
          min: BigInt(intentAmountRangeInput.min),
          max: BigInt(intentAmountRangeInput.max)
        },
        verifiersInput as ViemAddress[],
        verifierDataInput.map(data => ({
          intentGatingService: data.intentGatingService as ViemAddress,
          payeeDetails: data.payeeDetails,
          data: data.data as Hex
        })),
        currenciesInput.map(currencies =>
          currencies.map(currency => ({
            code: currency.code as Hex,
            conversionRate: BigInt(currency.conversionRate)
          }))
        )
      ];
      
      const hash = await writeContractAsync({
        address: escrowAddress as ViemAddress,
        abi: escrowAbi as any,
        functionName: 'createDeposit',
        args,
      });
      
      if (hash) {
        return { hash };
      }
    } catch (error) {
      console.error('writeCreateDepositAsync failed:', error);
      // Error handling is done in the onError callback
    }
  }, [
    shouldConfigureCreateDepositWrite,
    escrowAddress,
    escrowAbi,
    tokenInput,
    amountInput,
    intentAmountRangeInput,
    verifiersInput,
    verifierDataInput,
    currenciesInput,
    writeContractAsync,
    onError,
  ]);

  return {
    writeCreateDepositAsync,
    tokenInput,
    setTokenInput,
    amountInput,
    setAmountInput,
    intentAmountRangeInput,
    setIntentAmountRangeInput,
    verifiersInput,
    setVerifiersInput,
    verifierDataInput,
    setVerifierDataInput,
    currenciesInput,
    setCurrenciesInput,
    shouldConfigureCreateDepositWrite,
    setShouldConfigureCreateDepositWrite,
    signCreateDepositTransactionStatus,
    mineCreateDepositTransactionStatus,
    transactionHash,
  };
}