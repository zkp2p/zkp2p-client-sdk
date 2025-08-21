# Transaction Hooks - Development Context

## Overview
This directory contains React hooks that manage all blockchain transaction flows in the ZKP2P V2 client. These hooks provide a unified interface for smart contract interactions, supporting both traditional EOA wallets and EIP-7702 smart accounts with gas sponsorship.

## Key Files and Structure
```
src/hooks/transactions/
├── useFulfillIntent.ts         # Liquidity provider fulfills swap intent
├── useSignalIntent.ts          # Create new swap intent
├── useProvePaymentIntentHooks.ts # Submit ZK proof for payment verification
├── useCreateDeposit.ts         # Create liquidity deposit
├── useWithdrawDeposit.ts       # Withdraw liquidity (full or partial)
├── useCancelIntent.ts          # Cancel expired intents
├── usePrivyTransaction.ts      # Unified transaction interface (EOA/Smart Account)
├── useTokenApprove.ts          # ERC20 token approval management
├── useExtendDeposit.ts         # Extend deposit duration
└── __tests__/                  # Comprehensive test coverage
    ├── useFulfillIntent.test.ts
    ├── useSignalIntent.test.ts
    ├── useProvePaymentIntentHooks.test.ts
    ├── useCreateDeposit.test.ts
    ├── useWithdrawDeposit.test.ts
    └── useCancelIntent.test.ts
```

## Architecture Patterns

### Unified Transaction Interface
The `usePrivyTransaction` hook provides a single interface that automatically routes transactions:

```typescript
// Automatically handles both EOA and Smart Account paths
const { writeContractAsync, executeBatch, sendTransaction } = usePrivyTransaction();

// Smart Account path (if enabled)
if (isSmartAccountEnabled && kernelClient) {
  // UserOperation with gas sponsorship
  return kernelClient.writeContract(params);
}

// EOA path (fallback)
return walletClient.writeContract(params);
```

### Standard Hook Pattern
Each transaction hook follows this consistent structure:

```typescript
export const useTransactionHook = () => {
  // 1. Input state management
  const [input1, setInput1] = useState<string>('');
  const [input2, setInput2] = useState<string>('');
  
  // 2. Transaction state
  const [isTransacting, setIsTransacting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  
  // 3. Context dependencies
  const { escrowContract } = useSmartContracts();
  const { writeContractAsync } = usePrivyTransaction();
  
  // 4. Input validation
  const isValidInput = useMemo(() => {
    return validateInput1(input1) && validateInput2(input2);
  }, [input1, input2]);
  
  // 5. Transaction execution
  const handleTransaction = useCallback(async () => {
    if (!isValidInput) return;
    
    setIsTransacting(true);
    try {
      const tx = await writeContractAsync({
        address: escrowAddress,
        abi: escrowAbi,
        functionName: 'methodName',
        args: [...],
        value: BigInt(0)
      });
      
      setTransactionHash(tx);
      await refetchData(); // Trigger data refresh
      return tx;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    } finally {
      setIsTransacting(false);
    }
  }, [isValidInput, writeContractAsync]);
  
  // 6. Return interface
  return {
    // Inputs
    input1,
    setInput1,
    input2,
    setInput2,
    
    // State
    isTransacting,
    transactionHash,
    isValidInput,
    
    // Actions
    handleTransaction,
    resetState: () => {
      setInput1('');
      setInput2('');
      setTransactionHash(null);
    }
  };
};
```

### Smart Account vs EOA Handling

#### Smart Account Path (Gas-Free)
```typescript
// When EIP-7702 is enabled and authorized
const kernelClient = useKernelClient();
if (kernelClient && gasSponsorship) {
  const userOpHash = await kernelClient.writeContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'methodName',
    args: [...],
    value: BigInt(0),
    // Gas sponsored by paymaster
  });
  
  // Track gas savings
  updateGasSavings(estimatedGasCost);
}
```

#### EOA Path (User Pays Gas)
```typescript
// Traditional wallet transaction
const walletClient = useWalletClient();
const txHash = await walletClient.writeContract({
  address: contractAddress,
  abi: contractAbi,
  functionName: 'methodName',
  args: [...],
  value: BigInt(0),
  gas: estimatedGas * 110n / 100n // 10% buffer
});
```

## Development Guidelines

### Adding New Transaction Hooks
1. Create hook file: `src/hooks/transactions/use[ActionName].ts`
2. Follow standard hook pattern (inputs, state, execution)
3. Use `usePrivyTransaction` for unified execution
4. Add comprehensive tests
5. Export from index file

### Input Validation Pattern
```typescript
// Validate before enabling transaction
const isValidInput = useMemo(() => {
  // Check required fields
  if (!depositId || !tokenAmount) return false;
  
  // Validate numeric inputs
  const amount = BigInt(tokenAmount);
  if (amount <= 0n) return false;
  
  // Check business rules
  if (amount > maxAmount) return false;
  
  return true;
}, [depositId, tokenAmount, maxAmount]);
```

### Error Handling Strategy
```typescript
const handleTransaction = async () => {
  try {
    const tx = await writeContractAsync({...});
    toast.success('Transaction submitted!');
    return tx;
  } catch (error: any) {
    // Log with correlation ID for debugging
    const errorId = generateErrorId();
    console.error(`[${errorId}] Transaction failed:`, error);
    
    // User-friendly error messages
    if (error.message?.includes('insufficient funds')) {
      toast.error('Insufficient balance for transaction');
    } else if (error.message?.includes('user rejected')) {
      toast.info('Transaction cancelled');
    } else {
      toast.error(`Transaction failed: ${error.message || 'Unknown error'}`);
    }
    
    throw error; // Re-throw for caller handling
  }
};
```

## Testing Strategy

### Test Coverage Requirements
- **Happy Path**: Successful transaction flow
- **Input Validation**: Invalid inputs prevent execution
- **Error Scenarios**: Network failures, contract reverts
- **State Management**: Proper state transitions
- **Smart Account**: Both paths tested

### Mock Pattern
```typescript
import { vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies
vi.mock('@hooks/contexts/useSmartContracts');
vi.mock('@hooks/contexts/usePrivyTransaction');

describe('useTransactionHook', () => {
  it('should execute transaction successfully', async () => {
    const mockWriteContract = vi.fn().mockResolvedValue('0xtxhash');
    mockUsePrivyTransaction.mockReturnValue({
      writeContractAsync: mockWriteContract
    });
    
    const { result } = renderHook(() => useTransactionHook());
    
    act(() => {
      result.current.setInput1('value1');
      result.current.setInput2('value2');
    });
    
    await act(async () => {
      await result.current.handleTransaction();
    });
    
    expect(mockWriteContract).toHaveBeenCalledWith({
      address: expect.any(String),
      abi: expect.any(Array),
      functionName: expect.any(String),
      args: expect.any(Array)
    });
  });
});
```

## Common Tasks

### Creating a Swap Intent
```typescript
const {
  depositIdInput,
  setDepositIdInput,
  tokenAmountInput,
  setTokenAmountInput,
  handleSignalIntent,
  isTransacting
} = useSignalIntent();

// Set inputs
setDepositIdInput('123');
setTokenAmountInput('1000000'); // 1 USDC

// Execute transaction
await handleSignalIntent();
```

### Fulfilling an Intent
```typescript
const {
  intentIdInput,
  setIntentIdInput,
  handleFulfillIntent
} = useFulfillIntent();

setIntentIdInput(intentId);
await handleFulfillIntent();
```

### Submitting Payment Proof
```typescript
const {
  intentHash,
  setIntentHash,
  proof,
  setProof,
  handleProvePayment
} = useProvePaymentIntentHooks();

setIntentHash(hash);
setProof(zkProofData);
await handleProvePayment();
```

## Integration Points

### Context Dependencies
- **SmartContractsContext**: Contract addresses and network config
- **AccountContext**: User wallet and authentication
- **SmartAccountContext**: EIP-7702 authorization state
- **EscrowContext**: Intent and deposit data refresh
- **DepositsContext**: User deposit management

### Data Refresh Pattern
```typescript
// After successful transaction, refresh affected data
const { refetch: refetchIntents } = useEscrow();
const { refetch: refetchDeposits } = useDeposits();

const handleTransaction = async () => {
  const tx = await writeContractAsync({...});
  
  // Wait for RPC nodes to sync
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Refresh data
  await Promise.all([
    refetchIntents(),
    refetchDeposits()
  ]);
  
  return tx;
};
```

### Gas Optimization
```typescript
// Estimate gas with buffer
const estimateGas = async (params) => {
  try {
    const estimated = await publicClient.estimateContractGas(params);
    return estimated * 110n / 100n; // 10% buffer
  } catch {
    return 500000n; // Fallback gas limit
  }
};
```

## Security Considerations

### Input Sanitization
- Validate all numeric inputs as BigInt
- Check for overflow/underflow
- Verify addresses are valid
- Enforce business rule constraints

### Transaction Safety
- Always estimate gas before execution
- Implement retry logic for gas spikes
- Handle nonce conflicts
- Verify transaction receipt

### Error Logging
```typescript
// Structured error logging
const logTransactionError = (error: any, context: any) => {
  const errorLog = {
    timestamp: Date.now(),
    errorId: generateErrorId(),
    message: error.message,
    stack: error.stack,
    context: {
      functionName: context.functionName,
      args: context.args,
      userAddress: context.userAddress
    }
  };
  
  console.error('[Transaction Error]', errorLog);
  
  // Send to monitoring service in production
  if (import.meta.env.PROD) {
    sendToMonitoring(errorLog);
  }
};
```

## Performance Considerations

### State Management
- Use `useMemo` for computed values
- Implement `useCallback` for stable references
- Avoid unnecessary re-renders
- Batch state updates when possible

### RPC Optimization
- Cache contract instances
- Use multicall for batch reads
- Implement request deduplication
- Add appropriate polling intervals

### Memory Management
- Clear transaction state after completion
- Reset inputs on success
- Cleanup event listeners
- Avoid memory leaks in async operations