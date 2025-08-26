import { useState, useEffect, useMemo } from 'react';
import { Zkp2pClient } from '../../client/Zkp2pClient';
import type { Zkp2pClientOptions } from '../../types';
import type { WalletClient } from 'viem';

export interface UseZkp2pClientOptions extends Omit<Zkp2pClientOptions, 'walletClient'> {
  walletClient?: WalletClient;
}

/**
 * Hook to create and manage a Zkp2pClient instance
 * 
 * @example
 * ```tsx
 * const { client, isInitialized, error } = useZkp2pClient({
 *   walletClient,
 *   apiKey: 'YOUR_API_KEY',
 *   chainId: 8453, // Base mainnet
 * });
 * ```
 */
export function useZkp2pClient(options: UseZkp2pClientOptions) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const client = useMemo(() => {
    if (!options.walletClient) {
      return null;
    }

    try {
      const zkp2pClient = new Zkp2pClient({
        ...options,
        walletClient: options.walletClient,
      } as Zkp2pClientOptions);
      
      setIsInitialized(true);
      setError(null);
      return zkp2pClient;
    } catch (err) {
      setError(err as Error);
      setIsInitialized(false);
      return null;
    }
  }, [
    options.walletClient,
    options.apiKey,
    options.chainId,
    options.baseApiUrl,
    options.witnessUrl,
    options.timeouts,
  ]);

  useEffect(() => {
    if (!options.walletClient) {
      setIsInitialized(false);
    }
  }, [options.walletClient]);

  return {
    client,
    isInitialized,
    error,
  };
}