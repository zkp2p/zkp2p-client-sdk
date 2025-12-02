# Changelog

All notable changes to `@zkp2p/offramp-sdk` will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **RPC-First Architecture**: All primary query methods now use on-chain reads via ProtocolViewer for instant, real-time data
  - `getDeposits()` - Get connected wallet's deposits (on-chain)
  - `getAccountDeposits(owner)` - Get deposits for any address (on-chain)
  - `getDeposit(depositId)` - Get single deposit by ID (on-chain)
  - `getDepositsById(ids)` - Batch fetch deposits (on-chain)
  - `getIntents()` - Get connected wallet's intents (on-chain)
  - `getAccountIntents(owner)` - Get intents for any address (on-chain)
  - `getIntent(intentHash)` - Get single intent by hash (on-chain)
  - `resolvePayeeHash(depositId, paymentMethodHash)` - Resolve from on-chain

- **Indexer Namespaced**: All indexer-based queries moved to `client.indexer.*` for advanced/historical queries
  - `client.indexer.getDeposits(filter?, pagination?)` - Query with filters
  - `client.indexer.getDepositsWithRelations(...)` - Include payment methods/intents
  - `client.indexer.getDepositById(compositeId, ...)` - Get by composite ID
  - `client.indexer.getDepositsByPayeeHash(...)` - Find by payee
  - `client.indexer.getOwnerIntents(...)` - Get owner's intents
  - `client.indexer.getExpiredIntents(...)` - Find expired intents
  - `client.indexer.getFulfilledIntentEvents(...)` - Historical fulfillments
  - `client.indexer.getFulfillmentAndPayment(...)` - Verification records

### Added

- New type exports for RPC responses: `DepositView`, `Deposit`, `PaymentMethodData`, `DepositCurrency`, `IntentView`, `OnchainIntent`
- Parser exports: `parseDepositView`, `parseIntentView`

## [0.1.0] - 2025-12-01

### Initial Release

**Offramp SDK by Peer** - A streamlined TypeScript SDK focused on deposit management, liquidity provision, and fiat off-ramping.

#### Core Features

- **Deposit Management**
  - `createDeposit()` - Create liquidity deposits with multiple payment methods
  - `withdrawDeposit()` - Withdraw entire deposit
  - `addFunds()` / `removeFunds()` - Manage deposit liquidity
  - `setAcceptingIntents()` - Toggle intent acceptance
  - `setIntentRange()` - Set min/max intent amounts
  - `setCurrencyMinRate()` - Set minimum conversion rates

- **Intent Operations**
  - `signalIntent()` - Signal intent to use a deposit
  - `fulfillIntent()` - Fulfill with attestation proof
  - `releaseFundsToPayer()` - Release funds back to payer
  - `cancelIntent()` - Cancel an intent
  - `pruneExpiredIntents()` - Clean up expired intents

- **Payment Method Management**
  - `addPaymentMethods()` - Add payment methods to deposit
  - `removePaymentMethod()` - Remove payment method
  - `setPaymentMethodActive()` - Toggle method active status
  - `addCurrencies()` - Add currencies to payment method
  - `removeCurrency()` - Remove currency
  - `deactivateCurrency()` - Deactivate currency

- **Delegate Management**
  - `setDelegate()` - Set delegate address for deposit
  - `removeDelegate()` - Remove delegate

- **On-Chain Queries (RPC)**
  - `getDeposits()` / `getAccountDeposits()` - Query deposits via ProtocolViewer
  - `getDeposit()` / `getDepositsById()` - Get deposit(s) by ID
  - `getIntents()` / `getAccountIntents()` - Query intents
  - `getIntent()` - Get intent by hash

- **Indexer Integration** (via `client.indexer.*`)
  - `indexer.getDeposits()` - Query deposits with filters
  - `indexer.getDepositsWithRelations()` - Query with payment methods and intents
  - `indexer.getDepositById()` - Get single deposit by composite ID
  - `indexer.getDepositsByPayeeHash()` - Query by payee hash
  - `indexer.getIntentsForDeposits()` - Get intents for deposits
  - `indexer.getOwnerIntents()` - Get owner's intents

- **Quote System**
  - `getQuote()` - Get exchange quotes with optional escrow filtering

#### React Hooks

Complete suite of React hooks for all operations:
- `useCreateDeposit`, `useWithdrawDeposit`
- `useAddFunds`, `useRemoveFunds`
- `useSetAcceptingIntents`, `useSetIntentRange`, `useSetCurrencyMinRate`
- `useAddPaymentMethods`, `useRemovePaymentMethod`, `useSetPaymentMethodActive`
- `useAddCurrencies`, `useRemoveCurrency`, `useDeactivateCurrency`
- `useSetDelegate`, `useRemoveDelegate`
- `useSignalIntent`, `useFulfillIntent`, `useReleaseFundsToPayer`, `usePruneExpiredIntents`

#### Supported Payment Platforms

- Wise, Venmo, Revolut, CashApp, PayPal, Zelle, Monzo, MercadoPago

#### Supported Networks

- Base Mainnet (8453)
- Base Sepolia (84532)

#### Utilities

- Currency helpers (`Currency`, `currencyInfo`, `resolveFiatCurrencyBytes32`)
- Payment resolution (`resolvePaymentMethodHash`, `resolvePaymentMethodNameFromHash`)
- Contract helpers (`getContracts`, `getPaymentMethodsCatalog`)
- Logging (`logger`, `setLogLevel`)

#### Error Handling

- `ValidationError` - Invalid parameters
- `NetworkError` - Network/RPC issues
- `APIError` - API response errors
- `ContractError` - Smart contract errors
