# @zkp2p/offramp-sdk

[![npm version](https://img.shields.io/npm/v/@zkp2p/offramp-sdk.svg)](https://www.npmjs.com/package/@zkp2p/offramp-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)

**Offramp SDK by Peer** - TypeScript SDK for deposit management, liquidity provision, and fiat off-ramping on Base.

## Features

- **Deposit Management**: Create, configure, and manage liquidity deposits
- **Fund Operations**: Add/remove funds, withdraw deposits
- **Intent System**: Signal and fulfill payment intents
- **Payment Methods**: Support for Wise, Venmo, Revolut, CashApp, PayPal, Zelle, Monzo, MercadoPago
- **Multi-Currency**: Manage conversion rates across multiple fiat currencies
- **React Hooks**: Full suite of React hooks for seamless integration
- **Indexer Integration**: Query deposits, intents, and liquidity data

## Installation

```bash
npm install @zkp2p/offramp-sdk viem
# or
yarn add @zkp2p/offramp-sdk viem
# or
pnpm add @zkp2p/offramp-sdk viem
```

## Quick Start

### Initialize the Client

```typescript
import { OfframpClient } from '@zkp2p/offramp-sdk';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';

const walletClient = createWalletClient({
  chain: base,
  transport: custom(window.ethereum),
});

const client = new OfframpClient({
  walletClient,
  chainId: base.id,
  apiKey: 'YOUR_API_KEY', // Optional for API operations
});
```

## Core Operations

### Creating a Deposit

Provide liquidity by creating a deposit with your preferred payment methods and currencies:

```typescript
import { Currency } from '@zkp2p/offramp-sdk';

await client.createDeposit({
  token: '0xUSDC_ADDRESS',
  amount: 10000000000n, // 10,000 USDC (6 decimals)
  intentAmountRange: { min: 100000n, max: 1000000000n },
  processorNames: ['wise', 'revolut'],
  depositData: [
    { email: 'maker@example.com' }, // Wise payment details
    { tag: '@maker' },              // Revolut payment details
  ],
  conversionRates: [
    [{ currency: Currency.USD, conversionRate: '1.02' }],
    [{ currency: Currency.EUR, conversionRate: '0.95' }],
  ],
  onSuccess: ({ hash }) => console.log('Deposit created:', hash),
});
```

### Managing Deposit Settings

```typescript
// Toggle accepting intents
await client.setAcceptingIntents({ depositId: 1n, accepting: true });

// Update intent amount range
await client.setIntentRange({ depositId: 1n, min: 50000n, max: 5000000n });

// Set minimum conversion rate for a currency
await client.setCurrencyMinRate({
  depositId: 1n,
  paymentMethod: '0x...',
  fiatCurrency: '0x...',
  minConversionRate: 1020000n, // 1.02 rate
});
```

### Fund Management

```typescript
// Add more funds to your deposit
await client.addFunds({ depositId: 1n, amount: 5000000n });

// Remove funds from deposit
await client.removeFunds({ depositId: 1n, amount: 1000000n });

// Withdraw entire deposit
await client.withdrawDeposit({ depositId: 1n });
```

### Querying Deposits

```typescript
// Get all active deposits with payment methods
const deposits = await client.getDepositsWithRelations(
  { status: 'ACTIVE', acceptingIntents: true },
  { limit: 50 },
  { includeIntents: true }
);

// Get a specific deposit
const deposit = await client.getDepositById('1', { includeIntents: true });

// Get deposits by payee hash
const payeeDeposits = await client.getDepositsByPayeeHash('0x...');
```

### Intent Operations

```typescript
// Signal an intent to use a deposit
await client.signalIntent({
  depositId: 1n,
  amount: 1000000n,
  toAddress: '0xRecipient',
  processorName: 'wise',
  fiatCurrencyCode: 'USD',
  conversionRate: 1020000n,
  payeeDetails: '0xPayeeHash',
});

// Fulfill an intent
await client.fulfillIntent({
  intentHash: '0xIntentHash',
  proof: attestationProof,
});

// Release funds back to payer
await client.releaseFundsToPayer({ intentHash: '0x...' });

// Cancel an intent
await client.cancelIntent({ intentHash: '0x...' });
```

### Getting Quotes

```typescript
const quote = await client.getQuote({
  paymentPlatforms: ['wise', 'revolut'],
  fiatCurrency: 'USD',
  user: '0xUserAddress',
  recipient: '0xRecipientAddress',
  destinationChainId: 8453,
  destinationToken: '0xUSDC',
  amount: '100',
  // Optional: restrict to specific escrows
  escrowAddresses: ['0xEscrow1'],
});
```

## React Hooks

The SDK provides React hooks for all deposit and intent operations:

```tsx
import {
  useCreateDeposit,
  useAddFunds,
  useRemoveFunds,
  useWithdrawDeposit,
  useSetAcceptingIntents,
  useSetIntentRange,
  useSetCurrencyMinRate,
  useSignalIntent,
  useFulfillIntent,
  useReleaseFundsToPayer,
  usePruneExpiredIntents,
} from '@zkp2p/offramp-sdk/react';

function DepositManager({ client }) {
  const { createDeposit, isLoading } = useCreateDeposit({ client });
  const { addFunds } = useAddFunds({ client });
  const { setAcceptingIntents } = useSetAcceptingIntents({ client });

  return (
    <div>
      <button
        disabled={isLoading}
        onClick={() => createDeposit({ /* params */ })}
      >
        Create Deposit
      </button>
    </div>
  );
}
```

## Payment Methods

Supported payment platforms:

| Platform     | Key           | Currencies |
|-------------|---------------|------------|
| Wise        | `wise`        | USD, EUR, GBP, etc. |
| Venmo       | `venmo`       | USD |
| Revolut     | `revolut`     | USD, EUR, GBP, etc. |
| CashApp     | `cashapp`     | USD |
| PayPal      | `paypal`      | USD, EUR, etc. |
| Zelle       | `zelle`       | USD |
| Monzo       | `monzo`       | GBP |
| MercadoPago | `mercadopago` | BRL, ARS, MXN |

```typescript
import { getPaymentMethodsCatalog, PLATFORM_METADATA } from '@zkp2p/offramp-sdk';

// Get payment method hashes
const methods = getPaymentMethodsCatalog(8453, 'production');
const wiseHash = methods['wise'].paymentMethodHash;

// Get platform metadata
const wiseInfo = PLATFORM_METADATA['wise'];
console.log(wiseInfo.displayName); // "Wise"
```

## Currency Utilities

```typescript
import {
  Currency,
  currencyInfo,
  getCurrencyInfoFromHash,
  resolveFiatCurrencyBytes32
} from '@zkp2p/offramp-sdk';

// Use currency constants
const usd = Currency.USD;
const eur = Currency.EUR;

// Get currency info
const info = currencyInfo[Currency.USD];
console.log(info.currencySymbol); // "$"

// Convert to bytes32 for on-chain use
const usdBytes = resolveFiatCurrencyBytes32('USD');
```

## Contract Helpers

```typescript
import { getContracts, getPaymentMethodsCatalog } from '@zkp2p/offramp-sdk';

// Get contract addresses and ABIs
const { addresses, abis } = getContracts(8453, 'production');
console.log(addresses.Escrow);
console.log(addresses.Orchestrator);

// Get payment methods catalog
const catalog = getPaymentMethodsCatalog(8453, 'production');
```

## Supported Networks

| Network | Chain ID | Environment |
|---------|----------|-------------|
| Base Mainnet | 8453 | `production` |
| Base Sepolia | 84532 | `staging` |

## API Reference

### Client Methods

**Deposit Management:**
- `createDeposit(params)` - Create a new liquidity deposit
- `setAcceptingIntents(params)` - Toggle intent acceptance
- `setIntentRange(params)` - Set min/max intent amounts
- `setCurrencyMinRate(params)` - Set minimum conversion rate
- `addFunds(params)` - Add funds to deposit
- `removeFunds(params)` - Remove funds from deposit
- `withdrawDeposit(params)` - Withdraw entire deposit

**Intent Operations:**
- `signalIntent(params)` - Signal an intent
- `fulfillIntent(params)` - Fulfill with attestation
- `releaseFundsToPayer(params)` - Release funds
- `cancelIntent(params)` - Cancel an intent
- `pruneExpiredIntents(params)` - Clean up expired intents

**Queries:**
- `getDeposits(filter?, pagination?)` - Get deposits
- `getDepositsWithRelations(filter?, pagination?, options?)` - Get deposits with relations
- `getDepositById(id, options?)` - Get single deposit
- `getDepositsByPayeeHash(hash, options?)` - Get by payee
- `getIntentsForDeposits(ids, statuses?)` - Get intents
- `getOwnerIntents(owner, statuses?)` - Get owner's intents
- `getQuote(params)` - Get exchange quotes

## Error Handling

```typescript
import { ValidationError, NetworkError, ContractError } from '@zkp2p/offramp-sdk';

try {
  await client.createDeposit({ /* ... */ });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid parameters:', error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network issue:', error.message);
  } else if (error instanceof ContractError) {
    console.error('Contract error:', error.message);
  }
}
```

## Logging

```typescript
import { setLogLevel } from '@zkp2p/offramp-sdk';

// Set log level: 'debug' | 'info' | 'warn' | 'error' | 'none'
setLogLevel('debug');
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  CreateDepositParams,
  SignalIntentParams,
  FulfillIntentParams,
  IndexerDeposit,
  IndexerIntent,
  CurrencyType,
  PaymentPlatformType,
} from '@zkp2p/offramp-sdk';
```

## Contributing

```bash
cd packages/client-sdk
npm ci
npm run build
npm run test
npm run lint
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [NPM Package](https://www.npmjs.com/package/@zkp2p/offramp-sdk)
- [GitHub Repository](https://github.com/zkp2p/zkp2p-client-sdk)
- [Documentation](https://docs.zkp2p.xyz)

## Support

- GitHub Issues: [Create an issue](https://github.com/zkp2p/zkp2p-client-sdk/issues)
- Email: support@zkp2p.xyz
