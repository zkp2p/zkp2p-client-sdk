# Helpers Documentation

## Overview
The helpers directory contains utility functions, type definitions, constants, and ABI files used throughout the application. This documentation covers key patterns and utilities that are critical for ZKP2P development.

## Directory Structure
```
helpers/
├── __tests__/              # Business logic unit tests
├── abi/                    # Contract ABIs
├── types/                  # TypeScript definitions
│   └── paymentPlatforms/   # Platform-specific configs
├── legacy/                 # Legacy code (avoid using)
└── [utility files]         # Various utility modules
```

## Key Utilities

### BigInt Serialization (`bigIntSerialization.ts`)
Provides safe JSON serialization for objects containing BigInt values, which are common in blockchain applications.

**Why it exists**: JavaScript's `JSON.stringify()` cannot handle BigInt values, throwing `TypeError: Do not know how to serialize a BigInt`. This is particularly problematic when:
- Logging proof data for debugging
- Storing transaction data in local storage
- Sending blockchain data to APIs
- Displaying proof information in UI components

**Key functions**:
- `safeStringify(obj)` - Safely stringify any object containing BigInts
- `safeParse(json, bigIntKeys?)` - Parse JSON and restore BigInt values
- `bigIntToString(obj)` - Recursively convert BigInts to strings
- `stringToBigInt(obj, keys?)` - Convert strings back to BigInts
- `bigIntReplacer` - Replacer function for use with JSON.stringify

**Usage pattern**: Always use these utilities when serializing blockchain data, proof objects, or any data structure that may contain BigInt values.

```typescript
import { safeStringify, safeParse } from '@helpers/bigIntSerialization';

// Serializing proof data
const proofString = safeStringify(proofObject);

// Parsing with known BigInt fields
const parsed = safeParse(jsonString, ['amount', 'timestamp', 'nonce']);
```

### Address Formatting (`addressFormat.ts`)
Utilities for formatting blockchain addresses for display.

**Key functions**:
- `shortenAddress()` - Formats addresses as 0x1234...5678
- `isValidAddress()` - Validates Ethereum addresses
- `formatSolanaAddress()` - Handles Solana address display

### APR Calculations (`aprHelper.ts`)
Calculates Annual Percentage Rate for liquidity providers based on spread and volume.

**Key functions**:
- `calculateAPR()` - Computes APR from spread and platform metrics
- `getEffectiveSpread()` - Calculates effective spread percentage

### Date Formatting (`dateFormat.ts`)
Consistent date formatting across the application.

**Key functions**:
- `formatDateTime()` - Standard datetime display format
- `formatRelativeTime()` - "2 hours ago" style formatting
- `getTimeRemaining()` - Countdown timer formatting

### Contract Event Parsing (`eventParser.ts`)
Parses blockchain events from transaction receipts.

**Key functions**:
- `parseIntentCreatedEvent()` - Extracts intent creation details
- `parseDepositEvent()` - Parses deposit events
- `getEventFromReceipt()` - Generic event extraction

### Intent Helpers (`intentHelper.ts`)
Utilities for working with swap intents.

**Key functions**:
- `parseIntentData()` - Converts raw intent to typed object
- `isIntentExpired()` - Checks intent expiration
- `calculateIntentHash()` - Generates intent identifiers

### Unit Conversions (`units.ts`)
Token amount conversions and formatting.

**Key functions**:
- `formatTokenAmount()` - Human-readable token amounts
- `parseTokenAmount()` - Convert user input to BigInt
- `convertUSDCToHuman()` - USDC-specific formatting

## Type System

### Payment Platform Types (`types/paymentPlatforms/`)
Each payment platform has a dedicated configuration file with:
- Platform metadata (name, logo, colors)
- Send payment configuration
- Proof verification settings
- Deposit requirements

**Adding a new platform**:
1. Create `types/paymentPlatforms/[platform].ts`
2. Export configuration following `PaymentPlatformConfig` interface
3. Add to `types/paymentPlatforms/index.ts`
4. Update `deployed_addresses.ts` with verifier contract

### Core Types (`types/`)
- **Currency Types**: Supported fiat currencies and metadata
- **Escrow Types**: Intent and deposit structures
- **Proof Types**: ZK proof formats and validation
- **Smart Contract Types**: Contract interfaces and responses

## Testing Patterns

The helpers directory contains comprehensive unit tests focusing on:
- **Edge cases**: BigInt overflow, division by zero
- **Real-world scenarios**: Actual payment amounts and rates
- **Error handling**: Malformed data, missing fields
- **Type safety**: Ensuring conversions maintain precision

Example test pattern:
```typescript
describe('bigIntSerialization', () => {
  it('should handle nested objects with BigInt values', () => {
    const input = {
      amount: BigInt('1000000000000000000'),
      nested: {
        timestamp: BigInt('1234567890')
      }
    };
    
    const serialized = safeStringify(input);
    const parsed = safeParse(serialized, ['amount', 'timestamp']);
    
    expect(parsed.amount).toEqual(input.amount);
    expect(parsed.nested.timestamp).toEqual(input.nested.timestamp);
  });
});
```

## Best Practices

### 1. Always Use Type-Safe Utilities
```typescript
// ❌ Avoid manual parsing
const amount = BigInt(amountString);

// ✅ Use utility functions
const amount = parseTokenAmount(amountString, tokenDecimals);
```

### 2. Handle BigInt Serialization
```typescript
// ❌ Will throw error
console.log(JSON.stringify({ amount: BigInt(100) }));

// ✅ Safe serialization
console.log(safeStringify({ amount: BigInt(100) }));
```

### 3. Validate External Data
```typescript
// Always validate addresses
if (!isValidAddress(userInput)) {
  throw new Error('Invalid address');
}

// Parse amounts safely
try {
  const amount = parseTokenAmount(userInput, USDC_DECIMALS);
} catch (error) {
  // Handle invalid input
}
```

### 4. Use Constants
Import from `constants.ts` rather than hardcoding values:
```typescript
import { USDC_DECIMALS, MAX_SLIPPAGE } from '@helpers/constants';
```

## Common Pitfalls

### BigInt JSON Serialization
The most common issue is attempting to serialize BigInt values. Always use the bigIntSerialization utilities when working with:
- Proof objects containing timestamps
- Token amounts from contracts
- Block numbers and nonces
- Any Web3 data structures

### Precision Loss
When converting between BigInt and number types, ensure precision is maintained:
```typescript
// ❌ Can lose precision for large values
const displayAmount = Number(bigIntAmount) / 10 ** decimals;

// ✅ Maintains precision
const displayAmount = formatTokenAmount(bigIntAmount, decimals);
```

### Address Casing
Ethereum addresses are case-insensitive but should be checksummed:
```typescript
// Use viem's getAddress for checksumming
import { getAddress } from 'viem';
const checksummed = getAddress(address);
```

## Migration Notes

### Legacy Code
The `legacy/` directory contains deprecated implementations. Do not use these in new code:
- Legacy notary implementations
- Old Poseidon hash functions
- Deprecated verifier patterns

New code should use the modern implementations in the main helpers directory.

## Performance Considerations

### Memoization
Expensive calculations like APR should be memoized:
```typescript
const apr = useMemo(() => 
  calculateAPR(amount, rate, volume, liquidity),
  [amount, rate, volume, liquidity]
);
```

### BigInt Operations
BigInt operations are slower than regular numbers. Minimize conversions:
```typescript
// Perform all calculations in BigInt
const total = amount1 + amount2 + amount3;
// Convert only for display
const display = formatTokenAmount(total, decimals);
```