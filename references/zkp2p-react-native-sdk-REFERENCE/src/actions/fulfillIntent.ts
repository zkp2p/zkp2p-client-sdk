import type { Hash, PublicClient, WalletClient } from 'viem';
import { ESCROW_ABI } from '../utils/contracts';
import type { FulfillIntentParams } from '../types';
import {
  encodeProofAndPaymentMethodAsBytes,
  encodeProofAsBytes,
  encodeTwoProofs,
  type ReclaimProof,
} from '../utils/reclaimProof';

export async function fulfillIntent(
  walletClient: WalletClient,
  publicClient: PublicClient,
  escrowAddress: string,
  params: FulfillIntentParams
): Promise<Hash> {
  try {
    const proofs: ReclaimProof[] = params.paymentProofs.map((p) => p.proof);

    let proofBytes: `0x${string}`;

    if (proofs.length === 2) {
      proofBytes = encodeTwoProofs(proofs[0]!, proofs[1]!) as `0x${string}`;
    } else if (proofs.length === 1) {
      proofBytes = encodeProofAsBytes(proofs[0]!) as `0x${string}`;
    } else {
      throw new Error('Invalid number of proofs. Expected 1 or 2 proofs.');
    }

    if (params.paymentMethod !== undefined) {
      proofBytes = encodeProofAndPaymentMethodAsBytes(
        proofBytes,
        params.paymentMethod
      ) as `0x${string}`;
    }
    const { request } = await publicClient.simulateContract({
      address: escrowAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'fulfillIntent',
      args: [proofBytes, params.intentHash],
      account: walletClient.account,
    });

    const hash = await walletClient.writeContract(request);

    if (params.onSuccess) {
      params.onSuccess({ hash });
    }

    if (params.onMined) {
      await publicClient.waitForTransactionReceipt({ hash });
      params.onMined({ hash });
    }

    return hash;
  } catch (error) {
    if (params.onError) {
      params.onError(error as Error);
    }
    throw error;
  }
}
