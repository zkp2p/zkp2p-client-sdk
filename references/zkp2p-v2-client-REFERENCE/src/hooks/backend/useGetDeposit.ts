import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Deposit, DepositResponse } from "@helpers/types/curator";
import debounce from "lodash/debounce";

const API_URL = import.meta.env.VITE_CURATOR_API_URL || "";
const DEPOSIT_FETCHING_DEBOUNCE_MS = 500;

interface UseGetDepositReturn {
  data: Deposit | null;
  isLoading: boolean;
  error: Error | null;
  fetchDeposit: (depositId: string) => Promise<void>;
}

export default function useGetDeposit(): UseGetDepositReturn {
  /**
   * Context
   */
  const { getAccessToken } = usePrivy();

  /**
   * State
   */
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<Deposit | null>(null);

  /**
   * Helper function to convert date strings to Date objects
   */
  const convertDatesToObjects = (deposit: any): Deposit => {
    return {
      ...deposit,
      createdAt: deposit.createdAt ? new Date(deposit.createdAt) : undefined,
      updatedAt: deposit.updatedAt ? new Date(deposit.updatedAt) : undefined,
      verifiers: deposit.verifiers.map((verifier: any) => ({
        ...verifier,
        createdAt: verifier.createdAt ? new Date(verifier.createdAt) : undefined,
        updatedAt: verifier.updatedAt ? new Date(verifier.updatedAt) : undefined,
        currencies: verifier.currencies.map((currency: any) => ({
          ...currency,
          createdAt: currency.createdAt ? new Date(currency.createdAt) : undefined,
          updatedAt: currency.updatedAt ? new Date(currency.updatedAt) : undefined,
        }))
      }))
    };
  };

  /**
   * Fetch deposit
   */
  const fetchDepositImpl = useCallback(async (depositId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch(`${API_URL}/v1/deposits/${depositId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch deposit:", errorText);
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const responseData: DepositResponse = await response.json();
      const deposit = responseData.responseObject;

      // Transform dates
      const transformedDeposit = convertDatesToObjects(deposit);
      setData(transformedDeposit);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  const fetchDeposit = useCallback(
    debounce<(...args: any[]) => Promise<void>>(
      (depositId: string) => {
        return fetchDepositImpl(depositId);
      },
      DEPOSIT_FETCHING_DEBOUNCE_MS,
      { leading: true }
    ),
    [fetchDepositImpl]
  );

  return {
    data,
    isLoading,
    error,
    fetchDeposit
  };
}
