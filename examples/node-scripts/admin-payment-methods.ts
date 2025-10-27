/**
 * Admin: Payment Methods & Currencies (V3)
 *
 * Env:
 *   PRIVATE_KEY, RPC_URL, ESCROW, DEPOSIT_ID,
 *   PAYMENT_METHODS (comma-separated names), HASHED_ONCHAIN_IDS (comma-separated),
 *   CURRENCIES_JSON (e.g., [{"code":"USD","minConversionRate":"1000000"}])
 */
import { Zkp2pClient, resolvePaymentMethodHashFromCatalog, getPaymentMethodsCatalog, resolveFiatCurrencyBytes32, getGatingServiceAddress } from '@zkp2p/client-sdk';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

async function main() {
  const PRIV = process.env.PRIVATE_KEY as `0x${string}`;
  const RPC = process.env.RPC_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
  const ESCROW = process.env.ESCROW as `0x${string}` | undefined;
  const DEPOSIT_ID = BigInt(process.env.DEPOSIT_ID || '1');
  const METHODS = (process.env.PAYMENT_METHODS || '').split(',').filter(Boolean);
  const HASHES = (process.env.HASHED_ONCHAIN_IDS || '').split(',').filter(Boolean);
  const CURRENCIES_JSON = process.env.CURRENCIES_JSON || '[{"code":"USD","minConversionRate":"1000000"}]';

  if (!PRIV) throw new Error('Set PRIVATE_KEY');

  const account = privateKeyToAccount(PRIV);
  const walletClient = createWalletClient({ account, chain: base, transport: http(RPC) });
  const client = new Zkp2pClient({ walletClient, chainId: base.id, runtimeEnv: 'production' });

  // If methods provided, add them
  if (METHODS.length && HASHES.length && METHODS.length === HASHES.length) {
    const catalog = getPaymentMethodsCatalog(base.id, 'production');
    const methodHashes = METHODS.map((m) => resolvePaymentMethodHashFromCatalog(m, catalog));
    const gating = getGatingServiceAddress(base.id, 'production');
    const paymentMethodData = HASHES.map((h) => ({ intentGatingService: gating, payeeDetails: h, data: '0x' as `0x${string}` }));
    const tx1 = await client.addPaymentMethods({ depositId: DEPOSIT_ID, paymentMethods: methodHashes, paymentMethodData });
    console.log('addPaymentMethods tx:', tx1);
  }

  // Add currencies for the first payment method (if provided)
  if (METHODS[0]) {
    const catalog = getPaymentMethodsCatalog(base.id, 'production');
    const method = resolvePaymentMethodHashFromCatalog(METHODS[0], catalog);
    const list: Array<{ code: string; minConversionRate: string }> = JSON.parse(CURRENCIES_JSON);
    const currencies = list.map((c) => ({ code: resolveFiatCurrencyBytes32(c.code), minConversionRate: BigInt(c.minConversionRate) }));
    const tx2 = await client.addCurrencies({ depositId: DEPOSIT_ID, paymentMethod: method, currencies });
    console.log('addCurrencies tx:', tx2);
  }

  // Example: deactivate a currency
  const exampleCode = resolveFiatCurrencyBytes32('USD');
  const catalog = getPaymentMethodsCatalog(base.id, 'production');
  const method = METHODS[0] ? resolvePaymentMethodHashFromCatalog(METHODS[0], catalog) : undefined;
  if (method) {
    const tx3 = await client.deactivateCurrency({ depositId: DEPOSIT_ID, paymentMethod: method, currencyCode: exampleCode });
    console.log('deactivateCurrency tx:', tx3);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
/* eslint-disable no-console */
