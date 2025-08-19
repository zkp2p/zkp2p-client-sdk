import { Zkp2pClient } from '@zkp2p/client-sdk';
import { createWalletClient, http } from 'viem';
import { base } from 'viem/chains';

async function main() {
  const apiKey = process.env.ZKP2P_API_KEY || '';
  if (!apiKey) throw new Error('Set ZKP2P_API_KEY');

  // Minimal wallet client (no txs sent in this example)
  const walletClient = createWalletClient({ chain: base, transport: http() });
  const client = new Zkp2pClient({ walletClient, apiKey, chainId: base.id });

  const quote = await client.getQuote({
    paymentPlatforms: ['wise'],
    fiatCurrency: 'USD',
    user: '0x0000000000000000000000000000000000000001',
    recipient: '0x0000000000000000000000000000000000000002',
    destinationChainId: base.id,
    destinationToken: client.getUsdcAddress(),
    amount: '25',
  });

  console.log(JSON.stringify(quote, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

