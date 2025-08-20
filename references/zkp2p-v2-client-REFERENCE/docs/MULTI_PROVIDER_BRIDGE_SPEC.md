# Multi-Provider Bridge System Specification

## Implementation Status

### ✅ Completed
- [x] Created bridge configuration system (`bridgeConfig.ts`) with primary/fallback provider preferences
- [x] Implemented unified bridge provider hook (`useBridgeProvider.ts`) with automatic fallback logic
- [x] Added TypeScript types and interfaces for bridge providers (`types/bridge.ts`)
- [x] Updated Send flow to use multi-provider system (`useSendWithBridge.ts`)
- [x] Updated Order flow (CompleteOrder) to use multi-provider system
- [x] Added provider information display in CompleteOrder UI (SwapDetails component)
- [x] Implemented adapter pattern for Socket bridge to match Relay/Bungee interface
- [x] Integrated with existing bridge monitoring system
- [x] Type-safe implementation with full TypeScript support

### 🚧 Improvements Needed
- [ ] Add unit tests for multi-provider fallback logic
- [ ] Add integration tests for provider switching scenarios

## Overview

The multi-provider bridge system enables ZKP2P to use multiple bridge providers (Bungee, Relay, Socket) with automatic fallback capabilities. This improves reliability and extends chain support coverage.

### Architecture

```
┌─────────────────────┐
│  useBridgeProvider  │ ← Unified Interface
└──────────┬──────────┘
           │
    ┌──────┴──────┬──────────────┐
    │             │              │
┌───▼───┐    ┌───▼───┐    ┌─────▼─────┐
│ Bungee │    │ Relay │    │  Socket   │
│Primary │    │Fallback│   │ Limited   │
└────────┘    └────────┘   └───────────┘
```

## Key Features

### 1. Configuration-Based Provider Selection
- **Primary Provider**: Bungee (EVM-optimized, competitive rates)
- **Fallback Provider**: Relay (broader chain support including Solana/Tron)
- **Simple Configuration**: No complex metrics-driven selection, just primary/fallback based on chain support

### 2. Automatic Fallback Logic
- Attempts primary provider first
- Falls back to secondary providers on failure
- Configurable retry attempts per provider
- Clear error categorization for fallback decisions

### 3. Unified Interface
All bridge providers expose the same interface through adapters:
```typescript
interface UnifiedBridgeProvider {
  name: BridgeProvider;
  getPrice: (params: GetPriceParameters) => Promise<any>;
  getQuote: (params: GetQuoteParameters) => Promise<Execute | null>;
  execute: (quote: Execute, onProgress?: ProgressCallback) => Promise<any>;
  isSupported: (fromChain: number, toChain: number) => boolean;
  isHealthy: () => Promise<boolean>;
}
```

## Implementation Details

### Core Files

#### 1. `/src/helpers/types/bridge.ts`
Defines types and interfaces for the bridge system:
- `BridgeProvider` enum (RELAY, SOCKET, BUNGEE)
- `BridgeProviderSelection` interface
- `UnifiedBridgeProvider` interface
- Configuration types

#### 2. `/src/helpers/bridgeConfig.ts`
Central configuration for bridge providers:
```typescript
export const BRIDGE_CONFIG: BridgeConfig = {
  providers: {
    [BridgeProvider.BUNGEE]: {
      enabled: true,
      priority: 1, // Primary provider
      supportedChains: { origins: BUNGEE_SUPPORTED_CHAINS, destinations: BUNGEE_SUPPORTED_CHAINS }
    },
    [BridgeProvider.RELAY]: {
      enabled: true,
      priority: 2, // Fallback provider
      supportedChains: { origins: RELAY_SUPPORTED_CHAINS, destinations: RELAY_SUPPORTED_CHAINS }
    }
  },
  defaults: {
    primaryProvider: BridgeProvider.BUNGEE,
    fallbackProvider: BridgeProvider.RELAY,
    enableAutoFallback: true,
    maxProvidersToTry: 3
  }
}
```

#### 3. `/src/hooks/useBridgeProvider.ts`
Unified hook that orchestrates multiple bridge providers:
- Manages provider selection based on chain support
- Implements automatic fallback on errors
- Provides consistent interface across all providers
- Integrates with bridge monitoring system

#### 4. `/src/hooks/useSendWithBridge.ts`
Updated to use the multi-provider system:
- Automatically selects best provider for route
- Shows provider information in bridge quotes
- Handles provider switching transparently

### Provider Support Matrix

| Provider | EVM Chains | Solana | Tron | Priority |
|----------|------------|---------|------|----------|
| Bungee   | ✅ All     | ✅     | ❌   | Primary  |
| Relay    | ✅ All     | ✅      | ✅   | Fallback |
| Socket   | ✅ Limited | ❌      | ❌   | Optional |

*Note: Bungee supports Solana using chain ID 89999 (different from our internal chain ID 1399811149)

### Error Handling & Fallback

Providers automatically fallback on these error types:
- `API_ERROR` - Provider API unavailable
- `BRIDGE_TIMEOUT` - Quote/execution timeout
- `NO_LIQUIDITY` - Insufficient liquidity
- `INVALID_ROUTE` - Route not supported

## Usage Examples

### Send Flow (Already Integrated)
```typescript
const { executeWithBridge, getBridgeQuote } = useSendWithBridge();

// Automatically uses best provider
const quote = await getBridgeQuote({
  amount: "100.5",
  recipient: "0x...",
  fromChain: 8453, // Base
  toChain: 1,      // Ethereum
  toToken: tokenData
});

// Quote includes provider information
console.log(quote.selectedProvider); // "BUNGEE"
console.log(quote.fallbackProviders); // ["RELAY"]
```

### Order Flow (CompleteOrder)
```typescript
const { getQuote, executeQuote, getCurrentProvider } = useBridgeProvider();

// Fetches quote with automatic provider selection
const quote = await getQuote(params);

// UI displays current provider
<SwapDetails quoteData={{
  ...parsedQuote,
  bridgeProvider: getCurrentProvider(),
  fallbackAttempts: fallbackAttempts.length
}} />
```

## Monitoring Integration

The system integrates with existing bridge monitoring:
- Tracks success/failure rates per provider
- Records retry attempts and fallback usage
- Provides metrics for provider performance
- All attempts logged with provider context

## Future Enhancements

1. **Additional Providers**: Easy to add new bridge providers by implementing the unified interface
2. **Smart Routing**: Could add more sophisticated routing based on fees/speed
3. **User Preferences**: Allow users to select preferred providers
4. **Provider Health Checks**: Proactive health monitoring to avoid failed attempts

## Migration Notes

### For Send Flow
No changes needed - already using `useSendWithBridge` which has been updated.

### For Order Flow (CompleteOrder)
Migration completed:
- Changed from `useRelayBridge` to `useBridgeProvider`
- Updated imports and function calls
- Added provider information to UI

### For New Features
Use `useBridgeProvider` directly or `useSendWithBridge` for send-specific flows.

## Testing Recommendations

1. **Unit Tests**
   - Provider selection logic
   - Fallback trigger conditions
   - Interface adapters

2. **Integration Tests**
   - Cross-chain quote fetching
   - Provider switching on failure
   - End-to-end bridge execution

3. **Manual Testing**
   - Test with primary provider disabled
   - Test with API errors to trigger fallback
   - Verify UI shows correct provider info