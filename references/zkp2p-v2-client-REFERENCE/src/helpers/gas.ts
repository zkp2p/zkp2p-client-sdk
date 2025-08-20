import type { PublicClient } from 'viem';

export interface GasPricing {
  priority: bigint;
  max: bigint;
  baseFee: bigint;
  isCongested: boolean;
}

export interface GasEstimationParams {
  estimated: bigint;
  baseFee: bigint;
  isCongested: boolean;
}

/**
 * Congestion threshold - base fee above this level triggers higher gas fees
 */
export const CONGESTION_THRESHOLD = BigInt(5000000000); // 5 gwei

/**
 * Minimum gas fees required for account abstraction bundlers
 */
export const MIN_PRIORITY_FEE = BigInt(1000000000); // 1 gwei
export const MIN_MAX_FEE = BigInt(2000000000); // 2 gwei

/**
 * Get dynamic gas pricing based on current network conditions
 * Applies congestion multiplier when base fee > 5 gwei
 */
export async function getDynamicGasPricing(publicClient: PublicClient | null): Promise<GasPricing> {
  try {
    if (!publicClient) {
      console.warn('[GAS] Public client not available, using fallback gas prices');
      return {
        priority: BigInt(2000000000), // 2 gwei fallback
        max: BigInt(4000000000), // 4 gwei fallback
        baseFee: BigInt(1000000000), // 1 gwei fallback
        isCongested: false
      };
    }

    // Get current base fee from latest block
    const block = await publicClient.getBlock({ blockTag: 'latest' });
    const baseFee = block.baseFeePerGas || BigInt(1000000000); // 1 gwei fallback
    
    // Check if network is congested
    const isCongested = baseFee > CONGESTION_THRESHOLD;
    
    // Apply congestion multiplier when network is congested
    const congestionMultiplier = isCongested ? 2n : 1n;
    
    // Calculate priority and max fees with congestion adjustment
    const priorityFee = (baseFee * congestionMultiplier) / 10n; // 10% of adjusted base fee
    const maxFee = (baseFee * congestionMultiplier * 12n) / 10n; // 120% of adjusted base fee
    
    // Ensure minimum values for account abstraction bundlers
    const finalPriorityFee = priorityFee > MIN_PRIORITY_FEE ? priorityFee : MIN_PRIORITY_FEE;
    const finalMaxFee = maxFee > MIN_MAX_FEE ? maxFee : MIN_MAX_FEE;
    
    console.log('[GAS] Dynamic pricing:', {
      baseFee: baseFee.toString(),
      congestionMultiplier: congestionMultiplier.toString(),
      priorityFee: finalPriorityFee.toString(),
      maxFee: finalMaxFee.toString(),
      isCongested
    });
    
    return {
      priority: finalPriorityFee,
      max: finalMaxFee,
      baseFee,
      isCongested
    };
  } catch (error) {
    console.error('[GAS] Failed to fetch dynamic gas price:', error);
    // Return conservative fallback values
    return {
      priority: BigInt(2000000000), // 2 gwei
      max: BigInt(4000000000), // 4 gwei
      baseFee: BigInt(1000000000), // 1 gwei
      isCongested: false
    };
  }
}

/**
 * Calculate gas estimation with adaptive buffer based on network conditions
 * Uses 30% buffer during congestion, 20% during normal conditions
 */
export function calculateGasWithBuffer(params: GasEstimationParams): bigint {
  const { estimated, isCongested } = params;
  
  // Apply 30% buffer during congestion, 20% during normal conditions
  const bufferMultiplier = isCongested ? 130n : 120n;
  const gasWithBuffer = (estimated * bufferMultiplier) / 100n;
  
  return gasWithBuffer;
}

/**
 * Get network conditions for gas optimization decisions
 */
export async function getNetworkConditions(publicClient: PublicClient | null): Promise<{
  baseFee: bigint;
  isCongested: boolean;
  recommendedBuffer: number;
}> {
  try {
    if (!publicClient) {
      return {
        baseFee: BigInt(1000000000),
        isCongested: false,
        recommendedBuffer: 20
      };
    }

    const block = await publicClient.getBlock({ blockTag: 'latest' });
    const baseFee = block.baseFeePerGas || BigInt(1000000000);
    const isCongested = baseFee > CONGESTION_THRESHOLD;
    
    return {
      baseFee,
      isCongested,
      recommendedBuffer: isCongested ? 30 : 20
    };
  } catch (error) {
    console.error('[GAS] Failed to get network conditions:', error);
    return {
      baseFee: BigInt(1000000000),
      isCongested: false,
      recommendedBuffer: 25 // Conservative fallback
    };
  }
}