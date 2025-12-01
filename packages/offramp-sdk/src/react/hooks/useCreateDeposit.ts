import { useState, useCallback, useMemo } from 'react';
import type { Zkp2pClient } from '../../client/Zkp2pClient';
import type { Hash } from 'viem';

export interface UseCreateDepositOptions {
  client: Zkp2pClient | null;
  onSuccess?: (result: { hash: Hash; depositDetails: Array<{ processorName: string; depositData: Record<string, string> }> }) => void;
  onError?: (error: Error) => void;
}

export function useCreateDeposit({ client, onSuccess, onError }: UseCreateDepositOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [depositDetails, setDepositDetails] = useState<Array<{ processorName: string; depositData: Record<string, string> }> | null>(null);

  const createDeposit = useCallback(
    async (params: Parameters<Zkp2pClient['createDeposit']>[0]) => {
      if (!client) {
        const err = new Error('Zkp2pClient is not initialized');
        setError(err);
        onError?.(err);
        return null;
      }

      setIsLoading(true);
      setError(null);
      setTxHash(null);
      setDepositDetails(null);

      try {
        const result = await client.createDeposit(params);
        setTxHash(result.hash as Hash);
        setDepositDetails(result.depositDetails);
        onSuccess?.(result);
        return result as any;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        onError?.(e);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [client, onSuccess, onError]
  );

  return useMemo(() => ({ createDeposit, isLoading, error, txHash, depositDetails }), [createDeposit, isLoading, error, txHash, depositDetails]);
}
