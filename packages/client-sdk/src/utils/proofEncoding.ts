import { encodeAbiParameters, encodePacked, keccak256, stringToHex } from 'viem';
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

// ABI parameter for the ReclaimProof tuple
const PROOF_PARAM = {
  type: 'tuple',
  components: [
    {
      type: 'tuple',
      components: [
        { type: 'string', name: 'provider' },
        { type: 'string', name: 'parameters' },
        { type: 'string', name: 'context' },
      ],
    },
    {
      type: 'tuple',
      components: [
        {
          type: 'tuple',
          components: [
            { type: 'bytes32', name: 'identifier' },
            { type: 'address', name: 'owner' },
            { type: 'uint32', name: 'timestampS' },
            { type: 'uint32', name: 'epoch' },
          ],
        },
        { type: 'bytes[]', name: 'signatures' },
      ],
    },
    { type: 'bool', name: 'isAppclipProof' },
  ],
} as const;

// Convert proof into ABI-encodable structure with uint32-safe numbers
function toEncodableProof(proof: ReclaimProof) {
  const UINT32_MAX = 4294967295n;
  const ts = proof.signedClaim.claim.timestampS;
  const ep = proof.signedClaim.claim.epoch;
  if (ts < 0n || ts > UINT32_MAX) {
    throw new Error(`timestampS ${ts.toString()} exceeds uint32 bounds`);
  }
  if (ep < 0n || ep > UINT32_MAX) {
    throw new Error(`epoch ${ep.toString()} exceeds uint32 bounds`);
  }
  return {
    claimInfo: proof.claimInfo,
    signedClaim: {
      claim: {
        identifier: proof.signedClaim.claim.identifier,
        owner: proof.signedClaim.claim.owner,
        timestampS: Number(ts),
        epoch: Number(ep),
      },
      signatures: proof.signedClaim.signatures,
    },
    isAppclipProof: proof.isAppclipProof,
  };
}

function toTupleValue(enc: ReturnType<typeof toEncodableProof>) {
  return [
    [enc.claimInfo.provider, enc.claimInfo.parameters, enc.claimInfo.context],
    [[enc.signedClaim.claim.identifier, enc.signedClaim.claim.owner, enc.signedClaim.claim.timestampS, enc.signedClaim.claim.epoch], enc.signedClaim.signatures],
    enc.isAppclipProof,
  ];
}

export const encodeProofAsBytes = (proof: ReclaimProof) => {
  const enc = toEncodableProof(proof);
  return encodeAbiParameters([PROOF_PARAM as any], [toTupleValue(enc)]);
};

export const encodeTwoProofs = (proof1: ReclaimProof, proof2: ReclaimProof) => {
  const p1 = toTupleValue(toEncodableProof(proof1));
  const p2 = toTupleValue(toEncodableProof(proof2));
  return encodeAbiParameters([PROOF_PARAM as any, PROOF_PARAM as any], [p1, p2]);
};

// Encodes an arbitrary number of proofs as separate top-level tuple params
export const encodeManyProofs = (proofs: ReclaimProof[]) => {
  if (!Array.isArray(proofs) || proofs.length === 0) {
    throw new Error('encodeManyProofs requires at least one proof');
  }
  const types = proofs.map(() => PROOF_PARAM as any);
  const values = proofs.map((p) => toTupleValue(toEncodableProof(p)));
  return encodeAbiParameters(types as any, values as any);
};

export const encodeProofAndPaymentMethodAsBytes = (
  proof: `0x${string}`,
  paymentMethod: number
) => {
  return encodePacked(['uint8', 'bytes'], [paymentMethod, proof]);
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
  return keccak256(stringToHex(str)).toLowerCase();
}

// High-level helper to assemble proof bytes from one or more proofs and optional payment method
export function assembleProofBytes(
  proofs: ReclaimProof[],
  opts?: { paymentMethod?: number }
): `0x${string}` {
  if (!Array.isArray(proofs) || proofs.length === 0) {
    throw new Error('No proofs provided');
  }
  let proofBytes: `0x${string}`;
  if (proofs.length === 1) {
    proofBytes = encodeProofAsBytes(proofs[0]!) as `0x${string}`;
  } else if (proofs.length === 2) {
    proofBytes = encodeTwoProofs(proofs[0]!, proofs[1]!) as `0x${string}`;
  } else {
    proofBytes = encodeManyProofs(proofs) as `0x${string}`;
  }
  if (opts?.paymentMethod !== undefined) {
    proofBytes = encodeProofAndPaymentMethodAsBytes(proofBytes, opts.paymentMethod) as `0x${string}`;
  }
  return proofBytes;
}

// Helper: convert `0x…` intent hash to decimal string for extension
export function intentHashHexToDecimalString(hash: `0x${string}`): string {
  if (typeof hash !== 'string' || !hash.startsWith('0x')) {
    throw new Error('intent hash must be a 0x-prefixed hex string');
  }
  return BigInt(hash).toString(10);
}
