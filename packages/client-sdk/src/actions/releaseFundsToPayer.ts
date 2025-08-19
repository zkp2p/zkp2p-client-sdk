import type { Hash, PublicClient, WalletClient } from 'viem';
import { ESCROW_ABI } from '../utils/contracts';
import type { ReleaseFundsToPayerParams } from '../types';

export async function releaseFundsToPayer(
  walletClient: WalletClient,
  publicClient: PublicClient,
  escrowAddress: string,
  params: ReleaseFundsToPayerParams
): Promise<Hash> {
  const { request } = await publicClient.simulateContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: 'releaseFundsToPayer',
    args: [params.intentHash],
    account: walletClient.account,
  });
  const hash = await walletClient.writeContract(request);
  if ((params as any).onSuccess) (params as any).onSuccess({ hash });
  if ((params as any).onMined) {
    await publicClient.waitForTransactionReceipt({ hash });
    (params as any).onMined({ hash });
  }
  return hash;
}

