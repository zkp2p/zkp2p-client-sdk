/**
 * Minimal fetch-based GraphQL client for the ZKP2P indexer.
 * No external GraphQL dependencies; works in Node and browser.
 */

export type GraphQLRequest = {
  query: string;
  variables?: Record<string, unknown>;
};

export type GraphQLErrorShape = { message: string; extensions?: Record<string, unknown> };

export type GraphQLResponse<T = any> = {
  data?: T;
  errors?: GraphQLErrorShape[];
};

export class IndexerClient {
  constructor(private endpoint: string) {}

  private async _post<T>(request: GraphQLRequest, init?: RequestInit): Promise<T> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      cache: 'no-store',
      ...init,
    });
    if (!res.ok) throw new Error(`Indexer request failed: ${res.status} ${res.statusText}`);
    const json: GraphQLResponse<T> = await res.json();
    if (json.errors?.length) {
      const msg = json.errors.map(e => e.message).join(', ');
      throw new Error(`GraphQL errors: ${msg}`);
    }
    if (!json.data) throw new Error('No data returned from indexer');
    return json.data;
  }

  async query<T = any>(request: GraphQLRequest, init?: RequestInit & { retries?: number }): Promise<T> {
    const retries = init?.retries ?? 1;
    let lastErr: unknown;
    for (let i = 0; i <= retries; i++) {
      try {
        return await this._post<T>(request, init);
      } catch (e) {
        lastErr = e;
        if (i === retries) break;
        await new Promise(r => setTimeout(r, 200 * (i + 1)));
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }
}

export type DeploymentEnv = 'PRODUCTION' | 'STAGING' | 'DEV' | 'LOCAL' | 'STAGING_TESTNET';

export function defaultIndexerEndpoint(env: DeploymentEnv = 'PRODUCTION'): string {
  switch (env) {
    case 'PRODUCTION':
      return 'https://indexer.hyperindex.xyz/8fd74dc/v1/graphql';
    case 'STAGING':
    case 'DEV':
      return 'https://indexer.dev.hyperindex.xyz/d7edb2d/v1/graphql';
    case 'LOCAL':
    case 'STAGING_TESTNET':
      return 'https://indexer.dev.hyperindex.xyz/7c41dc5/v1/graphql';
    default:
      return 'https://indexer.hyperindex.xyz/8fd74dc/v1/graphql';
  }
}
