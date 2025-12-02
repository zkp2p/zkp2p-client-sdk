# @zkp2p/offramp-sdk

[![npm version](https://img.shields.io/npm/v/@zkp2p/offramp-sdk.svg)](https://www.npmjs.com/package/@zkp2p/offramp-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)

**Offramp SDK by Peer** - TypeScript SDK for deposit management, liquidity provision, and fiat off-ramping on Base.

## Features

- **Deposit Management**: Create, configure, and manage liquidity deposits
- **Fund Operations**: Add/remove funds, withdraw deposits
- **Intent System**: Signal and fulfill payment intents
- **Multi-Platform Support**: Wise, Venmo, Revolut, CashApp, PayPal, Zelle, Monzo, MercadoPago
- **35+ Fiat Currencies**: USD, EUR, GBP, and many more
- **React Hooks**: Full suite of hooks for seamless integration
- **Type-Safe**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install @zkp2p/offramp-sdk viem
```

## Quick Start

```typescript
import { OfframpClient, Currency } from '@zkp2p/offramp-sdk';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';

const walletClient = createWalletClient({
  chain: base,
  transport: custom(window.ethereum),
});

const client = new OfframpClient({
  walletClient,
  chainId: base.id,
  apiKey: 'YOUR_API_KEY',
});

// Create a deposit to provide liquidity
await client.createDeposit({
  token: '0xUSDC',
  amount: 10000000000n,
  intentAmountRange: { min: 100000n, max: 1000000000n },
  processorNames: ['wise', 'revolut'],
  depositData: [{ email: 'maker@example.com' }, { tag: '@maker' }],
  conversionRates: [[{ currency: Currency.USD, conversionRate: '1.02' }]],
});

// Query deposits
const deposits = await client.getDepositsWithRelations(
  { status: 'ACTIVE', acceptingIntents: true },
  { limit: 50 }
);

// Get quotes
const quote = await client.getQuote({
  paymentPlatforms: ['wise'],
  fiatCurrency: 'USD',
  user: '0xYourAddress',
  recipient: '0xRecipientAddress',
  destinationChainId: base.id,
  destinationToken: '0xUSDC',
  amount: '100',
});
```

## React Hooks

```tsx
import {
  useCreateDeposit,
  useAddFunds,
  useSetAcceptingIntents,
  useFulfillIntent,
} from '@zkp2p/offramp-sdk/react';

function DepositManager({ client }) {
  const { createDeposit, isLoading } = useCreateDeposit({ client });

  return (
    <button disabled={isLoading} onClick={() => createDeposit({ /* params */ })}>
      Create Deposit
    </button>
  );
}
```

## Documentation

See [`packages/offramp-sdk/README.md`](packages/offramp-sdk/README.md) for comprehensive documentation including:

- Complete API reference
- React hooks usage
- Payment method configuration
- Currency utilities
- Error handling

## Supported Platforms

| Platform     | Key           |
|-------------|---------------|
| Wise        | `wise`        |
| Venmo       | `venmo`       |
| Revolut     | `revolut`     |
| CashApp     | `cashapp`     |
| PayPal      | `paypal`      |
| Zelle       | `zelle`       |
| Monzo       | `monzo`       |
| MercadoPago | `mercadopago` |

## Supported Networks

| Network | Chain ID |
|---------|----------|
| Base Mainnet | 8453 |
| Base Sepolia | 84532 |

## Development

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

- [npm Package](https://www.npmjs.com/package/@zkp2p/offramp-sdk)
- [GitHub Repository](https://github.com/zkp2p/zkp2p-client-sdk)
- [Documentation](https://docs.zkp2p.xyz)
