# CLAUDE.md - TokenData Context Documentation

This document provides guidance for working with the TokenData context in the ZKP2P V2 client. The TokenData context manages dynamic token information, multi-chain token data, and integration with the Relay API for comprehensive token metadata.

## 🎯 Overview

The TokenData context serves as the central hub for token metadata management, supporting multi-chain token discovery, search functionality, and dynamic token loading. It integrates with Relay's V2 API to provide comprehensive token information across supported blockchain networks.

### Core Responsibilities
- **Dynamic Token Discovery**: Load tokens from multiple chains
- **Search Functionality**: Search by token name, symbol, or address
- **Multi-Chain Support**: Unified interface for cross-chain tokens
- **Performance Optimization**: Caching, debouncing, and request deduplication
- **Environment Handling**: Different behavior for staging/production environments

## 🏗️ Architecture

### Context Structure
```typescript
interface TokenDataContextType {
  // Constants
  TOKEN_USDC: string;
  
  // State
  tokens: string[];
  tokenInfo: Record<string, TokenData>;
  isLoading: boolean;
  error: Error | null;
  
  // Functions
  refetchTokens: () => Promise<void>;
  fetchTokensForChain: (chainId: number) => Promise<void>;
  searchTokensByTerm: (term: string, chainId?: number) => Promise<SearchResult>;
  searchTokensByAddress: (address: string, chainId?: number) => Promise<SearchResult>;
  refetchToken: (tokenId: string) => Promise<TokenData | undefined>;
  
  // Chain utilities
  getChainName: (chainId: number) => string;
  getChainIcon: (chainId: number) => string;
  // ... other chain utilities
}
```

### Data Flow
```
User Request → Search/Fetch → Relay API → Process Response → Merge Data → Update Context
```

## 🔧 Core Components

### TokenDataProvider (`TokenDataProvider.tsx`)

#### State Management

**Core State Variables**
```typescript
const [tokens, setTokens] = useState<string[]>([]);
const [tokenInfo, setTokenInfo] = useState<Record<string, TokenData>>({});
const [isLoading, setIsLoading] = useState<boolean>(true);
const [error, setError] = useState<Error | null>(null);
```

**Performance Optimization State**
```typescript
// Prevent duplicate API requests
const loadedChainIds = useRef<Set<number>>(new Set());
const pendingRequests = useRef<Record<string, Promise<any>>>({});
const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
```

#### Environment-Aware Behavior

**STAGING_TESTNET Mode**
```typescript
// If on STAGING_TESTNET, only return USDC
if (env === 'STAGING_TESTNET') {
  setTokens([usdcInfo.tokenId]);
  setTokenInfo({ [usdcInfo.tokenId]: usdcInfo });
  return;
}
```

**Production Mode**: Full Relay API integration with comprehensive token support

#### API Integration

**Relay V2 API Integration**
```typescript
const fetchTokensWithParams = useCallback(async (params: RelayV2CurrencyRequest) => {
  const response = await fetch('https://api.relay.link/currencies/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(params),
  });
  
  const data: RelayV2Currency[] = await response.json();
  return processTokensFromResponse(data);
}, []);
```

**Response Processing**
```typescript
const processTokensFromResponse = useCallback((data: RelayV2Currency[]) => {
  const processedTokens: string[] = [];
  const processedTokenInfo: Record<string, TokenData> = {};

  data.forEach(currency => {
    const tokenId = `${currency.chainId}:${currency.address.toLowerCase()}`;
    
    processedTokens.push(tokenId);
    processedTokenInfo[tokenId] = {
      tokenId: tokenId,
      name: currency.name,
      decimals: currency.decimals,
      ticker: currency.symbol,
      icon: currency.metadata?.logoURI || '',
      address: currency.address,
      chainId: currency.chainId,
      chainName: getChainName(currency.chainId),
      blockExplorerUrl: CHAIN_EXPLORERS[currency.chainId] || DEFAULT_EXPLORER,
      chainIcon: CHAIN_ICONS[currency.chainId] || '',
      isBase: currency.chainId === BASE_CHAIN_ID,
      isNative: currency.metadata?.isNative || false,
      vmType: currency.vmType,
      depositAllowed: currency.chainId === BASE_CHAIN_ID && currency.address === BASE_USDC_ADDRESS,
      verified: currency.metadata?.verified ?? false,
    };
  });

  return { processedTokens, processedTokenInfo };
}, []);
```

## 🔄 Core Functionality

### Chain-Specific Token Loading

**Load Tokens for Specific Chain**
```typescript
const fetchTokensForChain = useCallback(async (chainId: number) => {
  // Prevent duplicate requests
  if (loadedChainIds.current.has(chainId)) {
    return;
  }
  
  const { tokenIds, tokenInfoData } = await fetchTokensWithParams({
    chainIds: [chainId],
    limit: 12,
    defaultList: true,
    verified: true,
  });
  
  loadedChainIds.current.add(chainId);
  mergeTokenData(tokenIds, tokenInfoData);
}, []);
```

### Search Functionality

**Search by Term (Debounced)**
```typescript
const searchTokensByTerm = useCallback(async (term: string, chainId?: number) => {
  if (!term || term.trim() === '') return undefined;
  
  // Debouncing implementation
  return new Promise((resolve) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      const params: RelayV2CurrencyRequest = {
        term: term,
        limit: 10,
        verified: false,
        useExternalSearch: true,
      };
      
      if (chainId) {
        params.chainIds = [chainId];
      }
      
      const { tokenIds, tokenInfoData } = await fetchTokensWithParams(params);
      mergeTokenData(tokenIds, tokenInfoData);
      resolve({ tokenIds, tokenInfoData });
    }, DEBOUNCE_DELAY);
  });
}, []);
```

**Search by Address**
```typescript
const searchTokensByAddress = useCallback(async (address: string, chainId?: number) => {
  const params: RelayV2CurrencyRequest = {
    address: address,
    verified: false,
    useExternalSearch: true,
  };
  
  if (chainId) {
    params.chainIds = [chainId];
  }
  
  const { tokenIds, tokenInfoData } = await fetchTokensWithParams(params);
  mergeTokenData(tokenIds, tokenInfoData);
  
  return { tokenIds, tokenInfoData };
}, []);
```

### Individual Token Fetching

**Refetch Specific Token**
```typescript
const refetchToken = useCallback(async (tokenId: string): Promise<TokenData | undefined> => {
  // Parse tokenId format "chainId:address"
  const [chainIdStr, address] = tokenId.split(':');
  const chainId = parseInt(chainIdStr);
  
  // Check cache first
  if (tokenInfo[tokenId]) {
    return tokenInfo[tokenId];
  }
  
  // Fetch from API
  const { tokenInfoData } = await fetchTokensWithParams({
    chainIds: [chainId],
    address: address,
    verified: false,
    useExternalSearch: true
  });
  
  if (tokenInfoData[tokenId]) {
    mergeTokenData([tokenId], tokenInfoData);
    return tokenInfoData[tokenId];
  }
  
  return undefined;
}, []);
```

## 🔄 Usage Patterns

### Basic Token Information
```typescript
import useTokenData from '@hooks/contexts/useTokenData';

const TokenDisplay: React.FC = () => {
  const { tokens, tokenInfo, isLoading } = useTokenData();
  
  if (isLoading) return <Spinner />;
  
  return (
    <div>
      {tokens.map(tokenId => {
        const token = tokenInfo[tokenId];
        return (
          <div key={tokenId}>
            <img src={token.icon} alt={token.ticker} />
            <span>{token.name} ({token.ticker})</span>
            <span>Chain: {token.chainName}</span>
          </div>
        );
      })}
    </div>
  );
};
```

### Chain-Specific Loading
```typescript
const ChainTokenLoader: React.FC<{ chainId: number }> = ({ chainId }) => {
  const { fetchTokensForChain, getChainName } = useTokenData();
  
  useEffect(() => {
    fetchTokensForChain(chainId);
  }, [chainId, fetchTokensForChain]);
  
  return <div>Loading tokens for {getChainName(chainId)}...</div>;
};
```

### Search Implementation
```typescript
const TokenSearch: React.FC = () => {
  const { searchTokensByTerm } = useTokenData();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  
  const handleSearch = useCallback(async (term: string) => {
    if (term.trim()) {
      const results = await searchTokensByTerm(term);
      if (results) {
        setSearchResults(results.tokenIds);
      }
    } else {
      setSearchResults([]);
    }
  }, [searchTokensByTerm]);
  
  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, handleSearch]);
  
  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search tokens..."
      />
      {searchResults.map(tokenId => (
        <TokenResult key={tokenId} tokenId={tokenId} />
      ))}
    </div>
  );
};
```

### Token Validation
```typescript
const useTokenValidation = () => {
  const { tokenInfo, refetchToken } = useTokenData();
  
  const validateToken = useCallback(async (tokenId: string) => {
    let token = tokenInfo[tokenId];
    
    if (!token) {
      // Try to fetch if not in cache
      token = await refetchToken(tokenId);
    }
    
    if (!token) {
      throw new Error(`Token ${tokenId} not found`);
    }
    
    return {
      isValid: true,
      isVerified: token.verified,
      isBase: token.isBase,
      canDeposit: token.depositAllowed,
      token
    };
  }, [tokenInfo, refetchToken]);
  
  return { validateToken };
};
```

## 🌐 Multi-Chain Support

### Chain Information
```typescript
// Built-in chain utilities
const { 
  getChainName, 
  getChainIcon, 
  getChainIdFromName, 
  getAllSupportedChains 
} = useTokenData();

// Usage
const chainName = getChainName(1); // "ethereum"
const chainIcon = getChainIcon(8453); // Base chain icon
const supportedChains = getAllSupportedChains(); // All supported chains
```

### Chain-Specific Filtering
```typescript
const ChainTokenFilter: React.FC = () => {
  const { tokens, tokenInfo } = useTokenData();
  
  const getTokensByChain = (chainId: number) => {
    return tokens.filter(tokenId => tokenInfo[tokenId]?.chainId === chainId);
  };
  
  const baseTokens = getTokensByChain(8453); // Base chain tokens
  const ethereumTokens = getTokensByChain(1); // Ethereum tokens
  
  return (
    <div>
      <h3>Base Tokens ({baseTokens.length})</h3>
      <h3>Ethereum Tokens ({ethereumTokens.length})</h3>
    </div>
  );
};
```

## 🚀 Performance Optimizations

### Request Deduplication
```typescript
// Prevents multiple identical requests
const requestKey = JSON.stringify(params);
if (requestKey in pendingRequests.current) {
  return pendingRequests.current[requestKey];
}
```

### Debounced Search
```typescript
const DEBOUNCE_DELAY = 500; // 500ms debounce

// Debouncing prevents excessive API calls during typing
searchTimeoutRef.current = setTimeout(async () => {
  // Perform search
}, DEBOUNCE_DELAY);
```

### Efficient Data Merging
```typescript
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
```

### Chain Loading Optimization
```typescript
// Track loaded chains to prevent duplicate requests
const loadedChainIds = useRef<Set<number>>(new Set());

if (loadedChainIds.current.has(chainId)) {
  return; // Already loaded
}
```

## 🎯 Token Data Structure

### TokenData Interface
```typescript
interface TokenData {
  tokenId: string;          // Format: "chainId:address"
  name: string;             // Full token name
  decimals: number;         // Token decimals
  ticker: string;           // Token symbol (e.g., "USDC")
  icon: string;             // Token icon URL
  address: string;          // Contract address
  chainId: number;          // Chain identifier
  chainName: string;        // Human-readable chain name
  blockExplorerUrl: string; // Block explorer base URL
  chainIcon: string;        // Chain icon URL
  isBase: boolean;          // Is on Base chain
  isNative: boolean;        // Is native chain token (ETH, etc.)
  vmType: string;           // VM type (evm, svm, etc.)
  depositAllowed: boolean;  // Can be used for deposits
  verified: boolean;        // Is verified token
}
```

### Token ID Format
```typescript
// Token IDs follow the format "chainId:address"
const tokenId = `${chainId}:${address.toLowerCase()}`;

// Examples:
// "8453:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" (USDC on Base)
// "1:0xa0b86a33e6c91dd3ad11c78b0dadf9b0b7a68aca" (Some token on Ethereum)
```

## ⚠️ Important Considerations

### Environment Handling
- **STAGING_TESTNET**: Only shows USDC to reduce complexity
- **Production**: Full token discovery enabled
- **API Limits**: Respects Relay API rate limits and quotas
- **Error Handling**: Graceful degradation on API failures

### Data Consistency
- **Lowercase Addresses**: All addresses normalized to lowercase
- **Chain Validation**: Only supported chains included
- **Verification Status**: Tracks token verification from sources
- **Metadata Quality**: Handles missing or incomplete metadata

### Memory Management
- **Caching Strategy**: Tokens cached in context state
- **Request Cleanup**: Pending requests properly cleaned up
- **Timeout Management**: Search timeouts cleared appropriately
- **Reference Cleanup**: useRef cleanup in unmount

### API Integration
- **V2 API**: Uses latest Relay V2 API endpoint
- **Request Format**: POST requests with JSON body
- **Response Handling**: Supports both V1 and V2 response formats
- **Error Recovery**: Handles API errors and network issues

## 🔍 Debugging Common Issues

### Tokens Not Loading
```typescript
// Check environment configuration
const env = import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT;
console.log('Environment:', env);

// Check if chain is loaded
const { loadedChainIds } = useTokenData(); // Not exposed, check internally
console.log('Loaded chains:', loadedChainIds.current);
```

### Search Not Working
```typescript
// Check debounce timing
const DEBOUNCE_DELAY = 500; // May need adjustment

// Verify search parameters
const searchResult = await searchTokensByTerm('USDC', 8453);
console.log('Search result:', searchResult);
```

### Token Not Found
```typescript
// Check token ID format
const tokenId = `${chainId}:${address.toLowerCase()}`;
console.log('Looking for token:', tokenId);

// Try explicit refetch
const token = await refetchToken(tokenId);
console.log('Refetch result:', token);
```

### Memory Issues
```typescript
// Monitor token cache size
const { tokens, tokenInfo } = useTokenData();
console.log('Cached tokens:', tokens.length);
console.log('Token info size:', Object.keys(tokenInfo).length);
```

## 📚 Related Documentation

- **Main CLAUDE.md**: Project architecture overview
- **`src/contexts/CLAUDE.md`**: Context system documentation
- **`src/helpers/types/tokens.ts`**: Token type definitions
- **Relay API Documentation**: External API integration details
- **Chain Configuration**: `src/helpers/chainIcons.ts`

## 🚀 Future Enhancements

Planned improvements to the TokenData system:

- **Enhanced Search**: Fuzzy search and ranking algorithms
- **Token Lists**: Support for standard token list formats
- **Price Integration**: Real-time token price data
- **Portfolio Tracking**: User token holdings and balances
- **Favorites System**: User-curated token favorites
- **Offline Support**: Cached token data for offline use
- **Analytics**: Token usage and popularity metrics

The TokenData context provides a robust foundation for multi-chain token management while maintaining excellent performance and user experience.