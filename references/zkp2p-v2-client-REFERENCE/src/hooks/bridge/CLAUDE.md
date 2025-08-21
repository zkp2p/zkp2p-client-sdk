# Bridge Integration - Development Context

## Overview
The bridge directory implements a sophisticated multi-provider cross-chain token bridging system supporting 80+ networks through Relay (primary) and Socket/Bungee (fallback) providers. The system handles automatic provider selection, fallback logic, gas sponsorship via smart accounts, and comprehensive monitoring.

## Key Files and Structure
```
src/hooks/bridge/
├── useBridgeProvider.ts        # Unified provider interface with automatic fallback
├── useRelayBridge.ts          # Reservoir Relay SDK integration (80+ chains)
├── useBungeeExchange.ts       # Socket.tech Bungee integration (EVM chains)
├── useSendWithBridge.ts       # High-level bridge execution with monitoring
├── useBridgeMonitoring.ts     # Bridge status tracking and analytics
└── __tests__/                 # Bridge hook tests
    └── useBridgeProvider.test.ts
```

## Architecture Patterns

### Multi-Provider Strategy
The system uses a priority-based provider selection with automatic fallback:
- **Primary**: Relay SDK (supports non-EVM chains, ERC-4337, gas sponsorship)
- **Fallback**: Socket/Bungee (competitive rates for EVM chains)
- **Selection Logic**: Based on chain support, feature requirements, and availability

### Provider Abstraction Layer
```typescript
// Unified interface regardless of underlying provider
interface BridgeQuote {
  provider: BridgeProvider;
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  fees: BridgeFees;
  estimatedTime: number;
  steps?: BridgeStep[];
}
```

### Smart Account Integration
The bridge system seamlessly integrates with EIP-7702 smart accounts:
- Extracts transaction calls from bridge quotes
- Bundles multiple transactions into UserOperations
- Automatic gas sponsorship for supported wallets
- Fallback to EOA transactions when needed

### Request Deduplication
Implements a 5-second TTL cache to prevent duplicate quote requests:
```typescript
const cacheKey = `${fromChain}-${toChain}-${amount}-${toToken.address}-${currentProvider}`;
```

## Development Guidelines

### Adding Bridge Support for New Chains
1. Verify provider support in `RELAY_SUPPORTED_CHAINS` or `BUNGEE_SUPPORTED_CHAINS`
2. Add chain-specific token mappings if needed
3. Test quote fetching and execution
4. Update chain normalization logic if provider uses different chain IDs

### Error Handling Patterns
The system categorizes errors for appropriate handling:
- **Immediate Retry**: Network errors, timeouts
- **Provider Fallback**: No routes, unsupported chains
- **User Action Required**: Insufficient balance, rejected transactions
- **Fatal**: Unknown errors, malformed responses

### Performance Considerations
- Quote caching with 5-second TTL reduces API calls
- Progressive backoff for status polling (3s → 30s max)
- Parallel provider attempts when appropriate
- Early termination on terminal states

## Testing Strategy

### Unit Tests
- Provider selection logic validation
- Fallback scenario testing
- Quote parsing and normalization
- Error categorization accuracy

### Integration Tests
- End-to-end bridge flow simulation
- Multi-provider fallback scenarios
- Smart account vs EOA execution paths
- Status monitoring and completion tracking

## Common Tasks

### Implementing a New Bridge Provider
1. Create hook file: `use[Provider]Bridge.ts`
2. Implement `BridgeProvider` interface
3. Add to `useBridgeProvider.ts` selection logic
4. Update provider configuration in `bridgeConfig.ts`
5. Test quote fetching and execution
6. Add provider-specific error handling

### Debugging Bridge Issues
1. Check `useBridgeMonitoring` for attempt metadata
2. Verify provider selection in console logs
3. Inspect quote response structure
4. Monitor network requests for API failures
5. Check smart account status for gas sponsorship issues

### Monitoring Bridge Performance
```typescript
// Access bridge monitoring data
const { attempts, getAttemptById } = useBridgeMonitoring();

// Track success rates by provider
const providerStats = attempts.reduce((acc, attempt) => {
  acc[attempt.provider] = acc[attempt.provider] || { success: 0, failed: 0 };
  if (attempt.status === 'completed') acc[attempt.provider].success++;
  if (attempt.status === 'failed') acc[attempt.provider].failed++;
  return acc;
}, {});
```

## Integration Points

### Token Data Context
- Fetches token metadata for bridge operations
- Validates token support across chains
- Provides token decimal information

### Smart Account Context
- Determines transaction execution path
- Handles gas sponsorship for UserOperations
- Manages EIP-7702 authorization state

### Transaction Hooks
- `usePrivyTransaction` for unified execution
- Automatic routing between EOA and smart account paths
- Transaction monitoring and error handling

### UI Components
- `SendForm` consumes bridge quotes
- `BridgeSuccessView` displays transaction status
- `ChainBreadcrumb` shows bridge route