# Deposits Components

*This file documents the deposits listing and creation components within the ZKP2P V2 client.*

## Deposits Architecture

The Deposits components handle the listing, filtering, and creation of liquidity deposits:

- **DepositTable** - Main table displaying all available deposits
- **DepositRow** - Desktop row component for individual deposits
- **DepositRowMobile** - Mobile-optimized deposit display
- **NewDeposit/** - Complete deposit creation flow

## Implementation Patterns

### Deposit Listing Components
**DepositTable Features:**
- Sortable columns (amount, rate, APR, platform, currency)
- Real-time deposit data with automatic refresh
- Filtering by currency, platform, and availability
- Responsive breakpoints for mobile/desktop layouts

**Row Components:**
- **DepositRow** - Full desktop layout with all deposit details
- **DepositRowMobile** - Condensed mobile view with essential information
- Consistent action buttons (Buy, View Details)
- Real-time status indicators (active, paused, low liquidity)

### New Deposit Creation (NewDeposit/)
**Deposit Creation Flow:**
- **PaymentPlatform** - Platform selection (Venmo, Revolut, Wise, etc.)
- **CurrencyRow** - Currency selection and configuration
- **AdvancedSettings** - Conversion rates, automation, and advanced options
- **Main Component** - Orchestrates the complete creation process

**Creation Features:**
- Multi-step deposit setup wizard
- Real-time rate validation and APR calculation
- Platform-specific configuration options
- Smart contract integration for deposit creation

## Key Features

### Deposit Discovery
**User Experience:**
- Comprehensive deposit marketplace view
- Advanced filtering and sorting capabilities
- Real-time availability and rate updates
- Mobile-first responsive design

**Data Management:**
- Integration with DepositsContext for state management
- Backend API for real-time deposit data
- Optimistic updates for better perceived performance
- Error handling and retry mechanisms

### Liquidity Provider Onboarding
**Deposit Creation:**
- Guided setup process for new liquidity providers
- Platform verification and configuration
- Rate optimization suggestions and APR calculations
- Integration with smart account for gas-free creation

## Integration Points

- **DepositsContext** - Central deposit state and data management
- **Backend API** - Real-time deposit data and market information
- **Smart Contracts** - On-chain deposit creation and management
- **Payment Platforms** - Platform-specific configuration and validation
- **Currency System** - Multi-currency support and exchange rates
- **Modal System** - Consistent modal patterns for deposit actions

## Responsive Design Patterns

**Desktop Layout:**
- Full-width table with comprehensive deposit information
- Sortable columns with detailed metrics
- Hover states and interactive elements

**Mobile Layout:**
- Card-based deposit display
- Condensed information hierarchy
- Touch-optimized interaction patterns

---

*This file was created as part of the 3-tier documentation system to document deposits listing, filtering, and creation functionality.*