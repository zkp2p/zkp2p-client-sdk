import type { Hash, PublicClient, WalletClient } from 'viem';
import { ESCROW_ABI } from '../utils/contracts';
import type { WithdrawDepositParams } from '../types';

export async function withdrawDeposit(
  walletClient: WalletClient,
  publicClient: PublicClient,
  escrowAddress: string,
  params: WithdrawDepositParams
): Promise<Hash> {
  const { request } = await publicClient.simulateContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: 'withdrawDeposit',
    args: [BigInt((params as any).depositId)],
    account: walletClient.account,
  });
  const hash = await walletClient.writeContract(request);
  (params as any).onSuccess?.({ hash });
  if ((params as any).onMined) {
    await publicClient.waitForTransactionReceipt({ hash });
    (params as any).onMined({ hash });
  }
  return hash;
}

