import { IndexerClient } from './client';
import { DEPOSITS_QUERY, DEPOSITS_BY_IDS_QUERY, DEPOSIT_RELATIONS_QUERY, DEPOSIT_WITH_RELATIONS_QUERY, INTENTS_QUERY } from './queries';
import type { DepositEntity, DepositPaymentMethodEntity, MethodCurrencyEntity, IntentEntity, IntentStatus, DepositWithRelations } from './types';

export type DepositOrderField = 'availableLiquidity' | 'remainingDeposits' | 'updatedAt' | 'timestamp' | 'amount';
export type OrderDirection = 'asc' | 'desc';

export type DepositFilter = Partial<{
  status: 'ACTIVE' | 'CLOSED' | 'WITHDRAWN';
  depositor: string;
  chainId: number;
  escrowAddress: string;
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
// Default to a schema-safe column for ordering
const DEFAULT_ORDER_FIELD: DepositOrderField = 'updatedAt';

export class IndexerDepositService {
  constructor(private client: IndexerClient) {}

  private buildDepositWhere(filter?: DepositFilter): Record<string, unknown> | undefined {
    if (!filter) return undefined;
    const where: Record<string, unknown> = {};
    if (filter.status) where.status = { _eq: filter.status };
    if (filter.depositor) where.depositor = { _ilike: filter.depositor };
    if (filter.chainId) where.chainId = { _eq: filter.chainId };
    if (filter.escrowAddress) where.escrowAddress = { _ilike: filter.escrowAddress };
    if (filter.acceptingIntents !== undefined) where.acceptingIntents = { _eq: filter.acceptingIntents };
    // Some indexer deployments may not support filtering by computed availableLiquidity.
    // Fallback to remainingDeposits to keep queries schema-compatible.
    if (filter.minLiquidity) where.remainingDeposits = { _gte: filter.minLiquidity };
    return Object.keys(where).length ? where : undefined;
  }

  private buildOrderBy(pagination?: PaginationOptions): Array<Record<string, 'asc' | 'desc'>> {
    let field = pagination?.orderBy ?? DEFAULT_ORDER_FIELD;
    const direction = pagination?.orderDirection === 'asc' ? 'asc' : 'desc';
    // Map non-orderable or computed fields to supported columns
    if (field === 'availableLiquidity') field = 'remainingDeposits';
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

  private async attachRelations(deposits: DepositEntity[], options: { includeIntents?: boolean; intentStatuses?: IntentStatus[] } = {}): Promise<DepositWithRelations[]> {
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

  async fetchDepositsWithRelations(filter?: DepositFilter, pagination?: PaginationOptions, options: { includeIntents?: boolean; intentStatuses?: IntentStatus[] } = {}): Promise<DepositWithRelations[]> {
    const deposits = await this.fetchDeposits(filter, pagination);
    return this.attachRelations(deposits, options);
  }

  async fetchDepositsByIds(ids: string[]): Promise<DepositEntity[]> {
    if (!ids.length) return [];
    const result = await this.client.query<{ Deposit?: DepositEntity[] }>({ query: DEPOSITS_BY_IDS_QUERY, variables: { ids } });
    return result.Deposit ?? [];
  }

  async fetchDepositsByIdsWithRelations(ids: string[], options: { includeIntents?: boolean; intentStatuses?: IntentStatus[] } = {}): Promise<DepositWithRelations[]> {
    const deposits = await this.fetchDepositsByIds(ids);
    return this.attachRelations(deposits, options);
  }

  async fetchIntentsForDeposits(depositIds: string[], statuses: IntentStatus[] = ['SIGNALED']): Promise<IntentEntity[]> {
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
}
