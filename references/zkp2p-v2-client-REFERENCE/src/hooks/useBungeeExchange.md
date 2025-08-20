# useBungeeExchange Hook Documentation

## Overview

The `useBungeeExchange` hook provides seamless integration with the Bungee/Socket API for cross-chain token bridging. It enables users to bridge tokens between different EVM chains with support for both traditional EOA wallets and ERC-4337 smart accounts.

## Features

- **Multi-Chain Support**: Bridges tokens across 20+ EVM chains including Ethereum, Base, Polygon, Arbitrum, and more
- **Smart Account Integration**: Full ERC-4337 support with gas sponsorship via ZeroDev
- **Progress Tracking**: Real-time bridge transaction monitoring with completion detection
- **Error Handling**: Comprehensive error categorization and user-friendly messages
- **Bridge Monitoring**: Built-in analytics for success rates, costs, and performance

## Basic Usage

```typescript
import useBungeeExchange from '@hooks/useBungeeExchange';

function BridgeComponent() {
  const { getRelayPrice, getRelayQuote, executeRelayQuote } = useBungeeExchange();
  
  // Get price estimate
  const quote = await getRelayPrice({
    user: '0x...',
    recipient: '0x...',
    originChainId: 8453, // Base
    destinationChainId: 1, // Ethereum
    originCurrency: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
    destinationCurrency: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum USDC
    amount: '1000000', // 1 USDC in token units
    tradeType: 'EXACT_INPUT',
  });
  
  // Execute bridge transaction
  const result = await executeRelayQuote(quote, (progress) => {
    console.log('Bridge progress:', progress);
  });
}
```

## API Reference

### Core Functions

#### `getRelayPrice(params: GetPriceParameters)`

Fetches a price quote for bridging tokens between chains.

**Parameters:**
```typescript
interface GetPriceParameters {
  user: Address;                    // User's wallet address
  recipient: Address;               // Recipient address on destination chain
  originChainId: number;           // Source chain ID
  destinationChainId: number;      // Destination chain ID  
  originCurrency: Address;         // Source token address
  destinationCurrency: Address;    // Destination token address
  amount: string;                  // Amount in token units
  tradeType: 'EXACT_INPUT';       // Trade type (only EXACT_INPUT supported)
}
```

**Returns:**
```typescript
interface RelayPriceQuote {
  details: {
    currencyIn: {
      currency: { chainId: number; address: Address };
      amount: string;
      amountFormatted: string;
    };
    currencyOut: {
      currency: { chainId: number; address: Address };
      amount: string;
      amountFormatted: string;
      amountUsd: string;
    };
    recipient: Address;
    timeEstimate: number; // seconds
  };
  fees: {
    gas: { amountUsd: string };
    relayer: { amountUsd: string };
  };
  _bungeeRoute: any; // Raw Bungee/Socket route data
}
```

#### `getRelayQuote(params: GetQuoteParameters)`

Gets a detailed quote with transaction data required for execution.

**Parameters:**
```typescript
interface GetQuoteParameters {
  wallet?: any;                    // Wallet instance (optional)
  chainId: number;                 // Source chain ID
  toChainId: number;              // Destination chain ID
  amount: string;                  // Amount in token units
  currency: Address;               // Source token address
  toCurrency: Address;            // Destination token address
  tradeType: 'EXACT_INPUT';       // Trade type
  recipient: Address;              // Recipient address
}
```

**Returns:**
```typescript
interface RelayQuote extends RelayPriceQuote {
  steps: BridgeStep[];            // Execution steps
  _approvalData?: {               // Token approval data (if needed)
    tokenAddress: Address;
    allowanceTarget: Address;
    minimumApprovalAmount: string;
  };
}
```

#### `executeRelayQuote(quote: RelayQuote, onProgress?: ProgressCallback)`

Executes the bridge transaction with optional progress tracking.

**Parameters:**
- `quote`: The quote object from `getRelayQuote`
- `onProgress`: Optional callback for progress updates

**Returns:**
```typescript
interface BridgeExecutionResult {
  transactionHash?: string;       // EOA transaction hash
  userOpHash?: string;           // Smart account UserOperation hash
  success: boolean;              // Execution success
  txHashes?: Array<{            // All transaction hashes
    txHash: string;
    chainId: number;
  }>;
}
```

## Supported Chains

The hook supports bridging between these EVM chains:

- **Ethereum Mainnet** (1)
- **Base** (8453) 
- **Polygon** (137)
- **Arbitrum One** (42161)
- **Optimism** (10)
- **Avalanche** (43114)
- **BSC** (56)
- **Fantom** (250)
- **zkSync Era** (324)
- **Polygon zkEVM** (1101)
- **Linea** (59144)
- **Scroll** (534352)
- **Blast** (81457)
- **Mantle** (5000)
- **Mode** (34443)
- **Zora** (7777777)
- **Gnosis Chain** (100)
- **Aurora** (1313161554)

**Unsupported:** Solana, Tron, and other non-EVM chains will return `null` from price queries.

## Smart Account Support

The hook automatically detects and uses ERC-4337 smart accounts when available:

```typescript
// Smart account execution (gas-free for users)
if (isSmartAccountEnabled && kernelClient) {
  // Batches approval + bridge into single UserOperation
  const userOpCalls = [];
  
  // Add approval if needed
  if (needsApproval) {
    userOpCalls.push({
      to: tokenAddress,
      data: approvalCalldata,
      value: BigInt(0),
    });
  }
  
  // Add bridge transaction
  userOpCalls.push(bridgeTransaction);
  
  // Execute as UserOperation with gas sponsorship
  const userOpHash = await kernelClient.sendUserOperation({
    userOperation: await kernelClient.prepareUserOperationRequest({
      userOperation: { callData: encodeBatchExecute(userOpCalls) }
    })
  });
}
```

## Progress Tracking

Bridge transactions provide detailed progress updates:

```typescript
interface BridgeProgress {
  steps: BridgeStep[];                    // All execution steps
  currentStepItem: BridgeStepItem;       // Current step being executed
  txHashes: Array<{                      // Transaction hashes from both chains
    txHash: string;
    chainId: number;
  }>;
  fillStatuses?: FillStatus[];           // Bridge completion status
}

// Usage
await executeRelayQuote(quote, (progress) => {
  const { currentStepItem, txHashes } = progress;
  
  if (currentStepItem.progressState === 'validating') {
    console.log('Validating bridge completion...');
  }
  
  if (txHashes.length === 2) {
    console.log('Bridge completed on both chains!');
  }
});
```

## Error Handling

The hook provides comprehensive error handling with categorized error types:

```typescript
// Chain validation errors
try {
  const quote = await getRelayPrice(params);
} catch (error) {
  if (error.message.includes('Solana')) {
    // Handle unsupported chain
    showFallbackBridgeOptions();
  }
}

// Bridge execution errors
try {
  const result = await executeRelayQuote(quote);
} catch (error) {
  if (error.message.includes('insufficient gas')) {
    // Handle gas estimation failure
  } else if (error.message.includes('Wallet not connected')) {
    // Handle wallet connection issue
  }
}
```

## Bridge Monitoring Integration

The hook automatically tracks bridge performance and success rates:

```typescript
// Metrics are tracked automatically
const {
  startBridgeAttempt,
  completeBridgeAttempt,
  failBridgeAttempt,
  metrics
} = useBridgeMonitoring();

// Access analytics
console.log('Bridge success rate:', metrics.successRate);
console.log('Average gas cost:', metrics.averageGasCostUsd);
console.log('Provider metrics:', metrics.providerMetrics.BUNGEE);
```

## Integration Patterns

### With useSendWithBridge

The hook integrates with the unified send interface:

```typescript
import { useSendWithBridge } from '@hooks/useSendWithBridge';

function SendComponent() {
  const { executeWithBridge, getBridgeQuote } = useSendWithBridge();
  
  // Automatically uses Bungee for supported cross-chain transfers
  const quote = await getBridgeQuote({
    amount: '1.0',
    recipient: '0x...',
    fromChain: 8453,
    toChain: 1,
    toToken: ethereumUsdcToken,
  });
  
  // Executes via Bungee if cross-chain, direct transfer if same-chain
  const result = await executeWithBridge(params);
}
```

### With Token Selection

```typescript
// Check if bridge is needed
const isCrossChain = fromChain !== toChain;
const needsBridge = isCrossChain && isChainSupported(fromChain) && isChainSupported(toChain);

if (needsBridge) {
  const quote = await getRelayPrice({
    originChainId: fromChain,
    destinationChainId: toChain,
    // ... other params
  });
  
  if (quote) {
    setEstimatedTime(quote.details.timeEstimate);
    setEstimatedFees(quote.fees);
  }
}
```

## Testing

The hook includes comprehensive test coverage:

```typescript
// Test basic functionality
describe('useBungeeExchange', () => {
  it('should fetch price quotes for supported chains', async () => {
    const { result } = renderHook(() => useBungeeExchange());
    const quote = await result.current.getRelayPrice(params);
    expect(quote).toBeDefined();
    expect(quote.details.timeEstimate).toBeGreaterThan(0);
  });
  
  it('should return null for unsupported chains', async () => {
    const quote = await result.current.getRelayPrice({
      ...params,
      originChainId: SOLANA_CHAIN_ID,
    });
    expect(quote).toBeNull();
  });
});
```

## Performance Considerations

### Gas Optimization

- Smart accounts batch approval + bridge into single UserOperation
- Gas price estimation using dynamic pricing
- Automatic fallback to manual gas limits if estimation fails

### Request Caching

- Price quotes are cached for 30 seconds to reduce API calls
- Route data is reused between price and detailed quotes
- Bridge status polling uses exponential backoff

### Error Recovery

- Automatic retry logic for transient failures
- Graceful degradation when bridge is unavailable
- Fallback to alternative bridge providers via useSendWithBridge

## Environment Setup

Required environment variables:

```bash
# Bungee/Socket API integration
VITE_SOCKET_API_KEY=your_socket_api_key

# Smart account support (optional)
VITE_ZERODEV_PROJECT_ID=your_zerodev_project_id
VITE_ZERODEV_SEPOLIA_PROJECT_ID=your_testnet_project_id

# Other integrations
VITE_ALCHEMY_API_KEY=your_alchemy_key
VITE_PRIVY_APP_ID=your_privy_app_id
```

## Troubleshooting

### Common Issues

1. **"Chain not supported" errors**
   - Check if both source and destination chains are in `SUPPORTED_CHAIN_IDS`
   - Verify chain IDs match exactly (e.g., 8453 for Base, not 84531 for Base Goerli)

2. **"Wallet not connected" errors**
   - Ensure wallet is connected before calling `executeRelayQuote`
   - For EOA wallets, verify the Ethereum provider is available

3. **Bridge transaction timeouts**
   - Bridge transactions can take 5-30 minutes depending on chains
   - Status polling continues for up to 5 minutes, then times out
   - Users can check bridge status manually using transaction hashes

4. **Approval failures**
   - Verify token contract supports `approve()` function
   - Check if approval amount is sufficient
   - For smart accounts, approval is batched automatically

### Debug Mode

Enable detailed logging:

```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  console.log('Bungee route:', quote._bungeeRoute);
  console.log('Bridge progress:', progress);
}
```

## Related Documentation

- [Send Component Integration](../components/Send/CLAUDE.md)
- [Bridge Monitoring](./useBridgeMonitoring.md) 
- [Smart Account Integration](./contexts/useSmartAccount.md)
- [Unified Send Interface](./useSendWithBridge.md)