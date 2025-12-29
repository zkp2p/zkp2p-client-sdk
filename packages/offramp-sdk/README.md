# @zkp2p/offramp-sdk

[![npm version](https://img.shields.io/npm/v/@zkp2p/offramp-sdk.svg)](https://www.npmjs.com/package/@zkp2p/offramp-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)

**Offramp SDK by Peer** - TypeScript SDK for **liquidity providers** who want to offer fiat off-ramp services on Base.

## Who Is This For?

This SDK is designed for **liquidity providers (peers)** who want to:
- Create and manage USDC deposits that accept fiat payments
- Configure payment methods, currencies, and conversion rates
- Monitor deposit utilization and manage liquidity
- Earn fees by providing off-ramp services

## RPC-First Architecture

This SDK uses **RPC-first queries** via ProtocolViewer for instant, real-time on-chain data:

- **No indexer lag**: Queries go directly to the blockchain
- **Always fresh**: See deposit/intent state immediately after transactions
- **Instant feedback**: Perfect for interactive UIs

Advanced historical queries (pagination, filtering, fulfillment records) are available via `client.indexer.*`.

## Core Features (Deposit Management)

| Feature | Description |
|---------|-------------|
| **Create Deposits** | Lock USDC and define accepted payment methods |
| **Configure Rates** | Set conversion rates per currency and payment platform |
| **Manage Funds** | Add/remove funds, withdraw deposits |
| **Payment Methods** | Wise, Venmo, Revolut, CashApp, PayPal, Zelle, Monzo, MercadoPago |
| **Multi-Currency** | Support USD, EUR, GBP, and 25+ fiat currencies |
| **Query Deposits** | Real-time on-chain queries via ProtocolViewer |
| **React Hooks** | Full suite of React hooks for frontend integration |

## Supporting Features

The SDK also includes supporting functionality for the broader ZKP2P ecosystem:

- **Intent Operations**: `signalIntent()`, `fulfillIntent()`, `cancelIntent()` (typically used by takers/buyers)
- **Quote API**: `getQuote()` (used by frontends to display available liquidity)
- **Indexer Queries**: Historical data, pagination, and advanced filtering via `client.indexer.*`

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
    [{ currency: Currency.USD, conversionRate: '1020000000000000000' }], // 1.02 (18 decimals)
    [{ currency: Currency.EUR, conversionRate: '950000000000000000' }],  // 0.95 (18 decimals)
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

### Querying Deposits (RPC-first)

```typescript
// Get all your deposits (instant on-chain query)
const deposits = await client.getDeposits();

// Get deposits for any address
const ownerDeposits = await client.getAccountDeposits('0xOwnerAddress');

// Get a specific deposit by ID
const deposit = await client.getDeposit(42n);
console.log(`Available liquidity: ${deposit.availableLiquidity}`);
console.log(`Payment methods: ${deposit.paymentMethods.length}`);

// Get multiple deposits by ID
const batch = await client.getDepositsById([1n, 2n, 3n]);
```

### Querying Intents (RPC-first)

```typescript
// Get all your intents
const intents = await client.getIntents();

// Get intents for any address
const ownerIntents = await client.getAccountIntents('0xOwnerAddress');

// Get a specific intent by hash
const intent = await client.getIntent('0xIntentHash...');
```

### Advanced Indexer Queries

For historical data, pagination, and advanced filtering:

```typescript
// Query with filters and pagination
const deposits = await client.indexer.getDeposits(
  { status: 'ACTIVE', minLiquidity: '1000000', depositor: '0xYourAddress' }, // Note: use 'depositor', not 'owner'
  { limit: 50, orderBy: 'remainingDeposits', orderDirection: 'desc' }
);

// Get deposits with related data
const depositsWithRelations = await client.indexer.getDepositsWithRelations(
  { status: 'ACTIVE' },
  { limit: 50 },
  { includeIntents: true, intentStatuses: ['SIGNALED'] }
);

// Historical fulfillment records
const fulfillments = await client.indexer.getFulfilledIntentEvents(['0x...']);

// Find deposits by payee
const payeeDeposits = await client.indexer.getDepositsByPayeeHash('0x...');
```

### Supporting: Intent Operations

> **Note**: These methods are typically used by takers/buyers, not liquidity providers.

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

// Fulfill an intent with a payment proof
await client.fulfillIntent({
  intentHash: '0xIntentHash',
  proof: attestationProof,
});

// Release funds back to deposit owner (liquidity providers may use this)
await client.releaseFundsToPayer({ intentHash: '0x...' });

// Cancel an intent
await client.cancelIntent({ intentHash: '0x...' });
```

### Supporting: Getting Quotes

> **Note**: Primarily used by frontend applications to display available liquidity.

```typescript
const quote = await client.getQuote({
  paymentPlatforms: ['wise', 'revolut'],
  fiatCurrency: 'USD',
  user: '0xUserAddress',
  recipient: '0xRecipientAddress',
  destinationChainId: 8453,
  destinationToken: '0xUSDC',
  amount: '100',
});
```

### Supporting: Taker Tier

> **Note**: Requires `authorizationToken` or `apiKey` on the client.

```typescript
const tier = await client.getTakerTier({
  owner: '0xUserAddress',
  chainId: 8453,
});

console.log(tier.responseObject.tier);
```

## React Hooks

The SDK provides React hooks for all deposit and intent operations via a dedicated subpath:

```tsx
import {
  useCreateDeposit,
  useAddFunds,
  useRemoveFunds,
  useWithdrawDeposit,
  useSetAcceptingIntents,
  useSetIntentRange,
  useSetCurrencyMinRate,
  useAddPaymentMethods,
  useRemovePaymentMethod,
  useAddCurrencies,
  useSignalIntent,
  useGetTakerTier,
  useFulfillIntent,
  useReleaseFundsToPayer,
  usePruneExpiredIntents,
  useSetDelegate,
  useRemoveDelegate,
} from '@zkp2p/offramp-sdk/react';

function DepositManager({ client }) {
  const { createDeposit, isLoading, error } = useCreateDeposit({ client });
  const { addFunds } = useAddFunds({ client });
  const { setAcceptingIntents } = useSetAcceptingIntents({ client });
  const { takerTier } = useGetTakerTier({ client, owner: '0xUserAddress', chainId: 8453 });

  const handleCreate = async () => {
    const result = await createDeposit({
      token: '0xUSDC_ADDRESS',
      amount: 10000000000n,
      intentAmountRange: { min: 100000n, max: 1000000000n },
      processorNames: ['wise'],
      depositData: [{ email: 'maker@example.com' }],
      conversionRates: [[{ currency: 'USD', conversionRate: '1020000000000000000' }]], // 1.02 (18 decimals)
    });
    console.log('Created deposit:', result.hash);
  };

  return (
    <div>
      <button disabled={isLoading} onClick={handleCreate}>
        {isLoading ? 'Creating...' : 'Create Deposit'}
      </button>
      {error && <p>Error: {error.message}</p>}
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
import { getPaymentMethodsCatalog, PLATFORM_METADATA, PAYMENT_PLATFORMS } from '@zkp2p/offramp-sdk';

// Available payment platforms
console.log(PAYMENT_PLATFORMS); // ['wise', 'venmo', 'revolut', 'cashapp', 'mercadopago', 'zelle', 'paypal', 'monzo']

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
console.log(addresses.escrow);       // Contract addresses use camelCase
console.log(addresses.orchestrator);

// Get payment methods catalog
const catalog = getPaymentMethodsCatalog(8453, 'production');
```

## Supported Networks

| Network | Chain ID | Environment |
|---------|----------|-------------|
| Base Mainnet | 8453 | `production` |
| Base Sepolia | 84532 | `staging` |

## API Reference

### Query Methods (RPC-first)

**Deposits (instant on-chain reads):**
- `getDeposits()` - Get connected wallet's deposits
- `getAccountDeposits(owner)` - Get deposits for any address
- `getDeposit(depositId)` - Get single deposit by ID
- `getDepositsById(ids)` - Batch fetch deposits

**Intents (instant on-chain reads):**
- `getIntents()` - Get connected wallet's intents
- `getAccountIntents(owner)` - Get intents for any address
- `getIntent(intentHash)` - Get single intent by hash

**Utilities:**
- `resolvePayeeHash(depositId, paymentMethodHash)` - Get payee details hash

**Token Allowance:**
- `ensureAllowance(params)` - Check/set ERC20 allowance for deposits

### Core Methods (Deposit Management)

**Creating & Managing Deposits:**
- `createDeposit(params)` - Create a new liquidity deposit
- `addFunds(params)` - Add funds to deposit
- `removeFunds(params)` - Remove funds from deposit
- `withdrawDeposit(params)` - Withdraw entire deposit

**Configuring Deposits:**
- `setAcceptingIntents(params)` - Toggle intent acceptance
- `setIntentRange(params)` - Set min/max intent amounts
- `setCurrencyMinRate(params)` - Set minimum conversion rate
- `setDelegate(params)` / `removeDelegate(params)` - Manage delegates
- `addPaymentMethods(params)` - Add payment platforms
- `setPaymentMethodActive(params)` - Enable/disable payment methods
- `addCurrencies(params)` / `deactivateCurrency(params)` - Manage currencies

### Indexer Methods (`client.indexer.*`)

For historical data, pagination, and advanced filtering:

- `indexer.getDeposits(filter?, pagination?)` - Query deposits with filters
- `indexer.getDepositsWithRelations(filter?, pagination?, options?)` - Include payment methods/intents
- `indexer.getDepositById(compositeId, options?)` - Get by composite ID
- `indexer.getDepositsByPayeeHash(hash, options?)` - Find by payee
- `indexer.getOwnerIntents(owner, statuses?)` - Get owner's intents
- `indexer.getExpiredIntents(params)` - Find expired intents
- `indexer.getFulfilledIntentEvents(intentHashes)` - Historical fulfillments
- `indexer.getFulfillmentAndPayment(intentHash)` - Verification records

### Supporting Methods

**Intent Operations** (typically used by takers, not liquidity providers):
- `signalIntent(params)` - Signal an intent to use a deposit
- `fulfillIntent(params)` - Fulfill with attestation proof
- `cancelIntent(params)` - Cancel an intent
- `releaseFundsToPayer(params)` - Release funds back to deposit
- `pruneExpiredIntents(params)` - Clean up expired intents

**Quote API** (used by frontends):
- `getQuote(params)` - Get available exchange quotes

## Token Allowance Management

Before creating deposits or adding funds, you may need to approve the escrow contract to spend your tokens:

```typescript
// Check and set allowance if needed
const result = await client.ensureAllowance({
  token: '0xUSDC_ADDRESS',
  amount: 10000000000n, // Amount to approve
  spender: addresses.escrow, // Optional: defaults to escrow contract
  maxApprove: false, // Optional: set to true for unlimited approval
});

if (result.hadAllowance) {
  console.log('Already had sufficient allowance');
} else {
  console.log('Approval transaction:', result.hash);
}
```

## Low-Level Method Parameters

For methods that interact directly with on-chain data, parameters use bytes32 hex strings:

```typescript
// addCurrencies - Add currencies to a payment method
await client.addCurrencies({
  depositId: 1n,
  paymentMethod: '0x...', // bytes32 payment method hash
  currencies: [
    { code: '0x...', minConversionRate: 1020000000000000000n }, // bytes32 currency code, 18 decimals
  ],
});

// deactivateCurrency - Remove a currency from a payment method
await client.deactivateCurrency({
  depositId: 1n,
  paymentMethod: '0x...', // bytes32 payment method hash
  currencyCode: '0x...',  // bytes32 currency code
});

// setPaymentMethodActive - Enable/disable a payment method
await client.setPaymentMethodActive({
  depositId: 1n,
  paymentMethod: '0x...', // bytes32 payment method hash (not paymentMethodHash)
  isActive: true,
});

// setCurrencyMinRate - Update minimum conversion rate
await client.setCurrencyMinRate({
  depositId: 1n,
  paymentMethod: '0x...', // bytes32 payment method hash
  fiatCurrency: '0x...',  // bytes32 currency code (not currencyCode)
  minConversionRate: 1020000000000000000n, // 18 decimals
});
```

## ERC-8021 Attribution (Base Builder Codes)

- Every on-chain transaction sent by the SDK now appends the ZKP2P Base builder code `bc_nbn6qkni`.
- Add referrer codes via `txOverrides.referrer` (string or string[]) to prepend custom attribution before the builder code.
- Multiple referrers are supported (e.g., `['zkp2p-bot', 'merchant-id']`).

```typescript
await client.signalIntent({
  depositId: 42n,
  amount: 100_000000n,
  toAddress: '0x...',
  processorName: 'wise',
  fiatCurrencyCode: 'USD',
  conversionRate: 1_020000000000000000n,
  payeeDetails: '0x...',
  txOverrides: { referrer: ['zkp2p-bot', 'merchant-id'] }, // calldata suffix: ['zkp2p-bot','merchant-id','bc_nbn6qkni']
});
```

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
cd packages/offramp-sdk
npm install
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
