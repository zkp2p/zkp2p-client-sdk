/**
 * Signal Intent (V3 Orchestrator) Example
 *
 * Env:
 *   PRIVATE_KEY, RPC_URL, BASE_API_URL, API_KEY,
 *   ESCROW, DEPOSIT_ID, AMOUNT, TO,
 *   PROCESSOR_NAME (e.g., wise), PAYEE_DETAILS,
 *   FIAT_CURRENCY_CODE (e.g., USD), CONVERSION_RATE
 */
import { Zkp2pClient } from '@zkp2p/client-sdk';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

async function main() {
  const PRIV = process.env.PRIVATE_KEY as `0x${string}`;
  const RPC = process.env.RPC_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
  const BASE_API_URL = process.env.BASE_API_URL || 'https://api.zkp2p.xyz';
  const API_KEY = process.env.API_KEY || undefined;

  const ESCROW = process.env.ESCROW as `0x${string}`;
  const DEPOSIT_ID = BigInt(process.env.DEPOSIT_ID || '1');
  const AMOUNT = BigInt(process.env.AMOUNT || '1000000');
  const TO = process.env.TO as `0x${string}`;
  const PROCESSOR_NAME = process.env.PROCESSOR_NAME || 'wise';
  const PAYEE_DETAILS = process.env.PAYEE_DETAILS || '0x';
  const FIAT_CURRENCY_CODE = process.env.FIAT_CURRENCY_CODE || 'USD';
  const CONVERSION_RATE = BigInt(process.env.CONVERSION_RATE || '1000000');

  if (!PRIV) throw new Error('Set PRIVATE_KEY');
  if (!ESCROW || !TO) throw new Error('Missing ESCROW/TO');

  const account = privateKeyToAccount(PRIV);
  const walletClient = createWalletClient({ account, chain: base, transport: http(RPC) });
  const client = new Zkp2pClient({ walletClient, chainId: base.id, runtimeEnv: 'production', baseApiUrl: BASE_API_URL, apiKey: API_KEY });

  const hash = await client.signalIntentResolved({
    escrow: ESCROW,
    depositId: DEPOSIT_ID,
    amount: AMOUNT,
    to: TO,
    processorName: PROCESSOR_NAME,
    fiatCurrencyCode: FIAT_CURRENCY_CODE,
    conversionRate: CONVERSION_RATE,
    payeeDetails: PAYEE_DETAILS,
  });

  console.log('signalIntent tx hash:', hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
