import { useState, useCallback } from "react";
import { PostDepositDetailsRequest, PostDepositDetailsResponse } from "@helpers/types";
import { usePrivy } from "@privy-io/react-auth";

const API_URL = import.meta.env.VITE_CURATOR_API_URL || "";

export default function usePostDepositDetails() {
  /**
   * Context
   */
  const { getAccessToken } = usePrivy();

  /**
   * State
   */
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Post deposit details
   */
  const postDepositDetails = useCallback(async (request: PostDepositDetailsRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch(`${API_URL}/v1/makers/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to post deposit details:", errorText);
        throw new Error(`Failed to post: ${response.statusText}`);
      }

      const responseData: PostDepositDetailsResponse = await response.json();
      return responseData;

    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    postDepositDetails,
  };
}
