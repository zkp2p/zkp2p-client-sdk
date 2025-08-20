import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { alchemyMainnetRpcUrl } from './config';

// Create a public client for mainnet (used for ENS resolution)
export const mainnetPublicClient = createPublicClient({
  chain: mainnet,
  transport: http(alchemyMainnetRpcUrl),
});