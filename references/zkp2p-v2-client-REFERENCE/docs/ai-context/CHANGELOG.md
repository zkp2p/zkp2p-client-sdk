# Changelog

## [Unreleased]

### Added
- **Enhanced Proof Error Handling**: Improved error capture and display when proof generation fails
  - Shows specific error messages from attestor server (e.g., "jsonPath not found")
  - Displays "Attestor server not responding" when no error details available
  - Added seller contact option in error support box when available
  - Captures full error context for support team debugging

- **EIP-7702 Smart Account Integration**: Gas-free transactions via ZeroDev
  - One-time authorization to delegate EOA to Kernel V3.3
  - Automatic gas sponsorship for all transactions
  - Graceful fallback to EOA for unsupported wallets
  - Gas savings tracking and display

- **Blockchain Library Migration**: Migrated from Ethers.js to Viem/Wagmi
  - Viem for type-safe, low-level blockchain interactions
  - @privy-io/wagmi for authentication-aware wallet management
  - Native bigint support throughout the codebase
  - Improved TypeScript type safety with Address and Hex types

- **Enhanced Authentication**: Privy.io integration with multiple auth methods
  - Email, Google, Twitter, and Coinbase Wallet authentication
  - Automatic embedded wallet creation for new users
  - Seamless EIP-7702 authorization on wallet connection
  - Backend API authentication via Privy access tokens

### Documentation
- **Comprehensive Documentation Update** (2025-07-20): Updated all foundational documentation to reflect current state
  - Updated technology stack with new dependencies (Solana, Material UI, Tailwind CSS, cross-chain bridges)
  - Documented all 12 React contexts including previously undocumented ones
  - Updated file tree structure in project-structure.md
  - Added documentation for Send feature and cross-chain capabilities
  - Corrected smart contract method names (submitProof → releaseFundsToPayer)
  - Restructured docs-overview.md for single-repository project
  - Created comprehensive handoff documentation for upcoming migration

- **Architecture Migration Documentation** (2025-07-21): Documented major architectural changes
  - Updated CLAUDE.md with EIP-7702 smart account implementation details
  - Added comprehensive Viem/Wagmi migration patterns and usage
  - Documented Privy authentication integration and configuration
  - Updated project-structure.md to reflect current technology stack
  - Created system-integration.md with detailed architectural patterns
  - Added sections on gas sponsorship, transaction abstraction, and wallet compatibility