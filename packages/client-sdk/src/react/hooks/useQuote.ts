import { useState, useCallback } from 'react';
import type { Zkp2pClient } from '../../client/Zkp2pClient';
import type { QuoteRequest, QuoteResponse } from '../../types';

export interface UseQuoteOptions {
  client: Zkp2pClient | null;
  onSuccess?: (quote: QuoteResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for fetching quotes from the ZKP2P protocol
 * 
 * @example
 * ```tsx
 * const { fetchQuote, quote, isLoading, error } = useQuote({ 
 *   client,
 *   onSuccess: (quote) => console.log('Quote received:', quote),
 * });
 * 
 * // Fetch a quote
 * await fetchQuote({ 
 *   amount: '100',
 *   currency: 'USD',
 *   paymentPlatform: 'venmo',
 * });
 * ```
 */
export function useQuote({ client, onSuccess, onError }: UseQuoteOptions) {
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuote = useCallback(
    async (request: QuoteRequest) => {
      if (!client) {
        const err = new Error('Client not initialized');
        setError(err);
        onError?.(err);
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const quoteResponse = await client.getQuote(request);
        setQuote(quoteResponse);
        onSuccess?.(quoteResponse);
        return quoteResponse;
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
    setQuote(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    fetchQuote,
    quote,
    isLoading,
    error,
    reset,
  };
}