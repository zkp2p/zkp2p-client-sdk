/**
 * Signal Intent Example - Demonstrates intent signaling with v1.0.0 features
 */

import { 
  Zkp2pClient,
  Currency,
  SUPPORTED_CHAIN_IDS,
  PLATFORM_METADATA,
  ValidationError,
  type SignalIntentParams,
  type PaymentPlatformType,
  type CurrencyType
} from '@zkp2p/client-sdk';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

async function main() {
  const apiKey = process.env.ZKP2P_API_KEY || '';
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
  const rpcUrl = process.env.RPC_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;

  if (!apiKey) throw new Error('Set ZKP2P_API_KEY');
  if (!privateKey) throw new Error('Set PRIVATE_KEY to signal intent');

  console.log('ZKP2P Client SDK v1.0.0 - Signal Intent Example\n');

  // Setup wallet client
  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({ 
    account,
    chain: base, 
    transport: http(rpcUrl) 
  });

  console.log(`Account: ${account.address}`);

  // Initialize client with error handling
  const client = new Zkp2pClient({ 
    walletClient, 
    apiKey, 
    chainId: SUPPORTED_CHAIN_IDS.BASE_MAINNET,
    rpcUrl,
  });

  // Configuration
  const platform: PaymentPlatformType = 'venmo';
  const currency: CurrencyType = Currency.USD;
  const platformMeta = PLATFORM_METADATA[platform];

  console.log(`\nIntent Configuration:`);
  console.log(`  Platform: ${platformMeta.displayName}`);
  console.log(`  Currency: ${currency}`);

  try {
    // Step 1: Get available quotes to find a deposit
    console.log('\nFetching available deposits...');
    const quotes = await client.getQuote({
      paymentPlatforms: [platform],
      fiatCurrency: currency,
      user: account.address,
      recipient: account.address, // Can be different address
      destinationChainId: SUPPORTED_CHAIN_IDS.BASE_MAINNET,
      destinationToken: client.getUsdcAddress(),
      amount: '5', // 5 USD
    });

    if (quotes.quotes.length === 0) {
      console.log('No deposits available for this platform and amount');
      return;
    }

    // Select the first available quote
    const selectedQuote = quotes.quotes[0];
    console.log('\nFound deposit:');
    console.log(`  Deposit ID: ${selectedQuote.depositId}`);
    console.log(`  Depositor: ${selectedQuote.depositor}`);
    console.log(`  Available Amount: ${selectedQuote.amount}`);
    console.log(`  Conversion Rate: ${selectedQuote.conversionRate}`);

    // Step 2: Validate payee details before signaling
    const payeeDetails = {
      [`${platform}Username`]: 'buyer_venmo',
      [`${platform}Id`]: '9876543210',
      email: 'buyer@example.com',
    };

    console.log('\nValidating payee details...');
    const validation = await client.validatePayeeDetails({
      processorName: platform,
      depositData: payeeDetails,
    });

    if (!validation.responseObject.isValid) {
      console.error('Invalid payee details:', validation.responseObject.errors);
      return;
    }
    console.log('Payee details validated');

    // Step 3: Signal the intent
    const intentParams: SignalIntentParams = {
      processorName: platform,
      depositId: selectedQuote.depositId,
      tokenAmount: (parseFloat(selectedQuote.amount) * 1_000_000).toString(), // Convert to USDC units
      payeeDetails: JSON.stringify(payeeDetails),
      toAddress: account.address, // Where to receive USDC
      currency: currency,
      // Optional callbacks
      onSuccess: ({ hash }) => {
        console.log(`\nIntent signaled! Transaction: ${hash}`);
      },
      onMined: ({ hash }) => {
        console.log(`Transaction confirmed! Hash: ${hash}`);
      },
      onError: (error) => {
        console.error(`Intent failed:`, error);
      },
    };

    console.log('\nSignaling intent...');
    const intentResponse = await client.signalIntent(intentParams);

    console.log('\nIntent Signaled Successfully!');
    console.log(`  Intent Hash: ${intentResponse.intentHash}`);
    console.log(`  Timestamp: ${new Date(intentResponse.timestamp * 1000).toLocaleString()}`);
    
    if (intentResponse.txHash) {
      console.log(`  Transaction: ${intentResponse.txHash}`);
      console.log(`  Block Explorer: https://basescan.org/tx/${intentResponse.txHash}`);
    }

    // Step 4: Read the intent details
    console.log('\nReading intent details...');
    const accountIntent = await client.getAccountIntent(account.address);
    
    if (accountIntent.intent.intentHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      console.log('  Current Intent:');
      console.log(`    Hash: ${accountIntent.intent.intentHash}`);
      console.log(`    Deposit ID: ${accountIntent.intent.depositId}`);
      console.log(`    Amount: ${accountIntent.intent.amount}`);
      console.log(`    Recipient: ${accountIntent.intent.to}`);
      console.log(`    Timestamp: ${new Date(Number(accountIntent.intent.intentTimestamp) * 1000).toLocaleString()}`);
    } else {
      console.log('  No active intent found');
    }

    // Step 5: Demonstrate cancellation (commented out to preserve intent)
    console.log('\nTo cancel this intent, you can call:');
    console.log(`  await client.cancelIntent({ intentHash: '${intentResponse.intentHash}' })`);

  } catch (error) {
    console.error('\nError:', error);
    
    // Handle specific error types
    if (error instanceof ValidationError) {
      console.error('Validation Error:', error.message);
      console.error('Error Code:', error.code);
    } else if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        console.error('Make sure you have enough ETH for gas');
      } else if (error.message.includes('Intent already exists')) {
        console.error('You already have an active intent. Cancel it first or wait for it to complete.');
      }
    }
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});