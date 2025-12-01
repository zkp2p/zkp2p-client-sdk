import { describe, it, expect } from 'vitest';
import { encodeProofAsBytes, encodeProofAndPaymentMethodAsBytes, type ReclaimProof } from '../utils/proofEncoding';

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

describe('proofEncoding', () => {
  it('encodes a single proof to bytes', () => {
    const bytes = encodeProofAsBytes(baseProof);
    expect(bytes.startsWith('0x')).toBe(true);
    expect(bytes.length).toBeGreaterThan(10);
  });

  it('prefixes paymentMethod when provided', () => {
    const proofBytes = encodeProofAsBytes(baseProof) as `0x${string}`;
    const packed = encodeProofAndPaymentMethodAsBytes(proofBytes, 5);
    expect(packed.startsWith('0x')).toBe(true);
    expect(packed.length).toBeGreaterThan(proofBytes.length);
  });
});

