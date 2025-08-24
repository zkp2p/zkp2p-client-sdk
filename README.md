# zkp2p-client-sdk

[![npm version](https://img.shields.io/npm/v/@zkp2p/client-sdk.svg)](https://www.npmjs.com/package/@zkp2p/client-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)

Browser-first TypeScript SDK for integrating ZKP2P into web applications. ZKP2P enables trustless peer-to-peer fiat-to-crypto exchanges using zero-knowledge proofs, allowing users to on-ramp from traditional payment platforms directly to cryptocurrency without intermediaries.

## Features

- **Multi-Platform Support**: Integrate with Wise, Venmo, Revolut, PayPal, and more
- **35+ Fiat Currencies**: Support for USD, EUR, GBP, and many other currencies
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Browser Extension Integration**: Seamless integration with the Peerauth browser extension for proof generation
- **Chain Agnostic**: Support for Base and other EVM-compatible chains
- **Proven Architecture**: Built on the battle-tested core from the React Native SDK

## Installation

```bash
npm install @zkp2p/client-sdk viem
```

## Quick Start

```typescript
import { Zkp2pClient } from '@zkp2p/client-sdk';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';

// Initialize the client
const walletClient = createWalletClient({
  chain: base,
  transport: custom(window.ethereum)
});

const client = new Zkp2pClient({
  walletClient,
  apiKey: 'YOUR_API_KEY',
  chainId: 8453, // Base mainnet
});

// Get quotes for fiat-to-crypto exchange
const quotes = await client.getQuote({
  paymentPlatforms: ['wise'],
  fiatCurrency: 'USD',
  user: '0xYourAddress',
  recipient: '0xRecipientAddress',
  destinationChainId: 8453,
  destinationToken: client.getUsdcAddress(),
  amount: '100',
});
```

## Documentation

- **Primary Package**: See [`packages/client-sdk/README.md`](packages/client-sdk/README.md) for comprehensive integration documentation
- **Examples**: Check the [`examples/`](examples/) directory for:
  - Vite React application walkthrough
  - Node.js script for fetching quotes
  - Browser E2E demo with extension integration
  - Orchestrator pattern implementation

## Supported Platforms and Currencies

### Payment Platforms
`wise`, `venmo`, `revolut`, `cashapp`, `mercadopago`, `zelle`, `paypal`, `monzo`

### Fiat Currencies
AED, ARS, AUD, CAD, CHF, CNY, CZK, DKK, EUR, GBP, HKD, HUF, IDR, ILS, INR, JPY, KES, MXN, MYR, NOK, NZD, PHP, PLN, RON, SAR, SEK, SGD, THB, TRY, UGX, USD, VND, ZAR

## Browser Extension Integration

The SDK includes a browser-only extension helper for Peerauth integration:

```typescript
import { PeerauthExtension } from '@zkp2p/client-sdk/extension';

const ext = new PeerauthExtension({
  onVersion: v => console.log('Extension version:', v)
});
```

**Note**: For SSR frameworks, import dynamically or guard usage with `typeof window !== 'undefined'`.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- [npm Package](https://www.npmjs.com/package/@zkp2p/client-sdk)
- [GitHub Repository](https://github.com/zkp2p/zkp2p-client-sdk)
- [ZKP2P Documentation](https://docs.zkp2p.xyz)

---

## Development

### Setup
```bash
npm install
npm run build
```

### Testing
```bash
npm test
```

### Maintainer Notes
- **CI/CD**: Automated typecheck, lint, build, and tests on PRs
- **Publishing**: Automatic npm publish on `v*` tags via GitHub Actions
- **Releases**: Use `npx release-it --ci` locally to bump version and generate changelog
