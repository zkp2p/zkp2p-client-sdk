// Mock modules must be hoisted
vi.mock('@privy-io/react-auth', () => ({
  usePrivy: vi.fn(),
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import React from 'react';

// Import mocked modules
import { usePrivy } from '@privy-io/react-auth';
import useSignIntent from '../useSignIntent';
import type { IntentSignalRequest, SignalIntentResponse } from '@helpers/types';

// Test wrapper
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

// Mock fetch
global.fetch = vi.fn();

// Helper to create mock request
const createMockRequest = (overrides?: Partial<IntentSignalRequest>): IntentSignalRequest => ({
  processorName: 'VENMO',
  depositId: '1',
  tokenAmount: '1000000',
  payeeDetails: '@username',
  toAddress: '0xrecipient',
  fiatCurrencyCode: 'USD',
  chainId: '8453',
  ...overrides,
});

// Helper to create mock response
const createMockResponse = (overrides?: Partial<SignalIntentResponse>): SignalIntentResponse => ({
  success: true,
  message: 'Intent signed successfully',
  responseObject: {
    depositData: { signature: '0xsignature123' },
    signedIntent: '0xsignedintenthash',
  },
  statusCode: 200,
  ...overrides,
});

describe('useSignIntent', () => {
  const mockAccessToken = 'mock-jwt-token-123';
  const mockGetAccessToken = vi.fn().mockResolvedValue(mockAccessToken);
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock implementation
    mockGetAccessToken.mockClear();
    mockGetAccessToken.mockResolvedValue(mockAccessToken);
    vi.mocked(usePrivy).mockReturnValue({
      getAccessToken: mockGetAccessToken,
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('successful intent signing', () => {
    it('should fetch signed intent successfully', async () => {
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
      });

      const { result } = renderHook(() => useSignIntent(), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();

      await act(async () => {
        await result.current.fetchSignedIntent(mockRequest);
      });

      expect(mockGetAccessToken).toHaveBeenCalled();
      
      // Check that fetch was called with correct path and body
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/verify/intent'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify(mockRequest),
        })
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual(mockResponse);
    });

    it('should handle loading states correctly', async () => {
      const mockRequest = createMockRequest({
        processorName: 'REVOLUT',
        tokenAmount: '50000000',
        depositId: '2',
        payeeDetails: 'user@revolut',
        fiatCurrencyCode: 'EUR',
      });

      let resolvePromise: any;
      const fetchPromise = new Promise(resolve => { resolvePromise = resolve; });
      
      (global.fetch as any).mockReturnValueOnce({
        ok: true,
        json: () => fetchPromise,
      });

      const { result } = renderHook(() => useSignIntent(), { wrapper });

      // Start fetch in background
      act(() => {
        result.current.fetchSignedIntent(mockRequest);
      });

      // Should be loading immediately
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      resolvePromise(createMockResponse());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const mockRequest = createMockRequest();
      const networkError = new Error('Network error');
      (global.fetch as any).mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useSignIntent(), { wrapper });

      await act(async () => {
        await result.current.fetchSignedIntent(mockRequest);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toEqual(networkError);
      expect(result.current.data).toBeNull();
    });

    it('should handle API error responses', async () => {
      const mockRequest = createMockRequest();
      const errorMessage = 'Invalid payee details';
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => errorMessage,
      });

      const { result } = renderHook(() => useSignIntent(), { wrapper });

      await act(async () => {
        await result.current.fetchSignedIntent(mockRequest);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to fetch: Bad Request');
      expect(result.current.data).toBeNull();
    });

    it('should handle authentication errors', async () => {
      const mockRequest = createMockRequest();
      mockGetAccessToken.mockRejectedValueOnce(new Error('Not authenticated'));

      const { result } = renderHook(() => useSignIntent(), { wrapper });

      await act(async () => {
        await result.current.fetchSignedIntent(mockRequest);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Not authenticated');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle 401 unauthorized responses', async () => {
      const mockRequest = createMockRequest();
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Token expired',
      });

      const { result } = renderHook(() => useSignIntent(), { wrapper });

      await act(async () => {
        await result.current.fetchSignedIntent(mockRequest);
      });

      expect(result.current.error?.message).toBe('Failed to fetch: Unauthorized');
    });
  });

  describe('edge cases', () => {
    it('should handle relative URL when API URL is empty', async () => {
      const mockRequest = createMockRequest();
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => createMockResponse(),
      });

      const { result } = renderHook(() => useSignIntent(), { wrapper });

      await act(async () => {
        await result.current.fetchSignedIntent(mockRequest);
      });

      // Should use URL ending with /v1/verify/intent
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/verify/intent'),
        expect.any(Object)
      );
    });

    it('should reset error state on successful fetch after error', async () => {
      const mockRequest = createMockRequest();

      // First call fails
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useSignIntent(), { wrapper });

      await act(async () => {
        await result.current.fetchSignedIntent(mockRequest);
      });

      expect(result.current.error).toBeTruthy();

      // Second call succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => createMockResponse(),
      });

      await act(async () => {
        await result.current.fetchSignedIntent(mockRequest);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeTruthy();
    });

    it('should handle concurrent requests', async () => {
      const mockRequest1 = createMockRequest({
        toAddress: '0xrecipient1',
        depositId: '1',
        payeeDetails: '@user1',
      });

      const mockRequest2 = createMockRequest({
        toAddress: '0xrecipient2',
        tokenAmount: '2000000',
        depositId: '2',
        processorName: 'REVOLUT',
        fiatCurrencyCode: 'EUR',
        payeeDetails: '@user2',
      });

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => createMockResponse({ 
            responseObject: { 
              depositData: {}, 
              signedIntent: '0x111' 
            } 
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => createMockResponse({ 
            responseObject: { 
              depositData: {}, 
              signedIntent: '0x222' 
            } 
          }),
        });

      const { result } = renderHook(() => useSignIntent(), { wrapper });

      // Start both requests
      const promise1 = act(async () => {
        await result.current.fetchSignedIntent(mockRequest1);
      });

      const promise2 = act(async () => {
        await result.current.fetchSignedIntent(mockRequest2);
      });

      await Promise.all([promise1, promise2]);

      // Should have data from the last request
      expect(result.current.data?.responseObject.signedIntent).toBe('0x222');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

  });

});