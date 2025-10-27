import { useState, useCallback, useMemo } from 'react';
import type { Zkp2pClient } from '../../client/Zkp2pClient';
import type { Hash } from 'viem';

export interface UseAddCurrenciesOptions {
  client: Zkp2pClient | null;
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export function useAddCurrencies({ client, onSuccess, onError }: UseAddCurrenciesOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<Hash | null>(null);

  const addCurrencies = useCallback(
    async (params: Parameters<Zkp2pClient['addCurrencies']>[0]) => {
      if (!client) {
        const err = new Error('Zkp2pClient is not initialized');
        setError(err);
        onError?.(err);
        return null;
      }
      setIsLoading(true);
      setError(null);
      setTxHash(null);
      try {
        const hash = await client.addCurrencies(params);
        setTxHash(hash);
        onSuccess?.(hash);
        return hash;
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

  return useMemo(() => ({ addCurrencies, isLoading, error, txHash }), [addCurrencies, isLoading, error, txHash]);
}

