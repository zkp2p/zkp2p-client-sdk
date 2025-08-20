import { useState, useCallback, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { ValidatePayeeDetailsRequest, ValidatePayeeDetailsResponse } from "@helpers/types/curator";

const API_URL = import.meta.env.VITE_CURATOR_API_URL || "";
const DEBOUNCE_DELAY = 1000; // 1000ms delay

export default function useValidatePayeeDetails() {
  /**
   * Context
   */
  const { getAccessToken } = usePrivy();

  /**
   * State
   */
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ValidatePayeeDetailsResponse | null>(null);
  const [debouncedRequest, setDebouncedRequest] = useState<ValidatePayeeDetailsRequest | null>(null);

  /**
   * Fetch
   */
  const fetchValidatePayeeDetails = useCallback((request: ValidatePayeeDetailsRequest) => {
    setIsLoading(true);
    setDebouncedRequest(request);
  }, []);

  useEffect(() => {
    if (!debouncedRequest) return;

    const timeoutId = setTimeout(async () => {
      try {
        const accessToken = await getAccessToken();
        const response = await fetch(`${API_URL}/v1/makers/validate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
          },
          body: JSON.stringify(debouncedRequest)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to validate payee details:", errorText);
          throw new Error(`Failed to validate: ${response.statusText}`);
        }

        const responseData: ValidatePayeeDetailsResponse = await response.json();
        setData(responseData);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [debouncedRequest, getAccessToken]);

  return {
    data,
    isLoading,
    error,
    fetchValidatePayeeDetails,
  };
}
