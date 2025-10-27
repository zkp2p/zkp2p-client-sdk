/**
 * Example: Create a v3 deposit (struct-based)
 *
 * Usage:
 *   export PRIVATE_KEY=0x...
 *   export RPC_URL=https://base-mainnet.g.alchemy.com/v2/KEY
 *   ts-node create-deposit-v3.ts
 */
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { Zkp2pClient } from '../../src/client/Zkp2pClient';

async function main() {
  const PRIV = process.env.PRIVATE_KEY as `0x${string}`;
  const RPC = process.env.RPC_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
  const TOKEN = (process.env.TOKEN || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as `0x${string}`; // USDC
  const PROCESSOR_NAMES = (process.env.PROCESSOR_NAMES || 'wise').split(',').filter(Boolean);
  const DEPOSIT_DATA = JSON.parse(process.env.DEPOSIT_DATA || '[{"revolutUsername":"alice"}]');
  const MIN = BigInt(process.env.RANGE_MIN || '100000');
  const AMOUNT = BigInt(process.env.AMOUNT || '1000000');
  const CONVERSION_RATES = JSON.parse(process.env.CONVERSION_RATES || '[[{"currency":"USD","conversionRate":"1000000"}]]');

  if (!PRIV) throw new Error('Set PRIVATE_KEY');

  const account = privateKeyToAccount(PRIV);
  const walletClient = createWalletClient({ account, chain: base, transport: http(RPC) });

  const client = new Zkp2pClient({ walletClient, chainId: base.id, runtimeEnv: 'production' });

  const result = await client.createDeposit({
    token: TOKEN,
    amount: AMOUNT,
    intentAmountRange: { min: MIN, max: AMOUNT },
    processorNames: PROCESSOR_NAMES,
    depositData: DEPOSIT_DATA,
    conversionRates: CONVERSION_RATES,
  });
  console.log('createDeposit tx hash:', result.hash);
  console.log('posted deposit details:', JSON.stringify(result.depositDetails));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
/* eslint-disable no-console */
