import type {
  IntentSignalRequest,
  PostDepositDetailsRequest,
  SignalIntentResponse,
  PostDepositDetailsResponse,
  QuoteRequest,
  QuoteResponse,
  GetPayeeDetailsRequest,
  GetPayeeDetailsResponse,
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
  // Validate quotesToReturn if provided
  if (req.quotesToReturn !== undefined) {
    if (!Number.isInteger(req.quotesToReturn) || req.quotesToReturn < 1) {
      throw new ValidationError(
        'quotesToReturn must be a positive integer',
        'quotesToReturn'
      );
    }
  }

  // Default isExactFiat to true if not specified
  const isExactFiat = req.isExactFiat !== false;

  // Determine endpoint based on isExactFiat
  const endpoint = isExactFiat ? 'exact-fiat' : 'exact-token';

  // Build URL with query parameters
  let url = `${baseApiUrl}/quote/${endpoint}`;
  if (req.quotesToReturn) {
    url += `?quotesToReturn=${req.quotesToReturn}`;
  }

  // Create request body with appropriate field name
  const requestBody = {
    ...req,
    [isExactFiat ? 'exactFiatAmount' : 'exactTokenAmount']: req.amount,
    // Remove our custom fields before sending to API
    amount: undefined,
    isExactFiat: undefined,
    quotesToReturn: undefined, // Remove from body since it's in query params
  };

  // Clean up undefined fields
  Object.keys(requestBody).forEach((key) => {
    if (requestBody[key as keyof typeof requestBody] === undefined) {
      delete requestBody[key as keyof typeof requestBody];
    }
  });

  return withRetry(async () => {
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      throw new NetworkError('Failed to connect to API server', {
        endpoint: `/quote/${endpoint}`,
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
  });
}
