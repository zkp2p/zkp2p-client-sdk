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
  TimeoutConfig,
  GetOwnerDepositsRequest,
  GetOwnerDepositsResponse,
  GetOwnerIntentsRequest,
  GetOwnerIntentsResponse,
  GetIntentsByDepositRequest,
  GetIntentsByDepositResponse,
  GetIntentsByTakerRequest,
  GetIntentsByTakerResponse,
  GetIntentsByRecipientRequest,
  GetIntentsByRecipientResponse,
  GetIntentByHashRequest,
  GetIntentByHashResponse,
  GetDepositByIdRequest,
  GetDepositByIdResponse,
  GetDepositsOrderStatsRequest,
  GetDepositsOrderStatsResponse,
  ListPayeesResponse,
  RegisterPayeeDetailsRequest,
  RegisterPayeeDetailsResponse,
} from '../types';
import { withTimeout, DEFAULT_TIMEOUTS } from '../utils/timeout';
import { ValidationError } from '../errors';
import { logger } from '../utils/logger';
import { fulfillIntent } from '../actions/fulfillIntent';
import { releaseFundsToPayer } from '../actions/releaseFundsToPayer';
import { signalIntent as _signalIntent } from '../actions/signalIntent';
import { createDeposit as _createDeposit } from '../actions/createDeposit';
import { withdrawDeposit as _withdrawDeposit } from '../actions/withdrawDeposit';
import { cancelIntent as _cancelIntent } from '../actions/cancelIntent';
import { 
  apiGetQuote, 
  apiGetPayeeDetails, 
  apiValidatePayeeDetails,
  apiGetOwnerDeposits,
  apiGetOwnerIntents,
  apiGetIntentsByDeposit,
  apiGetIntentsByTaker,
  apiGetIntentByHash,
  apiGetDepositById,
  apiGetDepositsOrderStats
} from '../adapters/api';
import { apiPostDepositDetails } from '../adapters/api';
import { ESCROW_ABI } from '../utils/contracts';
import { parseEscrowDepositView, parseEscrowIntentView } from '../utils/escrowViewParsers';
/**
 * ZKP2P Client for interacting with the ZKP2P protocol
 * 
 * @example
 * ```typescript
 * const client = new Zkp2pClient({
 *   walletClient,
 *   apiKey: 'YOUR_API_KEY',
 *   chainId: 8453, // Base mainnet
 * });
 * ```
 */
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
  readonly timeouts: Required<TimeoutConfig>;
  readonly authorizationToken?: string;

  constructor(opts: Zkp2pClientOptions) {
    logger.debug('[Zkp2pClient] Initializing with options:', { 
      chainId: opts.chainId,
      baseApiUrl: opts.baseApiUrl || DEFAULT_BASE_API_URL,
      witnessUrl: opts.witnessUrl || DEFAULT_WITNESS_URL
    });
    
    this.walletClient = opts.walletClient;
    this.apiKey = opts.apiKey;
    this.chainId = opts.chainId;
    this.baseApiUrl = opts.baseApiUrl || DEFAULT_BASE_API_URL;
    this.witnessUrl = opts.witnessUrl || DEFAULT_WITNESS_URL;
    this.authorizationToken = opts.authorizationToken;

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

    // Set up timeout configuration with defaults
    this.timeouts = {
      api: opts.timeouts?.api ?? DEFAULT_TIMEOUTS.API,
      transaction: opts.timeouts?.transaction ?? DEFAULT_TIMEOUTS.TRANSACTION,
      proofGeneration: opts.timeouts?.proofGeneration ?? DEFAULT_TIMEOUTS.PROOF_GENERATION,
      extension: opts.timeouts?.extension ?? DEFAULT_TIMEOUTS.EXTENSION,
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

  /**
   * Fulfill an intent by providing payment proofs
   * @param _params - Parameters for fulfilling the intent
   * @returns Transaction hash
   */
  async fulfillIntent(_params: FulfillIntentParams): Promise<Hash> {
    logger.debug('[Zkp2pClient] Fulfilling intent:', { intentHash: _params.intentHash });
    return fulfillIntent(this.walletClient, this.publicClient, this.addresses.escrow, _params);
  }

  /**
   * Signal an intent to use a deposit for payment
   * @param _params - Parameters for signaling the intent
   * @returns API response with transaction hash
   */
  async signalIntent(_params: SignalIntentParams): Promise<SignalIntentResponse & { txHash?: Hash }> {
    logger.debug('[Zkp2pClient] Signaling intent:', { depositId: _params.depositId });
    return _signalIntent(
      this.walletClient,
      this.publicClient,
      this.addresses.escrow,
      this.chainId,
      _params,
      this.apiKey,
      this.baseApiUrl,
      this.timeouts.api
    );
  }

  /**
   * Create a new deposit on-chain
   * @param _params - Parameters for creating the deposit
   * @returns Deposit details and transaction hash
   */
  async createDeposit(_params: CreateDepositParams): Promise<{ depositDetails: PostDepositDetailsRequest[]; hash: Hash }> {
    logger.debug('[Zkp2pClient] Creating deposit:', { amount: _params.amount, processorNames: _params.processorNames });
    return _createDeposit(
      this.walletClient,
      this.publicClient,
      this.addresses.escrow,
      this.chainId,
      _params,
      this.apiKey,
      this.baseApiUrl,
      this.timeouts.api
    );
  }

  /**
   * Withdraw a deposit from the escrow
   * @param _params - Parameters for withdrawing the deposit
   * @returns Transaction hash
   */
  async withdrawDeposit(_params: WithdrawDepositParams): Promise<Hash> {
    logger.debug('[Zkp2pClient] Withdrawing deposit:', { depositId: _params.depositId });
    return _withdrawDeposit(this.walletClient, this.publicClient, this.addresses.escrow, _params);
  }

  /**
   * Cancel a previously signaled intent
   * @param _params - Parameters for canceling the intent
   * @returns Transaction hash
   */
  async cancelIntent(_params: CancelIntentParams): Promise<Hash> {
    logger.debug('[Zkp2pClient] Canceling intent:', { intentHash: _params.intentHash });
    return _cancelIntent(this.walletClient, this.publicClient, this.addresses.escrow, _params);
  }

  /**
   * Release funds back to the payer
   * @param _params - Parameters for releasing funds
   * @returns Transaction hash
   */
  async releaseFundsToPayer(_params: ReleaseFundsToPayerParams): Promise<Hash> {
    logger.debug('[Zkp2pClient] Releasing funds to payer:', { intentHash: _params.intentHash });
    return releaseFundsToPayer(this.walletClient, this.publicClient, this.addresses.escrow, _params);
  }

  /**
   * Get quotes for a potential swap
   * @param _params - Quote request parameters
   * @returns Quote response with available quotes
   */
  async getQuote(_params: QuoteRequest): Promise<QuoteResponse> {
    logger.debug('[Zkp2pClient] Getting quote:', _params);
    return apiGetQuote(_params, this.baseApiUrl, this.timeouts.api);
  }

  /**
   * Get payee details for a specific deposit
   * @param _params - Request parameters
   * @returns Payee details response
   */
  async getPayeeDetails(_params: GetPayeeDetailsRequest): Promise<GetPayeeDetailsResponse> {
    logger.debug('[Zkp2pClient] Getting payee details:', { hashedOnchainId: _params.hashedOnchainId, processorName: _params.processorName });
    return apiGetPayeeDetails(_params, this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }

  /**
   * Validate payee details before creating a deposit
   * @param _params - Request parameters
   * @returns Validation response
   */
  async validatePayeeDetails(_params: ValidatePayeeDetailsRequest): Promise<ValidatePayeeDetailsResponse> {
    logger.debug('[Zkp2pClient] Validating payee details:', { processorName: _params.processorName });
    return apiValidatePayeeDetails(_params, this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }

  /**
   * Get historical deposits for a given owner address via the API
   * @param _params - Request parameters with owner address and optional status filter
   * @returns Historical deposits response
   */
  async getAccountDepositsHistory(_params: GetOwnerDepositsRequest): Promise<GetOwnerDepositsResponse> {
    logger.debug('[Zkp2pClient] Getting account deposits history:', { owner: _params.ownerAddress });
    return apiGetOwnerDeposits(_params, this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }

  /**
   * Get historical intents for a given owner address
   * @param _params - Request parameters with owner address
   * @returns Historical intents response
   */
  async getOwnerIntentsHistory(_params: GetOwnerIntentsRequest): Promise<GetOwnerIntentsResponse> {
    logger.debug('[Zkp2pClient] Getting owner intents history:', { owner: _params.ownerAddress });
    return apiGetOwnerIntents(_params, this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }

  /**
   * Get historical intents for a given taker address with optional status filter
   * @param _params - Request parameters with taker address and optional status filter
   * @returns Historical intents response
   */
  async getAccountIntentsHistory(_params: GetIntentsByTakerRequest): Promise<GetIntentsByTakerResponse> {
    logger.debug('[Zkp2pClient] Getting account intents history:', { taker: _params.takerAddress });
    return apiGetIntentsByTaker(_params, this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }

  /**
   * Get intents by deposit ID with optional status filter
   * @param _params - Request parameters with deposit ID and optional status filter
   * @returns Intents for the deposit
   */
  async getIntentsByDeposit(_params: GetIntentsByDepositRequest): Promise<GetIntentsByDepositResponse> {
    logger.debug('[Zkp2pClient] Getting intents by deposit:', { depositId: _params.depositId });
    return apiGetIntentsByDeposit(_params, this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }

  /**
   * Get a single intent by its hash
   * @param _params - Request parameters with intent hash
   * @returns Intent details
   */
  async getIntentByHash(_params: GetIntentByHashRequest): Promise<GetIntentByHashResponse> {
    logger.debug('[Zkp2pClient] Getting intent by hash:', { hash: _params.intentHash });
    return apiGetIntentByHash(_params, this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }

  /**
   * Get a single deposit by its ID
   * @param _params - Request parameters with deposit ID
   * @returns Deposit details
   */
  async getDepositById(_params: GetDepositByIdRequest): Promise<GetDepositByIdResponse> {
    logger.debug('[Zkp2pClient] Getting deposit by ID:', { depositId: _params.depositId });
    return apiGetDepositById(_params, this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }

  /**
   * Get order statistics for multiple deposits
   * @param _params - Request parameters with deposit IDs
   * @returns Order statistics for the deposits
   */
  async getDepositsOrderStats(_params: GetDepositsOrderStatsRequest): Promise<GetDepositsOrderStatsResponse> {
    logger.debug('[Zkp2pClient] Getting deposits order stats:', _params);
    return apiGetDepositsOrderStats(_params, this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }

  /**
   * Get intents by recipient address with optional status filter
   */
  async getIntentsByRecipient(_params: GetIntentsByRecipientRequest): Promise<GetIntentsByRecipientResponse> {
    logger.debug('[Zkp2pClient] Getting intents by recipient:', { recipient: _params.recipientAddress });
    const { apiGetIntentsByRecipient } = await import('../adapters/api');
    return apiGetIntentsByRecipient(_params, this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }

  /**
   * List registered payees (makers) with optional processor filter
   */
  async listPayees(processorName?: string): Promise<ListPayeesResponse> {
    logger.debug('[Zkp2pClient] Listing payees:', { processorName });
    const { apiListPayees } = await import('../adapters/api');
    return apiListPayees(processorName, this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }

  /**
   * Validate and then register payee details. Returns validation and optional registration result.
   */
  async validateAndRegisterPayeeDetails(_params: RegisterPayeeDetailsRequest): Promise<{
    isValid: boolean;
    validation: ValidatePayeeDetailsResponse;
    registration?: RegisterPayeeDetailsResponse;
  }> {
    const validation = await this.validatePayeeDetails({ processorName: _params.processorName, depositData: _params.depositData });
    if (!validation.responseObject?.isValid) {
      return { isValid: false, validation };
    }
    const registration = await this.registerPayeeDetails(_params);
    return { isValid: true, validation, registration };
  }

  /**
   * Deposit spread management helpers (maker dashboards)
   */
  async getDepositSpread(depositId: number) {
    const { apiGetDepositSpread } = await import('../adapters/api');
    return apiGetDepositSpread(depositId, this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }
  async listDepositSpreads() {
    const { apiListDepositSpreads } = await import('../adapters/api');
    return apiListDepositSpreads(this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }
  async getSpreadsByDepositIds(depositIds: number[]) {
    const { apiGetSpreadsByDepositIds } = await import('../adapters/api');
    return apiGetSpreadsByDepositIds(depositIds, this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }
  async createSpread(body: { depositId: number; spread: number; minPrice?: number | null; maxPrice?: number | null }) {
    const { apiCreateSpread } = await import('../adapters/api');
    return apiCreateSpread(body, this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }
  async updateSpread(depositId: number, body: { spread?: number; minPrice?: number | null; maxPrice?: number | null }) {
    const { apiUpdateSpread } = await import('../adapters/api');
    return apiUpdateSpread(depositId, body, this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }
  async upsertSpread(depositId: number, body: { spread?: number; minPrice?: number | null; maxPrice?: number | null }) {
    const { apiUpsertSpread } = await import('../adapters/api');
    return apiUpsertSpread(depositId, body, this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }
  async deleteSpread(depositId: number) {
    const { apiDeleteSpread } = await import('../adapters/api');
    return apiDeleteSpread(depositId, this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }

  /**
   * Register payee details and receive a hashedOnchainId (payeeHash)
   * @param _params - Processor name and platform-specific payee details
   * @returns Response including `hashedOnchainId` (aka payeeHash)
   */
  async registerPayeeDetails(
    _params: RegisterPayeeDetailsRequest
  ): Promise<RegisterPayeeDetailsResponse> {
    logger.debug('[Zkp2pClient] Registering payee details:', { processorName: _params.processorName });
    return apiPostDepositDetails(_params, this.apiKey, this.baseApiUrl, this.authorizationToken, this.timeouts.api);
  }

  /**
   * Get all deposits for a specific account
   * @param ownerAddress - The account address
   * @returns Array of deposit views
   */
  async getAccountDeposits(ownerAddress: Address): Promise<EscrowDepositView[]> {
    logger.debug('[Zkp2pClient] Getting account deposits:', { ownerAddress });
    const raw = await this.publicClient.readContract({
      address: this.addresses.escrow,
      abi: ESCROW_ABI,
      functionName: 'getAccountDeposits',
      args: [ownerAddress],
    });
    if (!raw) return [] as EscrowDepositView[];
    return (raw as Array<unknown>).map(parseEscrowDepositView);
  }

  /**
   * Get the active intent for a specific account
   * @param ownerAddress - The account address
   * @returns Intent view or null if no active intent
   */
  async getAccountIntent(ownerAddress: Address): Promise<EscrowIntentView | null> {
    logger.debug('[Zkp2pClient] Getting account intent:', { ownerAddress });
    const raw = await this.publicClient.readContract({
      address: this.addresses.escrow,
      abi: ESCROW_ABI,
      functionName: 'getAccountIntent',
      args: [ownerAddress],
    });
    if (!raw) return null;
    const iv = raw as { intentHash?: string; [key: string]: unknown };
    const zeroHash = '0x' + '0'.repeat(64);
    if (!iv.intentHash || iv.intentHash.toLowerCase() === zeroHash) return null;
    return parseEscrowIntentView(raw);
  }

  getUsdcAddress(): Address {
    return this.addresses.usdc;
  }

  getDeployedAddresses(): typeof this.addresses {
    return this.addresses;
  }
}
