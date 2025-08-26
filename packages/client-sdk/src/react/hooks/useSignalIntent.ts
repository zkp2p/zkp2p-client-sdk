import { useState, useCallback } from 'react';
import type { Zkp2pClient } from '../../client/Zkp2pClient';
import type { SignalIntentParams, SignalIntentResponse } from '../../types';

export interface UseSignalIntentOptions {
  client: Zkp2pClient | null;
  onSuccess?: (response: SignalIntentResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for signaling intents on the ZKP2P protocol
 * 
 * @example
 * ```tsx
 * const { signalIntent, isLoading, error } = useSignalIntent({ 
 *   client,
 *   onSuccess: (response) => console.log('Intent signaled:', response),
 * });
 * 
 * // Signal an intent
 * await signalIntent({ 
 *   depositId: '123',
 *   amount: BigInt('1000000'),
 *   payeeDetails: 'user@example.com',
 * });
 * ```
 */
export function useSignalIntent({ client, onSuccess, onError }: UseSignalIntentOptions) {
  const [response, setResponse] = useState<SignalIntentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const signalIntent = useCallback(
    async (params: SignalIntentParams) => {
      if (!client) {
        const err = new Error('Client not initialized');
        setError(err);
        onError?.(err);
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const intentResponse = await client.signalIntent(params);
        setResponse(intentResponse);
        onSuccess?.(intentResponse);
        return intentResponse;
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
    setResponse(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    signalIntent,
    response,
    isLoading,
    error,
    reset,
  };
}