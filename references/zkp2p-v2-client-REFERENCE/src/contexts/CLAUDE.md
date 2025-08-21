# State Management - Component Context

## Purpose
This document provides comprehensive guidance for working with React Context API state management in the ZKP2P V2 client. It covers the hierarchical provider architecture, context patterns, data flow principles, and best practices for managing global application state.

## Current Status: Active
The state management architecture is mature with 12 established contexts managing different aspects of the application. Future development should follow these patterns while being mindful of performance implications.

## Component-Specific Development Guidelines

### Core Technologies
- **React Context API**: Primary state management solution
- **TypeScript**: Strict typing for all context values
- **Wagmi Hooks**: Blockchain data integration
- **React Hooks**: useState, useEffect, useCallback for state logic

### Context File Structure
```
ContextName/
├── [ContextName]Context.ts    # Type definitions and context creation
├── [ContextName]Provider.tsx  # Implementation with state logic
└── index.ts                   # Re-exports for clean imports
```

### Context Creation Pattern
```typescript
// [ContextName]Context.ts
interface [ContextName]ContextType {
  // State values
  data: DataType | null;
  isLoading: boolean;
  
  // Actions
  refetchData: () => void;
  updateData: (newData: DataType) => void;
}

const [ContextName]Context = createContext<[ContextName]ContextType>({
  data: null,
  isLoading: false,
  refetchData: () => {},
  updateData: () => {},
});

export default [ContextName]Context;
```

## Major Subsystem Organization

### Provider Hierarchy (Order Matters!)
```
1. TokenDataProvider          # Base token metadata (independent)
2. AccountProvider            # User authentication state
3. SmartAccountProvider       # Smart account & EIP-7702 management
4. SmartContractsProvider     # Contract configurations
5. BalancesProvider           # Token balances
6. EscrowProvider             # Escrow contract state
7. DepositsProvider           # User deposits
8. LiquidityProvider          # Market liquidity
9. BackendProvider            # External API integration
10. ExtensionProxyProofsProvider # ZK proof generation
11. ModalSettingsProvider     # UI modal state
12. OnRamperIntentsProvider   # Active swap intents
13. GeolocationProvider       # User location
```

### Context Categories

#### Foundation Contexts
- **TokenData**: Token metadata, prices, and configurations
- **Account**: Authentication, wallet connection, user preferences
- **SmartAccount**: EIP-7702 authorization, gas sponsorship, UserOperations
- **SmartContracts**: Contract addresses, ABIs, network config

#### Business Logic Contexts
- **Balances**: User token balances and allowances
- **Escrow**: Trading contract state and deposit counter
- **Deposits**: Liquidity provider deposits and orders
- **Liquidity**: Global liquidity pool data
- **OnRamperIntents**: Active swap intents for buyers

#### Infrastructure Contexts
- **Backend**: External API client and payee details
- **ExtensionProxyProofs**: Browser extension proof generation
- **Geolocation**: User location for compliance
- **ModalSettings**: UI modal state management

## Architectural Patterns

### Provider Implementation Pattern
```typescript
export const [ContextName]Provider: React.FC<PropsWithChildren> = ({ children }) => {
  // Dependencies from other contexts
  const { dependency } = useDependencyContext();
  
  // Local state
  const [data, setData] = useState<DataType | null>(null);
  const [shouldFetch, setShouldFetch] = useState(false);
  
  // Conditional fetching based on dependencies
  useEffect(() => {
    if (dependency && otherCondition) {
      setShouldFetch(true);
    } else {
      setShouldFetch(false);
      setData(null); // Clean up on dependency loss
    }
  }, [dependency]);
  
  // Data fetching with wagmi hooks
  const { data: rawData, refetch } = useContractRead({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getData',
    enabled: shouldFetch,
  });
  
  // Process and set data
  useEffect(() => {
    if (rawData) {
      const processed = processData(rawData);
      setData(processed);
    }
  }, [rawData]);
  
  // Memoized context value
  const contextValue = useMemo(() => ({
    data,
    refetchData: refetch,
  }), [data, refetch]);
  
  return (
    <[ContextName]Context.Provider value={contextValue}>
      {children}
    </[ContextName]Context.Provider>
  );
};
```

### Conditional Data Fetching Pattern
```typescript
// Enable fetching only when dependencies are ready
const [shouldFetchData, setShouldFetchData] = useState<boolean>(false);

useEffect(() => {
  const canFetch = Boolean(
    account && 
    account !== ZERO_ADDRESS && 
    contractAddress && 
    networkIsCorrect
  );
  
  setShouldFetchData(canFetch);
  
  if (!canFetch) {
    // Clean up state when conditions aren't met
    setData(null);
    setError(null);
  }
}, [account, contractAddress, networkIsCorrect]);
```

### Batch Data Fetching Pattern (Liquidity)
```typescript
const BATCH_SIZE = 50;
const [currentBatch, setCurrentBatch] = useState(0);
const [allData, setAllData] = useState<DataType[]>([]);
const [hasMore, setHasMore] = useState(true);

const fetchBatch = useCallback(async () => {
  const startIdx = currentBatch * BATCH_SIZE;
  const endIdx = startIdx + BATCH_SIZE;
  
  const batchData = await fetchDataRange(startIdx, endIdx);
  
  if (batchData.length < BATCH_SIZE) {
    setHasMore(false);
  }
  
  setAllData(prev => [...prev, ...batchData]);
  setCurrentBatch(prev => prev + 1);
}, [currentBatch]);
```

### Error Handling Pattern
```typescript
const [error, setError] = useState<Error | null>(null);

// In data fetching
try {
  const result = await fetchData();
  setData(result);
  setError(null);
} catch (err) {
  console.error('Failed to fetch data:', err);
  setError(err as Error);
  setData(null);
}

// Expose error state in context
const contextValue = {
  data,
  error,
  isLoading,
  hasError: Boolean(error),
};
```

## Integration Points

### Context Dependencies
```
TokenData (Independent)
    ↓
Account (Independent) 
    ↓
SmartContracts (needs Account for network)
    ↓         ↓
Balances   Escrow (need SmartContracts)
    ↓         ↓
Deposits  Liquidity (need multiple contexts)
    ↓
OnRamperIntents (needs Deposits)
```

### Wagmi Integration
```typescript
import { useContractRead, useBalance, useAccount } from 'wagmi';

// Reading contract data
const { data, refetch } = useContractRead({
  address: contractAddress,
  abi: contractAbi,
  functionName: 'methodName',
  enabled: shouldFetch,
  watch: true, // Auto-refresh on new blocks
});

// Getting token balances
const { data: balance } = useBalance({
  address: userAddress,
  token: tokenAddress,
  enabled: Boolean(userAddress && tokenAddress),
});
```

### Backend API Integration
```typescript
const BackendProvider = () => {
  const { getAccessToken } = usePrivy();
  
  const fetchWithAuth = useCallback(async (endpoint: string) => {
    const token = await getAccessToken();
    return fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }, [getAccessToken]);
  
  // Expose authenticated fetch in context
};
```

## Development Patterns

### Context Consumer Hook Pattern
```typescript
// hooks/contexts/use[ContextName].ts
import { useContext } from 'react';
import { [ContextName]Context } from '@contexts/[ContextName]';

export const use[ContextName] = () => {
  const context = useContext([ContextName]Context);
  
  if (!context) {
    throw new Error(
      'use[ContextName] must be used within [ContextName]Provider'
    );
  }
  
  return context;
};
```

### Optimistic Updates Pattern
```typescript
const updateData = useCallback(async (newValue: DataType) => {
  // Optimistically update UI
  setData(newValue);
  
  try {
    // Perform actual update
    await performUpdate(newValue);
    // Refetch to ensure consistency
    await refetch();
  } catch (error) {
    // Revert on failure
    setData(previousValue);
    throw error;
  }
}, [refetch, previousValue]);
```

### Local Storage Caching Pattern
```typescript
// Load from cache on mount
useEffect(() => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      setData(JSON.parse(cached));
    } catch (e) {
      console.error('Failed to parse cache:', e);
    }
  }
}, []);

// Update cache when data changes
useEffect(() => {
  if (data) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  }
}, [data]);
```

### Performance Optimization
```typescript
// Memoize context value to prevent unnecessary re-renders
const contextValue = useMemo(() => ({
  // Primitive values don't need memoization
  isLoading,
  error,
  
  // Objects and functions should be memoized
  data,
  refetchData: refetch,
  updateData,
}), [isLoading, error, data, refetch, updateData]);

// Use selective subscriptions in consumers
const Component = () => {
  // Only re-render when specific values change
  const { data } = useContext();
  const relevantData = useMemo(
    () => data?.filter(item => item.isRelevant),
    [data]
  );
};
```

## Common Pitfalls & Solutions

### Pitfall: Missing Dependencies
```typescript
// ❌ Avoid - Can cause stale closures
useEffect(() => {
  if (account) {
    fetchData(account);
  }
}, []); // Missing 'account' dependency

// ✅ Prefer
useEffect(() => {
  if (account) {
    fetchData(account);
  }
}, [account]);
```

### Pitfall: Memory Leaks
```typescript
// ❌ Avoid - Can set state after unmount
useEffect(() => {
  fetchData().then(setData);
}, []);

// ✅ Prefer - Cleanup on unmount
useEffect(() => {
  let mounted = true;
  
  fetchData().then(result => {
    if (mounted) {
      setData(result);
    }
  });
  
  return () => {
    mounted = false;
  };
}, []);
```

### Pitfall: Circular Dependencies
```typescript
// ❌ Avoid - Context A depends on B, B depends on A
const ContextA = () => {
  const { dataB } = useContextB();
};

const ContextB = () => {
  const { dataA } = useContextA();
};

// ✅ Prefer - Extract shared logic to parent context
const SharedContext = () => {
  // Shared state and logic
};
```

### Pitfall: Over-fetching
```typescript
// ❌ Avoid - Fetching on every render
const { data } = useContractRead({
  enabled: true, // Always enabled
});

// ✅ Prefer - Conditional fetching
const { data } = useContractRead({
  enabled: shouldFetch && hasValidInputs,
});
```

## Testing Approach

### Context Testing Pattern
```typescript
const MockProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const mockValue = {
    data: mockData,
    isLoading: false,
    error: null,
    refetchData: jest.fn(),
  };
  
  return (
    <[ContextName]Context.Provider value={mockValue}>
      {children}
    </[ContextName]Context.Provider>
  );
};

// Test component with context
test('uses context data', () => {
  render(
    <MockProvider>
      <ComponentUsingContext />
    </MockProvider>
  );
  
  expect(screen.getByText(mockData.value)).toBeInTheDocument();
});
```

### Integration Testing
```typescript
// Test multiple contexts together
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <TokenDataProvider>
      <AccountProvider>
        <SmartContractsProvider>
          {ui}
        </SmartContractsProvider>
      </AccountProvider>
    </TokenDataProvider>
  );
};
```

## Migration Guide

### Adding New Context
1. Create context directory structure
2. Define TypeScript interface for context value
3. Implement provider with standard patterns
4. Add to provider hierarchy in App.tsx
5. Create consumer hook
6. Document dependencies and purpose
7. Add tests

### Refactoring Existing Context
1. Identify current dependencies
2. Check for circular dependencies
3. Implement proper cleanup
4. Add error handling
5. Optimize with memoization
6. Update consumer components
7. Test thoroughly

## Best Practices Checklist

- [ ] TypeScript interfaces for all context values
- [ ] Proper dependency management in effects
- [ ] Cleanup functions for async operations
- [ ] Error handling with user feedback
- [ ] Memoized context values
- [ ] Conditional data fetching
- [ ] Proper null/undefined handling
- [ ] Loading states for async data
- [ ] Documentation of dependencies
- [ ] Tests for context logic