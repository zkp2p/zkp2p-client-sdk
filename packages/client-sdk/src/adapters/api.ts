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
  GetIntentsByRecipientRequest, 
  GetIntentsByRecipientResponse,
  DepositIntentStatistics,
  ListPayeesResponse,
} from '../types';
import { NetworkError, ValidationError } from '../errors';
import { parseAPIError, withRetry } from '../errors/utils';

/**
 * Creates headers for API requests with optional authentication
 */
function createHeaders(apiKey?: string, authToken?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  if (authToken) headers['Authorization'] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
  return headers;
}

/**
 * Base fetch wrapper with common error handling and retry logic
 */
async function apiFetch<T>({
  url,
  method = 'GET',
  body,
  apiKey,
  authToken,
  timeoutMs,
  retryCount = 3,
  retryDelayMs = 1000,
}: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  apiKey?: string;
  authToken?: string;
  timeoutMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
}): Promise<T> {
  const endpoint = url.replace(/^[^/]*\/\/[^/]*/, ''); // Extract endpoint for error messages

  return withRetry(async () => {
    let res: Response;
    try {
      const options: RequestInit = {
        method,
        headers: createHeaders(apiKey, authToken),
      };
      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }
      res = await fetch(url, options);
    } catch (error) {
      throw new NetworkError('Failed to connect to API server', { endpoint, error });
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw parseAPIError(res, errorText);
    }

    return res.json();
  }, retryCount, retryDelayMs, timeoutMs);
}

/**
 * Process API response with optional date transformation
 */
function processApiResponse<T extends Record<string, any>>(
  data: any,
  transformDates: boolean = true
): T {
  if (!transformDates) return data;

  // Apply date transformation to responseObject if it exists
  if (data.responseObject) {
    if (Array.isArray(data.responseObject)) {
      data.responseObject = data.responseObject.map((item: any) => transformDatesToObjects(item));
    } else {
      data.responseObject = transformDatesToObjects(data.responseObject);
    }
  }

  return data;
}

/**
 * Build query string from status parameter
 */
function buildStatusQuery(status?: string | string[]): string {
  if (!status) return '';
  const statusParam = Array.isArray(status) ? status.join(',') : status;
  return `?status=${statusParam}`;
}

export async function apiSignalIntent(
  req: IntentSignalRequest,
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
): Promise<SignalIntentResponse> {
  return apiFetch<SignalIntentResponse>({
    url: `${baseApiUrl.replace(/\/$/, '')}/v2/verify/intent`,
    method: 'POST',
    body: req,
    apiKey,
    authToken,
    timeoutMs,
  });
}

/**
 * Get intents by recipient address with optional status filter
 */
export async function apiGetIntentsByRecipient(
  req: GetIntentsByRecipientRequest,
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
): Promise<GetIntentsByRecipientResponse> {
  const endpoint = `/v1/orders/recipient/${req.recipientAddress}${buildStatusQuery(req.status)}`;
  const data = await apiFetch<GetIntentsByRecipientResponse>({
    url: `${baseApiUrl.replace(/\/$/, '')}${endpoint}`,
    method: 'GET',
    apiKey,
    authToken,
    timeoutMs,
  });
  return processApiResponse(data);
}

// Makers list
export async function apiListPayees(
  processorName: string | undefined,
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
): Promise<ListPayeesResponse> {
  const endpoint = processorName ? `/v1/makers?processorName=${encodeURIComponent(processorName)}` : '/v1/makers';
  const data = await apiFetch<ListPayeesResponse>({
    url: `${baseApiUrl.replace(/\/$/, '')}${endpoint}`,
    method: 'GET',
    apiKey,
    authToken,
    timeoutMs,
  });
  return processApiResponse(data);
}

// Deposit spreads
export async function apiGetDepositSpread(
  depositId: number,
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
) {
  const data = await apiFetch<any>({
    url: `${baseApiUrl.replace(/\/$/, '')}/v1/deposits/${depositId}/spread`,
    method: 'GET',
    apiKey,
    authToken,
    timeoutMs,
  });
  return transformDatesToObjects(data);
}

export async function apiListDepositSpreads(
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
) {
  const data = await apiFetch<any>({
    url: `${baseApiUrl.replace(/\/$/, '')}/v1/deposits/spreads`,
    method: 'GET',
    apiKey,
    authToken,
    timeoutMs,
  });
  return transformDatesToObjects(data);
}

export async function apiGetSpreadsByDepositIds(
  depositIds: number[],
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
) {
  const data = await apiFetch<any>({
    url: `${baseApiUrl.replace(/\/$/, '')}/v1/deposits/spreads/bulk`,
    method: 'POST',
    body: { depositIds },
    apiKey,
    authToken,
    timeoutMs,
  });
  return transformDatesToObjects(data);
}

export async function apiCreateSpread(
  body: { depositId: number; spread: number; minPrice?: number | null; maxPrice?: number | null },
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
) {
  const data = await apiFetch<any>({
    url: `${baseApiUrl.replace(/\/$/, '')}/v1/deposits/spreads`,
    method: 'POST',
    body,
    apiKey,
    authToken,
    timeoutMs,
  });
  return transformDatesToObjects(data);
}

export async function apiUpdateSpread(
  depositId: number,
  body: { spread?: number; minPrice?: number | null; maxPrice?: number | null },
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
) {
  const data = await apiFetch<any>({
    url: `${baseApiUrl.replace(/\/$/, '')}/v1/deposits/${depositId}/spread`,
    method: 'PUT',
    body,
    apiKey,
    authToken,
    timeoutMs,
  });
  return transformDatesToObjects(data);
}

export async function apiUpsertSpread(
  depositId: number,
  body: { spread?: number; minPrice?: number | null; maxPrice?: number | null },
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
) {
  const data = await apiFetch<any>({
    url: `${baseApiUrl.replace(/\/$/, '')}/v1/deposits/${depositId}/spread`,
    method: 'POST',
    body,
    apiKey,
    authToken,
    timeoutMs,
  });
  return transformDatesToObjects(data);
}

export async function apiDeleteSpread(
  depositId: number,
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
) {
  return apiFetch({
    url: `${baseApiUrl.replace(/\/$/, '')}/v1/deposits/${depositId}/spread`,
    method: 'DELETE',
    apiKey,
    authToken,
    timeoutMs,
  });
}
export async function apiPostDepositDetails(
  req: PostDepositDetailsRequest,
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
): Promise<PostDepositDetailsResponse> {
  return apiFetch<PostDepositDetailsResponse>({
    url: `${baseApiUrl.replace(/\/$/, '')}/v1/makers/create`,
    method: 'POST',
    body: req,
    apiKey,
    authToken,
    timeoutMs,
  });
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
  let url = `${baseApiUrl.replace(/\/$/, '')}/v1/quote/${endpoint}`;
  if (req.quotesToReturn) url += `?quotesToReturn=${req.quotesToReturn}`;

  const requestBody: Record<string, unknown> = {
    ...req,
    [isExactFiat ? 'exactFiatAmount' : 'exactTokenAmount']: req.amount,
    amount: undefined,
    isExactFiat: undefined,
    quotesToReturn: undefined,
  };
  Object.keys(requestBody).forEach((k) => requestBody[k] === undefined && delete requestBody[k]);

  return apiFetch<QuoteResponse>({
    url,
    method: 'POST',
    body: requestBody,
    timeoutMs,
  });
}

export async function apiGetPayeeDetails(
  req: GetPayeeDetailsRequest,
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
): Promise<GetPayeeDetailsResponse> {
  return apiFetch<GetPayeeDetailsResponse>({
    url: `${baseApiUrl.replace(/\/$/, '')}/v1/makers/${req.processorName}/${req.hashedOnchainId}`,
    method: 'GET',
    apiKey,
    authToken,
    timeoutMs,
  });
}

export async function apiValidatePayeeDetails(
  req: ValidatePayeeDetailsRequest,
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
): Promise<ValidatePayeeDetailsResponse> {
  const data = await apiFetch<ValidatePayeeDetailsResponse>({
    url: `${baseApiUrl.replace(/\/$/, '')}/v1/makers/validate`,
    method: 'POST',
    body: req,
    apiKey,
    authToken,
    timeoutMs,
  });
  // Back-compat: some APIs may return boolean in responseObject. Normalize to { isValid }.
  if (typeof data?.responseObject === 'boolean') {
    return {
      ...data,
      responseObject: { isValid: data.responseObject },
    } as ValidatePayeeDetailsResponse;
  }
  return data;
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
  authToken?: string,
  timeoutMs?: number
): Promise<GetOwnerDepositsResponse> {
  const statusQuery = req.status ? `?status=${encodeURIComponent(req.status)}` : '';
  const data = await apiFetch<GetOwnerDepositsResponse>({
    url: `${baseApiUrl.replace(/\/$/, '')}/v1/deposits/maker/${req.ownerAddress}${statusQuery}`,
    method: 'GET',
    apiKey,
    authToken,
    timeoutMs,
  });
  return processApiResponse(data);
}

export async function apiGetOwnerIntents(
  req: GetOwnerIntentsRequest,
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
): Promise<GetOwnerIntentsResponse> {
  const data = await apiFetch<GetOwnerIntentsResponse>({
    url: `${baseApiUrl.replace(/\/$/, '')}/v1/orders/maker/${req.ownerAddress}`,
    method: 'GET',
    apiKey,
    authToken,
    timeoutMs,
  });
  return processApiResponse(data);
}

/**
 * Get intents by deposit ID with optional status filter
 */
export async function apiGetIntentsByDeposit(
  req: GetIntentsByDepositRequest,
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
): Promise<GetIntentsByDepositResponse> {
  const endpoint = `/v1/orders/deposit/${req.depositId}${buildStatusQuery(req.status)}`;
  const data = await apiFetch<GetIntentsByDepositResponse>({
    url: `${baseApiUrl.replace(/\/$/, '')}${endpoint}`,
    method: 'GET',
    apiKey,
    authToken,
    timeoutMs,
  });
  return processApiResponse(data);
}

/**
 * Get intents by taker address with optional status filter
 */
export async function apiGetIntentsByTaker(
  req: GetIntentsByTakerRequest,
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
): Promise<GetIntentsByTakerResponse> {
  const endpoint = `/v1/orders/taker/${req.takerAddress}${buildStatusQuery(req.status)}`;
  const data = await apiFetch<GetIntentsByTakerResponse>({
    url: `${baseApiUrl.replace(/\/$/, '')}${endpoint}`,
    method: 'GET',
    apiKey,
    authToken,
    timeoutMs,
  });
  return processApiResponse(data);
}

/**
 * Get a single intent by its hash
 */
export async function apiGetIntentByHash(
  req: GetIntentByHashRequest,
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
): Promise<GetIntentByHashResponse> {
  const data = await apiFetch<GetIntentByHashResponse>({
    url: `${baseApiUrl.replace(/\/$/, '')}/v1/orders/${req.intentHash}`,
    method: 'GET',
    apiKey,
    authToken,
    timeoutMs,
  });
  return processApiResponse(data);
}

// Deposits API Functions

/**
 * Get a single deposit by its ID
 */
export async function apiGetDepositById(
  req: GetDepositByIdRequest,
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
): Promise<GetDepositByIdResponse> {
  const data = await apiFetch<GetDepositByIdResponse>({
    url: `${baseApiUrl.replace(/\/$/, '')}/v1/deposits/${req.depositId}`,
    method: 'GET',
    apiKey,
    authToken,
    timeoutMs,
  });
  return processApiResponse(data);
}

/**
 * Get order statistics for multiple deposits
 */
export async function apiGetDepositsOrderStats(
  req: GetDepositsOrderStatsRequest,
  apiKey: string,
  baseApiUrl: string,
  authToken?: string,
  timeoutMs?: number
): Promise<GetDepositsOrderStatsResponse> {
  return apiFetch<GetDepositsOrderStatsResponse>({
    url: `${baseApiUrl.replace(/\/$/, '')}/v1/deposits/order-stats`,
    method: 'POST',
    body: { depositIds: req.depositIds },
    apiKey,
    authToken,
    timeoutMs,
  });
}
