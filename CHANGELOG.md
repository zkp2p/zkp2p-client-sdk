# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-12-01

### Major Rebrand: @zkp2p/offramp-sdk

This release marks a complete repositioning of the SDK as **Offramp SDK by Peer**, focused exclusively on deposit management and liquidity provision.

### Breaking Changes

- **Package renamed** from `@zkp2p/client-sdk` to `@zkp2p/offramp-sdk`
- **Removed all proof generation and extension code**:
  - Removed `@zkp2p/offramp-sdk/extension` subpath export
  - Removed `PeerauthExtension`, `ExtensionProofFlow`, `ExtensionMetadataFlow`, `ExtensionOrchestrator` classes
  - Removed `usePeerauthProofFlow` React hook
  - Removed proof encoding utilities: `encodeProofAsBytes`, `encodeTwoProofs`, `encodeManyProofs`, `assembleProofBytes`, `intentHashHexToDecimalString`
  - Removed `ReclaimProof` type export
  - Removed all `Extension*` types from type definitions
- **Removed dependencies**: `ethers`, `canonicalize` (no longer needed without proof encoding)
- **Simplified `TimeoutConfig`**: Removed `proofGeneration` and `extension` timeout options
- **Simplified `FulfillIntentParams`**: `proof` parameter now accepts `Record<string, unknown> | string` instead of `ReclaimProof | string | Record<string, unknown>`

### Added

- `OfframpClient` as primary export (alias for `Zkp2pClient`)

### What's Kept

All core deposit management and intent functionality remains:

- **Deposit Operations**: `createDeposit`, `withdrawDeposit`, `addFunds`, `removeFunds`
- **Deposit Configuration**: `setAcceptingIntents`, `setIntentRange`, `setCurrencyMinRate`
- **Intent Operations**: `signalIntent`, `fulfillIntent`, `releaseFundsToPayer`, `cancelIntent`, `pruneExpiredIntents`
- **Queries**: All indexer queries for deposits, intents, and liquidity data
- **React Hooks**: All deposit and intent management hooks
- **Payment Methods**: Full support for Wise, Venmo, Revolut, CashApp, PayPal, Zelle, Monzo, MercadoPago
- **Currency Utilities**: All currency resolution and conversion utilities
- **Contract Helpers**: `getContracts`, `getPaymentMethodsCatalog`

### Migration Guide

1. Update package name in dependencies:
   ```diff
   - "@zkp2p/client-sdk": "^6.2.0"
   + "@zkp2p/offramp-sdk": "^1.0.0"
   ```

2. Update imports:
   ```diff
   - import { Zkp2pClient } from '@zkp2p/client-sdk';
   + import { OfframpClient } from '@zkp2p/offramp-sdk';
   // Or keep using Zkp2pClient (still exported as alias)
   ```

3. Remove any extension-related imports:
   ```diff
   - import { ExtensionOrchestrator, usePeerauthProofFlow } from '@zkp2p/client-sdk/extension';
   - import { encodeProofAsBytes, assembleProofBytes, ReclaimProof } from '@zkp2p/client-sdk';
   ```

4. If you were using proof generation, you'll need to handle this separately outside the SDK.

---

## Previous Releases (as @zkp2p/client-sdk)

## [6.2.0] - 2025-11-10

### Changed
- **Breaking:** `fulfillIntent` now derives amount/fiat/payment data from the intent, so callers only provide `intentHash` plus a zkTLS proof.
- `Zkp2pClient.getQuote` accepts optional `escrowAddresses` filters and defaults to the client's native escrow when none are provided.

### Added
- New node example `examples/node-scripts/inspect-client.ts` for verifying resolved addresses/endpoints.
- Additional vitest coverage for fulfillIntent derivation, quote escrow filtering, and client initialization.

## [6.1.1] - 2025-11-08

### Added
- Payee-hash lookup helpers: `fetchDepositsByPayeeHash()`, `resolvePayeeHash()`
- Public API exports: `apiValidatePayeeDetails`, `apiPostDepositDetails`, `apiGetPayeeDetails`

## [2.2.2] - 2025-09-03

### Changed
- ci: refine release workflow to set version from tag, prevent re-publish of existing versions, and auto-promote dist-tags when applicable.

## [2.2.1] - 2025-01-03

### Fixed
- Fixed TypeScript compilation errors in test files
- Fixed test file to use `walletClient` instead of `publicClient`
- Added missing fields to mock data (FiatResponse and TokenResponse)

## [2.2.0] - 2025-01-03

### Added
- Added `payeeData` field to `QuoteSingleResponse` type for enriched quote responses
- Quote responses now automatically fetch and include payee details when API key or authorization token is available

### Changed
- Major refactoring of API adapter layer (~40-50% code reduction)
- Created unified `apiFetch()` base wrapper for all API calls
- Standardized error handling and retry logic across all endpoints
