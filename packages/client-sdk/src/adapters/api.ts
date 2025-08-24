import type {
  IntentSignalRequest,
  PostDepositDetailsRequest,
  SignalIntentResponse,
  PostDepositDetailsResponse,
  QuoteRequest,
  QuoteResponse,
  GetPayeeDetailsRequest,
  GetPayeeDetailsResponse,
  ValidatePayeeDetailsRequest,
  ValidatePayeeDetailsResponse,
  GetOwnerDepositsRequest,
  GetOwnerDepositsResponse,
  Deposit,
  GetOwnerIntentsRequest,
  GetOwnerIntentsResponse,
  Intent,
  GetIntentsByDepositRequest,
  GetIntentsByDepositResponse,
  GetIntentsByTakerRequest,
  GetIntentsByTakerResponse,
  GetIntentByHashRequest,
  GetIntentByHashResponse,
  GetDepositByIdRequest,
  GetDepositByIdResponse,
  GetDepositsOrderStatsRequest,
  GetDepositsOrderStatsResponse,
} from '../types';
import { NetworkError, ValidationError } from '../errors';
import { parseAPIError, withRetry } from '../errors/utils';

function headers() {
  return { 'Content-Type': 'application/json' } as const;
}

function createHeadersWithApiKey(apiKey: string) {
  return { 'Content-Type': 'application/json', 'x-api-key': apiKey } as const;
}

export async function apiSignalIntent(
  req: IntentSignalRequest,
  apiKey: string,
  baseApiUrl: string,
  timeoutMs?: number
): Promise<SignalIntentResponse> {
  return withRetry(async () => {
    let res: Response;
    try {
      res = await fetch(`${baseApiUrl}/verify/intent`, {
        method: 'POST',
        headers: createHeadersWithApiKey(apiKey),
        body: JSON.stringify(req),
      });
    } catch (error) {
      throw new NetworkError('Failed to connect to API server', {
        endpoint: '/verify/intent',
        error,
      });
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw parseAPIError(res, errorText);
    }

    return res.json();
  }, 3, 1000, timeoutMs);
}

export async function apiPostDepositDetails(
  req: PostDepositDetailsRequest,
  apiKey: string,
  baseApiUrl: string,
  timeoutMs?: number
): Promise<PostDepositDetailsResponse> {
  return withRetry(async () => {
    let res: Response;
    try {
      res = await fetch(`${baseApiUrl}/makers/create`, {
        method: 'POST',
        headers: createHeadersWithApiKey(apiKey),
        body: JSON.stringify(req),
      });
    } catch (error) {
      throw new NetworkError('Failed to connect to API server', {
        endpoint: '/makers/create',
        error,
      });
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw parseAPIError(res, errorText);
    }

    return res.json();
  }, 3, 1000, timeoutMs);
}

export async function apiGetQuote(
  req: QuoteRequest,
  baseApiUrl: string,
  timeoutMs?: number
): Promise<QuoteResponse> {
  if (req.quotesToReturn !== undefined) {
    if (!Number.isInteger(req.quotesToReturn) || (req.quotesToReturn as number) < 1) {
      throw new ValidationError('quotesToReturn must be a positive integer', 'quotesToReturn');
    }
  }
  const isExactFiat = req.isExactFiat !== false;
  const endpoint = isExactFiat ? 'exact-fiat' : 'exact-token';
  let url = `${baseApiUrl}/quote/${endpoint}`;
  if (req.quotesToReturn) url += `?quotesToReturn=${req.quotesToReturn}`;

  const requestBody: Record<string, unknown> = {
    ...req,
    [isExactFiat ? 'exactFiatAmount' : 'exactTokenAmount']: req.amount,
    amount: undefined,
    isExactFiat: undefined,
    quotesToReturn: undefined,
  };
  Object.keys(requestBody).forEach((k) => requestBody[k] === undefined && delete requestBody[k]);

  return withRetry(async () => {
    let res: Response;
    try {
      res = await fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(requestBody) });
    } catch (error) {
      throw new NetworkError('Failed to connect to API server', { endpoint: `/quote/${endpoint}`, error });
    }
    if (!res.ok) {
      const errorText = await res.text();
      throw parseAPIError(res, errorText);
    }
    return res.json();
  }, 3, 1000, timeoutMs);
}

export async function apiGetPayeeDetails(
  req: GetPayeeDetailsRequest,
  apiKey: string,
  baseApiUrl: string,
  timeoutMs?: number
): Promise<GetPayeeDetailsResponse> {
  return withRetry(async () => {
    let res: Response;
    const endpoint = `/makers/${req.platform}/${req.hashedOnchainId}`;
    try {
      res = await fetch(`${baseApiUrl}${endpoint}`, {
        method: 'GET',
        headers: createHeadersWithApiKey(apiKey),
      });
    } catch (error) {
      throw new NetworkError('Failed to connect to API server', { endpoint, error });
    }
    if (!res.ok) {
      const errorText = await res.text();
      throw parseAPIError(res, errorText);
    }
    return res.json();
  }, 3, 1000, timeoutMs);
}

export async function apiValidatePayeeDetails(
  req: ValidatePayeeDetailsRequest,
  apiKey: string,
  baseApiUrl: string,
  timeoutMs?: number
): Promise<ValidatePayeeDetailsResponse> {
  return withRetry(async () => {
    let res: Response;
    const endpoint = '/makers/validate';
    try {
      res = await fetch(`${baseApiUrl}${endpoint}`, {
        method: 'POST',
        headers: createHeadersWithApiKey(apiKey),
        body: JSON.stringify(req),
      });
    } catch (error) {
      throw new NetworkError('Failed to connect to API server', { endpoint, error });
    }
    if (!res.ok) {
      const errorText = await res.text();
      throw parseAPIError(res, errorText);
    }
    return res.json();
  }, 3, 1000, timeoutMs);
}


// Helper function to transform date strings to Date objects
function transformDatesToObjects<T extends Record<string, any>>(obj: T): T {
  const dateFields = ['createdAt', 'updatedAt', 'signalTimestamp', 'fulfillTimestamp', 'prunedTimestamp'];
  const transformed = { ...obj };

  for (const key in transformed) {
    const value = transformed[key];

    if (dateFields.includes(key) && typeof value === 'string') {
      transformed[key] = new Date(value) as any;
    } else if (Array.isArray(value)) {
      transformed[key] = value.map((item: any) =>
        typeof item === 'object' && item !== null
          ? transformDatesToObjects(item)
          : item
      ) as any;
    } else if (typeof value === 'object' && value !== null) {
      transformed[key] = transformDatesToObjects(value) as any;
    }
  }

  return transformed;
}

export async function apiGetOwnerDeposits(
  req: GetOwnerDepositsRequest,
  apiKey: string,
  baseApiUrl: string,
  timeoutMs?: number
): Promise<GetOwnerDepositsResponse> {
  return withRetry(async () => {
    let res: Response;
    let endpoint = `/deposits/maker/${req.ownerAddress}`;

    // Add status query parameter if provided
    if (req.status) {
      endpoint += `?status=${req.status}`;
    }

    try {
      res = await fetch(`${baseApiUrl}${endpoint}`, {
        method: 'GET',
        headers: createHeadersWithApiKey(apiKey),
      });
    } catch (error) {
      throw new NetworkError('Failed to connect to API server', {
        endpoint,
        error,
      });
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw parseAPIError(res, errorText);
    }

    const data = await res.json();

    // Transform date strings to Date objects for all deposits
    if (data.responseObject && Array.isArray(data.responseObject)) {
      data.responseObject = data.responseObject.map((deposit: Deposit) =>
        transformDatesToObjects(deposit)
      );
    }

    return data;
  }, 3, 1000, timeoutMs);
}

export async function apiGetOwnerIntents(
  req: GetOwnerIntentsRequest,
  apiKey: string,
  baseApiUrl: string,
  timeoutMs?: number
): Promise<GetOwnerIntentsResponse> {
  return withRetry(async () => {
    let res: Response;
    const endpoint = `/orders/maker/${req.ownerAddress}`;

    try {
      res = await fetch(`${baseApiUrl}${endpoint}`, {
        method: 'GET',
        headers: createHeadersWithApiKey(apiKey),
      });
    } catch (error) {
      throw new NetworkError('Failed to connect to API server', {
        endpoint,
        error,
      });
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw parseAPIError(res, errorText);
    }

    const data = await res.json();

    // Transform date strings to Date objects for all intents
    if (data.responseObject && Array.isArray(data.responseObject)) {
      data.responseObject = data.responseObject.map((intent: Intent) =>
        transformDatesToObjects(intent)
      );
    }

    return data;
  }, 3, 1000, timeoutMs);
}

/**
 * Get intents by deposit ID with optional status filter
 */
export async function apiGetIntentsByDeposit(
  req: GetIntentsByDepositRequest,
  apiKey: string,
  baseApiUrl: string,
  timeoutMs?: number
): Promise<GetIntentsByDepositResponse> {
  return withRetry(async () => {
    let res: Response;
    let endpoint = `/orders/deposit/${req.depositId}`;

    // Add status query parameter if provided
    if (req.status) {
      const statusParam = Array.isArray(req.status)
        ? req.status.join(',')
        : req.status;
      endpoint += `?status=${statusParam}`;
    }

    try {
      res = await fetch(`${baseApiUrl}${endpoint}`, {
        method: 'GET',
        headers: createHeadersWithApiKey(apiKey),
      });
    } catch (error) {
      throw new NetworkError('Failed to connect to API server', {
        endpoint,
        error,
      });
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw parseAPIError(res, errorText);
    }

    const data = await res.json();

    // Transform date strings to Date objects for all intents
    if (data.responseObject && Array.isArray(data.responseObject)) {
      data.responseObject = data.responseObject.map((intent: Intent) =>
        transformDatesToObjects(intent)
      );
    }

    return data;
  }, 3, 1000, timeoutMs);
}

/**
 * Get intents by taker address with optional status filter
 */
export async function apiGetIntentsByTaker(
  req: GetIntentsByTakerRequest,
  apiKey: string,
  baseApiUrl: string,
  timeoutMs?: number
): Promise<GetIntentsByTakerResponse> {
  return withRetry(async () => {
    let res: Response;
    let endpoint = `/orders/taker/${req.takerAddress}`;

    // Add status query parameter if provided
    if (req.status) {
      const statusParam = Array.isArray(req.status)
        ? req.status.join(',')
        : req.status;
      endpoint += `?status=${statusParam}`;
    }

    try {
      res = await fetch(`${baseApiUrl}${endpoint}`, {
        method: 'GET',
        headers: createHeadersWithApiKey(apiKey),
      });
    } catch (error) {
      throw new NetworkError('Failed to connect to API server', {
        endpoint,
        error,
      });
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw parseAPIError(res, errorText);
    }

    const data = await res.json();

    // Transform date strings to Date objects for all intents
    if (data.responseObject && Array.isArray(data.responseObject)) {
      data.responseObject = data.responseObject.map((intent: Intent) =>
        transformDatesToObjects(intent)
      );
    }

    return data;
  }, 3, 1000, timeoutMs);
}

/**
 * Get a single intent by its hash
 */
export async function apiGetIntentByHash(
  req: GetIntentByHashRequest,
  apiKey: string,
  baseApiUrl: string,
  timeoutMs?: number
): Promise<GetIntentByHashResponse> {
  return withRetry(async () => {
    let res: Response;
    const endpoint = `/orders/${req.intentHash}`;

    try {
      res = await fetch(`${baseApiUrl}${endpoint}`, {
        method: 'GET',
        headers: createHeadersWithApiKey(apiKey),
      });
    } catch (error) {
      throw new NetworkError('Failed to connect to API server', {
        endpoint,
        error,
      });
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw parseAPIError(res, errorText);
    }

    const data = await res.json();

    // Transform date strings to Date objects for the intent
    if (data.responseObject) {
      data.responseObject = transformDatesToObjects(data.responseObject);
    }

    return data;
  }, 3, 1000, timeoutMs);
}

// Deposits API Functions

/**
 * Get a single deposit by its ID
 */
export async function apiGetDepositById(
  req: GetDepositByIdRequest,
  apiKey: string,
  baseApiUrl: string,
  timeoutMs?: number
): Promise<GetDepositByIdResponse> {
  return withRetry(async () => {
    let res: Response;
    const endpoint = `/deposits/${req.depositId}`;

    try {
      res = await fetch(`${baseApiUrl}${endpoint}`, {
        method: 'GET',
        headers: createHeadersWithApiKey(apiKey),
      });
    } catch (error) {
      throw new NetworkError('Failed to connect to API server', {
        endpoint,
        error,
      });
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw parseAPIError(res, errorText);
    }

    const data = await res.json();

    // Transform date strings to Date objects for the deposit
    if (data.responseObject) {
      data.responseObject = transformDatesToObjects(data.responseObject);
    }

    return data;
  }, 3, 1000, timeoutMs);
}

/**
 * Get order statistics for multiple deposits
 */
export async function apiGetDepositsOrderStats(
  req: GetDepositsOrderStatsRequest,
  apiKey: string,
  baseApiUrl: string,
  timeoutMs?: number
): Promise<GetDepositsOrderStatsResponse> {
  return withRetry(async () => {
    let res: Response;
    const endpoint = '/deposits/order-stats';

    try {
      res = await fetch(`${baseApiUrl}${endpoint}`, {
        method: 'POST',
        headers: createHeadersWithApiKey(apiKey),
        body: JSON.stringify({ depositIds: req.depositIds }),
      });
    } catch (error) {
      throw new NetworkError('Failed to connect to API server', {
        endpoint,
        error,
      });
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw parseAPIError(res, errorText);
    }

    return res.json();
  }, 3, 1000, timeoutMs);
}
