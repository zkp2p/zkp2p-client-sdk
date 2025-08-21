# Hooks - Development Context

## Overview

The hooks directory contains 58+ custom React hooks that handle data fetching, state management, blockchain interactions, and utility functions. These hooks follow React best practices and provide clean abstractions over complex functionality including Web3 operations, API integrations, and cross-chain bridging.

## Key Files and Structure

```
src/hooks/
├── backend/                    # Backend API integration hooks (11 hooks)
│   ├── useBackendRequests.ts   # Core API request handler with Privy auth
│   ├── useCreatePaymentProof.ts # Venmo proof generation
│   ├── useDepositQuotes.ts     # Liquidity quote fetching
│   ├── useQuoteFetchingEffects.ts # Quote lifecycle management
│   └── __tests__/              # Backend hook tests
├── contexts/                   # Context consumer hooks (13 hooks)  
│   ├── useAccount.ts           # Account state hook
│   ├── useSmartAccount.ts     # Smart account functionality
│   ├── useBalances.ts         # Token balance tracking
│   └── ...                    # Other context hooks
├── transactions/              # Blockchain transaction hooks (9 hooks)
│   ├── useCreateDeposit.ts   # Liquidity deposit creation
│   ├── useCreateIntent.ts    # Swap intent creation
│   ├── useTokenApprove.ts    # ERC20 approval with wagmi hooks
│   └── ...                   # Other transaction hooks
├── bridge/                   # Cross-chain bridge hooks (6 hooks)
│   ├── useRelayBridge.ts    # Relay SDK integration
│   ├── useSocketBridge.ts   # Socket API fallback
│   └── useBridgeQuote.ts    # Bridge quote aggregation
└── [utility hooks]          # General purpose hooks (19 hooks)
    ├── useMediaQuery.ts     # Responsive design breakpoints
    ├── useQuoteStorage.ts   # Persistent quote caching
    ├── useCurrencyPrices.ts # Fiat/crypto rate fetching
    └── ...                  # Other utilities
```

## Architecture Patterns

### Backend Hook Pattern
All backend hooks follow a consistent pattern for API integration:

```typescript
const useBackendHook = () => {
  const accessToken = useAccessToken(); // Privy authentication
  const curatorUrl = useCuratorUrl();   // Environment-specific API URL
  
  const request = useCallback(async (params) => {
    try {
      const response = await fetch(`${curatorUrl}/endpoint`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        logError('Backend error', { response });
        throw new Error('Request failed');
      }
      
      return response.json();
    } catch (error) {
      logError('Request error', error);
      throw error;
    }
  }, [accessToken, curatorUrl]);
  
  return { request };
};
```

### Transaction Hook Pattern
Transaction hooks integrate with smart accounts and gas sponsorship:

```typescript
const useTransaction = (onSuccess?: () => void, onError?: (error: Error) => void) => {
  const { writeContractAsync } = usePrivyTransaction(); // Smart account support
  
  const execute = useCallback(async (args) => {
    try {
      const tx = await writeContractAsync({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'methodName',
        args: [...args],
        value: BigInt(0)
      });
      
      const receipt = await waitForTransactionReceipt(tx.hash);
      onSuccess?.();
      return receipt;
    } catch (error) {
      onError?.(error);
      throw error;
    }
  }, [writeContractAsync, onSuccess, onError]);
  
  return { execute };
};
```

### Context Hook Pattern
Context hooks provide error checking and clean API:

```typescript
const useContextHook = () => {
  const context = useContext(SomeContext);
  
  if (!context) {
    throw new Error('useContextHook must be used within SomeProvider');
  }
  
  return context;
};
```

## Development Guidelines

### Error Handling Strategy
```typescript
// 1. Network errors - retry logic
try {
  const result = await fetchWithRetry(url, { retries: 3 });
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    // Handle network failure
  }
}

// 2. Validation errors - user feedback
if (!isValidInput(value)) {
  toast.error('Please enter a valid amount');
  return;
}

// 3. Transaction errors - structured logging
try {
  await executeTransaction();
} catch (error) {
  logError('Transaction failed', {
    error,
    context: { amount, recipient, chain }
  });
}
```

### Loading State Management
```typescript
// Use granular loading states for better UX
const [isQuoteFetching, setIsQuoteFetching] = useState(false);
const [isTransactionPending, setIsTransactionPending] = useState(false);
const [isDataRefreshing, setIsDataRefreshing] = useState(false);

// Combine for overall loading
const isLoading = isQuoteFetching || isTransactionPending || isDataRefreshing;
```

### Request Deduplication
```typescript
// Cache pattern for expensive operations
const quoteCache = useRef<Map<string, { data: Quote; timestamp: number }>>();
const CACHE_TTL = 5000; // 5 seconds

const getQuote = useCallback(async (params) => {
  const cacheKey = JSON.stringify(params);
  const cached = quoteCache.current?.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const quote = await fetchQuote(params);
  quoteCache.current?.set(cacheKey, { data: quote, timestamp: Date.now() });
  return quote;
}, []);
```

## Testing Strategy

### Hook Testing Pattern
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

describe('useCustomHook', () => {
  it('should handle successful data fetch', async () => {
    const mockData = { result: 'success' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });
    
    const { result } = renderHook(() => useCustomHook(), {
      wrapper: TestProviders
    });
    
    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });
  });
});
```

### Context Provider Testing
```typescript
const TestProviders = ({ children }) => (
  <PrivyProvider>
    <AccountProvider>
      <SmartContractsProvider>
        {children}
      </SmartContractsProvider>
    </AccountProvider>
  </PrivyProvider>
);
```

## Common Tasks

### Adding a New Backend Hook
1. Create hook file in `src/hooks/backend/`
2. Use `useBackendRequests` for API calls
3. Add Privy authentication
4. Implement error logging
5. Add tests with mocked fetch

### Adding a New Transaction Hook
1. Create hook file in `src/hooks/transactions/`
2. Use `usePrivyTransaction` for smart account support
3. Add gas estimation logic
4. Implement success/error callbacks
5. Test with mock contract interactions

### Adding a Bridge Integration
1. Create hook in `src/hooks/bridge/`
2. Implement provider-specific logic
3. Add fallback to alternative providers
4. Cache quotes with TTL
5. Test multi-provider scenarios

## Integration Points

### External Dependencies
- **Privy SDK**: Authentication and embedded wallets
- **Wagmi/Viem**: Blockchain interactions
- **Relay SDK**: Cross-chain bridging
- **Socket API**: Alternative bridge provider
- **Curator API**: Backend services

### Internal Dependencies
- **Contexts**: All hooks can access global state through context hooks
- **Helpers**: Utility functions for formatting, validation, calculations
- **Types**: Shared TypeScript definitions
- **Constants**: Environment variables, contract addresses

## Performance Considerations

### Memoization Strategy
```typescript
// Only memoize expensive computations
const expensiveResult = useMemo(() => {
  return performExpensiveCalculation(data);
}, [data]);

// Don't over-memoize simple operations
const isValid = amount > 0; // No need for useMemo
```

### Request Optimization
- **Debounce**: User input (300ms delay)
- **Throttle**: Price updates (10s interval)
- **Cache**: Quotes (5s TTL)
- **Deduplicate**: In-flight requests

## Security Best Practices

### Never Log Sensitive Data
```typescript
// ❌ Bad
console.log('Private key:', privateKey);

// ✅ Good
console.log('Address:', address);
```

### Input Validation
```typescript
// Always validate before blockchain operations
if (!isAddress(recipient)) {
  throw new Error('Invalid recipient address');
}

if (amount <= 0n) {
  throw new Error('Invalid amount');
}
```

### BigInt Serialization
```typescript
// Use helper functions for safe storage
import { safeStringify, safeParse } from '@helpers/bigIntSerialization';

localStorage.setItem('data', safeStringify(bigIntData));
const restored = safeParse(stored, ['amount', 'balance']);
```

Remember: Hooks should be pure, predictable, and testable. They abstract complex logic while maintaining clean component interfaces.