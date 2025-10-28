# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and [Conventional Commits](https://www.conventionalcommits.org/).

## [6.1.0] - 2025-10-28

### Added
- Indexer helpers: payee-hash lookups (`fetchDepositsByPayeeHash`, `resolvePayeeHash`) and GraphQL query for payment methods to match downstream client usage.
- SDK surface exports for `apiValidatePayeeDetails`, `apiPostDepositDetails`, and `apiGetPayeeDetails` so apps can reuse the REST adapters without private imports.

### Changed
- `Zkp2pClient` now exposes `getDepositsByPayeeHash` and `resolvePayeeHash` to align with `zkp2p-v2-client` workflows.

## [4.0.0] - 2025-10-27

### Breaking
- V3-only client: removed versioned subpath imports (`@zkp2p/client-sdk/v1`, `@zkp2p/client-sdk/v2`). Use root import `@zkp2p/client-sdk`.
- Renamed `getContractsV2` to `getContracts`.
- Renamed `mapConversionRatesToOnchainV2` to `mapConversionRatesToOnchainMinRate`.

### Added
- Maker actions for Escrow v3: `setAcceptingIntents`, `setIntentRange`, `setCurrencyMinRate`, `addFunds`, `removeFunds`, `withdrawDeposit`.
- Taker action: `releaseFundsToPayer` (Orchestrator).
- React hooks for maker/taker actions under `@zkp2p/client-sdk/react`.
- Updated indexer endpoints and added `MANUALLY_RELEASED` intent status.

### Changed
- Examples and README migrated to V3 flows (orchestrator + attestation + protocol viewer).

## [3.1.0] - 2025-09-08

### Added
- **Staging Environment Support**: Added `environment` parameter to `Zkp2pClient` for selecting between production and staging contract addresses on Base mainnet
- **New Payment Platforms**: Added support for PayPal and Monzo payment platforms across all supported chains
- **Intent and Deposit Enrichment**: Automatic enrichment of on-chain views with payment metadata:
  - `paymentMethod` field indicates the platform (e.g., 'venmo', 'paypal', 'monzo')
  - `paymentData` field contains platform-specific metadata when API key is available
  - Enrichment is best-effort and non-blocking
- **Helper Functions**: New utility functions for platform address management:
  - `getPlatformAddressMap()` - Get mapping of platform names to addresses
  - `platformFromVerifierAddress()` - Resolve platform name from verifier address
- **OrderStats Type**: Added proper `OrderStats` type with intent statistics fields

### Changed
- **Breaking**: `createDeposit` action now requires `addresses` parameter (ContractSet type)
- Contract constants restructured to support environment-specific addresses
- Updated `GetDepositsOrderStatsResponse` to use `OrderStats[]` type
- Removed Scroll chain support (534352) to match React Native SDK

### Fixed
- Test suite updated to pass new `addresses` parameter to `createDeposit`

## [3.0.0] - 2025-09-04

### Added
- Full migration to viem (no ethers dependency). Proof encoding and hashing implemented via `viem`.

### Changed
- Breaking: on-chain numeric types in `EscrowDepositView`/`EscrowIntentView` moved from `BigNumber` to `bigint`.
- Build now emits `.cjs` for CommonJS; `exports.require` points to `dist/index.cjs` to ensure Node/CJS compatibility.

### Fixed
- Package CJS export mismatch that caused `index.cjs` resolution errors in some environments.

## [2.2.2] - 2025-09-03

### Changed
- CI: Safer publish workflow that syncs workspace version from tag, avoids republishing existing versions, and promotes dist-tags idempotently.
- CI: Dev prereleases publish to `zkp2p-client-sdk-dev` under `--tag dev` (no provenance) for easier testing.

## [2.1.0] - 2025-09-02

### Added
- Versioned subpath imports for API versions: `@zkp2p/client-sdk/v1` and `@zkp2p/client-sdk/v2` (Google-style).
- `v1` entry re-exports the existing stable client, types, constants, utilities, and React hooks.
- `v2` entry scaffolded as a stub to enable early integration without bundling v1 shapes.

### Changed
- Documentation updated to recommend versioned imports for better tree-shaking and compile-time isolation.
- Examples now import extension-only helpers from `@zkp2p/client-sdk/extension` explicitly.
- Build configured to emit v1/v2 bundles; package `exports` updated accordingly.

### Notes
- The v2 entry is a placeholder and will be implemented when the V2 API is available.
- Root import (`@zkp2p/client-sdk`) continues to expose v1 for backward compatibility.

## [1.0.0] - 2025-01-26

### 🎉 Major Release

This release brings feature parity with the React Native SDK and introduces powerful new features for web developers.

### Added

#### New Features
- **Unified Authentication API**: New `authenticateAndGenerateProof` method that combines metadata request and proof generation
- **React Hooks**: Complete set of hooks for React applications (`useZkp2pClient`, `useQuote`, `useSignalIntent`, etc.)
- **Enhanced Callbacks**: Granular progress tracking with `onProofGenerated`, `onProofError`, `onProgress`
- **Constants Module**: Comprehensive export of platforms, currencies, chain IDs, and metadata

#### Developer Experience
- Full TypeScript support with improved type exports
- React as optional peer dependency (works with any framework)
- Better error messages and validation
- Comprehensive documentation and examples

### Changed
- **Breaking**: Reorganized module exports for better tree-shaking
- Improved extension orchestrator with better state management
- Enhanced proof generation flow with progress callbacks

### Migration from 0.x
See README for detailed migration guide and new API usage examples.

## [0.4.2] - Previous
- Bug fixes and performance improvements

## [0.4.1] - Previous
- Minor updates

## [0.4.0] - Previous
- Extension integration improvements

## [0.1.0] - Initial Release
- Initial public release of `@zkp2p/client-sdk` with core actions, extension helper, and documentation.
## [5.0.0] - 2025-10-27

### Breaking
- Unified API with React Native SDK schema to minimize bloat and ambiguity.
- createDeposit now accepts name-based inputs and returns `{ depositDetails, hash }`.
- Removed createDepositResolved (use createDeposit).
- Simplified signalIntent to accept `{ depositId, amount, toAddress, processorName, payeeDetails, fiatCurrencyCode, conversionRate }`.
- Removed signalIntentResolved (use signalIntent).
- Renamed fulfillIntentWithAttestation to fulfillIntent.

### Added/Changed
- createDeposit posts deposit details to API to resolve hashedOnchainIds internally.
- retainOnEmpty defaults to `false` to avoid viem ABI boolean undefined issues.
- Hooks and examples updated to match new signatures.
## [5.0.2] - 2025-10-27

### Fixed
- Currency validation: compare keccak256 currency hashes (catalog format) instead of ASCII bytes32; prevents false “unsupported currency” errors in createDeposit.
- API base handling: avoid duplicate version segments (no more `/v1/v1` when callers include `/v1` in `baseApiUrl`).

## [5.0.1] - 2025-10-27

### Fixed
- ESM-safe catalog loading: statically import paymentMethods JSON so Vite/browser bundlers include the data (no dynamic `require`).
