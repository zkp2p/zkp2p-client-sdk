import { useState, useCallback, useEffect, useRef } from 'react';
import { type Address, type Hex, createPublicClient, http } from 'viem';
import { simulateContract } from 'viem/actions';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import usePrivyTransaction from '@hooks/usePrivyTransaction';
import { useErrorLogger } from '@hooks/useErrorLogger';
import { ErrorCategory, generateCorrelationId } from '@helpers/types/errors';
import { ProofGenerationStatus } from '@helpers/types/status/proofGenerationStatus';
import useSmartAccount from '@hooks/contexts/useSmartAccount';
import useAccount from '@hooks/contexts/useAccount';
import { alchemyRpcUrl } from '../../index';
import { getDefaultChain } from '../../config/wagmi';

export default function useFulfillIntentTransaction(
  onSuccess?: (data: any) => void,
  onError?: (error: Error) => void
) {
  /*
   * Context
   */
  const { escrowAddress, escrowAbi } = useSmartContracts();
  const { logError } = useErrorLogger();
  const { isSmartAccountEnabled, eip7702AuthorizationStatus, smartAccountAddress } = useSmartAccount();
  const { loggedInEthereumAddress } = useAccount();

  /*
   * State
   */
  const [correlationId] = useState<string>(generateCorrelationId());

  const [paymentProofInput, setPaymentProofInput] = useState<string | null>(null);
  const [intentHashInput, setIntentHashInput] = useState<string | null>(null);
  const [shouldConfigureFulfillIntentWrite, setShouldConfigureFulfillIntentWrite] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>();
  const [signFulfillIntentTransactionStatus, setSignFulfillIntentTransactionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [mineFulfillIntentTransactionStatus, setMineFulfillIntentTransactionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isPreparingTransaction, setIsPreparingTransaction] = useState<boolean>(false);
  const [isWriteFulfillIntentSimulationSuccess, setIsWriteFulfillIntentSimulationSuccess] = useState<boolean>(false);
  const [prepareFulfillIntentError, setPrepareFulfillIntentError] = useState<Error | null>(null);
  const [isWriteFulfillIntentPrepareError, setIsWriteFulfillIntentPrepareError] = useState<boolean>(false);
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'simulating' | 'success' | 'error'>('idle');

  // Create a ref to track simulationStatus without causing re-renders
  const simulationStatusRef = useRef<'idle' | 'simulating' | 'success' | 'error'>('idle');

  // Keep the ref in sync with the state
  useEffect(() => {
    simulationStatusRef.current = simulationStatus;
  }, [simulationStatus]);

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
      setMineFulfillIntentTransactionStatus('success');
      setShouldConfigureFulfillIntentWrite(false);
      onSuccess?.({ transactionHash: hash });
    },
    onError: (error) => {
      setSignFulfillIntentTransactionStatus('error');
      setMineFulfillIntentTransactionStatus('error');
      setShouldConfigureFulfillIntentWrite(false);
      setPrepareFulfillIntentError(error);
      setIsWriteFulfillIntentPrepareError(true);
      setSimulationStatus('error');

      // Log contract error
      logError(
        'Fulfill intent transaction failed',
        ErrorCategory.CONTRACT_ERROR,
        {
          error: (error as any)?.message || error,
          errorStack: (error as any)?.stack,
          errorCode: (error as any)?.code,
          intentHash: intentHashInput,
          paymentProofLength: paymentProofInput?.length,
          contractAddress: escrowAddress,
          functionName: 'fulfillIntent',
          smartAccountState: {
            isEnabled: isSmartAccountEnabled,
            isAuthorized: eip7702AuthorizationStatus === 'authorized'
          },
          userOpHash,
          simulationStatus: simulationStatusRef.current,
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
        setSignFulfillIntentTransactionStatus('loading');
        setMineFulfillIntentTransactionStatus('idle');
        setIsPreparingTransaction(true);
      } else {
        setSignFulfillIntentTransactionStatus('success');
        setMineFulfillIntentTransactionStatus('loading');
        setIsPreparingTransaction(false);
      }
    } else if (privyTxError) {
      setSignFulfillIntentTransactionStatus('error');
      setMineFulfillIntentTransactionStatus('error');
      setIsPreparingTransaction(false);
    } else if (userOpHash && !isPrivyTxLoading) {
      setSignFulfillIntentTransactionStatus('success');
      setMineFulfillIntentTransactionStatus('success');
      setIsPreparingTransaction(false);
    }
  }, [isPrivyTxLoading, privyTxError, userOpHash]);

  /*
   * Reset simulation status when inputs change
   */
  useEffect(() => {
    setSimulationStatus('idle');
    setIsWriteFulfillIntentSimulationSuccess(false);
  }, [paymentProofInput, intentHashInput]);

  /*
   * Write Function
   */
  const writeFulfillIntentAsync = useCallback(async () => {
    if (!shouldConfigureFulfillIntentWrite) {
      return;
    }

    if (!escrowAddress || !escrowAbi) {
      const error = new Error('Smart contracts not initialized');

      // Log initialization error
      logError(
        'Smart contracts not initialized for fulfill intent',
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

    if (!paymentProofInput || !intentHashInput) {
      const error = new Error('Missing required parameters for fulfilling intent');

      // Log validation error
      logError(
        'Missing required parameters for fulfill intent',
        ErrorCategory.VALIDATION_ERROR,
        {
          hasPaymentProof: !!paymentProofInput,
          hasIntentHash: !!intentHashInput,
        },
        correlationId
      );

      onError?.(error);
      return;
    }

    try {
      // First, simulate the transaction
      setSimulationStatus('simulating');
      setIsPreparingTransaction(true);

      // Create public client for simulation
      const currentChain = getDefaultChain();
      const publicClient = createPublicClient({
        chain: currentChain,
        transport: http(alchemyRpcUrl),
      });

      // Determine which account to use for simulation
      const simulationAccount = isSmartAccountEnabled && smartAccountAddress 
        ? smartAccountAddress 
        : loggedInEthereumAddress;

      if (!simulationAccount) {
        const error = new Error('No account available for simulation');
        
        // Log account error
        logError(
          'No account available for fulfill intent simulation',
          ErrorCategory.VALIDATION_ERROR,
          {
            isSmartAccountEnabled,
            hasSmartAccountAddress: !!smartAccountAddress,
            hasLoggedInEthereumAddress: !!loggedInEthereumAddress,
          },
          correlationId
        );

        onError?.(error);
        return;
      }

      try {
        const simulationResult = await simulateContract(publicClient, {
          address: escrowAddress as Address,
          abi: escrowAbi as any,
          functionName: 'fulfillIntent',
          args: [
            paymentProofInput as Hex,
            intentHashInput as Hex,
          ],
          account: simulationAccount as Address,
        });

        // Simulation successful
        setSimulationStatus('success');
        setIsWriteFulfillIntentSimulationSuccess(true);
      } catch (simulationError) {
        // Simulation failed
        setSimulationStatus('error');
        setIsWriteFulfillIntentSimulationSuccess(false);
        setPrepareFulfillIntentError(simulationError as Error);
        setIsWriteFulfillIntentPrepareError(true);
        setIsPreparingTransaction(false);

        // Log simulation error
        logError(
          'Fulfill intent simulation failed',
          ErrorCategory.CONTRACT_ERROR,
          {
            error: (simulationError as any)?.message || simulationError,
            errorStack: (simulationError as any)?.stack,
            errorCode: (simulationError as any)?.code,
            intentHash: intentHashInput,
            paymentProofLength: paymentProofInput?.length,
            contractAddress: escrowAddress,
            functionName: 'fulfillIntent',
            simulationAccount,
            accountType: isSmartAccountEnabled && smartAccountAddress ? 'smart' : 'eoa',
          },
          correlationId
        );

        onError?.(simulationError as Error);
        return;
      }

      // Proceed with transaction signing after successful simulation
      setSignFulfillIntentTransactionStatus('loading');

      const hash = await writeContractAsync({
        address: escrowAddress as Address,
        abi: escrowAbi as any,
        functionName: 'fulfillIntent',
        args: [
          paymentProofInput as Hex,
          intentHashInput as Hex,
        ],
      });

      if (hash) {
        return { hash };
      }
    } catch (error) {
      // Log unexpected errors that weren't caught by onError callback
      logError(
        'Unexpected error in fulfill intent execution',
        ErrorCategory.CONTRACT_ERROR,
        {
          error: (error as any)?.message || error,
          errorStack: (error as any)?.stack,
          intentHash: intentHashInput,
          stage: simulationStatusRef.current === 'success' ? 'execution' : 'preparation',
        },
        correlationId
      );

      // Error handling is done in the onError callback
    }
  }, [
    shouldConfigureFulfillIntentWrite,
    escrowAddress,
    escrowAbi,
    paymentProofInput,
    intentHashInput,
    writeContractAsync,
    onError,
    logError,
    correlationId,
    isSmartAccountEnabled,
    eip7702AuthorizationStatus,
    smartAccountAddress,
    loggedInEthereumAddress
  ]);

  // Build the config object for compatibility
  const writeFulfillIntentConfig = {
    address: escrowAddress,
    abi: escrowAbi,
    functionName: 'fulfillIntent',
    args: [paymentProofInput, intentHashInput],
  };

  return {
    writeFulfillIntentAsync,
    paymentProofInput,
    intentHashInput,
    setPaymentProofInput,
    setIntentHashInput,
    shouldConfigureFulfillIntentWrite,
    setShouldConfigureFulfillIntentWrite,
    prepareFulfillIntentError,
    isWriteFulfillIntentPrepareError,
    signFulfillIntentTransactionStatus,
    mineFulfillIntentTransactionStatus,
    isPreparingTransaction,
    isWriteFulfillIntentSimulationSuccess,
    writeFulfillIntentConfig,
    transactionHash,
    simulationStatus,
  };
};