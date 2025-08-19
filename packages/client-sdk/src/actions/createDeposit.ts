import type { Hash, PublicClient, WalletClient } from 'viem';
import { ESCROW_ABI, ERC20_ABI } from '../utils/contracts';
import type {
  CreateDepositParams,
  PostDepositDetailsRequest,
  DepositVerifierData,
  OnchainCurrency,
} from '../types';
import { apiPostDepositDetails } from '../adapters/api';
import { DEPLOYED_ADDRESSES } from '../utils/constants';
import { ethers } from 'ethers';
import { mapConversionRatesToOnchain } from '../utils/currency';
import { ValidationError, ZKP2PError, ContractError } from '../errors';

export async function createDeposit(
  walletClient: WalletClient,
  publicClient: PublicClient,
  escrowAddress: string,
  chainId: number,
  params: CreateDepositParams,
  apiKey: string,
  baseApiUrl: string
): Promise<{ depositDetails: PostDepositDetailsRequest[]; hash: Hash }> {
  try {
    if (!walletClient.account) throw new Error('Wallet not connected');
    const currentAllowance = (await publicClient.readContract({
      address: params.token as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [walletClient.account.address, escrowAddress as `0x${string}`],
    })) as bigint;

    if (currentAllowance < (params.amount as bigint)) {
      const { request: approveRequest } = await publicClient.simulateContract({
        address: params.token as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [escrowAddress as `0x${string}`, params.amount as bigint],
        account: walletClient.account,
      });
      const approveHash = await walletClient.writeContract(approveRequest);
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    const apiResponses = await Promise.all(
      (params.processorNames as string[]).map((processorName, index) => {
        if (!params.depositData[index]) throw new Error('Invalid deposit data');
        return apiPostDepositDetails(
          { depositData: params.depositData[index] || {}, processorName },
          apiKey,
          baseApiUrl
        );
      })
    );
    if (!apiResponses.every((r) => r.success)) {
      const failed = apiResponses.find((r) => !r.success);
      throw new Error(failed?.message || 'Failed to create deposit details');
    }
    const hashedOnchainIds = apiResponses.map((r) => r.responseObject.hashedOnchainId);

    const verifierAddresses = (params.processorNames as string[]).map((processorName) => {
      const addr = (DEPLOYED_ADDRESSES as any)?.[chainId]?.[processorName];
      if (!addr) throw new ValidationError(`Processor ${processorName} not supported on chain ${chainId}`, 'processorName');
      return addr;
    });

    const depositDetails: PostDepositDetailsRequest[] = (params.depositData as any[]).map((depositData, index) => ({
      depositData: depositData || {},
      processorName: (params.processorNames as string[])[index]!,
    }));

    const witnessData = ethers.utils.defaultAbiCoder.encode(
      ['address[]'],
      [[(DEPLOYED_ADDRESSES as any)?.[chainId]?.zkp2pWitnessSigner]]
    );

    const verifierData: DepositVerifierData[] = hashedOnchainIds.map((hid) => ({
      payeeDetails: hid as string,
      intentGatingService: (DEPLOYED_ADDRESSES as any)?.[chainId]?.gatingService as `0x${string}`,
      data: witnessData as `0x${string}`,
    }));

    const currencies: OnchainCurrency[][] = mapConversionRatesToOnchain(
      params.conversionRates as any,
      verifierAddresses.length
    );

    const { request } = await publicClient.simulateContract({
      address: escrowAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'createDeposit',
      args: [
        params.token,
        params.amount,
        params.intentAmountRange,
        verifierAddresses,
        verifierData,
        currencies,
      ],
      account: walletClient.account,
    });
    const hash = await walletClient.writeContract(request);
    params.onSuccess?.({ hash });
    if (params.onMined) {
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === 'reverted') {
        throw new ContractError('Transaction reverted', { txHash: hash } as any);
      }
      params.onMined({ hash });
    }
    return { depositDetails, hash };
  } catch (error) {
    const zkp2pError =
      error instanceof ZKP2PError
        ? error
        : new ZKP2PError((error as Error).message || 'Unknown error occurred', { originalError: error } as any);
    params.onError?.(zkp2pError);
    throw zkp2pError;
  }
}
