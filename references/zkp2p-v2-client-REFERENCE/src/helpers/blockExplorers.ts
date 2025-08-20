
// Map of chain IDs to their block explorer URLs
export const CHAIN_EXPLORERS: Record<number, string> = {
  // Core application chains
  8453: 'https://basescan.org', // Base
  84532: 'https://sepolia.basescan.org', // Base Sepolia
  31337: 'https://localhost:8545', // Hardhat (local)
  
  // Major EVM chains (used by bridge providers)
  1: 'https://etherscan.io', // Ethereum
  137: 'https://polygonscan.com', // Polygon
  42161: 'https://arbiscan.io', // Arbitrum One
  10: 'https://optimistic.etherscan.io', // Optimism
  56: 'https://bscscan.com', // BNB Chain
  43114: 'https://snowtrace.io', // Avalanche
  
  // Layer 2s and scaling solutions
  324: 'https://explorer.zksync.io', // zkSync Era
  534352: 'https://scrollscan.com', // Scroll
  59144: 'https://lineascan.build', // Linea
  81457: 'https://blastscan.io', // Blast
  5000: 'https://mantlescan.xyz', // Mantle
  34443: 'https://modescan.io', // Mode
  7777777: 'https://explorer.zora.co', // Zora
  42170: 'https://nova.arbiscan.io', // Arbitrum Nova
  
  // Specialized chains (actively used)
  480: 'https://worldscan.org', // World Chain
  1301: 'https://uniscan.xyz', // Unichain
  33139: 'https://apescan.io', // Ape Chain
  80084: 'https://berascan.com', // Berachain
  8333: 'https://explorer.b3.fun', // B3
  42220: 'https://celoscan.io', // Celo
  100: 'https://gnosisscan.io', // Gnosis
  1088: 'https://explorer.metis.io', // Metis
  2020: 'https://app.roninchain.com', // Ronin
  
  // Additional active chains
  146: 'https://sonicscan.org', // Sonic
  1329: 'https://seitrace.com', // Sei
  1868: 'https://soneium.blockscout.com', // Soneium
  60808: 'https://explorer.gobob.xyz', // BOB
  70700: 'https://explorer.apex.proofofplay.com', // Proof of Play Apex
  747474: 'https://explorer.katanarpc.com', // Katana
  21000000: 'https://cornscan.io', // Corn
  
  // Non-EVM chains (special handling)
  792703809: 'https://solscan.io', // Solana
  728126428: 'https://tronscan.org', // Tron
  999: 'https://purrsec.com/', // HyperEVM
  1337: 'https://app.hyperliquid.xyz/explorer', // Hyperliquid
  8253038: 'https://mempool.space', // Bitcoin (wrapped)
};

// Default to relay.link if chain not found
const DEFAULT_EXPLORER = 'https://relay.link/transaction/';

/**
 * Gets the appropriate block explorer URL for a transaction based on its chain ID
 * 
 * @param txHash The transaction hash
 * @param chainId The chain ID where the transaction was executed
 * @returns The full URL to view the transaction
 */
export function getTransactionExplorerUrl(txHash: string, chainId: number): string {
  const baseUrl = CHAIN_EXPLORERS[chainId];

  if (baseUrl) {
    return `${baseUrl}/tx/${txHash}`;
  }

  // Fall back to relay.link if we don't have a specific explorer
  return `${DEFAULT_EXPLORER}${txHash}`;
}