import type { Address, Hash, PublicClient, WalletClient } from 'viem';
import { createPublicClient, http } from 'viem';
import { base, baseSepolia, hardhat } from 'viem/chains';
import type { Abi } from 'abitype';

import type { PV_DepositView, PV_IntentView } from '../utils/protocolViewerParsers';
import { defaultIndexerEndpoint, IndexerClient } from '../indexer/client';
import { IndexerDepositService, type DepositFilter, type PaginationOptions } from '../indexer/service';
import type { DepositEntity, DepositWithRelations, IntentEntity, IntentStatus, IntentFulfilledEntity } from '../indexer/types';
import { fetchFulfillmentAndPayment, type FulfillmentAndPaymentResponse } from '../indexer/intentVerification';
import { getContracts, type RuntimeEnv } from '../contracts';
import { apiSignIntentV2 } from '../adapters/verification';
import { apiCreatePaymentAttestation } from '../adapters/attestation';
import { encodeAddressAsBytes, encodePaymentAttestation, encodeVerifyPaymentData } from '../utils/encode';
import { apiGetQuote, apiPostDepositDetails } from '../adapters/api';
import { getGatingServiceAddress, getPaymentMethodsCatalog } from '../contracts';
import { resolveFiatCurrencyBytes32, resolvePaymentMethodHashFromCatalog } from '../utils/paymentResolution';
import { currencyKeccak256 } from '../utils/keccak';
import type { QuoteRequest, QuoteResponse, PostDepositDetailsRequest } from '../types';
import { ERC20_ABI } from '../utils/erc20';
import { sendTransactionWithAttribution } from '../utils/attribution';
import type { TxOverrides } from '../types';

/**
 * Configuration options for creating a Zkp2pClient instance.
 *
 * @example
 * ```typescript
 * const options: Zkp2pNextOptions = {
 *   walletClient,
 *   chainId: 8453, // Base mainnet
 *   runtimeEnv: 'production',
 *   apiKey: 'your-api-key',
 * };
 * ```
 */
export type Zkp2pNextOptions = {
  /** viem WalletClient instance with an account for signing transactions */
  walletClient: WalletClient;
  /** Chain ID (8453 for Base mainnet, 84532 for Base Sepolia) */
  chainId: number;
  /** Optional RPC URL override (defaults to wallet's chain RPC, then https://mainnet.base.org for Base or https://sepolia.base.org for Base Sepolia) */
  rpcUrl?: string;
  /** Runtime environment: 'production' or 'staging' (defaults to 'production') */
  runtimeEnv?: RuntimeEnv;
  /** Optional indexer URL override */
  indexerUrl?: string;
  /** Base API URL for ZKP2P services (defaults to https://api.zkp2p.xyz) */
  baseApiUrl?: string;
  /** API key for authenticated endpoints (required for createDeposit, signalIntent) */
  apiKey?: string;
  /** Optional bearer token for hybrid authentication */
  authorizationToken?: string;
  /** Timeout configuration */
  timeouts?: {
    /** API call timeout in milliseconds (default: 15000) */
    api?: number;
  };
};

/**
 * SDK client for ZKP2P liquidity providers (offramp peers).
 *
 * This SDK is designed for **liquidity providers** who want to:
 * - Create and manage USDC deposits that accept fiat payments
 * - Configure payment methods, currencies, and conversion rates
 * - Monitor deposit utilization and manage liquidity
 *
 * ## Core Functionality (Deposit Management)
 *
 * The primary use case is managing deposits as a liquidity provider:
 *
 * | Method | Description |
 * |--------|-------------|
 * | `createDeposit()` | Create a new USDC deposit |
 * | `addFunds()` / `removeFunds()` | Adjust deposit balance |
 * | `withdrawDeposit()` | Fully withdraw a deposit |
 * | `setAcceptingIntents()` | Enable/disable new intents |
 * | `setIntentRange()` | Set min/max intent amounts |
 * | `setCurrencyMinRate()` | Update conversion rates |
 * | `addPaymentMethods()` | Add payment platforms |
 * | `getDeposits()` | Query your deposits |
 *
 * ## Supporting Functionality
 *
 * These methods support the broader ZKP2P ecosystem but are not the
 * primary focus of this SDK:
 *
 * - **Intent Operations**: `signalIntent()`, `fulfillIntent()`, `cancelIntent()`
 *   (typically used by takers/buyers, not liquidity providers)
 * - **Quote API**: `getQuote()` (used by frontends to find available liquidity)
 *
 * @example Creating a Deposit (Primary Use Case)
 * ```typescript
 * import { createWalletClient, http } from 'viem';
 * import { base } from 'viem/chains';
 * import { privateKeyToAccount } from 'viem/accounts';
 * import { OfframpClient } from '@zkp2p/offramp-sdk';
 *
 * const walletClient = createWalletClient({
 *   account: privateKeyToAccount('0x...'),
 *   chain: base,
 *   transport: http(),
 * });
 *
 * const client = new OfframpClient({
 *   walletClient,
 *   chainId: base.id,
 *   apiKey: 'your-api-key',
 * });
 *
 * // Create a 1000 USDC deposit accepting Wise payments
 * const { hash } = await client.createDeposit({
 *   token: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
 *   amount: 1000_000000n,
 *   intentAmountRange: { min: 10_000000n, max: 500_000000n },
 *   processorNames: ['wise'],
 *   depositData: [{ email: 'you@example.com' }],
 *   conversionRates: [[
 *     { currency: 'USD', conversionRate: '1020000000000000000' },
 *     { currency: 'EUR', conversionRate: '1100000000000000000' },
 *   ]],
 * });
 *
 * // Monitor your deposits
 * const deposits = await client.getDeposits({ owner: walletClient.account.address });
 * ```
 */
export class Zkp2pClient {
  /** The viem WalletClient used for signing transactions */
  readonly walletClient: WalletClient;
  /** The viem PublicClient used for reading contract state */
  readonly publicClient: PublicClient;
  /** The chain ID this client is configured for */
  readonly chainId: number;
  /** Runtime environment ('production' or 'staging') */
  readonly runtimeEnv: RuntimeEnv;

  /** Escrow contract address */
  readonly escrowAddress: Address;
  /** Escrow contract ABI */
  readonly escrowAbi: Abi;
  /** Orchestrator contract address (handles intent signaling/fulfillment) */
  readonly orchestratorAddress?: Address;
  /** Orchestrator contract ABI */
  readonly orchestratorAbi?: Abi;
  /** UnifiedPaymentVerifier contract address */
  readonly unifiedPaymentVerifier?: Address;
  /** ProtocolViewer contract address (for batch reads) */
  readonly protocolViewerAddress?: Address;
  /** ProtocolViewer contract ABI */
  readonly protocolViewerAbi?: Abi;

  /** Base API URL for ZKP2P services */
  readonly baseApiUrl?: string;
  /** API key for authenticated endpoints */
  readonly apiKey?: string;
  /** Bearer token for hybrid authentication */
  readonly authorizationToken?: string;
  /** API timeout in milliseconds */
  readonly apiTimeoutMs: number;
  private _usdcAddress?: Address;

  // Indexer for advanced/historical queries
  private readonly _indexerClient: IndexerClient;
  private readonly _indexerService: IndexerDepositService;

  /**
   * Creates a new Zkp2pClient instance.
   *
   * @param opts - Configuration options
   * @throws Error if walletClient is missing an account
   */
  constructor(opts: Zkp2pNextOptions) {
    this.walletClient = opts.walletClient;
    this.chainId = opts.chainId;
    this.runtimeEnv = opts.runtimeEnv ?? 'production';
    const inferredRpc = (this.walletClient as any)?.chain?.rpcUrls?.default?.http?.[0] as string | undefined;
    // Chain-specific default RPC URLs
    const defaultRpcUrls: Record<number, string> = {
      [base.id]: 'https://mainnet.base.org',
      [baseSepolia.id]: 'https://sepolia.base.org',
      [hardhat.id]: 'http://127.0.0.1:8545',
    };
    const rpc = opts.rpcUrl ?? inferredRpc ?? defaultRpcUrls[opts.chainId] ?? 'https://mainnet.base.org';
    const chainMap: Record<number, any> = { [base.id]: base, [baseSepolia.id]: baseSepolia, [hardhat.id]: hardhat };
    const selectedChain = chainMap[this.chainId];
    this.publicClient = createPublicClient({ chain: selectedChain as any, transport: http(rpc, { batch: false }) }) as unknown as PublicClient;

    // contracts-v3 resolution (via contracts-v2 package)
    const { addresses, abis } = getContracts(this.chainId, this.runtimeEnv);
    this.escrowAddress = addresses.escrow as Address;
    this.escrowAbi = abis.escrow;
    this.orchestratorAddress = addresses.orchestrator as Address | undefined;
    this.orchestratorAbi = abis.orchestrator;
    this.unifiedPaymentVerifier = addresses.unifiedPaymentVerifier as Address | undefined;
    this.protocolViewerAddress = (addresses as any).protocolViewer as Address | undefined;
    this.protocolViewerAbi = (abis as any).protocolViewer as Abi | undefined;
    // optional USDC convenience
    const maybeUsdc = (addresses as any).usdc as Address | undefined;
    if (maybeUsdc) (this as any)._usdcAddress = maybeUsdc;

    // Indexer for advanced/historical queries
    const indexerEndpoint = opts.indexerUrl ?? defaultIndexerEndpoint(this.runtimeEnv === 'staging' ? 'STAGING' : 'PRODUCTION');
    this._indexerClient = new IndexerClient(indexerEndpoint);
    this._indexerService = new IndexerDepositService(this._indexerClient);

    // http verification config
    this.baseApiUrl = opts.baseApiUrl;
    this.apiKey = opts.apiKey;
    this.authorizationToken = opts.authorizationToken;
    this.apiTimeoutMs = opts.timeouts?.api ?? 15000;
  }

  private isValidHexAddress(addr?: string | null): boolean {
    if (typeof addr !== 'string') return false;
    return /^0x[0-9a-fA-F]{40}$/.test(addr);
  }

  /**
   * Simulate a contract call (validation only) and send with ERC-8021 attribution.
   * Referrer codes are stripped from overrides for simulation and appended to calldata.
   */
  private async simulateAndSendWithAttribution(opts: {
    address: Address;
    abi: Abi;
    functionName: string;
    args?: readonly unknown[];
    txOverrides?: TxOverrides;
    value?: bigint;
  }): Promise<Hash> {
    const { referrer, ...txOverrides } = opts.txOverrides ?? {};

    await this.publicClient.simulateContract({
      address: opts.address,
      abi: opts.abi,
      functionName: opts.functionName as any,
      args: (opts.args ?? []) as any,
      account: this.walletClient.account!,
      ...(txOverrides as any),
    });

    return sendTransactionWithAttribution(
      this.walletClient,
      {
        address: opts.address as `0x${string}`,
        abi: opts.abi,
        functionName: opts.functionName,
        args: opts.args ?? [],
        value: opts.value ?? (txOverrides as any).value,
      },
      referrer,
      txOverrides
    );
  }

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║ CORE: DEPOSIT QUERIES (RPC-first via ProtocolViewer)                     ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  /**
   * Fetches all deposits owned by the connected wallet from on-chain.
   *
   * This is the primary method for liquidity providers to query their deposits.
   * Uses ProtocolViewer for instant on-chain reads (no indexer lag).
   *
   * @returns Array of deposit views with payment methods and currencies
   *
   * @example
   * ```typescript
   * const deposits = await client.getDeposits();
   * for (const d of deposits) {
   *   console.log(`Deposit ${d.depositId}: ${d.availableLiquidity} available`);
   * }
   * ```
   */
  async getDeposits(): Promise<PV_DepositView[]> {
    const owner = this.walletClient.account?.address;
    if (!owner) throw new Error('Wallet client is missing account');
    return this.getAccountDeposits(owner);
  }

  /**
   * Fetches all deposits owned by a specific address from on-chain.
   *
   * Uses ProtocolViewer for instant on-chain reads.
   *
   * @param owner - The owner's Ethereum address
   * @returns Array of deposit views with payment methods and currencies
   *
   * @example
   * ```typescript
   * const deposits = await client.getAccountDeposits('0x...');
   * ```
   */
  async getAccountDeposits(owner: Address): Promise<PV_DepositView[]> {
    return this.getPvAccountDeposits(owner);
  }

  /**
   * Fetches a single deposit by its numeric ID from on-chain.
   *
   * Uses ProtocolViewer for instant on-chain reads.
   *
   * @param depositId - The deposit ID (numeric)
   * @returns Deposit view with payment methods, currencies, and intent hashes
   *
   * @example
   * ```typescript
   * const deposit = await client.getDeposit(42n);
   * console.log(`Available: ${deposit.availableLiquidity}`);
   * console.log(`Payment methods: ${deposit.paymentMethods.length}`);
   * ```
   */
  async getDeposit(depositId: bigint | number | string): Promise<PV_DepositView> {
    const id = typeof depositId === 'bigint' ? depositId : BigInt(depositId);
    return this.getPvDepositById(id);
  }

  /**
   * Fetches multiple deposits by their IDs from on-chain in a batch.
   *
   * @param depositIds - Array of deposit IDs
   * @returns Array of deposit views
   */
  async getDepositsById(depositIds: Array<bigint | number | string>): Promise<PV_DepositView[]> {
    const ids = depositIds.map(id => typeof id === 'bigint' ? id : BigInt(id));
    return this.getPvDepositsFromIds(ids);
  }

  /**
   * Fetches all intents created by the connected wallet from on-chain.
   *
   * Uses ProtocolViewer for instant on-chain reads.
   *
   * @returns Array of intent views with deposit context
   *
   * @example
   * ```typescript
   * const intents = await client.getIntents();
   * for (const i of intents) {
   *   console.log(`Intent ${i.intentHash}: ${i.intent.amount} tokens`);
   * }
   * ```
   */
  async getIntents(): Promise<PV_IntentView[]> {
    const owner = this.walletClient.account?.address;
    if (!owner) throw new Error('Wallet client is missing account');
    return this.getAccountIntents(owner);
  }

  /**
   * Fetches all intents created by a specific address from on-chain.
   *
   * @param owner - The owner's Ethereum address
   * @returns Array of intent views with deposit context
   */
  async getAccountIntents(owner: Address): Promise<PV_IntentView[]> {
    return this.getPvAccountIntents(owner);
  }

  /**
   * Fetches a single intent by its hash from on-chain.
   *
   * @param intentHash - The intent hash (0x-prefixed, 32 bytes)
   * @returns Intent view with deposit context
   */
  async getIntent(intentHash: `0x${string}`): Promise<PV_IntentView> {
    return this.getPvIntent(intentHash);
  }

  /**
   * Resolves the payee details hash for a deposit's payment method from on-chain.
   *
   * @param depositId - The deposit ID
   * @param paymentMethodHash - The payment method hash
   * @returns The payee details hash, or null if not found
   */
  async resolvePayeeHash(depositId: bigint | number | string, paymentMethodHash: string): Promise<string | null> {
    const deposit = await this.getDeposit(depositId);
    const pmLower = paymentMethodHash.toLowerCase();
    for (const pm of deposit.paymentMethods) {
      if (pm.paymentMethod.toLowerCase() === pmLower) {
        return pm.verificationData.payeeDetails;
      }
    }
    return null;
  }

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║ ADVANCED: INDEXER QUERIES (for historical/filtered data)                 ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  /**
   * Access to the indexer for advanced queries.
   *
   * Use this for:
   * - Historical data (totalAmountTaken, totalWithdrawn)
   * - Filtered queries across all deposits (not just by owner)
   * - Pagination with ordering
   * - Fulfillment/verification records
   *
   * @example
   * ```typescript
   * // Query deposits with filters and pagination
   * const deposits = await client.indexer.getDeposits(
   *   { status: 'ACTIVE', minLiquidity: '1000000' },
   *   { limit: 50, orderBy: 'remainingDeposits', orderDirection: 'desc' }
   * );
   *
   * // Get historical fulfillment data
   * const fulfillments = await client.indexer.getFulfilledIntentEvents(['0x...']);
   * ```
   */
  get indexer() {
    const service = this._indexerService;
    const client = this._indexerClient;
    return {
      /** Raw GraphQL client for custom queries */
      client,

      /**
       * Fetches deposits from the indexer with optional filtering and pagination.
       * Use for advanced queries across all deposits, not just by owner.
       */
      getDeposits: (filter?: DepositFilter, pagination?: PaginationOptions): Promise<DepositEntity[]> => {
        return service.fetchDeposits(filter, pagination);
      },

      /**
       * Fetches deposits with their related payment methods and optionally intents.
       */
      getDepositsWithRelations: (filter?: DepositFilter, pagination?: PaginationOptions, options?: { includeIntents?: boolean; intentStatuses?: IntentStatus[] }): Promise<DepositWithRelations[]> => {
        return service.fetchDepositsWithRelations(filter, pagination, options);
      },

      /**
       * Fetches a single deposit by its composite ID with all related data.
       * @param id - Composite ID format: "chainId_escrowAddress_depositId"
       */
      getDepositById: (id: string, options?: { includeIntents?: boolean; intentStatuses?: IntentStatus[] }): Promise<DepositWithRelations | null> => {
        return service.fetchDepositWithRelations(id, options);
      },

      /**
       * Fetches intents for multiple deposits.
       */
      getIntentsForDeposits: (depositIds: string[], statuses: IntentStatus[] = ['SIGNALED']): Promise<IntentEntity[]> => {
        return service.fetchIntentsForDeposits(depositIds, statuses);
      },

      /**
       * Fetches all intents created by a specific owner address.
       */
      getOwnerIntents: (owner: string, statuses?: IntentStatus[]): Promise<IntentEntity[]> => {
        return service.fetchIntentsByOwner(owner, statuses);
      },

      /**
       * Fetches intents that have expired.
       */
      getExpiredIntents: (params: { now: bigint | string; depositIds: string[]; limit?: number }): Promise<IntentEntity[]> => {
        return service.fetchExpiredIntents(params);
      },

      /**
       * Fetches fulfillment events for completed intents.
       */
      getFulfilledIntentEvents: (intentHashes: string[]): Promise<IntentFulfilledEntity[]> => {
        return service.fetchFulfilledIntentEvents(intentHashes);
      },

      /**
       * Fetches both the fulfillment record and payment verification for an intent.
       */
      getFulfillmentAndPayment: (intentHash: string): Promise<FulfillmentAndPaymentResponse> => {
        return fetchFulfillmentAndPayment(client, intentHash);
      },

      /**
       * Fetches deposits that match a specific payee details hash.
       */
      getDepositsByPayeeHash: (payeeHash: string, options: { paymentMethodHash?: string; limit?: number; includeIntents?: boolean; intentStatuses?: IntentStatus[] } = {}): Promise<DepositWithRelations[]> => {
        return service.fetchDepositsByPayeeHash(payeeHash, options);
      },
    };
  }

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║ CORE: DEPOSIT CREATION                                                   ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  /**
   * Ensures ERC20 token allowance is sufficient for the Escrow contract.
   *
   * If the current allowance is less than the requested amount, this method
   * will submit an approval transaction. Use `maxApprove: true` for unlimited
   * approval to avoid repeated approval transactions.
   *
   * @param params.token - ERC20 token address to approve
   * @param params.amount - Minimum required allowance amount
   * @param params.spender - Spender address (defaults to Escrow contract)
   * @param params.maxApprove - If true, approves MaxUint256 instead of exact amount
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Object with `hadAllowance` (true if no approval needed) and optional `hash`
   *
   * @example
   * ```typescript
   * // Ensure allowance for 1000 USDC
   * const { hadAllowance, hash } = await client.ensureAllowance({
   *   token: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
   *   amount: 1000_000000n,
   *   maxApprove: true,
   * });
   *
   * if (!hadAllowance) {
   *   console.log('Approval tx:', hash);
   * }
   * ```
   */
  async ensureAllowance(params: { token: Address; amount: bigint; spender?: Address; maxApprove?: boolean; txOverrides?: TxOverrides }): Promise<{ hadAllowance: boolean; hash?: Hash }> {
    const owner = this.walletClient.account?.address as Address | undefined;
    if (!owner) throw new Error('Wallet client is missing account');
    const spender = params.spender ?? this.escrowAddress;
    const allowance = (await this.publicClient.readContract({ address: params.token, abi: ERC20_ABI as any, functionName: 'allowance', args: [owner, spender] })) as bigint;
    if (allowance >= params.amount) return { hadAllowance: true };
    const MAX = (1n << 256n) - 1n;
    const value = params.maxApprove ? MAX : params.amount;
    const hash = await this.simulateAndSendWithAttribution({
      address: params.token,
      abi: ERC20_ABI as any,
      functionName: 'approve',
      args: [spender, value],
      txOverrides: params.txOverrides,
    });
    return { hadAllowance: false, hash };
  }

  /**
   * Creates a new USDC deposit in the Escrow contract.
   *
   * This is the primary method for liquidity providers to add funds to the protocol.
   * The deposit can accept intents from multiple payment platforms with different
   * conversion rates per currency.
   *
   * **Important**: Requires `apiKey` or `authorizationToken` to be set.
   * Call `ensureAllowance()` first to approve USDC spending.
   *
   * @param params.token - Token address (USDC)
   * @param params.amount - Total deposit amount in token units (6 decimals for USDC)
   * @param params.intentAmountRange - Min/max amount per intent
   * @param params.processorNames - Payment platforms to accept (e.g., ['wise', 'revolut'])
   * @param params.depositData - Payee details per processor (e.g., [{ email: '...' }])
   * @param params.conversionRates - Conversion rates per processor, grouped by currency
   * @param params.delegate - Optional delegate address that can manage the deposit
   * @param params.intentGuardian - Optional guardian for intent approval
   * @param params.retainOnEmpty - Keep deposit active when balance reaches zero
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns The deposit details posted to API and the transaction hash
   *
   * @throws Error if apiKey/authorizationToken is missing
   * @throws Error if processorNames, depositData, and conversionRates lengths don't match
   * @throws Error if a currency is not supported by the specified processor
   *
   * @example
   * ```typescript
   * // Create a 1000 USDC deposit accepting Wise payments in USD and EUR
   * const { hash } = await client.createDeposit({
   *   token: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
   *   amount: 1000_000000n,
   *   intentAmountRange: { min: 10_000000n, max: 500_000000n },
   *   processorNames: ['wise'],
   *   depositData: [{ email: 'you@example.com' }],
   *   conversionRates: [[
   *     { currency: 'USD', conversionRate: '1020000000000000000' }, // 1.02
   *     { currency: 'EUR', conversionRate: '1100000000000000000' }, // 1.10
   *   ]],
   * });
   * ```
   */
  async createDeposit(params: {
    token: Address;
    amount: bigint;
    intentAmountRange: { min: bigint; max: bigint };
    processorNames: string[];
    depositData: { [key: string]: string }[];
    conversionRates: { currency: string; conversionRate: string }[][];
    delegate?: Address;
    intentGuardian?: Address;
    retainOnEmpty?: boolean;
    txOverrides?: TxOverrides;
  }): Promise<{ depositDetails: PostDepositDetailsRequest[]; hash: Hash }> {
    const methods = getPaymentMethodsCatalog(this.chainId, this.runtimeEnv);
    if (!Array.isArray(params.processorNames) || params.processorNames.length === 0) {
      throw new Error('processorNames must be a non-empty array');
    }
    if (params.processorNames.length !== params.conversionRates.length) {
      throw new Error('processorNames and conversionRates length mismatch');
    }
    if (params.processorNames.length !== params.depositData.length) {
      throw new Error('processorNames and depositData length mismatch');
    }

    const paymentMethods = params.processorNames.map((name) => resolvePaymentMethodHashFromCatalog(name, methods));
    const intentGatingService = getGatingServiceAddress(this.chainId, this.runtimeEnv);
    // Post deposit details to API to produce hashed on-chain ids
    const baseApiUrl = (this.baseApiUrl ?? 'https://api.zkp2p.xyz').replace(/\/$/, '');
    if (!this.apiKey && !this.authorizationToken) {
      throw new Error('createDeposit requires apiKey or authorizationToken to post deposit details');
    }
    const depositDetails: PostDepositDetailsRequest[] = params.processorNames.map((processorName, index) => ({
      processorName,
      depositData: params.depositData[index] || {},
    }));
    const apiResponses = await Promise.all(
      depositDetails.map((req) => apiPostDepositDetails(req, baseApiUrl, this.apiTimeoutMs))
    );
    if (!apiResponses.every((r) => (r as any)?.success)) {
      const failed = apiResponses.find((r) => !(r as any)?.success) as any;
      throw new Error(failed?.message || 'Failed to create deposit details');
    }
    const hashedOnchainIds = apiResponses.map((r: any) => r.responseObject?.hashedOnchainId as string);
    const paymentMethodData = hashedOnchainIds.map((hid) => ({ intentGatingService, payeeDetails: hid, data: '0x' as `0x${string}` }));

    // Validate currency support per processor when catalog lists allowed currencies
    // Note: catalog stores keccak256 hashes of currency codes, not ASCII-bytes32
    params.conversionRates.forEach((group, i) => {
      const key = params.processorNames[i]?.toLowerCase();
      const allowed = methods[key!]?.currencies?.map((c) => c.toLowerCase());
      if (allowed && allowed.length) {
        for (const { currency } of group) {
          const codeHash = currencyKeccak256(String(currency).toUpperCase()).toLowerCase();
          if (!allowed.includes(codeHash)) {
            throw new Error(`Currency ${currency} not supported by ${params.processorNames[i]}. Allowed: ${allowed.join(', ')}`);
          }
        }
      }
    });

    // Map UI currency groups to on-chain tuple[][] with minConversionRate
    const { mapConversionRatesToOnchainMinRate } = await import('../utils/currency');
    const normalized = params.conversionRates.map((group) => group.map((r) => ({ currency: r.currency as any, conversionRate: r.conversionRate })));
    const currencies = mapConversionRatesToOnchainMinRate(normalized as any, paymentMethods.length);

    const args = [{
      token: params.token,
      amount: params.amount,
      intentAmountRange: params.intentAmountRange,
      paymentMethods,
      paymentMethodData,
      currencies,
      delegate: (params.delegate ?? '0x0000000000000000000000000000000000000000') as Address,
      intentGuardian: (params.intentGuardian ?? '0x0000000000000000000000000000000000000000') as Address,
      retainOnEmpty: Boolean(params.retainOnEmpty ?? false),
    }];

    const hash = await this.simulateAndSendWithAttribution({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'createDeposit',
      args,
      txOverrides: params.txOverrides,
    });
    return { depositDetails, hash };
  }

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║ CORE: DEPOSIT MANAGEMENT                                                 ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  /**
   * Enables or disables a deposit from accepting new intents.
   *
   * @param params.depositId - The deposit ID
   * @param params.accepting - Whether to accept new intents
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   */
  async setAcceptingIntents(params: { depositId: bigint; accepting: boolean; txOverrides?: TxOverrides }): Promise<Hash> {
    return this.simulateAndSendWithAttribution({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'setAcceptingIntents',
      args: [params.depositId, params.accepting],
      txOverrides: params.txOverrides,
    });
  }

  /**
   * Updates the min/max intent amount range for a deposit.
   *
   * @param params.depositId - The deposit ID
   * @param params.min - Minimum intent amount
   * @param params.max - Maximum intent amount
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   */
  async setIntentRange(params: { depositId: bigint; min: bigint; max: bigint; txOverrides?: TxOverrides }): Promise<Hash> {
    return this.simulateAndSendWithAttribution({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'setIntentRange',
      args: [params.depositId, { min: params.min, max: params.max }],
      txOverrides: params.txOverrides,
    });
  }

  /**
   * Updates the minimum conversion rate for a specific currency on a payment method.
   *
   * @param params.depositId - The deposit ID
   * @param params.paymentMethod - Payment method hash (bytes32)
   * @param params.fiatCurrency - Fiat currency hash (bytes32)
   * @param params.minConversionRate - New minimum conversion rate (18 decimals)
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   */
  async setCurrencyMinRate(params: { depositId: bigint; paymentMethod: `0x${string}`; fiatCurrency: `0x${string}`; minConversionRate: bigint; txOverrides?: TxOverrides }): Promise<Hash> {
    return this.simulateAndSendWithAttribution({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'setCurrencyMinRate',
      args: [params.depositId, params.paymentMethod, params.fiatCurrency, params.minConversionRate],
      txOverrides: params.txOverrides,
    });
  }

  /**
   * Adds additional funds to an existing deposit.
   * Requires prior approval of the token amount.
   *
   * @param params.depositId - The deposit ID to add funds to
   * @param params.amount - Amount to add (in token units)
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   */
  async addFunds(params: { depositId: bigint; amount: bigint; txOverrides?: TxOverrides }): Promise<Hash> {
    return this.simulateAndSendWithAttribution({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'addFunds',
      args: [params.depositId, params.amount],
      txOverrides: params.txOverrides,
    });
  }

  /**
   * Removes funds from a deposit (partial withdrawal).
   * Can only withdraw available (non-locked) funds.
   *
   * @param params.depositId - The deposit ID
   * @param params.amount - Amount to remove (in token units)
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   */
  async removeFunds(params: { depositId: bigint; amount: bigint; txOverrides?: TxOverrides }): Promise<Hash> {
    return this.simulateAndSendWithAttribution({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'removeFunds',
      args: [params.depositId, params.amount],
      txOverrides: params.txOverrides,
    });
  }

  /**
   * Fully withdraws a deposit, returning all available funds to the owner.
   * The deposit must have no active intents.
   *
   * @param params.depositId - The deposit ID to withdraw
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   */
  async withdrawDeposit(params: { depositId: bigint; txOverrides?: TxOverrides }): Promise<Hash> {
    return this.simulateAndSendWithAttribution({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'withdrawDeposit',
      args: [params.depositId],
      txOverrides: params.txOverrides,
    });
  }

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║ CORE: ADVANCED DEPOSIT CONFIGURATION                                     ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  /**
   * Sets whether a deposit should remain active when its balance reaches zero.
   *
   * @param params.depositId - The deposit ID
   * @param params.retain - If true, deposit stays active when empty
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   */
  async setRetainOnEmpty(params: { depositId: bigint; retain: boolean; txOverrides?: TxOverrides }): Promise<Hash> {
    return this.simulateAndSendWithAttribution({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'setRetainOnEmpty',
      args: [params.depositId, params.retain],
      txOverrides: params.txOverrides,
    });
  }

  /**
   * Assigns a delegate address that can manage the deposit on behalf of the owner.
   *
   * @param params.depositId - The deposit ID
   * @param params.delegate - Address to delegate management to
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   */
  async setDelegate(params: { depositId: bigint; delegate: Address; txOverrides?: TxOverrides }): Promise<Hash> {
    return this.simulateAndSendWithAttribution({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'setDelegate',
      args: [params.depositId, params.delegate],
      txOverrides: params.txOverrides,
    });
  }

  /**
   * Removes the delegate from a deposit.
   *
   * @param params.depositId - The deposit ID
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   */
  async removeDelegate(params: { depositId: bigint; txOverrides?: TxOverrides }): Promise<Hash> {
    return this.simulateAndSendWithAttribution({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'removeDelegate',
      args: [params.depositId],
      txOverrides: params.txOverrides,
    });
  }

  /**
   * Adds new payment methods to an existing deposit.
   *
   * @param params.depositId - The deposit ID
   * @param params.paymentMethods - Array of payment method hashes to add
   * @param params.paymentMethodData - Corresponding payment method configuration
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   */
  async addPaymentMethods(params: { depositId: bigint; paymentMethods: `0x${string}`[]; paymentMethodData: { intentGatingService: Address; payeeDetails: string; data: `0x${string}` }[]; txOverrides?: TxOverrides }): Promise<Hash> {
    return this.simulateAndSendWithAttribution({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'addPaymentMethods',
      args: [params.depositId, params.paymentMethods, params.paymentMethodData],
      txOverrides: params.txOverrides,
    });
  }

  /**
   * Activates or deactivates a payment method on a deposit.
   *
   * @param params.depositId - The deposit ID
   * @param params.paymentMethod - Payment method hash to modify
   * @param params.isActive - Whether the payment method should accept intents
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   */
  async setPaymentMethodActive(params: { depositId: bigint; paymentMethod: `0x${string}`; isActive: boolean; txOverrides?: TxOverrides }): Promise<Hash> {
    return this.simulateAndSendWithAttribution({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'setPaymentMethodActive',
      args: [params.depositId, params.paymentMethod, params.isActive],
      txOverrides: params.txOverrides,
    });
  }

  /**
   * Deactivates a payment method on a deposit (convenience alias for setPaymentMethodActive).
   *
   * @param params.depositId - The deposit ID
   * @param params.paymentMethod - Payment method hash to deactivate
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   */
  async removePaymentMethod(params: { depositId: bigint; paymentMethod: `0x${string}`; txOverrides?: TxOverrides }): Promise<Hash> {
    return this.setPaymentMethodActive({ depositId: params.depositId, paymentMethod: params.paymentMethod, isActive: false, txOverrides: params.txOverrides });
  }

  /**
   * Adds new currencies to a payment method on a deposit.
   *
   * @param params.depositId - The deposit ID
   * @param params.paymentMethod - Payment method hash to add currencies to
   * @param params.currencies - Array of currency configurations with code and min rate
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   */
  async addCurrencies(params: { depositId: bigint; paymentMethod: `0x${string}`; currencies: { code: `0x${string}`; minConversionRate: bigint }[]; txOverrides?: TxOverrides }): Promise<Hash> {
    return this.simulateAndSendWithAttribution({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'addCurrencies',
      args: [params.depositId, params.paymentMethod, params.currencies],
      txOverrides: params.txOverrides,
    });
  }

  /**
   * Deactivates a currency for a payment method on a deposit.
   *
   * @param params.depositId - The deposit ID
   * @param params.paymentMethod - Payment method hash
   * @param params.currencyCode - Currency code hash to deactivate
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   */
  async deactivateCurrency(params: { depositId: bigint; paymentMethod: `0x${string}`; currencyCode: `0x${string}`; txOverrides?: TxOverrides }): Promise<Hash> {
    return this.simulateAndSendWithAttribution({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'deactivateCurrency',
      args: [params.depositId, params.paymentMethod, params.currencyCode],
      txOverrides: params.txOverrides,
    });
  }

  /**
   * Removes (deactivates) a currency from a payment method.
   * Alias for deactivateCurrency.
   *
   * @param params.depositId - The deposit ID
   * @param params.paymentMethod - Payment method hash
   * @param params.currencyCode - Currency code hash to remove
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   */
  async removeCurrency(params: { depositId: bigint; paymentMethod: `0x${string}`; currencyCode: `0x${string}`; txOverrides?: TxOverrides }): Promise<Hash> {
    return this.deactivateCurrency(params);
  }

  /**
   * Removes expired intents from a deposit, freeing up locked funds.
   * Can be called by anyone (permissionless cleanup).
   *
   * @param params.depositId - The deposit ID to prune
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   */
  async pruneExpiredIntents(params: { depositId: bigint; txOverrides?: TxOverrides }): Promise<Hash> {
    return this.simulateAndSendWithAttribution({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'pruneExpiredIntents',
      args: [params.depositId],
      txOverrides: params.txOverrides,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SUPPORTING: INTENT OPERATIONS
  // (Used by takers/buyers - not primary SDK functionality)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * **Supporting Method** - Signals intent to use a deposit.
   *
   * > **Note**: This method is typically used by takers/buyers who want to
   * > purchase crypto by paying fiat. Liquidity providers generally don't
   * > need to call this method directly.
   *
   * This reserves funds from a deposit and creates an intent that must be
   * fulfilled (via `fulfillIntent`) or will expire. The taker commits to
   * sending fiat payment to the deposit's payee.
   *
   * If `gatingServiceSignature` is not provided, the SDK will automatically
   * fetch one from the API (requires `apiKey` or `authorizationToken`).
   *
   * @param params.depositId - The deposit to use
   * @param params.amount - Amount of tokens to claim (in token units)
   * @param params.toAddress - Address to receive the tokens when fulfilled
   * @param params.processorName - Payment platform (e.g., 'wise', 'revolut')
   * @param params.payeeDetails - Hashed payee details (from deposit)
   * @param params.fiatCurrencyCode - Fiat currency code (e.g., 'USD', 'EUR')
   * @param params.conversionRate - Agreed conversion rate (18 decimals)
   * @param params.referrer - Optional referrer address for fee sharing
   * @param params.referrerFee - Optional referrer fee amount
   * @param params.postIntentHook - Optional hook contract to call after signaling
   * @param params.data - Optional data to pass to the hook
   * @param params.gatingServiceSignature - Pre-obtained signature (if not auto-fetching)
   * @param params.signatureExpiration - Signature expiration timestamp
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   *
   * @example
   * ```typescript
   * const hash = await client.signalIntent({
   *   depositId: 42n,
   *   amount: 100_000000n, // 100 USDC
   *   toAddress: '0x...',
   *   processorName: 'wise',
   *   payeeDetails: '0x...',
   *   fiatCurrencyCode: 'USD',
   *   conversionRate: 1_020000000000000000n, // 1.02
   * });
   * ```
   */
  async signalIntent(params: {
    depositId: bigint | string;
    amount: bigint | string;
    toAddress: Address;
    processorName: string;
    payeeDetails: string;
    fiatCurrencyCode: string;
    conversionRate: bigint | string;
    referrer?: Address;
    referrerFee?: bigint | string;
    postIntentHook?: Address;
    data?: `0x${string}`;
    gatingServiceSignature?: `0x${string}`;
    signatureExpiration?: bigint | string;
    txOverrides?: TxOverrides;
  }): Promise<Hash> {
    // Resolve missing addresses opportunistically before sending
    // await this.ensureContractsForSignal(params.depositId);
    if (!this.orchestratorAddress || !this.orchestratorAbi) throw new Error('Orchestrator not available');
    const catalog = getPaymentMethodsCatalog(this.chainId, this.runtimeEnv);
    const paymentMethod = resolvePaymentMethodHashFromCatalog(params.processorName, catalog);
    const fiatCurrency = resolveFiatCurrencyBytes32(params.fiatCurrencyCode);
    const depositId = typeof params.depositId === 'bigint' ? params.depositId : BigInt(params.depositId);
    const amount = typeof params.amount === 'bigint' ? params.amount : BigInt(params.amount);
    const conversionRate = typeof params.conversionRate === 'bigint' ? params.conversionRate : BigInt(params.conversionRate);
    const referrerFee = params.referrerFee === undefined ? 0n : (typeof params.referrerFee === 'bigint' ? params.referrerFee : BigInt(params.referrerFee));

    let { gatingServiceSignature, signatureExpiration } = params;
    if ((!gatingServiceSignature || !signatureExpiration) && this.baseApiUrl && (this.apiKey || this.authorizationToken)) {
      const resp = await apiSignIntentV2(
        {
          processorName: params.processorName,
          payeeDetails: params.payeeDetails,
          depositId: depositId.toString(),
          amount: amount.toString(),
          toAddress: params.toAddress,
          paymentMethod,
          fiatCurrency,
          conversionRate: conversionRate.toString(),
          chainId: this.chainId.toString(),
          orchestratorAddress: this.orchestratorAddress!,
          escrowAddress: this.escrowAddress,
        },
        { baseApiUrl: this.baseApiUrl, apiKey: this.apiKey, authorizationToken: this.authorizationToken, timeoutMs: this.apiTimeoutMs }
      );
      gatingServiceSignature = resp.signature;
      signatureExpiration = resp.signatureExpiration;
    }

    if (!gatingServiceSignature || !signatureExpiration) throw new Error('Missing gatingServiceSignature/signatureExpiration');

    const args = [{
      escrow: this.escrowAddress,
      depositId,
      amount,
      to: params.toAddress,
      paymentMethod,
      fiatCurrency,
      conversionRate,
      referrer: (params.referrer ?? ('0x0000000000000000000000000000000000000000' as Address)) as Address,
      referrerFee,
      gatingServiceSignature,
      signatureExpiration: typeof signatureExpiration === 'bigint' ? signatureExpiration : BigInt(signatureExpiration),
      postIntentHook: (params.postIntentHook ?? ('0x0000000000000000000000000000000000000000' as Address)) as Address,
      data: (params.data ?? '0x') as `0x${string}`,
    }];

    return this.simulateAndSendWithAttribution({
      address: this.orchestratorAddress,
      abi: this.orchestratorAbi,
      functionName: 'signalIntent',
      args,
      txOverrides: params.txOverrides,
    });
  }

  /**
   * **Supporting Method** - Cancels a signaled intent before fulfillment.
   *
   * Only the intent owner can cancel. Releases reserved funds back to the deposit.
   *
   * @param params.intentHash - The intent hash to cancel (0x-prefixed, 32 bytes)
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   */
  async cancelIntent(params: { intentHash: `0x${string}`; txOverrides?: TxOverrides }): Promise<Hash> {
    if (!this.orchestratorAddress || !this.orchestratorAbi) throw new Error('Orchestrator not available');
    return this.simulateAndSendWithAttribution({
      address: this.orchestratorAddress,
      abi: this.orchestratorAbi,
      functionName: 'cancelIntent',
      args: [params.intentHash],
      txOverrides: params.txOverrides,
    });
  }

  /**
   * **Supporting Method** - Releases funds back to the deposit owner.
   *
   * Called by the deposit owner when they want to reject an intent
   * (e.g., payment verification failed or intent expired).
   *
   * @param params.intentHash - The intent hash (0x-prefixed, 32 bytes)
   * @param params.txOverrides - Optional viem transaction overrides
   * @returns Transaction hash
   */
  async releaseFundsToPayer(params: { intentHash: `0x${string}`; txOverrides?: TxOverrides }): Promise<Hash> {
    if (!this.orchestratorAddress || !this.orchestratorAbi) throw new Error('Orchestrator not available');
    return this.simulateAndSendWithAttribution({
      address: this.orchestratorAddress,
      abi: this.orchestratorAbi,
      functionName: 'releaseFundsToPayer',
      args: [params.intentHash],
      txOverrides: params.txOverrides,
    });
  }

  /**
   * **Supporting Method** - Fulfills an intent by submitting a payment proof.
   *
   * > **Note**: This method is typically used by takers/buyers after they've
   * > sent fiat payment. Liquidity providers generally don't call this directly.
   *
   * This is the final step in the off-ramp flow. After the taker has sent
   * fiat payment, they generate a proof (via the browser extension) and
   * submit it here. The SDK handles attestation service calls automatically.
   *
   * **Flow:**
   * 1. Intent parameters are derived from the indexer/ProtocolViewer
   * 2. Proof is sent to the attestation service for verification
   * 3. Attestation response is encoded and submitted on-chain
   * 4. Funds are released to the intent's `toAddress`
   *
   * @param params.intentHash - The intent hash to fulfill (0x-prefixed, 32 bytes)
   * @param params.proof - Payment proof from Reclaim (object or JSON string)
   * @param params.platform - Optional platform name override (e.g., 'zelle', 'zelle-citi') to bypass hash-to-name lookup
   * @param params.paymentMethod - Optional payment method hash override (bytes32); defaults to hash from on-chain intent
   * @param params.timestampBufferMs - Allowed timestamp variance (default: 300000ms)
   * @param params.attestationServiceUrl - Override attestation service URL
   * @param params.verifyingContract - Override verifier contract address
   * @param params.postIntentHookData - Data to pass to post-intent hook
   * @param params.txOverrides - Optional viem transaction overrides
   * @param params.callbacks - Lifecycle callbacks for UI updates
   * @returns Transaction hash
   */
  async fulfillIntent(params: {
    intentHash: `0x${string}`;
    proof: Record<string, unknown> | string;
    platform?: string;
    paymentMethod?: `0x${string}`;
    timestampBufferMs?: string;
    attestationServiceUrl?: string;
    verifyingContract?: Address;
    postIntentHookData?: `0x${string}`;
    txOverrides?: TxOverrides;
    callbacks?: { onAttestationStart?: () => void; onTxSent?: (hash: Hash) => void; onTxMined?: (hash: Hash) => void };
  }): Promise<Hash> {
    if (!this.orchestratorAddress || !this.orchestratorAbi) throw new Error('Orchestrator not available');

    const intentHash: `0x${string}` = params.intentHash;
    const attUrl: string = (params.attestationServiceUrl ?? this.defaultAttestationService());
    const verifyingContract = (params.verifyingContract ?? this.unifiedPaymentVerifier) as Address | undefined;
    // Derive intent inputs via indexer/ProtocolViewer (source of truth)
    const inputs = await this.getFulfillIntentInputs(intentHash);
    const amount = inputs.amount;
    const fiatCurrency = inputs.fiatCurrency;
    const conversionRate = inputs.conversionRate;
    const payeeDetails = inputs.payeeDetails;
    const timestampMs = inputs.intentTimestampMs;
    // Allow explicit paymentMethod override (e.g., for Zelle variants where hash-to-name lookup may fail)
    const paymentMethodHash = params.paymentMethod || inputs.paymentMethodHash || '0x';
    const timestampBufferMs = params.timestampBufferMs ?? '300000'; // note: service should default; keep explicit for now

    // Map paymentMethodHash -> platform/actionType for Attestation Service endpoint
    // Allow explicit platform override to bypass the hash-to-name lookup (useful for Zelle variants)
    let platformName: string | undefined = params.platform;
    if (!platformName) {
      const catalog = getPaymentMethodsCatalog(this.chainId, this.runtimeEnv);
      const { resolvePaymentMethodNameFromHash } = await import('../utils/paymentResolution');
      platformName = resolvePaymentMethodNameFromHash(paymentMethodHash, catalog);
      if (!platformName) throw new Error('Unknown paymentMethodHash for this network/env; update SDK catalogs or pass platform override.');
    }
    const { resolvePlatformAttestationConfig } = await import('../constants');
    const cfg = resolvePlatformAttestationConfig(platformName);
    const platform = cfg.actionPlatform;
    const actionType = cfg.actionType;

    const zkTlsProof = typeof params.proof === 'string' ? params.proof : JSON.stringify(params.proof);
    const payload = {
      proofType: 'reclaim',
      proof: zkTlsProof,
      chainId: this.chainId,
      verifyingContract,
      intent: {
        intentHash,
        amount,
        timestampMs,
        paymentMethod: paymentMethodHash,
        fiatCurrency,
        conversionRate,
        payeeDetails,
        timestampBufferMs,
      },
    } as Record<string, unknown>;

    params?.callbacks?.onAttestationStart?.();
    const att = await apiCreatePaymentAttestation(payload, attUrl, platform, actionType);
    const paymentProof = encodePaymentAttestation(att);
    const verificationData = encodeVerifyPaymentData({
      intentHash,
      paymentProof,
      data: encodeAddressAsBytes(att.responseObject.signer),
    });

    const args = [{
      paymentProof,
      intentHash,
      verificationData,
      postIntentHookData: (params.postIntentHookData ?? '0x') as `0x${string}`,
    }];
    const txHash = await this.simulateAndSendWithAttribution({
      address: this.orchestratorAddress,
      abi: this.orchestratorAbi,
      functionName: 'fulfillIntent',
      args,
      txOverrides: params.txOverrides,
    });
    params?.callbacks?.onTxSent?.(txHash);
    // We do not wait for receipt here; caller can wait or use callback if we later add it
    return txHash;
  }

  private defaultAttestationService(): string {
    return this.runtimeEnv === 'staging'
      ? 'https://attestation-service-staging.zkp2p.xyz'
      : 'https://attestation-service.zkp2p.xyz';
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SUPPORTING: QUOTES API
  // (Used by frontends to find available liquidity)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * **Supporting Method** - Fetches quotes for available liquidity.
   *
   * > **Note**: This method is typically used by frontend applications to
   * > display available off-ramp options to users. Liquidity providers can
   * > use it to see how their deposits appear to takers.
   *
   * Returns available quotes from liquidity providers matching the request
   * criteria. When authenticated, the API returns payee details in each quote.
   *
   * @param req - Quote request parameters
   * @param req.paymentPlatforms - Payment platforms to search (e.g., ['wise', 'revolut'])
   * @param req.fiatCurrency - Target fiat currency code (e.g., 'USD')
   * @param req.user - User's address
   * @param req.recipient - Token recipient address
   * @param req.destinationChainId - Chain ID for token delivery
   * @param req.destinationToken - Token address to receive
   * @param req.amount - Amount (in fiat if isExactFiat, else in tokens)
   * @param req.isExactFiat - If true, amount is in fiat; quotes return token amounts
   * @param req.escrowAddresses - Optional filter for specific escrow contracts
   * @param opts - Optional overrides for API URL and timeout
   * @returns Quote response with available options
   *
   * @example
   * ```typescript
   * const quote = await client.getQuote({
   *   paymentPlatforms: ['wise'],
   *   fiatCurrency: 'EUR',
   *   user: '0x...',
   *   recipient: '0x...',
   *   destinationChainId: 8453,
   *   destinationToken: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
   *   amount: '100',
   *   isExactFiat: true,
   * });
   *
   * for (const q of quote.responseObject.quotes) {
   *   console.log(`${q.tokenAmountFormatted} USDC for ${q.fiatAmountFormatted}`);
   * }
   * ```
   */
  async getQuote(req: QuoteRequest, opts?: { baseApiUrl?: string; timeoutMs?: number }): Promise<QuoteResponse> {
    const baseApiUrl = (opts?.baseApiUrl ?? this.baseApiUrl ?? 'https://api.zkp2p.xyz').replace(/\/$/, '');
    const timeoutMs = opts?.timeoutMs ?? this.apiTimeoutMs;
    // Include the native escrow only when caller did not provide filters
    const reqWithEscrow = { ...(req as any) } as QuoteRequest & { escrowAddresses?: string[] };
    if ((!reqWithEscrow.escrowAddresses || reqWithEscrow.escrowAddresses.length === 0) && this.escrowAddress) {
      reqWithEscrow.escrowAddresses = [this.escrowAddress as string];
    }
    const quote = await apiGetQuote(reqWithEscrow as any, baseApiUrl, timeoutMs, this.apiKey, this.authorizationToken);
    // Extract maker.depositData from /v2/quote response into payeeData for backward compatibility
    // This eliminates the need for separate apiGetPayeeDetails calls
    const quotes = quote?.responseObject?.quotes ?? [];
    for (const q of quotes) {
      const maker = (q as any)?.maker;
      if (maker?.depositData && typeof q === 'object') {
        (q as any).payeeData = maker.depositData;
      }
    }
    return quote;
  }

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║ CORE: ON-CHAIN DEPOSIT VIEWS                                             ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  private requireProtocolViewer() {
    if (!this.protocolViewerAddress || !this.protocolViewerAbi) {
      throw new Error('ProtocolViewer not available for this network');
    }
    return { address: this.protocolViewerAddress, abi: this.protocolViewerAbi } as const;
  }

  /**
   * Fetches a deposit directly from on-chain ProtocolViewer contract.
   * Falls back to Escrow.getDeposit if ProtocolViewer is unavailable.
   *
   * @param depositId - The deposit ID (string or bigint)
   * @returns Parsed deposit view with all payment methods and currencies
   */
  async getPvDepositById(depositId: string | bigint) {
    const id = typeof depositId === 'bigint' ? depositId : BigInt(depositId);
    try {
      const { address, abi } = this.requireProtocolViewer();
      const raw = await this.publicClient.readContract({ address, abi, functionName: 'getDeposit', args: [id] });
      const { parseDepositView } = await import('../utils/protocolViewerParsers');
      return parseDepositView(raw);
    } catch (e) {
      // Fallback to Escrow.getDeposit
      const raw = await this.publicClient.readContract({ address: this.escrowAddress, abi: this.escrowAbi, functionName: 'getDeposit', args: [id] });
      const { parseDepositView } = await import('../utils/protocolViewerParsers');
      return parseDepositView(raw);
    }
  }

  /**
   * Fetches multiple deposits by ID from on-chain in a batch call.
   *
   * @param ids - Array of deposit IDs
   * @returns Array of parsed deposit views
   */
  async getPvDepositsFromIds(ids: Array<string | bigint>) {
    // When ProtocolViewer is unavailable, fall back to per-id Escrow.getDeposit reads
    if (!this.protocolViewerAddress || !this.protocolViewerAbi) {
      const { parseDepositView } = await import('../utils/protocolViewerParsers');
      const results: any[] = [];
      for (const id of ids) {
        const raw = await this.publicClient.readContract({
          address: this.escrowAddress,
          abi: this.escrowAbi,
          functionName: 'getDeposit',
          args: [typeof id === 'bigint' ? id : BigInt(id)],
        });
        results.push(parseDepositView(raw));
      }
      return results;
    }
    const bn = ids.map((id) => (typeof id === 'bigint' ? id : BigInt(id)));
    const raw = (await this.publicClient.readContract({
      address: this.protocolViewerAddress!,
      abi: this.protocolViewerAbi!,
      functionName: 'getDepositFromIds',
      args: [bn],
    })) as any[];
    const { parseDepositView } = await import('../utils/protocolViewerParsers');
    return raw.map(parseDepositView);
  }

  /**
   * Fetches all deposits owned by an address from on-chain.
   *
   * @param owner - The owner address
   * @returns Array of parsed deposit views
   */
  async getPvAccountDeposits(owner: Address) {
    try {
      const { address, abi } = this.requireProtocolViewer();
      const raw = (await this.publicClient.readContract({ address, abi, functionName: 'getAccountDeposits', args: [owner] })) as any[];
      const { parseDepositView } = await import('../utils/protocolViewerParsers');
      return raw.map(parseDepositView);
    } catch (e) {
      const raw = (await this.publicClient.readContract({ address: this.escrowAddress, abi: this.escrowAbi, functionName: 'getAccountDeposits', args: [owner] })) as any[];
      const { parseDepositView } = await import('../utils/protocolViewerParsers');
      return raw.map(parseDepositView);
    }
  }

  /**
   * Fetches all intents created by an address from on-chain.
   * Requires ProtocolViewer to be available.
   *
   * @param owner - The owner address
   * @returns Array of parsed intent views
   */
  async getPvAccountIntents(owner: Address) {
    const { address, abi } = this.requireProtocolViewer();
    const raw = (await this.publicClient.readContract({
      address,
      abi,
      functionName: 'getAccountIntents',
      args: [owner],
    })) as any[];
    const { parseIntentView } = await import('../utils/protocolViewerParsers');
    return raw.map(parseIntentView);
  }

  /**
   * Fetches a single intent by hash from on-chain.
   *
   * @param intentHash - The intent hash (0x-prefixed, 32 bytes)
   * @returns Parsed intent view with deposit context
   */
  async getPvIntent(intentHash: `0x${string}`) {
    const { address, abi } = this.requireProtocolViewer();
    const raw = await this.publicClient.readContract({
      address,
      abi,
      functionName: 'getIntent',
      args: [intentHash],
    });
    const { parseIntentView } = await import('../utils/protocolViewerParsers');
    return parseIntentView(raw);
  }

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║ CORE: UTILITIES                                                          ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  /**
   * Returns the USDC token address for the current network (if known).
   *
   * @returns USDC address or undefined if not configured
   */
  getUsdcAddress(): Address | undefined {
    return this._usdcAddress;
  }

  /**
   * Returns all deployed contract addresses for the current network/environment.
   *
   * @returns Object with escrow, orchestrator, protocolViewer, verifier, and USDC addresses
   */
  getDeployedAddresses(): { escrow: Address; orchestrator?: Address; protocolViewer?: Address; unifiedPaymentVerifier?: Address; usdc?: Address } {
    return {
      escrow: this.escrowAddress,
      orchestrator: this.orchestratorAddress,
      protocolViewer: this.protocolViewerAddress,
      unifiedPaymentVerifier: this.unifiedPaymentVerifier,
      usdc: this._usdcAddress,
    };
  }

  /**
   * Resolves all parameters needed to fulfill an intent.
   *
   * Attempts to fetch from ProtocolViewer first (on-chain source of truth),
   * then falls back to the indexer. This is called internally by `fulfillIntent`
   * but exposed for advanced use cases.
   *
   * @param intentHash - The intent hash to resolve
   * @returns Intent parameters needed for fulfillment
   * @throws Error if intent not found or payee details cannot be resolved
   */
  async getFulfillIntentInputs(intentHash: `0x${string}`): Promise<{
    amount: string;
    fiatCurrency: `0x${string}`;
    conversionRate: string;
    payeeDetails: `0x${string}`;
    intentTimestampMs: string; // on-chain snapshot timestamp in ms
    paymentMethodHash: `0x${string}`;
  }> {
    // 1) Try ProtocolViewer when available
    try {
      if (this.protocolViewerAddress && this.protocolViewerAbi) {
        const view = await this.getPvIntent(intentHash);
        const pmHash = (view.intent.paymentMethod as string).toLowerCase();
        const matched = (view.deposit.paymentMethods || []).find((pm: any) => (pm.paymentMethod as string)?.toLowerCase?.() === pmHash);
        const payee = matched?.verificationData?.payeeDetails as `0x${string}` | undefined;
        if (payee) {
          return {
            amount: (view.intent.amount as bigint).toString(),
            fiatCurrency: view.intent.fiatCurrency as `0x${string}`,
            conversionRate: (view.intent.conversionRate as bigint).toString(),
            payeeDetails: payee,
            intentTimestampMs: (BigInt(view.intent.timestamp as any) * 1000n).toString(),
            paymentMethodHash: view.intent.paymentMethod as `0x${string}`,
          };
        }
      }
    } catch {/* fall through */ }

    // 2) Fallback: indexer — fetch intent + deposit relations to recover payeeDetails
    const query = /* GraphQL */ `
      query GetIntentMinimal($hash: String!) {
        Intent(where: { intentHash: { _eq: $hash } }, limit: 1) {
          amount
          fiatCurrency
          conversionRate
          paymentMethodHash
          depositId
          signalTimestamp
        }
      }
    `;
    const res = await this._indexerClient.query<{ Intent?: Array<{ amount: string; fiatCurrency: string; conversionRate: string; paymentMethodHash?: string | null; depositId: string; signalTimestamp?: string }> }>({
      query,
      variables: { hash: intentHash.toLowerCase() },
    });
    const rec = res?.Intent?.[0];
    if (!rec) throw new Error('Intent not found on indexer');
    if (!rec.signalTimestamp) throw new Error('Intent signal timestamp not found on indexer');
    const deposit = await this._indexerService.fetchDepositWithRelations(rec.depositId, { includeIntents: false });
    let payee: string | undefined;
    const pmHashLower = (rec.paymentMethodHash || '').toLowerCase();
    for (const pm of deposit?.paymentMethods || []) {
      if ((pm.paymentMethodHash || '').toLowerCase() === pmHashLower) {
        payee = pm.payeeDetailsHash;
        break;
      }
    }
    if (!payee) throw new Error('Payee details not found for intent');
    return {
      amount: rec.amount,
      fiatCurrency: rec.fiatCurrency as `0x${string}`,
      conversionRate: rec.conversionRate,
      payeeDetails: payee as `0x${string}`,
      intentTimestampMs: (BigInt(rec.signalTimestamp) * 1000n).toString(),
      paymentMethodHash: (rec.paymentMethodHash || '0x0000000000000000000000000000000000000000000000000000000000000000') as `0x${string}`,
    };
  }
}
