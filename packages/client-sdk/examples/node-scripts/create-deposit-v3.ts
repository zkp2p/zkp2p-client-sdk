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
  const PAYMENT_METHODS = (process.env.PAYMENT_METHODS || '').split(',').filter(Boolean) as `0x${string}`[]; // bytes32 list
  const GATING_SERVICE = (process.env.GATING_SERVICE || '0x0000000000000000000000000000000000000000') as `0x${string}`;
  const PAYEE_HASH = (process.env.PAYEE_DETAILS || '0x') as `0x${string}`;
  const MIN = BigInt(process.env.RANGE_MIN || '100000');
  const AMOUNT = BigInt(process.env.AMOUNT || '1000000');
  const CURRENCIES = JSON.parse(process.env.CURRENCIES || '[[{"code":"0x5553440000000000000000000000000000000000000000000000000000000000","minConversionRate":"1000000"}]]');

  if (!PRIV) throw new Error('Set PRIVATE_KEY');

  const account = privateKeyToAccount(PRIV);
  const walletClient = createWalletClient({ account, chain: base, transport: http(RPC) });

  const client = new Zkp2pClient({ walletClient, chainId: base.id, runtimeEnv: 'production' });

  const paymentMethodData = PAYMENT_METHODS.map(() => ({
    intentGatingService: GATING_SERVICE,
    payeeDetails: PAYEE_HASH,
    data: '0x',
  }));

  const currencies = (CURRENCIES as Array<Array<{ code: `0x${string}`; minConversionRate: string }>>).map(list =>
    list.map(item => ({ code: item.code, minConversionRate: BigInt(item.minConversionRate) }))
  );

  const hash = await client.createDeposit({
    token: TOKEN,
    amount: AMOUNT,
    intentAmountRange: { min: MIN, max: AMOUNT },
    paymentMethods: PAYMENT_METHODS,
    paymentMethodData,
    currencies,
  });

  console.log('createDeposit tx hash:', hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
/* eslint-disable no-console */

