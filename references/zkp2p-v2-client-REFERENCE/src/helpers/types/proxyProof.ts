import { AbiCoder, solidityPacked, keccak256 } from "ethers";
import canonicalize from 'canonicalize';

export interface Proof {
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
  identifier: `0x${string}`;  // bytes32 in hex format
  owner: `0x${string}`;      // address in hex format
  timestampS: bigint;
  epoch: bigint;
}

export interface SignedClaim {
  claim: CompleteClaimData;
  signatures: `0x${string}`[];  // hex signatures
}

const byteArrayToHexString = (byteArray: { [key: number]: number }): `0x${string}` => {
  return `0x${Object.values(byteArray)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')}`;
};

export const parseExtensionProof = (proofObject: any): Proof => {
  return {
    claimInfo: {
      provider: proofObject.claim.provider,
      parameters: proofObject.claim.parameters,
      context: proofObject.claim.context
    },
    signedClaim: {
      claim: {
        identifier: proofObject.claim.identifier,
        owner: proofObject.claim.owner,
        timestampS: BigInt(proofObject.claim.timestampS),
        epoch: BigInt(proofObject.claim.epoch)
      },
      signatures: [byteArrayToHexString(proofObject.signatures.claimSignature)]
    },
    isAppclipProof: false
  };
};


/**
 * Encodes a proof object into bytes format for smart contract consumption.
 * 
 * The encoding matches the Solidity struct: IReclaimVerifier.ReclaimProof
 * which expects the following format:
 * - claimInfo (tuple): provider, parameters, context
 * - signedClaim (tuple): claim (identifier, owner, timestampS, epoch), signatures[]
 * - isAppclipProof (bool)
 * 
 * Important: This function produces the same encoded output as the original ethers v5
 * implementation, ensuring backward compatibility with deployed smart contracts.
 * 
 * @param proof The proof object to encode
 * @returns Hex-encoded bytes representation of the proof
 */
export const encodeProofAsBytes = (proof: Proof): string => {
  // Convert bigint to number for uint32 encoding
  const encodableProof = proofToEncodableProof(proof);

  // Create AbiCoder instance
  const abiCoder = AbiCoder.defaultAbiCoder();

  // Define the encoding string that matches the original ethers v5 format
  const PROOF_ENCODING_STRING = "(tuple(string provider, string parameters, string context) claimInfo, tuple(tuple(bytes32 identifier, address owner, uint32 timestampS, uint32 epoch) claim, bytes[] signatures) signedClaim, bool isAppclipProof)";

  // Encode the proof using ethers v6 AbiCoder
  return abiCoder.encode(
    [PROOF_ENCODING_STRING],
    [[
      encodableProof.claimInfo,
      encodableProof.signedClaim,
      encodableProof.isAppclipProof
    ]]
  );
};


export const encodeProofAndPaymentMethodAsBytes = (proof: string, paymentMethod: number): string => {
  return solidityPacked(['uint8', 'bytes'], [paymentMethod, proof]);
};

/**
 * Encodes multiple proof objects into bytes format for smart contract consumption.
 * 
 * This function is used when multiple proofs need to be submitted together,
 * such as when verifying multiple payment transactions in a single call.
 * 
 * The encoding format is a concatenation of multiple proof tuples, where each
 * proof follows the same structure as encodeProofAsBytes.
 * 
 * Important: The proofs are encoded as separate top-level parameters, not as
 * an array, to match the expected smart contract interface.
 * 
 * @param proofs Array of proof objects to encode
 * @returns Hex-encoded bytes representation of all proofs
 */
export const encodeMultipleProofs = (proofs: Proof[]): string => {
  // Create AbiCoder instance
  const abiCoder = AbiCoder.defaultAbiCoder();

  // Define the encoding string for a single proof
  const SINGLE_PROOF_TYPE = "tuple(tuple(string provider, string parameters, string context) claimInfo, tuple(tuple(bytes32 identifier, address owner, uint32 timestampS, uint32 epoch) claim, bytes[] signatures) signedClaim, bool isAppclipProof)";

  // Create the encoding string for multiple proofs
  const types = proofs.map(() => SINGLE_PROOF_TYPE);

  // Map proofs to the format expected by the encoding
  const values = proofs.map(proof => {
    const encodableProof = proofToEncodableProof(proof);
    return [
      encodableProof.claimInfo,
      encodableProof.signedClaim,
      encodableProof.isAppclipProof
    ];
  });

  // Encode all proofs as separate parameters
  return abiCoder.encode(types, values);
};


/**
 * Converts proof fields to the correct types for ABI encoding.
 * 
 * Key conversions:
 * - timestampS: BigInt -> number (for uint32)
 * - epoch: BigInt -> number (for uint32)
 * 
 * This is necessary because the smart contract expects uint32 values,
 * but JavaScript BigInt cannot be directly encoded as uint32.
 */
const proofToEncodableProof = (proof: Proof) => {
  // Maximum value for uint32 is 2^32 - 1 = 4294967295
  const UINT32_MAX = 4294967295n;

  // Check bounds for timestampS
  // Note: Unix timestamp 4294967295 corresponds to February 7, 2106
  // This is beyond the Year 2038 problem (January 19, 2038) which affects
  // systems using signed 32-bit integers, but we use unsigned uint32
  if (proof.signedClaim.claim.timestampS > UINT32_MAX) {
    throw new Error(
      `Timestamp value ${proof.signedClaim.claim.timestampS} exceeds maximum uint32 value (${UINT32_MAX}). ` +
      `This would cause an overflow when converting to a 32-bit unsigned integer.`
    );
  }

  // Check bounds for epoch
  if (proof.signedClaim.claim.epoch > UINT32_MAX) {
    throw new Error(
      `Epoch value ${proof.signedClaim.claim.epoch} exceeds maximum uint32 value (${UINT32_MAX}). ` +
      `This would cause an overflow when converting to a 32-bit unsigned integer.`
    );
  }

  return {
    claimInfo: proof.claimInfo,
    signedClaim: {
      claim: {
        identifier: proof.signedClaim.claim.identifier,
        owner: proof.signedClaim.claim.owner,
        timestampS: Number(proof.signedClaim.claim.timestampS),
        epoch: Number(proof.signedClaim.claim.epoch)
      },
      signatures: proof.signedClaim.signatures
    },
    isAppclipProof: proof.isAppclipProof
  };
};

/**
 * Creates the standard string to sign for a claim.
 * This data is what the witness will sign when it successfully
 * verifies a claim.
 */
export function createSignDataForClaim(data: CompleteClaimData | ClaimInfo): string {
  const identifier = 'identifier' in data
    ? data.identifier
    : getIdentifierFromClaimInfo(data as ClaimInfo)
  if (!('owner' in data)) {
    throw new Error('Cannot create sign data without owner field');
  }

  const completeData = data as CompleteClaimData;
  const lines = [
    identifier,
    // we lowercase the owner to ensure that the
    // ETH addresses always serialize the same way
    completeData.owner.toLowerCase(),
    completeData.timestampS.toString(),
    completeData.epoch.toString(),
  ]

  return lines.join('\n')
}

/**
 * Generates a unique identifier for given claim info
 * @param info
 * @returns
 */
export function getIdentifierFromClaimInfo(info: ClaimInfo): string {
  //re-canonicalize context if it's not empty
  if (info.context?.length > 0) {
    try {
      const ctx = JSON.parse(info.context)
      info.context = canonicalize(ctx)!
    } catch (e) {
      throw new Error('unable to parse non-empty context. Must be JSON')
    }
  }

  const str = `${info.provider}\n${info.parameters}\n${info.context || ''}`

  return keccak256(
    new TextEncoder().encode(str)
  ).toLowerCase()
}