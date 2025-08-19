import type { Hash, PublicClient, WalletClient } from 'viem';
import { ESCROW_ABI } from '../utils/contracts';
import type { FulfillIntentParams } from '../types';
import {
  encodeProofAndPaymentMethodAsBytes,
  encodeProofAsBytes,
  encodeTwoProofs,
  type ReclaimProof,
} from '../utils/proofEncoding';

export async function fulfillIntent(
  walletClient: WalletClient,
  publicClient: PublicClient,
  escrowAddress: string,
  params: FulfillIntentParams
): Promise<Hash> {
  const proofs: ReclaimProof[] = params.paymentProofs.map((p: any) => p.proof);
  let proofBytes: `0x${string}`;
  if (proofs.length === 2) {
    proofBytes = encodeTwoProofs(proofs[0]!, proofs[1]!) as `0x${string}`;
  } else if (proofs.length === 1) {
    proofBytes = encodeProofAsBytes(proofs[0]!) as `0x${string}`;
  } else {
    throw new Error('Invalid number of proofs. Expected 1 or 2 proofs.');
  }
  if (params.paymentMethod !== undefined) {
    proofBytes = encodeProofAndPaymentMethodAsBytes(proofBytes, params.paymentMethod) as `0x${string}`;
  }
  const { request } = await publicClient.simulateContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: 'fulfillIntent',
    args: [proofBytes, params.intentHash],
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
