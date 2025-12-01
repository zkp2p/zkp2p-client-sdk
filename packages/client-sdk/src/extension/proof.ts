import type { ReclaimProof } from '../utils/proofEncoding';

// Converts various signature representations (array/object/hex string) to 0x-prefixed hex
export function toHexSignature(sig: any): `0x${string}` {
  if (!sig) return '0x' as `0x${string}`;
  if (typeof sig === 'string' && sig.startsWith('0x')) return sig as `0x${string}`;
  const arr: number[] = Array.isArray(sig) ? sig : Object.values(sig || {});
  const hex = arr.map((b) => Number(b).toString(16).padStart(2, '0')).join('');
  return (`0x${hex}`) as `0x${string}`;
}

// Normalize extension proof payload into the on-chain struct shape (ReclaimProof-compatible)
export function parseExtensionProof(extensionProof: any): ReclaimProof {
  const claim = extensionProof?.claim || extensionProof?.signedClaim?.claim || {};
  const signatures = extensionProof?.signatures || {};

  return {
    claimInfo: {
      provider: extensionProof?.claim?.provider ?? extensionProof?.provider ?? '',
      parameters: extensionProof?.claim?.parameters ?? extensionProof?.parameters ?? '',
      context: extensionProof?.claim?.context ?? extensionProof?.context ?? '',
    },
    signedClaim: {
      claim: {
        identifier: claim.identifier as string,
        owner: claim.owner as string,
        timestampS: BigInt(claim.timestampS ?? 0),
        epoch: BigInt(claim.epoch ?? 0),
      },
      signatures: [toHexSignature(signatures.claimSignature)],
    },
    isAppclipProof: false,
  };
}

