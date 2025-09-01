import type { Hash, PublicClient, WalletClient } from 'viem';
import { ESCROW_ABI } from '../utils/contracts';
import type {
  IntentSignalRequest,
  SignalIntentParams,
  SignalIntentResponse,
} from '../types';
import { apiSignalIntent } from '../adapters/api';
import { currencyInfo } from '../utils/currency';
import { ValidationError, ZKP2PError, ErrorCode } from '../errors';
import { parseAPIError } from '../errors/utils';

export async function signalIntent(
  walletClient: WalletClient,
  publicClient: PublicClient,
  escrowAddress: string,
  chainId: number,
  params: SignalIntentParams,
  apiKey: string,
  baseApiUrl: string,
  timeoutMs?: number
): Promise<SignalIntentResponse & { txHash?: Hash }> {
  try {
    const currencyCodeHash = currencyInfo[params.currency]?.currencyCodeHash;
    if (!currencyCodeHash) {
      throw new ValidationError(
        `Unsupported currency: ${params.currency}.`,
        'currency'
      );
    }
    const apiRequest: IntentSignalRequest = {
      processorName: params.processorName,
      depositId: params.depositId,
      tokenAmount: params.tokenAmount,
      payeeDetails: params.payeeDetails,
      toAddress: params.toAddress,
      fiatCurrencyCode: currencyCodeHash,
      chainId: chainId.toString(),
    };
    const apiResponse = await apiSignalIntent(apiRequest, apiKey, baseApiUrl, undefined, timeoutMs);
    if (!apiResponse.success) {
      throw new ZKP2PError(apiResponse.message || 'Failed to signal intent', ErrorCode.API, { apiResponse });
    }
    const intentData = apiResponse.responseObject.intentData;
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
    const hash = await walletClient.writeContract(request);
    params.onSuccess?.({ hash });
    if (params.onMined) {
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === 'reverted') {
        throw new ZKP2PError('Transaction reverted', ErrorCode.CONTRACT, { txHash: hash });
      }
      params.onMined({ hash });
    }
    return { ...apiResponse, txHash: hash };
  } catch (error) {
    const zkp2pError = error instanceof ZKP2PError ? error : new ZKP2PError((error as Error).message || 'Unknown error', ErrorCode.UNKNOWN, { originalError: error });
    params.onError?.(zkp2pError);
    throw zkp2pError;
  }
}
