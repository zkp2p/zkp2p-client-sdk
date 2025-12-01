# @zkp2p/offramp-sdk

[![npm version](https://img.shields.io/npm/v/@zkp2p/offramp-sdk.svg)](https://www.npmjs.com/package/@zkp2p/offramp-sdk)
[![GitHub Release](https://img.shields.io/github/v/release/zkp2p/zkp2p-client-sdk?display_name=tag)](https://github.com/zkp2p/zkp2p-client-sdk/releases)
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
  apiKey: 'YOUR_API_KEY',
});

// Create a deposit to provide liquidity
await client.createDeposit({
  token: '0xUSDC',
  amount: 10000000000n,
  intentAmountRange: { min: 100000n, max: 1000000000n },
  processorNames: ['wise', 'revolut'],
  depositData: [{ email: 'maker@example.com' }, { tag: '@maker' }],
  conversionRates: [[{ currency: 'USD', conversionRate: '1.02' }]],
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

## Documentation

See [`packages/client-sdk/README.md`](packages/client-sdk/README.md) for comprehensive documentation including:

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

## Fiat Currencies

AED, ARS, AUD, CAD, CHF, CNY, CZK, DKK, EUR, GBP, HKD, HUF, IDR, ILS, INR, JPY, KES, MXN, MYR, NOK, NZD, PHP, PLN, RON, SAR, SEK, SGD, THB, TRY, UGX, USD, VND, ZAR

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [npm Package](https://www.npmjs.com/package/@zkp2p/offramp-sdk)
- [GitHub Repository](https://github.com/zkp2p/zkp2p-client-sdk)
- [Documentation](https://docs.zkp2p.xyz)

## Releases

- Latest releases: https://github.com/zkp2p/zkp2p-client-sdk/releases
- Changelog: ./CHANGELOG.md

---

## Development

```bash
cd packages/client-sdk
npm ci
npm run build
npm run test
npm run lint
```

### Maintainer Notes
- **CI/CD**: Automated typecheck, lint, build, and tests on PRs
- **Publishing**: Automatic npm publish on `v*` tags via GitHub Actions
