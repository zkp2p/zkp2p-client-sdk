/**
 * Example: Read views from ProtocolViewer (staging/sepolia)
 *
 * Env:
 *   RPC_URL
 *   DEPOSIT_ID (optional)
 *   OWNER (optional)
 *   INTENT_HASH (optional)
 */
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { Zkp2pClient } from '../../src/client/Zkp2pClient';

async function main() {
  const RPC = process.env.RPC_URL || `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
  const PRIV = (process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80') as `0x${string}`;
  const DEPOSIT_ID = process.env.DEPOSIT_ID;
  const OWNER = process.env.OWNER as `0x${string}` | undefined;
  const INTENT_HASH = process.env.INTENT_HASH as `0x${string}` | undefined;

  const account = privateKeyToAccount(PRIV);
  const walletClient = createWalletClient({ account, chain: base, transport: http(RPC) });
  // Use staging to ensure ProtocolViewer is available on Base
  const client = new Zkp2pClient({ walletClient, chainId: base.id, runtimeEnv: 'staging', rpcUrl: RPC });

  if (DEPOSIT_ID) {
    const view = await client.getPvDepositById(DEPOSIT_ID);
    console.log('PV deposit view:', view);
  }
  if (OWNER) {
    const deps = await client.getPvAccountDeposits(OWNER);
    console.log('PV account deposits:', deps.length);
  }
  if (INTENT_HASH) {
    const intent = await client.getPvIntent(INTENT_HASH);
    console.log('PV intent view:', intent);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
/* eslint-disable no-console */
