import React, { useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import { BASE_CHAIN_ID, BASE_USDC_ADDRESS, ZERO_ADDRESS } from '@helpers/constants';
import { CHAIN_EXPLORERS } from '@helpers/blockExplorers';
import { BridgeProvider } from '@helpers/types/bridge';
import { TokenData, usdcInfo } from '@helpers/types/tokens';
import TokenDataContext, { 
  RelayV2Currency,
  RelayV2CurrencyRequest,  
  CHAIN_ICONS, 
  getChainName, 
  getChainIcon, 
  getChainIdFromName, 
  getChainIconFromName, 
  getAllSupportedChains 
} from './TokenDataContext';
import useBungeeTokens, { BungeeToken } from '@hooks/bridge/useBungeeTokens';

interface ProvidersProps {
  children: ReactNode;
  bridgeProvider?: BridgeProvider; // Current active bridge provider
}

const DEFAULT_EXPLORER = 'https://relay.link/transaction/';

/**
 * Multi-provider token data provider that switches between Relay and Bungee token sources
 * based on the active bridge provider
 */
const MultiProviderTokenDataProvider = ({ children, bridgeProvider = BridgeProvider.RELAY }: ProvidersProps) => {
  const env = import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT;
  
  // State
  const [tokens, setTokens] = useState<string[]>([]);
  const [tokenInfo, setTokenInfo] = useState<Record<string, TokenData>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs for caching and deduplication
  const loadedChainIds = useRef<Set<number>>(new Set());
  const pendingRequests = useRef<Record<string, Promise<any>>>({});
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const providerCacheRef = useRef<BridgeProvider | null>(null);
  
  // Bungee tokens hook
  const { 
    fetchBungeeTokens, 
    searchBungeeTokens, 
    getTokensForChain: getBungeeTokensForChain 
  } = useBungeeTokens();
  
  const DEBOUNCE_DELAY = 500;
  
  /**
   * Convert Bungee token to our TokenData format
   */
  const convertBungeeTokenToTokenData = useCallback((token: BungeeToken): TokenData => {
    const tokenId = `${token.chainId}:${token.address.toLowerCase()}`;
    const chainName = getChainName(token.chainId);
    const blockExplorerUrl = CHAIN_EXPLORERS[token.chainId] || DEFAULT_EXPLORER;
    
    return {
      tokenId,
      name: token.name,
      decimals: token.decimals,
      ticker: token.symbol,
      icon: token.logoURI || '',
      address: token.address,
      chainId: token.chainId,
      chainName,
      blockExplorerUrl,
      chainIcon: CHAIN_ICONS[token.chainId] || '',
      isBase: token.chainId === BASE_CHAIN_ID,
      isNative: token.address.toLowerCase() === ZERO_ADDRESS.toLowerCase(),
      vmType: 'evm', // Bungee only supports EVM chains
      depositAllowed: token.chainId === BASE_CHAIN_ID && token.address.toLowerCase() === BASE_USDC_ADDRESS.toLowerCase(),
      verified: token.isVerified,
    };
  }, []);
  
  /**
   * Process Relay V2 API response
   */
  const processRelayTokens = useCallback((data: RelayV2Currency[]): { 
    processedTokens: string[], 
    processedTokenInfo: Record<string, TokenData> 
  } => {
    const processedTokens: string[] = [];
    const processedTokenInfo: Record<string, TokenData> = {};
    
    data.forEach(currency => {
      const tokenId = `${currency.chainId}:${currency.address.toLowerCase()}`;
      const chainName = getChainName(currency.chainId);
      const blockExplorerUrl = CHAIN_EXPLORERS[currency.chainId] || DEFAULT_EXPLORER;
      
      processedTokens.push(tokenId);
      
      processedTokenInfo[tokenId] = {
        tokenId,
        name: currency.name,
        decimals: currency.decimals,
        ticker: currency.symbol,
        icon: currency.metadata?.logoURI || '',
        address: currency.address,
        chainId: currency.chainId,
        chainName,
        blockExplorerUrl,
        chainIcon: CHAIN_ICONS[currency.chainId] || '',
        isBase: currency.chainId === BASE_CHAIN_ID,
        isNative: currency.metadata?.isNative || currency.address.toLowerCase() === ZERO_ADDRESS.toLowerCase(),
        vmType: currency.vmType,
        depositAllowed: currency.chainId === BASE_CHAIN_ID && currency.address.toLowerCase() === BASE_USDC_ADDRESS.toLowerCase(),
        verified: currency.metadata?.verified ?? false,
      };
    });
    
    return { processedTokens, processedTokenInfo };
  }, []);
  
  /**
   * Fetch tokens from Relay V2 API
   */
  const fetchRelayTokens = useCallback(async (params: RelayV2CurrencyRequest): Promise<{
    tokenIds: string[],
    tokenInfoData: Record<string, TokenData>
  } | null> => {
    try {
      const response = await fetch('https://api.relay.link/currencies/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Relay tokens: ${response.statusText}`);
      }
      
      const data: RelayV2Currency[] = await response.json();
      const { processedTokens, processedTokenInfo } = processRelayTokens(data);
      
      return {
        tokenIds: processedTokens,
        tokenInfoData: processedTokenInfo
      };
    } catch (error) {
      // Log only in development
      if (import.meta.env.DEV) {
        console.error('Error fetching Relay tokens:', error);
      }
      return null;
    }
  }, [processRelayTokens]);
  
  /**
   * Fetch tokens based on active bridge provider
   */
  const fetchTokensForChain = useCallback(async (chainId: number) => {
    // Skip if on testnet
    if (env === 'STAGING_TESTNET') {
      if (chainId === usdcInfo.chainId) {
        return { tokenIds: [usdcInfo.tokenId], tokenInfoData: { [usdcInfo.tokenId]: usdcInfo } };
      }
      return { tokenIds: [], tokenInfoData: {} };
    }
    
    // Skip if already loaded for this provider
    const cacheKey = `${bridgeProvider}-${chainId}`;
    if (loadedChainIds.current.has(chainId) && providerCacheRef.current === bridgeProvider) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      let result: { tokenIds: string[], tokenInfoData: Record<string, TokenData> } | null = null;
      
      if (bridgeProvider === BridgeProvider.RELAY) {
        // Use Relay V2 API
        result = await fetchRelayTokens({
          chainIds: [chainId],
          limit: 100,
          defaultList: true,
          verified: true,
        });
      } else if (bridgeProvider === BridgeProvider.BUNGEE) {
        // Use Bungee API
        const bungeeTokens = await getBungeeTokensForChain(chainId);
        if (bungeeTokens) {
          const processedTokens: string[] = [];
          const processedTokenInfo: Record<string, TokenData> = {};
          
          bungeeTokens.forEach(token => {
            const tokenData = convertBungeeTokenToTokenData(token);
            processedTokens.push(tokenData.tokenId);
            processedTokenInfo[tokenData.tokenId] = tokenData;
          });
          
          result = { tokenIds: processedTokens, tokenInfoData: processedTokenInfo };
        }
      }
      
      if (result) {
        loadedChainIds.current.add(chainId);
        
        // Merge with existing data
        setTokens(prev => [...new Set([...prev, ...result.tokenIds])]);
        setTokenInfo(prev => ({ ...prev, ...result.tokenInfoData }));
        
        return result;
      }
    } catch (error) {
      // Log only in development
      if (import.meta.env.DEV) {
        console.error(`Error fetching tokens for chain ${chainId}:`, error);
      }
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [bridgeProvider, env, fetchRelayTokens, getBungeeTokensForChain, convertBungeeTokenToTokenData]);
  
  /**
   * Search tokens by term based on active provider
   */
  const searchTokensByTerm = useCallback(async (term: string, chainId?: number) => {
    if (!term || term.trim() === '') return undefined;
    
    // Handle testnet
    if (env === 'STAGING_TESTNET') {
      const termLower = term.toLowerCase();
      if (usdcInfo.ticker.toLowerCase().includes(termLower) || 
          usdcInfo.name.toLowerCase().includes(termLower)) {
        if (!chainId || chainId === usdcInfo.chainId) {
          return { tokenIds: [usdcInfo.tokenId], tokenInfoData: { [usdcInfo.tokenId]: usdcInfo } };
        }
      }
      return { tokenIds: [], tokenInfoData: {} };
    }
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    setIsLoading(true);
    
    return new Promise<{ tokenIds: string[], tokenInfoData: Record<string, TokenData> } | undefined>((resolve) => {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          let result: { tokenIds: string[], tokenInfoData: Record<string, TokenData> } | null = null;
          
          if (bridgeProvider === BridgeProvider.RELAY) {
            // Use Relay search
            result = await fetchRelayTokens({
              term,
              limit: 10,
              verified: false,
              useExternalSearch: true,
              ...(chainId && { chainIds: [chainId] })
            });
          } else if (bridgeProvider === BridgeProvider.BUNGEE) {
            // Use Bungee search
            const bungeeTokens = await searchBungeeTokens(term, chainId);
            if (bungeeTokens) {
              const processedTokens: string[] = [];
              const processedTokenInfo: Record<string, TokenData> = {};
              
              // Limit to 10 results
              bungeeTokens.slice(0, 10).forEach(token => {
                const tokenData = convertBungeeTokenToTokenData(token);
                processedTokens.push(tokenData.tokenId);
                processedTokenInfo[tokenData.tokenId] = tokenData;
              });
              
              result = { tokenIds: processedTokens, tokenInfoData: processedTokenInfo };
            }
          }
          
          if (result) {
            // Merge with existing data
            setTokens(prev => [...new Set([...prev, ...result.tokenIds])]);
            setTokenInfo(prev => ({ ...prev, ...result.tokenInfoData }));
            resolve(result);
          } else {
            resolve(undefined);
          }
        } catch (error) {
          // Log only in development
          if (import.meta.env.DEV) {
            console.error('Error searching tokens:', error);
          }
          resolve(undefined);
        } finally {
          setIsLoading(false);
        }
      }, DEBOUNCE_DELAY);
    });
  }, [bridgeProvider, env, fetchRelayTokens, searchBungeeTokens, convertBungeeTokenToTokenData]);
  
  /**
   * Search tokens by address
   */
  const searchTokensByAddress = useCallback(async (address: string, chainId?: number) => {
    if (!address || address.trim() === '') return undefined;
    
    // For addresses, we can use the same search function
    return searchTokensByTerm(address, chainId);
  }, [searchTokensByTerm]);
  
  /**
   * Refetch specific token
   */
  const refetchToken = useCallback(async (tokenId: string): Promise<TokenData | undefined> => {
    if (!tokenId || tokenId.trim() === '') {
      return undefined;
    }
    
    const [chainIdStr, address] = tokenId.split(':');
    if (!chainIdStr || !address) {
      return undefined;
    }
    
    const chainId = parseInt(chainIdStr);
    if (isNaN(chainId)) {
      return undefined;
    }
    
    const normalizedTokenId = `${chainId}:${address.toLowerCase()}`;
    
    // Check cache first
    if (tokenInfo[normalizedTokenId]) {
      return tokenInfo[normalizedTokenId];
    }
    
    // Fetch from appropriate provider
    const result = await searchTokensByAddress(address, chainId);
    if (result && result.tokenInfoData[normalizedTokenId]) {
      return result.tokenInfoData[normalizedTokenId];
    }
    
    return undefined;
  }, [tokenInfo, searchTokensByAddress]);
  
  /**
   * Initial fetch - load Base chain tokens
   */
  const fetchInitialTokens = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await fetchTokensForChain(BASE_CHAIN_ID);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      // Log only in development
      if (import.meta.env.DEV) {
        console.error('Error fetching initial tokens:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchTokensForChain]);
  
  /**
   * Clear cache when provider changes
   */
  useEffect(() => {
    if (providerCacheRef.current && providerCacheRef.current !== bridgeProvider) {
      console.log(`Bridge provider changed from ${providerCacheRef.current} to ${bridgeProvider}, clearing token cache`);
      
      // Clear cached data
      loadedChainIds.current.clear();
      setTokens([]);
      setTokenInfo({});
      
      // Reload initial tokens for new provider
      fetchInitialTokens();
    }
    
    providerCacheRef.current = bridgeProvider;
  }, [bridgeProvider, fetchInitialTokens]);
  
  /**
   * Initial load
   */
  useEffect(() => {
    fetchInitialTokens();
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [fetchInitialTokens]);
  
  // Memoize context value
  const contextValue = useMemo(() => ({
    TOKEN_USDC: `${BASE_CHAIN_ID}:${BASE_USDC_ADDRESS}`,
    tokens,
    tokenInfo,
    isLoading,
    error,
    refetchTokens: fetchInitialTokens,
    fetchTokensForChain,
    searchTokensByTerm,
    searchTokensByAddress,
    refetchToken,
    // Chain mapping functions
    getChainName,
    getChainIcon,
    getChainIdFromName,
    getChainIconFromName,
    getAllSupportedChains,
    // Current provider
    currentTokenProvider: bridgeProvider,
  }), [
    tokens,
    tokenInfo,
    isLoading,
    error,
    fetchInitialTokens,
    fetchTokensForChain,
    searchTokensByTerm,
    searchTokensByAddress,
    refetchToken,
    bridgeProvider
  ]);
  
  return (
    <TokenDataContext.Provider value={contextValue}>
      {children}
    </TokenDataContext.Provider>
  );
};

export default MultiProviderTokenDataProvider;