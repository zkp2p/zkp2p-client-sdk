# @zkp2p/client-sdk

[![npm version](https://img.shields.io/npm/v/@zkp2p/client-sdk.svg)](https://www.npmjs.com/package/@zkp2p/client-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)

Browser-first TypeScript SDK for integrating ZKP2P into web applications. Built with React hooks, unified authentication, and comprehensive type safety.

## 🚀 Features

- ⚡ **Unified Authentication**: Single method for authentication and proof generation
- ⚛️ **React Hooks**: Complete set of hooks for seamless React integration
- 🔄 **Enhanced Callbacks**: Granular progress tracking and error handling
- 📦 **Comprehensive Constants**: All platforms, currencies, and chain data exported
- 🔒 **TypeScript First**: Full type safety and IntelliSense support
- 🌐 **Multi-Chain Support**: Base, Base Sepolia, Scroll, and Hardhat networks
- 🧩 **Extension Integration**: Built-in support for peerauth browser extension

## 📦 Installation

```bash
npm install @zkp2p/client-sdk viem
# or
yarn add @zkp2p/client-sdk viem
# or
pnpm add @zkp2p/client-sdk viem
```

## 🎯 Quick Start

### Basic Client Setup

```typescript
import { Zkp2pClient, SUPPORTED_CHAIN_IDS } from '@zkp2p/client-sdk';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';

// Create viem wallet client
const walletClient = createWalletClient({
  chain: base,
  transport: custom(window.ethereum),
});

// Initialize ZKP2P client
const client = new Zkp2pClient({
  walletClient,
  apiKey: 'YOUR_API_KEY',
  chainId: SUPPORTED_CHAIN_IDS.BASE_MAINNET, // 8453
});
```

### Fetching Quotes

```typescript
import { Currency, PAYMENT_PLATFORMS } from '@zkp2p/client-sdk';

// Get quotes for multiple platforms
const quotes = await client.getQuote({
  paymentPlatforms: ['wise', 'revolut', 'venmo'],
  fiatCurrency: Currency.USD,
  user: '0xYourAddress',
  recipient: '0xRecipientAddress',
  destinationChainId: SUPPORTED_CHAIN_IDS.BASE_MAINNET,
  destinationToken: client.getUsdcAddress(),
  amount: '100', // $100 USD
});

console.log('Available quotes:', quotes);
```

## ⚛️ React Integration

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

### Individual Hook Examples

#### `useCreateDeposit` - Create Liquidity Deposits

```tsx
import { useCreateDeposit, Currency, type CreateDepositConversionRate } from '@zkp2p/client-sdk';

function DepositCreator() {
  const { client } = useZkp2pClient({ /* ... */ });
  
  const { 
    createDeposit, 
    txHash, 
    depositDetails,
    isLoading, 
    error 
  } = useCreateDeposit({
    client,
    onSuccess: ({ hash, depositDetails }) => {
      console.log('Deposit created:', hash);
      console.log('Deposit details:', depositDetails);
    },
  });

  const handleCreateDeposit = async () => {
    const conversionRates: CreateDepositConversionRate[][] = [[
      { currency: Currency.USD, conversionRate: '1000000' }, // 1:1 USD
    ]];

    await createDeposit({
      token: client!.getUsdcAddress(),
      amount: BigInt('1000000'), // 1 USDC
      intentAmountRange: {
        min: BigInt('500000'),  // 0.5 USDC minimum
        max: BigInt('2000000'), // 2 USDC maximum
      },
      conversionRates,
      processorNames: ['venmo'],
      depositData: [{
        venmoUsername: 'alice123',
      }],
    });
  };

  return (
    <button onClick={handleCreateDeposit} disabled={isLoading}>
      {isLoading ? 'Creating Deposit...' : 'Create Deposit'}
    </button>
  );
}
```

#### `useSignalIntent` - Signal Trading Intent

```tsx
import { useSignalIntent, Currency } from '@zkp2p/client-sdk';

function IntentSignaler() {
  const { client } = useZkp2pClient({ /* ... */ });
  
  const { 
    signalIntent, 
    response, 
    isLoading 
  } = useSignalIntent({
    client,
    onSuccess: (response) => {
      console.log('Intent hash:', response.intentHash);
      console.log('Timestamp:', response.timestamp);
    },
  });

  const handleSignalIntent = async () => {
    await signalIntent({
      processorName: 'wise',
      depositId: '123',
      tokenAmount: '1000000', // 1 USDC
      payeeDetails: JSON.stringify({
        email: 'alice@example.com',
        accountNumber: '12345678',
      }),
      toAddress: '0xRecipientAddress',
      currency: Currency.USD,
    });
  };

  return (
    <button onClick={handleSignalIntent} disabled={isLoading}>
      {isLoading ? 'Signaling...' : 'Signal Intent'}
    </button>
  );
}
```

## 🔧 Extension Integration

### Unified Authentication Flow (Recommended)

```typescript
import { ExtensionOrchestrator, PLATFORM_METADATA } from '@zkp2p/client-sdk';

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
} from '@zkp2p/client-sdk';

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

## 📊 Working with Constants

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

## 🔍 Advanced Usage

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
  parseExtensionProof,
  type ReclaimProof
} from '@zkp2p/client-sdk';

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

## 🌐 Environment Configuration

### Vite

```bash
# .env
VITE_ZKP2P_API_KEY=your_api_key_here
VITE_ZKP2P_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_key
VITE_ZKP2P_BASE_API_URL=https://api.zkp2p.xyz/v1
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
  apiKey: process.env.NEXT_PUBLIC_ZKP2P_API_KEY!,
  chainId: 8453,
  rpcUrl: process.env.NEXT_PUBLIC_ZKP2P_RPC_URL,
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

## 📚 Complete API Reference

### Client Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getQuote(request)` | Get quotes from liquidity providers | `QuoteResponse` |
| `createDeposit(params)` | Create a new liquidity deposit | `{ hash, depositDetails }` |
| `signalIntent(params)` | Signal intent to trade | `SignalIntentResponse & { txHash? }` |
| `fulfillIntent(params)` | Fulfill intent with payment proof | `Hash` |
| `withdrawDeposit(params)` | Withdraw a deposit | `Hash` |
| `cancelIntent(params)` | Cancel a pending intent | `Hash` |
| `releaseFundsToPayer(params)` | Release escrowed funds | `Hash` |
| `validatePayeeDetails(params)` | Validate payee information | `ValidatePayeeDetailsResponse` |
| `getAccountDeposits(address)` | Get account's deposits | `EscrowDepositView[]` |
| `getAccountIntent(address)` | Get account's current intent | `EscrowIntentView` |

### React Hooks

| Hook | Purpose | Key Returns |
|------|---------|-------------|
| `useZkp2pClient` | Initialize client | `{ client, isInitialized, error }` |
| `useQuote` | Manage quotes | `{ fetchQuote, quote, isLoading, error }` |
| `useSignalIntent` | Signal intents | `{ signalIntent, response, isLoading }` |
| `useCreateDeposit` | Create deposits | `{ createDeposit, txHash, depositDetails }` |
| `useFulfillIntent` | Fulfill intents | `{ fulfillIntent, txHash, isLoading }` |
| `useExtensionOrchestrator` | Extension integration | `{ authenticate, payments, proofs }` |

## 🧪 Testing

```typescript
// Example test setup
import { Zkp2pClient } from '@zkp2p/client-sdk';
import { createWalletClient, http } from 'viem';
import { hardhat } from 'viem/chains';

const testClient = new Zkp2pClient({
  walletClient: createWalletClient({
    chain: hardhat,
    transport: http(),
  }),
  apiKey: 'TEST_KEY',
  chainId: 31337, // Hardhat
});
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/@zkp2p/client-sdk)
- [GitHub Repository](https://github.com/zkp2p/zkp2p-client-sdk)
- [Documentation](https://docs.zkp2p.xyz)
- [Discord Community](https://discord.gg/zkp2p)

## 💬 Support

- GitHub Issues: [Create an issue](https://github.com/zkp2p/zkp2p-client-sdk/issues)
- Discord: [Join our community](https://discord.gg/zkp2p)
- Email: support@zkp2p.xyz

---

Built with ❤️ by the ZKP2P team