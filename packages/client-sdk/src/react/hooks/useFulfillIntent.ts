import { useState, useCallback } from 'react';
import type { Zkp2pClient } from '../../client/Zkp2pClient';
import type { FulfillIntentParams } from '../../types';
import type { Hash } from 'viem';

export interface UseFulfillIntentOptions {
  client: Zkp2pClient | null;
  onSuccess?: (txHash: Hash) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for fulfilling intents with proof on the ZKP2P protocol
 * 
 * @example
 * ```tsx
 * const { fulfillIntent, isLoading, error, txHash } = useFulfillIntent({ 
 *   client,
 *   onSuccess: (hash) => console.log('Intent fulfilled:', hash),
 * });
 * 
 * // Fulfill an intent with proof
 * await fulfillIntent({ 
 *   intentHash: '0x123...',
 *   proofBytes: '0xabc...',
 * });
 * ```
 */
export function useFulfillIntent({ client, onSuccess, onError }: UseFulfillIntentOptions) {
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fulfillIntent = useCallback(
    async (params: FulfillIntentParams) => {
      if (!client) {
        const err = new Error('Client not initialized');
        setError(err);
        onError?.(err);
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const hash = await client.fulfillIntent(params);
        setTxHash(hash);
        onSuccess?.(hash);
        return hash;
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
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    fulfillIntent,
    txHash,
    isLoading,
    error,
    reset,
  };
}