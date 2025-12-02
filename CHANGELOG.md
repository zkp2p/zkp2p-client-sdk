# Changelog

All notable changes to `@zkp2p/offramp-sdk` will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-12-02

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

- **Indexer Integration**
  - `getDeposits()` - Query deposits with filters
  - `getDepositsWithRelations()` - Query with payment methods and intents
  - `getDepositById()` - Get single deposit
  - `getDepositsByPayeeHash()` - Query by payee hash
  - `getIntentsForDeposits()` - Get intents for deposits
  - `getOwnerIntents()` - Get owner's intents

- **Quote System**
  - `getQuote()` - Get exchange quotes with optional escrow filtering

#### React Hooks

Complete suite of React hooks for all operations via `@zkp2p/offramp-sdk/react`:
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

---

## Legacy: @zkp2p/client-sdk

Previous versions of this repository contained `@zkp2p/client-sdk`. That package remains available on npm for existing users but is no longer maintained in this repository.

For the legacy changelog, see the [npm package history](https://www.npmjs.com/package/@zkp2p/client-sdk?activeTab=versions).
