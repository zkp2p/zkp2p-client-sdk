import {
  EscrowDepositView
} from '@helpers/types/escrow';

export const createDepositsStore = (deposits: EscrowDepositView[]): EscrowDepositView[] => {
  const sortedDeposits = deposits.sort((a, b) => {
    // Sort by descending order of remaining available liquidity
    if (b.availableLiquidity > a.availableLiquidity) {
      return 1;
    }
    if (b.availableLiquidity < a.availableLiquidity) {
      return -1;
    }

    return 0;
  });

  return sortedDeposits;
};
