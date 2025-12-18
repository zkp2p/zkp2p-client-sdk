import { Attribution } from 'ox/erc8021';
import type { Abi } from 'abitype';
import {
  type Hash,
  type Hex,
  type WalletClient,
  concatHex,
  encodeFunctionData,
} from 'viem';
import type { TxOverrides } from '../types';

// =============================================================================
// BASE BUILDER CODES - ERC-8021 Attribution
// =============================================================================
// Builder codes for Base Builder Rewards program.
// https://docs.base.org/base-chain/quickstart/builder-codes
// =============================================================================

/**
 * Base Builder Code for ZKP2P app (registered with Base).
 * This is ALWAYS included as the last code in attribution and cannot be overridden.
 */
export const BASE_BUILDER_CODE = 'bc_nbn6qkni';

/**
 * ZKP2P iOS app referrer code - pass via txOverrides.referrer
 */
export const ZKP2P_IOS_REFERRER = 'zkp2p-ios';

/**
 * ZKP2P Android app referrer code - pass via txOverrides.referrer
 */
export const ZKP2P_ANDROID_REFERRER = 'zkp2p-android';

/**
 * Generate the ERC-8021 attribution data suffix for transactions.
 *
 * The Base builder code (bc_nbn6qkni) is ALWAYS appended last and cannot be overridden.
 * Custom referrer codes are prepended before the base builder code.
 *
 * @param referrer - Optional referrer code(s) to prepend before the base builder code.
 *                   Can be a single string or array of strings.
 *                   These will appear BEFORE the base builder code in the attribution.
 * @returns Hex-encoded attribution suffix
 */
export function getAttributionDataSuffix(referrer?: string | string[]): Hex {
  const codes: string[] = [];

  if (referrer) {
    if (Array.isArray(referrer)) {
      codes.push(...referrer);
    } else {
      codes.push(referrer);
    }
  }

  // Base builder code is ALWAYS last
  codes.push(BASE_BUILDER_CODE);

  return Attribution.toDataSuffix({ codes });
}

/**
 * Append attribution data suffix to existing calldata
 *
 * @param calldata - Original transaction calldata
 * @param referrer - Optional referrer code(s) to prepend before the base builder code
 * @returns Calldata with attribution suffix appended
 */
export function appendAttributionToCalldata(calldata: Hex, referrer?: string | string[]): Hex {
  const suffix = getAttributionDataSuffix(referrer);
  return concatHex([calldata, suffix]);
}

/**
 * Request parameters for sendTransactionWithAttribution
 */
export interface AttributionRequest {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
}

type OverrideFields = Omit<TxOverrides, 'referrer'>;

/**
 * Send a contract transaction with ERC-8021 attribution.
 *
 * 1. Encodes the function call data using encodeFunctionData
 * 2. Appends the attribution suffix
 * 3. Sends via sendTransaction (wallet estimates gas automatically)
 *
 * @param walletClient - The viem wallet client
 * @param request - The request with abi, functionName, args, address, value
 * @param referrer - Optional referrer code(s) from txOverrides.referrer
 * @param overrides - Optional transaction overrides (gas, nonce, etc.)
 * @returns Transaction hash
 */
export async function sendTransactionWithAttribution(
  walletClient: WalletClient,
  request: AttributionRequest,
  referrer?: string | string[],
  overrides?: OverrideFields
): Promise<Hash> {
  // Encode the function call data
  const functionData = encodeFunctionData({
    abi: request.abi,
    functionName: request.functionName as any,
    args: request.args || [],
  });

  // Append attribution suffix
  const dataWithAttribution = appendAttributionToCalldata(functionData, referrer);

  const {
    gas,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    value,
    accessList,
    authorizationList,
  } = overrides ?? {};

  const optionalOverrides = {
    ...(gas !== undefined ? { gas } : {}),
    ...(gasPrice !== undefined ? { gasPrice } : {}),
    ...(maxFeePerGas !== undefined ? { maxFeePerGas } : {}),
    ...(maxPriorityFeePerGas !== undefined ? { maxPriorityFeePerGas } : {}),
    ...(nonce !== undefined ? { nonce } : {}),
    ...(accessList !== undefined ? { accessList } : {}),
    ...(authorizationList !== undefined ? { authorizationList } : {}),
  };

  // Send transaction - wallet/RPC handles gas estimation
  return walletClient.sendTransaction({
    to: request.address,
    data: dataWithAttribution,
    value: value ?? request.value,
    account: walletClient.account!,
    chain: walletClient.chain,
    ...optionalOverrides,
  } as any) as Promise<Hash>;
}
