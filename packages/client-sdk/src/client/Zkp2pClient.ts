import type { Address, Hash, PublicClient, WalletClient } from 'viem';
import { createPublicClient, http } from 'viem';
import { base, baseSepolia, hardhat, scroll, type Chain } from 'viem/chains';

import { DEFAULT_BASE_API_URL, DEFAULT_WITNESS_URL, DEPLOYED_ADDRESSES } from '../utils/constants';
import type {
  Zkp2pClientOptions,
  FulfillIntentParams,
  SignalIntentParams,
  CreateDepositParams,
  SignalIntentResponse,
  QuoteRequest,
  QuoteResponse,
  GetPayeeDetailsRequest,
  GetPayeeDetailsResponse,
  ValidatePayeeDetailsRequest,
  ValidatePayeeDetailsResponse,
  PostDepositDetailsRequest,
  WithdrawDepositParams,
  CancelIntentParams,
  ReleaseFundsToPayerParams,
  EscrowDepositView,
  EscrowIntentView,
} from '../types';
import { ValidationError } from '../errors';
import { fulfillIntent } from '../actions/fulfillIntent';
import { releaseFundsToPayer } from '../actions/releaseFundsToPayer';
import { signalIntent as _signalIntent } from '../actions/signalIntent';
import { createDeposit as _createDeposit } from '../actions/createDeposit';
import { withdrawDeposit as _withdrawDeposit } from '../actions/withdrawDeposit';
import { cancelIntent as _cancelIntent } from '../actions/cancelIntent';
import { apiGetQuote, apiGetPayeeDetails, apiValidatePayeeDetails } from '../adapters/api';
import { ESCROW_ABI } from '../utils/contracts';
import { parseEscrowDepositView, parseEscrowIntentView } from '../utils/escrowViewParsers';
export class Zkp2pClient {
  readonly walletClient: WalletClient;
  readonly apiKey: string;
  readonly chainId: number;
  readonly baseApiUrl: string;
  readonly witnessUrl: string;
  readonly addresses: {
    escrow: Address;
    usdc: Address;
    venmo: Address;
    revolut: Address;
    cashapp: Address;
    wise: Address;
    mercadopago: Address;
    zelle: Address;
    gatingService: Address;
    zkp2pWitnessSigner: Address;
  };
  readonly publicClient: PublicClient;

  constructor(opts: Zkp2pClientOptions) {
    this.walletClient = opts.walletClient;
    this.apiKey = opts.apiKey;
    this.chainId = opts.chainId;
    this.baseApiUrl = opts.baseApiUrl || DEFAULT_BASE_API_URL;
    this.witnessUrl = opts.witnessUrl || DEFAULT_WITNESS_URL;

    const contractAddresses = DEPLOYED_ADDRESSES[this.chainId];
    if (!contractAddresses) {
      const supportedChainIds = Object.keys(DEPLOYED_ADDRESSES);
      const supportedChainNames: Record<number, string> = {
        8453: 'Base',
        84532: 'Base Sepolia',
        31337: 'Hardhat',
        534351: 'Scroll',
      };
      const supportedList = supportedChainIds
        .map((id) => `${id} (${supportedChainNames[Number(id)] || 'Unknown'})`)
        .join(', ');

      throw new ValidationError(
        `Unsupported chain ID: ${opts.chainId}. Supported chains are: ${supportedList}`,
        'chainId'
      );
    }

    this.addresses = {
      escrow: contractAddresses.escrow,
      usdc: contractAddresses.usdc,
      venmo: contractAddresses.venmo,
      revolut: contractAddresses.revolut,
      cashapp: contractAddresses.cashapp,
      wise: contractAddresses.wise,
      mercadopago: contractAddresses.mercadopago,
      zelle: contractAddresses.zelle,
      gatingService: contractAddresses.gatingService,
      zkp2pWitnessSigner: contractAddresses.zkp2pWitnessSigner,
    };

    const supportedChains: Record<number, Chain> = {
      [base.id]: base,
      [hardhat.id]: hardhat,
      [scroll.id]: scroll,
      [baseSepolia.id]: baseSepolia,
    };
    const selectedChainObject = supportedChains[this.chainId];
    if (!selectedChainObject) {
      throw new ValidationError(
        `Chain ID ${this.chainId} is not configured properly. Please check the chain configuration.`,
        'chainId'
      );
    }

    this.publicClient = createPublicClient({
      chain: selectedChainObject,
      transport: http(opts.rpcUrl),
    }) as PublicClient;
  }

  // The methods below will be wired in subsequent steps by porting actions/adapters

  async fulfillIntent(_params: FulfillIntentParams): Promise<Hash> {
    return fulfillIntent(this.walletClient, this.publicClient, this.addresses.escrow, _params);
  }

  async signalIntent(_params: SignalIntentParams): Promise<SignalIntentResponse & { txHash?: Hash }> {
    return _signalIntent(
      this.walletClient,
      this.publicClient,
      this.addresses.escrow,
      this.chainId,
      _params,
      this.apiKey,
      this.baseApiUrl
    );
  }

  async createDeposit(_params: CreateDepositParams): Promise<{ depositDetails: PostDepositDetailsRequest[]; hash: Hash }> {
    return _createDeposit(
      this.walletClient,
      this.publicClient,
      this.addresses.escrow,
      this.chainId,
      _params,
      this.apiKey,
      this.baseApiUrl
    );
  }

  async withdrawDeposit(_params: WithdrawDepositParams): Promise<Hash> {
    return _withdrawDeposit(this.walletClient, this.publicClient, this.addresses.escrow, _params);
  }

  async cancelIntent(_params: CancelIntentParams): Promise<Hash> {
    return _cancelIntent(this.walletClient, this.publicClient, this.addresses.escrow, _params);
  }

  async releaseFundsToPayer(_params: ReleaseFundsToPayerParams): Promise<Hash> {
    return releaseFundsToPayer(this.walletClient, this.publicClient, this.addresses.escrow, _params);
  }

  async getQuote(_params: QuoteRequest): Promise<QuoteResponse> {
    return apiGetQuote(_params, this.baseApiUrl);
  }

  async getPayeeDetails(_params: GetPayeeDetailsRequest): Promise<GetPayeeDetailsResponse> {
    return apiGetPayeeDetails(_params, this.apiKey, this.baseApiUrl);
  }

  async validatePayeeDetails(_params: ValidatePayeeDetailsRequest): Promise<ValidatePayeeDetailsResponse> {
    return apiValidatePayeeDetails(_params, this.apiKey, this.baseApiUrl);
  }

  async getAccountDeposits(ownerAddress: Address): Promise<EscrowDepositView[]> {
    const raw = await this.publicClient.readContract({
      address: this.addresses.escrow,
      abi: ESCROW_ABI,
      functionName: 'getAccountDeposits',
      args: [ownerAddress],
    });
    if (!raw) return [] as any;
    return (raw as any[]).map(parseEscrowDepositView);
  }

  async getAccountIntent(ownerAddress: Address): Promise<EscrowIntentView | null> {
    const raw = await this.publicClient.readContract({
      address: this.addresses.escrow,
      abi: ESCROW_ABI,
      functionName: 'getAccountIntent',
      args: [ownerAddress],
    });
    if (!raw) return null;
    const iv: any = raw as any;
    const zeroHash = '0x' + '0'.repeat(64);
    if (!iv.intentHash || iv.intentHash.toLowerCase() === zeroHash) return null;
    return parseEscrowIntentView(iv);
  }

  getUsdcAddress(): Address {
    return this.addresses.usdc;
  }

  getDeployedAddresses(): typeof this.addresses {
    return this.addresses;
  }
}
