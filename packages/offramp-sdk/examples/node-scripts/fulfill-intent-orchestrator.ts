/**
 * Example: Fulfill an intent via Orchestrator
 *
 * Env:
 *   PRIVATE_KEY, RPC_URL, INTENT_HASH, ZK_TLS_PROOF, PLATFORM, ACTION_TYPE
 *   OPTIONAL: TIMESTAMP_BUFFER_MS, POST_INTENT_HOOK_DATA
 */
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { Zkp2pClient } from '../../src/client/Zkp2pClient';

async function main() {
  const PRIV = process.env.PRIVATE_KEY as `0x${string}`;
  const RPC = process.env.RPC_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
  const INTENT_HASH = process.env.INTENT_HASH as `0x${string}`;
  const ZK_TLS_PROOF = process.env.ZK_TLS_PROOF as string; // stringified JSON or object JSON
  const TIMESTAMP_BUFFER_MS = process.env.TIMESTAMP_BUFFER_MS || '300000';
  const PLATFORM = process.env.PLATFORM as string;
  const ACTION_TYPE = process.env.ACTION_TYPE as string;

  if (!PRIV) throw new Error('Set PRIVATE_KEY');
  if (!INTENT_HASH) throw new Error('Set INTENT_HASH');
  if (!PLATFORM) throw new Error('Set PLATFORM');
  if (!ACTION_TYPE) throw new Error('Set ACTION_TYPE');

  const account = privateKeyToAccount(PRIV);
  const walletClient = createWalletClient({ account, chain: base, transport: http(RPC) });
  const client = new Zkp2pClient({ walletClient, chainId: base.id, runtimeEnv: 'production' });

  if (!ZK_TLS_PROOF) throw new Error('Set ZK_TLS_PROOF (stringified JSON)');
  const hash = await client.fulfillIntent({
    intentHash: INTENT_HASH,
    proof: ZK_TLS_PROOF,
    platform: PLATFORM,
    actionType: ACTION_TYPE,
    timestampBufferMs: TIMESTAMP_BUFFER_MS,
  });

  console.log('fulfillIntent tx hash:', hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
/* eslint-disable no-console */
