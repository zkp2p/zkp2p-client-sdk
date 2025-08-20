import { useState, useCallback, useEffect } from 'react';
import { type Address, type Hex } from 'viem';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import usePrivyTransaction from '@hooks/usePrivyTransaction';

export default function useCancelIntentTransaction(
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
  const [shouldConfigureCancelIntentWrite, setShouldConfigureCancelIntentWrite] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>();
  const [signCancelIntentTransactionStatus, setSignCancelIntentTransactionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [mineCancelIntentTransactionStatus, setMineCancelIntentTransactionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

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
      setMineCancelIntentTransactionStatus('success');
      setShouldConfigureCancelIntentWrite(false);
      onSuccess?.({ transactionHash: hash });
    },
    onError: (error) => {
      setSignCancelIntentTransactionStatus('error');
      setMineCancelIntentTransactionStatus('error');
      setShouldConfigureCancelIntentWrite(false);
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
        setSignCancelIntentTransactionStatus('loading');
        setMineCancelIntentTransactionStatus('idle');
      } else {
        setSignCancelIntentTransactionStatus('success');
        setMineCancelIntentTransactionStatus('loading');
      }
    } else if (privyTxError) {
      setSignCancelIntentTransactionStatus('error');
      setMineCancelIntentTransactionStatus('error');
    } else if (userOpHash && !isPrivyTxLoading) {
      setSignCancelIntentTransactionStatus('success');
      setMineCancelIntentTransactionStatus('success');
    }
  }, [isPrivyTxLoading, privyTxError, userOpHash]);

  /*
   * Write Function
   */
  const writeCancelIntentAsync = useCallback(async () => {
    if (!shouldConfigureCancelIntentWrite) {
      return;
    }

    if (!escrowAddress || !escrowAbi) {
      const error = new Error('Smart contracts not initialized');
      console.error(error);
      onError?.(error);
      return;
    }

    if (!intentHashInput) {
      const error = new Error('Missing intent hash for canceling intent');
      console.error(error);
      onError?.(error);
      return;
    }

    try {
      setSignCancelIntentTransactionStatus('loading');
      
      const hash = await writeContractAsync({
        address: escrowAddress as Address,
        abi: escrowAbi as any,
        functionName: 'cancelIntent',
        args: [intentHashInput as Hex],
      });
      
      if (hash) {
        return { hash };
      }
    } catch (error) {
      console.error('writeCancelIntentAsync failed:', error);
      // Error handling is done in the onError callback
    }
  }, [
    shouldConfigureCancelIntentWrite,
    escrowAddress,
    escrowAbi,
    intentHashInput,
    writeContractAsync,
    onError,
  ]);

  return {
    writeCancelIntentAsync,
    intentHashInput,
    setIntentHashInput,
    shouldConfigureCancelIntentWrite,
    setShouldConfigureCancelIntentWrite,
    signCancelIntentTransactionStatus,
    mineCancelIntentTransactionStatus,
    transactionHash,
  };
}