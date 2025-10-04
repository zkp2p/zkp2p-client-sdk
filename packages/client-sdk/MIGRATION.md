# Migration Guide — Breaking Upgrade to the New SDK

This version removes the legacy v1/v2 split and supports only the new protocol stack:

- Contracts v2.1 (Escrow, Orchestrator, UnifiedPaymentVerifier) via `@zkp2p/contracts-v2`.
- Indexer (GraphQL) as the source of truth for reads (deposits, payment methods/currencies, intents).
- Intent lifecycle: orchestrator-first (signal → cancel → fulfill). Escrow calls exist as explicit fallback.

## What Changed (at a glance)

- Removed versioned subpaths `@zkp2p/client-sdk/v1` and `@zkp2p/client-sdk/v2`.
- Root export now exposes a single client: `Zkp2pClient`.
- Removed legacy Orders API read methods (`getQuote`, historical listings, payee registration helpers). Use the indexer read methods instead.
- Writes target contracts v2.1 only (createDeposit, signalIntent, cancelIntent, fulfillIntent). Signal/fulfill are orchestrator-first.
- Optional HTTP verification step for `signalIntent` is integrated (POST `/v2/verify/intent`). Provide `baseApiUrl` + `apiKey` (or bearer token) when constructing the client.

## New Client Construction

```ts
import { Zkp2pClient } from '@zkp2p/client-sdk';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';

const walletClient = createWalletClient({ chain: base, transport: custom(window.ethereum) });

const client = new Zkp2pClient({
  walletClient,
  chainId: base.id,
  runtimeEnv: 'production', // or 'staging'
  // Optional: enable HTTP verification for orchestrator signal
  baseApiUrl: 'https://api.zkp2p.xyz',
  apiKey: '<YOUR_API_KEY>',
});
```

## Reads — Indexer

```ts
// Active deposits with relations (payment methods, currencies) and latest intents
await client.getDepositsWithRelations({ status: 'ACTIVE', acceptingIntents: true }, { limit: 50 }, { includeIntents: true });

// A specific deposit
await client.getDepositById('0xescrow_123');

// Intents for deposit(s)
await client.getIntentsForDeposits(['0xescrow_123']);

// Intents by owner
await client.getOwnerIntents('0xYourAddress', ['SIGNALED', 'FULFILLED']);
```

## Writes — Contracts v2.1

Create deposit (struct-based):
```ts
await client.createDeposit({
  token: '0xUSDC',
  amount: 1_000_000n,
  intentAmountRange: { min: 100_000n, max: 1_000_000n },
  paymentMethods: ['0x…bytes32', '0x…bytes32'],
  paymentMethodData: [
    { intentGatingService: '0xsvc', payeeDetails: '0xpayeeHash', data: '0x' },
    { intentGatingService: '0xsvc2', payeeDetails: '0xpayeeHash2', data: '0x' },
  ],
  currencies: [
    [ { code: '0x55534400…', minConversionRate: 1_000_000n } ], // for method[0]
    [ { code: '0x55534400…', minConversionRate: 1_200_000n } ], // for method[1]
  ],
});
```

Signal intent — orchestrator-first (SDK can auto-fetch gating signature):
```ts
await client.signalIntent({
  orchestrator: {
    escrow: '0xEscrow',
    depositId: 1n,
    amount: 1_000_000n,
    to: '0xRecipient',
    paymentMethod: '0x…bytes32',
    fiatCurrency: '0x…bytes32',
    conversionRate: 1_000_000n,
    // Either provide signature+expiration directly, or enable HTTP verification via baseApiUrl/apiKey
    processorName: 'wise',
    payeeDetails: '0xPayeeHash',
  },
});
```

Cancel / Fulfill intent:
```ts
await client.cancelIntent({ intentHash: '0x…' }); // orchestrator-first

await client.fulfillIntent({
  useOrchestrator: true,
  orchestratorCall: {
    intentHash: '0x…',
    verificationData: '0x',
    postIntentHookData: '0x',
  },
});
```

## Replacing Removed APIs

- Quotes and Orders API: removed. Use the indexer to discover liquidity, and compute pricing off `minConversionRate` per currency/method where relevant.
- Payee registration routes: not part of this client. If needed, call your backend directly prior to deposit creation or intent signaling.

## React Hooks

Minimal hooks are provided for convenience (breaking changes applied):

- `useCreateDeposit` wraps `client.createDeposit` and returns `{ createDeposit, isLoading, error, txHash }`.
- `useSignalIntent` wraps `client.signalIntent` and returns `{ signalIntent, isLoading, error, txHash }`.
- `useFulfillIntent` wraps `client.fulfillIntent` and returns `{ fulfillIntent, isLoading, error, txHash }`.

> Previously exported hooks related to quotes, payee registration, and the extension have been removed from this package. The `extension` entry remains available separately.

## Notes

- Orchestrator availability depends on network/environment. The SDK automatically prefers orchestrator when available, else throws for orchestrator-only calls.
- For HTTP verification, the SDK expects `/v2/verify/intent` to return `{ responseObject: { signedIntent, intentData.signatureExpiration } }`.

