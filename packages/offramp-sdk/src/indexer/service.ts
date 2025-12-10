import { IndexerClient } from './client';
import {
  DEPOSITS_QUERY,
  DEPOSITS_BY_IDS_QUERY,
  DEPOSIT_RELATIONS_QUERY,
  DEPOSIT_WITH_RELATIONS_QUERY,
  INTENTS_QUERY,
  EXPIRED_INTENTS_QUERY,
  INTENT_FULFILLMENTS_QUERY,
  PAYMENT_METHODS_BY_PAYEE_HASH_QUERY,
} from './queries';
import type {
  DepositEntity,
  DepositPaymentMethodEntity,
  MethodCurrencyEntity,
  IntentEntity,
  IntentStatus,
  DepositWithRelations,
  IntentFulfilledEntity,
} from './types';
import { createCompositeDepositId } from './converters';

export type DepositOrderField =
  | 'remainingDeposits'
  | 'outstandingIntentAmount'
  | 'totalAmountTaken'
  | 'totalWithdrawn'
  | 'updatedAt'
  | 'timestamp';
export type OrderDirection = 'asc' | 'desc';

export type DepositFilter = Partial<{
  status: 'ACTIVE' | 'CLOSED';
  depositor: string;
  chainId: number;
  escrowAddress: string;
  escrowAddresses: string[];
  minLiquidity: string;
  acceptingIntents: boolean;
}>;

export type PaginationOptions = Partial<{
  limit: number;
  offset: number;
  orderBy: DepositOrderField;
  orderDirection: OrderDirection;
}>;

function groupByDepositId<T extends { depositId: string | null | undefined }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    if (!item.depositId) continue;
    const key = item.depositId.toLowerCase();
    const bucket = map.get(key);
    if (bucket) bucket.push(item); else map.set(key, [item]);
  }
  return map;
}

const DEFAULT_LIMIT = 100;
const DEFAULT_ORDER_FIELD: NonNullable<PaginationOptions['orderBy']> = 'remainingDeposits';

export class IndexerDepositService {
  constructor(private client: IndexerClient) {}

  private buildDepositWhere(filter?: DepositFilter): Record<string, unknown> | undefined {
    if (!filter) return undefined;
    const where: Record<string, unknown> = {};
    if (filter.status) where.status = { _eq: filter.status };
    if (filter.depositor) where.depositor = { _ilike: filter.depositor };
    if (filter.chainId) where.chainId = { _eq: filter.chainId };
    if (filter.escrowAddresses && filter.escrowAddresses.length) {
      where.escrowAddress = { _in: filter.escrowAddresses };
    } else if (filter.escrowAddress) {
      where.escrowAddress = { _ilike: filter.escrowAddress };
    }
    if (filter.acceptingIntents !== undefined) where.acceptingIntents = { _eq: filter.acceptingIntents };
    // Filter by remainingDeposits; this is schema-stable across deployments.
    if (filter.minLiquidity) where.remainingDeposits = { _gte: filter.minLiquidity };
    return Object.keys(where).length ? where : undefined;
  }

  private buildOrderBy(pagination?: PaginationOptions): Array<Record<string, 'asc' | 'desc'>> {
    const field: NonNullable<PaginationOptions['orderBy']> = pagination?.orderBy ?? DEFAULT_ORDER_FIELD;
    const direction = pagination?.orderDirection === 'asc' ? 'asc' : 'desc';
    return [{ [field]: direction } as any];
  }

  private async fetchRelations(depositIds: string[]) {
    if (!depositIds.length) {
      return {
        paymentMethodsByDeposit: new Map<string, DepositPaymentMethodEntity[]>(),
        currenciesByDeposit: new Map<string, MethodCurrencyEntity[]>(),
      };
    }

    const result = await this.client.query<{
      DepositPaymentMethod?: DepositPaymentMethodEntity[];
      MethodCurrency?: MethodCurrencyEntity[];
    }>({ query: DEPOSIT_RELATIONS_QUERY, variables: { depositIds } });

    const paymentMethodsByDeposit = groupByDepositId(result.DepositPaymentMethod ?? []);
    const currenciesByDeposit = groupByDepositId(result.MethodCurrency ?? []);
    return { paymentMethodsByDeposit, currenciesByDeposit };
  }

  private async fetchIntents(params: { depositIds?: string[]; owner?: string; statuses?: IntentStatus[]; limit?: number; offset?: number }): Promise<IntentEntity[]> {
    const where: Record<string, unknown> = {};
    if (params.depositIds?.length) where.depositId = { _in: params.depositIds };
    if (params.owner) where.owner = { _ilike: params.owner };
    if (params.statuses?.length) where.status = { _in: params.statuses };
    if (!Object.keys(where).length) return [];

    const result = await this.client.query<{ Intent?: IntentEntity[] }>({
      query: INTENTS_QUERY,
      variables: { where, order_by: [{ signalTimestamp: 'desc' }], limit: params.limit, offset: params.offset },
    });
    return result.Intent ?? [];
  }

  private async attachRelations(
    deposits: DepositEntity[],
    options: { includeIntents?: boolean; intentStatuses?: IntentStatus[] } = {}
  ): Promise<DepositWithRelations[]> {
    if (!deposits.length) return [];
    const depositIds = deposits.map(d => d.id);
    const [{ paymentMethodsByDeposit, currenciesByDeposit }, intents] = await Promise.all([
      this.fetchRelations(depositIds),
      options.includeIntents ? this.fetchIntents({ depositIds, statuses: options.intentStatuses }) : Promise.resolve([]),
    ]);
    const intentsByDeposit = options.includeIntents ? groupByDepositId(intents) : new Map<string, IntentEntity[]>();
    return deposits.map(d => {
      const key = d.id.toLowerCase();
      return {
        ...d,
        paymentMethods: paymentMethodsByDeposit.get(key) ?? [],
        currencies: currenciesByDeposit.get(key) ?? [],
        intents: options.includeIntents ? intentsByDeposit.get(key) ?? [] : undefined,
      };
    });
  }

  async fetchDeposits(filter?: DepositFilter, pagination?: PaginationOptions): Promise<DepositEntity[]> {
    const result = await this.client.query<{ Deposit?: DepositEntity[] }>({
      query: DEPOSITS_QUERY,
      variables: {
        where: this.buildDepositWhere(filter),
        order_by: this.buildOrderBy(pagination),
        limit: pagination?.limit ?? DEFAULT_LIMIT,
        offset: pagination?.offset ?? 0,
      },
    });
    return result.Deposit ?? [];
  }

  async fetchDepositsWithRelations(
    filter?: DepositFilter,
    pagination?: PaginationOptions,
    options: { includeIntents?: boolean; intentStatuses?: IntentStatus[] } = {}
  ): Promise<DepositWithRelations[]> {
    const deposits = await this.fetchDeposits(filter, pagination);
    return this.attachRelations(deposits, options);
  }

  async fetchDepositsByIds(ids: string[]): Promise<DepositEntity[]> {
    if (!ids.length) return [];
    const result = await this.client.query<{ Deposit?: DepositEntity[] }>({ query: DEPOSITS_BY_IDS_QUERY, variables: { ids } });
    return result.Deposit ?? [];
  }

  async fetchDepositsByIdsWithRelations(
    ids: string[],
    options: { includeIntents?: boolean; intentStatuses?: IntentStatus[] } = {}
  ): Promise<DepositWithRelations[]> {
    const deposits = await this.fetchDepositsByIds(ids);
    return this.attachRelations(deposits, options);
  }

  async fetchIntentsForDeposits(depositIds: string[], statuses?: IntentStatus[]): Promise<IntentEntity[]> {
    if (!depositIds.length) return [];
    return this.fetchIntents({ depositIds, statuses });
  }

  async fetchIntentsByOwner(owner: string, statuses?: IntentStatus[]): Promise<IntentEntity[]> {
    if (!owner) return [];
    return this.fetchIntents({ owner, statuses });
  }

  async fetchDepositWithRelations(id: string, options: { includeIntents?: boolean; intentStatuses?: IntentStatus[] } = {}): Promise<DepositWithRelations | null> {
    const result = await this.client.query<{
      Deposit_by_pk?: DepositEntity | null;
      DepositPaymentMethod?: DepositPaymentMethodEntity[];
      MethodCurrency?: MethodCurrencyEntity[];
    }>({ query: DEPOSIT_WITH_RELATIONS_QUERY, variables: { id } });

    const deposit = result.Deposit_by_pk;
    if (!deposit) return null;
    const base: DepositWithRelations = { ...deposit, paymentMethods: result.DepositPaymentMethod ?? [], currencies: result.MethodCurrency ?? [] };
    if (!options.includeIntents) return base;
    const intents = await this.fetchIntents({ depositIds: [deposit.id], statuses: options.intentStatuses });
    return { ...base, intents };
  }

  async fetchExpiredIntents(params: { now: bigint | string; depositIds: string[]; limit?: number }): Promise<IntentEntity[]> {
    const depositIds = params.depositIds.map(id => id.toLowerCase());
    if (!depositIds.length) return [];

    const result = await this.client.query<{ Intent?: IntentEntity[] }>({
      query: EXPIRED_INTENTS_QUERY,
      variables: {
        now: typeof params.now === 'bigint' ? params.now.toString() : params.now,
        limit: params.limit ?? 1000,
        depositIds,
      },
    });

    return result.Intent ?? [];
  }

  async fetchFulfilledIntentEvents(intentHashes: string[]): Promise<IntentFulfilledEntity[]> {
    if (!intentHashes.length) return [];

    const uniqueHashes = Array.from(new Set(intentHashes)).filter(Boolean);
    if (!uniqueHashes.length) return [];

    const result = await this.client.query<{ Orchestrator_V21_IntentFulfilled?: IntentFulfilledEntity[] }>({
      query: INTENT_FULFILLMENTS_QUERY,
      variables: { intentHashes: uniqueHashes },
    });

    return result.Orchestrator_V21_IntentFulfilled ?? [];
  }

  async resolvePayeeHash(params: { escrowAddress?: string | null; depositId?: string | number | bigint | null; paymentMethodHash?: string | null }): Promise<string | null> {
    try {
      const { escrowAddress, depositId, paymentMethodHash } = params;
      if (!escrowAddress || depositId === null || depositId === undefined || !paymentMethodHash) return null;
      const compositeId = createCompositeDepositId(
        escrowAddress,
        typeof depositId === 'bigint' ? depositId : depositId?.toString() ?? ''
      );
      const detail = await this.fetchDepositWithRelations(compositeId, { includeIntents: false });
      if (!detail?.paymentMethods?.length) return null;
      const target = paymentMethodHash.toLowerCase();
      const match = detail.paymentMethods.find(pm => (pm.paymentMethodHash ?? '').toLowerCase() === target);
      return match?.payeeDetailsHash ?? null;
    } catch {
      return null;
    }
  }

  async fetchDepositsByPayeeHash(payeeHash: string, options: { paymentMethodHash?: string; limit?: number; includeIntents?: boolean; intentStatuses?: IntentStatus[] } = {}): Promise<DepositWithRelations[]> {
    if (!payeeHash) return [];
    const normalizedHash = payeeHash.toLowerCase();

    const where: Record<string, unknown> = {
      payeeDetailsHash: { _ilike: normalizedHash },
    };
    if (options.paymentMethodHash) {
      where.paymentMethodHash = { _eq: options.paymentMethodHash.toLowerCase?.() ?? options.paymentMethodHash };
    }

    const result = await this.client.query<{ DepositPaymentMethod?: DepositPaymentMethodEntity[] }>({
      query: PAYMENT_METHODS_BY_PAYEE_HASH_QUERY,
      variables: { where, limit: options.limit },
    });

    const seen = new Set<string>();
    const depositIds: string[] = [];
    for (const pm of result.DepositPaymentMethod ?? []) {
      const id = pm.depositId;
      if (!id) continue;
      const key = id.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      depositIds.push(id);
    }

    if (!depositIds.length) return [];
    return this.fetchDepositsByIdsWithRelations(depositIds, {
      includeIntents: options.includeIntents,
      intentStatuses: options.intentStatuses,
    });
  }
}
