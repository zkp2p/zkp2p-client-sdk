import { useState, useEffect, useRef } from 'react';
import useLocalStorage from './useLocalStorage';

const DUNE_API_KEY = import.meta.env.VITE_DUNE_API_KEY;
const VOLUME_QUERIES = {
  'venmo': 4655009,
  'cashapp': 4643941,
  'revolut': 4643889,
  'wise': 4666857,
  'mercadopago': 4858643,
  'zelle': 5160711,
  'paypal': 5556255,
  'monzo': 5556266
} as const;
const LIQUIDITY_QUERY_ID = 4806602;

const CACHE_KEY = 'dune_volume_data';
const LIQUIDITY_CACHE_KEY = 'dune_liquidity_data';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const DEBOUNCE_DELAY = 1000; // 1 second debounce delay
const DUNE_API_URL = 'https://api.dune.com/api/v1/query';

type Platform = keyof typeof VOLUME_QUERIES;

interface CachedVolumeData {
  volumes: Record<Platform, number>;
  timestamp: number;
  day: string;
}

interface CachedLiquidityData {
  liquidities: Record<Platform, number>;
  timestamp: number;
  day: string;
}

interface DuneVolumeData {
  platformVolumes: Record<Platform, number>;
  platformLiquidities: Record<Platform, number>;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

interface DuneQueryResponse {
  result: {
    rows: Array<{
      daily_volume?: number;
      running_avg_daily_volume?: number;
      day: string;
      venmo_cumulative_liquidity?: number;
      cashapp_cumulative_liquidity?: number;
      wise_cumulative_liquidity?: number;
      revolut_cumulative_liquidity?: number;
      [key: string]: any;
    }>;
  };
}

export function useDuneVolume(): DuneVolumeData {
  const [platformVolumes, setPlatformVolumes] = useState<Record<Platform, number>>({
    venmo: 0,
    cashapp: 0,
    revolut: 0,
    wise: 0,
    mercadopago: 0,
    zelle: 0,
    paypal: 0,
    monzo: 0
  });
  const [platformLiquidities, setPlatformLiquidities] = useState<Record<Platform, number>>({
    venmo: 0,
    cashapp: 0,
    revolut: 0,
    wise: 0,
    mercadopago: 0,
    zelle: 0,
    paypal: 0,
    monzo: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [cachedData, setCachedData] = useLocalStorage<CachedVolumeData | null>(CACHE_KEY, null);
  const [cachedLiquidityData, setCachedLiquidityData] = useLocalStorage<CachedLiquidityData | null>(LIQUIDITY_CACHE_KEY, null);

  const fetchingRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef<boolean>(true);

  const fetchVolumes = async (force: boolean = false) => {
    if (fetchingRef.current) {
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    if (!force && cachedData &&
      cachedData.timestamp > Date.now() - CACHE_EXPIRY_MS &&
      cachedData.day === today) {
      setPlatformVolumes(cachedData.volumes);
      setIsLoading(false);
    }

    if (!force && cachedLiquidityData &&
      cachedLiquidityData.timestamp > Date.now() - CACHE_EXPIRY_MS &&
      cachedLiquidityData.day === today) {
      setPlatformLiquidities(cachedLiquidityData.liquidities);
      setIsLoading(false);

      // If both volume and liquidity data are cached and valid, return early
      if (cachedData &&
        cachedData.timestamp > Date.now() - CACHE_EXPIRY_MS &&
        cachedData.day === today) {
        return;
      }
    }

    if (!DUNE_API_KEY) {
      setError(new Error('Dune API key not found'));
      setIsLoading(false);
      return;
    }

    try {
      fetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      const newVolumes: Record<Platform, number> = {
        venmo: 0,
        cashapp: 0,
        revolut: 0,
        wise: 0,
        mercadopago: 0,
        zelle: 0,
        paypal: 0,
        monzo: 0
      };

      // Fetch data for each platform volume
      await Promise.all(
        Object.entries(VOLUME_QUERIES).map(async ([platform, queryId]) => {
          const queryParams = new URLSearchParams({
            limit: '1',
            columns: "day,running_avg_daily_volume",
          });

          const options = {
            method: 'GET',
            headers: {
              'X-DUNE-API-KEY': DUNE_API_KEY
            }
          };

          const url = `${DUNE_API_URL}/${queryId}/results?${queryParams}`;
          const response = await fetch(url, options);

          if (!response.ok) {
            throw new Error(`HTTP error for ${platform}! status: ${response.status}`);
          }

          const data = await response.json() as DuneQueryResponse;

          if (data?.result?.rows?.[0]) {
            newVolumes[platform as Platform] = Number(data.result.rows[0].running_avg_daily_volume) || 0;
          }
        })
      );

      // Fetch liquidity data
      const newLiquidities: Record<Platform, number> = {
        venmo: 0,
        cashapp: 0,
        revolut: 0,
        wise: 0,
        mercadopago: 0,
        zelle: 0,
        paypal: 0,
        monzo: 0
      };

      const liquidityQueryParams = new URLSearchParams({
        limit: '1',
        columns: "day,venmo_cumulative_liquidity,cashapp_cumulative_liquidity,wise_cumulative_liquidity,revolut_cumulative_liquidity,mercadopago_cumulative_liquidity,zelle_cumulative_liquidity,paypal_cumulative_liquidity,monzo_cumulative_liquidity",
      });

      const liquidityOptions = {
        method: 'GET',
        headers: {
          'X-DUNE-API-KEY': DUNE_API_KEY
        }
      };

      const liquidityUrl = `${DUNE_API_URL}/${LIQUIDITY_QUERY_ID}/results?${liquidityQueryParams}`;
      const liquidityResponse = await fetch(liquidityUrl, liquidityOptions);

      if (!liquidityResponse.ok) {
        throw new Error(`HTTP error for liquidity! status: ${liquidityResponse.status}`);
      }

      const liquidityData = await liquidityResponse.json() as DuneQueryResponse;

      if (liquidityData?.result?.rows?.[0]) {
        const row = liquidityData.result.rows[0];
        newLiquidities.venmo = Number(row.venmo_cumulative_liquidity) || 0;
        newLiquidities.cashapp = Number(row.cashapp_cumulative_liquidity) || 0;
        newLiquidities.wise = Number(row.wise_cumulative_liquidity) || 0;
        newLiquidities.revolut = Number(row.revolut_cumulative_liquidity) || 0;
        newLiquidities.mercadopago = Number(row.mercadopago_cumulative_liquidity) || 0;
        newLiquidities.zelle = Number(row.zelle_cumulative_liquidity) || 0;
        newLiquidities.paypal = Number(row.paypal_cumulative_liquidity) || 0;
        newLiquidities.monzo = Number(row.monzo_cumulative_liquidity) || 0;
      }

      if (!mountedRef.current) return;

      setPlatformVolumes(newVolumes);
      setPlatformLiquidities(newLiquidities);

      setCachedData({
        volumes: newVolumes,
        timestamp: Date.now(),
        day: today
      });

      setCachedLiquidityData({
        liquidities: newLiquidities,
        timestamp: Date.now(),
        day: today
      });

    } catch (err) {
      if (!mountedRef.current) return;

      if (cachedData && cachedData.day === today) {
        setPlatformVolumes(cachedData.volumes);
      }

      if (cachedLiquidityData && cachedLiquidityData.day === today) {
        setPlatformLiquidities(cachedLiquidityData.liquidities);
      }

      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      fetchingRef.current = false;
    }
  };

  const debouncedRefresh = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchVolumes(true);
    }, DEBOUNCE_DELAY);
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchVolumes();

    return () => {
      mountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);


  return {
    platformVolumes,
    platformLiquidities,
    isLoading,
    error,
    refresh: debouncedRefresh
  };
} 