import { describe, it, expect } from 'vitest';
import { parseExtensionProof, toHexSignature } from '../extension/proof';

describe('extension proof helper', () => {
  it('converts array signature to hex', () => {
    const hex = toHexSignature([1, 255, 16]);
    expect(hex).toBe('0x01ff10');
  });

  it('parses a minimal extension proof payload', () => {
    const payload = {
      claim: {
        provider: 'wise',
        parameters: '{}',
        context: '',
        identifier: '0x' + '00'.repeat(32),
        owner: '0x0000000000000000000000000000000000000001',
        timestampS: 1,
        epoch: 1,
      },
      signatures: { claimSignature: [0, 1, 2] },
    };
    const proof = parseExtensionProof(payload);
    expect(proof.claimInfo.provider).toBe('wise');
    expect(proof.signedClaim.signatures[0]).toMatch(/^0x[0-9a-f]+$/);
  });
});

