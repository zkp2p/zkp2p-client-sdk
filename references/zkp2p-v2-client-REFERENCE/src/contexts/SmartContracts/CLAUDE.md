# SmartContracts Integration Documentation

## SmartContracts Architecture

The SmartContracts context serves as the central hub for all blockchain interactions in ZKP2P. It manages contract addresses, ABIs, network configurations, and provides a consistent interface for smart contract operations across the application.

### Contract Ecosystem
```
Core Contracts:
├── Escrow.sol              # Main trading and fund management
├── Payment Verifiers       # Platform-specific proof verification
│   ├── VenmoVerifier
│   ├── RevolutVerifier
│   ├── WiseVerifier
│   ├── CashAppVerifier
│   ├── MercadoPagoVerifier
│   └── ZelleVerifier
├── Gating Service          # Access control and fees
└── Token Contracts         # USDC, USDT ERC20 interfaces
```

### Network Support
- **Production**: Base mainnet
- **Staging**: Base Sepolia testnet  
- **Local**: Hardhat development

## Implementation Patterns

### Context Structure
```typescript
interface SmartContractsValues {
  // Network info
  blockscanUrl?: string | null;
  
  // Token addresses
  usdcAddress: string | null;
  usdtAddress: string | null;
  
  // Core contracts
  escrowAddress: string | null;
  escrowAbi: Abi | null;
  
  // Platform verifiers
  platformToVerifierAddress: {
    [key in PaymentPlatformType]?: string | null;
  };
  platformToVerifierAbi: {
    [key in PaymentPlatformType]?: Abi | null;
  };
  
  // Witness signers
  witnessSigner: string | null;
}
```

### Environment-Based Configuration
```typescript
// Address resolution based on environment
const addresses = useMemo(() => {
  if (DEPLOYMENT_ENVIRONMENT === "LOCAL") {
    return LOCAL_ESCROW_ADDRESS;
  } else if (isSepolia) {
    return SEPOLIA_ESCROW_ADDRESS;
  } else {
    return PRODUCTION_ESCROW_ADDRESS;
  }
}, [chain?.id]);
```

### Contract Integration Pattern
```typescript
// Wagmi-based pattern
const { data, refetch } = useContractRead({
  address: contractAddress,
  abi: contractAbi,
  functionName: 'methodName',
  args: [param1, param2],
  enabled: Boolean(contractAddress && userAddress),
  watch: true, // Auto-update on new blocks
});
```

## Key Files and Structure

### Contract ABIs (`/helpers/abi/`)
- Individual TypeScript files per contract
- Strongly typed ABI definitions
- Consistent naming: `[contractName].abi.ts`

### Address Management (`/helpers/deployed_addresses.ts`)
```typescript
// Centralized address constants
export const PRODUCTION_ESCROW_ADDRESS = "0x...";
export const SEPOLIA_ESCROW_ADDRESS = "0x...";

// Platform-specific mappings
export const PRODUCTION_PAYMENT_PLATFORM_ADDRESSES = {
  [PaymentPlatform.VENMO]: "0x...",
  [PaymentPlatform.REVOLUT]: "0x...",
  // ...
};
```

### Transaction Hooks (`/hooks/transactions/`)
Each contract method has a dedicated hook:
- `useCreateDeposit`: Liquidity deposits
- `useFulfillIntent`: Proof submission
- `useSignalIntent`: Intent creation
- `useCancelIntent`: Intent cancellation

## Integration Points

### Transaction Lifecycle
```typescript
1. Prepare → usePrepareContractWrite (simulation)
2. Execute → useContractWrite (user signing)
3. Wait → useWaitForTransaction (confirmation)
4. Parse → Event extraction from logs
```

### Gas Optimization Strategy
```typescript
// 2x priority fee for faster inclusion
request: {
  maxPriorityFeePerGas: (existing: bigint) => existing * BigInt(2),
}
```

### Error Handling Hierarchy
1. **Preparation errors**: Invalid parameters
2. **Signing errors**: User rejection
3. **Mining errors**: Transaction reverts
4. **Parsing errors**: Event decoding

### Event Parsing
```typescript
// Extract data from transaction logs
export function extractIntentFromLogs(logs: Log[]): Intent {
  const escrowInterface = new Interface(escrowAbi);
  const parsedLog = escrowInterface.parseLog(log);
  return {
    onRamper: parsedLog.args.onRamper,
    deposit: parsedLog.args.deposit,
    amount: parsedLog.args.amount,
    // ...
  };
}
```

## Development Patterns

### Adding New Payment Platform
1. **Add Verifier ABI**:
   ```typescript
   // src/helpers/abi/newPlatformVerifier.abi.ts
   export const newPlatformVerifierAbi = [...] as const;
   ```

2. **Update Addresses**:
   ```typescript
   // src/helpers/deployed_addresses.ts
   PRODUCTION_PAYMENT_PLATFORM_ADDRESSES[PaymentPlatform.NEW] = "0x...";
   ```

3. **Add to Context**:
   ```typescript
   // SmartContractsProvider.tsx
   platformToVerifierAddress[PaymentPlatform.NEW] = addresses.new;
   platformToVerifierAbi[PaymentPlatform.NEW] = newPlatformVerifierAbi;
   ```

### Contract Upgrade Process
1. Deploy new contract version
2. Update address in `deployed_addresses.ts`
3. Update ABI if interface changed
4. Test on staging environment
5. Coordinate frontend deployment with contract upgrade

### Type Safety Patterns
```typescript
// Strongly typed contract calls
const typedContract = getContract({
  address: escrowAddress,
  abi: escrowAbi,
  signerOrProvider: provider
}) as EscrowContract;

// Type-safe event parsing
const event = typedContract.filters.IntentCreated();
```

## Testing Approach

### Unit Testing
- ABI encoding/decoding
- Address resolution logic
- Event parsing functions

### Integration Testing
- Mock contract interactions
- Transaction flow simulation
- Error scenario handling

### E2E Testing
- Testnet deployments
- Full transaction flows
- Multi-platform verification

## Common Issues & Solutions

### Network Mismatch
- Auto-switch prompts
- Clear network indicators
- Fallback configurations

### Gas Estimation Failures
- Simulation before execution
- Clear error messages
- Manual gas overrides

### Event Parsing Errors
- Robust error handling
- Fallback to raw logs
- Debug logging

## Security Considerations

### Best Practices
- No private keys in code
- Input validation before contract calls
- Transaction simulation
- Reentrancy protection awareness

### Access Control
- Gating service integration
- Witness signer verification
- Platform-specific permissions

## Future Enhancements

### Planned Improvements
- Multicall optimization
- Event subscription system
- Gas price optimization
- Contract upgradeability

### Extension Points
- New verifier contracts
- Alternative token support
- Cross-chain deployments
- Advanced fee models