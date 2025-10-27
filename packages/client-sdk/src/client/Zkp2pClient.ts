import type { Address, Hash, PublicClient, WalletClient } from 'viem';
import { createPublicClient, http } from 'viem';
import { base, baseSepolia, hardhat } from 'viem/chains';
import type { Abi } from 'abitype';

import { defaultIndexerEndpoint, IndexerClient } from '../indexer/client';
import { IndexerDepositService, type DepositFilter, type PaginationOptions } from '../indexer/service';
import type { DepositEntity, DepositWithRelations, IntentEntity, IntentStatus } from '../indexer/types';
import { getContracts, type RuntimeEnv } from '../contracts';
import { apiSignIntentV2 } from '../adapters/verification';
import { apiCreatePaymentAttestation } from '../adapters/attestation';
import { encodeAddressAsBytes, encodePaymentAttestation, encodeVerifyPaymentData } from '../utils/encode';
import { ethers } from 'ethers';
import { apiGetPayeeDetails, apiGetQuote } from '../adapters/api';
import { getGatingServiceAddress, getPaymentMethodsCatalog } from '../contracts';
import { resolveFiatCurrencyBytes32, resolvePaymentMethodHashFromCatalog } from '../utils/paymentResolution';
import type { QuoteRequest, QuoteResponse } from '../types';
import { ERC20_ABI } from '../utils/erc20';

export type Zkp2pNextOptions = {
  walletClient: WalletClient;
  chainId: number;
  rpcUrl?: string;
  runtimeEnv?: RuntimeEnv; // 'production' | 'staging'
  indexerUrl?: string;     // override
  // optional http verification (for orchestrator signal)
  baseApiUrl?: string;
  apiKey?: string;
  authorizationToken?: string;
  timeouts?: { api?: number };
};

export class Zkp2pClient {
  readonly walletClient: WalletClient;
  readonly publicClient: PublicClient;
  readonly chainId: number;
  readonly runtimeEnv: RuntimeEnv;

  // contracts v2
  readonly escrowAddress: Address;
  readonly escrowAbi: Abi;
  readonly orchestratorAddress?: Address;
  readonly orchestratorAbi?: Abi;
  readonly unifiedPaymentVerifier?: Address;
  readonly protocolViewerAddress?: Address;
  readonly protocolViewerAbi?: Abi;

  // indexer
  readonly indexer: IndexerClient;
  readonly deposits: IndexerDepositService;

  // http verification
  readonly baseApiUrl?: string;
  readonly apiKey?: string;
  readonly authorizationToken?: string;
  readonly apiTimeoutMs: number;
  private _usdcAddress?: Address;

  constructor(opts: Zkp2pNextOptions) {
    this.walletClient = opts.walletClient;
    this.chainId = opts.chainId;
    this.runtimeEnv = opts.runtimeEnv ?? 'production';
    const inferredRpc = (this.walletClient as any)?.chain?.rpcUrls?.default?.http?.[0] as string | undefined;
    const rpc = opts.rpcUrl ?? inferredRpc ?? 'http://127.0.0.1:8545';
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

    // indexer
    const endpoint = opts.indexerUrl ?? defaultIndexerEndpoint(this.runtimeEnv === 'staging' ? 'STAGING' : 'PRODUCTION');
    this.indexer = new IndexerClient(endpoint);
    this.deposits = new IndexerDepositService(this.indexer);

    // http verification config
    this.baseApiUrl = opts.baseApiUrl;
    this.apiKey = opts.apiKey;
    this.authorizationToken = opts.authorizationToken;
    this.apiTimeoutMs = opts.timeouts?.api ?? 15000;
  }

  // ---------- Read methods (Indexer) ----------

  getDeposits(filter?: DepositFilter, pagination?: PaginationOptions): Promise<DepositEntity[]> {
    return this.deposits.fetchDeposits(filter, pagination);
  }

  getDepositsWithRelations(filter?: DepositFilter, pagination?: PaginationOptions, options?: { includeIntents?: boolean; intentStatuses?: IntentStatus[] }): Promise<DepositWithRelations[]> {
    return this.deposits.fetchDepositsWithRelations(filter, pagination, options);
  }

  getDepositById(id: string, options?: { includeIntents?: boolean; intentStatuses?: IntentStatus[] }): Promise<DepositWithRelations | null> {
    return this.deposits.fetchDepositWithRelations(id, options);
  }

  getIntentsForDeposits(depositIds: string[], statuses: IntentStatus[] = ['SIGNALED']): Promise<IntentEntity[]> {
    return this.deposits.fetchIntentsForDeposits(depositIds, statuses);
  }

  getOwnerIntents(owner: string, statuses?: IntentStatus[]): Promise<IntentEntity[]> {
    return this.deposits.fetchIntentsByOwner(owner, statuses);
  }

  // ---------- Write methods (Contracts v3, orchestrator-only) ----------

  /**
   * Ensure ERC20 allowance for Escrow (spender) is sufficient for the given amount.
   * If insufficient, approves either the exact amount or MaxUint256 when maxApprove is true.
   */
  async ensureAllowance(params: { token: Address; amount: bigint; spender?: Address; maxApprove?: boolean; txOverrides?: Record<string, unknown> }): Promise<{ hadAllowance: boolean; hash?: Hash }> {
    const owner = this.walletClient.account?.address as Address | undefined;
    if (!owner) throw new Error('Wallet client is missing account');
    const spender = params.spender ?? this.escrowAddress;
    const allowance = (await this.publicClient.readContract({ address: params.token, abi: ERC20_ABI as any, functionName: 'allowance', args: [owner, spender] })) as bigint;
    if (allowance >= params.amount) return { hadAllowance: true };
    const MAX = (1n << 256n) - 1n;
    const value = params.maxApprove ? MAX : params.amount;
    const { request } = await this.publicClient.simulateContract({ address: params.token, abi: ERC20_ABI as any, functionName: 'approve', args: [spender, value], account: this.walletClient.account!, ...(params.txOverrides ?? {}) });
    const hash = (await this.walletClient.writeContract(request)) as Hash;
    return { hadAllowance: false, hash };
  }

  async createDeposit(params: {
    token: Address;
    amount: bigint;
    intentAmountRange: { min: bigint; max: bigint };
    paymentMethods: `0x${string}`[];
    paymentMethodData: { intentGatingService: Address; payeeDetails: string; data: `0x${string}` }[];
    currencies: { code: `0x${string}`; minConversionRate: bigint }[][];
    delegate?: Address;
    intentGuardian?: Address;
    retainOnEmpty?: boolean;
    txOverrides?: Record<string, unknown>;
  }): Promise<Hash> {
    const args = [{
      token: params.token,
      amount: params.amount,
      intentAmountRange: params.intentAmountRange,
      paymentMethods: params.paymentMethods,
      paymentMethodData: params.paymentMethodData,
      currencies: params.currencies,
      delegate: (params.delegate ?? '0x0000000000000000000000000000000000000000') as Address,
      intentGuardian: (params.intentGuardian ?? '0x0000000000000000000000000000000000000000') as Address,
      retainOnEmpty: Boolean(params.retainOnEmpty ?? false),
    }];

    const { request } = await this.publicClient.simulateContract({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'createDeposit',
      args,
      account: this.walletClient.account!,
      ...(params.txOverrides ?? {}),
    });
    const hash = await this.walletClient.writeContract(request);
    return hash as Hash;
  }

  // ---------- Maker-side deposit management (Escrow v3) ----------

  async setAcceptingIntents(params: { depositId: bigint; accepting: boolean; txOverrides?: Record<string, unknown> }): Promise<Hash> {
    const { request } = await this.publicClient.simulateContract({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'setAcceptingIntents',
      args: [params.depositId, params.accepting],
      account: this.walletClient.account!,
      ...(params.txOverrides ?? {}),
    });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  async setIntentRange(params: { depositId: bigint; min: bigint; max: bigint; txOverrides?: Record<string, unknown> }): Promise<Hash> {
    const { request } = await this.publicClient.simulateContract({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'setIntentRange',
      args: [params.depositId, { min: params.min, max: params.max }],
      account: this.walletClient.account!,
      ...(params.txOverrides ?? {}),
    });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  async setCurrencyMinRate(params: { depositId: bigint; paymentMethod: `0x${string}`; fiatCurrency: `0x${string}`; minConversionRate: bigint; txOverrides?: Record<string, unknown> }): Promise<Hash> {
    const { request } = await this.publicClient.simulateContract({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'setCurrencyMinRate',
      args: [params.depositId, params.paymentMethod, params.fiatCurrency, params.minConversionRate],
      account: this.walletClient.account!,
      ...(params.txOverrides ?? {}),
    });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  async addFunds(params: { depositId: bigint; amount: bigint; txOverrides?: Record<string, unknown> }): Promise<Hash> {
    const { request } = await this.publicClient.simulateContract({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'addFunds',
      args: [params.depositId, params.amount],
      account: this.walletClient.account!,
      ...(params.txOverrides ?? {}),
    });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  async removeFunds(params: { depositId: bigint; amount: bigint; txOverrides?: Record<string, unknown> }): Promise<Hash> {
    const { request } = await this.publicClient.simulateContract({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'removeFunds',
      args: [params.depositId, params.amount],
      account: this.walletClient.account!,
      ...(params.txOverrides ?? {}),
    });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  async withdrawDeposit(params: { depositId: bigint; txOverrides?: Record<string, unknown> }): Promise<Hash> {
    const { request } = await this.publicClient.simulateContract({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'withdrawDeposit',
      args: [params.depositId],
      account: this.walletClient.account!,
      ...(params.txOverrides ?? {}),
    });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  // ---------- Additional Escrow administration (V3) ----------

  async setRetainOnEmpty(params: { depositId: bigint; retain: boolean; txOverrides?: Record<string, unknown> }): Promise<Hash> {
    const { request } = await this.publicClient.simulateContract({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'setRetainOnEmpty',
      args: [params.depositId, params.retain],
      account: this.walletClient.account!,
      ...(params.txOverrides ?? {}),
    });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  async setDelegate(params: { depositId: bigint; delegate: Address; txOverrides?: Record<string, unknown> }): Promise<Hash> {
    const { request } = await this.publicClient.simulateContract({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'setDelegate',
      args: [params.depositId, params.delegate],
      account: this.walletClient.account!,
      ...(params.txOverrides ?? {}),
    });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  async removeDelegate(params: { depositId: bigint; txOverrides?: Record<string, unknown> }): Promise<Hash> {
    const { request } = await this.publicClient.simulateContract({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'removeDelegate',
      args: [params.depositId],
      account: this.walletClient.account!,
      ...(params.txOverrides ?? {}),
    });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  async addPaymentMethods(params: { depositId: bigint; paymentMethods: `0x${string}`[]; paymentMethodData: { intentGatingService: Address; payeeDetails: string; data: `0x${string}` }[]; txOverrides?: Record<string, unknown> }): Promise<Hash> {
    const { request } = await this.publicClient.simulateContract({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'addPaymentMethods',
      args: [params.depositId, params.paymentMethods, params.paymentMethodData],
      account: this.walletClient.account!,
      ...(params.txOverrides ?? {}),
    });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  async setPaymentMethodActive(params: { depositId: bigint; paymentMethod: `0x${string}`; isActive: boolean; txOverrides?: Record<string, unknown> }): Promise<Hash> {
    const { request } = await this.publicClient.simulateContract({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'setPaymentMethodActive',
      args: [params.depositId, params.paymentMethod, params.isActive],
      account: this.walletClient.account!,
      ...(params.txOverrides ?? {}),
    });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  async removePaymentMethod(params: { depositId: bigint; paymentMethod: `0x${string}`; txOverrides?: Record<string, unknown> }): Promise<Hash> {
    return this.setPaymentMethodActive({ depositId: params.depositId, paymentMethod: params.paymentMethod, isActive: false, txOverrides: params.txOverrides });
  }

  async addCurrencies(params: { depositId: bigint; paymentMethod: `0x${string}`; currencies: { code: `0x${string}`; minConversionRate: bigint }[]; txOverrides?: Record<string, unknown> }): Promise<Hash> {
    const { request } = await this.publicClient.simulateContract({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'addCurrencies',
      args: [params.depositId, params.paymentMethod, params.currencies],
      account: this.walletClient.account!,
      ...(params.txOverrides ?? {}),
    });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  async deactivateCurrency(params: { depositId: bigint; paymentMethod: `0x${string}`; currencyCode: `0x${string}`; txOverrides?: Record<string, unknown> }): Promise<Hash> {
    const { request } = await this.publicClient.simulateContract({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'deactivateCurrency',
      args: [params.depositId, params.paymentMethod, params.currencyCode],
      account: this.walletClient.account!,
      ...(params.txOverrides ?? {}),
    });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  async removeCurrency(params: { depositId: bigint; paymentMethod: `0x${string}`; currencyCode: `0x${string}`; txOverrides?: Record<string, unknown> }): Promise<Hash> {
    return this.deactivateCurrency(params);
  }

  async pruneExpiredIntents(params: { depositId: bigint; txOverrides?: Record<string, unknown> }): Promise<Hash> {
    const { request } = await this.publicClient.simulateContract({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'pruneExpiredIntents',
      args: [params.depositId],
      account: this.walletClient.account!,
      ...(params.txOverrides ?? {}),
    });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  /**
   * Convenience wrapper for createDeposit that accepts processor names and hashedOnchainIds,
   * resolves paymentMethod hashes and auto-builds paymentMethodData using the gating service address.
   * Also validates currencies against allowed list per method when the catalog provides it.
   */
  async createDepositResolved(params: {
    token: Address;
    amount: bigint;
    intentAmountRange: { min: bigint; max: bigint };
    processorNames: string[];
    hashedOnchainIds: string[]; // one per processor
    // currencies grouped by processor, e.g., [[{ currency: 'USD', conversionRate: '1000000' }], …]
    conversionRates: { currency: string; conversionRate: string }[][];
    delegate?: Address;
    intentGuardian?: Address;
    retainOnEmpty?: boolean;
  }): Promise<Hash> {
    const methods = getPaymentMethodsCatalog(this.chainId, this.runtimeEnv);
    if (!Array.isArray(params.processorNames) || params.processorNames.length === 0) {
      throw new Error('processorNames must be a non-empty array');
    }
    if (params.processorNames.length !== params.hashedOnchainIds.length) {
      throw new Error('processorNames and hashedOnchainIds length mismatch');
    }
    if (params.processorNames.length !== params.conversionRates.length) {
      throw new Error('processorNames and conversionRates length mismatch');
    }

    const paymentMethods = params.processorNames.map((name) => resolvePaymentMethodHashFromCatalog(name, methods));
    const intentGatingService = getGatingServiceAddress(this.chainId, this.runtimeEnv);

    const paymentMethodData = params.hashedOnchainIds.map((hid) => ({
      intentGatingService,
      payeeDetails: hid,
      data: '0x' as `0x${string}`,
    }));

    // Validate currencies allowed per method when catalog provides list
    params.conversionRates.forEach((group, i) => {
      const key = params.processorNames[i]?.toLowerCase();
      const allowed = methods[key!]?.currencies?.map((c) => c.toLowerCase());
      if (allowed && allowed.length) {
        for (const { currency } of group) {
          const code = typeof currency === 'string' ? currency.toLowerCase() : String(currency).toLowerCase();
          const codeBytes32 = resolveFiatCurrencyBytes32(code).toLowerCase();
          if (!allowed.includes(codeBytes32)) {
            throw new Error(`Currency ${currency} not supported by ${params.processorNames[i]}. Allowed: ${allowed.join(', ')}`);
          }
        }
      }
    });

    // Map to on-chain struct shape (minConversionRate)
    const { mapConversionRatesToOnchainMinRate } = await import('../utils/currency');
    // Normalize currency codes to our CurrencyType union when possible
    const normalized = params.conversionRates.map((group) =>
      group.map((r) => ({ currency: r.currency as any, conversionRate: r.conversionRate }))
    );
    const currencies = mapConversionRatesToOnchainMinRate(normalized as any, paymentMethods.length);

    return this.createDeposit({
      token: params.token,
      amount: params.amount,
      intentAmountRange: params.intentAmountRange,
      paymentMethods,
      paymentMethodData,
      currencies,
      delegate: params.delegate,
      intentGuardian: params.intentGuardian,
      retainOnEmpty: params.retainOnEmpty,
    });
  }

  async signalIntent(params: {
    escrow: Address;
    depositId: bigint;
    amount: bigint;
    to: Address;
    paymentMethod: `0x${string}`;
    fiatCurrency: `0x${string}`;
    conversionRate: bigint;
    referrer?: Address;
    referrerFee?: bigint;
    postIntentHook?: Address;
    data?: `0x${string}`;
    // HTTP verification (optional)
    processorName?: string;
    payeeDetails?: string;
    gatingServiceSignature?: `0x${string}`;
    signatureExpiration?: bigint;
    txOverrides?: Record<string, unknown>;
  }): Promise<Hash> {
    if (!this.orchestratorAddress || !this.orchestratorAbi) throw new Error('Orchestrator not available');

    let { gatingServiceSignature, signatureExpiration } = params;
    if ((!gatingServiceSignature || !signatureExpiration) && this.baseApiUrl && (this.apiKey || this.authorizationToken)) {
      if (!params.processorName || !params.payeeDetails) {
        throw new Error('Missing processorName/payeeDetails for HTTP intent verification');
      }
      const resp = await apiSignIntentV2(
        {
          processorName: params.processorName,
          payeeDetails: params.payeeDetails,
          depositId: params.depositId.toString(),
          amount: params.amount.toString(),
          toAddress: params.to,
          paymentMethod: params.paymentMethod,
          fiatCurrency: params.fiatCurrency,
          conversionRate: params.conversionRate.toString(),
          chainId: this.chainId.toString(),
          orchestratorAddress: this.orchestratorAddress!,
          escrowAddress: params.escrow,
        },
        { baseApiUrl: this.baseApiUrl, apiKey: this.apiKey, authorizationToken: this.authorizationToken, timeoutMs: this.apiTimeoutMs }
      );
      gatingServiceSignature = resp.signature;
      signatureExpiration = resp.signatureExpiration;
    }

    if (!gatingServiceSignature || !signatureExpiration) {
      throw new Error('Missing gatingServiceSignature/signatureExpiration');
    }

    const args = [{
      escrow: params.escrow,
      depositId: params.depositId,
      amount: params.amount,
      to: params.to,
      paymentMethod: params.paymentMethod,
      fiatCurrency: params.fiatCurrency,
      conversionRate: params.conversionRate,
      referrer: (params.referrer ?? ('0x0000000000000000000000000000000000000000' as Address)) as Address,
      referrerFee: params.referrerFee ?? 0n,
      gatingServiceSignature,
      signatureExpiration,
      postIntentHook: (params.postIntentHook ?? ('0x0000000000000000000000000000000000000000' as Address)) as Address,
      data: (params.data ?? '0x') as `0x${string}`,
    }];

    const { request } = await this.publicClient.simulateContract({ address: this.orchestratorAddress, abi: this.orchestratorAbi, functionName: 'signalIntent', args, account: this.walletClient.account!, ...(params.txOverrides ?? {}) });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  /**
   * Convenience wrapper that resolves `paymentMethod` and `fiatCurrency` from human-readable inputs.
   * - processorName: e.g., 'wise', 'venmo' (or bytes32 hash)
   * - fiatCurrencyCode: e.g., 'USD' (or bytes32)
   * If API config is provided (apiKey or authorizationToken + baseApiUrl), will auto-fetch gating signature.
   */
  async signalIntentResolved(params: {
    escrow: Address;
    depositId: bigint;
    amount: bigint;
    to: Address;
    processorName: string; // name or bytes32
    fiatCurrencyCode: string; // ISO code or bytes32
    conversionRate: bigint;
    referrer?: Address;
    referrerFee?: bigint;
    postIntentHook?: Address;
    data?: `0x${string}`;
    payeeDetails?: string;
    gatingServiceSignature?: `0x${string}`;
    signatureExpiration?: bigint;
    txOverrides?: Record<string, unknown>;
  }): Promise<Hash> {
    const catalog = getPaymentMethodsCatalog(this.chainId, this.runtimeEnv);
    const paymentMethod = resolvePaymentMethodHashFromCatalog(params.processorName, catalog);
    const fiatCurrency = resolveFiatCurrencyBytes32(params.fiatCurrencyCode);
    return this.signalIntent({
      escrow: params.escrow,
      depositId: params.depositId,
      amount: params.amount,
      to: params.to,
      paymentMethod,
      fiatCurrency,
      conversionRate: params.conversionRate,
      referrer: params.referrer,
      referrerFee: params.referrerFee,
      postIntentHook: params.postIntentHook,
      data: params.data,
      processorName: params.processorName,
      payeeDetails: params.payeeDetails,
      gatingServiceSignature: params.gatingServiceSignature,
      signatureExpiration: params.signatureExpiration,
      txOverrides: params.txOverrides,
    });
  }

  async cancelIntent(params: { intentHash: `0x${string}`; txOverrides?: Record<string, unknown> }): Promise<Hash> {
    if (!this.orchestratorAddress || !this.orchestratorAbi) throw new Error('Orchestrator not available');
    const { request } = await this.publicClient.simulateContract({ address: this.orchestratorAddress, abi: this.orchestratorAbi, functionName: 'cancelIntent', args: [params.intentHash], account: this.walletClient.account!, ...(params.txOverrides ?? {}) });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  async releaseFundsToPayer(params: { intentHash: `0x${string}`; txOverrides?: Record<string, unknown> }): Promise<Hash> {
    if (!this.orchestratorAddress || !this.orchestratorAbi) throw new Error('Orchestrator not available');
    const { request } = await this.publicClient.simulateContract({
      address: this.orchestratorAddress,
      abi: this.orchestratorAbi,
      functionName: 'releaseFundsToPayer',
      args: [params.intentHash],
      account: this.walletClient.account!,
      ...(params.txOverrides ?? {}),
    });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  async fulfillIntentWithAttestation(params: {
    intentHash: `0x${string}`;
    zkTlsProof: string; // stringified proof JSON
    platform: string;
    actionType: string;
    amount: string; // decimal string
    timestampMs: string;
    fiatCurrency: `0x${string}`;
    conversionRate: string; // 1e18-scaled decimal string
    payeeDetails: `0x${string}`;
    timestampBufferMs: string;
    verifyingContract?: Address;
    attestationServiceUrl?: string;
    postIntentHookData?: `0x${string}`;
    txOverrides?: Record<string, unknown>;
  }): Promise<Hash> {
    if (!this.orchestratorAddress || !this.orchestratorAbi) throw new Error('Orchestrator not available');
    const attUrl = (params.attestationServiceUrl ?? this.defaultAttestationService());
    const paymentMethod = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(params.platform));
    const payload = {
      proofType: 'reclaim',
      proof: params.zkTlsProof,
      chainId: this.chainId,
      verifyingContract: params.verifyingContract ?? this.unifiedPaymentVerifier,
      intent: {
        intentHash: params.intentHash,
        amount: params.amount,
        timestampMs: params.timestampMs,
        paymentMethod,
        fiatCurrency: params.fiatCurrency,
        conversionRate: params.conversionRate,
        payeeDetails: params.payeeDetails,
        timestampBufferMs: params.timestampBufferMs,
      },
    } as Record<string, unknown>;

    const att = await apiCreatePaymentAttestation(payload, attUrl, params.platform, params.actionType);
    const paymentProof = encodePaymentAttestation(att);
    const verificationData = encodeVerifyPaymentData({
      intentHash: params.intentHash,
      paymentProof,
      data: encodeAddressAsBytes(att.responseObject.signer),
    });

    const args = [{
      paymentProof,
      intentHash: params.intentHash,
      verificationData,
      postIntentHookData: (params.postIntentHookData ?? '0x') as `0x${string}`,
    }];
    const { request } = await this.publicClient.simulateContract({ address: this.orchestratorAddress, abi: this.orchestratorAbi, functionName: 'fulfillIntent', args, account: this.walletClient.account!, ...(params.txOverrides ?? {}) });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  private defaultAttestationService(): string {
    return this.runtimeEnv === 'staging'
      ? 'https://attestation-service-staging.zkp2p.xyz'
      : 'https://attestation-service.zkp2p.xyz';
  }

  // ---------- HTTP: Quote (with optional payee enrichment) ----------
  async getQuote(req: QuoteRequest, opts?: { baseApiUrl?: string; timeoutMs?: number }): Promise<QuoteResponse> {
    const baseApiUrl = (opts?.baseApiUrl ?? this.baseApiUrl ?? 'https://api.zkp2p.xyz').replace(/\/$/, '');
    const timeoutMs = opts?.timeoutMs ?? this.apiTimeoutMs;
    const quote = await apiGetQuote(req, baseApiUrl, timeoutMs);
    // Enrich with payee details when auth is available
    const canEnrich = Boolean(this.apiKey || this.authorizationToken);
    const headersApiKey = this.apiKey;
    if (canEnrich) {
      const quotes = quote?.responseObject?.quotes ?? [];
      for (const q of quotes) {
        const intent: any = q.intent;
        const processorName = intent?.processorName;
        const hashedOnchainId = intent?.payeeDetails;
        if (!processorName || !hashedOnchainId) continue;
        try {
          const res = await apiGetPayeeDetails({ hashedOnchainId, processorName }, headersApiKey!, baseApiUrl, this.authorizationToken, timeoutMs);
          const data = res?.responseObject?.depositData;
          if (data && typeof q === 'object') (q as any).payeeData = data;
        } catch {
          // ignore enrichment failures
        }
      }
    }
    return quote;
  }

  // ---------- Optional on-chain views via ProtocolViewer ----------

  private requireProtocolViewer() {
    if (this.protocolViewerAddress && this.protocolViewerAbi) {
      return { address: this.protocolViewerAddress, abi: this.protocolViewerAbi } as const;
    }
    return { address: this.escrowAddress, abi: this.escrowAbi } as const;
  }

  async getPvDepositById(depositId: string | bigint) {
    const { address, abi } = this.requireProtocolViewer();
    const raw = await this.publicClient.readContract({
      address,
      abi,
      functionName: 'getDeposit',
      args: [typeof depositId === 'bigint' ? depositId : BigInt(depositId)],
    });
    const { parseDepositView } = await import('../utils/protocolViewerParsers');
    return parseDepositView(raw);
  }

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

  async getPvAccountDeposits(owner: Address) {
    const { address, abi } = this.requireProtocolViewer();
    const raw = (await this.publicClient.readContract({
      address,
      abi,
      functionName: 'getAccountDeposits',
      args: [owner],
    })) as any[];
    const { parseDepositView } = await import('../utils/protocolViewerParsers');
    return raw.map(parseDepositView);
  }

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

  // ---------- Convenience ----------
  getUsdcAddress(): Address | undefined {
    return this._usdcAddress;
  }

  getDeployedAddresses(): { escrow: Address; orchestrator?: Address; protocolViewer?: Address; unifiedPaymentVerifier?: Address; usdc?: Address } {
    return {
      escrow: this.escrowAddress,
      orchestrator: this.orchestratorAddress,
      protocolViewer: this.protocolViewerAddress,
      unifiedPaymentVerifier: this.unifiedPaymentVerifier,
      usdc: this._usdcAddress,
    };
  }
}
