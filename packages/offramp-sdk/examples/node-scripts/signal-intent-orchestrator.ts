/**
 * Example: Signal an intent via Orchestrator (auto-verification)
 *
 * Env:
 *   PRIVATE_KEY, RPC_URL, BASE_API_URL, API_KEY,
 *   DEPOSIT_ID, AMOUNT, TO, CONVERSION_RATE,
 *   PROCESSOR_NAME, PAYEE_DETAILS, FIAT_CURRENCY_CODE (e.g., USD)
 */
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { Zkp2pClient } from '../../src/client/Zkp2pClient';

async function main() {
  const PRIV = process.env.PRIVATE_KEY as `0x${string}`;
  const RPC = process.env.RPC_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
  const BASE_API_URL = process.env.BASE_API_URL || 'https://api.zkp2p.xyz';
  const API_KEY = process.env.API_KEY || undefined;

  const DEPOSIT_ID = BigInt(process.env.DEPOSIT_ID || '1');
  const AMOUNT = BigInt(process.env.AMOUNT || '1000000');
  const TO = process.env.TO as `0x${string}`;
  const FIAT_CURRENCY_CODE = process.env.FIAT_CURRENCY_CODE || 'USD'; // plain code (e.g., 'USD')
  const CONVERSION_RATE = BigInt(process.env.CONVERSION_RATE || '1000000');
  const PROCESSOR_NAME = process.env.PROCESSOR_NAME || 'wise';
  const PAYEE_DETAILS = process.env.PAYEE_DETAILS || '0x';
  const RUNTIME_ENV = (process.env.RUNTIME_ENV === 'staging' ? 'staging' : 'production') as 'production' | 'staging';

  if (!PRIV) throw new Error('Set PRIVATE_KEY');
  if (!TO) throw new Error('Missing TO');

  const account = privateKeyToAccount(PRIV);
  const walletClient = createWalletClient({ account, chain: base, transport: http(RPC) });
  const client = new Zkp2pClient({ walletClient, chainId: base.id, runtimeEnv: RUNTIME_ENV, baseApiUrl: BASE_API_URL, apiKey: API_KEY });

  const hash = await client.signalIntent({
    depositId: DEPOSIT_ID,
    amount: AMOUNT,
    toAddress: TO,
    processorName: PROCESSOR_NAME,
    fiatCurrencyCode: FIAT_CURRENCY_CODE,
    conversionRate: CONVERSION_RATE,
    payeeDetails: PAYEE_DETAILS,
    // Example: attribute to bot + merchant and always include Base builder code automatically
    txOverrides: { referrer: ['zkp2p-bot', 'merchant-id'] },
  });

  console.log('signalIntent tx hash:', hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
/* eslint-disable no-console */
