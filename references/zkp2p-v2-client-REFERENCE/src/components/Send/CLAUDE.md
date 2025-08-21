# Send Components

*This file documents the token sending functionality within the ZKP2P V2 client.*

## Send Architecture

The Send feature allows users to send multiple tokens (not just USDC) to other addresses with advanced address resolution and cross-chain bridge support:

- **Send Interface** - Main token sending component with multi-token support
- **Cross-Chain Bridge** - Multi-provider bridge system with Relay (primary) and Bungee/Socket (fallback)
- **ENS Resolution** - Ethereum Name Service address resolution
- **Smart Account Support** - Gas-free transactions via EIP-7702 authorization
- **Dynamic Token Support** - Integration with TokenDataContext for multiple token types

## Implementation Patterns

### Send Component Features
**Multi-Token Support:**
- Dynamic token selection via InputWithTokenSelector
- Support for USDC, ETH, and additional tokens from Relay API
- Real-time balance checking and validation
- Token-specific decimal precision handling

**Address Resolution:**
- **ENS Support** - Resolves .eth domains to Ethereum addresses
- **Address Validation** - Validates Ethereum address format
- **Display Formatting** - Truncates long addresses for UI display
- **Solana Legacy** - Historical Solana support (marked for removal)

**Transaction Execution:**
- **Smart Account Integration** - Uses usePrivyTransaction for gas-free sends
- **Cross-Chain Bridge** - Automatic bridge routing via multi-provider system (Relay/Bungee)
- **ERC-20 Token Transfers** - Standard token transfer functionality
- **Balance Validation** - Prevents sending more than available balance
- **Transaction Status** - Real-time status updates during sending

### Key Integrations
```typescript
interface RecipientAddress {
  input: string;           // Raw user input
  ensName: string;         // Resolved ENS name
  rawAddress: string;      // Actual wallet address
  displayAddress: string;  // Formatted for display
  addressType: string;     // 'ethereum' | 'solana' (legacy)
}
```

**Context Dependencies:**
- **TokenDataContext** - Dynamic token metadata and pricing
- **BalancesContext** - Real-time token balance management
- **SmartAccountContext** - Gas sponsorship for send transactions
- **AccountContext** - User authentication and wallet connection

**Bridge Integration:**
- **useSendWithBridge** - Unified hook for same-chain and cross-chain transfers
- **useBridgeProvider** - Multi-provider abstraction with automatic failover
- **useRelayBridge** - Primary bridge provider (Relay SDK) supporting 80+ chains
- **useBungeeExchange** - Fallback bridge provider (Socket/Bungee API)
- **Bridge Monitoring** - Real-time transaction tracking across chains
- **Quote Management** - Dynamic bridge quote fetching from multiple providers

**Utility Integrations:**
- **ENS Provider** - Ethereum name resolution
- **Units Helpers** - Token amount formatting and conversion
- **Address Formatting** - Consistent address display patterns

## Integration Points

- **Token Selector** - Reuses modal selector components for token selection
- **Transaction Hooks** - Uses usePrivyTransaction for unified transaction execution
- **Bridge Integration** - Seamless cross-chain functionality via multi-provider system
- **Balance Management** - Real-time balance updates and validation
- **Smart Account** - Automatic gas sponsorship for eligible transactions
- **Navigation** - Integration with routing for send flow completion

## Cross-Chain Bridge Features

### Multi-Provider Bridge Architecture
- **Primary Provider**: Relay SDK supporting 80+ chains including non-EVM (Solana, Tron, Hyperliquid)
- **Fallback Provider**: Socket/Bungee API supporting 60+ EVM chains
- **Supported Networks**: 80+ total chains (EVM: Ethereum, Base, Optimism, Arbitrum, Polygon, zkSync, Scroll, etc.; Non-EVM: Solana, Tron, Hyperliquid, HyperEVM)
- **Automatic Failover**: Seamlessly switches providers if primary quote fails
- **Chain Validation**: Automatic validation with provider-specific chain support detection
- **Quote System**: Real-time bridge quotes from multiple providers with automatic best-route selection

### Bridge Transaction Flow
1. **Cross-Chain Detection**: Automatic detection when source and destination chains differ
2. **Quote Fetching**: Dynamic bridge quote retrieval with fee calculation  
3. **Transaction Execution**: Unified execution path for both EOA and smart account wallets
4. **Status Monitoring**: Real-time transaction tracking across source and destination chains
5. **Completion Detection**: Multiple validation methods for bridge completion

### Smart Account Bridge Support
- **Batch Transactions**: Combines token approval + bridge in single UserOperation
- **Gas Sponsorship**: Zero gas fees for embedded wallet users
- **ERC-4337 Compatibility**: Full UserOperation support with ZeroDev integration
- **Fallback Support**: Graceful fallback to EOA transactions when needed

### Bridge UI/UX Features
- **Transparent Experience**: Users can't distinguish between same-chain and cross-chain sends
- **Real-Time Quotes**: Bridge quotes update dynamically as users type
- **Fee Display**: Clear breakdown of bridge provider, estimated time, and total fees
- **Progress Tracking**: Live transaction status with hash display for both chains
- **Error Recovery**: User-friendly error messages with specific recovery suggestions

## Current Limitations

- **Token Coverage** - Limited to tokens available in TokenDataContext and supported by bridge providers
- **Same-Chain Swaps** - Uses Relay exclusively for same-chain token swaps (better DEX aggregation)
- **Provider-Specific Features** - Some chains only available through specific providers (e.g., Tron only via Relay)

---

*This file was created as part of the 3-tier documentation system to document the token sending functionality and address resolution patterns.*