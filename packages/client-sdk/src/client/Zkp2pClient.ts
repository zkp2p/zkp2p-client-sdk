import type { Address, Hash, PublicClient, WalletClient } from 'viem';
import { createPublicClient, http } from 'viem';
import { base, baseSepolia, hardhat } from 'viem/chains';
import type { Abi } from 'abitype';

import { defaultIndexerEndpoint, IndexerClient } from '../indexer/client';
import { IndexerDepositService, type DepositFilter, type PaginationOptions } from '../indexer/service';
import type { DepositEntity, DepositWithRelations, IntentEntity, IntentStatus, IntentFulfilledEntity } from '../indexer/types';
import { fetchFulfillmentAndPayment, type FulfillmentAndPaymentResponse } from '../indexer/intentVerification';
import { getContracts, type RuntimeEnv } from '../contracts';
import { apiSignIntentV2 } from '../adapters/verification';
import { apiCreatePaymentAttestation } from '../adapters/attestation';
import { encodeAddressAsBytes, encodePaymentAttestation, encodeVerifyPaymentData } from '../utils/encode';
import { ethers } from 'ethers';
import { apiGetPayeeDetails, apiGetQuote, apiPostDepositDetails } from '../adapters/api';
import { getGatingServiceAddress, getPaymentMethodsCatalog } from '../contracts';
import { resolveFiatCurrencyBytes32, resolvePaymentMethodHashFromCatalog } from '../utils/paymentResolution';
import { currencyKeccak256 } from '../utils/keccak';
import type { QuoteRequest, QuoteResponse, PostDepositDetailsRequest } from '../types';
import { ERC20_ABI } from '../utils/erc20';
import { DEPLOYED_ADDRESSES } from '../utils/constants';

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

    // // Fallback: if contracts-v2 mapping returned empty strings, attempt known constants by chain/env
    // const needEscrowFallback = !this.isValidHexAddress(this.escrowAddress as any);
    // if (needEscrowFallback) {
    //   const set = (DEPLOYED_ADDRESSES as any)[this.chainId];
    //   const envSet = (this.runtimeEnv === 'staging' ? set?.staging : set?.production) ?? set;
    //   const fallbackEscrow = envSet?.escrow as Address | undefined;
    //   const fallbackUsdc = envSet?.usdc as Address | undefined;
    //   if (this.isValidHexAddress(fallbackEscrow)) (this as any).escrowAddress = fallbackEscrow;
    //   if (this.isValidHexAddress(fallbackUsdc)) (this as any)._usdcAddress = fallbackUsdc;
    // }

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

  private isValidHexAddress(addr?: string | null): boolean {
    if (typeof addr !== 'string') return false;
    return /^0x[0-9a-fA-F]{40}$/.test(addr);
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

  getExpiredIntents(params: { now: bigint | string; depositIds: string[]; limit?: number }): Promise<IntentEntity[]> {
    return this.deposits.fetchExpiredIntents(params);
  }

  getFulfilledIntentEvents(intentHashes: string[]): Promise<IntentFulfilledEntity[]> {
    return this.deposits.fetchFulfilledIntentEvents(intentHashes);
  }

  getFulfillmentAndPayment(intentHash: string): Promise<FulfillmentAndPaymentResponse> {
    return fetchFulfillmentAndPayment(this.indexer, intentHash);
  }

  resolvePayeeHash(params: { escrowAddress?: string | null; depositId?: string | number | bigint | null; paymentMethodHash?: string | null }): Promise<string | null> {
    return this.deposits.resolvePayeeHash(params);
  }

  getDepositsByPayeeHash(payeeHash: string, options: { paymentMethodHash?: string; limit?: number; includeIntents?: boolean; intentStatuses?: IntentStatus[] } = {}): Promise<DepositWithRelations[]> {
    return this.deposits.fetchDepositsByPayeeHash(payeeHash, options);
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

  // Unified createDeposit: human-friendly API using processor names and currency codes.
  async createDeposit(params: {
    token: Address;
    amount: bigint;
    intentAmountRange: { min: bigint; max: bigint };
    processorNames: string[];
    depositData: { [key: string]: string }[];
    conversionRates: { currency: string; conversionRate: string }[][]; // grouped per processor
    delegate?: Address;
    intentGuardian?: Address;
    retainOnEmpty?: boolean;
    txOverrides?: Record<string, unknown>;
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
      depositDetails.map((req) => apiPostDepositDetails(req, this.apiKey!, baseApiUrl, this.authorizationToken, this.apiTimeoutMs))
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

    const { request } = await this.publicClient.simulateContract({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'createDeposit',
      args,
      account: this.walletClient.account!,
      ...(params.txOverrides ?? {}),
    });
    const hash = (await this.walletClient.writeContract(request)) as Hash;
    return { depositDetails, hash };
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
    txOverrides?: Record<string, unknown>;
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

    const { request } = await this.publicClient.simulateContract({ address: this.orchestratorAddress, abi: this.orchestratorAbi, functionName: 'signalIntent', args, account: this.walletClient.account!, ...(params.txOverrides ?? {}) });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  // private async ensureContractsForSignal(depositId: bigint | string) {
  //   // Escrow: try to resolve from indexer using chainId + depositId
  //   if (!this.isValidHexAddress(this.escrowAddress as any)) {
  //     const depId = typeof depositId === 'bigint' ? depositId.toString() : String(depositId);
  //     try {
  //       const query = /* GraphQL */ `
  //         query GetEscrowByDepositId($chainId: Int!, $depositId: String!) {
  //           Deposit(where: { chainId: { _eq: $chainId }, depositId: { _eq: $depositId } }, limit: 1) {
  //             escrowAddress
  //           }
  //         }
  //       `;
  //       const res = await this.indexer.query<{ Deposit: Array<{ escrowAddress: string }> }>({
  //         query,
  //         variables: { chainId: this.chainId, depositId: depId },
  //       });
  //       const esc = res?.Deposit?.[0]?.escrowAddress as Address | undefined;
  //       if (this.isValidHexAddress(esc)) (this as any).escrowAddress = esc;
  //     } catch {/* ignore */ }
  //   }

  //   // Orchestrator: try to resolve from latest intents on this chain
  //   if (!this.isValidHexAddress(this.orchestratorAddress as any)) {
  //     try {
  //       const query = /* GraphQL */ `
  //         query GetLatestIntent($chainId: Int!) {
  //           Intent(where: { chainId: { _eq: $chainId } }, order_by: { signalTimestamp: desc }, limit: 1) {
  //             orchestratorAddress
  //           }
  //         }
  //       `;
  //       const res = await this.indexer.query<{ Intent: Array<{ orchestratorAddress: string }> }>({
  //         query,
  //         variables: { chainId: this.chainId },
  //       });
  //       const orch = res?.Intent?.[0]?.orchestratorAddress as Address | undefined;
  //       if (this.isValidHexAddress(orch)) (this as any).orchestratorAddress = orch;
  //     } catch {/* ignore */ }
  //   }
  // }

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

  // Breaking API: minimal inputs. Derives everything from intentHash.
  async fulfillIntent(params: {
    intentHash: `0x${string}`;
    proof: any | string; // extension-produced proof (object or stringified)
    timestampBufferMs?: string; // note: attestation service should default; we pass a sane default for now
    attestationServiceUrl?: string;
    verifyingContract?: Address;
    postIntentHookData?: `0x${string}`;
    txOverrides?: Record<string, unknown>;
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
    const paymentMethodHash = inputs.paymentMethodHash || '0x';
    const timestampBufferMs = params.timestampBufferMs ?? '300000'; // note: service should default; keep explicit for now

    // Map paymentMethodHash -> platform/actionType for Attestation Service endpoint
    const catalog = getPaymentMethodsCatalog(this.chainId, this.runtimeEnv);
    const { resolvePaymentMethodNameFromHash } = await import('../utils/paymentResolution');
    const platformName = resolvePaymentMethodNameFromHash(paymentMethodHash, catalog);
    if (!platformName) throw new Error('Unknown paymentMethodHash for this network/env; update SDK catalogs.');
    const { resolvePlatformMethod } = await import('../extension/platformConfig');
    const cfg = resolvePlatformMethod(platformName as any);
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
    const { request } = await this.publicClient.simulateContract({ address: this.orchestratorAddress, abi: this.orchestratorAbi, functionName: 'fulfillIntent', args, account: this.walletClient.account!, ...(params.txOverrides ?? {}) });
    const txHash = (await this.walletClient.writeContract(request as any)) as Hash;
    params?.callbacks?.onTxSent?.(txHash);
    // We do not wait for receipt here; caller can wait or use callback if we later add it
    return txHash;
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
    // Include the native escrow only when caller did not provide filters
    const reqWithEscrow = { ...(req as any) } as QuoteRequest & { escrowAddresses?: string[] };
    if ((!reqWithEscrow.escrowAddresses || reqWithEscrow.escrowAddresses.length === 0) && this.escrowAddress) {
      reqWithEscrow.escrowAddresses = [this.escrowAddress as string];
    }
    const quote = await apiGetQuote(reqWithEscrow as any, baseApiUrl, timeoutMs);
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
    if (!this.protocolViewerAddress || !this.protocolViewerAbi) {
      throw new Error('ProtocolViewer not available for this network');
    }
    return { address: this.protocolViewerAddress, abi: this.protocolViewerAbi } as const;
  }

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

  // /**
  //  * Best-effort address hydration from the indexer. Useful when contracts-v2 address JSONs are outdated
  //  * in the local environment. This will not throw; it only sets addresses when confidently discovered.
  //  */
  // async hydrateContracts(): Promise<void> {
  //   // Escrow from latest deposit
  //   if (!this.isValidHexAddress(this.escrowAddress as any)) {
  //     try {
  //       const query = /* GraphQL */ `
  //         query GetLatestDeposit($chainId: Int!) {
  //           Deposit(where: { chainId: { _eq: $chainId } }, order_by: { timestamp: desc }, limit: 1) {
  //             escrowAddress
  //           }
  //         }
  //       `;
  //       const res = await this.indexer.query<{ Deposit: Array<{ escrowAddress: string }> }>({ query, variables: { chainId: this.chainId } });
  //       const esc = res?.Deposit?.[0]?.escrowAddress as Address | undefined;
  //       if (this.isValidHexAddress(esc)) (this as any).escrowAddress = esc;
  //     } catch {/* ignore */ }
  //   }

  //   // Orchestrator from latest intent
  //   if (!this.isValidHexAddress(this.orchestratorAddress as any)) {
  //     try {
  //       const query = /* GraphQL */ `
  //         query GetLatestIntent($chainId: Int!) {
  //           Intent(where: { chainId: { _eq: $chainId } }, order_by: { signalTimestamp: desc }, limit: 1) {
  //             orchestratorAddress
  //           }
  //         }
  //       `;
  //       const res = await this.indexer.query<{ Intent: Array<{ orchestratorAddress: string }> }>({ query, variables: { chainId: this.chainId } });
  //       const orch = res?.Intent?.[0]?.orchestratorAddress as Address | undefined;
  //       if (this.isValidHexAddress(orch)) (this as any).orchestratorAddress = orch;
  //     } catch {/* ignore */ }
  //   }
  // }

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

  /**
   * Resolve intent parameters required for fulfillIntent from on-chain views or the indexer.
   * Returns amount, fiatCurrency, conversionRate, and payeeDetails (hashed on-chain id).
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
    const res = await this.indexer.query<{ Intent?: Array<{ amount: string; fiatCurrency: string; conversionRate: string; paymentMethodHash?: string | null; depositId: string; signalTimestamp?: string }> }>({
      query,
      variables: { hash: intentHash.toLowerCase() },
    });
    const rec = res?.Intent?.[0];
    if (!rec) throw new Error('Intent not found on indexer');
    if (!rec.signalTimestamp) throw new Error('Intent signal timestamp not found on indexer');
    const deposit = await this.deposits.fetchDepositWithRelations(rec.depositId, { includeIntents: false });
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
