# Deposit Components

*This file documents individual deposit management components within the ZKP2P V2 client.*

## Deposit Architecture

The Deposit components handle individual deposit operations and detailed views:

- **DepositDetails** - Detailed view of a single deposit with management options
- **Buy/** - Buy modal functionality for purchasing from deposits
- **Orders/** - Order management for deposit-related transactions
- **UpdateDepositModal/** - Modal for updating deposit parameters

## Implementation Patterns

### DepositDetails Component
**Core Features:**
- Detailed deposit information display (amount, rates, platform, currency)
- Real-time APR calculations and profit projections
- Integration with order history and transaction tracking
- Deposit status management (active, paused, withdrawn)

**Management Actions:**
- Update conversion rates and deposit parameters
- Pause/resume deposit availability
- Withdraw liquidity from deposits
- View order history and performance metrics

### Buy Modal (Buy/)
**Purchasing Flow:**
- **BuyModal** - Main interface for users to purchase from liquidity providers
- Integration with swap quote system
- Real-time rate calculations and slippage protection
- Payment platform selection and instruction display

### Orders Management (Orders/)
**Order Components:**
- **OrderRow** - Desktop order display with full details
- **OrderRowMobile** - Mobile-optimized order row
- **OrdersTable** - Sortable table of all orders for a deposit
- Order status tracking and completion monitoring

### Update Modal (UpdateDepositModal/)
**Deposit Updates:**
- Conversion rate adjustments
- Currency and platform modifications
- Deposit amount changes
- Advanced settings and automation options

## Integration Points

- **DepositsContext** - Global deposit state management
- **Backend API** - Real-time deposit data and order tracking
- **Smart Contracts** - On-chain deposit updates and withdrawals
- **Quote System** - Real-time pricing and rate calculations
- **Payment Platforms** - Platform-specific configuration and validation

## Key Features

**Liquidity Provider Focus:**
- Optimized for deposit owners managing their liquidity
- Comprehensive order tracking and performance analytics
- Advanced deposit configuration options
- Real-time profit and loss calculations

**Responsive Design:**
- Separate mobile and desktop components for optimal UX
- Adaptive layouts for different screen sizes
- Touch-friendly interfaces for mobile deposit management

---

*This file was created as part of the 3-tier documentation system to document individual deposit management components and liquidity provider workflows.*