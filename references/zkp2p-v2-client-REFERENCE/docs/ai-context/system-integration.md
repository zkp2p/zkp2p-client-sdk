# System Integration Documentation

This document details the integration patterns and architectural decisions for the ZKP2P V2 client, focusing on the recent migrations to EIP-7702 smart accounts, viem/wagmi, and Privy authentication.

## Overview

The ZKP2P V2 client has undergone significant architectural changes to improve user experience, security, and developer ergonomics. The integration of EIP-7702 smart accounts, migration to viem/wagmi, and Privy authentication creates a sophisticated yet user-friendly Web3 application.

## Smart Account Integration Architecture

### EIP-7702 Implementation Flow

```
User Wallet → Privy Auth → EIP-7702 Authorization → ZeroDev Kernel → Gas-Free Transactions
```

#### 1. Authorization Process
When a user connects their wallet (either Privy embedded or external):
- SmartAccountProvider automatically attempts EIP-7702 authorization
- User signs a one-time authorization to delegate EOA to Kernel V3.3
- Authorization includes 30-second timeout for unsupported wallets
- Failed authorizations gracefully fall back to EOA transactions

#### 2. Transaction Execution
The `usePrivyTransaction` hook provides a unified interface:
```typescript
// Smart Account Path
if (isSmartAccountEnabled && kernelClient) {
  // Bundle as UserOperation
  // Submit to ZeroDev bundler
  // Paymaster sponsors gas
} else {
  // Regular EOA transaction via wagmi
}
```

#### 3. Infrastructure Components
- **Bundler RPC**: `https://rpc.zerodev.app/api/v2/bundler/`
- **Paymaster RPC**: `https://rpc.zerodev.app/api/v2/paymaster/`
- **Entry Point**: Account Abstraction v0.7
- **Kernel Implementation**: V3.3

### Gas Sponsorship System

1. **Tracking**: Gas savings stored in localStorage
2. **UI Feedback**: SmartAccountBadge shows sponsorship status
3. **Statistics**: Running total of ETH saved and transaction count
4. **Opt-out**: Transactions can disable sponsorship if needed

## Blockchain Library Architecture

### Viem and Wagmi Integration

#### 1. Configuration Layer
```typescript
// @privy-io/wagmi provides authentication-aware wagmi
createConfig({
  chains: [base, baseSepolia, hardhat],
  transports: {
    [base.id]: http(alchemyRpcUrl),
    // ... other chains
  }
});
```

#### 2. Public Client Pattern
- Dedicated public clients for each network
- Efficient contract reading without wallet connection
- Type-safe contract interactions

#### 3. Transaction Abstraction
The `usePrivyTransaction` hook abstracts:
- Smart account UserOperations
- Regular EOA transactions
- Gas estimation and error handling
- Transaction status tracking

### Migration from Ethers.js

#### What Changed:
- **BigNumber → bigint**: Native JavaScript BigInt
- **Providers → Clients**: PublicClient/WalletClient pattern
- **Contract instances → Direct calls**: No abstraction layer
- **Utilities**: Viem's type-safe utilities

#### What Remained:
- ENS provider for react-ens-name compatibility
- Some address validation utilities

## Authentication Architecture

### Privy Integration Layers

#### 1. Provider Configuration
```typescript
<PrivyProvider
  appId={VITE_PRIVY_APP_ID}
  config={{
    embeddedWallets: { createOnLogin: 'users-without-wallets' },
    loginMethods: ['email', 'google', 'twitter', 'coinbase_wallet'],
    // ... appearance config
  }}
>
```

#### 2. Account Management
The AccountProvider wraps Privy hooks and provides:
- Unified login state management
- User profile data
- Wallet connection handling
- Authentication method prioritization

#### 3. Backend Authentication
```typescript
// API calls use Privy access tokens
const accessToken = await getAccessToken();
headers: { Authorization: `Bearer ${accessToken}` }
```

### Authentication Flow

1. **New User**: 
   - Signs up with email/social
   - Embedded wallet automatically created
   - EIP-7702 authorization attempted
   - Ready for gas-free transactions

2. **Existing Wallet User**:
   - Connects external wallet
   - EIP-7702 authorization attempted
   - Falls back to EOA if unsupported

## Cross-Component Communication

### Context Architecture

The application uses a layered context architecture:

```
AccountProvider (Privy auth)
  └── SmartAccountProvider (EIP-7702)
      └── SmartContractsProvider (Contract instances)
          └── Application Components
```

### Transaction Flow

1. **Component**: Calls transaction hook
2. **Hook**: Uses `usePrivyTransaction`
3. **Privy Transaction**: Routes to appropriate path
4. **Smart Account**: UserOperation via ZeroDev
5. **EOA**: Standard wagmi transaction

### Error Handling

Comprehensive error handling at each layer:
- Authorization failures → Fall back to EOA
- Transaction failures → User-friendly messages
- Network issues → Retry mechanisms
- Wallet issues → Clear guidance

## Performance Optimizations

### Smart Account Optimizations
- Authorization status cached per wallet
- Gas sponsorship stats persisted
- Batch transaction support
- Efficient UserOperation bundling

### Blockchain Interactions
- Public clients for read operations
- Selective balance fetching
- Efficient event filtering
- Optimized RPC calls

### UI/UX Optimizations
- Immediate visual feedback
- Progressive authorization
- Graceful degradation
- Clear status indicators

## Security Considerations

### Smart Account Security
- No private keys stored
- Authorization timeout protection
- Validation of all parameters
- Secure bundler communication

### Authentication Security
- Privy handles key management
- Access tokens for API calls
- Wallet address verification
- Input validation throughout

### Transaction Security
- Gas estimation with buffer
- Simulation before execution
- Clear approval flows
- Protection against zero address

## Testing Strategies

### Unit Testing
- Mock Privy providers
- Mock smart account states
- Test transaction routing
- Verify fallback behavior

### Integration Testing
- Full authorization flow
- Transaction execution paths
- Error scenarios
- Network switching

### E2E Testing
- Complete user journeys
- Multiple wallet types
- Authorization scenarios
- Transaction completion

## Monitoring and Debugging

### Key Metrics
- Authorization success rate
- Gas sponsorship usage
- Transaction success rate
- Wallet type distribution

### Debug Information
- SmartAccountContext state
- Transaction logs
- Authorization attempts
- Error tracking

## Future Considerations

### Planned Improvements
- Multi-chain smart accounts
- Advanced batching strategies
- Enhanced wallet support
- Improved error recovery

### Upgrade Paths
- Kernel version updates
- New EIP implementations
- Enhanced sponsorship policies
- Additional authentication methods

## Best Practices

### For Developers
1. Always use `usePrivyTransaction` for transactions
2. Handle authorization states in UI
3. Provide clear user feedback
4. Test with multiple wallet types

### For Users
1. One-time authorization enables gas-free transactions
2. Embedded wallets work seamlessly
3. External wallets may have limited support
4. Gas savings tracked automatically

This architecture provides a robust foundation for building user-friendly Web3 applications with advanced features while maintaining security and performance.