# Backend API Integration Hooks - Component Context

## Purpose
This document provides comprehensive guidance for working with backend API integration hooks in the ZKP2P V2 client. These hooks manage communication with the curator backend services, handling authentication, data fetching, mutations, and quote operations with consistent error handling and loading states.

## Current Status: Active
The backend hooks architecture is mature with 11 specialized hooks managing different aspects of API communication. All hooks follow the established Privy authentication pattern and provide consistent interfaces for loading states and error handling.

## Component-Specific Development Guidelines

### Core Technologies
- **Privy Authentication**: JWT token management via `usePrivy().getAccessToken()`
- **Fetch API**: Native browser fetch for HTTP requests
- **TypeScript**: Strict typing for all request/response objects
- **Error Logging**: Integrated `useErrorLogger` for structured error reporting
- **Debouncing**: Lodash debounce for preventing excessive API calls

### Hook Organization
```
src/hooks/backend/
├── __tests__/              # Unit tests for backend hooks
├── useGetDeposit.ts         # Individual deposit retrieval
├── useGetDepositOrders.ts   # Orders for specific deposit
├── useGetIntentStats.ts     # Trading volume statistics
├── useGetOwnerDeposits.ts   # User's liquidity deposits
├── useGetOwnerIntents.ts    # User's active trading intents
├── useGetPayeeDetails.ts    # Payment recipient information
├── usePostDepositDetails.ts # Create/update deposit information
├── useQuoteMaxTokenForFiat.ts # Token amount quotes
├── useQuoteMinFiatForToken.ts # Fiat amount quotes
├── useSignIntent.ts         # Intent signature and verification
└── useValidatePayeeDetails.ts # Payment validation
```

## Major Subsystem Organization

### Data Fetching Hooks (GET Operations)
**Purpose**: Retrieve read-only data with caching and refresh capabilities

- **useGetOwnerDeposits**: User's liquidity provider deposits with status filtering
- **useGetOwnerIntents**: Active swap intents for buyers
- **useGetDeposit**: Individual deposit details by ID
- **useGetDepositOrders**: Orders associated with specific deposit
- **useGetIntentStats**: Platform trading statistics and volumes
- **useGetPayeeDetails**: Payment recipient verification data

### Mutation Hooks (POST/PUT Operations)
**Purpose**: Create or modify backend state with optimistic updates

- **usePostDepositDetails**: Create or update liquidity deposits
- **useValidatePayeeDetails**: Validate payment recipient information
- **useSignIntent**: Create and sign trading intents

### Quote Hooks (Specialized GET Operations)
**Purpose**: Real-time pricing and conversion calculations

- **useQuoteMaxTokenForFiat**: Calculate maximum token amount for given fiat
- **useQuoteMinFiatForToken**: Calculate minimum fiat amount for given token

## Architectural Patterns

### Standard Backend Hook Pattern
```typescript
import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { RequestType, ResponseType } from "@helpers/types";
import { ErrorCategory } from "@helpers/types/errors";
import { useErrorLogger } from "@hooks/useErrorLogger";

const API_URL = import.meta.env.VITE_CURATOR_API_URL || "";

interface UseBackendHookReturn {
  data: ResponseType | null;
  isLoading: boolean;
  error: Error | null;
  fetchData: (params: RequestType) => Promise<ResponseType>;
}

export default function useBackendHook(): UseBackendHookReturn {
  // Authentication
  const { getAccessToken } = usePrivy();
  const { logError } = useErrorLogger();

  // State management
  const [data, setData] = useState<ResponseType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch implementation
  const fetchData = useCallback(async (params: RequestType): Promise<ResponseType> => {
    setIsLoading(true);
    setError(null);
    setData(null); // Clear stale data

    try {
      // Ensure authentication
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Authentication required");
      }

      // Make request
      const response = await fetch(`${API_URL}/v1/endpoint`, {
        method: "POST", // or "GET"
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(params), // Omit for GET requests
      });

      // Handle response
      if (!response.ok) {
        const errorText = await response.text();
        
        // Structured error logging
        logError(
          'API operation failed',
          ErrorCategory.API_ERROR,
          {
            url: `${API_URL}/v1/endpoint`,
            method: 'POST',
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText,
            hasAccessToken: !!accessToken,
            // Sanitize request params - remove PII
            requestType: typeof params,
            hasParams: !!params,
          }
        );
        
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const jsonResponse = await response.json() as ResponseType;
      setData(jsonResponse);
      return jsonResponse;
      
    } catch (err: any) {
      setError(err);
      throw err; // Re-throw for caller handling
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, logError]);

  return {
    data,
    isLoading,
    error,
    fetchData
  };
}
```

### Debounced Hook Pattern (Owner Deposits)
```typescript
import debounce from "lodash/debounce";

const FETCHING_DEBOUNCE_MS = 500;

export default function useGetOwnerDeposits() {
  const fetchOwnerDepositsImpl = useCallback(async (
    ownerAddress: string, 
    options?: { status?: DepositStatus }
  ) => {
    // Implementation
  }, [getAccessToken]);

  // Debounced wrapper to prevent excessive calls
  const fetchOwnerDeposits = useCallback(
    debounce<(...args: any[]) => Promise<void>>(
      (ownerAddress: string, options?: { status?: DepositStatus }) => {
        return fetchOwnerDepositsImpl(ownerAddress, options);
      },
      FETCHING_DEBOUNCE_MS,
      { leading: true } // Execute immediately on first call
    ),
    [fetchOwnerDepositsImpl]
  );

  return {
    data,
    isLoading,
    error,
    fetchOwnerDeposits
  };
}
```

### Date Processing Pattern
```typescript
/**
 * Convert API date strings to Date objects
 * Backend returns ISO date strings that need client-side parsing
 */
const convertDatesToObjects = (item: any): ProcessedType => {
  return {
    ...item,
    createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
    // Handle nested objects with dates
    nested: item.nested?.map((nestedItem: any) => ({
      ...nestedItem,
      createdAt: nestedItem.createdAt ? new Date(nestedItem.createdAt) : undefined,
    }))
  };
};

// Apply transformation in fetch response handling
const processedData = responseData.map(convertDatesToObjects);
setData(processedData);
```

### Quote Hooks Pattern
```typescript
export default function useQuoteMaxTokenForFiat() {
  // Standard state management
  const [quoteData, setQuoteData] = useState<QuoteResponse | null>(null);
  
  const fetchQuote = useCallback(async (params: QuoteRequest) => {
    // Validate required parameters
    if (!params.depositId || !params.fiatAmount || !params.currencyId) {
      throw new Error("Missing required quote parameters");
    }

    const response = await fetch(`${API_URL}/v1/quotes/max-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        depositId: params.depositId,
        fiatAmount: params.fiatAmount,
        currencyId: params.currencyId,
        // Include platform-specific parameters
        platform: params.platform,
        paymentMethod: params.paymentMethod,
      }),
    });

    return response.json();
  }, [getAccessToken]);

  return {
    quoteData,
    isLoading,
    error,
    fetchQuote
  };
}
```

## Integration Points

### Environment Configuration
```typescript
// All hooks use consistent environment variable access
const API_URL = import.meta.env.VITE_CURATOR_API_URL || "";

// Validation on module load
if (!API_URL) {
  console.error("VITE_CURATOR_API_URL is not set. Please check your environment variables.");
}
```

### Privy Authentication Integration
```typescript
import { usePrivy } from "@privy-io/react-auth";

// Standard authentication pattern across all hooks
const { getAccessToken } = usePrivy();

const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const accessToken = await getAccessToken();
  
  if (!accessToken) {
    throw new Error("Authentication required");
  }

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
};
```

### Error Logging Integration
```typescript
import { useErrorLogger } from "@hooks/useErrorLogger";
import { ErrorCategory } from "@helpers/types/errors";

// Structured error logging with PII sanitization
const { logError } = useErrorLogger();

logError(
  'API operation failed',
  ErrorCategory.API_ERROR,
  {
    // Request context
    url: `${API_URL}/v1/endpoint`,
    method: 'POST',
    status: response.status,
    statusText: response.statusText,
    
    // Error details
    errorBody: errorText,
    hasAccessToken: !!accessToken,
    
    // Sanitized request data (no PII)
    requestParams: {
      depositId: params.depositId,
      tokenAmount: params.tokenAmount,
      // DO NOT log: addresses, payee details, personal info
      hasToAddress: !!params.toAddress,
      hasPayeeDetails: !!params.payeeDetails,
      fiatCurrencyCode: params.fiatCurrencyCode,
    }
  }
);
```

### Type Safety Integration
```typescript
// Import types from centralized location
import { 
  Deposit, 
  Intent, 
  QuoteRequest, 
  QuoteResponse,
  DepositStatus,
  PayeeDetails 
} from "@helpers/types/curator";

// Use strict typing for all parameters and returns
export default function useBackendHook(): UseBackendHookReturn<ResponseType> {
  const [data, setData] = useState<ResponseType | null>(null);
  
  const fetchData = useCallback(async (
    params: RequestType
  ): Promise<ResponseType> => {
    // TypeScript ensures type safety
  }, []);
}
```

## Development Patterns

### Loading State Management
```typescript
// Separate loading states for different operations
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);

// Clear states on new request
const fetchData = useCallback(async (params) => {
  setIsLoading(true);
  setError(null);
  setData(null); // Prevent stale data display
  
  try {
    // Fetch logic
  } catch (err) {
    setError(err);
  } finally {
    setIsLoading(false);
  }
}, []);
```

### Error Handling Strategy
```typescript
// Three-tier error handling:
// 1. HTTP-level errors (response.ok check)
// 2. JSON parsing errors
// 3. Application-level errors (invalid data)

try {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Validate response structure
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response format');
  }
  
  return data;
} catch (err) {
  if (err instanceof TypeError) {
    // Network error
    throw new Error('Network error: Please check your connection');
  } else {
    // Re-throw application errors
    throw err;
  }
}
```

### Request Deduplication
```typescript
// Prevent duplicate requests using ref-based tracking
const activeRequestRef = useRef<Promise<ResponseType> | null>(null);

const fetchData = useCallback(async (params: RequestType) => {
  // Return existing promise if request is in flight
  if (activeRequestRef.current) {
    return activeRequestRef.current;
  }
  
  const requestPromise = performFetch(params);
  activeRequestRef.current = requestPromise;
  
  try {
    const result = await requestPromise;
    return result;
  } finally {
    activeRequestRef.current = null;
  }
}, []);
```

### Caching Strategy
```typescript
// Simple in-memory caching for expensive operations
const cacheRef = useRef<Map<string, { data: ResponseType; timestamp: number }>>(new Map());
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const fetchWithCache = useCallback(async (params: RequestType) => {
  const cacheKey = JSON.stringify(params);
  const cached = cacheRef.current.get(cacheKey);
  
  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    setData(cached.data);
    return cached.data;
  }
  
  // Fetch fresh data
  const freshData = await performFetch(params);
  
  // Update cache
  cacheRef.current.set(cacheKey, {
    data: freshData,
    timestamp: Date.now()
  });
  
  return freshData;
}, []);
```

## Common Usage Patterns

### Component Integration
```typescript
const SwapComponent = () => {
  const { data: signedIntent, isLoading, error, fetchSignedIntent } = useSignIntent();
  const { data: deposits, fetchOwnerDeposits } = useGetOwnerDeposits();
  
  // Trigger fetch on component mount or dependency change
  useEffect(() => {
    if (userAddress) {
      fetchOwnerDeposits(userAddress, { status: 'ACTIVE' });
    }
  }, [userAddress, fetchOwnerDeposits]);
  
  const handleCreateIntent = async () => {
    try {
      const intent = await fetchSignedIntent({
        processorName: 'VENMO',
        depositId: selectedDeposit.id,
        tokenAmount: amount,
        // ... other params
      });
      
      // Handle successful intent creation
      toast.success('Intent created successfully');
    } catch (error) {
      toast.error('Failed to create intent');
    }
  };
  
  if (isLoading) return <Spinner />;
  if (error) return <WarningTextBox>{error.message}</WarningTextBox>;
  
  return (
    <div>
      {/* Component UI */}
    </div>
  );
};
```

### Conditional Fetching
```typescript
const ConditionalFetchComponent = () => {
  const { fetchData } = useBackendHook();
  const { account } = useAccount();
  const { networkIsCorrect } = useSmartContracts();
  
  // Only fetch when conditions are met
  const [shouldFetch, setShouldFetch] = useState(false);
  
  useEffect(() => {
    const canFetch = Boolean(
      account && 
      account !== ZERO_ADDRESS && 
      networkIsCorrect
    );
    
    setShouldFetch(canFetch);
  }, [account, networkIsCorrect]);
  
  useEffect(() => {
    if (shouldFetch) {
      fetchData(params);
    }
  }, [shouldFetch, fetchData]);
};
```

## Common Pitfalls & Solutions

### Pitfall: Memory Leaks in Async Operations
```typescript
// ❌ Avoid - Can set state after component unmount
useEffect(() => {
  fetchData().then(setData);
}, []);

// ✅ Prefer - Cleanup tracking
useEffect(() => {
  let mounted = true;
  
  const loadData = async () => {
    try {
      const result = await fetchData();
      if (mounted) {
        setData(result);
      }
    } catch (error) {
      if (mounted) {
        setError(error);
      }
    }
  };
  
  loadData();
  
  return () => {
    mounted = false;
  };
}, [fetchData]);
```

### Pitfall: Stale Closure in Callbacks
```typescript
// ❌ Avoid - Dependencies not properly tracked
const fetchData = useCallback(async () => {
  const token = await getAccessToken();
  // ... fetch logic
}, []); // Missing getAccessToken dependency

// ✅ Prefer - Complete dependency array
const fetchData = useCallback(async () => {
  const token = await getAccessToken();
  // ... fetch logic
}, [getAccessToken]);
```

### Pitfall: Unhandled Promise Rejections
```typescript
// ❌ Avoid - Silent failures
const handleClick = () => {
  fetchData(params); // Promise rejection not handled
};

// ✅ Prefer - Explicit error handling
const handleClick = async () => {
  try {
    await fetchData(params);
    toast.success('Operation completed');
  } catch (error) {
    toast.error(`Operation failed: ${error.message}`);
  }
};
```

### Pitfall: Race Conditions
```typescript
// ❌ Avoid - Multiple concurrent requests
const Component = () => {
  const { fetchData } = useBackendHook();
  
  useEffect(() => {
    fetchData(params1);
    fetchData(params2); // Can overwrite results
  }, []);
};

// ✅ Prefer - Sequential or controlled concurrency
const Component = () => {
  const { fetchData } = useBackendHook();
  
  useEffect(() => {
    const loadData = async () => {
      await fetchData(params1);
      await fetchData(params2);
    };
    
    loadData();
  }, [fetchData]);
};
```

## Testing Approach

### Unit Testing Pattern
```typescript
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import useSignIntent from '../useSignIntent';

// Mock dependencies
vi.mock('@privy-io/react-auth', () => ({
  usePrivy: () => ({
    getAccessToken: vi.fn().mockResolvedValue('mock-token')
  })
}));

vi.mock('@hooks/useErrorLogger', () => ({
  useErrorLogger: () => ({
    logError: vi.fn()
  })
}));

// Mock fetch
global.fetch = vi.fn();

describe('useSignIntent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should fetch signed intent successfully', async () => {
    const mockResponse = { intentId: '123', signature: '0xabc' };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });
    
    const { result } = renderHook(() => useSignIntent());
    
    await act(async () => {
      const response = await result.current.fetchSignedIntent({
        processorName: 'VENMO',
        depositId: 'dep1',
        tokenAmount: '1000000',
        // ... other params
      });
      
      expect(response).toEqual(mockResponse);
    });
    
    expect(result.current.data).toEqual(mockResponse);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
  
  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: () => Promise.resolve('Invalid request')
    });
    
    const { result } = renderHook(() => useSignIntent());
    
    await act(async () => {
      try {
        await result.current.fetchSignedIntent(mockParams);
      } catch (error) {
        expect(error.message).toContain('Bad Request');
      }
    });
    
    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeNull();
  });
});
```

### Integration Testing
```typescript
// Test with actual API endpoints (staging)
const STAGING_API_URL = 'https://api-staging.zkp2p.xyz';

describe('Backend Integration Tests', () => {
  it('should handle real API responses', async () => {
    const { result } = renderHook(() => useGetOwnerDeposits());
    
    await act(async () => {
      await result.current.fetchOwnerDeposits('0x123...', { status: 'ACTIVE' });
    });
    
    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});
```

## Migration Guide

### Adding New Backend Hook
1. Create new hook file following naming convention
2. Implement standard pattern with authentication
3. Add TypeScript interfaces for request/response
4. Integrate error logging with PII sanitization
5. Add unit tests with mocked dependencies
6. Document API endpoint and parameters
7. Export from index file if needed

### Updating Existing Hook
1. Maintain backward compatibility for return interface
2. Add new parameters as optional
3. Update TypeScript types
4. Test with existing consumers
5. Update documentation

## Best Practices Checklist

- [ ] Privy authentication with token validation
- [ ] Structured error logging with PII sanitization
- [ ] TypeScript interfaces for all requests/responses
- [ ] Loading and error state management
- [ ] Request deduplication for expensive operations
- [ ] Proper cleanup to prevent memory leaks
- [ ] Consistent naming conventions
- [ ] Unit tests with mocked dependencies
- [ ] Environment variable validation
- [ ] Graceful error handling with user feedback

Remember: These hooks handle sensitive financial data and user authentication. Always prioritize security, proper error handling, and data sanitization in logging.