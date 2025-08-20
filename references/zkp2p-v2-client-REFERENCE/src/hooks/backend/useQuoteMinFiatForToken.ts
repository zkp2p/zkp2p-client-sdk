import { useState, useCallback } from "react";
import { QuoteMinFiatForTokenRequest, QuoteResponse } from "@helpers/types";
import { ErrorCategory } from "@helpers/types/errors";
import { useErrorLogger } from "@hooks/useErrorLogger";

const API_URL = import.meta.env.VITE_CURATOR_API_URL || "";

export default function useQuoteMinFiatForToken() {
  /**
   * Context
   */
  const { logError } = useErrorLogger();

  /**
   * State
   */
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<QuoteResponse | null>(null);

  /**
   * Fetch
   */
  const fetchQuote = useCallback(async (requestData: QuoteMinFiatForTokenRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/v1/quote/exact-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch quoteMinFiatForToken:", errorText);
        
        // Log error using useErrorLogger
        logError(
          'Quote min fiat for token failed',
          ErrorCategory.API_ERROR,
          {
            url: `${API_URL}/v1/quote/exact-token`,
            method: 'POST',
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText,
            apiUrl: API_URL || 'not configured',
            requestData: {
              paymentPlatforms: requestData.paymentPlatforms,
              fiatCurrency: requestData.fiatCurrency,
              // Sanitize PII - only log necessary fields
              destinationChainId: requestData.destinationChainId,
              destinationToken: requestData.destinationToken,
              useMultihop: requestData.useMultihop,
              exactTokenAmount: requestData.exactTokenAmount,
            }
          }
        );
        
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const jsonResponse = await response.json() as QuoteResponse;

      setData(jsonResponse);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [logError]);

  return {
    data,
    isLoading,
    error,
    fetchQuote
  };
}
