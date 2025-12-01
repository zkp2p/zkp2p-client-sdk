# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-12-01

### Initial Release

**Offramp SDK by Peer** - TypeScript SDK for deposit management, liquidity provision, and fiat off-ramping.

### Features

**Deposit Management**
- `createDeposit` - Create liquidity deposits with multiple payment methods
- `addFunds` / `removeFunds` - Manage deposit liquidity
- `withdrawDeposit` - Withdraw entire deposit

**Deposit Configuration**
- `setAcceptingIntents` - Toggle intent acceptance
- `setIntentRange` - Set min/max intent amounts
- `setCurrencyMinRate` - Set minimum conversion rates per currency

**Intent Operations**
- `signalIntent` - Signal intent to use a deposit
- `fulfillIntent` - Fulfill with attestation proof
- `releaseFundsToPayer` - Release funds back to payer
- `cancelIntent` - Cancel an intent
- `pruneExpiredIntents` - Clean up expired intents

**Queries (Indexer)**
- `getDeposits` / `getDepositsWithRelations` - Query deposits
- `getDepositById` / `getDepositsByPayeeHash` - Get specific deposits
- `getIntentsForDeposits` / `getOwnerIntents` - Query intents
- `getQuote` - Get exchange quotes

**React Hooks**
- Full suite of hooks for all deposit and intent operations

**Payment Platforms**
- Wise, Venmo, Revolut, CashApp, PayPal, Zelle, Monzo, MercadoPago

**Utilities**
- Currency resolution and conversion
- Payment method catalog helpers
- Contract address/ABI resolution
