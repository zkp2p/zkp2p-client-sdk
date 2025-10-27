/**
 * Example: Fulfill an intent via Orchestrator
 *
 * Env:
 *   PRIVATE_KEY, RPC_URL, INTENT_HASH,
 *   OPTIONAL: VERIFICATION_DATA, POST_INTENT_HOOK_DATA, USE_ORCHESTRATOR=true
 */
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { Zkp2pClient } from '../../src/client/Zkp2pClient';

async function main() {
  const PRIV = process.env.PRIVATE_KEY as `0x${string}`;
  const RPC = process.env.RPC_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
  const INTENT_HASH = process.env.INTENT_HASH as `0x${string}`;
  const ZK_TLS_PROOF = process.env.ZK_TLS_PROOF as string; // stringified JSON
  const PLATFORM = process.env.PLATFORM || 'wise';
  const ACTION_TYPE = process.env.ACTION_TYPE || 'payment';
  const AMOUNT = process.env.AMOUNT || '1000000';
  const TIMESTAMP_MS = process.env.TIMESTAMP_MS || `${Date.now()}`;
  const FIAT_CURRENCY = (process.env.FIAT_CURRENCY || '0x5553440000000000000000000000000000000000000000000000000000000000') as `0x${string}`;
  const CONVERSION_RATE = process.env.CONVERSION_RATE || '1000000';
  const PAYEE_DETAILS = (process.env.PAYEE_DETAILS || '0x') as `0x${string}`;
  const TIMESTAMP_BUFFER_MS = process.env.TIMESTAMP_BUFFER_MS || '600000';

  if (!PRIV) throw new Error('Set PRIVATE_KEY');
  if (!INTENT_HASH) throw new Error('Set INTENT_HASH');

  const account = privateKeyToAccount(PRIV);
  const walletClient = createWalletClient({ account, chain: base, transport: http(RPC) });
  const client = new Zkp2pClient({ walletClient, chainId: base.id, runtimeEnv: 'production' });

  if (!ZK_TLS_PROOF) throw new Error('Set ZK_TLS_PROOF (stringified JSON)');
  const hash = await client.fulfillIntentWithAttestation({
    intentHash: INTENT_HASH,
    zkTlsProof: ZK_TLS_PROOF,
    platform: PLATFORM,
    actionType: ACTION_TYPE,
    amount: AMOUNT,
    timestampMs: TIMESTAMP_MS,
    fiatCurrency: FIAT_CURRENCY,
    conversionRate: CONVERSION_RATE,
    payeeDetails: PAYEE_DETAILS,
    timestampBufferMs: TIMESTAMP_BUFFER_MS,
  });

  console.log('fulfillIntentWithAttestation tx hash:', hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
/* eslint-disable no-console */
