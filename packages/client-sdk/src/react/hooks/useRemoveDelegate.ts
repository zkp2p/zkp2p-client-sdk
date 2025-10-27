import { useState, useCallback, useMemo } from 'react';
import type { Zkp2pClient } from '../../client/Zkp2pClient';
import type { Hash } from 'viem';

export interface UseRemoveDelegateOptions {
  client: Zkp2pClient | null;
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export function useRemoveDelegate({ client, onSuccess, onError }: UseRemoveDelegateOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<Hash | null>(null);

  const removeDelegate = useCallback(
    async (params: Parameters<Zkp2pClient['removeDelegate']>[0]) => {
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
        const hash = await client.removeDelegate(params);
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

  return useMemo(() => ({ removeDelegate, isLoading, error, txHash }), [removeDelegate, isLoading, error, txHash]);
}

