# Node scripts

Minimal Node examples that interact with the SDK without sending on-chain transactions.

Setup
```
npm i @zkp2p/client-sdk viem
```

Run
```
node --loader ts-node/esm get-quote.ts
```

Note: The script passes a basic `WalletClient` from `viem`. No transaction is sent; it is only required by the SDK constructor.

