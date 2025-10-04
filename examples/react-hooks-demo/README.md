# ZKP2P React Hooks Demo (V3)

A demo showing how to use `@zkp2p/client-sdk` (V3) React hooks and Orchestrator flows.

## Features Demonstrated

- ✅ Hooks: `useSignalIntent`, `useCreateDeposit`, `useFulfillIntent`
- ✅ Unified authentication and proof generation via extension
- ✅ Enhanced callbacks (onProofGenerated, onProofError, onProgress, onPaymentsReceived)
- ✅ Platform and currency constants usage
- ✅ Real-time progress tracking
- ✅ Complete flow from quote to fulfillment

## Setup

1. Install dependencies:
```bash
cd packages/client-sdk
npm ci
```

2. Create `.env` file:
```bash
cp .env.example .env
# Edit .env and add your API key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173)

## Usage

1. **Initialize**: The app automatically initializes the ZKP2P client when MetaMask is connected
2. **Select Platform**: Choose from 8 supported payment platforms
3. **Select Currency**: Pick from 34 supported currencies
4. **Get Quote**: Fetch available quotes for your selected configuration
5. **Create Deposit**: Create a liquidity deposit on-chain
6. **Signal Intent**: Signal your trading intent
7. **Generate Proof**: Use the extension to authenticate and generate payment proofs
8. **Fulfill Intent**: Submit proofs to complete the transaction

## Environment Variables

- `VITE_ZKP2P_API_KEY` - Your ZKP2P API key (required)
- `VITE_ZKP2P_RPC_URL` - Custom RPC URL (optional)
- `VITE_WALLET_CONNECT_PROJECT_ID` - WalletConnect project ID (optional)

## Technologies Used

- React 18
- TypeScript
- Vite
- @zkp2p/client-sdk (V3)
- viem
- @tanstack/react-query

## License

MIT
