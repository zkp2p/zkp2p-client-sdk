import { useState, useCallback, useMemo, useRef } from "react";
import debounce from "lodash/debounce";
import { QuoteMaxTokenForFiatRequest, QuoteResponse } from "@helpers/types/curator";
import { ErrorCategory } from "@helpers/types/errors";
import { useErrorLogger } from "@hooks/useErrorLogger";

const API_URL = import.meta.env.VITE_CURATOR_API_URL || "";

const QUOTE_FETCHING_DEBOUNCE_MS = 500;

export default function useQuoteMaxTokenForExactFiat() {
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
   * Use ref to maintain stable reference to the implementation
   */
  const fetchQuoteImplRef = useRef<(requestData: QuoteMaxTokenForFiatRequest, quotesToReturn: number) => Promise<void>>(null!);

  /**
   * Fetch implementation
   */
  fetchQuoteImplRef.current = async (requestData: QuoteMaxTokenForFiatRequest, quotesToReturn: number = 5) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/v1/quote/exact-fiat?quotesToReturn=${quotesToReturn}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch quoteMaxTokenForExactFiat:", errorText);
        
        // Log error using useErrorLogger
        logError(
          'Quote max token for fiat failed',
          ErrorCategory.API_ERROR,
          {
            url: `${API_URL}/v1/quote/exact-fiat?quotesToReturn=${quotesToReturn}`,
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
              exactFiatAmount: requestData.exactFiatAmount,
            },
            quotesToReturn,
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
  };

  /**
   * Create stable debounced function
   */
  const fetchQuote = useMemo(
    () => debounce((requestData: QuoteMaxTokenForFiatRequest, quotesToReturn: number = 5) => {
      fetchQuoteImplRef.current?.(requestData, quotesToReturn);
    }, QUOTE_FETCHING_DEBOUNCE_MS),
    []
  );

  return {
    data,
    isLoading,
    error,
    fetchQuote
  };
}
