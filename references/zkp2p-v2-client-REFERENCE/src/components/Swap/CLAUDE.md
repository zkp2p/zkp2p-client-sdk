# Swap Feature Documentation

## Swap Architecture

The Swap feature is the core user-facing functionality of ZKP2P, enabling peer-to-peer fiat-to-crypto exchanges through zero-knowledge proof verification. It implements a sophisticated multi-step flow with careful attention to user experience, security, and cross-chain capabilities.

### Component Structure
```
Swap/
├── index.tsx                    # Main swap form and orchestration
├── CompleteOrder/              # Proof generation and verification
│   ├── index.tsx               # Proof flow orchestrator
│   ├── ExtensionProofForm.tsx  # Browser extension integration
│   ├── ReclaimProofForm.tsx    # Mobile SDK integration
│   └── ProvePayment/           # Payment verification UI
├── SendPayment/                # Payment instruction display
│   ├── index.tsx               # Payment form
│   ├── Details.tsx             # Payment details
│   └── PaymentMethodSelector.tsx
├── QuoteSelectionDisplay.tsx   # Multi-quote selection
├── QuoteDetails.tsx            # Quote breakdown
├── OnRamperIntentInfo.tsx      # Active intent tracking
└── ReferrerInfo.tsx            # Third-party integration
```

### User Flow Phases

1. **Quote Discovery**: User inputs amount, selects currency/platform, receives multiple quotes
2. **Intent Creation**: User selects quote, signs transaction, creates on-chain intent
3. **Payment Execution**: User completes off-chain payment via platform
4. **Proof Generation**: User generates ZK proof of payment
5. **Fund Release**: Smart contract verifies proof and releases crypto

## Implementation Patterns

### Quote Management System
```typescript
// Multi-quote architecture
const [potentialQuotes, setPotentialQuotes] = useState<SwapQuote[]>([]);
const [selectedQuoteIndex, setSelectedQuoteIndex] = useState<number | null>(null);

// Auto-selection of best quote
useEffect(() => {
  if (successfulQuotes.length > 0) {
    setPotentialQuotes(successfulQuotes);
    setSelectedQuoteIndex(0); // Best quote first
  }
}, [quoteResponse]);
```

### Multi-Platform Payment Support
Each payment platform has specific configurations:
- Default payment mode (QR code, deeplink, manual)
- Formatted send link generation
- Proof generation requirements
- Platform-specific minimums

### Cross-Chain Token Swaps
Integration with Relay.link for bridging:
```typescript
// Bridge quote fetching
const params: GetPriceParameters = {
  recipient: recipientAddress,
  chainId: BASE_CHAIN_ID,
  toChainId: tokenInfo[token].chainId,
  currency: BASE_USDC_ADDRESS,
  toCurrency: tokenInfo[token].address,
  amount: usdcAmount,
  tradeType: 'EXACT_INPUT'
};
```

#### Bridge Quote Reliability
- **Automatic Retries**: Failed bridge quotes automatically retry up to 3 times
- **Manual Recovery**: After 3 failed attempts, users can manually retry
- **Cooldown Period**: 30-second minimum wait between manual retries
- **Status Tracking**: Clear UI feedback for retry attempts and cooldown status

### Proof Generation Patterns
Two proof generation methods:
1. **Browser Extension**: Desktop users with Chrome/Firefox
2. **Reclaim SDK**: Mobile users via QR code

Both methods encode proofs for contract submission with platform-specific handling.

## Key Files and Structure

### Core Swap Logic (`index.tsx`)
- Form state management with session storage
- Quote fetching and selection
- Intent creation transaction
- Navigation between flow phases
- Third-party integration support

### Payment Flow (`SendPayment/`)
- Dynamic payment instructions based on platform
- QR code generation for mobile payments
- Deeplink construction for web payments
- Payment details display with copy functionality

### Proof Generation (`CompleteOrder/`)
- Platform detection (mobile vs desktop)
- Extension communication via `useExtensionProxyProofs`
- Reclaim SDK integration for mobile
- Proof encoding and contract submission
- Transaction simulation before execution

#### Bridge Quote Management
- Automatic retry mechanism for cross-chain swaps
- Polling interval: 25 seconds between attempts
- Maximum automatic retries: 3
- Manual retry after exhausting automatic attempts
- Rate limiting: 30-second cooldown between manual retries
- Race condition prevention with operation locks

### State Dependencies
- `AccountContext`: User wallet and authentication
- `SmartContractsContext`: Contract addresses and ABIs
- `OnRamperIntentsContext`: Active intent tracking
- `BackendContext`: API for quotes and payee details
- `TokenDataContext`: Token metadata and pricing
- **Bridge Quote State**: Retry count, cooldown tracking, operation locks

## Integration Points

### Backend API Integration
- `/get-max-token-for-fiat`: Quote fetching
- `/sign-intent`: Intent authorization
- `/get-payee-details`: Payment recipient info

### Smart Contract Interactions
- `signalIntent`: Create on-chain swap intent
- `fulfillIntent`: Submit payment proof
- Event parsing for transaction results

### External Services
- **Relay.link**: Cross-chain bridging
- **Reclaim Protocol**: ZK proof generation
- **Payment Platforms**: Venmo, Revolut, Wise APIs

## Development Patterns

### Error Handling Strategy
Comprehensive error states for each phase:
```typescript
enum QuoteState {
  DEFAULT,
  FETCHING_QUOTE,
  FETCH_QUOTE_SUCCESS,
  FAILED_TO_FETCH_QUOTE,
  INVALID_RECIPIENT_ADDRESS,
  AMOUNT_BELOW_TRANSFER_MIN,
  // ... etc
}

enum ProofGenerationStatus {
  // ... existing statuses
  SWAP_QUOTE_REQUESTING,    // Fetching bridge quote
  SWAP_QUOTE_FAILED,        // Bridge quote fetch failed
  SWAP_QUOTE_SUCCESS,       // Bridge quote ready
}
```

#### Recovery Mechanisms
- **Bridge Quote Failures**: Automatic retry with exponential backoff
- **Manual Intervention**: User-triggered retry after automatic attempts exhausted
- **Rate Limiting**: Protection against rapid retry attempts
- **Clear Messaging**: User-friendly error messages with remaining cooldown time

### Data Persistence
- Session storage for form inputs
- Local storage for quote data
- Automatic cleanup after completion

### Performance Optimizations
- Parallel quote fetching
- Memoized calculations
- Debounced input handling
- Lazy component loading
- Efficient re-render management

### Security Measures
- Input validation for addresses and amounts
- Transaction simulation before execution
- Platform-specific minimum enforcement
- Witness signature verification

## Testing Approach

### Unit Testing
- Quote calculation logic
- Input validation functions
- Platform configuration handling

### Integration Testing
- Full swap flow simulation
- API mock responses
- Contract interaction mocking

### E2E Testing Scenarios
- Complete swap with various platforms
- Error recovery flows
- Third-party integration paths

## Common Issues & Solutions

### Quote Expiration
- Quotes valid for limited time
- Automatic refresh for bridge quotes
- Clear expiration messaging

### Gas Estimation
- 2x priority fee multiplier
- Simulation before execution
- Clear error messages for failures

### Mobile Compatibility
- Reclaim SDK for proof generation
- Responsive design adaptations
- Platform-specific limitations

### Bridge Quote Failures
- Relay.link API intermittent availability
- Automatic retry mechanism (3 attempts)
- Manual retry option with cooldown
- Clear user feedback during retries

#### Implementation Details
- `handleManualRetryBridgeQuote`: Core retry logic with cooldown enforcement
- `intervalRef` and `isOperationInProgress`: Race condition prevention
- UI updates: Button state changes based on retry count
- Error messaging: Dynamic cooldown countdown display

## Future Enhancements

### Planned Improvements
- Multiple proof aggregation
- Advanced order types
- ~~Automated retry mechanisms~~ ✓ Implemented
- Enhanced mobile experience

### Extension Points
- New payment platform addition
- Alternative proof methods
- Custom fee structures
- Advanced routing algorithms