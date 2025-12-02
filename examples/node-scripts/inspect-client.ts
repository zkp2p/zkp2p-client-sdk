/**
 * Inspect Client Example
 * Quick sanity check for initialization values and endpoints
 */
import { OfframpClient } from '@zkp2p/offramp-sdk';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

async function main() {
  const privateKey = (process.env.PRIVATE_KEY || '0x') as `0x${string}`;
  const rpcUrl = process.env.RPC_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;

  const account = privateKey !== '0x' ? privateKeyToAccount(privateKey) : undefined;
  const walletClient = createWalletClient({ account, chain: base, transport: http(rpcUrl) });

  const client = new OfframpClient({ walletClient, chainId: base.id, runtimeEnv: 'production' });
  const deployed = client.getDeployedAddresses();
  console.log('Deployed addresses:', deployed);
  console.log('Indexer endpoint:', (client as any).indexer);
  console.log('API base url:', (client as any).baseApiUrl);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

