import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useQuoteStorage, { QuoteData } from '../useQuoteStorage';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Note: console methods are already mocked in test setup

describe('useQuoteStorage', () => {
  const mockQuoteData: QuoteData = {
    usdcAmount: '1000',
    fiatAmount: '1000',
    fiatCurrency: 'USD',
    token: 'USDC',
    tokenAmount: '1000',
    recipientAddress: '0x1234567890123456789012345678901234567890',
    outputTokenAmount: '1000',
    outputTokenDecimals: 6,
    outputTokenAmountInUsd: '1000',
    usdcToFiatRate: '1.0',
    usdcToTokenRate: '1.0',
    gasFeesInUsd: '5.00',
    appFeeInUsd: '2.00',
    relayerFeeInUsd: '3.00',
    relayerGasFeesInUsd: '1.00',
    relayerServiceFeesInUsd: '2.00',
    timeEstimate: '5 minutes',
    paymentPlatform: 'VENMO',
    paymentMethod: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('saveQuoteData', () => {
    it('should save quote data to localStorage with intentHash included', () => {
      const { result } = renderHook(() => useQuoteStorage());
      const address = '0x1234567890123456789012345678901234567890';
      const intentHash = '0xabc123';

      act(() => {
        result.current.saveQuoteData(address, intentHash, mockQuoteData);
      });

      const expectedData = { ...mockQuoteData, intentHash };
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `quote_data_${address}`,
        JSON.stringify(expectedData)
      );
    });

    it('should handle empty address gracefully', () => {
      const { result } = renderHook(() => useQuoteStorage());

      act(() => {
        result.current.saveQuoteData('', '0xabc123', mockQuoteData);
      });

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useQuoteStorage());
      const address = '0x1234567890123456789012345678901234567890';
      const intentHash = '0xabc123';

      act(() => {
        result.current.saveQuoteData(address, intentHash, mockQuoteData);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save quote data to localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle circular reference in quote data', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const circularData: any = { ...mockQuoteData };
      circularData.circular = circularData;

      const { result } = renderHook(() => useQuoteStorage());
      const address = '0x1234567890123456789012345678901234567890';
      const intentHash = '0xabc123';

      act(() => {
        result.current.saveQuoteData(address, intentHash, circularData);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save quote data to localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('getQuoteData', () => {
    it('should retrieve quote data from localStorage', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const storedData = { ...mockQuoteData, intentHash: '0xabc123' };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(storedData));

      const { result } = renderHook(() => useQuoteStorage());

      let retrievedData: QuoteData | null = null;
      act(() => {
        retrievedData = result.current.getQuoteData(address);
      });

      expect(localStorageMock.getItem).toHaveBeenCalledWith(`quote_data_${address}`);
      expect(retrievedData).toEqual(storedData);
    });

    it('should return null for non-existent data', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      const { result } = renderHook(() => useQuoteStorage());

      let retrievedData: QuoteData | null = null;
      act(() => {
        retrievedData = result.current.getQuoteData('0x9876543210987654321098765432109876543210');
      });

      expect(retrievedData).toBeNull();
    });

    it('should handle empty address', () => {
      const { result } = renderHook(() => useQuoteStorage());

      let retrievedData: QuoteData | null = null;
      act(() => {
        retrievedData = result.current.getQuoteData('');
      });

      expect(retrievedData).toBeNull();
      expect(localStorageMock.getItem).not.toHaveBeenCalled();
    });

    it('should handle corrupted data gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      localStorageMock.getItem.mockReturnValueOnce('invalid json');

      const { result } = renderHook(() => useQuoteStorage());

      let retrievedData: QuoteData | null = null;
      act(() => {
        retrievedData = result.current.getQuoteData('0x1234567890123456789012345678901234567890');
      });

      expect(retrievedData).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to retrieve quote data from localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Permission denied');
      });

      const { result } = renderHook(() => useQuoteStorage());

      let retrievedData: QuoteData | null = null;
      act(() => {
        retrievedData = result.current.getQuoteData('0x1234567890123456789012345678901234567890');
      });

      expect(retrievedData).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to retrieve quote data from localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('updateQuoteDataPaymentMethod', () => {
    it('should update payment method for existing quote and preserve intentHash', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const intentHash = '0xabc123';
      const storedData = { ...mockQuoteData, intentHash };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(storedData));

      const { result } = renderHook(() => useQuoteStorage());

      act(() => {
        result.current.updateQuoteDataPaymentMethod(address, 2);
      });

      const expectedData = { ...storedData, paymentMethod: 2 };
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `quote_data_${address}`,
        JSON.stringify(expectedData)
      );
    });

    it('should not update if quote does not exist', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      const { result } = renderHook(() => useQuoteStorage());

      act(() => {
        result.current.updateQuoteDataPaymentMethod('0x9876543210987654321098765432109876543210', 2);
      });

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle empty address', () => {
      const { result } = renderHook(() => useQuoteStorage());

      act(() => {
        result.current.updateQuoteDataPaymentMethod('', 2);
      });

      expect(localStorageMock.getItem).not.toHaveBeenCalled();
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle storage errors during update', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const address = '0x1234567890123456789012345678901234567890';
      const storedData = { ...mockQuoteData, intentHash: '0xabc123' };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(storedData));
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useQuoteStorage());

      act(() => {
        result.current.updateQuoteDataPaymentMethod(address, 2);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save quote data to localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle missing intentHash when updating', () => {
      const address = '0x1234567890123456789012345678901234567890';
      // Data without intentHash (backward compatibility)
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockQuoteData));

      const { result } = renderHook(() => useQuoteStorage());

      act(() => {
        result.current.updateQuoteDataPaymentMethod(address, 2);
      });

      const expectedData = { ...mockQuoteData, paymentMethod: 2, intentHash: '' };
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `quote_data_${address}`,
        JSON.stringify(expectedData)
      );
    });
  });

  describe('clearQuoteData', () => {
    it('should remove quote data from localStorage', () => {
      const address = '0x1234567890123456789012345678901234567890';

      const { result } = renderHook(() => useQuoteStorage());

      act(() => {
        result.current.clearQuoteData(address);
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        `quote_data_${address}`
      );
    });

    it('should handle empty address', () => {
      const { result } = renderHook(() => useQuoteStorage());

      act(() => {
        result.current.clearQuoteData('');
      });

      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Permission denied');
      });

      const { result } = renderHook(() => useQuoteStorage());
      const address = '0x1234567890123456789012345678901234567890';

      act(() => {
        result.current.clearQuoteData(address);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear quote data from localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });


  describe('Integration scenarios', () => {
    it('should handle full quote lifecycle', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const intentHash = '0xabc123';
      const { result } = renderHook(() => useQuoteStorage());

      // Save quote
      act(() => {
        result.current.saveQuoteData(address, intentHash, mockQuoteData);
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();

      // Retrieve quote
      const storedData = { ...mockQuoteData, intentHash };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(storedData));
      let retrievedData: any = null;
      act(() => {
        retrievedData = result.current.getQuoteData(address);
      });

      expect(retrievedData).toEqual(storedData);
      expect(retrievedData?.intentHash).toBe(intentHash);

      // Update payment method
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(storedData));
      act(() => {
        result.current.updateQuoteDataPaymentMethod(address, 3);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `quote_data_${address}`,
        JSON.stringify({ ...storedData, paymentMethod: 3 })
      );

      // Clear quote
      act(() => {
        result.current.clearQuoteData(address);
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        `quote_data_${address}`
      );
    });

    it('should handle multiple quotes independently', () => {
      const { result } = renderHook(() => useQuoteStorage());

      const address1 = '0x1111111111111111111111111111111111111111';
      const address2 = '0x2222222222222222222222222222222222222222';
      const quote1 = { ...mockQuoteData, usdcAmount: '1000' };
      const quote2 = { ...mockQuoteData, usdcAmount: '2000' };

      act(() => {
        result.current.saveQuoteData(address1, '0xhash1', quote1);
        result.current.saveQuoteData(address2, '0xhash2', quote2);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `quote_data_${address1}`,
        JSON.stringify({ ...quote1, intentHash: '0xhash1' })
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `quote_data_${address2}`,
        JSON.stringify({ ...quote2, intentHash: '0xhash2' })
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle partial quote data', () => {
      const partialQuote: Partial<QuoteData> = {
        usdcAmount: '1000',
        fiatAmount: '1000',
        fiatCurrency: 'USD',
        paymentPlatform: 'VENMO',
        recipientAddress: '0x123',
      };

      const { result } = renderHook(() => useQuoteStorage());
      const address = '0x1234567890123456789012345678901234567890';

      act(() => {
        result.current.saveQuoteData(address, '0xpartial', partialQuote as QuoteData);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `quote_data_${address}`,
        JSON.stringify({ ...partialQuote, intentHash: '0xpartial' })
      );
    });

    it('should handle very large quote data', () => {
      const largeQuote = {
        ...mockQuoteData,
        largeField: 'x'.repeat(10000), // 10KB of data
      };

      const { result } = renderHook(() => useQuoteStorage());
      const address = '0x1234567890123456789012345678901234567890';

      act(() => {
        result.current.saveQuoteData(address, '0xlarge', largeQuote);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `quote_data_${address}`,
        expect.stringContaining('x'.repeat(10000))
      );
    });

    it('should handle special characters in address', () => {
      const specialAddress = '0x!@#$%^&*()_+1234567890123456789012345678';
      const { result } = renderHook(() => useQuoteStorage());

      act(() => {
        result.current.saveQuoteData(specialAddress, '0xhash', mockQuoteData);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `quote_data_${specialAddress}`,
        JSON.stringify({ ...mockQuoteData, intentHash: '0xhash' })
      );
    });

    it('should handle different addresses with same intentHash', () => {
      const { result } = renderHook(() => useQuoteStorage());
      const address1 = '0x1111111111111111111111111111111111111111';
      const address2 = '0x2222222222222222222222222222222222222222';
      const intentHash = '0xsameHash';

      act(() => {
        result.current.saveQuoteData(address1, intentHash, mockQuoteData);
        result.current.saveQuoteData(address2, intentHash, mockQuoteData);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `quote_data_${address1}`,
        JSON.stringify({ ...mockQuoteData, intentHash })
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `quote_data_${address2}`,
        JSON.stringify({ ...mockQuoteData, intentHash })
      );
    });
  });
});