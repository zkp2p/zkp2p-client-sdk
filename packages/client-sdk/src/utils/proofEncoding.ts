import { ethers, utils } from 'ethers';
import canonicalize from 'canonicalize';

/*
  Neutral proof encoding utilities.

  Reason: The browser SDK does NOT depend on Reclaim SDKs. The peerauth
  extension (web) and mobile flows both produce proofs that match the
  on-chain "ReclaimProof" ABI struct, so we keep this struct name for
  contract compatibility but isolate only the minimal ABI packing and
  helper functions here.
*/

export interface ReclaimProof {
  claimInfo: ClaimInfo;
  signedClaim: SignedClaim;
  isAppclipProof: boolean;
}

export interface ClaimInfo {
  provider: string;
  parameters: string;
  context: string;
}

export interface CompleteClaimData {
  identifier: string;
  owner: string;
  timestampS: bigint;
  epoch: bigint;
}

export interface SignedClaim {
  claim: CompleteClaimData;
  signatures: string[];
}

export const parseReclaimProxyProof = (proofObject: any) => {
  return {
    claimInfo: {
      provider: proofObject.claimData.provider,
      parameters: proofObject.claimData.parameters,
      context: proofObject.claimData.context,
    },
    signedClaim: {
      claim: {
        identifier: proofObject.claimData.identifier,
        owner: proofObject.claimData.owner,
        timestampS: BigInt(proofObject.claimData.timestampS),
        epoch: BigInt(proofObject.claimData.epoch),
      },
      signatures: proofObject.signatures,
    },
    isAppclipProof: false,
  } as ReclaimProof;
};

const PROOF_ENCODING_STRING =
  '(tuple(string provider, string parameters, string context) claimInfo, tuple(tuple(bytes32 identifier, address owner, uint32 timestampS, uint32 epoch) claim, bytes[] signatures) signedClaim, bool isAppclipProof)';

export const encodeProofAsBytes = (proof: ReclaimProof) => {
  return ethers.utils.defaultAbiCoder.encode([PROOF_ENCODING_STRING], [proof]);
};

export const encodeTwoProofs = (proof1: ReclaimProof, proof2: ReclaimProof) => {
  return ethers.utils.defaultAbiCoder.encode(
    [PROOF_ENCODING_STRING, PROOF_ENCODING_STRING],
    [proof1, proof2]
  );
};

export const encodeProofAndPaymentMethodAsBytes = (
  proof: `0x${string}`,
  paymentMethod: number
) => {
  return ethers.utils.solidityPack(['uint8', 'bytes'], [paymentMethod, proof]);
};

export function createSignDataForClaim(data: CompleteClaimData) {
  const identifier =
    'identifier' in data ? data.identifier : getIdentifierFromClaimInfo(data as any);
  const lines = [
    identifier,
    data.owner.toLowerCase(),
    data.timestampS.toString(),
    data.epoch.toString(),
  ];
  return lines.join('\n');
}

export function getIdentifierFromClaimInfo(info: ClaimInfo): string {
  if (info.context?.length > 0) {
    try {
      const ctx = JSON.parse(info.context);
      info.context = canonicalize(ctx)!;
    } catch (e) {
      throw new Error('unable to parse non-empty context. Must be JSON');
    }
  }
  const str = `${info.provider}\n${info.parameters}\n${info.context || ''}`;
  return utils.keccak256(new TextEncoder().encode(str)).toLowerCase();
}
