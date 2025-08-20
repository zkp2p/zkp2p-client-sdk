import { useCallback } from 'react';

// Define the structure of quote data we want to store
export interface QuoteData {
  // Add intentHash to the interface
  intentHash?: string;  // Optional for backward compatibility

  // USDC amounts
  usdcAmount: string;
  fiatAmount: string;
  fiatCurrency: string;

  // Token info
  token: string;
  tokenAmount?: string;

  // Recipient info
  recipientAddress: string;

  // Conversion details
  outputTokenAmount?: string;
  outputTokenDecimals?: number;
  outputTokenAmountInUsd?: string;
  usdcToFiatRate?: string;
  usdcToTokenRate?: string;

  // Fee info
  gasFeesInUsd?: string;
  appFeeInUsd?: string;
  relayerFeeInUsd?: string;
  relayerGasFeesInUsd?: string;
  relayerServiceFeesInUsd?: string;

  // Time estimates
  timeEstimate?: string;

  // Payment platform
  paymentPlatform: string;
  paymentMethod?: number;
}

const QUOTE_STORAGE_PREFIX = 'quote_data_';

interface UseQuoteStorageReturn {
  saveQuoteData: (address: string, intentHash: string, data: QuoteData) => void;
  getQuoteData: (address: string) => QuoteData | null;
  clearQuoteData: (address: string) => void;
  updateQuoteDataPaymentMethod: (address: string, paymentMethod: number) => void;
}

/**
 * Hook for managing swap quote data in localStorage
 * @returns Object with methods to save, retrieve, update, and clear quote data
 */
export default function useQuoteStorage(): UseQuoteStorageReturn {
  // Save quote data to localStorage
  const saveQuoteData = useCallback((address: string, intentHash: string, data: QuoteData) => {
    if (!address) return;

    try {
      // Include intentHash in the data
      const dataWithHash = { ...data, intentHash };
      localStorage.setItem(
        `${QUOTE_STORAGE_PREFIX}${address}`,
        JSON.stringify(dataWithHash)
      );
    } catch (error) {
      console.error('Failed to save quote data to localStorage:', error);
    }
  }, []);

  // Get quote data from localStorage
  const getQuoteData = useCallback((address: string): QuoteData | null => {
    if (!address) return null;

    try {
      const data = localStorage.getItem(`${QUOTE_STORAGE_PREFIX}${address}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to retrieve quote data from localStorage:', error);
      return null;
    }
  }, []);

  // Clear quote data from localStorage
  const clearQuoteData = useCallback((address: string) => {
    if (!address) return;

    try {
      localStorage.removeItem(`${QUOTE_STORAGE_PREFIX}${address}`);
    } catch (error) {
      console.error('Failed to clear quote data from localStorage:', error);
    }
  }, []);

  // Update payment method
  const updateQuoteDataPaymentMethod = useCallback((address: string, paymentMethod: number) => {
    if (!address) return;

    const currentData = getQuoteData(address);
    if (!currentData) return;

    currentData.paymentMethod = paymentMethod;

    // Preserve the intentHash when updating
    saveQuoteData(address, currentData.intentHash || '', currentData);
  }, [getQuoteData, saveQuoteData]);

  return {
    saveQuoteData,
    getQuoteData,
    clearQuoteData,
    updateQuoteDataPaymentMethod
  };
} 