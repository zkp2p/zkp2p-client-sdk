/**
 * Create Deposit (V3) Example
 *
 * Env:
 *   PRIVATE_KEY, RPC_URL,
 *   TOKEN (defaults to Base USDC), AMOUNT, RANGE_MIN,
 *   PROCESSOR_NAMES (comma-separated), HASHED_ONCHAIN_IDS (comma-separated),
 *   CONVERSION_RATES (JSON nested array per processor)
 */
import { Zkp2pClient } from '@zkp2p/client-sdk';
import { createWalletClient, http, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

async function main() {
  const PRIV = process.env.PRIVATE_KEY as `0x${string}`;
  const RPC = process.env.RPC_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
  const TOKEN = (process.env.TOKEN || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as `0x${string}`;
  const AMOUNT_DEC = process.env.AMOUNT || '10';
  const RANGE_MIN_DEC = process.env.RANGE_MIN || '5';
  const PROCESSOR_NAMES = (process.env.PROCESSOR_NAMES || 'wise').split(',').filter(Boolean);
  const HASHED_ONCHAIN_IDS = (process.env.HASHED_ONCHAIN_IDS || '0x').split(',').filter(Boolean);
  const CONVERSION_RATES = JSON.parse(process.env.CONVERSION_RATES || '[[{"currency":"USD","conversionRate":"1000000"}]]');

  if (!PRIV) throw new Error('Set PRIVATE_KEY');

  const account = privateKeyToAccount(PRIV);
  const walletClient = createWalletClient({ account, chain: base, transport: http(RPC) });
  const client = new Zkp2pClient({ walletClient, chainId: base.id, runtimeEnv: 'production' });

  const amount = parseUnits(AMOUNT_DEC, 6);
  const min = parseUnits(RANGE_MIN_DEC, 6);

  const hash = await client.createDepositResolved({
    token: TOKEN,
    amount,
    intentAmountRange: { min, max: amount * 2n },
    processorNames: PROCESSOR_NAMES,
    hashedOnchainIds: HASHED_ONCHAIN_IDS,
    conversionRates: CONVERSION_RATES,
  });

  console.log('createDeposit tx hash:', hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
