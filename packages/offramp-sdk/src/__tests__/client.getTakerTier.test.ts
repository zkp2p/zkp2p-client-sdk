import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { Zkp2pClient } from '../client/Zkp2pClient';
import * as api from '../adapters/api';

vi.mock('../adapters/api');

describe('Zkp2pClient.getTakerTier', () => {
  let client: Zkp2pClient;
  const mockApiKey = 'test-api-key';
  const mockAuthToken = 'test-auth-token';

  beforeEach(() => {
    vi.clearAllMocks();
    const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
    const account = privateKeyToAccount(testPrivateKey);
    const walletClient = createWalletClient({ account, chain: base, transport: http() });
    client = new Zkp2pClient({
      walletClient,
      chainId: base.id,
      apiKey: mockApiKey,
      authorizationToken: mockAuthToken,
    });
  });

  it('calls apiGetTakerTier with auth', async () => {
    const mockResponse = {
      success: true,
      message: 'ok',
      responseObject: {
        owner: '0x123',
        chainId: 8453,
        tier: 'PEER',
        perIntentCapBaseUnits: '1000000',
        perIntentCapDisplay: '$1.00',
        lastUpdated: '2024-01-01T00:00:00Z',
        source: 'computed',
        stats: null,
        cooldownHours: 0,
        cooldownSeconds: 0,
        cooldownActive: false,
        cooldownRemainingSeconds: 0,
        nextIntentAvailableAt: null,
      },
      statusCode: 200,
    } as any;

    vi.mocked(api.apiGetTakerTier).mockResolvedValue(mockResponse);

    const req = { owner: '0x123', chainId: 8453 };
    const res = await client.getTakerTier(req);

    expect(res).toBe(mockResponse);
    expect(api.apiGetTakerTier).toHaveBeenCalledWith(
      req,
      mockApiKey,
      expect.any(String),
      mockAuthToken,
      expect.any(Number)
    );
  });

  it('throws when apiKey and authorizationToken are missing', async () => {
    const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
    const account = privateKeyToAccount(testPrivateKey);
    const walletClient = createWalletClient({ account, chain: base, transport: http() });
    const unauthClient = new Zkp2pClient({ walletClient, chainId: base.id });

    await expect(
      unauthClient.getTakerTier({ owner: '0x123', chainId: 8453 })
    ).rejects.toThrow('getTakerTier requires apiKey or authorizationToken');
  });
});
