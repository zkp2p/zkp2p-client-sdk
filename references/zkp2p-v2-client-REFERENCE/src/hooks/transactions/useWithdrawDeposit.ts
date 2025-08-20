import { useState, useCallback, useEffect } from 'react';
import { type Address } from 'viem';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import usePrivyTransaction from '@hooks/usePrivyTransaction';

export default function useWithdrawDeposit(
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
  const [depositIdInput, setDepositIdInput] = useState<number | null>(null);
  const [shouldConfigureWithdrawWrite, setShouldConfigureWithdrawWrite] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>();
  const [signWithdrawTransactionStatus, setSignWithdrawTransactionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [mineWithdrawTransactionStatus, setMineWithdrawTransactionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

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
      setMineWithdrawTransactionStatus('success');
      setShouldConfigureWithdrawWrite(false);
      onSuccess?.({ transactionHash: hash });
    },
    onError: (error) => {
      setSignWithdrawTransactionStatus('error');
      setMineWithdrawTransactionStatus('error');
      setShouldConfigureWithdrawWrite(false);
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
        setSignWithdrawTransactionStatus('loading');
        setMineWithdrawTransactionStatus('idle');
      } else {
        setSignWithdrawTransactionStatus('success');
        setMineWithdrawTransactionStatus('loading');
      }
    } else if (privyTxError) {
      setSignWithdrawTransactionStatus('error');
      setMineWithdrawTransactionStatus('error');
    } else if (userOpHash && !isPrivyTxLoading) {
      setSignWithdrawTransactionStatus('success');
      setMineWithdrawTransactionStatus('success');
    }
  }, [isPrivyTxLoading, privyTxError, userOpHash]);

  /*
   * Write Function
   */
  const writeWithdrawAsync = useCallback(async () => {
    if (!shouldConfigureWithdrawWrite) {
      return;
    }

    if (!escrowAddress || !escrowAbi) {
      const error = new Error('Smart contracts not initialized');
      console.error(error);
      onError?.(error);
      return;
    }

    if (depositIdInput === null) {
      const error = new Error('Missing deposit ID for withdrawal');
      console.error(error);
      onError?.(error);
      return;
    }

    try {
      setSignWithdrawTransactionStatus('loading');
      
      const hash = await writeContractAsync({
        address: escrowAddress as Address,
        abi: escrowAbi as any,
        functionName: 'withdrawDeposit',
        args: [BigInt(depositIdInput)],
      });
      
      if (hash) {
        return { hash };
      }
    } catch (error) {
      console.error('writeWithdrawAsync failed:', error);
      // Error handling is done in the onError callback
    }
  }, [
    shouldConfigureWithdrawWrite,
    escrowAddress,
    escrowAbi,
    depositIdInput,
    writeContractAsync,
    onError,
  ]);

  return {
    writeWithdrawAsync,
    depositIdInput,
    setDepositIdInput,
    shouldConfigureWithdrawWrite,
    setShouldConfigureWithdrawWrite,
    signWithdrawTransactionStatus,
    mineWithdrawTransactionStatus,
    transactionHash,
  };
}