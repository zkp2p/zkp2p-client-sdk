/**
 * Example: Cancel an intent (orchestrator-first)
 *
 * Env:
 *   PRIVATE_KEY, RPC_URL, INTENT_HASH
 */
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { Zkp2pClient } from '../../src/client/Zkp2pClient';

async function main() {
  const PRIV = process.env.PRIVATE_KEY as `0x${string}`;
  const RPC = process.env.RPC_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
  const INTENT_HASH = process.env.INTENT_HASH as `0x${string}`;

  if (!PRIV) throw new Error('Set PRIVATE_KEY');
  if (!INTENT_HASH) throw new Error('Set INTENT_HASH');

  const account = privateKeyToAccount(PRIV);
  const walletClient = createWalletClient({ account, chain: base, transport: http(RPC) });
  const client = new Zkp2pClient({ walletClient, chainId: base.id, runtimeEnv: 'production' });

  const hash = await client.cancelIntent({ intentHash: INTENT_HASH });
  console.log('cancelIntent tx hash:', hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

