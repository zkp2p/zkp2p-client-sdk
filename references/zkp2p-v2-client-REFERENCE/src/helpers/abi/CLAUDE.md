# Contract ABIs - Development Context

## Overview
This directory contains Application Binary Interface (ABI) definitions for all smart contracts integrated with the ZKP2P V2 client. ABIs define the contract interface and are essential for blockchain interactions through Viem.

## Key Files and Structure
```
src/helpers/abi/
├── escrowAbi.ts                # Core escrow contract for deposits and intents
├── gatingAbi.ts                # Access control and fee management
├── vaultAbi.ts                 # Vault contract for fund management
├── usdcAbi.ts                  # USDC token contract interface
├── platformVerifiers/          # Payment platform verifiers
│   ├── venmoVerifierAbi.ts     # Venmo payment verification
│   ├── revolutVerifierAbi.ts   # Revolut payment verification
│   ├── cashAppVerifierAbi.ts   # Cash App payment verification
│   ├── wiseVerifierAbi.ts      # Wise payment verification
│   ├── mercadoPagoVerifierAbi.ts # MercadoPago verification
│   ├── monzoVerifierAbi.ts     # Monzo payment verification
│   └── zelleVerifierAbi.ts     # Zelle payment verification
└── index.ts                    # Re-exports all ABIs
```

## Architecture Patterns

### ABI Organization Pattern
Each ABI is exported as a TypeScript const with `as const` assertion for type safety:
```typescript
export const escrowAbi = [...] as const;
```

This enables Viem's TypeScript integration to provide:
- Auto-completion for function names
- Type-safe arguments
- Proper return type inference

### Contract Function Categories

#### Escrow Contract Functions
**Intent Management:**
- `signalIntent(uint256,uint256,address)` - Create new swap intent
- `fulfillIntent(uint256,address)` - Liquidity provider fulfills intent
- `releaseFundsToPayer(uint256,bytes32,bytes32)` - Release funds after proof
- `cancelIntent(uint256)` - Cancel expired intent

**Deposit Management:**
- `createDeposit(uint256,uint256,bool)` - Create liquidity deposit
- `withdrawDeposit(uint256)` - Withdraw liquidity
- `withdrawPartialDeposit(uint256,uint256)` - Partial withdrawal

**View Functions:**
- `intents(uint256)` - Get intent details
- `deposits(uint256)` - Get deposit details
- `depositCounter()` - Current deposit count
- `intentCounter()` - Current intent count

#### Platform Verifier Functions
All platform verifiers share common interface:
- `verifyProof(bytes,uint256[])` - Verify ZK proof on-chain
- `validateSignatures(bytes32,bytes[])` - Check witness signatures
- `getProofData(bytes32)` - Retrieve proof metadata

### Integration with Viem

#### Reading Contract Data
```typescript
import { escrowAbi } from '@helpers/abi';
import { basePublicClient } from '@helpers/baseClient';

const intent = await basePublicClient.readContract({
  address: escrowAddress,
  abi: escrowAbi,
  functionName: 'intents',
  args: [BigInt(intentId)]
});
```

#### Writing Transactions
```typescript
import { escrowAbi } from '@helpers/abi';

const { writeContractAsync } = usePrivyTransaction();

const tx = await writeContractAsync({
  address: escrowAddress,
  abi: escrowAbi,
  functionName: 'signalIntent',
  args: [depositId, tokenAmount, recipientAddress],
  value: intentFee // ETH value for fees
});
```

#### Multicall Pattern
```typescript
const calls = [
  {
    address: escrowAddress,
    abi: escrowAbi,
    functionName: 'intents',
    args: [BigInt(1)]
  },
  {
    address: escrowAddress,
    abi: escrowAbi,
    functionName: 'deposits',
    args: [BigInt(1)]
  }
];

const results = await basePublicClient.multicall({ contracts: calls });
```

## Development Guidelines

### Adding New Platform Verifiers
1. Create new ABI file: `src/helpers/abi/[platform]VerifierAbi.ts`
2. Export const with proper TypeScript assertion
3. Add to index.ts exports
4. Update deployed_addresses.ts with contract address
5. Integrate in SmartContractsContext

### ABI Updates
When contracts are upgraded:
1. Generate new ABI from contract compilation
2. Replace ABI array in corresponding file
3. Maintain `as const` assertion for type safety
4. Test all affected transaction hooks
5. Update TypeScript types if interface changed

### Type Safety Best Practices
```typescript
// Always use BigInt for uint256 values
const amount = BigInt('1000000'); // 1 USDC

// Use proper address typing
const address: `0x${string}` = '0x...';

// Handle optional returns safely
const result = await readContract(...);
if (result) {
  // Process result
}
```

## Testing Strategy

### Mock ABIs in Tests
```typescript
import { vi } from 'vitest';

export const mockEscrowAbi = [
  {
    name: 'signalIntent',
    type: 'function',
    inputs: [...],
    outputs: []
  }
] as const;
```

### Contract Interaction Testing
- Mock successful transactions
- Test gas estimation
- Verify argument encoding
- Handle revert scenarios

## Common Tasks

### Reading Intent Status
```typescript
const { data: intent } = useReadContract({
  address: escrowAddress,
  abi: escrowAbi,
  functionName: 'intents',
  args: [BigInt(intentId)],
  enabled: Boolean(intentId)
});

const status = intent?.status; // 0=OPEN, 1=FULFILLED, 2=CANCELLED
```

### Checking Deposit Balance
```typescript
const { data: deposit } = useReadContract({
  address: escrowAddress,
  abi: escrowAbi,
  functionName: 'deposits',
  args: [BigInt(depositId)]
});

const availableAmount = deposit?.available_amount;
```

### Verifying Platform Proof
```typescript
const isValid = await basePublicClient.readContract({
  address: venmoVerifierAddress,
  abi: venmoVerifierAbi,
  functionName: 'verifyProof',
  args: [proofBytes, publicInputs]
});
```

## Integration Points

### Connected Systems
- **SmartContractsContext**: Provides contract instances with ABIs
- **Transaction Hooks**: Use ABIs for all contract interactions
- **Wagmi Hooks**: Integrate with useReadContract/useWriteContract
- **Base Client**: Direct contract reads via Viem

### Security Considerations
- ABIs are compile-time constants (safe to expose)
- Never include private keys or sensitive data
- Validate all inputs before contract calls
- Handle transaction failures gracefully
- Implement proper gas estimation

### Error Handling Patterns
```typescript
try {
  const tx = await writeContractAsync({
    address: escrowAddress,
    abi: escrowAbi,
    functionName: 'signalIntent',
    args: [...]
  });
} catch (error) {
  if (error.message.includes('insufficient funds')) {
    // Handle specific error
  }
  throw error;
}
```

## Performance Considerations

### Caching Strategy
- ABIs are imported once and reused
- Contract reads cached by wagmi
- Multicall for batch operations
- Minimize redundant RPC calls

### Gas Optimization
- Batch operations when possible
- Use view functions for data reads
- Estimate gas with buffer (110%)
- Implement retry logic for gas spikes