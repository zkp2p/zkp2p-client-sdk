import { NetworkError } from '../errors';
import { parseAPIError, withRetry } from '../errors/utils';

function headers() {
  return { 'Content-Type': 'application/json' } as const;
}

// Posts a zkTLS proof JSON string to the Attestation Service and returns the attestation response
// Endpoint shape: /verify/:platform/:actionType
export async function apiCreatePaymentAttestation(
  payload: Record<string, unknown>,
  attestationServiceUrl: string,
  platform: string,
  actionType: string
): Promise<any> {
  return withRetry(async () => {
    let res: Response;
    try {
      const endpoint = `/verify/${encodeURIComponent(platform)}/${encodeURIComponent(actionType)}`;
      res = await fetch(`${attestationServiceUrl}${endpoint}`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw new NetworkError('Failed to connect to Attestation Service', {
        endpoint: `/verify/${platform}/${actionType}`,
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

