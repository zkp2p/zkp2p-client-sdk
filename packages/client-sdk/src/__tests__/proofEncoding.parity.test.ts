import { describe, it, expect } from 'vitest';
import { encodeProofAsBytes, encodeTwoProofs, encodeManyProofs, encodeProofAndPaymentMethodAsBytes, type ReclaimProof } from '../utils/proofEncoding';
import { ethers, utils } from 'ethers';

const PROOF_ENCODING_STRING =
  '(tuple(string provider, string parameters, string context) claimInfo, tuple(tuple(bytes32 identifier, address owner, uint32 timestampS, uint32 epoch) claim, bytes[] signatures) signedClaim, bool isAppclipProof)';

function toEncodableProof(proof: ReclaimProof) {
  const UINT32_MAX = 4294967295n;
  const ts = proof.signedClaim.claim.timestampS;
  const ep = proof.signedClaim.claim.epoch;
  if (ts < 0n || ts > UINT32_MAX) throw new Error('ts out of range');
  if (ep < 0n || ep > UINT32_MAX) throw new Error('ep out of range');
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

const baseProof: ReclaimProof = {
  claimInfo: { provider: 'wise', parameters: '{}', context: '' },
  signedClaim: {
    claim: {
      identifier: '0x' + '11'.repeat(32),
      owner: '0x0000000000000000000000000000000000000001',
      timestampS: 1n,
      epoch: 1n,
    },
    signatures: ['0x' + 'aa'.repeat(65)],
  },
  isAppclipProof: false,
};

describe('proofEncoding parity with ethers@5', () => {
  it('encodeProofAsBytes matches ethers defaultAbiCoder', () => {
    const mine = encodeProofAsBytes(baseProof);
    const exp = ethers.utils.defaultAbiCoder.encode([PROOF_ENCODING_STRING], [toEncodableProof(baseProof)]);
    expect(mine).toBe(exp);
  });

  it('encodeTwoProofs matches ethers defaultAbiCoder', () => {
    const p1 = baseProof;
    const p2: ReclaimProof = {
      ...baseProof,
      signedClaim: { ...baseProof.signedClaim, claim: { ...baseProof.signedClaim.claim, identifier: '0x' + '22'.repeat(32) } },
    };
    const mine = encodeTwoProofs(p1, p2);
    const exp = ethers.utils.defaultAbiCoder.encode([PROOF_ENCODING_STRING, PROOF_ENCODING_STRING], [toEncodableProof(p1), toEncodableProof(p2)]);
    expect(mine).toBe(exp);
  });

  it('encodeManyProofs matches ethers defaultAbiCoder', () => {
    const p1 = baseProof;
    const p2: ReclaimProof = {
      ...baseProof,
      signedClaim: { ...baseProof.signedClaim, claim: { ...baseProof.signedClaim.claim, identifier: '0x' + '33'.repeat(32) } },
    };
    const mine = encodeManyProofs([p1, p2]);
    const types = [PROOF_ENCODING_STRING, PROOF_ENCODING_STRING];
    const values = [toEncodableProof(p1), toEncodableProof(p2)];
    const exp = ethers.utils.defaultAbiCoder.encode(types as any, values as any);
    expect(mine).toBe(exp);
  });

  it('encodeProofAndPaymentMethodAsBytes matches solidityPack', () => {
    const bytes = encodeProofAsBytes(baseProof) as `0x${string}`;
    const mine = encodeProofAndPaymentMethodAsBytes(bytes, 5);
    const exp = ethers.utils.solidityPack(['uint8', 'bytes'], [5, bytes]);
    expect(mine).toBe(exp);
  });

  it('keccak of UTF-8 matches ethers', () => {
    const s = 'USD';
    const viemHash = utils.keccak256(new TextEncoder().encode(s));
    const ethersHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(s));
    expect(viemHash.toLowerCase()).toBe(ethersHash.toLowerCase());
  });
});

