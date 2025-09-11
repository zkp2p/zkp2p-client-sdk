import { describe, it, expect, vi, afterEach } from 'vitest';
import { 
  apiGetQuote, 
  apiValidatePayeeDetails,
  apiPostDepositDetails,
  apiGetOwnerDeposits,
  apiGetOwnerIntents,
  apiGetIntentsByDeposit,
  apiGetIntentsByTaker,
  apiGetIntentByHash,
  apiGetDepositById,
  apiGetDepositsOrderStats,
  apiGetIntentsByRecipient,
  apiListPayees,
  apiGetDepositSpread
} from '../adapters/api';
import { ValidationError } from '../errors';

describe('api adapters', () => {
  afterEach(() => {
    (globalThis.fetch as any) = undefined;
    vi.restoreAllMocks();
  });

  it('rejects invalid quotesToReturn', async () => {
    await expect(
      apiGetQuote(
        {
          paymentPlatforms: ['wise'],
          fiatCurrency: 'USD',
          user: '0xuser',
          recipient: '0xrecip',
          destinationChainId: 8453,
          destinationToken: '0xusdc',
          amount: '100',
          quotesToReturn: 0,
        },
        'https://api.example'
      )
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('uses exact-token endpoint when isExactFiat=false', async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL) =>
      new Response(
        JSON.stringify({ message: 'ok', success: true, responseObject: {} }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    (globalThis as any).fetch = fetchMock;

    await apiGetQuote(
      {
        paymentPlatforms: ['wise'],
        fiatCurrency: 'USD',
        user: '0xuser',
        recipient: '0xrecip',
        destinationChainId: 8453,
        destinationToken: '0xusdc',
        amount: '1',
        isExactFiat: false,
      },
      'https://api.example'
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain('/quote/exact-token');
  });

  it('calls /makers/validate and parses response', async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL) =>
      new Response(
        JSON.stringify({ message: 'ok', success: true, responseObject: { isValid: true } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    (globalThis as any).fetch = fetchMock;

    const res = await apiValidatePayeeDetails(
      { processorName: 'revolut', depositData: { revolutUsername: 'alice' } },
      'api-key',
      'https://api.example'
    );
    expect(res.responseObject.isValid).toBe(true);
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain('/makers/validate');
  });

  it('calls /makers/create and returns hashedOnchainId', async () => {
    const mockHid = '0x' + 'ab'.repeat(32);
    const fetchMock = vi.fn(async (url: RequestInfo | URL) =>
      new Response(
        JSON.stringify({
          message: 'ok',
          success: true,
          statusCode: 200,
          responseObject: {
            id: 1,
            processorName: 'mercadopago',
            depositData: { identifier: 'alice' },
            hashedOnchainId: mockHid,
            createdAt: new Date().toISOString(),
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    (globalThis as any).fetch = fetchMock;

    const res = await apiPostDepositDetails(
      { processorName: 'mercadopago', depositData: { identifier: 'alice' } },
      'api-key',
      'https://api.example'
    );
    expect(res.responseObject.hashedOnchainId).toBe(mockHid);
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain('/makers/create');
  });

  describe('historical endpoints', () => {
    it('fetches owner deposits with optional status filter', async () => {
      const mockResponse = {
        success: true,
        message: 'ok',
        statusCode: 200,
        responseObject: [{
          id: '1',
          owner: '0x123',
          amount: '1000',
          minimumIntent: '10',
          maximumIntent: '100',
          status: 'ACTIVE',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          processorPaymentData: []
        }]
      };

      const fetchMock = vi.fn(async () =>
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );
      (globalThis as any).fetch = fetchMock;

      const res = await apiGetOwnerDeposits(
        { ownerAddress: '0x123' },
        'api-key',
        'https://api.example'
      );

      expect(res.responseObject[0].createdAt).toBeInstanceOf(Date);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example/deposits/maker/0x123',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('appends status query when provided for owner deposits', async () => {
      const mockResponse = {
        success: true,
        message: 'ok',
        statusCode: 200,
        responseObject: [],
      };
      const fetchMock = vi.fn(async () => new Response(JSON.stringify(mockResponse), { status: 200 }));
      (globalThis as any).fetch = fetchMock;

      await apiGetOwnerDeposits(
        { ownerAddress: '0xabc', status: 'WITHDRAWN' },
        'api-key',
        'https://api.example'
      );
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example/deposits/maker/0xabc?status=WITHDRAWN',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('fetches owner intents', async () => {
      const mockResponse = {
        success: true,
        message: 'ok',
        statusCode: 200,
        responseObject: [{
          id: 1,
          intentHash: '0xabc',
          depositId: 1,
          owner: '0x123',
          toAddress: '0x456',
          amount: '100',
          status: 'CREATED',
          signalTxHash: '0xdef',
          signalTimestamp: '2024-01-01T00:00:00Z',
          fulfillTxHash: null,
          fulfillTimestamp: null,
          pruneTxHash: null,
          prunedTimestamp: null,
          fiatCurrency: 'USD',
          conversionRate: '1.0',
          verifier: '0x789',
          sustainabilityFee: null,
          verifierFee: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }]
      };

      const fetchMock = vi.fn(async () =>
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );
      (globalThis as any).fetch = fetchMock;

      const res = await apiGetOwnerIntents(
        { ownerAddress: '0x123' },
        'api-key',
        'https://api.example'
      );

      expect(res.responseObject[0].signalTimestamp).toBeInstanceOf(Date);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example/orders/maker/0x123',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('fetches intents by taker with status filter array', async () => {
      const mockResponse = {
        success: true,
        message: 'ok',
        statusCode: 200,
        responseObject: []
      };

      const fetchMock = vi.fn(async () =>
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );
      (globalThis as any).fetch = fetchMock;

      await apiGetIntentsByTaker(
        { takerAddress: '0x456', status: ['SIGNALED', 'FULFILLED'] },
        'api-key',
        'https://api.example'
      );

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example/orders/taker/0x456?status=SIGNALED,FULFILLED',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('fetches intent by hash', async () => {
      const mockResponse = {
        success: true,
        message: 'ok',
        statusCode: 200,
        responseObject: {
          id: 1,
          intentHash: '0xabc123',
          depositId: 1,
          owner: '0x123',
          toAddress: '0x456',
          amount: '100',
          status: 'FULFILLED',
          signalTxHash: '0xdef',
          signalTimestamp: '2024-01-01T00:00:00Z',
          fulfillTxHash: '0xghi',
          fulfillTimestamp: '2024-01-02T00:00:00Z',
          pruneTxHash: null,
          prunedTimestamp: null,
          fiatCurrency: 'USD',
          conversionRate: '1.0',
          verifier: '0x789',
          sustainabilityFee: null,
          verifierFee: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z'
        }
      };

      const fetchMock = vi.fn(async () =>
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );
      (globalThis as any).fetch = fetchMock;

      const res = await apiGetIntentByHash(
        { intentHash: '0xabc123' },
        'api-key',
        'https://api.example'
      );

      expect(res.responseObject.fulfillTimestamp).toBeInstanceOf(Date);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example/orders/0xabc123',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('fetches deposit by ID', async () => {
      const mockResponse = {
        success: true,
        message: 'ok',
        statusCode: 200,
        responseObject: {
          id: '123',
          owner: '0xowner',
          amount: '5000',
          minimumIntent: '50',
          maximumIntent: '500',
          status: 'ACTIVE',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          processorPaymentData: []
        }
      };

      const fetchMock = vi.fn(async () =>
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );
      (globalThis as any).fetch = fetchMock;

      const res = await apiGetDepositById(
        { depositId: '123' },
        'api-key',
        'https://api.example'
      );

      expect(res.responseObject.createdAt).toBeInstanceOf(Date);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example/deposits/123',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('fetches deposits order stats', async () => {
      const mockResponse = {
        success: true,
        message: 'ok',
        statusCode: 200,
        responseObject: [{
          depositId: '1',
          totalIntents: 10,
          totalOrderAmount: '1000',
          fulfilledOrderCount: 5,
          fulfilledOrderAmount: '500',
          cancelledOrderCount: 2,
          cancelledOrderAmount: '200',
          releasedOrderCount: 0,
          releasedOrderAmount: '0',
          expiredOrderCount: 1,
          expiredOrderAmount: '100',
          createdOrderCount: 2,
          createdOrderAmount: '200'
        }]
      };

      const fetchMock = vi.fn(async () =>
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );
      (globalThis as any).fetch = fetchMock;

      const res = await apiGetDepositsOrderStats(
        { depositIds: [1, 2, 3] },
        'api-key',
        'https://api.example'
      );

      expect(res.responseObject[0].totalIntents).toBe(10);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example/deposits/order-stats',
        expect.objectContaining({ 
          method: 'POST',
          body: JSON.stringify({ depositIds: [1, 2, 3] })
        })
      );
    });

    

    it('fetches intents by recipient with status filter', async () => {
      const mockResponse = { success: true, message: 'ok', statusCode: 200, responseObject: [] };
      const fetchMock = vi.fn(async () => new Response(JSON.stringify(mockResponse), { status: 200 }));
      (globalThis as any).fetch = fetchMock;

      await apiGetIntentsByRecipient(
        { recipientAddress: '0x999', status: 'SIGNALED' },
        'api-key',
        'https://api.example'
      );
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example/orders/recipient/0x999?status=SIGNALED',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('lists payees with optional processor filter', async () => {
      const mockResponse = { success: true, message: 'ok', statusCode: 200, responseObject: [] };
      const fetchMock = vi.fn(async () => new Response(JSON.stringify(mockResponse), { status: 200 }));
      (globalThis as any).fetch = fetchMock;

      await apiListPayees('venmo', 'api-key', 'https://api.example');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example/makers?processorName=venmo',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('gets a deposit spread', async () => {
      const mockResponse = { success: true, message: 'ok', statusCode: 200, data: { id: 1, depositId: 1, spread: 0.01, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } };
      const fetchMock = vi.fn(async () => new Response(JSON.stringify(mockResponse), { status: 200 }));
      (globalThis as any).fetch = fetchMock;
      await apiGetDepositSpread(1, 'api-key', 'https://api.example');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example/deposits/1/spread',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });
});
