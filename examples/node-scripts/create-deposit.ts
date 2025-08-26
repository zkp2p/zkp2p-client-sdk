/**
 * Create Deposit Example - Demonstrates deposit creation with v1.0.0 features
 */

import { 
  Zkp2pClient,
  Currency,
  SUPPORTED_CHAIN_IDS,
  PLATFORM_METADATA,
  currencyInfo,
  type CreateDepositParams,
  type CreateDepositConversionRate,
  type PaymentPlatformType,
  type CurrencyType
} from '@zkp2p/client-sdk';
import { createWalletClient, http, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

async function main() {
  const apiKey = process.env.ZKP2P_API_KEY || '';
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
  const rpcUrl = process.env.RPC_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;

  if (!apiKey) throw new Error('Set ZKP2P_API_KEY');
  if (!privateKey) throw new Error('Set PRIVATE_KEY to create deposits');

  console.log('🚀 ZKP2P Client SDK v1.0.0 - Create Deposit Example\n');

  // Setup wallet client with account
  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({ 
    account,
    chain: base, 
    transport: http(rpcUrl) 
  });

  console.log(`🔑 Account: ${account.address}`);

  // Initialize client
  const client = new Zkp2pClient({ 
    walletClient, 
    apiKey, 
    chainId: SUPPORTED_CHAIN_IDS.BASE_MAINNET,
    rpcUrl,
  });

  // Configuration
  const platform: PaymentPlatformType = 'venmo';
  const currency: CurrencyType = Currency.USD;
  const depositAmount = '10'; // 10 USDC
  const platformMeta = PLATFORM_METADATA[platform];
  const currencyMeta = currencyInfo[currency];

  console.log(`\n💵 Creating Deposit:`);
  console.log(`  Platform: ${platformMeta.logo} ${platformMeta.displayName}`);
  console.log(`  Currency: ${currencyMeta.currencySymbol} ${currency}`);
  console.log(`  Amount: ${depositAmount} USDC`);
  console.log(`  Required Proofs: ${platformMeta.requiredProofs}`);

  try {
    // Convert amount to USDC units (6 decimals)
    const amount = parseUnits(depositAmount, 6);

    // Setup conversion rates - 1:1 for USD
    const conversionRates: CreateDepositConversionRate[][] = [[
      { 
        currency: Currency.USD, 
        conversionRate: '1000000' // 1 USDC = 1 USD (scaled by 1e6)
      }
    ]];

    // Create deposit parameters
    const depositParams: CreateDepositParams = {
      token: client.getUsdcAddress(),
      amount,
      intentAmountRange: {
        min: amount / 2n,     // Allow intents from 5 USDC
        max: amount * 2n,     // Allow intents up to 20 USDC
      },
      conversionRates,
      processorNames: [platform],
      depositData: [{
        // Platform-specific payee details
        [`${platform}Username`]: 'alice_venmo',
        [`${platform}Id`]: '1234567890',
        email: 'alice@example.com',
      }],
      // Optional callbacks
      onSuccess: ({ hash }) => {
        console.log(`✅ Transaction broadcast! Hash: ${hash}`);
      },
      onMined: ({ hash }) => {
        console.log(`⛏️ Transaction mined! Hash: ${hash}`);
      },
      onError: (error) => {
        console.error(`❌ Transaction failed:`, error);
      },
    };

    console.log('\n📤 Submitting deposit transaction...');
    const result = await client.createDeposit(depositParams);

    console.log('\n✅ Deposit Created Successfully!');
    console.log(`  Transaction Hash: ${result.hash}`);
    console.log(`  Block Explorer: https://basescan.org/tx/${result.hash}`);
    
    console.log('\n📝 Deposit Details:');
    result.depositDetails.forEach((detail, idx) => {
      console.log(`  Deposit #${idx + 1}:`);
      console.log(`    Processor: ${detail.processor}`);
      console.log(`    Data:`, detail.data);
    });

    // Demonstrate reading deposits
    console.log('\n📖 Reading account deposits...');
    const deposits = await client.getAccountDeposits(account.address);
    console.log(`  Total deposits: ${deposits.length}`);
    
    deposits.forEach((deposit, idx) => {
      console.log(`\n  Deposit #${idx + 1}:`);
      console.log(`    ID: ${deposit.deposit.depositId}`);
      console.log(`    Amount: ${deposit.deposit.amount}`);
      console.log(`    Available: ${deposit.deposit.availableDepositAmount}`);
      console.log(`    Intent Range: ${deposit.deposit.intentAmountRange.min} - ${deposit.deposit.intentAmountRange.max}`);
      console.log(`    Outstanding Intents: ${deposit.deposit.outstandingIntentAmount}`);
    });

  } catch (error) {
    console.error('\n❌ Error creating deposit:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      
      // Check for common errors
      if (error.message.includes('insufficient funds')) {
        console.error('💡 Make sure you have enough USDC and ETH for gas');
      }
      if (error.message.includes('user rejected')) {
        console.error('💡 Transaction was rejected by the wallet');
      }
    }
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});