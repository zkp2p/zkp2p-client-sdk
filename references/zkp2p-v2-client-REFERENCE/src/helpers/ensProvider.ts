import { mainnetPublicClient } from './mainnetClient';

// Create a minimal ethers-compatible provider for react-ens-name
// This adapter allows us to use viem while maintaining compatibility
// We cast to 'any' because react-ens-name expects a full ethers Provider
// but only actually uses the lookupAddress method
export const ensProvider = {
  // react-ens-name only uses lookupAddress and resolveName methods
  lookupAddress: async (address: string): Promise<string | null> => {
    try {
      const name = await mainnetPublicClient.getEnsName({
        address: address as `0x${string}`,
      });
      return name || null;
    } catch (error) {
      console.error('ENS reverse lookup failed:', error);
      return null;
    }
  },
  
  resolveName: async (name: string): Promise<string | null> => {
    try {
      const address = await mainnetPublicClient.getEnsAddress({
        name: name,
      });
      return address || null;
    } catch (error) {
      console.error('ENS resolution failed:', error);
      return null;
    }
  },
  
  // Required for react-ens-name compatibility
  _isProvider: true,
} as any; // Cast to any to satisfy react-ens-name's Provider type requirement