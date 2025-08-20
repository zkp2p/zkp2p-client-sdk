import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Deposit, DepositStatus } from "@helpers/types/curator";
import debounce from "lodash/debounce";

const API_URL = import.meta.env.VITE_CURATOR_API_URL || "";
const OWNER_DEPOSITS_FETCHING_DEBOUNCE_MS = 500;

interface UseGetOwnerDepositsReturn {
  data: Deposit[] | null;
  isLoading: boolean;
  error: Error | null;
  fetchOwnerDeposits: (ownerAddress: string, options?: { status?: DepositStatus }) => Promise<void>;
}

export default function useGetOwnerDeposits(): UseGetOwnerDepositsReturn {
  /**
   * Context
   */
  const { getAccessToken } = usePrivy();

  /**
   * State
   */
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<Deposit[] | null>(null);

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
   * Fetch owner deposits
   */
  const fetchOwnerDepositsImpl = useCallback(async (ownerAddress: string, options?: { status?: DepositStatus }) => {
    setIsLoading(true);
    setError(null);


    try {
      const accessToken = await getAccessToken();
      const response = await fetch(`${API_URL}/v1/deposits/maker/${ownerAddress}?status=${options?.status}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch owner deposits:", errorText);
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const responseData = await response.json();
      const deposits = responseData.responseObject;

      // Transform dates for each deposit
      const transformedDeposits = deposits.map(convertDatesToObjects);
      setData(transformedDeposits);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  const fetchOwnerDeposits = useCallback(
    debounce<(...args: any[]) => Promise<void>>(
      (ownerAddress: string, options?: { status?: DepositStatus }) => {
        return fetchOwnerDepositsImpl(ownerAddress, options);
      },
      OWNER_DEPOSITS_FETCHING_DEBOUNCE_MS,
      { leading: true }
    ),
    [fetchOwnerDepositsImpl]
  );

  return {
    data,
    isLoading,
    error,
    fetchOwnerDeposits
  };
}
