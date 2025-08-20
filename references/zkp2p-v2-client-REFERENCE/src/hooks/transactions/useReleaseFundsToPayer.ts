import { useState, useCallback, useEffect } from 'react';
import { type Address, type Hex } from 'viem';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import usePrivyTransaction from '@hooks/usePrivyTransaction';

export default function useReleaseFundsToPayerTransaction(
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
  const [intentHashInput, setIntentHashInput] = useState<string | null>(null);
  const [shouldConfigureReleaseFundsWrite, setShouldConfigureReleaseFundsWrite] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>();
  const [signReleaseFundsTransactionStatus, setSignReleaseFundsTransactionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [mineReleaseFundsTransactionStatus, setMineReleaseFundsTransactionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

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
      setMineReleaseFundsTransactionStatus('success');
      setShouldConfigureReleaseFundsWrite(false);
      onSuccess?.({ transactionHash: hash });
    },
    onError: (error) => {
      setSignReleaseFundsTransactionStatus('error');
      setMineReleaseFundsTransactionStatus('error');
      setShouldConfigureReleaseFundsWrite(false);
      onError?.(error);
    },
    showToasts: false, // We'll handle toasts in the component
  });

  /*
   * Update status based on transaction state
   */
  useEffect(() => {
    if (isPrivyTxLoading) {
      if (!userOpHash) {
        setSignReleaseFundsTransactionStatus('loading');
        setMineReleaseFundsTransactionStatus('idle');
      } else {
        setSignReleaseFundsTransactionStatus('success');
        setMineReleaseFundsTransactionStatus('loading');
      }
    } else if (privyTxError) {
      setSignReleaseFundsTransactionStatus('error');
      setMineReleaseFundsTransactionStatus('error');
    } else if (userOpHash && !isPrivyTxLoading) {
      setSignReleaseFundsTransactionStatus('success');
      setMineReleaseFundsTransactionStatus('success');
    }
  }, [isPrivyTxLoading, privyTxError, userOpHash]);

  /*
   * Write Function
   */
  const writeReleaseFundsAsync = useCallback(async () => {
    if (!shouldConfigureReleaseFundsWrite) {
      return;
    }

    if (!escrowAddress || !escrowAbi) {
      const error = new Error('Smart contracts not initialized');
      console.error(error);
      onError?.(error);
      return;
    }

    if (!intentHashInput) {
      const error = new Error('Missing intent hash for releasing funds');
      console.error(error);
      onError?.(error);
      return;
    }

    try {
      setSignReleaseFundsTransactionStatus('loading');
      
      const hash = await writeContractAsync({
        address: escrowAddress as Address,
        abi: escrowAbi as any,
        functionName: 'releaseFundsToPayer',
        args: [intentHashInput as Hex],
      });
      
      if (hash) {
        return { hash };
      }
    } catch (error) {
      console.error('writeReleaseFundsAsync failed:', error);
      // Error handling is done in the onError callback
    }
  }, [
    shouldConfigureReleaseFundsWrite,
    escrowAddress,
    escrowAbi,
    intentHashInput,
    writeContractAsync,
    onError,
  ]);

  return {
    writeReleaseFundsAsync,
    intentHashInput,
    setIntentHashInput,
    shouldConfigureReleaseFundsWrite,
    setShouldConfigureReleaseFundsWrite,
    signReleaseFundsTransactionStatus,
    mineReleaseFundsTransactionStatus,
    transactionHash,
  };
}