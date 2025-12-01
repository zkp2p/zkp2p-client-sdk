import { describe, it, expect } from 'vitest';
import {
  encodeProofAsBytes,
  encodeManyProofs,
  assembleProofBytes,
  type ReclaimProof,
} from '../utils/proofEncoding';

const mkProof = (i: number): ReclaimProof => ({
  claimInfo: { provider: 'wise', parameters: '{}', context: '' },
  signedClaim: {
    claim: {
      identifier: ('0x' + String(i).padStart(64, '0')) as `0x${string}`,
      owner: '0x0000000000000000000000000000000000000001',
      timestampS: 1n,
      epoch: 1n,
    },
    signatures: ['0x' + 'bb'.repeat(65)],
  },
  isAppclipProof: false,
});

describe('encodeManyProofs and assembleProofBytes', () => {
  it('encodes multiple proofs consistently', () => {
    const p1 = mkProof(1);
    const p2 = mkProof(2);
    const single1 = encodeProofAsBytes(p1);
    const single2 = encodeProofAsBytes(p2);
    expect(single1).toMatch(/^0x/);
    expect(single2).toMatch(/^0x/);

    const many = encodeManyProofs([p1, p2]);
    expect(many).toMatch(/^0x/);
    expect(many.length).toBeGreaterThan(single1.length);
  });

  it('assembles proof bytes with optional payment method', () => {
    const p1 = mkProof(3);
    const p2 = mkProof(4);

    const one = assembleProofBytes([p1]);
    const two = assembleProofBytes([p1, p2]);
    const tagged = assembleProofBytes([p1], { paymentMethod: 7 });

    expect(one).toMatch(/^0x/);
    expect(two).toMatch(/^0x/);
    expect(tagged.length).toBeGreaterThan(one.length);
  });
});

