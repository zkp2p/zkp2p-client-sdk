import { useState, useCallback, useEffect } from 'react';
import { type Address, type Hex } from 'viem';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import usePrivyTransaction from '@hooks/usePrivyTransaction';
import { useErrorLogger } from '@hooks/useErrorLogger';
import { ErrorCategory, generateCorrelationId } from '@helpers/types/errors';
import useSmartAccount from '@hooks/contexts/useSmartAccount';

export default function useSignalIntent(
  onSuccess?: (data: any) => void,
  onError?: (error: Error) => void
) {
  /*
   * Context
   */
  const { escrowAddress, escrowAbi } = useSmartContracts();
  const { logError } = useErrorLogger();
  const { isSmartAccountEnabled, eip7702AuthorizationStatus } = useSmartAccount();

  /*
   * State
   */
  const [depositIdInput, setDepositIdInput] = useState<number | null>(null);
  const [tokenAmountInput, setTokenAmountInput] = useState<string | null>(null);
  const [recipientAddressInput, setRecipientAddressInput] = useState<string | null>(null);
  const [verifierAddressInput, setVerifierAddressInput] = useState<string | null>(null);
  const [currencyCodeHashInput, setCurrencyCodeHashInput] = useState<string | null>(null);
  const [gatingServiceSignatureInput, setGatingServiceSignatureInput] = useState<string | null>(null);
  const [shouldConfigureSignalIntentWrite, setShouldConfigureSignalIntentWrite] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>();
  const [signSignalIntentTransactionStatus, setSignSignalIntentTransactionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [mineSignalIntentTransactionStatus, setMineSignalIntentTransactionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [correlationId] = useState<string>(generateCorrelationId());

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
      setMineSignalIntentTransactionStatus('success');
      setShouldConfigureSignalIntentWrite(false);
      onSuccess?.({ transactionHash: hash });
    },
    onError: (error) => {
      setSignSignalIntentTransactionStatus('error');
      setMineSignalIntentTransactionStatus('error');
      setShouldConfigureSignalIntentWrite(false);
      
      // Log contract error
      logError(
        'Signal intent transaction failed',
        ErrorCategory.CONTRACT_ERROR,
        {
          error: (error as any)?.message || error,
          errorStack: (error as any)?.stack,
          errorCode: (error as any)?.code,
          depositId: depositIdInput,
          tokenAmount: tokenAmountInput,
          // Don't log full addresses for PII
          hasRecipientAddress: !!recipientAddressInput,
          hasVerifierAddress: !!verifierAddressInput,
          contractAddress: escrowAddress,
          functionName: 'signalIntent',
          smartAccountState: {
            isEnabled: isSmartAccountEnabled,
            isAuthorized: eip7702AuthorizationStatus === 'authorized'
          },
          userOpHash,
        },
        correlationId
      );
      
      onError?.(error);
    },
  });

  /*
   * Update status based on transaction state
   */
  useEffect(() => {
    if (isPrivyTxLoading) {
      if (!userOpHash) {
        setSignSignalIntentTransactionStatus('loading');
        setMineSignalIntentTransactionStatus('idle');
      } else {
        setSignSignalIntentTransactionStatus('success');
        setMineSignalIntentTransactionStatus('loading');
      }
    } else if (privyTxError) {
      setSignSignalIntentTransactionStatus('error');
      setMineSignalIntentTransactionStatus('error');
    } else if (userOpHash && !isPrivyTxLoading) {
      setSignSignalIntentTransactionStatus('success');
      setMineSignalIntentTransactionStatus('success');
    }
  }, [isPrivyTxLoading, privyTxError, userOpHash]);

  /*
   * Write Function
   */
  const writeSignalIntentAsync = useCallback(async () => {
    if (!shouldConfigureSignalIntentWrite) {
      return;
    }

    if (!escrowAddress || !escrowAbi) {
      const error = new Error('Smart contracts not initialized');
      console.error(error);
      
      // Log initialization error
      logError(
        'Smart contracts not initialized for signal intent',
        ErrorCategory.CONTRACT_ERROR,
        {
          hasEscrowAddress: !!escrowAddress,
          hasEscrowAbi: !!escrowAbi,
        },
        correlationId
      );
      
      onError?.(error);
      return;
    }

    // Validate all inputs
    if (
      depositIdInput === null ||
      !tokenAmountInput ||
      !recipientAddressInput ||
      !verifierAddressInput ||
      !currencyCodeHashInput ||
      !gatingServiceSignatureInput
    ) {
      const error = new Error('Missing required parameters for signaling intent');
      console.error(error);
      
      // Log validation error
      logError(
        'Missing required parameters for signal intent',
        ErrorCategory.VALIDATION_ERROR,
        {
          hasDepositId: depositIdInput !== null,
          hasTokenAmount: !!tokenAmountInput,
          hasRecipientAddress: !!recipientAddressInput,
          hasVerifierAddress: !!verifierAddressInput,
          hasCurrencyCodeHash: !!currencyCodeHashInput,
          hasGatingServiceSignature: !!gatingServiceSignatureInput,
        },
        correlationId
      );
      
      onError?.(error);
      return;
    }

    try {
      setSignSignalIntentTransactionStatus('loading');
      
      const hash = await writeContractAsync({
        address: escrowAddress as Address,
        abi: escrowAbi as any,
        functionName: 'signalIntent',
        args: [
          BigInt(depositIdInput),
          BigInt(tokenAmountInput),
          recipientAddressInput as Address,
          verifierAddressInput as Address,
          currencyCodeHashInput as Hex,
          gatingServiceSignatureInput as Hex,
        ],
      });
      
      if (hash) {
        return { hash };
      }
    } catch (error) {
      console.error('writeSignalIntentAsync failed:', error);
      
      // Log unexpected errors that weren't caught by onError callback
      logError(
        'Unexpected error in signal intent execution',
        ErrorCategory.CONTRACT_ERROR,
        {
          error: (error as any)?.message || error,
          errorStack: (error as any)?.stack,
          depositId: depositIdInput,
          tokenAmount: tokenAmountInput,
        },
        correlationId
      );
      
      // Error handling is done in the onError callback
    }
  }, [
    shouldConfigureSignalIntentWrite,
    escrowAddress,
    escrowAbi,
    depositIdInput,
    tokenAmountInput,
    recipientAddressInput,
    verifierAddressInput,
    currencyCodeHashInput,
    gatingServiceSignatureInput,
    writeContractAsync,
    onError,
    logError,
    correlationId,
    isSmartAccountEnabled,
    eip7702AuthorizationStatus
  ]);

  return {
    writeSignalIntentAsync,
    depositIdInput,
    setDepositIdInput,
    tokenAmountInput,
    setTokenAmountInput,
    recipientAddressInput,
    setRecipientAddressInput,
    verifierAddressInput,
    setVerifierAddressInput,
    currencyCodeHashInput,
    setCurrencyCodeHashInput,
    gatingServiceSignatureInput,
    setGatingServiceSignatureInput,
    shouldConfigureSignalIntentWrite,
    setShouldConfigureSignalIntentWrite,
    signSignalIntentTransactionStatus,
    setSignSignalIntentTransactionStatus,
    mineSignalIntentTransactionStatus,
    setMineSignalIntentTransactionStatus,
    transactionHash,
  };
}