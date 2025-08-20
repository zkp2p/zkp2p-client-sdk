import React, { useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { BASE_CHAIN_ID, BASE_USDC_ADDRESS, esl, ZERO_ADDRESS } from '@helpers/constants';
import { CHAIN_EXPLORERS } from '@helpers/blockExplorers';

import TokenDataContext, { 
  RelayCurrency,
  RelayV2Currency,
  RelayV2CurrencyRequest,  
  CHAIN_ICONS, 
  getChainName, 
  getChainIcon, 
  getChainIdFromName, 
  getChainIconFromName, 
  getAllSupportedChains 
} from './TokenDataContext';
import { TokenData, usdcInfo } from '@helpers/types/tokens';

// Default to relay.link if chain not found
const DEFAULT_EXPLORER = 'https://relay.link/transaction/';

// Debounce utility function
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

interface ProvidersProps {
  children: ReactNode;
}

const TokenDataProvider = ({ children }: ProvidersProps) => {
  // Get current environment
  const env = import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT;
  /*
   * State
   */
  const [tokens, setTokens] = useState<string[]>([]);
  const [tokenInfo, setTokenInfo] = useState<Record<string, TokenData>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Add refs for tracking loaded chains and preventing duplicate requests
  const loadedChainIds = useRef<Set<number>>(new Set());
  const pendingRequests = useRef<Record<string, Promise<any>>>({});
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /*
   * Constants
   */
  const SUPPORTED_CHAIN_IDS = Object.keys(CHAIN_ICONS).map(id => parseInt(id));
  const DEBOUNCE_DELAY = 500; // 500ms debounce delay

  /*
   * Process API response into our token format
   * Handles both V1 (nested arrays) and V2 (flat array) response formats
   */
  const processTokensFromResponse = useCallback((data: RelayCurrency[][] | RelayV2Currency[]): { 
    processedTokens: string[], 
    processedTokenInfo: Record<string, TokenData> 
  } => {
    const processedTokens: string[] = [];
    const processedTokenInfo: Record<string, TokenData> = {};

    // Check if this is V2 format (flat array) or V1 format (nested arrays)
    const isV2Format = data.length > 0 && !Array.isArray(data[0]);
    
    if (isV2Format) {
      // Process V2 format
      (data as RelayV2Currency[]).forEach(currency => {
        const tokenId = `${currency.chainId}:${currency.address.toLowerCase()}`;
        
        // Get chain name from our mapping
        const chainName = getChainName(currency.chainId);
        
        // Get block explorer URL
        const blockExplorerUrl = CHAIN_EXPLORERS[currency.chainId] || DEFAULT_EXPLORER;
        
        processedTokens.push(tokenId);
        
        processedTokenInfo[tokenId] = {
          tokenId: tokenId,
          name: currency.name,
          decimals: currency.decimals,
          ticker: currency.symbol,
          icon: currency.metadata?.logoURI || '',
          address: currency.address,
          chainId: currency.chainId,
          chainName: chainName,
          blockExplorerUrl,
          chainIcon: CHAIN_ICONS[currency.chainId] || '',
          isBase: currency.chainId === BASE_CHAIN_ID,
          isNative: currency.metadata?.isNative || (currency.chainId === BASE_CHAIN_ID && currency.address === ZERO_ADDRESS),
          vmType: currency.vmType,
          depositAllowed: currency.chainId === BASE_CHAIN_ID && currency.address === BASE_USDC_ADDRESS,
          verified: currency.metadata?.verified ?? false,
        };
      });
    } else {
      // Process V1 format (legacy, keeping for compatibility)
      (data as RelayCurrency[][]).forEach(currencyGroup => {
        currencyGroup.forEach(currency => {
          const tokenId = `${currency.chainId}:${currency.address.toLowerCase()}`;
          
          // Get chain name from our mapping
          const chainName = getChainName(currency.chainId);
          
          // Get block explorer URL
          const blockExplorerUrl = CHAIN_EXPLORERS[currency.chainId] || DEFAULT_EXPLORER;
          
          processedTokens.push(tokenId);
          
          processedTokenInfo[tokenId] = {
            tokenId: tokenId,
            name: currency.name,
            decimals: currency.decimals,
            ticker: currency.symbol,
            icon: currency.metadata?.logoURI || '',
            address: currency.address,
            chainId: currency.chainId,
            chainName: chainName,
            blockExplorerUrl,
            chainIcon: CHAIN_ICONS[currency.chainId] || '',
            isBase: currency.chainId === BASE_CHAIN_ID,
            isNative: currency.chainId === BASE_CHAIN_ID && currency.address === ZERO_ADDRESS,
            vmType: currency.vmType,
            depositAllowed: currency.chainId === BASE_CHAIN_ID && currency.address === BASE_USDC_ADDRESS,
            verified: currency.metadata?.verified ?? false,
          };
        });
      });
    }

    return { processedTokens, processedTokenInfo };
  }, []);

  /*
   * Merge new token data with existing data
   */
  const mergeTokenData = useCallback((
    newTokenIds: string[], 
    newTokenInfo: Record<string, TokenData>
  ) => {
    setTokens(prevTokens => {
      // Use Set to remove duplicates
      const uniqueTokens = [...new Set([...prevTokens, ...newTokenIds])];
      return uniqueTokens;
    });

    setTokenInfo(prevTokenInfo => ({
      ...prevTokenInfo,
      ...newTokenInfo
    }));
  }, []);

  /*
   * Fetch tokens from Relay V2 API with specific parameters
   */
  const fetchTokensWithParams = useCallback(async (params: RelayV2CurrencyRequest): Promise<{
    tokenIds: string[],
    tokenInfoData: Record<string, TokenData>
  }> => {
    // Create a request key based on the parameters to avoid duplicate requests
    const requestKey = JSON.stringify(params);
    
    // If this exact request is already in progress, return the existing promise
    if (requestKey in pendingRequests.current) {
      return pendingRequests.current[requestKey];
    }
    
    // Create a new request promise
    const requestPromise = (async () => {
      try {
        
        // Migrate to Relay V2 API endpoint
        const response = await fetch('https://api.relay.link/currencies/v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(params),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch token data: ${response.statusText}`);
        }
        
        // V2 API returns a flat array of currencies
        const data: RelayV2Currency[] = await response.json();
        const { processedTokens, processedTokenInfo } = processTokensFromResponse(data);
        
        
        return {
          tokenIds: processedTokens,
          tokenInfoData: processedTokenInfo
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        console.error('Error fetching tokens:', error);
        setError(error);
        throw error;
      } finally {
        // Remove this request from pending requests
        delete pendingRequests.current[requestKey];
      }
    })();
    
    // Store the promise to avoid duplicate requests
    pendingRequests.current[requestKey] = requestPromise;
    
    return requestPromise;
  }, [processTokensFromResponse]);

  /*
   * Fetch tokens for a specific chain
   */
  const fetchTokensForChain = useCallback(async (chainId: number) => {
    // If on STAGING_TESTNET, only return USDC
    if (env === 'STAGING_TESTNET') {
      // Only return USDC if it's on the requested chain
      if (chainId === usdcInfo.chainId) {
        return { tokenIds: [usdcInfo.tokenId], tokenInfoData: { [usdcInfo.tokenId]: usdcInfo } };
      }
      return { tokenIds: [], tokenInfoData: {} };
    }
    
    // If we've already loaded this chain, don't fetch it again
    if (loadedChainIds.current.has(chainId)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { tokenIds, tokenInfoData } = await fetchTokensWithParams({
        chainIds: [chainId],
        limit: 12,
        defaultList: true,
        verified: true,
      });
      
      // Mark this chain as loaded
      loadedChainIds.current.add(chainId);
      
      // Merge the new data with existing data
      mergeTokenData(tokenIds, tokenInfoData);
      
      return { tokenIds, tokenInfoData };
    } finally {
      setIsLoading(false);
    }
  }, [fetchTokensWithParams, mergeTokenData, env]);

  /*
   * Search tokens by term - with debouncing
   */
  const searchTokensByTerm = useCallback(async (term: string, chainId?: number) => {
    if (!term || term.trim() === '') return undefined;
    
    // If on STAGING_TESTNET, only return USDC if it matches the search
    if (env === 'STAGING_TESTNET') {
      const termLower = term.toLowerCase();
      if (usdcInfo.ticker.toLowerCase().includes(termLower) || 
          usdcInfo.name.toLowerCase().includes(termLower) ||
          usdcInfo.address.toLowerCase().includes(termLower)) {
        // Check if chainId matches if provided
        if (!chainId || chainId === usdcInfo.chainId) {
          return { tokenIds: [usdcInfo.tokenId], tokenInfoData: { [usdcInfo.tokenId]: usdcInfo } };
        }
      }
      return { tokenIds: [], tokenInfoData: {} };
    }
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set loading state immediately to show feedback
    setIsLoading(true);
    
    // Return a promise that resolves when the debounced function completes
    return new Promise<{ tokenIds: string[], tokenInfoData: Record<string, TokenData> } | undefined>((resolve) => {
      // Create a new timeout
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const params: RelayV2CurrencyRequest = {
            term: term,
            limit: 10,
            verified: false,
            useExternalSearch: true,
          };
          
          // If chainId is provided, add it to the params
          if (chainId) {
            params.chainIds = [chainId];
          }
          
          const { tokenIds, tokenInfoData } = await fetchTokensWithParams(params);
          
          // Merge the new data with existing data
          mergeTokenData(tokenIds, tokenInfoData);
          
          resolve({ tokenIds, tokenInfoData });
        } catch (error) {
          console.error('Error searching tokens by term:', error);
          resolve(undefined);
        } finally {
          setIsLoading(false);
        }
      }, DEBOUNCE_DELAY);
    });
  }, [fetchTokensWithParams, mergeTokenData, env]);

  /*
   * Search tokens by address - with debouncing
   */
  const searchTokensByAddress = useCallback(async (address: string, chainId?: number) => {
    if (!address || address.trim() === '') return undefined;
    
    // If on STAGING_TESTNET, only return USDC if it matches the address
    if (env === 'STAGING_TESTNET') {
      if (usdcInfo.address.toLowerCase() === address.toLowerCase()) {
        // Check if chainId matches if provided
        if (!chainId || chainId === usdcInfo.chainId) {
          return { tokenIds: [usdcInfo.tokenId], tokenInfoData: { [usdcInfo.tokenId]: usdcInfo } };
        }
      }
      return { tokenIds: [], tokenInfoData: {} };
    }
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set loading state immediately to show feedback
    setIsLoading(true);
    
    // Return a promise that resolves when the debounced function completes
    return new Promise<{ tokenIds: string[], tokenInfoData: Record<string, TokenData> } | undefined>((resolve) => {
      // Create a new timeout
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const params: RelayV2CurrencyRequest = {
            address: address,
            verified: false,
            useExternalSearch: true,
          };
          
          // If chainId is provided, add it to the params
          if (chainId) {
            params.chainIds = [chainId];
          }
          
          const { tokenIds, tokenInfoData } = await fetchTokensWithParams(params);
          
          // Merge the new data with existing data
          mergeTokenData(tokenIds, tokenInfoData);
          
          resolve({ tokenIds, tokenInfoData });
        } catch (error) {
          console.error('Error searching tokens by address:', error);
          resolve(undefined);
        } finally {
          setIsLoading(false);
        }
      }, DEBOUNCE_DELAY);
    });
  }, [fetchTokensWithParams, mergeTokenData, env]);

  /*
   * Fetch token data for a specific token ID
   */
  const refetchToken = useCallback(async (tokenId: string): Promise<TokenData | undefined> => {
    if (!tokenId || tokenId.trim() === '') {
      console.warn('Empty tokenId provided to refetchToken');
      return undefined;
    }
    
    // Parse the token ID format "chainId:address"
    const [chainIdStr, address] = tokenId.split(':');
    if (!chainIdStr || !address) {
      console.error('Invalid token ID format:', tokenId);
      return undefined;
    }
    
    const chainId = parseInt(chainIdStr);
    if (isNaN(chainId)) {
      console.error('Invalid chain ID in token ID:', tokenId);
      return undefined;
    }
    
    // Normalize the tokenId to lowercase for consistency
    const normalizedTokenId = `${chainId}:${address.toLowerCase()}`;
    console.log(`Attempting to fetch token data for: ${normalizedTokenId} (original: ${tokenId})`);
    
    // Check if we already have this token in cache
    if (tokenInfo[normalizedTokenId]) {
      console.log(`Token ${normalizedTokenId} found in cache, returning cached data`);
      return tokenInfo[normalizedTokenId];
    }
    
    setIsLoading(true);
    console.log(`Fetching token data for ${normalizedTokenId} from API...`);
    
    try {
      // Fetch it from the API - include unverified tokens
      const { tokenInfoData } = await fetchTokensWithParams({
        chainIds: [chainId],
        address: address,
        verified: false,
        useExternalSearch: true
      });
      
      console.log(`API response for ${normalizedTokenId}:`, Object.keys(tokenInfoData).length ? 'Data found' : 'No data found');
      
      // If the token was found, merge with existing data and return it
      if (tokenInfoData[normalizedTokenId]) {
        console.log(`Successfully found token data for ${normalizedTokenId}`);
        mergeTokenData([normalizedTokenId], tokenInfoData);
        return tokenInfoData[normalizedTokenId];
      } else {
        console.warn(`No token data found for ${normalizedTokenId}`);
      }
      
      return undefined;
    } catch (error) {
      console.error('Error fetching token data:', error);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [fetchTokensWithParams, mergeTokenData, tokenInfo]);

  /*
   * Initial token fetch - only load Base chain tokens
   */
  const fetchInitialTokens = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // If on STAGING_TESTNET, only show USDC
      if (env === 'STAGING_TESTNET') {
        // Set only USDC token
        setTokens([usdcInfo.tokenId]);
        setTokenInfo({
          [usdcInfo.tokenId]: usdcInfo
        });
        
        // Mark Base chain as loaded
        loadedChainIds.current.add(BASE_CHAIN_ID);
      } else {
        // Fetch only Base chain tokens initially
        const { tokenIds, tokenInfoData } = await fetchTokensWithParams({
          chainIds: [BASE_CHAIN_ID],
          limit: 12,
          defaultList: true,
          verified: true,
        });
        
        // Mark Base chain as loaded
        loadedChainIds.current.add(BASE_CHAIN_ID);
        
        // Set the initial tokens
        setTokens(tokenIds);
        setTokenInfo(tokenInfoData);
      }
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      console.error('Error fetching initial tokens:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchTokensWithParams, env]);

  /*
   * Effects
   */
  useEffect(() => {
    fetchInitialTokens();
    
    // Cleanup function to clear any pending timeouts
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [fetchInitialTokens]);

  return (
    <TokenDataContext.Provider
      value={{
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
        getAllSupportedChains
      }}
    >
      {children}
    </TokenDataContext.Provider>
  );
};

export default TokenDataProvider; 