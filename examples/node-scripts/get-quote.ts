/**
 * Enhanced Get Quote Example - Demonstrates v1.0.0 features
 * Shows usage of constants, currency types, and platform metadata
 */

import { 
  Zkp2pClient,
  Currency,
  SUPPORTED_CHAIN_IDS,
  PAYMENT_PLATFORMS,
  PLATFORM_METADATA,
  currencyInfo,
  type PaymentPlatformType,
  type CurrencyType,
  type QuoteRequest
} from '@zkp2p/client-sdk';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

async function main() {
  const apiKey = process.env.ZKP2P_API_KEY || '';
  const privateKey = process.env.PRIVATE_KEY as `0x${string}` || '0x';
  const rpcUrl = process.env.RPC_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;

  if (!apiKey) throw new Error('Set ZKP2P_API_KEY');

  console.log('ZKP2P Client SDK v1.0.0 - Get Quote Enhanced Example\n');

  // Display supported platforms using new constants
  console.log('Supported Payment Platforms:');
  PAYMENT_PLATFORMS.forEach(platform => {
    const meta = PLATFORM_METADATA[platform];
    console.log(`  ${meta.displayName} - Requires ${meta.requiredProofs} proof(s)`);
  });

  // Display some supported currencies
  console.log('\nSample Supported Currencies:');
  const sampleCurrencies: CurrencyType[] = [Currency.USD, Currency.EUR, Currency.GBP, Currency.JPY];
  sampleCurrencies.forEach(code => {
    const info = currencyInfo[code];
    console.log(`  ${info.currencySymbol} ${code} - ${info.currencyName} (${info.countryCode})`);
  });

  // Setup wallet client with account if private key provided
  let walletClient;
  if (privateKey && privateKey !== '0x') {
    const account = privateKeyToAccount(privateKey);
    walletClient = createWalletClient({ 
      account,
      chain: base, 
      transport: http(rpcUrl) 
    });
    console.log(`\nUsing account: ${account.address}`);
  } else {
    walletClient = createWalletClient({ 
      chain: base, 
      transport: http(rpcUrl) 
    });
    console.log('\nNo private key provided - using read-only mode');
  }

  // Initialize client with v1.0.0 features
  const client = new Zkp2pClient({ 
    walletClient, 
    apiKey, 
    chainId: SUPPORTED_CHAIN_IDS.BASE_MAINNET, // Using new constant
    rpcUrl,
    timeouts: {
      api: 30000,
      transaction: 60000,
    }
  });

  console.log(`\nConnected to chain: Base Mainnet (${SUPPORTED_CHAIN_IDS.BASE_MAINNET})`);
  console.log(`USDC Address: ${client.getUsdcAddress()}`);

  // Get quotes for multiple platforms
  const platforms: PaymentPlatformType[] = ['wise', 'revolut', 'venmo'];
  const selectedCurrency: CurrencyType = Currency.USD;
  const amount = '100';

  console.log(`\nFetching quotes for ${amount} ${selectedCurrency}...`);
  console.log(`Platforms: ${platforms.join(', ')}`);

  try {
    const quoteRequest: QuoteRequest = {
      paymentPlatforms: platforms,
      fiatCurrency: selectedCurrency,
      user: walletClient.account?.address || '0x0000000000000000000000000000000000000001',
      recipient: '0x0000000000000000000000000000000000000002',
      destinationChainId: SUPPORTED_CHAIN_IDS.BASE_MAINNET,
      destinationToken: client.getUsdcAddress(),
      amount,
      // Optional: specify exact-in or exact-out
      // amountType: 'fiat', // default
    };

    const quote = await client.getQuote(quoteRequest);

    console.log('\nQuote Response:');
    console.log(`Total quotes found: ${quote.quotes.length}`);
    console.log(`Response time: ${Date.now()}ms`);

    // Display each quote with platform metadata
    quote.quotes.forEach((q, idx) => {
      const platformMeta = PLATFORM_METADATA[q.paymentPlatform as PaymentPlatformType];
      console.log(`\nQuote #${idx + 1}:`);
      console.log(`  Platform: ${platformMeta.displayName}`);
      console.log(`  Amount: ${q.amount} ${selectedCurrency}`);
      console.log(`  Conversion Rate: ${q.conversionRate}`);
      console.log(`  Deposit ID: ${q.depositId}`);
      console.log(`  Depositor: ${q.depositor}`);
      console.log(`  Required Proofs: ${platformMeta.requiredProofs}`);
      
      // Display deposit data if available
      if (q.depositData) {
        console.log(`  Deposit Data:`, q.depositData);
      }
    });

    // Display fees
    if (quote.fees) {
      console.log('\nFees:');
      console.log(`  Platform Fee: ${quote.fees.platformFee || 0}%`);
      console.log(`  Gas Fee: ${quote.fees.gasFee || 0}`);
    }

    // Full raw response for debugging
    if (process.env.DEBUG) {
      console.log('\nFull Response (Debug Mode):');
      console.log(JSON.stringify(quote, null, 2));
    }

  } catch (error) {
    console.error('\nError fetching quote:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack:', error.stack);
    }
  }

  // Demonstrate other API methods (read-only)
  console.log('\nAdditional SDK Capabilities:');
  console.log('  - createDeposit(): Create liquidity deposits');
  console.log('  - signalIntent(): Signal trading intent');
  console.log('  - fulfillIntent(): Submit payment proofs');
  console.log('  - withdrawDeposit(): Withdraw deposits');
  console.log('  - cancelIntent(): Cancel pending intents');
  console.log('  - validatePayeeDetails(): Validate payee information');
  console.log('  - getAccountDeposits(): Get account deposits');
  console.log('  - getAccountIntent(): Get current intent');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});