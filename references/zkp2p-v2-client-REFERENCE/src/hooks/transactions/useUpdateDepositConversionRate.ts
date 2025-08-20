import { useState, useCallback, useEffect } from 'react';
import { type Address, type Hex } from 'viem';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import usePrivyTransaction from '@hooks/usePrivyTransaction';

export default function useUpdateDepositConversionRate(
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
  const [depositId, setDepositId] = useState<string | null>(null);
  const [verifier, setVerifier] = useState<string | null>(null);
  const [fiatCurrency, setFiatCurrency] = useState<string | null>(null);
  const [newConversionRate, setNewConversionRate] = useState<string | null>(null);
  const [shouldConfigureUpdateRateWrite, setShouldConfigureUpdateRateWrite] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>();
  const [signUpdateRateTransactionStatus, setSignUpdateRateTransactionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [mineUpdateRateTransactionStatus, setMineUpdateRateTransactionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

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
      setMineUpdateRateTransactionStatus('success');
      setShouldConfigureUpdateRateWrite(false);
      onSuccess?.({ transactionHash: hash });
    },
    onError: (error) => {
      setSignUpdateRateTransactionStatus('error');
      setMineUpdateRateTransactionStatus('error');
      setShouldConfigureUpdateRateWrite(false);
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
        setSignUpdateRateTransactionStatus('loading');
        setMineUpdateRateTransactionStatus('idle');
      } else {
        setSignUpdateRateTransactionStatus('success');
        setMineUpdateRateTransactionStatus('loading');
      }
    } else if (privyTxError) {
      setSignUpdateRateTransactionStatus('error');
      setMineUpdateRateTransactionStatus('error');
    } else if (userOpHash && !isPrivyTxLoading) {
      setSignUpdateRateTransactionStatus('success');
      setMineUpdateRateTransactionStatus('success');
    }
  }, [isPrivyTxLoading, privyTxError, userOpHash]);

  /*
   * Write Function
   */
  const writeUpdateRateAsync = useCallback(async () => {
    if (!shouldConfigureUpdateRateWrite) {
      return;
    }

    if (!escrowAddress || !escrowAbi) {
      const error = new Error('Smart contracts not initialized');
      console.error(error);
      onError?.(error);
      return;
    }

    if (!depositId || !verifier || !fiatCurrency || !newConversionRate) {
      const error = new Error('Missing required parameters for updating conversion rate');
      console.error(error);
      onError?.(error);
      return;
    }

    try {
      setSignUpdateRateTransactionStatus('loading');
      
      const hash = await writeContractAsync({
        address: escrowAddress as Address,
        abi: escrowAbi as any,
        functionName: 'updateDepositConversionRate',
        args: [
          BigInt(depositId),
          verifier as Address,
          fiatCurrency as Hex,
          BigInt(newConversionRate),
        ],
      });
      
      if (hash) {
        return { hash };
      }
    } catch (error) {
      console.error('writeUpdateRateAsync failed:', error);
      // Error handling is done in the onError callback
    }
  }, [
    shouldConfigureUpdateRateWrite,
    escrowAddress,
    escrowAbi,
    depositId,
    verifier,
    fiatCurrency,
    newConversionRate,
    writeContractAsync,
    onError,
  ]);

  return {
    writeUpdateRateAsync,
    depositId,
    setDepositId,
    verifier,
    setVerifier,
    fiatCurrency,
    setFiatCurrency,
    newConversionRate,
    setNewConversionRate,
    shouldConfigureUpdateRateWrite,
    setShouldConfigureUpdateRateWrite,
    signUpdateRateTransactionStatus,
    mineUpdateRateTransactionStatus,
    transactionHash,
  };
}