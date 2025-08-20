import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { base, baseSepolia, hardhat } from 'viem/chains';
import { alchemyBaseRpcUrl, alchemyBaseSepoliaRpcUrl } from '@helpers/config';

// Get the environment to determine chains
const env = import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT;

// Valid environment values
const VALID_ENVIRONMENTS = ['LOCAL', 'STAGING', 'PRODUCTION', 'STAGING_TESTNET'] as const;
type ValidEnvironment = typeof VALID_ENVIRONMENTS[number];

// Validate environment
const validateEnvironment = (env: string): ValidEnvironment => {
  if (!env) {
    console.warn('No VITE_DEPLOYMENT_ENVIRONMENT set, defaulting to LOCAL');
    return 'LOCAL';
  }
  
  if (!VALID_ENVIRONMENTS.includes(env as ValidEnvironment)) {
    console.warn(`Unknown environment "${env}", defaulting to LOCAL. Valid values: ${VALID_ENVIRONMENTS.join(', ')}`);
    return 'LOCAL';
  }
  
  return env as ValidEnvironment;
};

const validatedEnv = validateEnvironment(env);

// Define chains based on environment
const getChainsForEnvironment = (env: ValidEnvironment) => {
  if (env === 'STAGING' || env === 'PRODUCTION') {
    return [base];
  } else if (env === 'STAGING_TESTNET') {
    return [baseSepolia];
  } else {
    return [hardhat];
  }
};

// Get the chains for the current environment
export const chains = getChainsForEnvironment(validatedEnv);

// Create transports for each chain
const createTransports = () => {
  const transports: Record<number, any> = {};
  
  chains.forEach((chain) => {
    if (chain.id === base.id) {
      transports[chain.id] = http(alchemyBaseRpcUrl);
    } else if (chain.id === baseSepolia.id) {
      transports[chain.id] = http(alchemyBaseSepoliaRpcUrl);
    } else if (chain.id === hardhat.id) {
      transports[chain.id] = http('http://localhost:8545');
    }
  });
  
  return transports;
};

// Create wagmi config using @privy-io/wagmi
export const wagmiConfig = createConfig({
  chains,
  transports: createTransports(),
});

// Export the default chain for use in other parts of the app
export const getDefaultChain = () => {
  if (validatedEnv === 'STAGING' || validatedEnv === 'PRODUCTION') {
    return base;
  } else if (validatedEnv === 'STAGING_TESTNET') {
    return baseSepolia;
  } else {
    return hardhat;
  }
};

export default wagmiConfig;