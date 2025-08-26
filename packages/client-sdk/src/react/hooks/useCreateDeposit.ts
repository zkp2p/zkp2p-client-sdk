import { useState, useCallback } from 'react';
import type { Zkp2pClient } from '../../client/Zkp2pClient';
import type { CreateDepositParams, PostDepositDetailsRequest } from '../../types';
import type { Hash } from 'viem';

export interface UseCreateDepositOptions {
  client: Zkp2pClient | null;
  onSuccess?: (result: { hash: Hash; depositDetails: PostDepositDetailsRequest[] }) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for creating deposits on the ZKP2P protocol
 * 
 * @example
 * ```tsx
 * const { createDeposit, isLoading, error, txHash, depositDetails } = useCreateDeposit({ 
 *   client,
 *   onSuccess: ({ hash, depositDetails }) => console.log('Deposit created:', hash),
 * });
 * 
 * // Create a deposit
 * await createDeposit({ 
 *   amount: BigInt('1000000'), // 1 USDC
 *   paymentPlatform: 'venmo',
 *   conversionRate: { 
 *     raw: BigInt('1000000'),
 *     float: 1.0,
 *   },
 * });
 * ```
 */
export function useCreateDeposit({ client, onSuccess, onError }: UseCreateDepositOptions) {
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [depositDetails, setDepositDetails] = useState<PostDepositDetailsRequest[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createDeposit = useCallback(
    async (params: CreateDepositParams) => {
      if (!client) {
        const err = new Error('Client not initialized');
        setError(err);
        onError?.(err);
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await client.createDeposit(params);
        setTxHash(result.hash);
        setDepositDetails(result.depositDetails);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [client, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setTxHash(null);
    setDepositDetails(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    createDeposit,
    txHash,
    depositDetails,
    isLoading,
    error,
    reset,
  };
}