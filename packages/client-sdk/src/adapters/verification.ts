import type { Address } from 'viem';

export type SignIntentV2Request = {
  processorName: string;
  payeeDetails: string;
  depositId: string; // decimal string
  amount: string; // decimal string
  toAddress: Address;
  paymentMethod: `0x${string}`; // bytes32
  fiatCurrency: `0x${string}`; // bytes32
  conversionRate: string; // decimal string
  chainId: string; // decimal string
  orchestratorAddress: Address;
  escrowAddress: Address;
};

export type SignIntentV2Response = {
  success: boolean;
  message: string;
  responseObject: {
    depositData?: Record<string, unknown>;
    signedIntent: `0x${string}`; // signature bytes
    intentData?: { signatureExpiration?: string };
    signatureExpiration?: string;
  };
  statusCode: number;
};

export async function apiSignIntentV2(
  request: SignIntentV2Request,
  opts: { baseApiUrl: string; apiKey?: string; authorizationToken?: string; timeoutMs?: number }
): Promise<{ signature: `0x${string}`; signatureExpiration: bigint }> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15000);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (opts.apiKey) headers['x-api-key'] = opts.apiKey;
    if (opts.authorizationToken) headers['authorization'] = `Bearer ${opts.authorizationToken}`;

    const res = await fetch(`${opts.baseApiUrl.replace(/\/$/, '')}/v2/verify/intent`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`verify/intent failed: ${res.status} ${res.statusText} ${text}`);
    }
    const json = (await res.json()) as SignIntentV2Response;
    const sig = json?.responseObject?.signedIntent as `0x${string}` | undefined;
    const expStr = json?.responseObject?.intentData?.signatureExpiration ?? json?.responseObject?.signatureExpiration;
    if (!sig || !expStr) throw new Error('verify/intent missing signature or expiration');
    return { signature: sig, signatureExpiration: BigInt(expStr) };
  } finally {
    clearTimeout(id);
  }
}

