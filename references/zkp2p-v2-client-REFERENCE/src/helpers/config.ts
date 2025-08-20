// Centralized configuration for RPC URLs and other environment-based settings
export const alchemyMainnetRpcUrl = `https://eth-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`;
export const alchemyBaseRpcUrl = `https://base-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`;
export const alchemySepoliaRpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`;
export const alchemyBaseSepoliaRpcUrl = `https://base-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`;
export const alchemySolanaEndpoint = `https://solana-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_SOLANA_API_KEY}`;