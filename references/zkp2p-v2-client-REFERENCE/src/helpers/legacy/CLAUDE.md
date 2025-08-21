# Legacy Helpers - Development Context

## Overview
This directory contains legacy cryptographic and verification utilities from the initial ZKP2P implementation. These helpers were used for identity verification with Poseidon hash functions and Groth16 zero-knowledge proofs. The system has since migrated to the Reclaim protocol, but these utilities remain for reference and backward compatibility.

## Key Files and Structure
```
src/helpers/legacy/
├── poseidonHash.ts         # Poseidon hash functions for identity
├── registrationVkey.ts     # Groth16 verification key for registration
├── sendVkey.ts             # Groth16 verification key for send circuit
└── notaryVkey.ts           # Legacy notary verification key
```

## Architecture Patterns

### Poseidon Hash Functions
The Poseidon hash is a ZK-friendly hash function optimized for use in circuits:

```typescript
// poseidonHash.ts structure
export function poseidon1(input: bigint): bigint {
  // Single input Poseidon hash
  // Used for leaf node hashing in Merkle trees
}

export function poseidon2(left: bigint, right: bigint): bigint {
  // Two input Poseidon hash
  // Used for internal nodes in Merkle trees
}

export function poseidon3(a: bigint, b: bigint, c: bigint): bigint {
  // Three input Poseidon hash
  // Used for identity commitments
}
```

**Usage Pattern**:
```typescript
// Creating identity commitment
const identityCommitment = poseidon3(
  BigInt(emailHash),
  BigInt(phoneHash),
  BigInt(nonce)
);

// Building Merkle tree
const leaf = poseidon1(userData);
const parent = poseidon2(leftChild, rightChild);
```

### Groth16 Verification Keys
Verification keys enable on-chain proof verification without revealing the circuit:

```typescript
// registrationVkey.ts structure
export const registrationVkey = {
  protocol: "groth16",
  curve: "bn128",
  nPublic: 2,
  vk_alpha_1: ["20491192805390485299153009773594534940189261866228447918068658471970481763042", ...],
  vk_beta_2: [["6375614351688725206403948262868962793625744043794305715222011528459656738731", ...], ...],
  vk_gamma_2: [["10857046999023057135944570762232829481370756359578518086990519993285655852781", ...], ...],
  vk_delta_2: [["specific_values_for_circuit", ...], ...],
  IC: [["circuit_specific_constraints", ...], ...]
};
```

**Key Components**:
- **protocol**: Always "groth16" for these legacy keys
- **curve**: BN128 elliptic curve for Ethereum compatibility
- **nPublic**: Number of public inputs to the circuit
- **vk_alpha_1, vk_beta_2, vk_gamma_2, vk_delta_2**: Curve points for verification
- **IC**: Input constraints for public inputs

### Circuit Types

#### Registration Circuit (`registrationVkey.ts`)
**Purpose**: Verify user registration with identity provider
**Public Inputs**: 
- Identity commitment
- Registration timestamp

**Private Inputs**:
- Email hash
- Phone hash
- Nonce
- Merkle proof

#### Send Circuit (`sendVkey.ts`)
**Purpose**: Verify payment send operations
**Public Inputs**:
- Payment amount
- Recipient identifier
- Timestamp

**Private Inputs**:
- Sender credentials
- Payment proof
- Authorization signature

#### Notary Circuit (`notaryVkey.ts`)
**Purpose**: Legacy notary attestation verification
**Status**: Deprecated, replaced by Reclaim protocol

## Development Guidelines

### Understanding the Migration

#### From Poseidon/Groth16 to Reclaim
The system migrated from custom ZK circuits to Reclaim protocol:

**Old System**:
```typescript
// Custom circuit verification
const proof = generateGroth16Proof(inputs, witness);
const isValid = await verifyWithVkey(proof, publicInputs, registrationVkey);
```

**Current System**:
```typescript
// Reclaim protocol
const proof = await reclaimSDK.generateProof(claim);
const isValid = await reclaimVerifier.verify(proof);
```

### When These Are Still Used
1. **Legacy Data Migration**: Processing old user registrations
2. **Backward Compatibility**: Supporting old proof formats
3. **Reference Implementation**: Understanding original architecture
4. **Testing**: Comparing old vs new proof systems

### Security Considerations
**Important**: These verification keys are public constants and safe to expose. They enable verification but not proof generation.

## Testing Strategy

### Legacy Function Tests
```typescript
describe('Poseidon Hash', () => {
  it('should produce consistent hashes', () => {
    const input = BigInt('12345');
    const hash1 = poseidon1(input);
    const hash2 = poseidon1(input);
    expect(hash1).toBe(hash2);
  });
  
  it('should handle large BigInt values', () => {
    const largeInput = BigInt('0x' + 'f'.repeat(64));
    expect(() => poseidon1(largeInput)).not.toThrow();
  });
});
```

### Verification Key Tests
```typescript
describe('Verification Keys', () => {
  it('should have valid structure', () => {
    expect(registrationVkey.protocol).toBe('groth16');
    expect(registrationVkey.curve).toBe('bn128');
    expect(registrationVkey.IC).toBeInstanceOf(Array);
  });
});
```

## Common Tasks

### Verifying Legacy Proofs
```typescript
import { groth16 } from 'snarkjs';

const verifyLegacyProof = async (
  proof: any,
  publicSignals: string[],
  vKey: any
) => {
  try {
    const isValid = await groth16.verify(vKey, publicSignals, proof);
    return isValid;
  } catch (error) {
    console.error('Legacy proof verification failed:', error);
    return false;
  }
};
```

### Converting Legacy Data
```typescript
// Convert Poseidon commitment to Reclaim format
const migrateLegacyUser = (legacyCommitment: bigint) => {
  const reclaimIdentity = {
    legacyId: legacyCommitment.toString(),
    migratedAt: Date.now(),
    protocol: 'reclaim'
  };
  return reclaimIdentity;
};
```

## Integration Points

### Connected Systems
- **Smart Contracts**: Old verifier contracts may still reference these keys
- **Migration Scripts**: Used for transitioning user data
- **Backward Compatibility Layer**: Supports both proof systems
- **Testing Infrastructure**: Validates migration correctness

### Deprecation Status
- **Poseidon Hash**: Deprecated for new features, maintained for migration
- **Registration VKey**: Legacy support only
- **Send VKey**: Legacy support only
- **Notary VKey**: Fully deprecated, no active use

## Security Considerations

### Trusted Setup
These verification keys come from a trusted setup ceremony:
- Keys are generated once and immutable
- Toxic waste must be destroyed after generation
- Multiple participants ensure security
- Keys are safe to make public

### Circuit Constraints
- Fixed circuit logic (cannot be modified)
- Public inputs must match circuit design
- Private inputs never exposed
- Proof generation requires proving key (not included)

## Performance Considerations

### Hash Function Performance
```typescript
// Poseidon is optimized for circuits, not native execution
// For native hashing, use standard functions
const nativeHash = crypto.createHash('sha256');
const zkHash = poseidon1(value); // Slower in JS, faster in circuits
```

### Verification Cost
- On-chain verification: ~300,000 gas
- Off-chain verification: ~50ms
- Proof generation: 5-10 seconds (not done in client)

## Migration Guide

### Phase 1: Dual Support
Support both legacy and new systems:
```typescript
const verifyProof = async (proof: any) => {
  if (proof.protocol === 'groth16') {
    return verifyLegacyProof(proof);
  }
  return verifyReclaimProof(proof);
};
```

### Phase 2: Migration Incentives
Encourage users to migrate:
```typescript
if (user.proofType === 'legacy') {
  showMigrationPrompt();
  offerMigrationRewards();
}
```

### Phase 3: Deprecation
Eventually remove legacy support:
```typescript
// Future state
if (proof.protocol === 'groth16') {
  throw new Error('Legacy proofs no longer supported. Please migrate.');
}
```

## Lessons Learned

### What Worked
- Poseidon hash efficiency in circuits
- Groth16 proof succinctness
- On-chain verification feasibility
- Identity commitment model

### Challenges
- Complex trusted setup process
- Circuit rigidity (hard to update)
- High proof generation time
- Limited flexibility for new features

### Improvements in New System
- Reclaim protocol flexibility
- No trusted setup required
- Faster proof generation
- Easier feature additions
- Better user experience