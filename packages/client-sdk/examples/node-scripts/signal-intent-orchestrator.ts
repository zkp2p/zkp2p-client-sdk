/**
 * Example: Signal an intent via Orchestrator (auto-verification)
 *
 * Env:
 *   PRIVATE_KEY, RPC_URL, BASE_API_URL, API_KEY,
 *   ESCROW, DEPOSIT_ID, AMOUNT, TO, PAYMENT_METHOD, FIAT_CURRENCY, CONVERSION_RATE,
 *   PROCESSOR_NAME, PAYEE_DETAILS
 */
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { Zkp2pClient } from '../../src/client/Zkp2pClient';
import { resolvePaymentMethodHash, resolveFiatCurrencyBytes32, ensureBytes32 } from '../../src';

async function main() {
  const PRIV = process.env.PRIVATE_KEY as `0x${string}`;
  const RPC = process.env.RPC_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
  const BASE_API_URL = process.env.BASE_API_URL || 'https://api.zkp2p.xyz';
  const API_KEY = process.env.API_KEY || undefined;

  const ESCROW = process.env.ESCROW as `0x${string}`;
  const DEPOSIT_ID = BigInt(process.env.DEPOSIT_ID || '1');
  const AMOUNT = BigInt(process.env.AMOUNT || '1000000');
  const TO = process.env.TO as `0x${string}`;
  const PAYMENT_METHOD = process.env.PAYMENT_METHOD; // bytes32 or ascii
  const PAYMENT_METHOD_NAME = process.env.PAYMENT_METHOD_NAME; // human-readable (e.g., 'wise')
  const FIAT_CURRENCY = process.env.FIAT_CURRENCY;   // bytes32 or ascii (e.g., 'USD')
  const FIAT_CURRENCY_CODE = process.env.FIAT_CURRENCY_CODE; // plain code (e.g., 'USD')
  const CONVERSION_RATE = BigInt(process.env.CONVERSION_RATE || '1000000');
  const PROCESSOR_NAME = process.env.PROCESSOR_NAME || 'wise';
  const PAYEE_DETAILS = process.env.PAYEE_DETAILS || '0x';
  const RUNTIME_ENV = (process.env.RUNTIME_ENV === 'staging' ? 'staging' : 'production') as 'production' | 'staging';
  const NETWORK = (process.env.NETWORK === 'base_sepolia' ? 'base_sepolia' : 'base') as 'base' | 'base_sepolia';

  if (!PRIV) throw new Error('Set PRIVATE_KEY');
  if (!ESCROW || !TO || !PAYMENT_METHOD || !FIAT_CURRENCY) throw new Error('Missing orchestrator params');

  const account = privateKeyToAccount(PRIV);
  const walletClient = createWalletClient({ account, chain: base, transport: http(RPC) });
  const client = new Zkp2pClient({ walletClient, chainId: base.id, runtimeEnv: RUNTIME_ENV, baseApiUrl: BASE_API_URL, apiKey: API_KEY });

  // Resolve payment method hash and fiat currency bytes32
  const methodHash: `0x${string}` = PAYMENT_METHOD_NAME
    ? resolvePaymentMethodHash(PAYMENT_METHOD_NAME, { env: RUNTIME_ENV, network: NETWORK })
    : PAYMENT_METHOD
      ? ensureBytes32(PAYMENT_METHOD, { hashIfAscii: true })
      : (() => { throw new Error('Provide PAYMENT_METHOD_NAME or PAYMENT_METHOD'); })();

  const fiatBytes32: `0x${string}` = FIAT_CURRENCY_CODE
    ? resolveFiatCurrencyBytes32(FIAT_CURRENCY_CODE)
    : FIAT_CURRENCY
      ? ensureBytes32(FIAT_CURRENCY, { hashIfAscii: true })
      : (() => { throw new Error('Provide FIAT_CURRENCY_CODE or FIAT_CURRENCY'); })();

  const hash = await client.signalIntent({
    orchestrator: {
      escrow: ESCROW,
      depositId: DEPOSIT_ID,
      amount: AMOUNT,
      to: TO,
      paymentMethod: methodHash,
      fiatCurrency: fiatBytes32,
      conversionRate: CONVERSION_RATE,
      processorName: PROCESSOR_NAME,
      payeeDetails: PAYEE_DETAILS,
    },
  });

  console.log('signalIntent tx hash:', hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
