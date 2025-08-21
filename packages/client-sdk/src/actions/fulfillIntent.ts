import type { Hash, PublicClient, WalletClient } from 'viem';
import { ESCROW_ABI } from '../utils/contracts';
import type { FulfillIntentParams } from '../types';
import {
  assembleProofBytes,
  type ReclaimProof,
} from '../utils/proofEncoding';

export async function fulfillIntent(
  walletClient: WalletClient,
  publicClient: PublicClient,
  escrowAddress: string,
  params: FulfillIntentParams
): Promise<Hash> {
  const proofs: ReclaimProof[] = params.paymentProofs.map((p) => p.proof);
  const proofBytes = assembleProofBytes(proofs, { paymentMethod: params.paymentMethod });
  const { request } = await publicClient.simulateContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: 'fulfillIntent',
    args: [proofBytes, params.intentHash],
    account: walletClient.account,
  });

  const hash = await walletClient.writeContract(request);
  if (params.onSuccess) params.onSuccess({ hash });
  if (params.onMined) {
    await publicClient.waitForTransactionReceipt({ hash });
    params.onMined({ hash });
  }
  return hash;
}
