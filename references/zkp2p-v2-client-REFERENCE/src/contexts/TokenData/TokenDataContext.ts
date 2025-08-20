import { createContext } from 'react';
import ethSvg from '@assets/images/eth.svg';
import baseSvg from '@assets/images/base.svg';
import solanaSvg from '@assets/images/solana-sol-logo.svg';
import polygonSvg from '@assets/images/tokens/polygon.webp';
import bnbSvg from '@assets/images/tokens/bnb.svg';
import avalancheSvg from '@assets/images/avalanche.svg';
import arbitrumSvg from '@assets/images/arbitrum.svg';
import berachainSvg from '@assets/images/berachain.svg';
import hyperEvmSvg from '@assets/images/hyperEvm.svg';
import scrollSvg from '@assets/images/scroll.svg';
import { TokenData } from '@helpers/types/tokens';

// Types based on Relay V2 API response
interface CurrencyMetadata {
  logoURI?: string;
  verified?: boolean;
  isNative?: boolean;
}

// Legacy V1 format (keeping for compatibility)
export interface RelayCurrency {
  groupID: string;
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  vmType: string;
  metadata: CurrencyMetadata;
}

// Relay V2 API Request structure
export interface RelayV2CurrencyRequest {
  defaultList?: boolean;
  chainIds?: number[];
  term?: string;
  address?: string;
  currencyId?: string;
  tokens?: string[];  // Format: "chainId:address"
  verified?: boolean;
  limit?: number;      // Max 100
  includeAllChains?: boolean;
  useExternalSearch?: boolean;
  depositAddressOnly?: boolean;
}

// Relay V2 API Response structure
export interface RelayV2Currency {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  vmType: 'bvm' | 'evm' | 'svm' | 'tvm' | 'tonvm' | 'suivm' | 'hypevm';
  metadata: {
    logoURI?: string;
    verified?: boolean;
    isNative?: boolean;
  };
}


// Chain mappings - includes all chains supported by bridge providers
export const CHAIN_ICONS: Record<number, string> = {
  // Major chains with local SVG icons (keep these for performance)
  8453: baseSvg, // Base
  792703809: solanaSvg, // Solana
  1: ethSvg, // Ethereum
  137: polygonSvg, // Polygon
  56: bnbSvg, // BNB
  43114: avalancheSvg, // Avalanche
  42161: arbitrumSvg, // Arbitrum
  999: hyperEvmSvg, // HyperEVM
  534352: scrollSvg, // Scroll
  1337: hyperEvmSvg, // Hyperliquid (using HyperEVM icon)
  
  // Chains with actual logos from APIs
  10: 'https://media.socket.tech/networks/optimism.svg', // Optimism
  7777777: 'https://media.socket.tech/networks/zora.svg', // Zora
  5000: 'https://media.socket.tech/networks/mantle.png', // Mantle
  42220: 'https://assets.relay.link/icons/42220/light.png', // Celo
  100: 'https://media.socket.tech/networks/gnosis.svg', // Gnosis
  480: 'https://assets.coingecko.com/coins/images/31069/large/worldcoin.jpeg', // World Chain
  1301: 'https://icons.llamao.fi/icons/chains/rsz_unichain.jpg', // Unichain
  33139: 'https://assets.relay.link/icons/33139/light.png', // Ape Chain
  80084: berachainSvg, // Berachain
  324: 'https://media.socket.tech/networks/zksync-era.svg', // zkSync Era
  59144: 'https://media.socket.tech/networks/linea.svg', // Linea
  81457: 'https://media.socket.tech/networks/blast.svg', // Blast
  34443: 'https://media.socket.tech/networks/mode.svg', // Mode
  1088: 'https://assets.relay.link/icons/1088/light.png', // Metis
  8333: 'https://assets.coingecko.com/coins/images/54287/standard/B3.png', // B3
  // Additional chains from bridge providers
  2020: 'https://assets.relay.link/icons/2020/light.png', // Ronin
  728126428: 'https://assets.relay.link/icons/728126428/light.png', // Tron
  146: 'https://media.socket.tech/networks/sonic.svg', // Sonic
  // Additional chains 
  1329: 'https://assets.relay.link/icons/1329/light.png', // Sei
  1868: 'https://assets.relay.link/icons/1868/light.png', // Soneium  
  60808: 'https://assets.relay.link/icons/60808/light.png', // BOB
  70700: 'https://assets.relay.link/icons/70700/light.png', // Proof of Play Apex
  42170: 'https://assets.relay.link/icons/42170/light.png', // Arbitrum Nova
  747474: 'https://assets.relay.link/icons/747474/light.png', // Katana
  8253038: 'https://assets.relay.link/icons/8253038/light.png', // Bitcoin
  21000000: 'https://assets.relay.link/icons/21000000/light.png', // Corn
};

// Chain names mapping - includes all chains supported by bridge providers
export const CHAIN_NAMES: Record<number, string> = {
  // Major chains
  8453: 'Base',
  792703809: 'Solana',
  1: 'Ethereum',
  137: 'Polygon',
  56: 'BNB',
  43114: 'Avalanche',
  42161: 'Arbitrum',
  999: 'HyperEVM',
  1337: 'Hyperliquid',
  534352: 'Scroll',
  
  // Additional supported chains
  10: 'Optimism',
  7777777: 'Zora',
  5000: 'Mantle',
  42220: 'Celo',
  100: 'Gnosis',
  480: 'World Chain',
  1301: 'Unichain',
  33139: 'Ape Chain',
  80084: 'Berachain',
  324: 'zkSync Era',
  59144: 'Linea',
  81457: 'Blast',
  34443: 'Mode',
  1088: 'Metis',
  8333: 'B3',
  2020: 'Ronin',
  728126428: 'Tron',
  // Testnets
  84532: 'Base Sepolia',
  
  // Additional major chains from bridge providers
  146: 'Sonic',
  1329: 'Sei',
  1868: 'Soneium',
  60808: 'BOB',
  70700: 'Proof of Play Apex',
  42170: 'Arbitrum Nova',
  747474: 'Katana',
  8253038: 'Bitcoin',
  21000000: 'Corn',
};

// Helper functions to work with chains
export const getChainName = (chainId: number): string => {
  return CHAIN_NAMES[chainId] || `Chain ${chainId}`;
};

export const getChainIcon = (chainId: number): string | undefined => {
  return CHAIN_ICONS[chainId];
};

export const getChainIdFromName = (chainName: string): number | undefined => {
  const entry = Object.entries(CHAIN_NAMES).find(([_, name]) => name === chainName);
  return entry ? parseInt(entry[0]) : undefined;
};

export const getChainIconFromName = (chainName: string): string | undefined => {
  const chainId = getChainIdFromName(chainName);
  return chainId ? CHAIN_ICONS[chainId] : undefined;
};

export const getAllSupportedChains = (): string[] => {
  return Object.values(CHAIN_NAMES);
};

// Validation function to ensure chain ID uniqueness
export const validateUniqueChainIds = (): void => {
  const chainIds = Object.keys(CHAIN_NAMES).map(Number);
  const seen = new Set<number>();
  const duplicates: number[] = [];
  
  for (const id of chainIds) {
    if (seen.has(id)) {
      duplicates.push(id);
    }
    seen.add(id);
  }
  
  if (duplicates.length > 0) {
    throw new Error(`Duplicate chain IDs found in CHAIN_NAMES: ${duplicates.join(', ')}`);
  }
};

// Run validation in development mode
if (import.meta.env.DEV) {
  validateUniqueChainIds(); // Will throw in dev if duplicates found
}

interface TokenDataValues {
  TOKEN_USDC: string;

  tokens: string[];
  tokenInfo: Record<string, TokenData>;
  isLoading: boolean;
  error: Error | null;
  refetchTokens: () => Promise<void>;

  // New functions for enhanced provider
  fetchTokensForChain: (chainId: number) => Promise<{ tokenIds: string[], tokenInfoData: Record<string, TokenData> } | undefined>;
  searchTokensByTerm: (term: string, chainId?: number) => Promise<{ tokenIds: string[], tokenInfoData: Record<string, TokenData> } | undefined>;
  searchTokensByAddress: (address: string, chainId?: number) => Promise<{ tokenIds: string[], tokenInfoData: Record<string, TokenData> } | undefined>;
  refetchToken: (tokenId: string) => Promise<TokenData | undefined>;

  // Chain mapping functions
  getChainName: (chainId: number) => string;
  getChainIcon: (chainId: number) => string | undefined;
  getChainIdFromName: (chainName: string) => number | undefined;
  getChainIconFromName: (chainName: string) => string | undefined;
  getAllSupportedChains: () => string[];
}

const defaultValues: TokenDataValues = {
  TOKEN_USDC: '',

  tokens: [],
  tokenInfo: {},
  isLoading: false,
  error: null,
  refetchTokens: async () => { },

  // Default implementations for new functions
  fetchTokensForChain: async () => undefined,
  searchTokensByTerm: async () => undefined,
  searchTokensByAddress: async () => undefined,
  refetchToken: async () => undefined,

  // Default implementations for chain mapping functions
  getChainName,
  getChainIcon,
  getChainIdFromName,
  getChainIconFromName,
  getAllSupportedChains,
};

const TokenDataContext = createContext<TokenDataValues>(defaultValues);

export default TokenDataContext; 