import { ethers } from 'ethers';

export type Address = `0x${string}`;

export type AttestationTypedDataSpec = {
  primaryType: string;
  types: Record<string, { type: string; name: string }[]>;
};

export type AttestationResponse = {
  success: boolean;
  message: string;
  responseObject: {
    platform: string;
    actionType: string;
    signature: string;
    signer: string;
    domainSeparator: string;
    typeHash: string;
    typedDataSpec: AttestationTypedDataSpec;
    typedDataValue: { intentHash: string; releaseAmount: string; dataHash: string };
    proofInput: string;
    encodedPaymentDetails: string;
    metadata: string;
  };
  statusCode: number;
};

export function encodeVerifyPaymentData(params: {
  intentHash: Address;
  paymentProof: Address;
  data: Address;
}): Address {
  return ethers.utils.defaultAbiCoder.encode(
    ['tuple(bytes32,bytes,bytes)'],
    [[params.intentHash, params.paymentProof, params.data]]
  ) as Address;
}

export function encodeAddressAsBytes(addr: string): Address {
  return ethers.utils.defaultAbiCoder.encode(['address'], [addr]) as Address;
}

// Encodes a PaymentAttestation struct into bytes consumable by UnifiedPaymentVerifier
export function encodePaymentAttestation(attestation: AttestationResponse): Address {
  const abi = new ethers.utils.AbiCoder();
  const resp = attestation.responseObject;

  const td = resp.typedDataValue;
  const intentHash = td.intentHash as Address;
  const releaseAmount = ethers.BigNumber.from(td.releaseAmount);
  const dataHash = td.dataHash as Address;
  const signatures: string[] = [resp.signature];
  const encodedPaymentDetails = resp.encodedPaymentDetails as Address;

  if (!intentHash || !releaseAmount || !dataHash || !encodedPaymentDetails) {
    throw new Error('Attestation response missing required fields');
  }

  return abi.encode(
    ['tuple(bytes32,uint256,bytes32,bytes[],bytes,bytes)'],
    [[intentHash, releaseAmount, dataHash, signatures, encodedPaymentDetails, '0x']]
  ) as Address;
}

