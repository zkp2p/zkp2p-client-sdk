import { useCallback, useState } from 'react';

// Bungee Token API types based on research documentation
export interface BungeeTokenRequest {
  userAddress?: string;
  chainIds?: string;  // Comma-separated chain IDs
  list?: 'full' | 'trending';
}

export interface BungeeToken {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  isShortListed: boolean;
  trendingRank?: number;
  marketCap?: number;
  totalVolume?: number;
  balance: string;
  balanceInUsd: number;
  tags?: string[];
  isVerified: boolean;
}

export interface BungeeTokenResponse {
  status: string;
  result: {
    tokens: Record<string, BungeeToken[]>;
  };
}

/**
 * Hook for fetching token data from Bungee/Socket API
 * Used when Bungee is the active bridge provider
 */
export default function useBungeeTokens() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch tokens from Bungee API
   */
  const fetchBungeeTokens = useCallback(async (
    params: BungeeTokenRequest = {}
  ): Promise<Record<string, BungeeToken[]> | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      if (params.userAddress) {
        queryParams.append('userAddress', params.userAddress);
      }
      
      if (params.chainIds) {
        queryParams.append('chainIds', params.chainIds);
      }
      
      // Default to trending list for better performance
      queryParams.append('list', params.list || 'trending');

      const response = await fetch(
        `https://public-backend.bungee.exchange/api/v1/tokens/list?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch Bungee tokens: ${response.statusText}`);
      }

      const data: BungeeTokenResponse = await response.json();
      
      if (data.status !== 'success') {
        throw new Error('Bungee API returned error status');
      }

      return data.result.tokens;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      console.error('Error fetching Bungee tokens:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Search tokens by term using Bungee API
   * Note: Bungee doesn't have direct search, so we fetch all and filter client-side
   */
  const searchBungeeTokens = useCallback(async (
    term: string,
    chainId?: number
  ): Promise<BungeeToken[] | null> => {
    const chainIds = chainId ? chainId.toString() : undefined;
    
    const tokens = await fetchBungeeTokens({
      chainIds,
      list: 'full' // Use full list for search
    });

    if (!tokens) {
      return null;
    }

    const termLower = term.toLowerCase();
    const results: BungeeToken[] = [];

    // Search across all chains
    Object.values(tokens).forEach(chainTokens => {
      chainTokens.forEach(token => {
        if (
          token.symbol.toLowerCase().includes(termLower) ||
          token.name.toLowerCase().includes(termLower) ||
          token.address.toLowerCase().includes(termLower)
        ) {
          results.push(token);
        }
      });
    });

    return results;
  }, [fetchBungeeTokens]);

  /**
   * Get tokens for specific chain
   */
  const getTokensForChain = useCallback(async (
    chainId: number
  ): Promise<BungeeToken[] | null> => {
    const tokens = await fetchBungeeTokens({
      chainIds: chainId.toString(),
      list: 'trending'
    });

    if (!tokens) {
      return null;
    }

    // Return tokens for the specific chain
    return tokens[chainId.toString()] || [];
  }, [fetchBungeeTokens]);

  return {
    fetchBungeeTokens,
    searchBungeeTokens,
    getTokensForChain,
    isLoading,
    error
  };
}