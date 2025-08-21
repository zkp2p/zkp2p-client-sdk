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
  baseApiUrl: string
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
  });
}

export async function apiPostDepositDetails(
  req: PostDepositDetailsRequest,
  apiKey: string,
  baseApiUrl: string
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
  });
}

export async function apiGetQuote(
  req: QuoteRequest,
  baseApiUrl: string
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

  const requestBody: any = {
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
  });
}

export async function apiGetPayeeDetails(
  req: GetPayeeDetailsRequest,
  apiKey: string,
  baseApiUrl: string
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
  });
}

export async function apiValidatePayeeDetails(
  req: ValidatePayeeDetailsRequest,
  apiKey: string,
  baseApiUrl: string
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
  });
}
