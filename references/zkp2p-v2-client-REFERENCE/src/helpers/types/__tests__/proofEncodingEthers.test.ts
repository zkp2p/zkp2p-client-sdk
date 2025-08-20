import { describe, it, expect } from 'vitest';
import { encodeProofAsBytes, encodeMultipleProofs, encodeProofAndPaymentMethodAsBytes, Proof } from '../proxyProof';

describe('Proof Encoding with Ethers v6', () => {
  // Sample proof data for testing
  const sampleProof: Proof = {
    claimInfo: {
      provider: 'venmo-payment',
      parameters: '{"amount":"100.50","currency":"USD"}',
      context: '{"transactionId":"123456789"}'
    },
    signedClaim: {
      claim: {
        identifier: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`,
        owner: '0x742d35cC6634C0532925A3b844Bc9E7595F26Fd9' as `0x${string}`,
        timestampS: BigInt(1704067200), // Jan 1, 2024
        epoch: BigInt(1)
      },
      signatures: [
        '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789' as `0x${string}`,
        '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba' as `0x${string}`
      ]
    },
    isAppclipProof: false
  };

  it('should encode a single proof correctly', () => {
    const encoded = encodeProofAsBytes(sampleProof);
    
    // Verify it's a valid hex string
    expect(encoded).toMatch(/^0x[0-9a-fA-F]+$/);
    
    // Verify it's not empty
    expect(encoded.length).toBeGreaterThan(2);
    
    // The encoding should be deterministic
    const encoded2 = encodeProofAsBytes(sampleProof);
    expect(encoded).toBe(encoded2);
  });

  it('should encode multiple proofs correctly', () => {
    const proof2: Proof = {
      ...sampleProof,
      claimInfo: {
        ...sampleProof.claimInfo,
        provider: 'cashapp-payment'
      },
      isAppclipProof: true
    };
    
    const proofs = [sampleProof, proof2];
    const encoded = encodeMultipleProofs(proofs);
    
    // Verify it's a valid hex string
    expect(encoded).toMatch(/^0x[0-9a-fA-F]+$/);
    
    // Should be longer than a single proof encoding
    const singleEncoded = encodeProofAsBytes(sampleProof);
    expect(encoded.length).toBeGreaterThan(singleEncoded.length);
  });

  it('should encode proof with payment method correctly', () => {
    const proofBytes = encodeProofAsBytes(sampleProof);
    const paymentMethod = 1;
    
    const encoded = encodeProofAndPaymentMethodAsBytes(proofBytes, paymentMethod);
    
    // Verify it's a valid hex string
    expect(encoded).toMatch(/^0x[0-9a-fA-F]+$/);
    
    // Should be slightly longer than the proof alone (payment method is uint8 = 1 byte)
    expect(encoded.length).toBe(proofBytes.length + 2); // 2 hex chars = 1 byte
  });

  it('should handle edge cases correctly', () => {
    // Test with empty signatures array
    const proofWithNoSignatures: Proof = {
      ...sampleProof,
      signedClaim: {
        ...sampleProof.signedClaim,
        signatures: []
      }
    };
    
    const encoded1 = encodeProofAsBytes(proofWithNoSignatures);
    expect(encoded1).toMatch(/^0x[0-9a-fA-F]+$/);
    
    // Test with empty context
    const proofWithEmptyContext: Proof = {
      ...sampleProof,
      claimInfo: {
        ...sampleProof.claimInfo,
        context: ''
      }
    };
    
    const encoded2 = encodeProofAsBytes(proofWithEmptyContext);
    expect(encoded2).toMatch(/^0x[0-9a-fA-F]+$/);
  });

  it('should correctly convert bigint to uint32', () => {
    // Test with large timestamps that need to fit in uint32
    const proofWithLargeTimestamp: Proof = {
      ...sampleProof,
      signedClaim: {
        ...sampleProof.signedClaim,
        claim: {
          ...sampleProof.signedClaim.claim,
          timestampS: BigInt(4294967295), // Max uint32
          epoch: BigInt(4294967295) // Max uint32
        }
      }
    };
    
    const encoded = encodeProofAsBytes(proofWithLargeTimestamp);
    expect(encoded).toMatch(/^0x[0-9a-fA-F]+$/);
  });
});