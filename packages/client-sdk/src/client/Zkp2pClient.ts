import type { Address, Hash, PublicClient, WalletClient } from 'viem';
import { createPublicClient, http } from 'viem';
import type { Abi } from 'abitype';

import { defaultIndexerEndpoint, IndexerClient } from '../indexer/client';
import { IndexerDepositService, type DepositFilter, type PaginationOptions } from '../indexer/service';
import type { DepositEntity, DepositWithRelations, IntentEntity, IntentStatus } from '../indexer/types';
import { getContractsV2, orchestratorAvailable, type RuntimeEnv } from '../contractsV2';
import { apiSignIntentV2 } from '../adapters/verification';

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

  // indexer
  readonly indexer: IndexerClient;
  readonly deposits: IndexerDepositService;

  // http verification
  readonly baseApiUrl?: string;
  readonly apiKey?: string;
  readonly authorizationToken?: string;
  readonly apiTimeoutMs: number;

  constructor(opts: Zkp2pNextOptions) {
    this.walletClient = opts.walletClient;
    this.chainId = opts.chainId;
    this.runtimeEnv = opts.runtimeEnv ?? 'production';
    this.publicClient = createPublicClient({ transport: http(opts.rpcUrl ?? '') });

    // contracts-v2 resolution
    const { addresses, abis } = getContractsV2(this.chainId, this.runtimeEnv);
    this.escrowAddress = addresses.escrow as Address;
    this.escrowAbi = abis.escrow;
    this.orchestratorAddress = addresses.orchestrator as Address | undefined;
    this.orchestratorAbi = abis.orchestrator;
    this.unifiedPaymentVerifier = addresses.unifiedPaymentVerifier as Address | undefined;

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

  // ---------- Write methods (Contracts v2.1, orchestrator-first) ----------

  async createDeposit(params: {
    token: Address;
    amount: bigint;
    intentAmountRange: { min: bigint; max: bigint };
    paymentMethods: `0x${string}`[];
    paymentMethodData: { intentGatingService: Address; payeeDetails: string; data: `0x${string}` }[];
    currencies: { code: `0x${string}`; minConversionRate: bigint }[][];
    delegate?: Address;
    intentGuardian?: Address;
    referrer?: Address;
    referrerFee?: bigint;
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
      referrer: (params.referrer ?? '0x0000000000000000000000000000000000000000') as Address,
      referrerFee: params.referrerFee ?? 0n,
    }];

    const { request } = await this.publicClient.simulateContract({
      address: this.escrowAddress,
      abi: this.escrowAbi,
      functionName: 'createDeposit',
      args,
      account: this.walletClient.account!,
    });
    const hash = await this.walletClient.writeContract(request);
    return hash as Hash;
  }

  async signalIntent(params:
    | {
        useOrchestrator?: boolean;
        orchestrator: {
          escrow: Address;
          depositId: bigint;
          amount: bigint;
          to: Address;
          paymentMethod: `0x${string}`;
          fiatCurrency: `0x${string}`;
          conversionRate: bigint;
          gatingServiceSignature?: `0x${string}`; // if omitted, SDK will try to fetch via HTTP if configured
          signatureExpiration?: bigint;           // same as above
          referrer?: Address;
          referrerFee?: bigint;
          postIntentHook?: Address;
          data?: `0x${string}`;
          processorName?: string; // for HTTP verifier
          payeeDetails?: string;   // for HTTP verifier
        };
      }
    | {
        // Escrow path (direct)
        depositId: bigint;
        tokenAmount: bigint;
        to: Address;
        verifier: Address;
        currencyCodeHash: `0x${string}`;
        gatingServiceSignature: `0x${string}`;
      }
  ): Promise<Hash> {
    const isOrchInput = (p: any): p is { useOrchestrator?: boolean; orchestrator: any } => 'orchestrator' in p;
    if (isOrchInput(params)) {
      const preferOrchestrator = params.useOrchestrator !== false && orchestratorAvailable({ escrow: this.escrowAddress, orchestrator: this.orchestratorAddress }, { escrow: this.escrowAbi, orchestrator: this.orchestratorAbi });
      if (!preferOrchestrator || !this.orchestratorAddress || !this.orchestratorAbi) {
        throw new Error('Orchestrator not available');
      }

      let { gatingServiceSignature, signatureExpiration } = params.orchestrator;
      if ((!gatingServiceSignature || !signatureExpiration) && this.baseApiUrl && (this.apiKey || this.authorizationToken)) {
        if (!params.orchestrator.processorName || !params.orchestrator.payeeDetails) {
          throw new Error('Missing processorName/payeeDetails for HTTP intent verification');
        }
        const resp = await apiSignIntentV2(
          {
            processorName: params.orchestrator.processorName,
            payeeDetails: params.orchestrator.payeeDetails,
            depositId: params.orchestrator.depositId.toString(),
            amount: params.orchestrator.amount.toString(),
            toAddress: params.orchestrator.to,
            paymentMethod: params.orchestrator.paymentMethod,
            fiatCurrency: params.orchestrator.fiatCurrency,
            conversionRate: params.orchestrator.conversionRate.toString(),
            chainId: this.chainId.toString(),
            orchestratorAddress: this.orchestratorAddress!,
            escrowAddress: params.orchestrator.escrow,
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
        escrow: params.orchestrator.escrow,
        depositId: params.orchestrator.depositId,
        amount: params.orchestrator.amount,
        to: params.orchestrator.to,
        paymentMethod: params.orchestrator.paymentMethod,
        fiatCurrency: params.orchestrator.fiatCurrency,
        conversionRate: params.orchestrator.conversionRate,
        referrer: (params.orchestrator.referrer ?? ('0x0000000000000000000000000000000000000000' as Address)) as Address,
        referrerFee: params.orchestrator.referrerFee ?? 0n,
        gatingServiceSignature,
        signatureExpiration,
        postIntentHook: (params.orchestrator.postIntentHook ?? ('0x0000000000000000000000000000000000000000' as Address)) as Address,
        data: (params.orchestrator.data ?? '0x') as `0x${string}`,
      }];

      const { request } = await this.publicClient.simulateContract({ address: this.orchestratorAddress, abi: this.orchestratorAbi, functionName: 'signalIntent', args, account: this.walletClient.account! });
      return (await this.walletClient.writeContract(request)) as Hash;
    }

    // Escrow path
    const args = [params.depositId, params.tokenAmount, params.to, params.verifier, params.currencyCodeHash, params.gatingServiceSignature] as const;
    const { request } = await this.publicClient.simulateContract({ address: this.escrowAddress, abi: this.escrowAbi, functionName: 'signalIntent', args, account: this.walletClient.account! });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  async cancelIntent(params: { intentHash: `0x${string}`; useOrchestrator?: boolean }): Promise<Hash> {
    const preferOrchestrator = params.useOrchestrator !== false && orchestratorAvailable({ escrow: this.escrowAddress, orchestrator: this.orchestratorAddress }, { escrow: this.escrowAbi, orchestrator: this.orchestratorAbi });
    if (preferOrchestrator && this.orchestratorAddress && this.orchestratorAbi) {
      const { request } = await this.publicClient.simulateContract({ address: this.orchestratorAddress, abi: this.orchestratorAbi, functionName: 'cancelIntent', args: [params.intentHash], account: this.walletClient.account! });
      return (await this.walletClient.writeContract(request)) as Hash;
    }
    const { request } = await this.publicClient.simulateContract({ address: this.escrowAddress, abi: this.escrowAbi, functionName: 'cancelIntent', args: [params.intentHash], account: this.walletClient.account! });
    return (await this.walletClient.writeContract(request)) as Hash;
  }

  async fulfillIntent(params: {
    useOrchestrator?: boolean;
    // orchestrator struct
    orchestratorCall?: { intentHash: `0x${string}`; verificationData?: `0x${string}`; paymentProof?: `0x${string}`; postIntentHookData?: `0x${string}` };
    // escrow tuple
    escrowCall?: { paymentProof: `0x${string}`; intentHash: `0x${string}` };
  }): Promise<Hash> {
    const preferOrchestrator = params.useOrchestrator !== false && orchestratorAvailable({ escrow: this.escrowAddress, orchestrator: this.orchestratorAddress }, { escrow: this.escrowAbi, orchestrator: this.orchestratorAbi });

    if (preferOrchestrator && this.orchestratorAddress && this.orchestratorAbi && params.orchestratorCall) {
      const args = [{
        paymentProof: (params.orchestratorCall.paymentProof ?? '0x') as `0x${string}`,
        intentHash: params.orchestratorCall.intentHash,
        verificationData: (params.orchestratorCall.verificationData ?? '0x') as `0x${string}`,
        postIntentHookData: (params.orchestratorCall.postIntentHookData ?? '0x') as `0x${string}`,
      }];
      const { request } = await this.publicClient.simulateContract({ address: this.orchestratorAddress, abi: this.orchestratorAbi, functionName: 'fulfillIntent', args, account: this.walletClient.account! });
      return (await this.walletClient.writeContract(request)) as Hash;
    }

    if (!params.escrowCall) throw new Error('Escrow fulfillIntent requires escrowCall { paymentProof, intentHash }');
    const { paymentProof, intentHash } = params.escrowCall;
    const { request } = await this.publicClient.simulateContract({ address: this.escrowAddress, abi: this.escrowAbi, functionName: 'fulfillIntent', args: [paymentProof, intentHash], account: this.walletClient.account! });
    return (await this.walletClient.writeContract(request)) as Hash;
  }
}
