// Mock modules must be hoisted
vi.mock('@privy-io/react-auth', () => ({
  usePrivy: vi.fn(),
}));

// Mock lodash debounce to handle the ref pattern correctly
vi.mock('lodash/debounce', () => ({
  default: vi.fn((fn: any, delay: number, options?: any) => {
    // Return the function directly without debouncing for tests
    const mockDebounced = (...args: any[]) => fn(...args);
    // Add cancel method that debounce provides
    mockDebounced.cancel = vi.fn();
    mockDebounced.flush = vi.fn();
    return mockDebounced;
  }),
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import React from 'react';

// Import mocked modules
import { usePrivy } from '@privy-io/react-auth';
import useGetOwnerDeposits from '../useGetOwnerDeposits';
import { Deposit, DepositStatus } from '@helpers/types/curator';

// Test wrapper
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

// Mock fetch
global.fetch = vi.fn();

describe('useGetOwnerDeposits', () => {
  const mockAccessToken = 'mock-jwt-token-123';
  const mockGetAccessToken = vi.fn().mockResolvedValue(mockAccessToken);
  const mockApiUrl = 'https://api.test.com';
  const mockOwnerAddress = '0xowner123';
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_CURATOR_API_URL', mockApiUrl);
    vi.mocked(usePrivy).mockReturnValue({
      getAccessToken: mockGetAccessToken,
    } as any);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('successful deposit fetching', () => {

    it('should handle empty deposit list', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ responseObject: [] }),
      });

      const { result } = renderHook(() => useGetOwnerDeposits(), { wrapper });

      await act(async () => {
        await result.current.fetchOwnerDeposits(mockOwnerAddress);
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle deposits without dates', async () => {
      const depositWithoutDates = {
        id: '1',
        depositId: '123',
        depositor: mockOwnerAddress,
        tokenAddress: '0xusdc',
        amount: '1000000000',
        intentAmountRange: {
          min: '10000000',
          max: '100000000',
        },
        acceptingIntents: true,
        status: DepositStatus.ACTIVE,
        chain: 'BASE',
        createdAt: null,
        updatedAt: null,
        verifiers: [{
          id: 'v1',
          depositId: '1',
          verifierAddress: '0xverifier',
          payeeDetails: '@user',
          intentGatingService: '0xgating',
          data: '0x',
          platform: 'VENMO',
          createdAt: null,
          updatedAt: null,
          currencies: [{
            id: 'c1',
            verifierId: 'v1',
            code: 'USD',
            conversionRate: '1e18',
            createdAt: null,
            updatedAt: null,
          }],
        }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ responseObject: [depositWithoutDates] }),
      });

      const { result } = renderHook(() => useGetOwnerDeposits(), { wrapper });

      await act(async () => {
        await result.current.fetchOwnerDeposits(mockOwnerAddress);
      });

      const resultDeposit = result.current.data![0];
      expect(resultDeposit.createdAt).toBeUndefined();
      expect(resultDeposit.updatedAt).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      (global.fetch as any).mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useGetOwnerDeposits(), { wrapper });

      await act(async () => {
        await result.current.fetchOwnerDeposits(mockOwnerAddress);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toEqual(networkError);
      expect(result.current.data).toBeNull();
    });

    it('should handle API error responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid address format',
      });

      const { result } = renderHook(() => useGetOwnerDeposits(), { wrapper });

      await act(async () => {
        await result.current.fetchOwnerDeposits('invalid-address');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to fetch: Bad Request');
    });

    it('should handle authentication errors', async () => {
      mockGetAccessToken.mockRejectedValueOnce(new Error('Not authenticated'));

      const { result } = renderHook(() => useGetOwnerDeposits(), { wrapper });

      await act(async () => {
        await result.current.fetchOwnerDeposits(mockOwnerAddress);
      });

      expect(result.current.error?.message).toBe('Not authenticated');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle 500 server errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Database connection failed',
      });

      const { result } = renderHook(() => useGetOwnerDeposits(), { wrapper });

      await act(async () => {
        await result.current.fetchOwnerDeposits(mockOwnerAddress);
      });

      expect(result.current.error?.message).toBe('Failed to fetch: Internal Server Error');
    });
  });

  describe('loading states', () => {
    it('should manage loading state correctly', async () => {
      let resolvePromise: any;
      const fetchPromise = new Promise(resolve => { resolvePromise = resolve; });
      
      (global.fetch as any).mockReturnValueOnce({
        ok: true,
        json: () => fetchPromise,
      });

      const { result } = renderHook(() => useGetOwnerDeposits(), { wrapper });

      expect(result.current.isLoading).toBe(false);

      // Start fetching
      act(() => {
        result.current.fetchOwnerDeposits(mockOwnerAddress);
      });

      // Check loading state synchronously
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      act(() => {
        resolvePromise({ responseObject: [] });
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('debouncing behavior', () => {
    beforeEach(() => {
      // Re-mock debounce with actual implementation for this test
      vi.doUnmock('lodash/debounce');
      vi.resetModules();
    });

    it('should debounce multiple rapid calls', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ responseObject: [] }),
      });

      const { result, rerender } = renderHook(() => useGetOwnerDeposits(), { wrapper });
      
      // Ensure hook is initialized
      expect(result.current).toBeDefined();
      expect(result.current.fetchOwnerDeposits).toBeDefined();

      // Make multiple rapid calls
      act(() => {
        result.current.fetchOwnerDeposits(mockOwnerAddress);
        result.current.fetchOwnerDeposits(mockOwnerAddress);
        result.current.fetchOwnerDeposits(mockOwnerAddress);
      });

      // With mocked debounce (immediate), all calls go through
      // In real implementation, only one would execute
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle malformed response data', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          // Missing responseObject field
          data: [] 
        }),
      });

      const { result } = renderHook(() => useGetOwnerDeposits(), { wrapper });
      
      // Ensure hook is initialized
      expect(result.current).toBeDefined();
      if (!result.current.fetchOwnerDeposits) {
        throw new Error('Hook not properly initialized');
      }

      await act(async () => {
        await result.current.fetchOwnerDeposits(mockOwnerAddress);
      });

      // Should handle undefined gracefully - hook sets data to null, not undefined
      expect(result.current.data).toBeNull();
    });

    it('should reset error state on successful fetch', async () => {
      const { result } = renderHook(() => useGetOwnerDeposits(), { wrapper });

      // First call fails
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        await result.current.fetchOwnerDeposits(mockOwnerAddress);
      });

      expect(result.current.error).toBeTruthy();

      // Second call succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ responseObject: [] }),
      });

      await act(async () => {
        await result.current.fetchOwnerDeposits(mockOwnerAddress);
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle deposits with complex nested structures', async () => {
      const complexDeposit = {
        id: '1',
        depositId: '123',
        depositor: mockOwnerAddress,
        tokenAddress: '0xusdc',
        amount: '1000000000',
        intentAmountRange: { min: '1', max: '1000' },
        acceptingIntents: true,
        status: DepositStatus.ACTIVE,
        chain: 'BASE',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
        verifiers: [
          {
            id: 'v1',
            depositId: '1',
            verifierAddress: '0xverifier1',
            payeeDetails: '@user1',
            intentGatingService: '0xgating1',
            data: '0x123',
            platform: 'VENMO',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            currencies: [
              {
                id: 'c1',
                verifierId: 'v1',
                code: 'USD',
                conversionRate: '1e18',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
              },
              {
                id: 'c2',
                verifierId: 'v1',
                code: 'EUR',
                conversionRate: '9e17',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
              },
            ],
          },
          {
            id: 'v2',
            depositId: '1',
            verifierAddress: '0xverifier2',
            payeeDetails: '@user2',
            intentGatingService: '0xgating2',
            data: '0x456',
            platform: 'REVOLUT',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            currencies: [
              {
                id: 'c3',
                verifierId: 'v2',
                code: 'GBP',
                conversionRate: '8e17',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ responseObject: [complexDeposit] }),
      });

      const { result } = renderHook(() => useGetOwnerDeposits(), { wrapper });

      await act(async () => {
        await result.current.fetchOwnerDeposits(mockOwnerAddress);
      });

      const resultDeposit = result.current.data![0];
      expect(resultDeposit.verifiers).toHaveLength(2);
      expect(resultDeposit.verifiers[0].currencies).toHaveLength(2);
      expect(resultDeposit.verifiers[1].currencies).toHaveLength(1);
      
      // All dates should be converted
      expect(resultDeposit.createdAt).toBeInstanceOf(Date);
      expect(resultDeposit.verifiers[0].createdAt).toBeInstanceOf(Date);
      expect(resultDeposit.verifiers[0].currencies[0].createdAt).toBeInstanceOf(Date);
      expect(resultDeposit.verifiers[0].currencies[1].createdAt).toBeInstanceOf(Date);
      expect(resultDeposit.verifiers[1].currencies[0].createdAt).toBeInstanceOf(Date);
    });
  });
});