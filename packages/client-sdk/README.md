# @zkp2p/client-sdk

Browser-first TypeScript SDK for integrating ZKP2P into web apps. Built on the proven core from the React Native SDK and extended with peerauth browser extension integration.

## Install

`npm install @zkp2p/client-sdk viem`

## Quickstart

```ts
import { Zkp2pClient } from '@zkp2p/client-sdk';

const client = new Zkp2pClient({
  walletClient,         // viem wallet client
  apiKey: 'YOUR_API_KEY',
  chainId: 8453,        // Base mainnet
});

// Fetch quotes
const quotes = await client.getQuote({
  paymentPlatforms: ['wise'],
  fiatCurrency: 'USD',
  user: '0xYourAddress',
  recipient: '0xPayeeAddress',
  destinationChainId: 8453,
  destinationToken: client.getUsdcAddress(),
  amount: '100', // exact fiat by default
});

// Use the extension (optional)
import { PeerauthExtension } from '@zkp2p/client-sdk/extension';
const ext = new PeerauthExtension({ onVersion: v => console.log('Extension version', v) });
ext.fetchVersion();

// After generating proof via extension, fulfill intent (see Extension Flow section)
// await client.fulfillIntent({ intentHash, paymentProofs: [{ proof }], paymentMethod: 1 });
```

## Notes
- Core APIs mirror the React Native SDK where applicable.
- The extension module is browser-only and exposed via subpath import `@zkp2p/client-sdk/extension`.
- Ensure you validate extension availability and version before relying on it.

## Supported Platforms and Currencies

- Platforms: `wise`, `venmo`, `revolut`, `cashapp`, `mercadopago`, `zelle`, `paypal`, `monzo`.
- Currencies: AED, ARS, AUD, CAD, CHF, CNY, CZK, DKK, EUR, GBP, HKD, HUF, IDR, ILS, INR, JPY, KES, MXN, MYR, NOK, NZD, PHP, PLN, RON, SAR, SEK, SGD, THB, TRY, UGX, USD, VND, ZAR.

## Examples

- See the repo `examples/` folder for:
  - A Vite React walkthrough (get quotes and integrate the extension)
  - A minimal Node script to fetch quotes (`examples/node-scripts/get-quote.ts`)
  - A browser E2E journey demo with a mock extension (`examples/e2e-browser/index.html`)

### Run the E2E browser demo

This demo simulates the peerauth extension with a small in-page mock so you can see the end-to-end flow.

Steps:
- Build the SDK: `npm run build`
- Serve the repo root (to ensure same-origin messaging works). For example:
  - `npx http-server -p 5174 .` or `npx serve .`
- Open `http://localhost:5174/examples/e2e-browser/` in your browser.

What it shows:
- Requests the extension version via `postMessage`
- Generates a proof and receives a mock proof payload
- Converts the payload into a `ReclaimProof` with `parseExtensionProof`
- Shows the next step to call `fulfillIntent` with the proof

## Wallet Setup (viem)

You can pass any `viem` `WalletClient` (from wagmi or raw viem). Example with injected wallet on Base:

```ts
import { createWalletClient, custom } from 'viem'
import { base } from 'viem/chains'

const walletClient = createWalletClient({
  chain: base,
  transport: typeof window !== 'undefined' ? custom((window as any).ethereum) : undefined,
});

const client = new Zkp2pClient({ walletClient, apiKey: 'YOUR_API_KEY', chainId: base.id });
```

Override RPC URL if desired by passing `rpcUrl` to the constructor.

```ts
const client = new Zkp2pClient({ walletClient, apiKey, chainId: base.id, rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/<key>' });
```

Supported chains match `DEPLOYED_ADDRESSES`. Use `client.getDeployedAddresses()` and `client.getUsdcAddress()` when needed.

## Configuration & Environment

Best practice: pass values into the SDK at initialization. The SDK does not read env directly.

- Vite (.env):
```
VITE_ZKP2P_API_KEY=your_public_key
VITE_ZKP2P_RPC_URL=https://base-mainnet.g.alchemy.com/v2/xxx
```

Code:
```ts
const apiKey = import.meta.env.VITE_ZKP2P_API_KEY;
if (!apiKey) throw new Error('Missing VITE_ZKP2P_API_KEY');

const client = new Zkp2pClient({
  walletClient,
  apiKey,
  chainId: 8453,
  rpcUrl: import.meta.env.VITE_ZKP2P_RPC_URL,
  // Optional overrides:
  // baseApiUrl: import.meta.env.VITE_ZKP2P_BASE_API_URL,
  // witnessUrl: import.meta.env.VITE_ZKP2P_WITNESS_URL,
});
```

- Next.js (.env.local):
```
NEXT_PUBLIC_ZKP2P_API_KEY=your_public_key
NEXT_PUBLIC_ZKP2P_RPC_URL=https://base-mainnet.g.alchemy.com/v2/xxx
```

Code:
```ts
const apiKey = process.env.NEXT_PUBLIC_ZKP2P_API_KEY;
if (!apiKey) throw new Error('Missing NEXT_PUBLIC_ZKP2P_API_KEY');

const client = new Zkp2pClient({
  walletClient,
  apiKey,
  chainId: 8453,
  rpcUrl: process.env.NEXT_PUBLIC_ZKP2P_RPC_URL,
});
```

Security: only use public runtime env vars in the browser (VITE_/NEXT_PUBLIC_). If keys must remain private, proxy via your server.

## Types: Platforms and Currencies

- Payment platforms: `PAYMENT_PLATFORMS` is an exported `as const` array and `PaymentPlatformType` is the corresponding string union. Use it for extension calls to get autocomplete and type-safety.

```ts
import { PAYMENT_PLATFORMS, type PaymentPlatformType } from '@zkp2p/client-sdk';
const platform: PaymentPlatformType = 'wise'; // from PAYMENT_PLATFORMS
```

- Currencies: `CurrencyType` is the ISO-like currency code union (e.g., `'USD' | 'EUR' | …'`). Use it in `signalIntent`.

```ts
import { type CurrencyType } from '@zkp2p/client-sdk';

await client.signalIntent({
  processorName: 'wise',
  depositId: '1',
  tokenAmount: '1000000',
  payeeDetails: '{"email":"alice@example.com"}',
  toAddress: '0xRecipient',
  currency: 'USD' as CurrencyType,
});
```

## Extension Flow: Proof → Fulfill

The typical browser flow is:
1) Detect the peerauth extension and request its version
2) Ask the extension to generate a payment proof for a given `intentHash`
3) Fetch the proof by ID and convert it to the on-chain `ReclaimProof` format
4) Call `fulfillIntent` with the encoded proof

```ts
import { Zkp2pClient, assembleProofBytes, intentHashHexToDecimalString } from '@zkp2p/client-sdk';
import { PeerauthExtension, parseExtensionProof, ExtensionProofFlow, ExtensionMetadataFlow, metadataUtils } from '@zkp2p/client-sdk/extension';

// 1) Initialize the client
const client = new Zkp2pClient({ walletClient, apiKey, chainId: 8453 });

// 2) Set up the extension with callbacks
let cachedProofId: string | null = null;
const ext = new PeerauthExtension({
  onVersion: (v) => console.log('extension version:', v),
  onProofId: (id) => {
    cachedProofId = id;
    if (cachedProofId) ext.fetchProofById(); // 3) Request proof details once we have the id
  },
  onProof: async (notaryRequest) => {
    if (!notaryRequest) return;
    // 4) Convert extension proof → ReclaimProof shape expected by the contracts
    const reclaimProof = parseExtensionProof(notaryRequest.proof);
    // Submit proof on-chain
    await client.fulfillIntent({
      intentHash,
      paymentProofs: [{ proof: reclaimProof }],
      // optionally include a paymentMethod identifier (uint8) if needed by verifier
      // paymentMethod: 1,
    });
  },
  onError: (e) => console.error('extension error:', e),
});

// Kick off version check and proof generation
ext.fetchVersion();
ext.generateProof(
  'wise',        // platform identifier (e.g. 'wise', 'venmo', 'revolut', 'paypal', 'monzo', ...)
  intentHash,    // `0x…` intent hash to fulfill
  0              // originalIndex for the selected transaction/metadata
);

// Helper: Convert extension proof payload → ReclaimProof
const reclaimProof = parseExtensionProof(notaryRequest.proof);
```

### Orchestrated N‑proof flow (optional)

If a platform requires two proofs, or you want a single helper to handle polling/timeout and parsing, use `ExtensionProofFlow` and `assembleProofBytes`:

```ts
const flow = new ExtensionProofFlow();
try {
const proofs = await flow.generateProofs(
  'wise',                                   // platform
  intentHashHexToDecimalString(intentHash), // safe decimal string for extension
  0,                                        // originalIndex from extension metadata
  { requiredProofs: 1, pollIntervalMs: 3000, timeoutMs: 60000 },
  (p) => console.log('progress', p)
);

  // Option A: assemble bytes and submit manually
  const bytes = assembleProofBytes(proofs, { paymentMethod: 1 });
  // ... submit via your own viem client if desired

  // Option B: submit via SDK using the raw proofs
  await client.fulfillIntent({
    intentHash,
    paymentProofs: proofs.map((proof) => ({ proof })),
    paymentMethod: 1,
  });
} finally {
  flow.dispose();
}
```

---

## Transaction Metadata → Selection → Proof (separation)

Surface transaction candidates first, let the user choose, then generate proofs. This gives integrators full control over selection logic.

```ts
// 1) Start metadata flow (receives metadata pushed from extension)
const meta = new ExtensionMetadataFlow({ versionPollMs: 5000 });
const unsubscribe = meta.subscribe((platform, record) => {
  if (platform !== 'wise') return;
  const visible = metadataUtils.filterVisible(record.metadata);
  const sorted = metadataUtils.sortByDateDesc(visible);
  // Render `sorted` to your UI and let the user pick one
});

// Optionally, request metadata via extension action (actionType varies by platform/method)
// meta.requestMetadata('<actionTypeFromPlatformConfig>', 'wise');

// 2) Once user picks a transaction, capture its `originalIndex`
const chosenOriginalIndex = 0; // from the user’s selection

// 3) Generate proof(s)
const flow = new ExtensionProofFlow();
const proofs = await flow.generateProofs('wise', intentHashHexToDecimalString(intentHash), chosenOriginalIndex, { requiredProofs: 1 });

// 4) Submit
await client.fulfillIntent({ intentHash, paymentProofs: proofs.map(p => ({ proof: p })), paymentMethod: 1 });

// Cleanup on unmount
unsubscribe();
meta.dispose();
flow.dispose();
```

Notes:
- The extension pushes metadata via `postMessage`; the SDK caches and emits the latest per-platform.
- `expiresAt` indicates when metadata becomes stale. Use `meta.isExpired(platform)` to decide re-fetch strategy.

## Proof Helpers

- encode single: `encodeProofAsBytes(proof)`
- encode two: `encodeTwoProofs(proof1, proof2)`
- encode many: `encodeManyProofs([proofs])`
- tag method: `encodeProofAndPaymentMethodAsBytes(bytes, method)`
- assemble: `assembleProofBytes(proofs, { paymentMethod? })`
- parse extension payload: `parseExtensionProof(payload)`

## API Overview

- createDeposit(params): creates a deposit on-chain and stores deposit details via API
  - Params: `{ token, amount, intentAmountRange, conversionRates, processorNames, depositData, onSuccess, onMined, onError }`
  - Returns: `{ depositDetails, hash }`

- signalIntent(params): verifies intent via API and emits on-chain `signalIntent`
  - Params: `{ processorName, depositId, tokenAmount, payeeDetails, toAddress, currency, onSuccess, onMined, onError }`
  - Returns: `SignalIntentResponse & { txHash?: Hash }`

- fulfillIntent({ intentHash, paymentProofs, paymentMethod? }): submits proof bytes to fulfill an intent

- withdrawDeposit({ depositId }): withdraws a deposit

- cancelIntent({ intentHash }): cancels a pending intent

- releaseFundsToPayer({ intentHash }): releases escrowed funds back to payer

- getQuote(req): retrieves quotes from API (exact-fiat by default)

- getPayeeDetails({ platform, hashedOnchainId })

- getAccountDeposits(address): reads deposit views from chain

- getAccountIntent(address): reads current intent view from chain

See TypeScript types exported from the package for full shapes.

## SSR and Extension

- The extension entry `@zkp2p/client-sdk/extension` is browser-only. In SSR environments (Next.js), use dynamic import or guards to avoid referencing `window` during server rendering.

## Callbacks and Errors

- Callbacks (optional and per-method):
  - `onSuccess({ hash })`: emitted after the transaction is broadcast
  - `onMined({ hash })`: emitted after transaction is confirmed
  - `onError(error)`: emitted when any step fails

- Error classes:
  - `ZKP2PError` (base), `NetworkError`, `APIError`, `ContractError`, `ValidationError`, `ProofGenerationError`

## SSR vs Browser

- Core SDK is isomorphic; it does not require `window`.
- The extension entry `@zkp2p/client-sdk/extension` is browser-only. In SSR, import it dynamically or guard with `typeof window !== 'undefined'`.

## End-to-End Outline

1) Maker deposits liquidity:
```ts
await client.createDeposit({
  token: client.getUsdcAddress(),
  amount: 1000000n, // 1 USDC with 6 decimals
  intentAmountRange: { min: 500000n, max: 2000000n },
  processorNames: ['wise'],
  conversionRates: [[{ currency: 'USD', conversionRate: '1000000' }]],
  depositData: [{ /* payee details per processor */ }],
});
```

2) Buyer signals intent (after quote selection):
```ts
await client.signalIntent({
  processorName: 'wise',
  depositId: '1',
  tokenAmount: '1000000',
  payeeDetails: '{"email":"alice@example.com"}',
  toAddress: '0xRecipient',
  currency: 'USD',
});
```

3) Buyer proves payment in browser via extension and fulfills intent (see section above for proof flow):
```ts
// ext.generateProof(...)
// const proof = parseExtensionProof(...)
await client.fulfillIntent({ intentHash, paymentProofs: [{ proof }] });
```

---

## Releases

Two common flows: Development (dev tag) and Stable (latest).

Dev release (manual, recommended while iterating)
- Ensure you have publish access to the `@zkp2p` org: `npm whoami`
- Set the package scope and version:
  - `cd packages/client-sdk`
  - `npm pkg set name=@zkp2p/client-sdk`
  - `npm pkg set version=0.1.0` (or bump as needed)
- Build and publish under the `dev` dist-tag so it won’t affect `latest`:
  - `npm ci && npm run build`
  - If using 2FA: `npm publish --access public --tag dev --no-provenance --otp <CODE>`
  - Otherwise: `npm publish --access public --tag dev --no-provenance`
- Verify: `npm view @zkp2p/client-sdk dist-tags`
- Install in consumer apps: `npm i @zkp2p/client-sdk@dev`

Stable release (promote to `latest`)
- Bump version (e.g., `0.1.1`).
- Prefer publishing from a public CI with provenance; or publish locally:
  - `npm publish --access public --no-provenance` (provenance requires a public repo)
- Verify: `npm view @zkp2p/client-sdk dist-tags`

Notes
- Use `--tag dev` for non-production builds so integrators can test without moving `latest`.
- `--no-provenance` is required when publishing from a private repository. Use provenance only from public CI.

## License
MIT
