# Examples

This folder collects small examples that demonstrate typical SDK usage:

- React (Vite): minimal browser app using `Zkp2pClient` and the extension helper
- Node script: fetch quotes from the API via `Zkp2pClient`

Note: these are reference examples. Install peer deps (`viem`) and set your API key to run them.

## React (Vite) Quickstart

1) Create the app
```
npm create vite@latest zkp2p-demo -- --template react-ts
cd zkp2p-demo
npm i
```

2) Install SDK + peer dep
```
npm i @zkp2p/client-sdk viem
```

3) Add env vars in `.env`
```
VITE_ZKP2P_API_KEY=your_public_key
```

4) Use the SDK (src/App.tsx)
```tsx
import { useEffect, useMemo, useState } from 'react';
import { Zkp2pClient } from '@zkp2p/client-sdk';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';

function App() {
  const [quotes, setQuotes] = useState<any>(null);
  const walletClient = useMemo(() => createWalletClient({ chain: base, transport: custom((window as any).ethereum) }), []);
  const client = useMemo(() => new Zkp2pClient({ walletClient, apiKey: import.meta.env.VITE_ZKP2P_API_KEY, chainId: base.id }), [walletClient]);

  useEffect(() => {
    client.getQuote({
      paymentPlatforms: ['wise'],
      fiatCurrency: 'USD',
      user: '0x0000000000000000000000000000000000000001',
      recipient: '0x0000000000000000000000000000000000000002',
      destinationChainId: base.id,
      destinationToken: client.getUsdcAddress(),
      amount: '100',
    }).then(setQuotes).catch(console.error);
  }, [client]);

  return <pre>{JSON.stringify(quotes, null, 2)}</pre>;
}

export default App;
```

5) Run
```
npm run dev
```

## Node script: get quote

See `examples/node-scripts/get-quote.ts` for a minimal script to call `getQuote` without sending transactions.

