# @zkp2p/client-sdk

[![npm version](https://img.shields.io/npm/v/@zkp2p/client-sdk.svg)](https://www.npmjs.com/package/@zkp2p/client-sdk)
[![GitHub Release](https://img.shields.io/github/v/release/zkp2p/zkp2p-client-sdk?display_name=tag)](https://github.com/zkp2p/zkp2p-client-sdk/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)

Browser-first TypeScript SDK for integrating ZKP2P into web applications.

## Features

- Contracts v3 writes:
  - createDeposit (Escrow)
  - signalIntent (Orchestrator, HTTP verification optional)
  - cancelIntent (Orchestrator)
  - fulfillIntentWithAttestation (Orchestrator + Attestation Service)
  - releaseFundsToPayer (Orchestrator)
  - setAcceptingIntents / setIntentRange (Escrow)
  - setCurrencyMinRate (Escrow)
  - addFunds / removeFunds / withdrawDeposit (Escrow)
- Indexer reads for app data, optional ProtocolViewer on-chain reads
- Proof/encoding utilities and minimal logging helpers

## Contracts Package Types

This SDK consumes contract addresses, ABIs, and payment method catalogs directly from `@zkp2p/contracts-v2` with type safety.

- Addresses (typed): `@zkp2p/contracts-v2/addresses/<network>`
- ABIs (typed JSON): `@zkp2p/contracts-v2/abis/<network>/<Contract>.json`
- Payment methods (typed): `@zkp2p/contracts-v2/paymentMethods/<network>`

Helpers exported by the SDK:

```ts
import { getContracts, getPaymentMethodsCatalog } from '@zkp2p/client-sdk';

// Resolve addresses/ABIs per chain/env
const { addresses, abis } = getContracts(8453, 'production');
// addresses.Escrow, addresses.Orchestrator, ...
// abis.escrow, abis.orchestrator, ...

// Resolve payment methods catalog with hashes and optional allowed currencies
const methods = getPaymentMethodsCatalog(8453, 'production');
const wise = methods['wise'];
console.log(wise.paymentMethodHash);
```

Networks available:
- `base` (chainId 8453)
- `base_staging` (used when `runtimeEnv: 'staging'`)
- `base_sepolia` (chainId 84532)

## Project Structure

- Root export exposes a single modern client and minimal utilities.
- Browser-only helpers remain under `@zkp2p/client-sdk/extension`.

## Installation

```bash
npm install @zkp2p/client-sdk viem
# or
yarn add @zkp2p/client-sdk viem
# or
pnpm add @zkp2p/client-sdk viem
```

## Releases

- GitHub Releases: https://github.com/zkp2p/zkp2p-client-sdk/releases
- Changelog (package): ./CHANGELOG.md

## Quick Start

### Basic Client Setup

```typescript
import { Zkp2pClient } from '@zkp2p/client-sdk';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';

// Create viem wallet client
const walletClient = createWalletClient({
  chain: base,
  transport: custom(window.ethereum),
});

// Initialize ZKP2P client (Production)
const client = new Zkp2pClient({ walletClient, chainId: base.id, runtimeEnv: 'production' });
```

### Indexer Reads

```typescript
// Get active deposits with payment methods/currencies and latest intents
const deposits = await client.getDepositsWithRelations({ status: 'ACTIVE', acceptingIntents: true }, { limit: 50 }, { includeIntents: true });
```

### ProtocolViewer On-chain Reads (optional)

These helpers call the on-chain ProtocolViewer contract when available (Base Sepolia/Staging).

```ts
const pvDeposit = await client.getPvDepositById('1');
const pvDeposits = await client.getPvAccountDeposits('0xOwner');
const pvIntents = await client.getPvAccountIntents('0xOwner');
const pvIntent = await client.getPvIntent('0xIntentHash');
```

### Payment Methods (typed)

```ts
import { getPaymentMethodsCatalog } from '@zkp2p/client-sdk';

const methods = getPaymentMethodsCatalog(8453, 'production');
// Use in signalIntent inputs
const hash = methods['wise'].paymentMethodHash;
```

### Signal Intent (orchestrator, optional HTTP verification)

```typescript
// Provide baseApiUrl + apiKey (or authorizationToken) to auto-fetch gating signature
const client = new Zkp2pClient({ walletClient, chainId: base.id, baseApiUrl: 'https://api.zkp2p.xyz', apiKey: 'YOUR_API_KEY' });

await client.signalIntent({
  escrow: '0xEscrow',
  depositId: 1n,
  amount: 1000000n,
  to: '0xRecipient',
  paymentMethod: '0x…',
  fiatCurrency: '0x…',
  conversionRate: 123n,
  // Optional HTTP verification to fetch gatingServiceSignature/signatureExpiration
  processorName: 'wise',
  payeeDetails: '0xPayeeHash',
});

// If you already have the signature and expiration, pass them directly
// gatingServiceSignature: '0x…',
// signatureExpiration: 172800000n,

```

### Fulfill Intent via Attestation Service

```ts
const hash = await client.fulfillIntentWithAttestation({
  intentHash: '0xIntent',
  zkTlsProof: JSON.stringify(proofObj), // zkTLS proof JSON string
  platform: 'wise',
  actionType: 'payment',
  amount: '1000000',
  timestampMs: String(Date.now()),
  fiatCurrency: '0x…',
  conversionRate: '1000000',
  payeeDetails: '0x…',
  timestampBufferMs: '600000',
});
```

### Maker Deposit Management (Escrow v3)

```ts
// Toggle accepting intents
await client.setAcceptingIntents({ depositId: 1n, accepting: false });

// Update allowed intent amount range
await client.setIntentRange({ depositId: 1n, min: 100000n, max: 10000000n });

// Update min conversion rate for a currency under a payment method
await client.setCurrencyMinRate({
  depositId: 1n,
  paymentMethod: '0x…',
  fiatCurrency: '0x…',
  minConversionRate: 1000000n,
});

// Manage funds
await client.addFunds({ depositId: 1n, amount: 5_000_000n });
await client.removeFunds({ depositId: 1n, amount: 1_000_000n });
await client.withdrawDeposit({ depositId: 1n });
```

### Peerauth Extension (React)

Use the optional extension entry for browser proof generation. The hook wraps window.postMessage and the `ExtensionProofFlow` class:

```tsx
import { usePeerauthProofFlow } from '@zkp2p/client-sdk/extension';

function ProofButton({ platform, intentHash, originalIndex }: { platform: string; intentHash: string; originalIndex: number }) {
  const { start, status, progress, proofs, error, reset } = usePeerauthProofFlow({ requiredProofs: 1, timeoutMs: 60000 });

  const onClick = async () => {
    try {
      await start(platform as any, intentHash, originalIndex);
      // proofs[0] contains the Reclaim proof object ready to be encoded
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <button onClick={onClick} disabled={status === 'polling_proof' || status === 'waiting_proof_id'}>Generate Proof</button>
      {status !== 'idle' && <div>status: {status} (stage: {progress?.stage})</div>}
      {error && <div>Error: {String(error.message)}</div>}
    </div>
  );
}
```

This hook is only available in the browser. For SSR, conditionally render components that import from `@zkp2p/client-sdk/extension`.

### Helpers for Payment Method and Currency Encoding

You can resolve bytes32 values conveniently:

```ts
import { resolvePaymentMethodHash, resolveFiatCurrencyBytes32 } from '@zkp2p/client-sdk';

// Staging uses mainnet with a separate contract set
const paymentMethod = resolvePaymentMethodHash('wise', { env: 'staging', network: 'base' });
const usd = resolveFiatCurrencyBytes32('USD');
```

### Node Examples

See `examples/node-scripts`:
- `create-deposit.ts` (v3)
- `create-deposit-v3.ts` (struct demonstration)
- `signal-intent-orchestrator.ts`
- `fulfill-intent-orchestrator.ts`
- `release-funds-to-payer.ts`
- `cancel-intent.ts`

Run with ts-node or compile locally; provide env vars (see headers of each file).

## SSR Usage (Next.js, Remix)

The `extension` entry is browser-only. When server-rendering, guard access and use dynamic import:

```ts
// Safe access pattern
const isBrowser = typeof window !== 'undefined';
if (isBrowser) {
  const { ExtensionMetadataFlow } = await import('@zkp2p/client-sdk/extension');
  // use ExtensionMetadataFlow
}
```

In React frameworks (Next.js), prefer `dynamic(() => import('@zkp2p/client-sdk/extension'), { ssr: false })` for UI components that rely on the extension.

## Security Notes

- Do not commit API keys. Provide `apiKey` (or `authorizationToken`) at runtime via app config.
- Extension messaging validates `event.origin`. Only listen to trusted origins and propagate data defensively.
- Validate user-provided payee details with `validatePayeeDetails` before registering or signaling intents.

## Quality & Tooling

- Lint: `npm run lint` (ESLint with TypeScript + import and Prettier compatibility)
- Format: `npm run format` / `npm run format:write` (Prettier)
- Types: `npm run typecheck` (strict TS)
- Tests: `npm run test` (Vitest unit tests)
- Build: `npm run build` (tsup ESM/CJS + d.ts)

## Contributing & Development

```bash
cd packages/client-sdk
npm ci
npm run build
npm run test
npm run lint && npm run format
```

We follow Conventional Commits for releases. See `PUBLISHING.md` for package publishing guidance.

### Auth Options

Client supports both `x-api-key` and optional `Authorization: Bearer <token>` for hybrid auth.

```typescript
const client = new Zkp2pClient({
  walletClient,
  apiKey: 'YOUR_API_KEY',
  authorizationToken: 'JWT_OR_OAUTH_TOKEN',
  chainId: 8453,
});
```

### Types

- Public Indexer types exported as `IndexerDeposit`, `IndexerDepositWithRelations`, and `IndexerIntent`.

## React Hooks (optional)

Use the minimal hooks from `@zkp2p/client-sdk/react` with your existing `Zkp2pClient` instance.

```tsx
import { Zkp2pClient } from '@zkp2p/client-sdk';
import { useSignalIntent, useCreateDeposit, useFulfillIntent } from '@zkp2p/client-sdk/react';

export function SignalButton({ client, params }: { client: Zkp2pClient; params: Parameters<Zkp2pClient['signalIntent']>[0] }) {
  const { signalIntent, isLoading, error, txHash } = useSignalIntent({ client, onSuccess: (hash) => console.log('Signaled:', hash) });
  return <button disabled={isLoading} onClick={() => signalIntent(params)}>Signal Intent</button>;
}

export function CreateDepositButton({ client, params }: { client: Zkp2pClient; params: Parameters<Zkp2pClient['createDeposit']>[0] }) {
  const { createDeposit, isLoading, error, txHash } = useCreateDeposit({ client });
  return <button disabled={isLoading} onClick={() => createDeposit(params)}>Create Deposit</button>;
}

export function FulfillButton({ client, params }: { client: Zkp2pClient; params: Parameters<Zkp2pClient['fulfillIntent']>[0] }) {
  const { fulfillIntent, isLoading, error, txHash } = useFulfillIntent({ client });
  return <button disabled={isLoading} onClick={() => fulfillIntent(params)}>Fulfill Intent</button>;
}
```

## API Overview

- Reads (Indexer):
  - `getDeposits(filter?, pagination?)`
  - `getDepositsWithRelations(filter?, pagination?, { includeIntents?, intentStatuses? })`
  - `getDepositById(id, { includeIntents?, intentStatuses? })`
  - `getIntentsForDeposits(ids, statuses?)`
  - `getOwnerIntents(owner, statuses?)`
- Writes (Contracts v3):
  - `createDeposit({ token, amount, intentAmountRange, paymentMethods, paymentMethodData, currencies, ... })`
  - `signalIntent({ orchestrator: { ... } })` (or escrow path)
  - `fulfillIntent({ useOrchestrator?, orchestratorCall? | escrowCall? })`
  - `cancelIntent({ intentHash, useOrchestrator? })`

### Testing

```ts
import { Zkp2pClient } from '@zkp2p/client-sdk';
import { createWalletClient, http } from 'viem';
import { hardhat } from 'viem/chains';

const testClient = new Zkp2pClient({
  walletClient: createWalletClient({
    chain: hardhat,
    transport: http(),
  }),
  chainId: hardhat.id,
});
```

## Contributing & Development

```bash
cd packages/client-sdk
npm ci
npm run build
npm run test
npm run lint && npm run format
```

We follow Conventional Commits for releases. See `PUBLISHING.md` for package publishing guidance.

### Auth Options

Client supports both `x-api-key` and optional `Authorization: Bearer <token>` for hybrid auth.

```typescript
const client = new Zkp2pClient({
  walletClient,
  apiKey: 'YOUR_API_KEY',
  authorizationToken: 'JWT_OR_OAUTH_TOKEN',
  chainId: 8453,
});
```

### Types

- Public Indexer types exported as `IndexerDeposit`, `IndexerDepositWithRelations`, and `IndexerIntent`.

## React Integration

### Complete React Example

```tsx
import React, { useState } from 'react';
import { 
  useZkp2pClient, 
  useQuote, 
  useSignalIntent,
  useCreateDeposit,
  useFulfillIntent,
  useExtensionOrchestrator,
  PLATFORM_METADATA,
  Currency,
  type PaymentPlatformType 
} from '@zkp2p/client-sdk';

function ZKP2PApp() {
  const [selectedPlatform, setSelectedPlatform] = useState<PaymentPlatformType>('venmo');

  // Initialize client with hooks
  const { client, isInitialized, error: clientError } = useZkp2pClient({
    walletClient: window.walletClient, // Your viem wallet client
    apiKey: process.env.REACT_APP_ZKP2P_API_KEY!,
    chainId: 8453, // Base mainnet
  });

  // Quote management
  const { 
    fetchQuote, 
    quote, 
    isLoading: quoteLoading, 
    error: quoteError 
  } = useQuote({
    client,
    onSuccess: (quote) => {
      console.log('Quote received:', quote);
    },
    onError: (error) => {
      console.error('Quote error:', error);
    },
  });

  // Signal intent hook
  const { 
    signalIntent, 
    response: intentResponse, 
    isLoading: intentLoading 
  } = useSignalIntent({
    client,
    onSuccess: (response) => {
      console.log('Intent signaled:', response);
    },
  });

  // Extension orchestrator for proof generation
  const {
    authenticate,
    payments,
    proofs,
    proofBytes,
    isAuthenticating,
    isGeneratingProof,
    progress,
    error: proofError,
  } = useExtensionOrchestrator({
    debug: true,
    autoDispose: true,
  });

  // Fulfill intent with proof
  const { 
    fulfillIntent, 
    txHash, 
    isLoading: fulfillLoading 
  } = useFulfillIntent({
    client,
    onSuccess: (hash) => {
      console.log('Intent fulfilled! Transaction:', hash);
    },
  });

  // Handle authentication and proof generation
  const handleAuthenticateAndProve = async () => {
    if (!intentResponse?.intentHash) {
      alert('Please signal an intent first');
      return;
    }

    const result = await authenticate(selectedPlatform, {
      autoGenerateProof: {
        intentHashHex: intentResponse.intentHash,
        itemIndex: 0,
        onProofGenerated: (proofs) => {
          console.log('Proofs generated:', proofs);
        },
        onProofError: (error) => {
          console.error('Proof generation failed:', error);
        },
        onProgress: (progress) => {
          console.log('Progress:', progress);
        },
      },
      onPaymentsReceived: (payments) => {
        console.log('Payments received:', payments);
      },
    });

    // Automatically fulfill intent with generated proofs
    if (result?.proofs && intentResponse?.intentHash) {
      await fulfillIntent({
        intentHash: intentResponse.intentHash,
        paymentProofs: result.proofs.map(proof => ({ proof })),
      });
    }
  };

  // Handle quote fetching
  const handleFetchQuote = async () => {
    await fetchQuote({
      paymentPlatforms: [selectedPlatform],
      fiatCurrency: Currency.USD,
      user: '0xYourAddress',
      recipient: '0xRecipientAddress',
      destinationChainId: 8453,
      destinationToken: client?.getUsdcAddress() || '0x',
      amount: '100',
    });
  };

  if (!isInitialized) {
    return <div>Initializing ZKP2P client...</div>;
  }

  if (clientError) {
    return <div>Error initializing client: {clientError.message}</div>;
  }

  return (
    <div className="zkp2p-app">
      <h1>ZKP2P Integration</h1>

      {/* Platform Selection */}
      <div className="platform-selector">
        <h2>Select Payment Platform</h2>
        {Object.entries(PLATFORM_METADATA).map(([key, platform]) => (
          <button
            key={key}
            onClick={() => setSelectedPlatform(key as PaymentPlatformType)}
            className={selectedPlatform === key ? 'selected' : ''}
          >
            {platform.logo} {platform.displayName}
          </button>
        ))}
      </div>

      {/* Quote Section */}
      <div className="quote-section">
        <h2>Get Quote</h2>
        <button onClick={handleFetchQuote} disabled={quoteLoading}>
          {quoteLoading ? 'Fetching...' : 'Fetch Quote'}
        </button>
        {quote && (
          <div className="quote-display">
            <h3>Quote Details:</h3>
            <pre>{JSON.stringify(quote, null, 2)}</pre>
          </div>
        )}
        {quoteError && <div className="error">Error: {quoteError.message}</div>}
      </div>

      {/* Authentication & Proof Generation */}
      <div className="proof-section">
        <h2>Generate Payment Proof</h2>
        <button 
          onClick={handleAuthenticateAndProve}
          disabled={isAuthenticating || isGeneratingProof}
        >
          {isAuthenticating 
            ? 'Authenticating...' 
            : isGeneratingProof 
            ? `Generating Proof... ${progress?.stage || ''}` 
            : 'Authenticate & Generate Proof'}
        </button>

        {/* Display progress */}
        {progress && (
          <div className="progress">
            <p>Stage: {progress.stage}</p>
            <p>Proof Index: {progress.proofIndex}</p>
            {progress.message && <p>Message: {progress.message}</p>}
          </div>
        )}

        {/* Display generated proofs */}
        {proofs && (
          <div className="proof-display">
            <h3>Generated Proofs:</h3>
            <p>Number of proofs: {proofs.length}</p>
            <p>Proof bytes: {proofBytes}</p>
          </div>
        )}

        {/* Display errors */}
        {proofError && <div className="error">Error: {proofError.message}</div>}
      </div>

      {/* Transaction Status */}
      {txHash && (
        <div className="success">
          <h3>✅ Transaction Successful!</h3>
          <p>Hash: {txHash}</p>
          <a 
            href={`https://basescan.org/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            View on BaseScan
          </a>
        </div>
      )}
    </div>
  );
}

export default ZKP2PApp;
```

### React Hooks (V3)

- useCreateDeposit: Calls client.createDeposit.
- useSignalIntent: Calls client.signalIntent.
- useFulfillIntent: Calls client.fulfillIntentWithAttestation.
- useReleaseFundsToPayer: Calls client.releaseFundsToPayer.
- useSetAcceptingIntents, useSetIntentRange, useSetCurrencyMinRate: Escrow v3 maker management.
- useAddFunds, useRemoveFunds, useWithdrawDeposit: Escrow v3 liquidity management.

Basic usage:

```tsx
import { useCreateDeposit, useSignalIntent, useFulfillIntent, useReleaseFundsToPayer } from '@zkp2p/client-sdk/react';

function Actions({ client }: { client: Zkp2pClient }) {
  const { createDeposit, isLoading: creating } = useCreateDeposit({ client });
  const { signalIntent, isLoading: signaling } = useSignalIntent({ client });
  const { fulfillIntent, isLoading: fulfilling } = useFulfillIntent({ client });
  const { releaseFundsToPayer, isLoading: releasing } = useReleaseFundsToPayer({ client });

  // call createDeposit({ token, amount, intentAmountRange, paymentMethods, paymentMethodData, currencies })
  // call signalIntent({ escrow, depositId, amount, to, paymentMethod, fiatCurrency, conversionRate, ... })
  // call fulfillIntent({ intentHash, zkTlsProof, platform, actionType, ... })
  // call releaseFundsToPayer({ intentHash })
  return null;
}
```

## Extension Integration

### Unified Authentication Flow (Recommended)

```typescript
import { PLATFORM_METADATA } from '@zkp2p/client-sdk';
import { ExtensionOrchestrator } from '@zkp2p/client-sdk/extension';

async function authenticateAndGenerateProof() {
  const orchestrator = new ExtensionOrchestrator({ 
    debug: true,
    metadataTimeoutMs: 60000,
  });

  try {
    // Single call for authentication and proof generation
    const result = await orchestrator.authenticateAndGenerateProof('revolut', {
      paymentMethod: 1,
      autoGenerateProof: {
        intentHashHex: '0x123...abc',
        itemIndex: 0,
        onProofGenerated: (proofs) => {
          console.log(`✅ Generated ${proofs.length} proof(s)`);
        },
        onProofError: (error) => {
          console.error('❌ Proof generation failed:', error);
        },
        onProgress: (progress) => {
          console.log(`⏳ ${progress.stage} - Proof ${progress.proofIndex + 1}`);
        },
      },
      onPaymentsReceived: (payments) => {
        console.log(`📱 Received ${payments.length} payments`);
      },
    });

    // Access results
    console.log('Payments:', result.payments);
    console.log('Proofs:', result.proofs);
    console.log('Proof bytes:', result.proofBytes);

    // Submit to blockchain
    if (result.proofs && result.proofBytes) {
      await client.fulfillIntent({
        intentHash: '0x123...abc',
        paymentProofs: result.proofs.map(p => ({ proof: p })),
      });
    }
  } finally {
    orchestrator.dispose();
  }
}
```

### Manual Proof Generation Flow

```typescript
import { 
  ExtensionProofFlow, 
  ExtensionMetadataFlow,
  metadataUtils,
  intentHashHexToDecimalString,
  assembleProofBytes 
} from '@zkp2p/client-sdk/extension';

async function manualProofFlow() {
  // Step 1: Get payment metadata
  const metaFlow = new ExtensionMetadataFlow({ debug: true });
  
  const payments = await new Promise((resolve) => {
    const unsub = metaFlow.subscribe((platform, record) => {
      if (platform === 'venmo') {
        const visible = metadataUtils.filterVisible(record.metadata);
        const sorted = metadataUtils.sortByDateDesc(visible);
        unsub();
        resolve(sorted);
      }
    });
    
    // Request metadata from extension
    metaFlow.requestMetadata('list_transactions', 'venmo');
  });

  // Step 2: User selects a payment
  const selectedPayment = payments[0]; // In real app, let user choose

  // Step 3: Generate proof(s)
  const proofFlow = new ExtensionProofFlow({ debug: true });
  
  const proofs = await proofFlow.generateProofs(
    'venmo',
    intentHashHexToDecimalString('0x123...abc'),
    selectedPayment.originalIndex,
    { 
      requiredProofs: 1, // Venmo requires 1 proof
      timeoutMs: 120000,
      pollIntervalMs: 3000,
    },
    (progress) => {
      console.log('Progress:', progress);
    }
  );

  // Step 4: Build proof bytes and submit
  const proofBytes = assembleProofBytes(proofs, { paymentMethod: 1 });
  
  await client.fulfillIntent({
    intentHash: '0x123...abc',
    paymentProofs: proofs.map(p => ({ proof: p })),
  });

  // Cleanup
  metaFlow.dispose();
  proofFlow.dispose();
}
```

## Working with Constants

### Platform Information

```typescript
import { 
  PAYMENT_PLATFORMS, 
  PLATFORM_METADATA,
  type PaymentPlatformType 
} from '@zkp2p/client-sdk';

// List all supported platforms
console.log('Supported platforms:', PAYMENT_PLATFORMS);
// ['wise', 'venmo', 'revolut', 'cashapp', 'mercadopago', 'zelle', 'paypal', 'monzo']

// Get platform metadata
PAYMENT_PLATFORMS.forEach(platform => {
  const meta = PLATFORM_METADATA[platform];
  console.log(`${meta.logo} ${meta.displayName}: ${meta.requiredProofs} proof(s) required`);
});

// Type-safe platform usage
function processPlatform(platform: PaymentPlatformType) {
  const metadata = PLATFORM_METADATA[platform];
  console.log(`Processing ${metadata.displayName}...`);
}
```

### Currency Information

```typescript
import { 
  Currency, 
  currencyInfo,
  type CurrencyType,
  type CurrencyData 
} from '@zkp2p/client-sdk';

// Use currency constants
const usdCurrency: CurrencyType = Currency.USD;
const eurCurrency: CurrencyType = Currency.EUR;

// Get detailed currency information
const usdInfo: CurrencyData = currencyInfo[Currency.USD];
console.log(`${usdInfo.currencySymbol} - ${usdInfo.currencyName}`);
// $ - United States Dollar

// List all supported currencies
Object.values(Currency).forEach(code => {
  const info = currencyInfo[code];
  console.log(`${info.countryCode}: ${info.currencySymbol} ${info.currencyCode}`);
});
```

### Chain and Contract Information

```typescript
import { 
  SUPPORTED_CHAIN_IDS, 
  DEPLOYED_ADDRESSES,
  DEFAULT_BASE_API_URL,
  DEFAULT_WITNESS_URL,
  type SupportedChainId 
} from '@zkp2p/client-sdk';

// Supported chains
console.log('Base Mainnet:', SUPPORTED_CHAIN_IDS.BASE_MAINNET); // 8453
console.log('Base Sepolia:', SUPPORTED_CHAIN_IDS.BASE_SEPOLIA); // 84532
console.log('Scroll:', SUPPORTED_CHAIN_IDS.SCROLL_MAINNET); // 534352

// Get contract addresses for a specific chain
const baseContracts = DEPLOYED_ADDRESSES[SUPPORTED_CHAIN_IDS.BASE_MAINNET];
console.log('Escrow:', baseContracts.escrow);
console.log('USDC:', baseContracts.usdc);
console.log('Venmo Verifier:', baseContracts.venmo);

// API endpoints
console.log('API URL:', DEFAULT_BASE_API_URL);
console.log('Witness URL:', DEFAULT_WITNESS_URL);
```

## Advanced Usage

### On-chain Views Enrichment

When fetching on-chain deposits and intents, the SDK automatically enriches the data with payment metadata when an API key is provided:

```typescript
// Fetch deposits with automatic enrichment
const deposits = await client.getAccountDeposits('0xYourAddress');

// Each deposit's verifiers will include:
// - paymentMethod: Platform key (e.g., 'venmo', 'revolut', 'paypal')
// - paymentData: Platform-specific metadata from API (when available)
deposits.forEach(deposit => {
  deposit.verifiers.forEach(verifier => {
    console.log('Platform:', verifier.verificationData.paymentMethod);
    console.log('Payment Data:', verifier.verificationData.paymentData);
  });
});

// Fetch intent with automatic enrichment
const intent = await client.getAccountIntent('0xYourAddress');

if (intent) {
  // Top-level intent includes enriched data
  console.log('Payment Platform:', intent.intent.paymentMethod);
  console.log('Payment Data:', intent.intent.paymentData);
  
  // Verifiers also include enriched data
  intent.deposit.verifiers.forEach(verifier => {
    console.log('Verifier Platform:', verifier.verificationData.paymentMethod);
    console.log('Verifier Data:', verifier.verificationData.paymentData);
  });
}
```

**Notes:**
- Enrichment is best-effort and won't throw errors if it fails
- `paymentMethod` is always set when the verifier is a recognized platform
- `paymentData` requires a valid API key and may not always be available
- The enrichment happens automatically - no additional configuration needed

### Custom Timeout Configuration

```typescript
const client = new Zkp2pClient({
  walletClient,
  apiKey: 'YOUR_API_KEY',
  chainId: 8453,
  timeouts: {
    api: 30000,           // 30 seconds for API calls
    transaction: 60000,   // 60 seconds for transactions
    proofGeneration: 120000, // 2 minutes for proof generation
    extension: 60000,     // 60 seconds for extension communication
  },
});
```

### Error Handling

```typescript
import { 
  ZKP2PError,
  ValidationError,
  NetworkError,
  APIError,
  ContractError,
  ProofGenerationError,
  ErrorCode 
} from '@zkp2p/client-sdk';

try {
  await client.signalIntent({ /* ... */ });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Error code:', error.code);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else if (error instanceof APIError) {
    console.error('API error:', error.message);
  } else if (error instanceof ContractError) {
    console.error('Smart contract error:', error.message);
  } else if (error instanceof ProofGenerationError) {
    console.error('Proof generation failed:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Logging Configuration

```typescript
import { logger, setLogLevel } from '@zkp2p/client-sdk';

// Set log level
setLogLevel('debug'); // 'debug' | 'info' | 'warn' | 'error' | 'none'

// Use logger in your app
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
```

### Proof Encoding Utilities

```typescript
import {
  encodeProofAsBytes,
  encodeTwoProofs,
  encodeManyProofs,
  encodeProofAndPaymentMethodAsBytes,
  assembleProofBytes,
  type ReclaimProof
} from '@zkp2p/client-sdk';
import { parseExtensionProof } from '@zkp2p/client-sdk/extension';

// Parse proof from extension
const extensionPayload = '...'; // From extension
const reclaimProof: ReclaimProof = parseExtensionProof(extensionPayload);

// Encode single proof
const singleBytes = encodeProofAsBytes(reclaimProof);

// Encode two proofs (for platforms requiring 2 proofs)
const twoBytes = encodeTwoProofs(proof1, proof2);

// Encode many proofs
const manyBytes = encodeManyProofs([proof1, proof2, proof3]);

// Add payment method to encoded bytes
const taggedBytes = encodeProofAndPaymentMethodAsBytes(singleBytes, 1);

// Assemble proofs with optional payment method
const assembled = assembleProofBytes([proof1, proof2], { paymentMethod: 1 });
```

## Environment Configuration

### Vite

```bash
# .env
VITE_ZKP2P_API_KEY=your_api_key_here
VITE_ZKP2P_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_key
VITE_ZKP2P_BASE_API_URL=https://api.zkp2p.xyz
VITE_ZKP2P_WITNESS_URL=https://witness-proxy.zkp2p.xyz
```

```typescript
// main.tsx
import { Zkp2pClient } from '@zkp2p/client-sdk';

const client = new Zkp2pClient({
  walletClient,
  apiKey: import.meta.env.VITE_ZKP2P_API_KEY!,
  chainId: 8453,
  rpcUrl: import.meta.env.VITE_ZKP2P_RPC_URL,
  baseApiUrl: import.meta.env.VITE_ZKP2P_BASE_API_URL,
  witnessUrl: import.meta.env.VITE_ZKP2P_WITNESS_URL,
});
```

### Next.js

```bash
# .env.local
NEXT_PUBLIC_ZKP2P_API_KEY=your_api_key_here
NEXT_PUBLIC_ZKP2P_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_key
```

```typescript
// app/providers.tsx
'use client';

import { Zkp2pClient } from '@zkp2p/client-sdk';

const client = new Zkp2pClient({
  walletClient,
  chainId: 8453,
});
```

### Create React App

```bash
# .env
REACT_APP_ZKP2P_API_KEY=your_api_key_here
REACT_APP_ZKP2P_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_key
```

```typescript
// App.tsx
const client = new Zkp2pClient({
  walletClient,
  apiKey: process.env.REACT_APP_ZKP2P_API_KEY!,
  chainId: 8453,
  rpcUrl: process.env.REACT_APP_ZKP2P_RPC_URL,
});
```

 

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [NPM Package](https://www.npmjs.com/package/@zkp2p/client-sdk)
- [GitHub Repository](https://github.com/zkp2p/zkp2p-client-sdk)
- [Documentation](https://docs.zkp2p.xyz)

## Support

- GitHub Issues: [Create an issue](https://github.com/zkp2p/zkp2p-client-sdk/issues)
 
- Email: support@zkp2p.xyz
