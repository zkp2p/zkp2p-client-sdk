# Bridge Functionality Improvements - Research Documentation

## Executive Summary

This document outlines research findings and proposed improvements for the zkp2p-v2-client bridge functionality, focusing on fixing transaction hash logic misconceptions and implementing UI/UX enhancements to improve the user experience.

## 1. Transaction Hash Logic Investigation

### Current Misconceptions

The codebase contains fundamental misconceptions about how bridge transactions work, particularly in comments and completion detection logic:

#### Incorrect Assumptions in Code
```typescript
// CompleteOrder/index.tsx (Lines 346-348) - INCORRECT
// "For single-tx bridges (Solana, Hyperliquid, HyperEVM): we only get 1 transaction hash"
// "For EVM chains: we expect 2 transaction hashes (source + destination)"
```

**Reality:** ALL cross-chain bridges require both source AND destination transactions, regardless of the destination chain type. The confusion stems from visibility limitations with embedded wallets, not actual transaction patterns.

### Actual Behavior Patterns

#### EOA Wallets + Relay Bridge
- **Initial State:** Returns 1 transaction hash (source chain)
- **Final State:** Returns 2 transaction hashes after destination completes
- **Detection:** Progressive updates via SDK callbacks
- **Issue:** No status API polling for verification

#### Embedded Wallets + Relay Bridge
- **Visibility:** Only source chain transaction visible (ERC-4337 limitation)
- **Current Hack:** Uses `pending-${txHash}` placeholder for destination
- **Detection:** Timeout-based completion (unreliable)
- **Issue:** Cannot track actual destination transaction

#### Bungee/Socket Bridge (Both Wallet Types)
- **Implementation:** Proper API-based status tracking
- **Detection:** Polls `bridge-status` endpoint for real completion
- **Visibility:** Full visibility of both source and destination transactions
- **Status:** Working correctly

### Root Cause Analysis

1. **Relay SDK Limitations:** The SDK provides callbacks but no status API for verification
2. **Smart Account Constraints:** ERC-4337 UserOperations limit destination visibility
3. **Wrong Mental Model:** Conflating chain types with transaction requirements
4. **Workaround Proliferation:** Placeholder hashes mask the real problem

## 2. Relay API Investigation

### Current SDK Implementation
```typescript
// useRelayBridge.ts - Callback-based progress tracking
client.actions.execute({
  quote: quoteWithMinGas,
  wallet: walletClient,
  onProgress: (progress) => {
    // SDK provides progressive updates
    // But no way to query status independently
  }
});
```

### ✅ DISCOVERED: Relay Status API Endpoint

**Relay DOES have a status API!** This is exactly what we need for proper completion tracking.

**Endpoint:** `GET https://api.relay.link/intents/status/v2`

**Query Parameters:**
- `requestId` (string) - Unique ID from the execution (available in SDK response)

**Response Structure:**
```typescript
interface RelayStatusResponse {
  status: 'refund' | 'delayed' | 'waiting' | 'failure' | 'pending' | 'success';
  details?: string;
  inTxHashes: string[];      // Source chain transactions
  txHashes: string[];         // Destination chain transactions  
  time: number;               // Last update timestamp
  originChainId: number;
  destinationChainId: number;
}
```

**Example Response:**
```json
{
  "status": "success",
  "inTxHashes": ["0xe53021eaa63d100b08338197d26953e2219bcbad828267dd936c549ff643aad7"],
  "txHashes": ["0x9da7bc54dfe6229d6980fd62250d472f23dfe0f41a1cdc870c81a08b3445f254"],
  "time": 1713290386145,
  "originChainId": 7777777,
  "destinationChainId": 8453
}
```

### Critical Insight: The Real Transaction Pattern

**CORRECTED Understanding:**
The transaction count is NOT determined by destination chain type (Solana/Hyperliquid/EVM), but by wallet type when using Relay:

| Wallet Type | Bridge Provider | Transaction Visibility | Actual Transactions |
|------------|-----------------|----------------------|-------------------|
| **EOA** | Relay | **2 hashes always** | 2 (source + dest) |
| **Embedded** | Relay | **1 hash (source only)** | 2 (but can't see dest) |
| Any | Bungee | 2 hashes | 2 (source + dest) |

**Key Points:**
- **EOA + Relay** → Always returns 2 transaction hashes, regardless of chains
- **Embedded + Relay** → Only returns 1 hash (source chain), regardless of chains
- The destination transaction DOES exist for embedded wallets, we just can't see it
- Chain type (Solana/Hyperliquid/EVM) is irrelevant to transaction count

### Implementation Strategy: API-Based Completion Tracking

With the status API available, we can implement proper completion tracking:

1. **Store requestId** from SDK execution response
2. **Poll status endpoint** for real completion status
3. **Extract both transaction hashes** from API response
4. **Remove placeholder workarounds** completely
5. **Handle embedded wallet case** with API-verified completion

## 3. UI/UX Improvements Implementation Plan

### 3.1 Loading States Enhancement

#### Current Issues
- Generic "Bridging..." text
- No quote fetching indication
- Inconsistent with swap page patterns

#### Implementation Plan

**Phase 1: Add Granular States**
```typescript
enum BridgeState {
  IDLE = 'idle',
  FETCHING_QUOTE = 'fetching_quote',
  QUOTE_READY = 'quote_ready',
  SIGNING_TRANSACTION = 'signing_transaction',
  MINING_SOURCE_TX = 'mining_source_tx',
  WAITING_DESTINATION = 'waiting_destination',
  BRIDGE_COMPLETE = 'bridge_complete'
}
```

**Phase 2: Update Button Text**
```typescript
const getButtonText = (state: BridgeState): string => {
  switch(state) {
    case BridgeState.FETCHING_QUOTE:
      return 'Getting best route...';
    case BridgeState.SIGNING_TRANSACTION:
      return 'Please sign in wallet...';
    case BridgeState.MINING_SOURCE_TX:
      return 'Processing on source chain...';
    case BridgeState.WAITING_DESTINATION:
      return 'Bridging to destination...';
    default:
      return 'Bridge & Send';
  }
};
```

### 3.2 Bridge Fee Display Removal

#### Current Issue
The bridge fee is displayed as an `accessoryLabel` in the output token field's `InputWithTokenSelector`:
```typescript
// src/components/Send/index.tsx lines 928-932
accessoryLabel={
  showBridgeInfo && bridgeQuote ? 
    `Bridge fee: $${bridgeQuote.totalFee}` :  // ← This should be removed
    ''
}
```
This appears in the bottom-right corner of the output token selector field, which is not the appropriate location.

#### Implementation: Remove Fee from Token Field
```typescript
// Simply remove the accessoryLabel prop or set to empty
<InputWithTokenSelector
  // ... other props
  accessoryLabel={''}  // Remove bridge fee display
/>
```

#### Alternative: Show Fee Information Separately
If fee information is still needed, display it in the existing bridge info section below the form:
```typescript
// Already exists in the BridgeInfoContainer
{showBridgeInfo && bridgeQuote && (
  <BridgeInfoContainer>
    <BridgeInfoRow>
      <BridgeInfoLabel>Total Fee</BridgeInfoLabel>
      <BridgeInfoValue>${bridgeQuote.totalFee}</BridgeInfoValue>
    </BridgeInfoRow>
    // ... other bridge info
  </BridgeInfoContainer>
)}
```

### 3.3 Success View Improvements

#### Issues to Fix
1. **Immediate checkmark** - Shows success before actual completion
2. **Static display** - No progressive transaction updates
3. **Active CTA** - "Initiate new transaction" available too early

#### Implementation Changes

**Phase 1: Loading State First**
```typescript
// Show loading state initially
const SuccessView = () => {
  const [showCheckmark, setShowCheckmark] = useState(false);
  
  useEffect(() => {
    // Delay checkmark for 3 seconds
    const timer = setTimeout(() => setShowCheckmark(true), 3000);
    return () => clearTimeout(timer);
  }, []);
  
  return showCheckmark ? <CheckmarkIcon /> : <LoadingSpinner />;
};
```

**Phase 2: Progressive Transaction Display**
```typescript
// Display transactions as they become available
{txHashes.map((tx, index) => (
  <TransactionRow key={tx.txHash} $animate={index === txHashes.length - 1}>
    <ChainName>{getChainName(tx.chainId)}</ChainName>
    <TxHash>{truncateHash(tx.txHash)}</TxHash>
    <ExplorerLink href={getExplorerUrl(tx)} />
  </TransactionRow>
))}
```

**Phase 3: Disable CTA Until Complete**
```typescript
<Button 
  disabled={!isBridgeComplete}
  onClick={handleNewTransaction}
>
  {isBridgeComplete ? 'Initiate new transaction' : 'Bridge in progress...'}
</Button>
```

### 3.4 Relay.link Integration

#### Current Gap
No redirect to Relay's unified transaction view

#### Implementation
```typescript
const getRelayTrackingUrl = (sourceTxHash: string): string => {
  return `https://relay.link/tx/${sourceTxHash}`;
};

// Add redirect option in success view
const handleViewOnRelay = () => {
  const relayUrl = getRelayTrackingUrl(txHashes[0].txHash);
  window.open(relayUrl, '_blank');
};

// Add button to success view
<SecondaryButton onClick={handleViewOnRelay}>
  View on Relay.link →
</SecondaryButton>
```

## 4. Implementation Priority & Timeline

### Phase 1: Critical Fixes (Immediate)
1. **Implement Relay Status API polling** - Use `/intents/status/v2` endpoint
2. **Fix transaction hash logic** - Remove chain-type assumptions
3. **Remove placeholder hash workarounds** - Use real API data
4. **Update completion detection** - Use `status: 'success'` from API
5. **Migrate to Relay V2 Currencies API** - Update from V1 to V2 endpoint (ZKP2P-661)
6. **Clean up bridge monitoring** - Remove unnecessary error tracking (ZKP2P-660)

### Phase 2: UI Enhancements (Next)
1. **Add granular loading states** - Match swap page patterns
2. **Remove bridge fee from token field** - Clean up accessoryLabel
3. **Fix success view timing** - Delayed checkmark, progressive display
4. **Disable CTA during bridge** - Prevent premature actions

### Phase 3: Polish & Optimization (Final)
1. **Implement Relay.link redirect** - Use source tx hash
2. **Provider-specific token sources** - Use correct API per provider (ZKP2P-661)
3. **Optimize polling intervals** - Exponential backoff
4. **Simplify error handling** - Remove speculative error cases

## 5. Token Data Provider Migration (ZKP2P-661)

### Current Implementation
The app currently uses Relay V1 currencies API:
```typescript
// TokenDataProvider.tsx
const response = await fetch('https://api.relay.link/currencies/v1', {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});
```

### Migration to Relay V2 API
**Endpoint:** `POST https://api.relay.link/currencies/v2`

**Key Changes:**
- Method changes from GET to POST
- Request body for filtering options
- Enhanced metadata including `vmType` for different VM types
- Better search capabilities with `useExternalSearch` option

**Implementation:**
```typescript
interface RelayV2CurrencyRequest {
  defaultList?: boolean;
  chainIds?: number[];
  term?: string;
  address?: string;
  currencyId?: string;
  tokens?: string[];  // Format: "chainId:address"
  verified?: boolean;
  limit?: number;      // Max 100
  includeAllChains?: boolean;
  useExternalSearch?: boolean;
  depositAddressOnly?: boolean;
}

interface RelayV2Currency {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  vmType: 'bvm' | 'evm' | 'svm' | 'tvm' | 'tonvm' | 'suivm' | 'hypevm';
  metadata: {
    logoURI?: string;
    verified?: boolean;
    isNative?: boolean;
  };
}

const fetchRelayV2Currencies = async (params: RelayV2CurrencyRequest): Promise<RelayV2Currency[]> => {
  const response = await fetch('https://api.relay.link/currencies/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      defaultList: true,
      chainIds: [BASE_CHAIN_ID],
      verified: true,
      limit: 100,
      ...params
    })
  });
  
  return response.json();
};
```

### Provider-Specific Token Data Sources

Each bridge provider has its own token data source that should be used when that provider is active:

#### Relay Provider → Relay Currencies API
**When to use:** When using Relay bridge for cross-chain transfers
**Endpoint:** `POST https://api.relay.link/currencies/v2`

#### Bungee/Socket Provider → Bungee Token List API  
**When to use:** When using Bungee/Socket bridge for cross-chain transfers
**Endpoint:** `GET https://public-backend.bungee.exchange/api/v1/tokens/list`

**Implementation:**
```typescript
interface BungeeTokenRequest {
  userAddress?: string;
  chainIds?: string;  // Comma-separated
  list?: 'full' | 'trending';
}

interface BungeeToken {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  isShortListed: boolean;
  trendingRank?: number;
  marketCap?: number;
  totalVolume?: number;
  balance: string;
  balanceInUsd: number;
  tags?: string[];
  isVerified: boolean;
}

const fetchBungeeTokens = async (params: BungeeTokenRequest): Promise<Record<string, BungeeToken[]>> => {
  const queryParams = new URLSearchParams();
  if (params.userAddress) queryParams.append('userAddress', params.userAddress);
  if (params.chainIds) queryParams.append('chainIds', params.chainIds);
  queryParams.append('list', params.list || 'trending');
  
  const response = await fetch(
    `https://public-backend.bungee.exchange/api/v1/tokens/list?${queryParams}`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  return data.result.tokens;
};
```

### Token Data Provider Strategy
1. **Provider-Specific Sources**: Use Relay V2 API when Relay is the bridge provider, use Bungee API when Bungee is the provider
2. **No Mixing**: Don't merge token lists from different providers - use the appropriate source for the active provider
3. **Caching**: Cache responses per provider for 5 minutes to reduce API calls
4. **Provider Switching**: Refresh token data when user switches between bridge providers
5. **Consistency**: Ensure token availability matches what the bridge provider actually supports

## 6. Bridge Monitoring Cleanup (ZKP2P-660)

### Current Issues
The bridge monitoring system has accumulated unnecessary complexity:
- Speculative error categorization that may not reflect real errors
- Overly complex error tracking that doesn't provide actionable insights
- Metrics collection that isn't being used effectively

### Cleanup Strategy

#### Remove Speculative Error Tracking
```typescript
// REMOVE: Overly specific error categorization
const categorizeError = (error: any): BridgeErrorType => {
  // Remove complex pattern matching for hypothetical errors
  // Keep only proven, actionable error types
};
```

#### Simplify to Essential Monitoring
```typescript
// KEEP: Basic success/failure tracking
interface SimplifiedBridgeMonitoring {
  attemptId: string;
  provider: 'RELAY' | 'BUNGEE';
  status: 'pending' | 'success' | 'failed';
  sourceTxHash?: string;
  destinationTxHash?: string;
  error?: string;  // Simple error message, not categorized
}
```

#### Remove Unnecessary Metrics
- Remove: Speculative performance metrics
- Remove: Detailed error categorization
- Keep: Basic success rate tracking
- Keep: Transaction hash recording

### Files to Clean Up
- `/src/hooks/bridge/useBridgeMonitoring.ts` - Simplify to essential tracking
- `/src/helpers/bridgeMonitoringUtils.ts` - Remove speculative error patterns
- `/src/hooks/bridge/useRelayBridge.ts` - Remove unnecessary error wrapping
- `/src/hooks/bridge/useBungeeExchange.ts` - Simplify error handling

## 7. Technical Implementation Details

### Files to Modify

#### Core Logic Updates
- `/src/hooks/bridge/useRelayBridge.ts` - Fix transaction simulation
- `/src/hooks/bridge/useBridgeProvider.ts` - Update completion detection
- `/src/components/Swap/CompleteOrder/index.tsx` - Fix completion logic

#### UI Component Updates
- `/src/components/Send/index.tsx` - Enhanced loading states
- `/src/components/Send/BridgeSuccessView.tsx` - Progressive display
- `/src/components/common/Button.tsx` - Bridge-specific loading

#### New Components
- `/src/components/Send/BridgeFeeCard.tsx` - Prominent fee display
- `/src/components/Send/BridgeStatusTracker.tsx` - Status monitoring

### State Management Changes

```typescript
interface BridgeProgress {
  state: BridgeState;
  sourceTx?: TransactionHash;
  destinationTx?: TransactionHash;
  sourceStatus: 'pending' | 'confirmed' | 'failed';
  destinationStatus: 'pending' | 'confirmed' | 'failed';
  estimatedTime?: number;
  actualTime?: number;
  error?: string;
}
```

### Error Handling Improvements

```typescript
interface BridgeError {
  code: 'QUOTE_FAILED' | 'EXECUTION_FAILED' | 'TIMEOUT' | 'INSUFFICIENT_FUNDS';
  message: string;
  provider: 'RELAY' | 'BUNGEE';
  fallbackAvailable: boolean;
}
```

## 6. Questions & Blockers

### ✅ Resolved Blockers
1. **Relay Status API** - RESOLVED! Found `/intents/status/v2` endpoint
   - Provides both source (`inTxHashes`) and destination (`txHashes`) transactions
   - Returns clear completion status
   - Includes chain IDs for proper routing

### Remaining Considerations
1. **Request ID Storage** - Need to capture and store `requestId` from SDK execution
   - The SDK response should include this ID
   - May need to extract from `check` object in step items

2. **Smart Account Visibility** - Now solvable with API
   - API provides destination tx even for embedded wallets
   - Can show proper completion status regardless of wallet type

### Technical Questions
1. **Performance Impact** - Will status polling affect app performance?
   - Recommendation: Implement exponential backoff
   - Max polling interval: 30 seconds

2. **Cache Strategy** - How long to cache bridge quotes?
   - Recommendation: 60 seconds for quotes
   - Clear on network/amount changes

3. **Error Recovery** - How to handle partial bridge failures?
   - Recommendation: Implement manual recovery flow
   - Store incomplete bridge data locally

### UX Questions
1. **Success Criteria** - When to show "complete" vs "in progress"?
   - Recommendation: "Complete" only after destination confirmation
   - Show estimated time remaining

2. **Fee Prominence** - How prominent should fee display be?
   - Recommendation: Show total prominently, breakdown on hover/click

3. **Relay.link Redirect** - Automatic or manual redirect?
   - Recommendation: Manual via button to avoid surprising users

## 7. Testing Strategy

### Unit Tests
- Transaction hash logic with various wallet types
- State machine transitions
- Error handling scenarios

### Integration Tests
- EOA wallet bridge flow
- Embedded wallet bridge flow
- Provider fallback mechanism
- Status polling reliability

### E2E Tests
- Complete bridge flow with real providers
- Error recovery flows
- Cross-chain verification

## 8. Success Metrics

### Technical Metrics
- Completion detection accuracy: >99%
- False positive rate: <1%
- API polling efficiency: <5% bandwidth increase

### User Experience Metrics
- Time to perceived completion: -30%
- User confusion reports: -50%
- Support tickets for stuck bridges: -75%

## 9. Next Steps

1. **Immediate Actions**
   - Create feature branch ✅
   - Document research findings ✅
   - Begin Phase 1 implementation

2. **Investigation Tasks**
   - Contact Relay team about status API
   - Test completion detection with various wallets
   - Benchmark current vs proposed performance

3. **Implementation Start**
   - Fix transaction hash logic first
   - Then implement UI improvements
   - Finally add advanced features

## Appendix A: Code Examples

### Correct Transaction Tracking Pattern
```typescript
interface BridgeTransaction {
  provider: 'RELAY' | 'BUNGEE';
  walletType: 'EOA' | 'SMART_ACCOUNT';
  sourceTx: {
    hash: string;
    chainId: number;
    status: 'pending' | 'confirmed' | 'failed';
    timestamp: number;
  };
  destinationTx?: {
    hash: string;
    chainId: number;
    status: 'pending' | 'confirmed' | 'failed';
    timestamp: number;
  };
  isComplete: boolean;
  completionMethod: 'SDK_CALLBACK' | 'API_POLLING' | 'TIMEOUT';
}
```

### Relay Status API Implementation
```typescript
interface RelayStatusResponse {
  status: 'refund' | 'delayed' | 'waiting' | 'failure' | 'pending' | 'success';
  details?: string;
  inTxHashes: string[];      // Source chain transactions
  txHashes: string[];         // Destination chain transactions
  time: number;
  originChainId: number;
  destinationChainId: number;
}

const pollRelayBridgeStatus = async (
  requestId: string,
  options: PollOptions = {}
): Promise<RelayStatusResponse> => {
  const {
    maxAttempts = 60,
    intervalMs = 5000,
    backoffMultiplier = 1.5,
    maxInterval = 30000
  } = options;
  
  let attempts = 0;
  let currentInterval = intervalMs;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(
        `https://api.relay.link/intents/status/v2?requestId=${requestId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      const status: RelayStatusResponse = await response.json();
      
      // Check for completion
      if (status.status === 'success' || status.status === 'failure' || status.status === 'refund') {
        return status;
      }
      
      // Wait and retry with backoff
      await sleep(currentInterval);
      currentInterval = Math.min(currentInterval * backoffMultiplier, maxInterval);
      attempts++;
    } catch (error) {
      console.error('Relay status polling error:', error);
      // Continue polling on error
    }
  }
  
  throw new Error('Bridge status polling timeout');
};

// Usage in useRelayBridge hook
const trackBridgeCompletion = async (requestId: string) => {
  const status = await pollRelayBridgeStatus(requestId);
  
  // Convert to our standard format
  return {
    isComplete: status.status === 'success',
    txHashes: [
      ...status.inTxHashes.map(hash => ({ 
        txHash: hash, 
        chainId: status.originChainId 
      })),
      ...status.txHashes.map(hash => ({ 
        txHash: hash, 
        chainId: status.destinationChainId 
      }))
    ],
    error: status.status === 'failure' ? status.details : undefined
  };
};
```

## Appendix B: References

- [Relay SDK Documentation](https://docs.relay.link)
- [Socket API Documentation](https://docs.socket.tech)
- [ERC-4337 Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)
- Internal Bridge Monitoring Dashboard
- User Feedback Reports (Q4 2024)

---

*Document Version: 1.0*  
*Last Updated: January 2025*  
*Author: Bridge Improvements Team*  
*Status: Ready for Implementation*