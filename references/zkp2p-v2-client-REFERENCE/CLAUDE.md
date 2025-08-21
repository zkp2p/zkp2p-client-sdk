# CLAUDE.md - ZKP2P V2 Client Development Assistant Guide

This document provides comprehensive guidance for Claude (or any AI assistant) to effectively work with the ZKP2P V2 client codebase. It includes project-specific conventions, architecture details, common tasks, and best practices.

## 🎯 Project Overview

ZKP2P V2 is a trustless peer-to-peer fiat-crypto exchange platform that uses zero-knowledge proofs to verify off-chain payments. The client is a React/TypeScript application that interfaces with smart contracts on Base (Ethereum L2).

### Core Technologies
- **Frontend**: React 18.2.0, TypeScript 5.3.3, styled-components 5.3.5
- **Blockchain**: Viem 2.21.61, @privy-io/wagmi 1.0.1 (Privy-wrapped wagmi), @zerodev/sdk 5.4.41
- **Smart Accounts**: EIP-7702 delegation via ZeroDev Kernel V3.3, gas sponsorship via paymaster
- **Zero-Knowledge**: snarkjs (custom fork), @zkp2p/circuits-circom-helpers 0.2.3-rc3
- **Authentication**: Privy.io 2.19.0 (email, Google, Twitter, wallets), EIP-7702 authorization
- **Build Tool**: Vite 7.0.3
- **Testing**: Vitest 3.2.4, React Testing Library 16.3.0

## 📁 Project Structure

```
zkp2p-v2-client/
├── src/
│   ├── components/          # React components (organized by feature)
│   ├── contexts/           # React Context providers for global state
│   ├── helpers/            # Utilities, types, constants, ABIs
│   │   └── __tests__/      # Business logic unit tests
│   ├── hooks/              # Custom React hooks
│   │   └── __tests__/      # Hook unit tests
│   ├── pages/              # Route-level components
│   ├── test/               # Test infrastructure
│   │   ├── setup.ts        # Global test setup
│   │   ├── mocks/          # Mock implementations
│   │   └── utils/          # Test utilities
│   └── theme/              # Design system and styled-components theme
├── vite.config.ts          # Vite configuration
├── vitest.config.ts        # Vitest test configuration
├── index.html              # Entry HTML file (at root for Vite)
├── public/                 # Static assets
└── build/                  # Production build output
```

## 🔧 Development Commands

```bash
# Install dependencies
yarn install

# Start development server (port 3000)
yarn dev  # or yarn start

# Build for production
yarn build

# Preview production build locally
yarn preview

# Linting
yarn lint           # Check for linting errors
yarn lint:fix       # Fix linting errors automatically

# Type checking
yarn typecheck      # Run TypeScript type checking

# Testing
yarn test           # Run tests
yarn test:ui        # Run tests with UI interface
yarn test:coverage  # Run tests with coverage report
yarn test:watch     # Run tests in watch mode
```

## 🏗️ Architecture Patterns

### State Management
The application uses React Context API for global state management. Key contexts organized in provider hierarchy:

1. **AccountContext** (`src/contexts/Account/`)
   - User authentication state via Privy
   - Connected wallet information
   - User preferences and login state

2. **SmartAccountContext** (`src/contexts/SmartAccount/`)
   - EIP-7702 authorization state and wallet compatibility
   - Smart account address and gas sponsorship tracking
   - Kernel client for UserOperations
   - Gas savings statistics

3. **SmartContractsContext** (`src/contexts/SmartContracts/`)
   - Contract instances and network configuration
   - Contract interaction helpers and addresses
   - Multi-chain contract support

4. **TokenDataContext** (`src/contexts/TokenData/`)
   - Dynamic token data management with Relay API integration
   - Multi-provider token data aggregation
   - Cross-chain token metadata

5. **BalancesContext** (`src/contexts/Balances/`)
   - Token balances including dynamic tokens beyond USDC/ETH
   - Real-time balance updates with wagmi hooks
   - Multi-chain balance tracking

6. **EscrowContext** (`src/contexts/Escrow/`)
   - Active swap intents and escrow state tracking
   - Wagmi-based contract reads with optimized polling
   - Intent state management and lifecycle tracking

7. **DepositsContext** (`src/contexts/Deposits/`)
   - Liquidity provider deposits and orders
   - Migrated to wagmi hooks for improved state management
   - Deposit counter and user deposit tracking

8. **LiquidityContext** (`src/contexts/Liquidity/`)
   - Global liquidity pool data and market depth
   - Batch fetching for performance optimization
   - Liquidity provider analytics

9. **OnRamperIntentsContext** (`src/contexts/OnRamperIntents/`)
   - Tracks user's active swap intents
   - Intent lifecycle and status updates
   - Integration with escrow and deposit contexts

10. **BackendContext** (`src/contexts/Backend/`)
    - API client configuration and authentication
    - Privy token-based backend integration
    - Payee details and external service integration

11. **ExtensionProxyProofsContext** (`src/contexts/ExtensionProxyProofs/`)
    - Browser extension communication for ZK proof generation
    - Version checking and metadata handling
    - Platform-specific proof generation

12. **GeolocationContext** (`src/contexts/Geolocation/`)
    - User location data for currency/platform defaults
    - Compliance and regional feature gating

13. **ModalSettingsContext** (`src/contexts/ModalSettings/`)
    - Centralized modal management system
    - Modal state coordination across components

### Component Organization

```typescript
// Standard component structure
src/components/
├── [Feature]/
│   ├── [Feature]Modal.tsx      # Main modal component
│   ├── [Feature]Form.tsx       # Form components
│   ├── [Feature]Table.tsx      # Data display
│   ├── components/             # Sub-components
│   └── hooks/                  # Feature-specific hooks
```

### Styling Approach

```typescript
// styled-components pattern used throughout
import styled from 'styled-components';

const StyledComponent = styled.div`
  ${({ theme }) => `
    color: ${theme.colors.primary};
    padding: ${theme.spacing.md};
  `}
`;

// Theme is provided via ThemeProvider in App.tsx
```

## 💼 Smart Contract Integration

### Contract Architecture
```
Escrow.sol          # Main trading contract
├── Manages swap intents
├── Handles fund escrow
└── Integrates with verifiers

Payment Verifiers   # Platform-specific proof verification
├── VenmoVerifier.sol
├── RevolutVerifier.sol
├── WiseVerifier.sol
├── MonzoVerifier.sol
└── [Platform]Verifier.sol

Gating Service      # Access control & fees
```

### Contract Interaction Pattern (Smart Account Enabled)
```typescript
// Using usePrivyTransaction for smart account support
const { writeContractAsync } = usePrivyTransaction();

// Creates intent with automatic gas sponsorship if smart account enabled
const tx = await writeContractAsync({
  address: escrowAddress,
  abi: escrowAbi,
  functionName: 'createIntent',
  args: [amountUSDC, currencyId, platformId, recipientAddress],
  value: intentFee
});
```

## 🚀 Smart Account Integration (EIP-7702)

### Overview
The application implements EIP-7702 smart accounts to provide gas-free transactions for users. This removes the need for users to hold ETH for gas fees, significantly improving UX.

### Key Features
- **Zero Gas Fees**: All transactions sponsored through ZeroDev paymaster
- **One-Time Authorization**: Users sign once to enable smart account features  
- **Automatic Fallback**: Gracefully falls back to EOA transactions for unsupported wallets
- **Gas Savings Tracking**: Displays total gas saved and sponsored transaction count
- **Batch Transactions**: Support for multiple operations in a single UserOperation

### Technical Implementation

#### Authorization Flow
```typescript
// Uses Privy's useSign7702Authorization hook
const { sign7702Authorization } = useSign7702Authorization();

// Authorization targets ZeroDev's Kernel V3.3
const authorization = await sign7702Authorization({
  address: kernelImplementationAddress,
  chainId: currentChain.id
});
```

#### Infrastructure Configuration
```typescript
const BUNDLER_RPC = `https://rpc.zerodev.app/api/v2/bundler/${ZERODEV_PROJECT_ID}?provider=ALCHEMY`;
const PAYMASTER_RPC = `https://rpc.zerodev.app/api/v2/paymaster/${ZERODEV_PROJECT_ID}?provider=ALCHEMY`;
```

#### Smart Account Context State
- `eip7702AuthorizationStatus`: 'idle' | 'pending' | 'authorized' | 'failed' | 'unauthorized'
- `isSmartAccountEnabled`: Boolean indicating if smart accounts can be used
- `gasSponsorshipStats`: Tracks total gas saved and transaction count
- `eoa7702Support`: Indicates wallet's EIP-7702 support capability

### How It Works
1. **Authorization**: On wallet connection, users sign an EIP-7702 authorization
2. **Delegation**: User's EOA delegates execution to ZeroDev's Kernel V3.3 contract
3. **UserOperations**: Transactions are bundled as UserOperations
4. **Gas Sponsorship**: ZeroDev's paymaster covers all gas costs
5. **Execution**: Bundler executes the UserOperation on-chain

### Smart Account UI Components
- **SmartAccountBadge**: Shows authorization status and gas sponsorship
  - States: "Enable Smart Account" (yellow), "Authorizing..." (blue), "Gas Free" (green), "Authorization Error" (red)
- **GasSponsorshipDisplay**: Displays total gas saved in USD and transaction count
- **Account Dropdown**: Enhanced with smart account status and controls

### Wallet Support
- **Privy Embedded Wallets**: Full EIP-7702 support with automatic authorization
- **External Wallets**: Variable support
  - MetaMask: Support depends on version
  - Rainbow: Limited support  
  - Coinbase Wallet: Limited support
  - Other wallets: Automatic capability detection
- **Detection**: Automatic capability detection with graceful fallback

### Transaction Execution Pattern
```typescript
// Using usePrivyTransaction hook for unified interface
const { writeContractAsync, executeBatch } = usePrivyTransaction();

// Smart account path (if enabled and authorized)
if (isSmartAccountEnabled && kernelClient && gasSponsorship) {
  // Execute via UserOperation with gas sponsorship
  const result = await writeContractAsync({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'methodName',
    args: [...],
    value: BigInt(0)
  });
} else {
  // Fall back to regular wagmi wallet client
}
```

### Important Contract Methods

**Escrow Contract**
- `signalIntent()` - Signal new swap intent
- `createIntent()` - Create new swap intent
- `fulfillIntent()` - Liquidity provider fulfills intent
- `releaseFundsToPayer()` - Release funds after proof verification
- `cancelIntent()` - Cancel expired intent
- `createDeposit()` - Create liquidity deposit
- `withdrawDeposit()` - Withdraw liquidity

**Verifier Contracts**
- `verifyProof()` - Verify ZK proof on-chain
- `validateSignatures()` - Check witness signatures

## 🧭 Navigation Structure

The application features a responsive navigation system with the following main sections:
- **Migrate**: Account migration interface for legacy wallet users (homepage)
- **Buy**: Purchase crypto using fiat payment methods (Venmo, Revolut, etc.)
- **Sell**: Create liquidity deposits to sell crypto for fiat
- **Liquidity**: Manage liquidity provider deposits and earnings

## 🔑 Key Development Patterns

### 1. Custom Hooks Pattern
```typescript
// Always use custom hooks for complex logic
const useSwapFlow = () => {
  const { account } = useAccount();
  const { escrowContract } = useSmartContracts();
  
  const createSwapIntent = useCallback(async (params) => {
    // Implementation
  }, [escrowContract, account]);
  
  return { createSwapIntent };
};
```

### 2. Error Handling
```typescript
// Consistent error handling pattern
try {
  const result = await someAsyncOperation();
  toast.success('Operation successful!');
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  toast.error(getErrorMessage(error));
  throw error;
}
```

### 3. Loading States
```typescript
// Standard loading state management
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  setIsLoading(true);
  try {
    await performAction();
  } finally {
    setIsLoading(false);
  }
};
```

### 4. Type Safety
```typescript
// Always define interfaces for data structures
interface SwapIntent {
  id: string;
  amount: bigint;
  currency: Currency;
  platform: PaymentPlatform;
  status: IntentStatus;
  expiresAt: number;
}

// Use type guards
const isValidIntent = (intent: unknown): intent is SwapIntent => {
  return typeof intent === 'object' && 
         intent !== null &&
         'id' in intent &&
         'amount' in intent;
};
```

## 🔄 Wagmi and Viem Integration

### Architecture Overview
The application uses `@privy-io/wagmi` (not standard wagmi) for seamless integration with Privy authentication. Viem provides low-level blockchain interactions with strong TypeScript support.

**Recent Migration (August 2025)**: The app has migrated contract reads from manual fetch functions to wagmi hooks for improved state management, automatic caching, and better error handling.

### Configuration (`src/config/wagmi.ts`)
```typescript
import { http } from 'viem';
import { base, baseSepolia, hardhat } from 'viem/chains';
import { createConfig } from '@privy-io/wagmi';

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia, hardhat],
  transports: {
    [base.id]: http(alchemyBaseRpcUrl),
    [baseSepolia.id]: http(alchemySepoliaRpcUrl),
    [hardhat.id]: http(),
  },
});
```

### Wagmi Hook Migration Pattern
```typescript
// Old pattern - Manual fetching
const fetchDeposits = useCallback(async () => {
  const deposits = await contract.read.getUserDeposits([account]);
  setDeposits(deposits);
}, [account, contract]);

// New pattern - Wagmi hooks with optimized polling
const { data: deposits, refetch } = useReadContract({
  address: escrowAddress,
  abi: escrowAbi,
  functionName: 'getUserDeposits',
  args: [account],
  enabled: Boolean(account && account !== ZERO_ADDRESS),
  staleTime: 0, // Always fetch fresh data on manual refetch
  gcTime: 0,    // Don't cache stale data
});
```

### Viem Usage Patterns

#### Public Clients for Reading
```typescript
// Base network client (src/helpers/baseClient.ts)
export const basePublicClient = createPublicClient({
  chain: base,
  transport: http(alchemyBaseRpcUrl),
});

// Contract reading
const balance = await basePublicClient.readContract({
  address: tokenAddress,
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [userAddress],
});
```

#### Utility Functions
- `formatUnits`, `parseUnits` - Token amount conversions
- `encodeAbiParameters`, `decodeEventLog` - ABI operations
- `keccak256`, `encodePacked` - Cryptographic operations
- Native `bigint` support throughout

### Transaction Abstraction (`usePrivyTransaction`)
```typescript
// Unified interface for EOA and smart account transactions
const { writeContractAsync, executeBatch, sendTransaction } = usePrivyTransaction();

// Automatically routes to appropriate execution path:
// - Smart Account: UserOperations via ZeroDev
// - EOA: Standard wagmi wallet client
```

### Migration from Ethers.js
- **BigNumber → bigint**: Native JavaScript BigInt
- **Providers → Clients**: PublicClient/WalletClient pattern
- **Contract instances → Direct calls**: No contract abstraction layer
- **Type safety**: `Address` and `Hex` types enforced

## 🔐 Privy Authentication Integration

### Provider Configuration (`src/index.tsx`)
```typescript
<PrivyProvider
  appId={import.meta.env.VITE_PRIVY_APP_ID}
  config={{
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
    },
    loginMethods: ['email', 'google', 'twitter', 'coinbase_wallet'],
    appearance: {
      theme: '#0E111C',
      accentColor: '#df2e2d',
    },
  }}
>
```

### Authentication Methods
1. **Primary Methods**:
   - Email/password
   - Google OAuth
   - Twitter OAuth  
   - Coinbase Smart Wallet

2. **External Wallets** (overflow menu):
   - MetaMask, Rainbow, Rabby
   - Auto-detected wallets

### Account States
- `LOGGED_OUT`: Not authenticated
- `AUTHENTICATED`: Privy embedded wallet user
- `EOA`: External wallet connected

### Key Features
- **Embedded Wallets**: Automatically created for users without wallets
- **Wallet Export**: Users can export private keys from embedded wallets
- **Backend Authentication**: Privy access tokens for API calls
- **Smart Account Integration**: Automatic EIP-7702 authorization attempts

### Usage in Components
```typescript
// Account context wraps Privy hooks
const { loginState, authenticatedUser, connectWallet } = useAccount();

// Backend API authentication
const accessToken = await getAccessToken();
const response = await fetch(url, {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

## 🛠️ Common Development Tasks

### Adding a New Payment Platform

The platform currently supports: Venmo, Revolut, CashApp, Wise, MercadoPago, Monzo, and Zelle (with multiple bank integrations).

1. **Update Types** (`src/helpers/types/paymentPlatform.ts`)
```typescript
export enum PaymentPlatform {
  // ... existing platforms
  NEW_PLATFORM = 'new_platform'
}
```

2. **Add Platform Configuration** (`src/helpers/constants.ts`)
```typescript
export const PLATFORM_CONFIGS = {
  [PaymentPlatform.NEW_PLATFORM]: {
    name: 'New Platform',
    icon: 'new-platform-icon.svg',
    supportedCurrencies: [Currency.USD],
  }
};
```

3. **Create Verifier Integration**
   - Add ABI to `src/helpers/abi/`
   - Update `deployed_addresses.ts`
   - Add to `SmartContractsContext`

4. **Update UI Components**
   - Add to platform selector in `SwapModal`
   - Update proof submission flow
   - Add platform-specific instructions

### Migrating to Wagmi Hooks (August 2025 Pattern)

When refactoring manual contract reads to wagmi hooks:

1. **Replace Manual Fetching**
```typescript
// Before: Manual contract reading
const [data, setData] = useState(null);
const fetchData = useCallback(async () => {
  const result = await contract.read.getData();
  setData(result);
}, [contract]);

// After: Wagmi hook with optimized caching
const { data, refetch } = useReadContract({
  address: contractAddress,
  abi: contractAbi,
  functionName: 'getData',
  enabled: Boolean(shouldFetch),
  staleTime: 0,  // Fresh data on manual refetch
  gcTime: 0,     // Don't cache stale data
});
```

2. **Add RPC Sync Delays After Transactions**
```typescript
const handleTransaction = async () => {
  const tx = await writeContractAsync({...});
  await tx.wait();
  
  // Allow RPC nodes to sync
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Trigger fresh data fetch
  refetch();
};
```

3. **Configure Polling Appropriately**
   - Remove unnecessary polling for user-controlled data
   - Keep polling for external state (like intent fulfillment)
   - Use longer intervals for rarely-changing data (deposit counter: 30s)

### Adding a New Currency

1. **Update Currency Enum** (`src/helpers/types.ts`)
```typescript
export enum Currency {
  // ... existing currencies
  NEW_CURRENCY = 'NEW'
}
```

2. **Add Currency Configuration** (`src/helpers/currencies.ts`)
```typescript
export const CURRENCY_CONFIGS = {
  [Currency.NEW_CURRENCY]: {
    name: 'New Currency',
    symbol: 'NEW',
    flagIcon: 'flag-new',
    decimals: 2,
  }
};
```

3. **Update Exchange Rates**
   - Add to rate fetching logic
   - Update display components

### Working with the Send Feature

The Send feature allows users to send multiple tokens (not just USDC) to other addresses with ENS and Solana address support.

Key components:
- **Send Page** (`src/pages/Send.tsx`) - Main send interface
- **TokenDataContext** - Manages dynamic token data from Relay API
- ENS name resolution for Ethereum addresses
- Partial Solana address support

### Working with Cross-Chain Features

The application supports cross-chain token bridging through two providers:

1. **Relay Bridge** (`useRelayBridge` hook)
   - Integration with Reservoir's Relay SDK
   - Supports multiple chains and tokens
   - Primary bridging solution

2. **Socket Bridge** (`useSocketBridge` hook)  
   - Alternative bridging provider
   - Requires `VITE_SOCKET_API_KEY` environment variable
   - Fallback option for unsupported routes

### Implementing a New Feature

1. **Create Feature Context** (if needed)
```typescript
// src/contexts/NewFeature/NewFeatureContext.tsx
export const NewFeatureContext = createContext<NewFeatureContextType>({
  // default values
});

export const NewFeatureProvider: React.FC = ({ children }) => {
  // Implementation
};
```

2. **Create Feature Components**
```typescript
// src/components/NewFeature/NewFeatureModal.tsx
export const NewFeatureModal: React.FC<Props> = ({ isOpen, onClose }) => {
  // Implementation
};
```

3. **Add Routes** (if needed)
```typescript
// src/App.tsx
<Route path="/new-feature" element={<NewFeaturePage />} />
```

4. **Update Navigation**
   - Add to `TopNav` or `BottomNav`
   - Update routing logic

## 🔐 Security Best Practices

### 1. Input Validation
```typescript
// Always validate user inputs
const validateAmount = (amount: string): boolean => {
  const parsed = parseFloat(amount);
  return !isNaN(parsed) && parsed > 0 && parsed <= MAX_AMOUNT;
};
```

### 2. Safe BigInt Operations
```typescript
// Use proper BigInt handling
const amountInWei = ethers.utils.parseUnits(amount, USDC_DECIMALS);
const displayAmount = ethers.utils.formatUnits(amountInWei, USDC_DECIMALS);
```

### 3. Transaction Safety
```typescript
// Always estimate gas and handle failures
const estimatedGas = await contract.estimateGas.method(params);
const tx = await contract.method(params, {
  gasLimit: estimatedGas.mul(110).div(100) // 10% buffer
});
```

### 4. Private Key Handling
- Never log or expose private keys
- Use environment variables for sensitive data
- Implement proper key management

## 🧪 Testing Guidelines

### Testing Framework
The project uses **Vitest** as the testing framework, chosen for its native Vite integration and superior performance. Tests focus on business logic, with comprehensive coverage for critical financial calculations.

### Test Organization
```
src/
├── helpers/__tests__/       # Business logic unit tests
│   ├── aprHelper.test.ts   # APR calculation tests
│   ├── units.test.ts       # Token unit conversion tests
│   ├── intentHelper.test.ts # Intent processing tests
│   ├── failure-scenarios.test.ts # Error handling tests
│   └── overflow-protection.test.ts # BigInt safety tests
├── hooks/__tests__/         # React hook tests
│   ├── useCurrencyPrices.test.ts
│   └── useQuoteStorage.test.ts
└── test/                    # Test infrastructure
    ├── setup.ts            # Global setup with deterministic randomness
    ├── mocks/              # Comprehensive mocks
    └── utils/              # Test utilities including time helpers
```

### Running Tests
```bash
# Run all tests
yarn test

# Run with UI (great for debugging)
yarn test:ui

# Generate coverage report
yarn test:coverage

# Watch mode for development
yarn test:watch

# Run specific test file
yarn test src/helpers/__tests__/aprHelper.test.ts
```

### Writing Business Logic Tests
```typescript
// src/helpers/__tests__/aprHelper.test.ts
import { describe, it, expect } from 'vitest';
import { calculateAPR } from '../aprHelper';

describe('aprHelper', () => {
  describe('calculateAPR', () => {
    it('should calculate correct APR for positive spread', () => {
      const availableAmount = 1000n * 10n ** 6n; // 1000 USDC
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

      expect(result.apr).toBe(182.5);
      expect(result.spread).toBe(5.0);
    });

    it('should handle division by zero safely', () => {
      const result = calculateAPR(
        1000n * 10n ** 6n,
        BigInt(1.05e18),
        1.0,
        0, // Zero volume should not crash
        100000
      );

      expect(result.apr).toBeNull();
      expect(result.spread).toBe(0);
    });
  });
});
```

### Testing React Hooks
```typescript
// src/hooks/__tests__/useQuoteStorage.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useQuoteStorage from '../useQuoteStorage';

describe('useQuoteStorage', () => {
  it('should save and retrieve quote data', () => {
    const { result } = renderHook(() => useQuoteStorage());
    
    act(() => {
      result.current.saveQuoteData('0xhash', mockQuoteData);
    });

    const retrieved = result.current.getQuoteData('0xhash');
    expect(retrieved).toEqual(mockQuoteData);
  });
});
```

### Mocking Best Practices
```typescript
// src/test/mocks/contracts.ts
import { vi } from 'vitest';
import { BigNumber } from 'ethers';

export const mockEscrowContract = {
  createIntent: vi.fn().mockResolvedValue({
    hash: '0x123...',
    wait: vi.fn().mockResolvedValue({ status: 1 })
  }),
  intents: vi.fn().mockImplementation((id: number) => ({
    on_ramp_address: '0xuser',
    amount: BigNumber.from('1000000'), // 1 USDC
    status: 1, // Active
  })),
  estimateGas: {
    createIntent: vi.fn().mockResolvedValue(BigNumber.from('200000'))
  }
};
```

### Time-Based Testing
```typescript
// Using time utilities for deterministic tests
import { describe, it, expect, vi } from 'vitest';
import { withFakeTime, TIME_CONSTANTS } from '@test/utils/time';

describe('Intent Expiration', () => {
  it('should expire after 6 hours', async () => {
    await withFakeTime(async () => {
      const startTime = Date.now();
      
      // Create intent
      const intent = createIntent();
      expect(isExpired(intent)).toBe(false);
      
      // Advance time by 6 hours
      vi.advanceTimersByTime(TIME_CONSTANTS.INTENT_EXPIRY_TIME);
      
      expect(isExpired(intent)).toBe(true);
    });
  });
});
```

### Failure Scenario Testing
```typescript
// Comprehensive error handling tests
import { ContractErrors, applyFailureScenario } from '@test/mocks/contracts-failure';

describe('Transaction Failures', () => {
  it('should handle insufficient allowance gracefully', async () => {
    applyFailureScenario(mockEscrowContract, 'INSUFFICIENT_ALLOWANCE');
    
    await expect(async () => {
      const tx = await mockEscrowContract.createIntent(...args);
      await tx.wait();
    }).rejects.toThrow('ERC20: insufficient allowance');
  });
});
```

### Test Coverage Goals
- **Business Logic**: 90%+ coverage for helpers, calculations
- **React Hooks**: 80%+ coverage for custom hooks
- **Error Paths**: All error scenarios tested
- **Edge Cases**: BigInt overflows, division by zero, malformed data

### Security-Focused Testing
```typescript
describe('Overflow Protection', () => {
  it('should handle maximum token amounts safely', () => {
    const maxUSDC = BigInt('1000000000000') * BigInt(10 ** 6);
    const result = processAmount(maxUSDC);
    expect(() => result.toString()).not.toThrow();
  });
});
```

## 📝 Code Style Guidelines

### TypeScript Conventions
- Use explicit return types for functions
- Prefer interfaces over types for objects
- Use enums for fixed sets of values
- Implement proper error types

### React Conventions
- Use functional components with hooks
- Implement proper memoization (React.memo, useMemo, useCallback)
- Keep components focused and single-purpose
- Extract complex logic to custom hooks

### Naming Conventions
- Components: PascalCase (`SwapModal`)
- Hooks: camelCase with 'use' prefix (`useSwapFlow`)
- Constants: UPPER_SNAKE_CASE (`MAX_SLIPPAGE`)
- Interfaces: PascalCase with 'I' prefix optional (`ISwapIntent` or `SwapIntent`)

## 🚨 Common Pitfalls & Solutions

### 1. BigInt Serialization
```typescript
// Problem: BigInt doesn't serialize to JSON
// Solution: Use the bigIntSerialization helper utilities
import { safeStringify, safeParse } from '@helpers/bigIntSerialization';

// For simple serialization
const jsonString = safeStringify(objectWithBigInts);

// For parsing back with known BigInt fields
const parsed = safeParse(jsonString, ['amount', 'timestamp']);

// See src/helpers/CLAUDE.md for complete documentation
```

### 2. Wallet Connection Issues
```typescript
// Always check wallet connection before blockchain operations
if (!account || !signer) {
  toast.error('Please connect your wallet');
  return;
}
```

### 3. Gas Estimation Failures
```typescript
// Handle gas estimation errors gracefully
try {
  const gas = await contract.estimateGas.method(params);
} catch (error) {
  // Fallback to manual gas limit
  const gas = ethers.BigNumber.from('500000');
}
```

### 4. Race Conditions
```typescript
// Use proper cleanup in useEffect
useEffect(() => {
  let cancelled = false;
  
  const fetchData = async () => {
    const result = await loadData();
    if (!cancelled) {
      setData(result);
    }
  };
  
  fetchData();
  return () => { cancelled = true; };
}, []);
```

## 🔄 Deployment & Environment

### Environment Variables

**Important: After migrating to Vite, all environment variables must be prefixed with `VITE_`**

```bash
# Required environment variables (all prefixed with VITE_)
VITE_ALCHEMY_API_KEY=            # Ethereum RPC provider
VITE_PRIVY_APP_ID=              # Authentication service with EIP-7702 support
VITE_ZERODEV_APP_ID=            # ZeroDev project ID for smart accounts (mainnet)
VITE_ZERODEV_SEPOLIA_PROJECT_ID= # ZeroDev project ID for smart accounts (testnet)
VITE_RECLAIM_APP_ID=            # ZK proof generation
VITE_RECLAIM_APP_SECRET=        # ZK proof secret
VITE_CURATOR_API_URL=           # Backend API endpoint
VITE_DEPLOYMENT_ENVIRONMENT=     # LOCAL|staging|production
VITE_SOCKET_API_KEY=            # Socket bridge API key (optional)
```

**Accessing Environment Variables:**
```typescript
// Old CRA method:
// process.env.ALCHEMY_API_KEY

// New Vite method:
import.meta.env.VITE_ALCHEMY_API_KEY
```

### Build Configuration (Vite)
- Lightning-fast HMR in development
- Optimized production builds with Rollup
- Automatic code splitting and lazy loading
- Node.js polyfills configured for blockchain libraries
- SVG support via vite-plugin-svgr
- Source maps disabled in production
- Environment variables injected at build time (with VITE_ prefix)
- Assets hashed for cache busting
- Custom port 3000 to match previous CRA setup
- **Node.js version**: 18.20.6 (required for Vercel deployment)

### Deployment Checklist
1. ✅ Update environment variables
2. ✅ Run production build
3. ✅ Test critical flows
4. ✅ Verify contract addresses
5. ✅ Check API endpoints
6. ✅ Monitor error tracking

## 🎯 Quick Reference

### Key Files
- **HTML Entry**: `index.html` (at project root for Vite)
- **Entry Point**: `src/index.tsx`
- **Main App**: `src/App.tsx`
- **Routes**: Defined in `App.tsx`
- **Vite Config**: `vite.config.ts`
- **Theme**: `src/theme/index.tsx`
- **Types**: `src/helpers/types.ts`
- **Constants**: `src/helpers/constants.ts`
- **Contract Addresses**: `src/helpers/deployed_addresses.ts`

### Important Hooks

#### Core Context Hooks
- `useAccount()` - User account state and authentication
- `useSmartAccount()` - Smart account authorization and gas sponsorship stats
- `usePrivyTransaction()` - Unified transaction execution (EOA/UserOperations)
- `useSmartContracts()` - Contract instances and network configuration
- `useDeposits()` - Liquidity deposits with wagmi integration
- `useEscrow()` - Active intents with optimized polling
- `useLiquidity()` - Global liquidity data and analytics
- `useBackend()` - API client with Privy authentication
- `useExtensionProxyProofs()` - Extension communication for ZK proofs
- `useGeolocation()` - User location and compliance
- `useModal()` - Modal state management
- `useOnRamperIntents()` - User swap intents tracking
- `useTokenData()` - Dynamic token data from Relay API
- `useBalances()` - Multi-token balance tracking

#### Transaction & Bridge Hooks
- `useRelayBridge()` - Primary cross-chain bridging solution
- `useSocketBridge()` - Alternative bridging provider
- `useTokenApprove()` - USDC approval management (recently fixed)

### Common Patterns
- Modal-based UI flows
- Step-by-step wizards
- Real-time data updates
- Optimistic UI updates
- Error boundary protection

## 💡 Development Tips

1. **Always check existing patterns** before implementing new features
2. **Use TypeScript strictly** - avoid 'any' types
3. **Test on Base testnet** before mainnet
4. **Monitor gas costs** for all transactions
5. **Implement proper loading states** for better UX
6. **Handle errors gracefully** with user-friendly messages
7. **Keep components small** and focused
8. **Document complex logic** with comments
9. **Use semantic commit messages**
10. **Test across different wallets** (MetaMask, Coinbase, etc.)
11. **Use wagmi hooks for contract reads** instead of manual fetching
12. **Add RPC sync delays** after transaction confirmations
13. **Configure appropriate polling intervals** based on data update frequency
14. **Test smart account flows** with different wallet types
15. **Reference subdirectory CLAUDE.md files** for component-specific guidance

## 🆘 Troubleshooting

### Common Issues

1. **Build/Development Issues (Vite-specific)**
   - Environment variables not loading: Ensure all are prefixed with `VITE_`
   - Module not found errors: Check vite.config.ts path aliases
   - Polyfill errors: Verify vite-plugin-node-polyfills configuration
   - HMR not working: Check port 3000 availability
   - Clear `.vite` cache directory if encountering strange issues

2. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version (16+)
   - Verify all environment variables have VITE_ prefix
   - Run `yarn build` to test production build

3. **Transaction Failures**
   - Check wallet balance
   - Verify network (Base mainnet)
   - Increase gas limit

4. **Proof Generation Issues**
   - Ensure Reclaim extension installed
   - Check proof parameters
   - Verify witness signatures

5. **State Synchronization**
   - Check WebSocket connection
   - Verify API endpoints
   - Clear local storage

## 📋 Component-Specific Documentation

This root CLAUDE.md provides the overall architecture overview. For detailed component-specific guidance, reference the following subdirectory CLAUDE.md files:

### Context Documentation
- **`src/contexts/CLAUDE.md`** - Complete state management patterns and provider hierarchy
- **`src/contexts/SmartContracts/CLAUDE.md`** - Contract integration and blockchain state management
- **`src/contexts/Account/CLAUDE.md`** - Privy authentication and wallet management

### Component Documentation  
- **`src/components/CLAUDE.md`** - Component organization and reusable patterns
- **`src/components/common/CLAUDE.md`** - Shared UI components and design system
- **`src/components/layouts/CLAUDE.md`** - Layout components and navigation
- **`src/components/modals/CLAUDE.md`** - Modal system and overlay management
- **`src/components/Account/CLAUDE.md`** - Authentication and account management
- **`src/components/SmartAccount/CLAUDE.md`** - EIP-7702 smart account UI components
- **`src/components/Swap/CLAUDE.md`** - Core swap functionality and proof generation
- **`src/components/Send/CLAUDE.md`** - Multi-token send and bridging features
- **`src/components/Deposits/CLAUDE.md`** - Liquidity provider interfaces
- **`src/components/Liquidity/CLAUDE.md`** - Market liquidity and analytics
- **`src/components/legacy/CLAUDE.md`** - Deprecated components and migration guides

### Infrastructure Documentation
- **`src/helpers/CLAUDE.md`** - Utility functions, types, and business logic
- **`src/helpers/abi/CLAUDE.md`** - Smart contract ABIs and integration patterns
- **`src/helpers/legacy/CLAUDE.md`** - Legacy cryptographic utilities (Poseidon, Groth16)
- **`src/helpers/strings/CLAUDE.md`** - Centralized string constants and i18n foundation
- **`src/hooks/CLAUDE.md`** - Custom React hooks and state management
- **`src/hooks/contexts/CLAUDE.md`** - Context hook patterns and usage
- **`src/hooks/transactions/CLAUDE.md`** - Transaction hooks and smart account integration
- **`src/config/CLAUDE.md`** - Configuration files and environment setup
- **`src/test/CLAUDE.md`** - Testing strategies and mock implementations
- **`src/theme/CLAUDE.md`** - Design system and theming
- **`src/assets/CLAUDE.md`** - Asset organization and loading strategies

### Feature-Specific Documentation
- **`src/pages/CLAUDE.md`** - Page-level components and routing
- **`src/hooks/backend/CLAUDE.md`** - Backend API integration hooks
- **`src/hooks/bridge/CLAUDE.md`** - Cross-chain bridging hooks

## 🎯 Architecture Summary

ZKP2P V2 client is a sophisticated React application built on modern web3 infrastructure:

- **Smart Account Integration**: EIP-7702 delegation with gas sponsorship
- **Robust State Management**: 13 specialized React contexts with wagmi integration  
- **Financial Security**: Comprehensive testing and transaction safety measures
- **Cross-Chain Support**: Multi-token bridging through Relay and Socket
- **ZK Proof Generation**: Browser extension integration for privacy-preserving payments
- **Modern Tooling**: Vite build system, TypeScript, Vitest testing

When developing, always reference component-specific CLAUDE.md files for detailed implementation guidance while using this document for overall architecture understanding.

Remember: This is a financial application handling real user funds. Always prioritize security, test thoroughly, and handle edge cases carefully.