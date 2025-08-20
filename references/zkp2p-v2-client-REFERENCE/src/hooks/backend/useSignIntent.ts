import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { IntentSignalRequest, SignalIntentResponse } from "@helpers/types";
import { ErrorCategory } from "@helpers/types/errors";
import { useErrorLogger } from "@hooks/useErrorLogger";

const API_URL = import.meta.env.VITE_CURATOR_API_URL || "";

if (!API_URL) {
  console.error("VITE_CURATOR_API_URL is not set. Please check your environment variables.");
}

export default function useSignIntent() {

  /**
   * Context
   */
  const { getAccessToken } = usePrivy();
  const { logError } = useErrorLogger();

  /**
   * State
   */
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<SignalIntentResponse | null>(null);

  /**
   * Fetch
   */
  const fetchSignedIntent = useCallback(async (requestData: IntentSignalRequest) => {
    setIsLoading(true);
    setError(null);
    setData(null); // Clear previous data to prevent stale responses

    try {
      const accessToken = await getAccessToken();
      
      if (!accessToken) {
        console.error("No access token available. User may not be authenticated.");
        throw new Error("Authentication required");
      }

      const url = `${API_URL}/v1/verify/intent`;
      console.log("Fetching signed intent from:", url, "with data:", requestData);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch signalIntent:", errorText);
        
        // Log error using useErrorLogger
        logError(
          'Signal intent failed',
          ErrorCategory.API_ERROR,
          {
            url: `${API_URL}/v1/verify/intent`,
            method: 'POST',
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText,
            hasAccessToken: !!accessToken,
            apiUrl: API_URL || 'not configured',
            requestData: {
              processorName: requestData.processorName,
              depositId: requestData.depositId,
              tokenAmount: requestData.tokenAmount,
              // Sanitize PII - don't log full payee details or address
              payeeDetailsType: typeof requestData.payeeDetails,
              hasToAddress: !!requestData.toAddress,
              fiatCurrencyCode: requestData.fiatCurrencyCode,
              chainId: requestData.chainId,
            }
          }
        );
        
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const jsonResponse = await response.json() as SignalIntentResponse;

      setData(jsonResponse);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, logError]);

  return {
    data,
    isLoading,
    error,
    fetchSignedIntent
  };
}