import { useState, useEffect } from 'react';
import { CurrencyType, Currency } from '@helpers/types/currency';

interface CurrencyPricesState {
  prices: Record<CurrencyType, number | null>;
  loading: boolean;
  error: Error | null;
}

interface CachedCurrencyData {
  prices: Record<CurrencyType, number | null>;
  timestamp: number;
  baseCurrency: CurrencyType;
}

const CURRENCY_PRICE_API_KEY = import.meta.env.VITE_CURRENCY_PRICE_API_KEY || '';
const CACHE_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const CACHE_KEY = 'currencyPricesCache';

/**
 * Hook to fetch the current prices of multiple currencies relative to a base currency
 * Uses localStorage to cache results for 6 hours to minimize API calls
 * 
 * @param currencyCodes - Array of currency codes to get prices for
 * @param baseCurrency - The base currency to compare against (defaults to USD)
 * @returns Object containing prices map, loading state, and any error
 */
export function useCurrencyPrices(
  currencyCodes: CurrencyType[],
  baseCurrency: CurrencyType = Currency.USD
): CurrencyPricesState {
  /*
   * State
   */
  const [state, setState] = useState<CurrencyPricesState>({
    prices: currencyCodes.reduce((acc, code) => {
      acc[code] = null;
      return acc;
    }, {} as Record<CurrencyType, number | null>),
    loading: true,
    error: null,
  });

  /*
   * Helper Functions
   */

  // Get cached data from localStorage
  const getCachedData = (): CachedCurrencyData | null => {
    try {
      const cachedDataString = localStorage.getItem(CACHE_KEY);
      if (!cachedDataString) return null;

      const cachedData = JSON.parse(cachedDataString) as CachedCurrencyData;
      return cachedData;
    } catch (error) {
      console.error('Error retrieving cached currency data:', error);
      return null;
    }
  };

  // Save data to localStorage
  const saveToCache = (data: CachedCurrencyData): void => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving currency data to cache:', error);
    }
  };

  // Check if cache is valid (exists, has same base currency, and not expired)
  const isCacheValid = (cachedData: CachedCurrencyData | null): boolean => {
    if (!cachedData) return false;

    const now = Date.now();
    const isExpired = now - cachedData.timestamp > CACHE_DURATION_MS;
    const hasSameBaseCurrency = cachedData.baseCurrency === baseCurrency;

    return !isExpired && hasSameBaseCurrency;
  };

  /*
   * Hooks
   */
  useEffect(() => {
    const fetchCurrencyPrices = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Check cache first
        const cachedData = getCachedData();

        if (isCacheValid(cachedData)) {
          // Use cached data if valid
          const cachedPrices = cachedData!.prices;

          // Ensure all requested currencies are in the cached data
          const allCurrenciesInCache = currencyCodes.every(
            code => cachedPrices[code] !== undefined
          );

          if (allCurrenciesInCache) {
            setState({
              prices: cachedPrices,
              loading: false,
              error: null,
            });
            return;
          }
        }

        // If cache is invalid or missing currencies, fetch from API
        const response = await fetch(
          `https://v6.exchangerate-api.com/v6/${CURRENCY_PRICE_API_KEY}/latest/${baseCurrency}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch currency data: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.conversion_rates) {
          throw new Error('Currency rates not found in response');
        }

        // Initialize prices object with base currency having value 1
        const prices: Record<CurrencyType, number | null> = {
          ...currencyCodes.reduce((acc, code) => {
            // Set to null by default
            acc[code] = null;
            return acc;
          }, {} as Record<CurrencyType, number | null>)
        };

        // Fill in prices from API response
        currencyCodes.forEach(code => {
          // If it's the base currency, set to 1
          if (code === baseCurrency) {
            prices[code] = 1;
          }
          // Otherwise get from API response if available
          else if (data.conversion_rates[code] !== undefined) {
            prices[code] = data.conversion_rates[code];
          }
        });

        // Update state with new prices
        setState({
          prices,
          loading: false,
          error: null,
        });

        // Save to cache
        saveToCache({
          prices,
          timestamp: Date.now(),
          baseCurrency,
        });

      } catch (error) {
        setState(prev => ({
          prices: prev.prices,
          loading: false,
          error: error instanceof Error ? error : new Error('Unknown error occurred'),
        }));
      }
    };

    fetchCurrencyPrices();
  }, [currencyCodes, baseCurrency]);

  return state;
}

export default useCurrencyPrices;