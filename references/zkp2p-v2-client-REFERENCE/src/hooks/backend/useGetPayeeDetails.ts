import { PaymentPlatformType } from "@helpers/types";
import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { GetPayeeDetailsResponse } from "@helpers/types";
import { ErrorCategory } from "@helpers/types/errors";
import { useErrorLogger } from "@hooks/useErrorLogger";

const API_URL = import.meta.env.VITE_CURATOR_API_URL || "";

export default function usePayeeDetails() {
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
  const [data, setData] = useState<GetPayeeDetailsResponse | null>(null);

  /**
   * Fetch
   */
  const fetchPayeeDetails = useCallback(async (hashedOnchainId: string, platform: PaymentPlatformType) => {
    setIsLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch(`${API_URL}/v1/makers/${platform}/${hashedOnchainId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch payee details:", errorText);
        
        // Log error using useErrorLogger
        logError(
          'Get payee details failed',
          ErrorCategory.API_ERROR,
          {
            url: `${API_URL}/v1/makers/${platform}/${hashedOnchainId}`,
            method: 'GET',
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText,
            platform,
            // Hash the onchain ID to avoid logging PII
            hashedOnchainIdLength: hashedOnchainId?.length,
            hasAccessToken: !!accessToken,
            apiUrl: API_URL || 'not configured',
          }
        );
        
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const responseData: GetPayeeDetailsResponse = await response.json();

      setData(responseData);
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
    fetchPayeeDetails
  };
}
