import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Intent } from "@helpers/types/curator";
import useLocalStorage from "@hooks/useLocalStorage";

const API_URL = import.meta.env.VITE_CURATOR_API_URL || "";

// Default refresh interval is 4 hours
const DEFAULT_REFRESH_INTERVAL = 14400000;

interface CachedIntentsData {
  intents: Intent[];
  timestamp: number;
  owner: string;
}

interface UseGetOwnerIntentsOptions {
  refreshInterval?: number;
}

interface UseGetOwnerIntentsReturn {
  data: Intent[] | null;
  isLoading: boolean;
  error: Error | null;
  fetchOwnerIntents: (ownerAddress: string, forceRefresh?: boolean) => Promise<void>;
  isCacheValid: (ownerAddress: string) => boolean;
  lastFetchTime: number | null;
}

export default function useGetOwnerIntents(options?: UseGetOwnerIntentsOptions): UseGetOwnerIntentsReturn {
  /**
   * Context
   */
  const { getAccessToken } = usePrivy();

  /**
   * State
   */
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<Intent[] | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  // Local storage for intents and refresh interval
  const [cachedData, setCachedData] = useLocalStorage<CachedIntentsData | null>('cached_intents', null);
  const [refreshInterval, setRefreshInterval] = useLocalStorage<number>(
    'intents_refresh_interval',
    options?.refreshInterval || DEFAULT_REFRESH_INTERVAL
  );

  /**
   * Helper function to convert date strings to Date objects
   */
  const convertDatesToObjects = (intent: any): Intent => {
    return {
      ...intent,
      signalTimestamp: new Date(intent.signalTimestamp),
      fulfillTimestamp: intent.fulfillTimestamp ? new Date(intent.fulfillTimestamp) : null,
      prunedTimestamp: intent.prunedTimestamp ? new Date(intent.prunedTimestamp) : null,
      createdAt: new Date(intent.createdAt),
      updatedAt: new Date(intent.updatedAt)
    };
  };

  /**
   * Check if cached data is still valid for the given owner
   */
  const isCacheValid = useCallback((ownerAddress: string) => {
    if (!cachedData || cachedData.owner !== ownerAddress) return false;
    const now = Date.now();
    return now - cachedData.timestamp < refreshInterval;
  }, [cachedData, refreshInterval]);

  /**
   * Transform and set data
   */
  const setTransformedData = useCallback((intents: any[]) => {
    const transformedIntents = intents.map(convertDatesToObjects);
    setData(transformedIntents);
    return transformedIntents;
  }, []);

  /**
   * Fetch owner intents
   */
  const fetchOwnerIntents = useCallback(async (ownerAddress: string, forceRefresh?: boolean) => {
    // If we have valid cached data for this owner and aren't forcing a refresh, use it
    if (!forceRefresh && isCacheValid(ownerAddress) && cachedData) {
      // Transform dates from cached data
      setTransformedData(cachedData.intents);
      setLastFetchTime(cachedData.timestamp);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch(`${API_URL}/v1/orders/maker/${ownerAddress}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch owner intents:", errorText);
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const responseData = await response.json();
      const intents = responseData.responseObject;

      // Transform and update both state and cache
      const transformedIntents = setTransformedData(intents);
      setCachedData({
        intents: transformedIntents,
        timestamp: Date.now(),
        owner: ownerAddress
      });
      setLastFetchTime(Date.now());
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, isCacheValid, setCachedData, setTransformedData]);

  return {
    data,
    isLoading,
    error,
    fetchOwnerIntents,
    isCacheValid,
    lastFetchTime,
  };
} 