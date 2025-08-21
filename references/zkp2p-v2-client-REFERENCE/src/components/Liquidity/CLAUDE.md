# Liquidity Feature Documentation

## Liquidity Architecture

The Liquidity feature enables providers to deposit USDC and earn fees by facilitating peer-to-peer fiat-to-crypto exchanges. It implements a sophisticated order book system with multi-platform support, dynamic pricing, and automated order matching.

### Component Structure
```
Liquidity/
├── index.tsx               # Main liquidity page with table
├── LiquidityTable.tsx      # Filterable/sortable order book
├── LiquidityRow.tsx        # Desktop row component  
└── LiquidityRowMobile.tsx  # Mobile row component

Deposits/ (Related)
├── index.tsx               # Deposit management interface
├── DepositTable.tsx        # User's deposits display
├── NewDeposit/            # Deposit creation flow
│   ├── index.tsx          # Main form orchestrator
│   ├── PaymentPlatform.tsx # Platform configuration
│   ├── CurrencyRow.tsx    # Rate configuration
│   └── AdvancedSettings.tsx # Order limits
└── Buy/                   # Order fulfillment
    └── BuyModal.tsx       # Order creation interface
```

### Provider Lifecycle

1. **Deposit Creation**: Provider deposits USDC with platform configurations
2. **Order Discovery**: Buyers see available liquidity in order book
3. **Order Matching**: Buyers create intents against deposits
4. **Payment Processing**: Provider receives fiat payment
5. **Proof Verification**: ZK proof releases escrowed crypto
6. **Earnings**: Provider earns spread + platform fees

## Implementation Patterns

### Liquidity Display System
```typescript
// Batch fetching with pagination
const BATCH_SIZE = 30;
const [currentBatch, setCurrentBatch] = useState(0);

// Local pruning for performance
const prunedDepositIds = JSON.parse(
  localStorage.getItem('prunedDepositIds') || '[]'
);

// Smart filtering
const unprunedDeposits = depositViews.filter(
  view => !prunedDepositIds.includes(view.hashedOnchainId)
);
```

### Multi-Platform Configuration
Each deposit supports multiple payment platforms:
```typescript
interface DepositConfig {
  platforms: PaymentPlatform[];
  payeeDetails: { [platform: string]: EncryptedData };
  conversionRates: { [platform: string]: { [currency: string]: string } };
  minOrderAmounts: { [platform: string]: number };
  maxOrderAmounts: { [platform: string]: number };
}
```

### APR Calculation
Dynamic APR based on:
- Trading volume (last 30 days)
- Liquidity share percentage
- Spread (premium/discount)
- Platform fee structure

### Order Creation Flow
```typescript
// BuyModal interaction
1. Select liquidity row → Open modal
2. Input fiat or USDC amount
3. Validate against limits
4. Fetch signed intent from backend
5. Submit signalIntent transaction
6. Navigate to payment flow
```

## Key Files and Structure

### Liquidity Table (`LiquidityTable.tsx`)
- Filtering by currency, platform, amount
- Sorting by price, APR, liquidity
- Session storage for preferences
- Responsive design switching

### Deposit Management (`Deposits/index.tsx`)
- Active/closed deposit tabs
- Real-time balance updates
- Order tracking per deposit
- Withdrawal functionality

### New Deposit Flow (`NewDeposit/`)
- Multi-step form validation
- Platform-specific payee details
- Dynamic rate configuration
- Min/max order limits
- Gas-optimized approval pattern

### State Dependencies
- `LiquidityContext`: Global liquidity data
- `DepositsContext`: User's own deposits
- `SmartContractsContext`: Contract interactions
- `BackendContext`: Payee details API
- `TokenDataContext`: Price feeds

## Integration Points

### Smart Contract Interactions
- `createDeposit`: Initialize liquidity position
- `updateDeposit`: Modify rates/limits
- `withdrawDeposit`: Remove liquidity
- Event monitoring for state updates

### Backend Services
- `/post-deposit-details`: Store encrypted payee info
- `/get-deposit-details`: Retrieve for buyers
- Volume data from Dune Analytics

### Price Feed Integration
- Real-time currency exchange rates
- 3-hour update intervals
- Fallback to cached values

## Development Patterns

### State Management Strategy
Two-tier state architecture:
1. **DepositsContext**: User's deposits (real-time)
2. **LiquidityContext**: Global liquidity (batched)

### Performance Optimizations
- Batch fetching with configurable size
- Local storage pruning
- Memoized calculations
- Virtual scrolling for large lists
- Debounced filtering

### Security Measures
- Encrypted payee details off-chain
- Hashed deposit IDs on-chain
- Rate limit validation
- Witness signature verification

### Mobile Adaptations
- Dedicated mobile components
- Touch-optimized interactions
- Simplified data display
- Bottom sheet patterns

## Testing Approach

### Unit Testing
- APR calculation logic
- Rate conversion functions
- Filter/sort algorithms

### Integration Testing
- Deposit creation flow
- Order matching logic
- State synchronization

### E2E Testing Scenarios
- Complete provider lifecycle
- Multi-platform deposits
- Order fulfillment flows

## Common Issues & Solutions

### Stale Liquidity Data
- Auto-refresh mechanism
- Manual refresh button
- Event-based updates

### Rate Synchronization
- Optimistic UI updates
- Confirmation before execution
- Clear error messaging

### Gas Optimization
- Batch operations where possible
- Efficient data structures
- Minimal on-chain storage

## Future Enhancements

### Planned Improvements
- Automated market making
- Advanced order types
- Liquidity mining rewards
- Cross-chain deposits

### Extension Points
- New platform integrations
- Alternative fee models
- Liquidity aggregation
- Advanced analytics