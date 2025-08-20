import { useState, useCallback } from 'react';
import { usePrivy } from "@privy-io/react-auth";
import { IntentStats, IntentStatsRequest, IntentStatsResponse } from '@helpers/types/curator';

const API_URL = import.meta.env.VITE_CURATOR_API_URL || "";


interface UseGetIntentStatsReturn {
  intentStats: IntentStats[] | null;
  isLoading: boolean;
  error: Error | null;
  fetchIntentStats: (payload: IntentStatsRequest) => Promise<void>;
}


export default function useGetIntentStats(): UseGetIntentStatsReturn {
  const { getAccessToken } = usePrivy();

  const [intentStats, setIntentStats] = useState<IntentStats[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchIntentStats = useCallback(async (payload: IntentStatsRequest) => {
    setIsLoading(true);
    setError(null);
    setIntentStats(null); // Reset previous stats

    try {
      const accessToken = await getAccessToken();
      const response = await fetch(`${API_URL}/v1/deposits/order-stats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch intent stats:", errorText);
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const responseData: IntentStatsResponse = await response.json();
      console.log('responseData', responseData);

      if (responseData && responseData.responseObject) {
        console.log('responseData', responseData.responseObject);
        setIntentStats(responseData.responseObject);
      } else {
        setIntentStats([]);
      }
    } catch (e) {
      setError(e as Error);
      setIntentStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  return { intentStats, isLoading, error, fetchIntentStats };
} 