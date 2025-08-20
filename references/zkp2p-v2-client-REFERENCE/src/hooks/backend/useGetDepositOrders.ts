import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Intent } from "@helpers/types/curator";
import debounce from "lodash/debounce";

const API_URL = import.meta.env.VITE_CURATOR_API_URL || "";
const DEPOSIT_ORDERS_FETCHING_DEBOUNCE_MS = 500;

interface UseGetDepositOrdersReturn {
  data: Intent[] | null;
  isLoading: boolean;
  error: Error | null;
  fetchDepositOrders: (depositId: string) => Promise<void>;
}

export default function useGetDepositOrders(): UseGetDepositOrdersReturn {
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
   * Fetch deposit orders
   */
  const fetchDepositOrdersImpl = useCallback(async (depositId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch(`${API_URL}/v1/orders/deposit/${depositId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch deposit orders:", errorText);
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const responseData = await response.json();
      const orders = responseData.responseObject;

      // Transform dates
      const transformedOrders = orders.map(convertDatesToObjects);
      setData(transformedOrders);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  const fetchDepositOrders = useCallback(
    debounce<(...args: any[]) => Promise<void>>(
      (depositId: string) => {
        return fetchDepositOrdersImpl(depositId);
      },
      DEPOSIT_ORDERS_FETCHING_DEBOUNCE_MS,
      { leading: true }
    ),
    [fetchDepositOrdersImpl]
  );

  return {
    data,
    isLoading,
    error,
    fetchDepositOrders
  };
}
