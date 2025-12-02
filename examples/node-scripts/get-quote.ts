/**
 * Get Quote (V3) Example
 */
import { OfframpClient, PLATFORM_METADATA, PAYMENT_PLATFORMS, type PaymentPlatformType, type CurrencyType, Currency, type QuoteRequest } from '@zkp2p/offramp-sdk';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

async function main() {
  const apiKey = process.env.ZKP2P_API_KEY || '';
  const privateKey = (process.env.PRIVATE_KEY || '0x') as `0x${string}`;
  const rpcUrl = process.env.RPC_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
  if (!apiKey) throw new Error('Set ZKP2P_API_KEY');

  console.log('ZKP2P Client SDK - Get Quote (V3)');

  // Show platforms
  console.log('Platforms:');
  PAYMENT_PLATFORMS.forEach((p) => {
    const meta = PLATFORM_METADATA[p];
    console.log(`  - ${meta.displayName}`);
  });

  // Wallet client
  const account = privateKey !== '0x' ? privateKeyToAccount(privateKey) : undefined;
  const walletClient = createWalletClient({ account, chain: base, transport: http(rpcUrl) });

  const client = new OfframpClient({ walletClient, chainId: base.id, runtimeEnv: 'production', baseApiUrl: 'https://api.zkp2p.xyz', apiKey });

  const platforms: PaymentPlatformType[] = ['wise', 'revolut', 'venmo'];
  const selectedCurrency: CurrencyType = Currency.USD;
  const amount = '100';

  const req: QuoteRequest = {
    paymentPlatforms: platforms,
    fiatCurrency: selectedCurrency,
    user: walletClient.account?.address || '0x0000000000000000000000000000000000000001',
    recipient: walletClient.account?.address || '0x0000000000000000000000000000000000000002',
    destinationChainId: base.id,
    destinationToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    amount,
  };

  const quote = await client.getQuote(req);

  console.log(`Found ${quote.responseObject.quotes.length} quotes`);
  quote.responseObject.quotes.forEach((q, i) => {
    const meta = PLATFORM_METADATA[q.paymentMethod as PaymentPlatformType];
    console.log(`Quote #${i + 1}: ${meta?.displayName || q.paymentMethod}`);
    console.log(`  Fiat: ${q.fiatAmountFormatted}, Token: ${q.tokenAmountFormatted}`);
    if (q.payeeData) console.log('  Payee Data:', q.payeeData);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
