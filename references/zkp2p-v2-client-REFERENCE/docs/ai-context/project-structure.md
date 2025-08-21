# ZKP2P V2 Client Project Structure

This document provides the complete technology stack and file tree structure for the ZKP2P V2 Client project. **AI agents MUST read this file to understand the project organization before making any changes.**

## Technology Stack

### Frontend Technologies
- **TypeScript 5.3.3** with **Yarn 3.2.3** - Type-safe development and dependency management
- **React 18.2.0** - UI library with hooks and concurrent features
- **Vite 7.0.3** - Lightning-fast build tool and development server
- **styled-components 5.3.5** - CSS-in-JS for component styling
- **Tailwind CSS 3.0.2** - Utility-first CSS framework
- **React Router 6.2.2** - Client-side routing

### Blockchain & Web3
- **Viem 2.21.61** - Type-safe Ethereum interaction library (primary blockchain library)
- **@privy-io/wagmi 1.0.1** - Privy-wrapped wagmi for wallet management
- **@zerodev/sdk 5.4.41** - Smart account SDK with EIP-7702 support
- **@reservoir0x/relay-sdk 1.4.10** - Cross-chain bridging (primary provider, supports 80+ chains)
- **@socket.tech/plugin 2.4.7** - Alternative bridge provider (Bungee/Socket integration)
- **@solana/web3.js 1.90.0** - Solana blockchain integration
- **bignumber.js 9.1.2** - Precise decimal arithmetic
- **Ethers.js 6.0.0** - Legacy utilities (limited usage for ENS compatibility)

### Supported Blockchain Networks
The platform now supports **80+ blockchain networks** including:
- **EVM Networks**: Ethereum, Base, Optimism, Arbitrum, Polygon, Avalanche, BSC, zkSync Era, Scroll, Linea, Blast, Mode, Zora, Mantle
- **Non-EVM Networks**: Solana, Tron, Hyperliquid, HyperEVM
- **Testnet Networks**: Berachain (bArtio), Base Sepolia
- **Specialized Networks**: World Chain, Unichain, Ape Chain, B3, Gnosis, Celo, Aurora, Polygon zkEVM
- **Multi-Provider Bridge Support**: Relay (primary) and Bungee/Socket (fallback) with automatic failover

### Authentication & Identity
- **Privy.io 2.19.0** - Web3 authentication with EIP-7702 support
- **react-ens-name 0.2.5** - ENS name resolution
- **@bonfida/spl-name-service 2.3.7** - Solana name service

### Zero-Knowledge Proofs
- **snarkjs (custom fork)** - ZK-SNARK proof generation and verification
- **@zkp2p/circuits-circom-helpers 0.2.3-rc3** - Circuit utilities
- **circomlibjs 0.1.2** - Circom library implementations

### UI Components & Styling
- **@mui/joy 5.0.0-beta.15** - Joy UI component library
- **@mui/material 5.14.3** - Material-UI components
- **Tailwind CSS 3.0.2** - Utility-first CSS framework
- **react-toastify 11.0.5** - Toast notifications
- **react-circular-progressbar 2.1.0** - Progress indicators
- **flag-icons 7.3.2** - Country flag icons

### Development & Quality Tools
- **ESLint 8.3.0** - Code linting with React and TypeScript plugins
- **Prettier 2.7.1** - Code formatting
- **Vitest 3.2.4** - Vite-native testing framework
- **@testing-library/react 16.3.0** - React component testing
- **@vitest/ui 3.2.4** - Interactive test UI
- **TypeScript** - Static type checking (via `tsc --noEmit`)

### Build & Deployment
- **Vite PWA Plugin 0.19.0** - Progressive Web App support
- **rollup-plugin-visualizer 5.12.0** - Bundle analysis
- **Vercel** - Deployment platform (via vercel CLI)
- **Node.js 18.x** - Runtime requirement

### Monitoring & Analytics
- **@rollbar/react 0.12.0-beta** - Error tracking and monitoring
- **web-vitals 2.1.4** - Core Web Vitals tracking

## Key Architectural Changes

### Smart Account Integration (EIP-7702)
- **Gas-Free Transactions**: All user transactions sponsored via ZeroDev paymaster
- **One-Time Authorization**: Users sign EIP-7702 authorization to delegate EOA to Kernel V3.3
- **Automatic Fallback**: Graceful degradation to regular EOA transactions for unsupported wallets
- **Unified Transaction Interface**: `usePrivyTransaction` hook abstracts complexity

### Blockchain Library Migration
- **Primary**: Viem for all low-level blockchain interactions
- **Wallet Management**: @privy-io/wagmi (Privy-wrapped wagmi)
- **Legacy**: Minimal Ethers.js v6 usage only for ENS compatibility
- **Type Safety**: Strong typing with `Address` and `Hex` types

### Authentication Architecture
- **Privy.io Integration**: Email, social login, and wallet authentication
- **Embedded Wallets**: Automatically created for users without wallets
- **Smart Account Support**: Automatic EIP-7702 authorization on wallet connection
- **Backend Authentication**: Privy access tokens for API calls

## Complete Project Structure

```
zkp2p-v2-client/
├── README.md                           # Project overview and setup instructions
├── CLAUDE.md                           # Master AI context and development guide
├── MCP-ASSISTANT-RULES.md              # MCP assistant configuration rules
├── LICENSE                             # MIT License
├── package.json                        # Project dependencies and scripts
├── yarn.lock                          # Yarn lockfile for dependency versions
├── .gitignore                         # Git ignore patterns
├── index.html                         # HTML entry point (Vite requirement)
├── vite.config.ts                     # Vite configuration
├── vitest.config.ts                   # Vitest test configuration
├── tsconfig.json                      # TypeScript configuration
├── tsconfig.node.json                 # TypeScript config for Node.js files
├── tsconfig.tsbuildinfo               # TypeScript build information
├── vercel.json                        # Vercel deployment configuration
├── deploy.sh                          # Deployment script
├── public/                            # Static assets
│   ├── _redirects                     # Netlify-style redirects
│   ├── app192.png                     # PWA icon
│   ├── banner.png                     # Social media banner
│   ├── favicon.ico                    # Site favicon
│   ├── logo192.png                    # Logo variants
│   ├── manifest.json                  # PWA manifest
│   ├── robots.txt                     # Search engine directives
│   ├── twitter_card.png              # Twitter card image
│   └── static/                        # Additional static assets
├── src/                               # Source code
│   ├── index.tsx                      # Application entry point
│   ├── index.css                      # Global styles
│   ├── styles.css                     # Additional styles
│   ├── App.tsx                        # Main application component
│   ├── App.css                        # App-specific styles
│   ├── ErrorBoundary.tsx              # Error boundary component
│   ├── react-app-env.d.ts             # React type definitions
│   ├── vite-env.d.ts                  # Vite type definitions
│   ├── logo.svg                       # Application logo
│   ├── components/                    # React components (organized by feature)
│   │   ├── CLAUDE.md                  # Component development guide
│   │   ├── Account/                   # Account management components
│   │   │   ├── AccountDropdown.tsx    # Account selector UI
│   │   │   ├── Avatar.tsx             # User avatar display
│   │   │   ├── LoginTypeButton.tsx    # Login method selector
│   │   │   └── ReceiveModal.tsx       # Receive funds modal
│   │   ├── Deposit/                   # Deposit management
│   │   │   ├── DepositDetails.tsx     # Deposit detail view
│   │   │   ├── Buy/                    # Buy modal functionality
│   │   │   ├── Orders/                 # Order management components
│   │   │   ├── UpdateDepositModal/     # Update deposit functionality
│   │   │   └── index.tsx              # Deposit main component
│   │   ├── Deposits/                  # Deposits listing
│   │   │   ├── DepositRow.tsx        # Desktop deposit row
│   │   │   ├── DepositRowMobile.tsx  # Mobile deposit row
│   │   │   ├── DepositTable.tsx      # Deposits table
│   │   │   ├── NewDeposit/            # New deposit creation components
│   │   │   └── index.tsx              # Deposits container
│   │   ├── Landing/                   # Landing page components
│   │   │   ├── ConnectCard.tsx       # Wallet connection card
│   │   │   ├── SwapPreview.tsx       # Swap preview component
│   │   │   └── ValueCard.tsx         # Value proposition card
│   │   ├── Liquidity/                 # Liquidity provider features
│   │   │   ├── CLAUDE.md              # Liquidity component guide
│   │   │   ├── LiquidityRow.tsx      # Desktop liquidity row
│   │   │   ├── LiquidityRowMobile.tsx # Mobile liquidity row
│   │   │   ├── LiquidityTable.tsx    # Liquidity table
│   │   │   └── index.tsx              # Liquidity container
│   │   ├── Send/                      # Send functionality
│   │   │   └── index.tsx              # Send component
│   │   ├── SmartAccount/              # Smart account UI components
│   │   │   ├── SmartAccountBadge.tsx  # Authorization status badge
│   │   │   └── GasSponsorshipDisplay.tsx # Gas savings display
│   │   ├── Swap/                      # Swap interface
│   │   │   ├── CLAUDE.md              # Swap component guide
│   │   │   ├── InstructionDrawer.tsx  # Step-by-step instructions
│   │   │   ├── OnRamperIntentInfo.tsx # Intent information
│   │   │   ├── PaymentRequirementDrawer.tsx # Payment requirements
│   │   │   ├── QuoteDetails.tsx       # Quote breakdown
│   │   │   ├── QuoteSelectionDisplay.tsx # Quote selection UI
│   │   │   ├── ReferrerInfo.tsx       # Referrer display
│   │   │   ├── SettingsDropdown.tsx   # Swap settings
│   │   │   ├── SwapInstructionTitle.tsx # Instruction header
│   │   │   ├── CompleteOrder/         # Order completion flow components
│   │   │   ├── SendPayment/           # Payment sending flow components
│   │   │   ├── __tests__/             # Swap component tests
│   │   │   ├── components/            # Swap sub-components
│   │   │   ├── hooks/                 # Swap-specific hooks
│   │   │   └── index.tsx              # Main swap component
│   │   ├── SVGIcon/                   # SVG icon components
│   │   │   ├── SVGIcon.tsx           # Basic SVG icon
│   │   │   ├── SVGIconThemed.tsx     # Theme-aware SVG icon
│   │   │   ├── SVGIcon.css           # Icon styles
│   │   │   └── SVGIconThemed.css     # Themed icon styles
│   │   ├── common/                    # Shared UI components
│   │   │   ├── AccessoryButton.tsx    # Secondary action button
│   │   │   ├── Breadcrumb.tsx        # Navigation breadcrumb
│   │   │   ├── Button.tsx             # Primary button component
│   │   │   ├── Card.tsx               # Card container
│   │   │   ├── Checkbox.tsx           # Checkbox input
│   │   │   ├── ConnectButton.tsx      # Wallet connect button
│   │   │   ├── CopyButton.tsx         # Copy to clipboard button
│   │   │   ├── DragAndDropTextBox.tsx # File upload area
│   │   │   ├── FlatTooltip.tsx        # Flat tooltip style
│   │   │   ├── HorizontalInput.tsx    # Horizontal input layout
│   │   │   ├── Input.tsx              # Base input component
│   │   │   ├── InputWithSelector.tsx  # Input with dropdown
│   │   │   ├── InstructionStep.tsx    # Step instruction UI
│   │   │   ├── LabeledSwitch.tsx      # Toggle switch with label
│   │   │   ├── LabeledTextArea.tsx    # Textarea with label
│   │   │   ├── Layout.tsx             # Page layout wrapper
│   │   │   ├── NumberedStep.tsx       # Numbered step indicator
│   │   │   ├── PersistentIFrames.tsx  # Iframe management
│   │   │   ├── Popover.tsx            # Popover component
│   │   │   ├── QuestionHelper.tsx     # Help icon with tooltip
│   │   │   ├── ReadOnlyInput.tsx      # Non-editable input
│   │   │   ├── Selector.tsx           # Dropdown selector
│   │   │   ├── SimpleInput.tsx        # Minimal input component
│   │   │   ├── SingleLineInput.tsx    # Single-line text input
│   │   │   ├── Skeleton.tsx           # Loading skeleton
│   │   │   ├── SortableColumnHeader.tsx # Sortable table header
│   │   │   ├── Spinner.tsx            # Loading spinner
│   │   │   ├── TallySupportButton.tsx # Support widget
│   │   │   ├── TextButton.tsx         # Text-only button
│   │   │   ├── Tooltip.tsx            # Tooltip component
│   │   │   ├── TransactionButton.tsx  # Transaction action button
│   │   │   ├── TransactionIconButton.tsx # Icon transaction button
│   │   │   ├── UsdcBalanceDisplay.tsx # USDC balance display
│   │   │   └── WarningTextBox.tsx     # Warning message box
│   │   ├── layouts/                   # Layout components
│   │   │   ├── EnvironmentBanner.tsx  # Environment indicator
│   │   │   ├── Column/                 # Column layout components
│   │   │   ├── Row/                    # Row layout components
│   │   │   └── MenuDropdown/           # Dropdown menu components
│   │   ├── legacy/                    # Legacy components (deprecated)
│   │   │   ├── LabeledTextArea.tsx    
│   │   │   ├── Layout.tsx             
│   │   │   └── StyledLink.tsx         
│   │   └── modals/                    # Modal dialogs
│   │       ├── ConfirmCancelIntent.tsx # Cancel confirmation
│   │       ├── ConfirmRelease.tsx     # Release confirmation
│   │       ├── ContactSellerModal.tsx # Contact seller UI
│   │       ├── ContactSupportModal.tsx # Support contact
│   │       ├── IntegrationModal.tsx   # Integration info
│   │       ├── Overlay.tsx            # Modal overlay
│   │       ├── RedirectCloseModal.tsx # Redirect notice
│   │       ├── UnverifiedTokenModal.tsx # Token warning
│   │       └── selectors/             # Modal selector components
│   ├── contexts/                      # React Context providers
│   │   ├── CLAUDE.md                  # Context patterns guide
│   │   ├── Account/                   # User account context
│   │   │   ├── AccountContext.ts      # Context definition
│   │   │   ├── AccountProvider.tsx    # Provider implementation
│   │   │   └── index.ts              # Module exports
│   │   ├── Backend/                   # API backend context
│   │   │   ├── BackendContext.ts      
│   │   │   ├── BackendContextProvider.tsx
│   │   │   └── index.tsx             
│   │   ├── Balances/                  # Token balances context
│   │   │   ├── BalancesContext.ts     
│   │   │   ├── BalancesProvider.tsx   
│   │   │   └── index.ts              
│   │   ├── Deposits/                  # Deposits management
│   │   │   ├── DepositsContext.ts     
│   │   │   ├── DepositsProvider.tsx   
│   │   │   └── index.ts              
│   │   ├── Escrow/                    # Escrow state management
│   │   │   ├── EscrowContext.ts       
│   │   │   ├── EscrowProvider.tsx     
│   │   │   └── index.ts              
│   │   ├── ExtensionProxyProofs/      # ZK proof extension
│   │   │   ├── ExtensionProxyProofsContext.ts
│   │   │   ├── ExtensionProxyProofsProvider.tsx
│   │   │   └── index.ts              
│   │   ├── Geolocation/               # User location context
│   │   │   ├── GeolocationContext.ts  
│   │   │   ├── GeolocationProvider.tsx
│   │   │   └── index.tsx             
│   │   ├── Liquidity/                 # Liquidity provider context
│   │   │   ├── LiquidityContext.ts    
│   │   │   ├── LiquidityProvider.tsx  
│   │   │   ├── helper.ts              # Helper functions
│   │   │   └── index.ts              
│   │   ├── ModalSettings/             # Modal state management
│   │   │   ├── ModalSettingsContext.ts
│   │   │   ├── ModalSettingsProvider.tsx
│   │   │   └── index.ts              
│   │   ├── OnRamperIntents/           # Intent management
│   │   │   ├── OnRamperIntentsContext.ts
│   │   │   ├── OnRamperIntentsProvider.tsx
│   │   │   └── index.tsx             
│   │   ├── SmartAccount/              # Smart account & EIP-7702
│   │   │   ├── SmartAccountContext.ts # Context definition
│   │   │   ├── SmartAccountProvider.tsx # Provider implementation
│   │   │   └── index.ts              # Module exports
│   │   ├── SmartContracts/            # Contract instances
│   │   │   ├── CLAUDE.md              # Contract integration guide
│   │   │   ├── SmartContractsContext.ts
│   │   │   ├── SmartContractsProvider.tsx
│   │   │   └── index.ts              
│   │   └── TokenData/                 # Token metadata context
│   │       ├── TokenDataContext.ts    
│   │       ├── TokenDataProvider.tsx  
│   │       └── index.ts              
│   ├── helpers/                       # Utilities and shared code
│   │   ├── CLAUDE.md                  # Helpers documentation guide
│   │   ├── __tests__/                 # Business logic unit tests
│   │   │   ├── aprHelper.test.ts      # APR calculation tests
│   │   │   ├── bigIntSerialization.test.ts # BigInt serialization tests
│   │   │   ├── intentHelper.test.ts   # Intent processing tests
│   │   │   ├── parseEscrowState.test.ts # State parsing tests
│   │   │   └── units.test.ts          # Unit conversion tests
│   │   ├── abi/                       # Contract ABIs
│   │   │   ├── cashappReclaimVerifier.abi.ts
│   │   │   ├── escrow.abi.ts          # Main escrow contract
│   │   │   ├── fusdc.abi.ts           # Fake USDC for testing
│   │   │   ├── mercadoPagoReclaimVerifier.abi.ts
│   │   │   ├── monzoReclaimVerifier.abi.ts
│   │   │   ├── paymentVerifierMock.abi.ts
│   │   │   ├── paypalReclaimVerifier.abi.ts
│   │   │   ├── quoter.abi.ts          # Quote contract
│   │   │   ├── revolutReclaimVerifier.abi.ts
│   │   │   ├── venmoReclaimVerifier.abi.ts
│   │   │   ├── wiseReclaimVerifier.abi.ts
│   │   │   └── zelleBaseVerifier.abi.ts
│   │   ├── addressFormat.ts           # Address formatting utils
│   │   ├── aprHelper.ts               # APR calculations
│   │   ├── baseClient.ts              # Base chain client configuration
│   │   ├── bigIntSerialization.ts     # BigInt JSON serialization
│   │   ├── blockExplorers.ts          # Block explorer URLs
│   │   ├── cards.ts                   # Card UI helpers
│   │   ├── config.ts                  # Client configurations
│   │   ├── constants.ts               # Application constants
│   │   ├── dateFormat.ts              # Date formatting utils
│   │   ├── deployed_addresses.ts      # Contract addresses
│   │   ├── docUrls.ts                 # Documentation links
│   │   ├── ens.ts                     # ENS resolution helpers
│   │   ├── ensProvider.ts             # ENS provider configuration
│   │   ├── eventParser.ts             # Contract event parsing
│   │   ├── funnyMessages.ts           # User-facing messages
│   │   ├── mainnetClient.ts           # Mainnet client configuration
│   │   ├── intentHelper.ts            # Intent utilities
│   │   ├── keccack.ts                 # Keccak hashing
│   │   ├── legacy/                    # Legacy utilities
│   │   │   ├── notary.ts              
│   │   │   ├── poseidonHash.ts        
│   │   │   └── verifiers/             # Legacy verifier implementations
│   │   ├── noop.ts                    # No-op function
│   │   ├── parseEscrowState.ts        # Escrow state parser
│   │   ├── parseProof.ts              # ZK proof parser
│   │   ├── providers.ts               # Payment providers
│   │   ├── recipientAddress.tsx       # Recipient address utils
│   │   ├── sidebar.ts                 # Sidebar configuration
│   │   ├── strings/                   # String utilities
│   │   │   ├── common.ts              # Common strings
│   │   │   ├── index.ts               # String exports
│   │   │   ├── platform.ts            # Platform strings
│   │   │   └── venmo.ts               # Venmo-specific
│   │   ├── types/                     # TypeScript type definitions
│   │   │   ├── browserExtension.ts    # Extension types
│   │   │   ├── curator.ts             # Backend API types
│   │   │   ├── currency.ts            # Currency types
│   │   │   ├── escrow.ts              # Escrow types
│   │   │   ├── index.ts               # Type exports
│   │   │   ├── loginStatus.ts         # Auth types
│   │   │   ├── modals.ts              # Modal types
│   │   │   ├── paymentPlatform.ts     # Platform types
│   │   │   ├── proxyProof.ts          # Proof types
│   │   │   ├── sendStatus.ts          # Send state types
│   │   │   ├── smartContracts.ts      # Contract types
│   │   │   ├── swapQuote.ts           # Quote types
│   │   │   ├── tokens.ts              # Token types
│   │   │   ├── paymentPlatforms/      # Platform-specific type definitions
│   │   │   │   ├── cashapp.ts         # CashApp configuration
│   │   │   │   ├── index.ts           # Platform exports
│   │   │   │   ├── mercadoPago.ts     # MercadoPago configuration
│   │   │   │   ├── monzo.ts           # Monzo configuration
│   │   │   │   ├── paypal.ts          # PayPal configuration
│   │   │   │   ├── revolut.ts         # Revolut configuration
│   │   │   │   ├── types.ts           # Platform type definitions
│   │   │   │   ├── venmo.ts           # Venmo configuration
│   │   │   │   ├── wise.ts            # Wise configuration
│   │   │   │   └── zelle.ts           # Zelle configuration
│   │   │   └── status/                # Status-related type definitions
│   │   ├── units.ts                   # Unit conversions
│   │   └── unitsOld.ts               # Legacy unit utils
│   ├── hooks/                         # Custom React hooks
│   │   ├── CLAUDE.md                  # Hooks development guide
│   │   ├── __tests__/                 # Hook unit tests
│   │   │   ├── useCurrencyPrices.test.ts
│   │   │   ├── useQuoteStorage.test.ts
│   │   │   └── useRelayBridge.test.ts
│   │   ├── backend/                   # Backend API hooks
│   │   │   ├── __tests__/             # Backend hook tests
│   │   │   ├── useGetDeposit.ts       # Fetch single deposit
│   │   │   ├── useGetDepositOrders.ts # Fetch deposit orders
│   │   │   ├── useGetIntentStats.ts   # Intent statistics
│   │   │   ├── useGetOwnerDeposits.ts # User's deposits
│   │   │   ├── useGetOwnerIntents.ts  # User's intents
│   │   │   ├── useGetPayeeDetails.ts  # Payee information
│   │   │   ├── usePostDepositDetails.ts # Submit deposit
│   │   │   ├── useQuoteMaxTokenForFiat.ts # Quote calculations
│   │   │   ├── useQuoteMinFiatForToken.ts # Reverse quotes
│   │   │   ├── useSignIntent.ts       # Intent signing
│   │   │   └── useValidatePayeeDetails.ts # Validate payee
│   │   ├── contexts/                  # Context consumer hooks
│   │   │   ├── useAccount.ts          
│   │   │   ├── useBackend.ts          
│   │   │   ├── useBalance.ts          
│   │   │   ├── useDeposits.ts         
│   │   │   ├── useEscrowState.ts      
│   │   │   ├── useExtensionProxyProofs.ts
│   │   │   ├── useGeolocation.ts      
│   │   │   ├── useLiquidity.ts        
│   │   │   ├── useModal.ts            
│   │   │   ├── useOnRamperIntents.ts  
│   │   │   ├── useSmartAccount.ts     # Smart account context
│   │   │   ├── useSmartContracts.ts   
│   │   │   └── useTokenData.ts        
│   │   ├── transactions/              # Blockchain transaction hooks
│   │   │   ├── __tests__/             # Transaction hook tests
│   │   │   ├── useCancelIntent.ts     # Cancel swap intent
│   │   │   ├── useCreateDeposit.ts    # Create deposit
│   │   │   ├── useFulfillIntent.ts    # Fulfill intent
│   │   │   ├── useReleaseFundsToPayer.ts # Release funds
│   │   │   ├── useSignalIntent.ts     # Signal intent
│   │   │   ├── useTokenApprove.ts     # Token approval
│   │   │   ├── useUpdateDepositConversionRate.ts # Update rates
│   │   │   └── useWithdrawDeposit.ts  # Withdraw deposit
│   │   ├── useCanInstallExtensions.ts # Extension detection
│   │   ├── useCurrencyPrices.ts      # Currency rates
│   │   ├── useDevice.ts               # Device detection
│   │   ├── useDragAndDrop.ts         # Drag-drop handling
│   │   ├── useDuneVolume.ts           # Dune analytics
│   │   ├── useFileBrowser.ts          # File selection
│   │   ├── useGithubClient.ts         # GitHub API
│   │   ├── useInterval.ts             # Interval hook
│   │   ├── useIsTouchDevice.ts        # Touch detection
│   │   ├── useLocalStorage.ts         # Local storage
│   │   ├── useMediaQuery.ts           # Media queries
│   │   ├── useOnClickOutside.ts       # Click outside
│   │   ├── usePrivyTransaction.ts     # Unified transaction execution
│   │   ├── useQuery.ts                # URL query params
│   │   ├── useQuoteStorage.ts         # Quote persistence
│   │   ├── useRelayBridge.ts          # Cross-chain bridge
│   │   ├── useSessionStorage.ts       # Session storage
│   │   ├── useSocketBridge.ts         # WebSocket bridge
│   │   └── useTableScroll.ts          # Table scrolling
│   ├── pages/                         # Route-level components
│   │   ├── Deposit.tsx                # Deposit page
│   │   ├── DepositDetail.tsx          # Deposit details page
│   │   ├── Landing.tsx                # Landing page
│   │   ├── Liquidity.tsx              # Liquidity page
│   │   ├── Modals.tsx                 # Modal manager
│   │   ├── Privacy.tsx                # Privacy policy
│   │   ├── Send.tsx                   # Send page
│   │   ├── Swap.tsx                   # Swap page
│   │   └── Tos.tsx                    # Terms of service
│   ├── test/                          # Test infrastructure
│   │   ├── README.md                  # Testing guide
│   │   ├── setup.ts                   # Test setup
│   │   ├── setup-env.ts               # Environment setup
│   │   ├── mocks/                     # Test mocks
│   │   │   ├── contexts.tsx           # Context mocks
│   │   │   ├── contracts.ts           # Contract mocks
│   │   │   ├── contracts-failure.ts   # Failure scenarios
│   │   │   ├── privy.tsx              # Privy auth mocks
│   │   │   └── reclaim.ts             # Reclaim SDK mocks
│   │   └── utils/                     # Test utilities
│   │       ├── test-utils.tsx         # Testing helpers
│   │       └── time.ts                # Time utilities
│   ├── theme/                         # Design system
│   │   ├── index.ts                   # Theme definition
│   │   ├── colors.tsx                 # Color palette
│   │   ├── media.tsx                  # Media queries
│   │   ├── text.tsx                   # Typography
│   │   └── zIndex.ts                  # Z-index system
│   ├── assets/                        # Static assets
│   │   ├── fonts/                     # Custom fonts
│   │   │   ├── Graphik-Medium.otf     
│   │   │   ├── Graphik-Regular.otf    
│   │   │   └── Graphik-Semibold.otf   
│   │   ├── images/                    # Image assets
│   │   │   ├── arbitrum.svg           # Chain logos
│   │   │   ├── avalanche.svg          
│   │   │   ├── base.svg
│   │   │   ├── berachain.svg               
│   │   │   ├── eth.svg                
│   │   │   ├── flow.svg               
│   │   │   ├── hyperEvm.svg           
│   │   │   ├── logo192.png            
│   │   │   ├── reclaim.svg            
│   │   │   ├── scroll.svg             
│   │   │   ├── sepolia.svg            
│   │   │   └── solana-sol-logo.svg    
│   │   └── svg/                       # SVG icons
│   │       ├── dark-arrow-down.svg    
│   │       ├── dark-cash.svg          
│   │       ├── dark-github.svg        
│   │       ├── dark-lightning.svg     
│   │       ├── dark-padlock.svg       
│   │       ├── dark-telegram.svg      
│   │       ├── dark-twitter.svg       
│   │       ├── dark-usdc.svg          
│   │       └── ethereum-token-logo.svg
│   │   ├── images/                    # Extended image assets
│   │   │   ├── browsers/              # Browser icon assets
│   │   │   ├── platforms/             # Payment platform logos
│   │   │   ├── tokens/                # Token icon assets
│   │   │   └── zelle/                 # Zelle bank logos
│   ├── icons/                         # Icon assets (duplicate)
│   └── svg/                           # SVG assets (duplicate)
├── docs/                              # Documentation
│   ├── README.md                      # Documentation guide
│   ├── CONTEXT-tier2-component.md     # Component-level documentation
│   ├── CONTEXT-tier3-feature.md       # Feature-specific documentation
│   ├── ai-context/                    # AI-specific documentation
│   │   ├── project-structure.md       # This file
│   │   ├── docs-overview.md           # Documentation navigation
│   │   ├── deployment-infrastructure.md # Deployment guide
│   │   ├── handoff.md                 # Session handoff documentation
│   │   ├── system-integration.md      # Integration documentation
│   │   └── CHANGELOG.md               # Version history
│   ├── open-issues/                   # Active issue documentation
│   │   └── example-api-performance-issue.md
│   └── specs/                         # Technical specifications
├── scripts/                           # Build and deployment scripts
├── logs/                              # Application logs (gitignored)
└── build/                             # Production build output (gitignored)
```

## Key Development Patterns

### React Context Architecture
The application uses React Context API extensively for state management:
- Each context has its own directory with Context definition, Provider, and index exports
- Contexts are composed in the main App component
- Custom hooks provide clean access to context values

### Component Organization
- Feature-based organization (Swap/, Liquidity/, Deposit/)
- Common components shared across features
- Modals managed separately for reusability
- Legacy components maintained for backward compatibility

### Testing Strategy
- Unit tests for business logic in `helpers/__tests__/`
- Hook tests in `hooks/__tests__/`
- Component tests using React Testing Library
- Comprehensive mocks for external dependencies

### Build Configuration
- Vite for development and production builds
- TypeScript for type safety
- ESLint and Prettier for code quality
- Vitest for testing with UI and coverage options

### Smart Contract Integration
- ABIs stored in `helpers/abi/`
- Contract addresses in `deployed_addresses.ts`
- SmartContractsContext manages all contract instances
- Transaction hooks handle blockchain interactions

---

*This document represents the current state of the ZKP2P V2 Client project structure. It should be updated when significant architectural changes occur.*