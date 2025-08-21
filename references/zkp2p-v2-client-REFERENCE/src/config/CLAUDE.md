# CLAUDE.md - Application Configuration

This document provides comprehensive guidance for working with the ZKP2P V2 client configuration system, including wagmi setup, multi-chain configuration, Privy integration, and environment management.

## 🎯 Overview

The configuration system manages blockchain connections, RPC providers, environment-specific settings, and integration with authentication services. It provides a robust foundation for multi-chain operations across development, staging, and production environments.

## 📁 Key Files and Structure

```
src/config/
├── wagmi.ts            # Main wagmi configuration with environment-based chain selection
└── ../helpers/config.ts # RPC URL configuration and Alchemy endpoints
```

### Core Configuration Files

**`wagmi.ts`** - Primary blockchain configuration
- Environment-based chain selection
- Multi-chain transport configuration  
- Privy-wrapped wagmi integration
- Dynamic chain loading based on deployment environment

**`../helpers/config.ts`** - RPC provider configuration
- Alchemy endpoint URLs for all supported networks
- Centralized API key management
- Environment variable integration

## 🏗️ Architecture Patterns

### Environment-Based Chain Selection

The configuration system dynamically selects blockchain networks based on the deployment environment:

```typescript
// Environment validation with fallback
const VALID_ENVIRONMENTS = ['LOCAL', 'STAGING', 'PRODUCTION', 'STAGING_TESTNET'] as const;
type ValidEnvironment = typeof VALID_ENVIRONMENTS[number];

const validateEnvironment = (env: string): ValidEnvironment => {
  if (!env) {
    console.warn('No VITE_DEPLOYMENT_ENVIRONMENT set, defaulting to LOCAL');
    return 'LOCAL';
  }
  
  if (!VALID_ENVIRONMENTS.includes(env as ValidEnvironment)) {
    console.warn(`Unknown environment "${env}", defaulting to LOCAL`);
    return 'LOCAL';
  }
  
  return env as ValidEnvironment;
};
```

### Chain Mapping Strategy

Each environment maps to specific blockchain networks:

```typescript
const getChainsForEnvironment = (env: ValidEnvironment) => {
  if (env === 'STAGING' || env === 'PRODUCTION') {
    return [base];                    // Base mainnet
  } else if (env === 'STAGING_TESTNET') {
    return [baseSepolia];            // Base testnet
  } else {
    return [hardhat];                // Local development
  }
};
```

### Dynamic Transport Configuration

Transport configuration adapts to available chains:

```typescript
const createTransports = () => {
  const transports: Record<number, any> = {};
  
  chains.forEach((chain) => {
    if (chain.id === base.id) {
      transports[chain.id] = http(alchemyBaseRpcUrl);
    } else if (chain.id === baseSepolia.id) {
      transports[chain.id] = http(alchemyBaseSepoliaRpcUrl);
    } else if (chain.id === hardhat.id) {
      transports[chain.id] = http('http://localhost:8545');
    }
  });
  
  return transports;
};
```

### Privy Integration Pattern

Uses `@privy-io/wagmi` instead of standard wagmi for seamless authentication integration:

```typescript
import { createConfig } from '@privy-io/wagmi';  // Not from 'wagmi'

export const wagmiConfig = createConfig({
  chains,
  transports: createTransports(),
});
```

## 🔧 Development Guidelines

### Environment Variable Requirements

**Required Environment Variables:**
```bash
VITE_DEPLOYMENT_ENVIRONMENT=LOCAL|STAGING|PRODUCTION|STAGING_TESTNET
VITE_ALCHEMY_API_KEY=your_alchemy_api_key
VITE_ALCHEMY_SOLANA_API_KEY=your_solana_api_key  # For cross-chain features
```

### Environment Configuration Matrix

| Environment | Chains | RPC Provider | Use Case |
|-------------|--------|--------------|----------|
| `LOCAL` | Hardhat | Local node (8545) | Development |
| `STAGING` | Base mainnet | Alchemy | Pre-production testing |
| `PRODUCTION` | Base mainnet | Alchemy | Live application |
| `STAGING_TESTNET` | Base Sepolia | Alchemy | Testnet validation |

### Adding New Networks

1. **Import Chain Definition**
```typescript
import { newChain } from 'viem/chains';
```

2. **Update Environment Mapping**
```typescript
const getChainsForEnvironment = (env: ValidEnvironment) => {
  // Add new chain to appropriate environment
  if (env === 'NEW_ENV') {
    return [newChain];
  }
  // ... existing mappings
};
```

3. **Configure Transport**
```typescript
const createTransports = () => {
  // Add transport configuration
  if (chain.id === newChain.id) {
    transports[chain.id] = http(newChainRpcUrl);  
  }
};
```

4. **Update RPC Configuration**
```typescript
// In src/helpers/config.ts
export const newChainRpcUrl = `https://new-chain.provider.com/v2/${import.meta.env.VITE_NEW_CHAIN_API_KEY}`;
```

### Environment Detection Patterns

```typescript
// Get current environment safely
const env = import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT;
const validatedEnv = validateEnvironment(env);

// Check environment conditionally
if (validatedEnv === 'PRODUCTION') {
  // Production-specific logic
}

// Get appropriate chain for current environment
const defaultChain = getDefaultChain();
```

## 🚀 Common Development Tasks

### 1. Switching Between Environments

**Development Setup:**
```bash
# Local development
VITE_DEPLOYMENT_ENVIRONMENT=LOCAL

# Staging testing
VITE_DEPLOYMENT_ENVIRONMENT=STAGING

# Testnet validation
VITE_DEPLOYMENT_ENVIRONMENT=STAGING_TESTNET
```

### 2. Adding Custom RPC Providers

```typescript
// In src/helpers/config.ts
export const customProviderUrl = `https://custom-provider.com/rpc`;

// In wagmi.ts createTransports()
if (chain.id === customChain.id) {
  transports[chain.id] = http(customProviderUrl);
}
```

### 3. Debugging Connection Issues

**Common Debug Steps:**
```typescript
// Check current configuration
console.log('Environment:', import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT);
console.log('Chains:', chains);
console.log('Default Chain:', getDefaultChain());

// Validate RPC connectivity
const publicClient = createPublicClient({
  chain: getDefaultChain(),
  transport: http(/* appropriate RPC URL */)
});

try {
  const blockNumber = await publicClient.getBlockNumber();
  console.log('Connected to block:', blockNumber);
} catch (error) {
  console.error('RPC connection failed:', error);
}
```

### 4. Environment-Specific Feature Flags

```typescript
// Use environment for conditional features
const enableAdvancedFeatures = validatedEnv === 'PRODUCTION' || validatedEnv === 'STAGING';

// Chain-specific contract addresses
const getContractAddress = () => {
  const chain = getDefaultChain();
  if (chain.id === base.id) {
    return MAINNET_CONTRACT_ADDRESS;
  } else if (chain.id === baseSepolia.id) {
    return TESTNET_CONTRACT_ADDRESS;
  }
  return LOCAL_CONTRACT_ADDRESS;
};
```

## 🔗 Integration Points

### Smart Contracts Context Integration

The configuration directly feeds into smart contract initialization:

```typescript
// SmartContractsContext uses wagmiConfig
const { chainId } = useAccount();
const currentChain = chains.find(chain => chain.id === chainId) || getDefaultChain();

// Contract addresses adapt to current chain
const escrowAddress = getEscrowAddress(currentChain.id);
```

### Privy Provider Integration

Configuration must align with Privy provider setup:

```typescript
// In src/index.tsx
<PrivyProvider
  appId={import.meta.env.VITE_PRIVY_APP_ID}
  config={{
    // Privy config must match wagmi chains
    supportedChains: chains,
  }}
>
  <WagmiProvider config={wagmiConfig}>
    {/* App components */}
  </WagmiProvider>
</PrivyProvider>
```

### Smart Account Integration

Configuration provides chain context for smart account features:

```typescript
// Smart account deployment addresses vary by chain
const getKernelAddress = (chainId: number) => {
  if (chainId === base.id) {
    return MAINNET_KERNEL_ADDRESS;
  } else if (chainId === baseSepolia.id) {
    return TESTNET_KERNEL_ADDRESS;
  }
  return LOCAL_KERNEL_ADDRESS;
};
```

## 🚨 Security Considerations

### API Key Management

```typescript
// ✅ Correct: Environment variables with VITE_ prefix
const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY;

// ❌ Incorrect: Hardcoded API keys
const apiKey = 'alch_1234567890abcdef';
```

### RPC URL Validation

```typescript
// Validate RPC URLs before use
const validateRpcUrl = (url: string): boolean => {
  try {
    new URL(url);
    return url.startsWith('https://') || url.startsWith('http://localhost');
  } catch {
    return false;
  }
};
```

### Environment Boundary Enforcement

```typescript
// Prevent cross-environment contamination
if (validatedEnv === 'PRODUCTION') {
  // Only allow mainnet chains
  if (!chains.every(chain => chain.testnet === false)) {
    throw new Error('Production environment cannot include testnets');
  }
}
```

## 🧪 Testing Configuration

### Unit Testing Configuration

```typescript
// Test environment setup
describe('wagmi configuration', () => {
  beforeEach(() => {
    // Mock environment variables
    vi.stubEnv('VITE_DEPLOYMENT_ENVIRONMENT', 'LOCAL');
    vi.stubEnv('VITE_ALCHEMY_API_KEY', 'test-key');
  });

  it('should select correct chains for environment', () => {
    const testChains = getChainsForEnvironment('LOCAL');
    expect(testChains).toEqual([hardhat]);
  });
});
```

### Integration Testing

```typescript
// Test actual RPC connectivity
const testRpcConnection = async (chainId: number) => {
  const chain = chains.find(c => c.id === chainId);
  const client = createPublicClient({
    chain,
    transport: createTransports()[chainId]
  });
  
  const blockNumber = await client.getBlockNumber();
  expect(blockNumber).toBeGreaterThan(0);
};
```

## 🔄 Migration and Maintenance

### Upgrading Wagmi Versions

When upgrading `@privy-io/wagmi`:

1. Check Privy compatibility matrix
2. Update chain imports if needed
3. Test transport configurations
4. Validate smart account integration

### Chain Upgrades

When upgrading supported chains:

1. Update viem chain definitions
2. Test RPC provider compatibility
3. Verify contract deployments
4. Update environment mappings

### Monitoring and Alerting

```typescript
// RPC health checking
const checkRpcHealth = async () => {
  const results = await Promise.allSettled(
    chains.map(async (chain) => {
      const client = createPublicClient({
        chain,
        transport: createTransports()[chain.id]
      });
      return client.getBlockNumber();
    })
  );
  
  // Log any failures
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`RPC health check failed for chain ${chains[index].name}:`, result.reason);
    }
  });
};
```

## 💡 Best Practices

### 1. Environment Consistency

- Always validate environment variables on startup
- Provide clear error messages for misconfiguration
- Use type-safe environment validation

### 2. Chain Configuration

- Keep chain configurations environment-specific
- Never mix testnet and mainnet in production
- Validate RPC provider health before deployment

### 3. Error Handling

- Gracefully handle RPC failures
- Provide fallback mechanisms
- Log configuration issues for debugging

### 4. Performance Optimization

- Cache validated configurations
- Avoid recreating transports unnecessarily
- Monitor RPC response times

Remember: Configuration errors can cause application-wide failures. Always validate thoroughly and provide clear error messages for troubleshooting.