import { createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { alchemyBaseRpcUrl, alchemyBaseSepoliaRpcUrl } from './config';

const env = import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT;
const isTestnet = env === 'STAGING_TESTNET';

// Create a public client for Base network (mainnet or testnet based on environment)
export const basePublicClient = createPublicClient({
  chain: isTestnet ? baseSepolia : base,
  transport: http(isTestnet ? alchemyBaseSepoliaRpcUrl : alchemyBaseRpcUrl),
});