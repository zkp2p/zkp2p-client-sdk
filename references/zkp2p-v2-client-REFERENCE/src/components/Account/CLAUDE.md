# Account Components

*This file documents account management UI components within the ZKP2P V2 client.*

## Account Architecture

The account components handle user authentication, wallet connection, and account display:

- **AccountDropdown** - Main account menu with balance display, smart account status, and navigation
- **Avatar** - User avatar component with ENS integration
- **LoginTypeButton** - Authentication method selector for different login types
- **ReceiveModal** - Modal for displaying receive addresses and QR codes

## Implementation Patterns

### AccountDropdown Component
**Primary Features:**
- Real-time USDC and ETH balance display with auto-refresh
- Smart account status integration with EIP-7702 badges
- ENS name resolution and display
- Wallet export functionality for Privy embedded wallets
- Navigation to Send, Receive, and Swap features
- Logout and account management

**Key Integrations:**
- **AccountContext** - User authentication state and wallet info
- **BalancesContext** - Token balance management and refresh logic
- **SmartAccountContext** - EIP-7702 status and gas sponsorship display
- **ENS Provider** - Ethereum name service resolution
- React Router navigation with query parameter preservation

### Avatar Component  
**Features:**
- Ethereum avatar generation based on wallet address
- ENS avatar support when available
- Responsive sizing for different UI contexts
- Fallback patterns for non-connected states

### LoginTypeButton Component
**Authentication Methods:**
- Privy embedded wallet creation
- External wallet connections (MetaMask, Coinbase, etc.)
- Social authentication (Google, Twitter)
- Email-based authentication

### ReceiveModal Component
**Features:**
- QR code generation for wallet addresses
- Multiple address format support (Ethereum, Solana)
- Copy-to-clipboard functionality
- Cross-chain address display

## Integration Points

- **Account Context** - Core authentication and user state management
- **Balance Management** - Real-time token balance updates and display
- **Smart Account Features** - EIP-7702 authorization status and gas sponsorship
- **Modal System** - Consistent modal patterns for account actions
- **Navigation** - Deep linking and query parameter management
- **ENS Integration** - Ethereum name service for user-friendly addresses

---

*This file was created as part of the 3-tier documentation system to document account management UI components and authentication patterns.*