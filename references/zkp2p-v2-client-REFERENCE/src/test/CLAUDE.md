# CLAUDE.md - ZKP2P V2 Testing Infrastructure Guide

This document provides comprehensive guidance for working with the sophisticated testing infrastructure in the ZKP2P V2 client. This is a financial application handling real user funds, so testing is critical for security and reliability.

## 🎯 Testing Philosophy

The ZKP2P testing strategy prioritizes:
- **Financial Accuracy**: Comprehensive testing of BigInt calculations and currency conversions
- **Security Validation**: Edge cases, overflow protection, and input sanitization
- **Deterministic Results**: Reproducible tests with controlled randomness
- **Failure Resilience**: Testing error scenarios and recovery mechanisms
- **Business Logic Focus**: 90%+ coverage of financial calculations and critical paths

## 🔧 Framework Choice: Vitest over Jest

**Why Vitest?**
- **Native Vite Integration**: Lightning-fast HMR and optimal build performance
- **ESM Support**: Better handling of modern JavaScript modules
- **TypeScript First**: Superior TypeScript support without additional configuration
- **Compatibility**: Jest-compatible API with enhanced features
- **Speed**: Significantly faster test execution for large codebases

```typescript
// Configuration: vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    pool: 'threads',
    isolate: true,
    clearMocks: true,
    testTimeout: 20000,
  }
});
```

## 📁 Test Organization

```
src/test/
├── setup.ts                    # Global test configuration with deterministic mocks
├── setup-env.ts               # Environment variable setup
├── README.md                  # Important notes about expected error outputs
├── mocks/                     # Comprehensive mock implementations
│   ├── contracts.ts           # Smart contract mocks (escrow, USDC, verifiers)
│   ├── contracts-failure.ts   # Failure scenario mocks for error testing
│   ├── contexts.tsx           # React Context mocks (Account, SmartContracts, etc.)
│   ├── privy.tsx             # Privy authentication mocks
│   ├── reclaim.ts            # ZK proof generation mocks
│   └── rollbar.ts            # Error logging mocks
└── utils/                     # Test utilities
    ├── test-utils.tsx         # React Testing Library wrapper with providers
    └── time.ts               # Time-based testing utilities

src/helpers/__tests__/         # Business logic unit tests
├── aprHelper.test.ts         # APR calculation tests (critical financial logic)
├── bigIntSerialization.test.ts # BigInt handling tests
├── intentHelper.test.ts      # Intent processing tests
├── units.test.ts            # Token unit conversion tests
└── parseEscrowState.test.ts # Escrow state parsing tests

src/hooks/__tests__/          # React hook tests
├── useQuoteStorage.test.ts   # Local storage integration tests
└── useRelayBridge.test.ts    # Cross-chain bridge tests
```

## 🛠️ Global Test Setup (`setup.ts`)

The setup file provides critical infrastructure:

### Deterministic Randomness
```typescript
// Uses Linear Congruential Generator for reproducible test results
let seed = 12345;
const lcg = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

// Mock crypto.getRandomValues for consistent wallet operations
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(lcg() * 256);
      }
      return arr;
    },
    randomUUID: () => '12345678-1234-4000-8000-123456789abc'
  }
});
```

### Browser API Mocks
```typescript
// Essential browser APIs for financial application
global.localStorage = localStorageMock;
global.sessionStorage = sessionStorageMock;
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Navigator clipboard for transaction hash copying
Object.defineProperty(window, 'navigator', {
  value: {
    clipboard: {
      writeText: vi.fn(),
      readText: vi.fn(),
    }
  }
});
```

### Automatic Cleanup
```typescript
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.resetModules();
  seed = 12345; // Reset deterministic seed
});
```

## 🧪 Financial Calculation Testing Patterns

### APR Calculation Testing
```typescript
// src/helpers/__tests__/aprHelper.test.ts
describe('calculateAPR', () => {
  const USDC_PRECISION = 10n ** 6n;
  const ETHER_PRECISION = 10n ** 18n;

  it('should calculate correct APR for positive spread', () => {
    const availableAmount = 1000n * USDC_PRECISION;
    const conversionRateUSDC = BigInt(1.05e18); // 5% spread
    const currencyPriceUSD = 1.0;
    const platformAverageDailyVolume = 10000;
    const platformCurrentLiquidity = 100000;

    const result = calculateAPR(
      availableAmount,
      conversionRateUSDC,
      currencyPriceUSD,
      platformAverageDailyVolume,
      platformCurrentLiquidity
    );

    // Detailed calculation verification
    // Days per cycle = 100k / 10k = 10 days
    // Number of cycles = 365 / 10 = 36.5
    // APR = 5% * 36.5 = 182.5%
    expect(result.apr).toBe(182.5);
    expect(result.spread).toBe(5.0);
  });

  it('should handle edge case with zero daily volume', () => {
    const result = calculateAPR(
      1000n * USDC_PRECISION,
      BigInt(1.05e18),
      1.0,
      0, // Zero volume should not crash
      100000
    );

    expect(result.apr).toBeNull();
    expect(result.spread).toBe(0);
  });
});
```

### BigInt Serialization Testing
```typescript
// src/helpers/__tests__/bigIntSerialization.test.ts
describe('Real-world scenario tests', () => {
  it('should handle extension proof error scenario', () => {
    const transferProof = {
      error: 'Failed to generate proof',
      details: {
        timestamp: BigInt(Date.now()),
        intentHash: '0x1234567890abcdef',
        amount: BigInt('1000000'), // 1 USDC
      },
    };

    // This would fail with JSON.stringify
    expect(() => JSON.stringify(transferProof)).toThrow();

    // But safeStringify should work
    const serialized = safeStringify(transferProof);
    expect(serialized).toBeTruthy();
    
    const parsed = JSON.parse(serialized);
    expect(parsed.details.amount).toBe('1000000');
  });
});
```

## 🏗️ Mock Infrastructure

### Smart Contract Mocks (`mocks/contracts.ts`)
```typescript
export const mockEscrowContract = {
  address: '0x1234567890123456789012345678901234567890',
  
  // Read methods with realistic return values
  depositCounter: vi.fn().mockResolvedValue(5n),
  intents: vi.fn().mockResolvedValue({
    on_ramp_address: '0xuser',
    to: '0xrecipient',
    deposit_id: 1n,
    amount: 1000000n, // 1 USDC
    status: 0, // OPEN
  }),
  
  // Write methods with transaction simulation
  createIntent: vi.fn().mockImplementation(async (amount, currencyId, platformId, to, options) => {
    return {
      hash: '0xmocktxhash',
      wait: vi.fn().mockResolvedValue({ 
        status: 1,
        transactionHash: '0xmocktxhash',
        blockNumber: 12345,
      }),
    };
  }),
  
  // Gas estimation
  estimateGas: {
    createIntent: vi.fn().mockResolvedValue(150000n),
    fulfillIntent: vi.fn().mockResolvedValue(200000n),
  },
};
```

### Failure Scenario Testing (`mocks/contracts-failure.ts`)
```typescript
export const ContractErrors = {
  INSUFFICIENT_ALLOWANCE: new Error('execution reverted: ERC20: insufficient allowance'),
  INSUFFICIENT_BALANCE: new Error('execution reverted: ERC20: transfer amount exceeds balance'),
  INTENT_EXPIRED: new Error('execution reverted: Intent has expired'),
  INVALID_PROOF: new Error('execution reverted: Invalid proof'),
  GAS_ESTIMATION_FAILED: new Error('cannot estimate gas; transaction may fail'),
  USER_REJECTED: new Error('user rejected transaction'),
};

// Apply failure scenarios to test error handling
export const applyFailureScenario = (mockContract: any, scenario: string) => {
  switch (scenario) {
    case 'INSUFFICIENT_ALLOWANCE':
      mockContract.createIntent.mockImplementationOnce(() => 
        mockTransactionFailures.revertedTransaction()
      );
      break;
    case 'USER_REJECTED':
      mockContract.createIntent.mockImplementationOnce(() => 
        mockTransactionFailures.userRejectedTransaction()
      );
      break;
  }
};
```

### React Context Mocks (`mocks/contexts.tsx`)
```typescript
export const mockAccountContext = {
  isLoggedIn: true,
  loggedInEOA: '0x1234567890123456789012345678901234567890',
  loginStatus: 'success' as const,
  userUsdcBalance: 10000000000n, // 10,000 USDC
  userChainId: 8453, // Base mainnet
  getAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
};

export const createContextWrapper = (contextOverrides?: {
  account?: Partial<typeof mockAccountContext>;
  smartContracts?: Partial<typeof mockSmartContractsContext>;
}) => {
  return ({ children }: { children: React.ReactNode }) => (
    <AccountContext.Provider value={{ ...mockAccountContext, ...contextOverrides?.account }}>
      {children}
    </AccountContext.Provider>
  );
};
```

## ⏰ Time-Based Testing (`utils/time.ts`)

Critical for testing intent expiration and proof validity:

```typescript
export const TIME_CONSTANTS = {
  INTENT_EXPIRY_TIME: 6 * 60 * 60 * 1000, // 6 hours
  PROOF_VALIDITY_TIME: 60 * 60 * 1000, // 1 hour
  TEST_TIMESTAMP_2024: new Date('2024-01-01T00:00:00Z').getTime(),
};

// Time test harness for intent expiration testing
export const createTimeTestHarness = () => ({
  setup: () => vi.useFakeTimers(),
  teardown: () => vi.useRealTimers(),
  
  advanceByHours: async (hours: number) => {
    await advanceTimersByTime(hours * 60 * 60 * 1000);
  },
  
  setTime: (timestamp: number) => {
    vi.setSystemTime(timestamp);
  },
});

// Helper for time-dependent tests
export const withFakeTime = async (
  testFn: () => Promise<void> | void,
  initialTime?: number
) => {
  vi.useFakeTimers();
  
  if (initialTime) {
    vi.setSystemTime(initialTime);
  }

  try {
    await testFn();
  } finally {
    vi.useRealTimers();
  }
};
```

### Time-Based Test Example
```typescript
describe('Intent Expiration', () => {
  it('should expire after 6 hours', async () => {
    await withFakeTime(async () => {
      const intent = createIntent();
      expect(isExpired(intent)).toBe(false);
      
      // Advance time by 6 hours
      vi.advanceTimersByTime(TIME_CONSTANTS.INTENT_EXPIRY_TIME);
      
      expect(isExpired(intent)).toBe(true);
    });
  });
});
```

## 🎣 React Hook Testing Patterns

### Using React Testing Library
```typescript
// src/hooks/__tests__/useQuoteStorage.test.ts
import { renderHook, act } from '@testing-library/react';

describe('useQuoteStorage', () => {
  const mockQuoteData: QuoteData = {
    usdcAmount: '1000',
    fiatAmount: '1000',
    fiatCurrency: 'USD',
    paymentPlatform: 'VENMO',
    // ... complete quote data
  };

  it('should save and retrieve quote data', () => {
    const { result } = renderHook(() => useQuoteStorage());
    
    act(() => {
      result.current.saveQuoteData('0xhash', mockQuoteData);
    });

    const retrieved = result.current.getQuoteData('0xhash');
    expect(retrieved).toEqual(mockQuoteData);
  });

  it('should handle localStorage errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('Storage quota exceeded');
    });

    const { result } = renderHook(() => useQuoteStorage());
    
    act(() => {
      result.current.saveQuoteData('0xhash', mockQuoteData);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to save quote data to localStorage:', 
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});
```

## 🚨 Error Handling & Failure Scenarios

### Testing Transaction Failures
```typescript
describe('Transaction Failures', () => {
  it('should handle insufficient allowance gracefully', async () => {
    applyFailureScenario(mockEscrowContract, 'INSUFFICIENT_ALLOWANCE');
    
    await expect(async () => {
      const tx = await mockEscrowContract.createIntent(...args);
      await tx.wait();
    }).rejects.toThrow('ERC20: insufficient allowance');
  });

  it('should retry failed transactions', async () => {
    const retryMock = mockRetryScenarios.failTwiceThenSucceed();
    mockEscrowContract.createIntent.mockImplementation(retryMock);
    
    const result = await performTransactionWithRetry();
    
    expect(retryMock).toHaveBeenCalledTimes(3);
    expect(result.hash).toBe('0xsuccess');
  });
});
```

### Testing Proof Generation Failures
```typescript
describe('Proof Generation', () => {
  it('should handle invalid proof structure', () => {
    const invalidProof = mockProofFailures.invalidProofStructure();
    
    expect(() => validateProof(invalidProof)).toThrow('Invalid proof format');
  });

  it('should handle expired proofs', () => {
    const expiredProof = mockProofFailures.expiredProof();
    
    expect(isProofValid(expiredProof)).toBe(false);
  });
});
```

## 🔒 Security & Overflow Testing

### BigInt Overflow Protection
```typescript
describe('Overflow Protection', () => {
  it('should handle maximum token amounts safely', () => {
    const maxUSDC = BigInt('1000000000000') * BigInt(10 ** 6);
    const result = processAmount(maxUSDC);
    expect(() => result.toString()).not.toThrow();
  });

  it('should prevent integer overflow in calculations', () => {
    const largeAmount = BigInt(Number.MAX_SAFE_INTEGER) * 1000n;
    expect(() => calculateFees(largeAmount)).not.toThrow();
  });
});
```

### Input Validation Testing
```typescript
describe('Input Validation', () => {
  it('should reject negative amounts', () => {
    expect(() => validateAmount('-100')).toThrow('Amount must be positive');
  });

  it('should sanitize malicious inputs', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const sanitized = sanitizeInput(maliciousInput);
    expect(sanitized).not.toContain('<script>');
  });
});
```

## 📊 Test Coverage Strategy

### Coverage Configuration (`vitest.config.ts`)
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: [
    'src/test/',
    'src/helpers/abi/**', // Contract ABIs
    'src/assets/**', // Static assets
    '**/*.stories.tsx', // Storybook files
  ],
}
```

### Coverage Goals
- **Business Logic**: 90%+ coverage for helpers, calculations
- **React Hooks**: 80%+ coverage for custom hooks
- **Error Paths**: All error scenarios tested
- **Edge Cases**: BigInt overflows, division by zero, malformed data
- **Critical Paths**: 100% coverage for financial calculations

### Running Coverage
```bash
yarn test:coverage    # Generate HTML coverage report
yarn test --reporter=verbose --coverage
```

## 🧰 Development Workflow

### Writing New Tests

1. **Identify Test Type**
   - Business logic → `src/helpers/__tests__/`
   - React hooks → `src/hooks/__tests__/`
   - Components → `src/components/[Feature]/__tests__/`

2. **Follow Naming Convention**
   ```typescript
   // Descriptive test names
   it('should calculate APR for positive spread with high daily volume', () => {
     // Implementation
   });
   ```

3. **Use Appropriate Patterns**
   ```typescript
   // Financial calculations
   const USDC_PRECISION = 10n ** 6n;
   const amount = 1000n * USDC_PRECISION;
   
   // Time-based tests
   await withFakeTime(async () => {
     // Test implementation
   });
   
   // Error scenarios
   applyFailureScenario(mockContract, 'INSUFFICIENT_ALLOWANCE');
   ```

### Testing Financial Logic

```typescript
describe('Currency Conversion', () => {
  it('should handle precision correctly for small amounts', () => {
    const amount = BigInt('1'); // 0.000001 USDC
    const rate = BigInt(1.5e18); // 1.5 conversion rate
    
    const result = convertCurrency(amount, rate);
    
    // Verify no precision loss
    expect(result).toBe(BigInt('1500000000000'));
  });

  it('should prevent rounding errors in fee calculations', () => {
    const principal = 1000000n; // 1 USDC
    const feeRate = 250n; // 2.5% (250 basis points)
    
    const fee = calculateFee(principal, feeRate);
    
    // Should be exactly 0.025 USDC (25000 units)
    expect(fee).toBe(25000n);
  });
});
```

### Error Handling Tests
```typescript
describe('Error Recovery', () => {
  it('should fallback to backup RPC on network error', async () => {
    // Primary RPC fails
    mockNetworkProvider.request.mockRejectedValueOnce(
      new Error('Network timeout')
    );
    
    // Backup RPC succeeds
    mockBackupProvider.request.mockResolvedValueOnce({
      result: '0x1234'
    });
    
    const result = await performRpcCall();
    
    expect(result).toBe('0x1234');
    expect(mockBackupProvider.request).toHaveBeenCalled();
  });
});
```

## 🐛 Debugging Tests

### Common Issues

1. **Async/Await Problems**
   ```typescript
   // ❌ Wrong - missing await
   it('should process transaction', () => {
     const result = processTransaction();
     expect(result.status).toBe('success');
   });
   
   // ✅ Correct - proper async handling
   it('should process transaction', async () => {
     const result = await processTransaction();
     expect(result.status).toBe('success');
   });
   ```

2. **Mock Cleanup Issues**
   ```typescript
   // Use beforeEach/afterEach for isolation
   beforeEach(() => {
     vi.clearAllMocks();
     resetContractMocks();
   });
   ```

3. **Time-Based Test Flakiness**
   ```typescript
   // ❌ Wrong - real time dependency
   it('should expire after 1 second', async () => {
     const start = Date.now();
     await sleep(1000);
     expect(isExpired(start)).toBe(true);
   });
   
   // ✅ Correct - controlled time
   it('should expire after 1 second', async () => {
     await withFakeTime(async () => {
       const start = Date.now();
       vi.advanceTimersByTime(1000);
       expect(isExpired(start)).toBe(true);
     });
   });
   ```

### Test Output Understanding

**Expected Error Messages in stderr**:
- "Failed to save quote data to localStorage: Error: Storage quota exceeded"
- "Failed to retrieve quote data from localStorage: SyntaxError: Unexpected token..."
- "Failed to clear quote data from localStorage: Error: Permission denied"

These are **NOT test failures** - they're expected outputs from error handling tests.

## 📋 Testing Checklist

Before submitting code:

- [ ] All tests pass (`yarn test`)
- [ ] New features have corresponding tests
- [ ] Error scenarios are tested
- [ ] BigInt operations are tested for overflow
- [ ] Financial calculations have precision tests
- [ ] Mock cleanup is proper
- [ ] Time-dependent code uses fake timers
- [ ] Coverage meets minimum thresholds
- [ ] No console warnings in test output
- [ ] Tests are deterministic and not flaky

## 🔄 Continuous Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Daily scheduled runs

CI configuration ensures:
- All 135+ tests must pass
- Coverage thresholds are met
- No flaky test failures
- Proper test isolation

## 🎯 Best Practices Summary

1. **Use Deterministic Testing**: Control randomness and time for reproducible results
2. **Test Financial Logic Thoroughly**: BigInt precision, overflow protection, edge cases
3. **Mock External Dependencies**: Smart contracts, APIs, browser storage
4. **Test Error Scenarios**: Network failures, user rejection, contract reverts
5. **Maintain Test Isolation**: Clean mocks between tests, avoid shared state
6. **Focus on Business Logic**: Prioritize critical financial calculations
7. **Use Descriptive Names**: Tests should read like specifications
8. **Keep Tests Fast**: Use mocks instead of real network calls
9. **Test Edge Cases**: Empty inputs, maximum values, boundary conditions
10. **Document Complex Tests**: Explain financial calculations and test scenarios

Remember: This is a financial application handling real user funds. Every test is a safety net protecting user assets and platform integrity.