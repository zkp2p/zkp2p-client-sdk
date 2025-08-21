# Context Hooks - Development Context

## Overview
This directory contains React hooks that provide convenient access to the application's context providers. These hooks serve as the primary interface for components to interact with global state, following a consistent pattern that includes validation and error handling.

## Key Files and Structure
```
src/hooks/contexts/
├── useAccount.ts               # Privy authentication and wallet state
├── useSmartAccount.ts          # EIP-7702 smart account authorization
├── useSmartContracts.ts        # Contract instances and network config
├── useTokenData.ts             # Dynamic multi-chain token data
├── useBalances.ts              # Token balances across chains
├── useEscrow.ts                # Intent and escrow state
├── useDeposits.ts              # Liquidity deposits management
├── useLiquidity.ts             # Global liquidity analytics
├── useOnRamperIntents.ts       # User's active swap intents
├── useBackend.ts               # Backend API integration
├── useExtensionProxyProofs.ts  # Browser extension communication
├── useGeolocation.ts           # User location services
├── useModal.ts                 # Modal state management
└── index.ts                    # Re-exports all hooks
```

## Architecture Patterns

### Standard Context Hook Pattern
Most hooks follow this simple wrapper pattern:

```typescript
import { useContext } from 'react';
import { SomeContext } from '@contexts/Some/SomeContext';

export const useSome = () => {
  const context = useContext(SomeContext);
  
  if (!context) {
    throw new Error('useSome must be used within SomeProvider');
  }
  
  return context;
};
```

### Validated Context Hook Pattern
Critical contexts use additional validation:

```typescript
export const useSmartContracts = () => {
  const context = useContext(SmartContractsContext);
  
  if (!context) {
    throw new Error('useSmartContracts must be used within SmartContractsProvider');
  }
  
  // Additional validation for required properties
  if (!context.escrowContract || !context.usdcContract) {
    console.warn('Smart contracts not fully initialized');
  }
  
  return context;
};
```

### Hook Categories

#### Authentication & Wallet Hooks
**`useAccount()`**
- Privy authentication state
- Wallet connection management
- User profile data
- Login/logout actions

**`useSmartAccount()`**
- EIP-7702 authorization status
- Gas sponsorship tracking
- Smart account capabilities
- Kernel client access

#### Blockchain State Hooks
**`useSmartContracts()`**
- Contract addresses and ABIs
- Network configuration
- Chain-specific instances
- Contract interaction helpers

**`useBalances()`**
- Multi-token balance tracking
- Real-time balance updates
- Cross-chain balance aggregation
- Native and ERC20 tokens

**`useEscrow()`**
- Active swap intents
- Intent lifecycle management
- Escrow state tracking
- Wagmi-based polling

**`useDeposits()`**
- Liquidity provider deposits
- Order management
- Deposit analytics
- User deposit tracking

#### Data Service Hooks
**`useTokenData()`**
- Dynamic token discovery
- Multi-chain token metadata
- Search functionality
- Relay API integration

**`useLiquidity()`**
- Global liquidity metrics
- Platform analytics
- Market depth data
- Batch data fetching

**`useOnRamperIntents()`**
- User's active intents
- Intent status tracking
- Transaction history
- Intent lifecycle

#### External Service Hooks
**`useBackend()`**
- Curator API client
- Privy token authentication
- Payee details management
- Owner deposits tracking

**`useExtensionProxyProofs()`**
- Browser extension messaging
- ZK proof generation
- Platform metadata
- Version compatibility

#### UI Service Hooks
**`useGeolocation()`**
- User location data
- Currency defaults
- Platform suggestions
- Compliance checks

**`useModal()`**
- Centralized modal control
- Modal state coordination
- Overlay management
- Focus trapping

## Development Guidelines

### Using Context Hooks
```typescript
// Import from centralized location
import { useAccount, useSmartContracts, useEscrow } from '@hooks/contexts';

const MyComponent = () => {
  // Access multiple contexts
  const { authenticatedUser, login } = useAccount();
  const { escrowContract } = useSmartContracts();
  const { intents, refetch } = useEscrow();
  
  // Use context data
  if (!authenticatedUser) {
    return <button onClick={login}>Connect Wallet</button>;
  }
  
  return <IntentList intents={intents} />;
};
```

### Error Boundary Integration
```typescript
// Hooks throw errors when used outside providers
const SafeComponent = () => {
  try {
    const context = useSmartContracts();
    return <div>{/* Component logic */}</div>;
  } catch (error) {
    console.error('Context not available:', error);
    return <div>Loading...</div>;
  }
};
```

### Performance Optimization
```typescript
// Destructure only needed properties
const { refetch } = useEscrow(); // Don't pull entire context

// Memoize derived values
const sortedIntents = useMemo(() => {
  return intents.sort((a, b) => b.timestamp - a.timestamp);
}, [intents]);
```

## Testing Strategy

### Mock Pattern
```typescript
import { vi } from 'vitest';

// Mock individual hook
export const mockUseAccount = vi.fn(() => ({
  authenticatedUser: { 
    id: '0x123',
    email: 'test@example.com'
  },
  login: vi.fn(),
  logout: vi.fn(),
  loginState: 'authenticated'
}));

vi.mock('@hooks/contexts/useAccount', () => ({
  useAccount: mockUseAccount
}));
```

### Testing Components with Hooks
```typescript
import { renderHook } from '@testing-library/react';
import { AccountProvider } from '@contexts/Account';

describe('useAccount', () => {
  it('should provide account context', () => {
    const wrapper = ({ children }) => (
      <AccountProvider>{children}</AccountProvider>
    );
    
    const { result } = renderHook(() => useAccount(), { wrapper });
    
    expect(result.current).toHaveProperty('authenticatedUser');
    expect(result.current).toHaveProperty('login');
  });
  
  it('should throw when used outside provider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useAccount());
    }).toThrow('useAccount must be used within AccountProvider');
    
    spy.mockRestore();
  });
});
```

## Common Tasks

### Accessing User Authentication
```typescript
const { authenticatedUser, loginState, logout } = useAccount();

if (loginState === 'authenticated' && authenticatedUser) {
  console.log(`Logged in as ${authenticatedUser.email}`);
}
```

### Getting Contract Instances
```typescript
const { escrowContract, usdcContract, currentChain } = useSmartContracts();

// Use contract for reads
const balance = await usdcContract.read.balanceOf([userAddress]);
```

### Managing Modal State
```typescript
const { modalType, openModal, closeModal } = useModal();

// Open a specific modal
openModal('SWAP_MODAL', { intentId: 123 });

// Close current modal
closeModal();
```

### Tracking Smart Account Status
```typescript
const { 
  isSmartAccountEnabled,
  eip7702AuthorizationStatus,
  gasSponsorshipStats 
} = useSmartAccount();

if (isSmartAccountEnabled) {
  console.log(`Gas saved: $${gasSponsorshipStats.totalGasSavedUSD}`);
}
```

## Integration Points

### Provider Hierarchy
Hooks must be used within their corresponding providers:
```typescript
<AccountProvider>
  <SmartAccountProvider>
    <SmartContractsProvider>
      <TokenDataProvider>
        <BalancesProvider>
          <EscrowProvider>
            <DepositsProvider>
              {/* Components can use hooks here */}
            </DepositsProvider>
          </EscrowProvider>
        </BalancesProvider>
      </TokenDataProvider>
    </SmartContractsProvider>
  </SmartAccountProvider>
</AccountProvider>
```

### Cross-Context Communication
```typescript
// Contexts often depend on each other
const { authenticatedUser } = useAccount();
const { refetch: refetchBalances } = useBalances();
const { refetch: refetchDeposits } = useDeposits();

// Coordinate updates across contexts
const handleTransaction = async () => {
  await performTransaction();
  
  // Refresh related data
  await Promise.all([
    refetchBalances(),
    refetchDeposits()
  ]);
};
```

### Wagmi Integration (August 2025 Migration)
Many hooks now use wagmi for blockchain state:
```typescript
// Old pattern - manual fetching
const fetchData = async () => {
  const data = await contract.read.getData();
  setData(data);
};

// New pattern - wagmi hooks
const { data, refetch } = useReadContract({
  address: contractAddress,
  abi: contractAbi,
  functionName: 'getData',
  enabled: Boolean(shouldFetch)
});
```

## Security Considerations

### Authentication Validation
```typescript
const { authenticatedUser, loginState } = useAccount();

// Always check authentication before sensitive operations
if (loginState !== 'authenticated' || !authenticatedUser) {
  throw new Error('User must be authenticated');
}
```

### Data Freshness
```typescript
const { data, dataUpdatedAt } = useEscrow();

// Check data age for critical operations
const isStale = Date.now() - dataUpdatedAt > 30000; // 30 seconds
if (isStale) {
  await refetch();
}
```

### Error Handling
```typescript
const SafeHookConsumer = () => {
  try {
    const context = useSmartContracts();
    return <div>{/* Use context */}</div>;
  } catch (error) {
    // Handle missing provider gracefully
    return <div>Application loading...</div>;
  }
};
```

## Performance Considerations

### Selective Imports
```typescript
// Import only needed hooks
import { useAccount } from '@hooks/contexts/useAccount';
// Instead of
import { useAccount } from '@hooks/contexts'; // Imports all
```

### Memoization
```typescript
const Component = () => {
  const { intents } = useEscrow();
  
  // Memoize expensive computations
  const activeIntents = useMemo(() => {
    return intents.filter(i => i.status === 'OPEN');
  }, [intents]);
  
  return <IntentList intents={activeIntents} />;
};
```

### Subscription Management
```typescript
// Hooks automatically handle cleanup
useEffect(() => {
  const unsubscribe = subscribeToUpdates();
  return unsubscribe; // Cleanup on unmount
}, []);
```

### Batching Updates
```typescript
// Batch multiple context updates
const handleBatchUpdate = () => {
  startTransition(() => {
    updateContext1();
    updateContext2();
    updateContext3();
  });
};
```