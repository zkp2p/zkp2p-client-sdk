import type { Hash, PublicClient, WalletClient } from 'viem';
import { ESCROW_ABI } from '../utils/contracts';
import type {
  IntentSignalRequest,
  SignalIntentParams,
  SignalIntentResponse,
} from '../types';
import { apiSignalIntent } from '../adapters/api';
import { currencyInfo } from '../utils/currency';
import { ValidationError, ZKP2PError } from '../errors';
import { parseContractError } from '../errors/utils';

export async function signalIntent(
  walletClient: WalletClient,
  publicClient: PublicClient,
  escrowAddress: string,
  chainId: number,
  params: SignalIntentParams,
  apiKey: string,
  baseApiUrl: string
): Promise<SignalIntentResponse & { txHash?: Hash }> {
  try {
    const currencyCodeHash = currencyInfo[params.currency]?.currencyCodeHash;
    if (!currencyCodeHash) {
      throw new ValidationError(
        `Unsupported currency: ${params.currency}. Supported currencies are: ${Object.keys(currencyInfo).join(', ')}`,
        'currency'
      );
    }
    // First, call the API to verify and get signed intent
    const apiRequest: IntentSignalRequest = {
      processorName: params.processorName,
      depositId: params.depositId,
      tokenAmount: params.tokenAmount,
      payeeDetails: params.payeeDetails,
      toAddress: params.toAddress,
      fiatCurrencyCode: currencyCodeHash,
      chainId: chainId.toString(),
    };
    const apiResponse = await apiSignalIntent(apiRequest, apiKey, baseApiUrl);
    if (!apiResponse.success) {
      throw new ZKP2PError(
        apiResponse.message || 'Failed to signal intent',
        undefined,
        { apiResponse }
      );
    }

    const intentData = apiResponse.responseObject.intentData;

    // Then, call the escrow contract
    let hash: Hash;
    try {
      const { request } = await publicClient.simulateContract({
        address: escrowAddress as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'signalIntent',
        args: [
          BigInt(intentData.depositId),
          BigInt(intentData.tokenAmount),
          intentData.recipientAddress as `0x${string}`,
          intentData.verifierAddress as `0x${string}`,
          intentData.currencyCodeHash as `0x${string}`,
          intentData.gatingServiceSignature as `0x${string}`,
        ],
        account: walletClient.account,
      });

      hash = await walletClient.writeContract(request);
    } catch (contractError) {
      throw parseContractError(contractError);
    }

    if (params.onSuccess) {
      params.onSuccess({ hash });
    }

    if (params.onMined) {
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === 'reverted') {
        throw new ZKP2PError('Transaction reverted', undefined, {
          txHash: hash,
          receipt,
        });
      }
      params.onMined({ hash });
    }

    return { ...apiResponse, txHash: hash };
  } catch (error) {
    const zkp2pError =
      error instanceof ZKP2PError
        ? error
        : new ZKP2PError(
            (error as Error).message || 'Unknown error occurred',
            undefined,
            { originalError: error }
          );

    if (params.onError) {
      params.onError(zkp2pError);
    }
    throw zkp2pError;
  }
}
