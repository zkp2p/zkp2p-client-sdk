import {
  Currency,
  type CurrencyType,
  currencyInfo,
  getCurrencyInfoFromHash,
  getCurrencyInfoFromCountryCode,
  isSupportedCurrency,
  currencies,
} from '../utils/currency';

describe('Currency Utils', () => {
  describe('Currency constant', () => {
    it('should have all expected currency codes', () => {
      const expectedCurrencies = [
        'AED',
        'ARS',
        'AUD',
        'CAD',
        'CHF',
        'CNY',
        'EUR',
        'GBP',
        'HKD',
        'IDR',
        'ILS',
        'JPY',
        'KES',
        'MXN',
        'MYR',
        'NZD',
        'PLN',
        'SAR',
        'SGD',
        'THB',
        'TRY',
        'UGX',
        'USD',
        'VND',
        'ZAR',
      ];

      expectedCurrencies.forEach((code) => {
        expect(Currency[code as keyof typeof Currency]).toBe(code);
      });
    });
  });

  describe('currencies array', () => {
    it('should contain all currency values', () => {
      expect(currencies).toHaveLength(25);
      expect(currencies).toContain('USD');
      expect(currencies).toContain('EUR');
      expect(currencies).toContain('GBP');
    });
  });

  describe('currencyInfo', () => {
    it('should have complete info for each currency', () => {
      Object.values(Currency).forEach((currencyCode) => {
        const info = currencyInfo[currencyCode as CurrencyType];
        expect(info).toBeDefined();
        expect(info?.currency).toBe(currencyCode);
        expect(info?.currencyCode).toBe(currencyCode);
        expect(info?.currencyName).toBeTruthy();
        expect(info?.currencySymbol).toBeTruthy();
        expect(info?.currencyCodeHash).toBeTruthy();
        expect(info?.countryCode).toBeTruthy();
      });
    });

    it('should have correct currency hashes starting with 0x', () => {
      Object.values(currencyInfo).forEach((info) => {
        expect(info.currencyCodeHash).toMatch(/^0x[a-f0-9]{64}$/);
      });
    });
  });

  describe('getCurrencyInfoFromHash', () => {
    it('should return correct currency info for valid hash', () => {
      const usdInfo = currencyInfo[Currency.USD];
      const result = getCurrencyInfoFromHash(usdInfo?.currencyCodeHash || '');

      expect(result).toEqual(usdInfo);
      expect(result?.currencyCode).toBe('USD');
    });

    it('should return null for invalid hash', () => {
      const result = getCurrencyInfoFromHash('0xinvalidhash');
      expect(result).toBeNull();
    });

    it('should return null for empty hash', () => {
      const result = getCurrencyInfoFromHash('');
      expect(result).toBeNull();
    });

    it('should be case sensitive for hash lookup', () => {
      const usdInfo = currencyInfo[Currency.USD];
      const upperCaseHash = usdInfo?.currencyCodeHash.toUpperCase();
      const result = getCurrencyInfoFromHash(upperCaseHash || '');

      expect(result).toBeNull();
    });
  });

  describe('getCurrencyInfoFromCountryCode', () => {
    it('should return correct currency info for valid country code', () => {
      const result = getCurrencyInfoFromCountryCode('us');
      expect(result).toEqual(currencyInfo[Currency.USD]);
      expect(result?.currencyCode).toBe('USD');
    });

    it('should return EUR for eu country code', () => {
      const result = getCurrencyInfoFromCountryCode('eu');
      expect(result).toEqual(currencyInfo[Currency.EUR]);
      expect(result?.currencyCode).toBe('EUR');
    });

    it('should return null for invalid country code', () => {
      const result = getCurrencyInfoFromCountryCode('xx');
      expect(result).toBeNull();
    });

    it('should return null for empty country code', () => {
      const result = getCurrencyInfoFromCountryCode('');
      expect(result).toBeNull();
    });

    it('should handle various country codes correctly', () => {
      const testCases = [
        { countryCode: 'gb', expectedCurrency: 'GBP' },
        { countryCode: 'jp', expectedCurrency: 'JPY' },
        { countryCode: 'ca', expectedCurrency: 'CAD' },
        { countryCode: 'au', expectedCurrency: 'AUD' },
        { countryCode: 'cn', expectedCurrency: 'CNY' },
      ];

      testCases.forEach(({ countryCode, expectedCurrency }) => {
        const result = getCurrencyInfoFromCountryCode(countryCode);
        expect(result?.currencyCode).toBe(expectedCurrency);
      });
    });
  });

  describe('isSupportedCurrency', () => {
    it('should return true for supported currencies', () => {
      Object.values(Currency).forEach((currencyCode) => {
        expect(isSupportedCurrency(currencyCode)).toBe(true);
      });
    });

    it('should return false for unsupported currencies', () => {
      expect(isSupportedCurrency('XYZ')).toBe(false);
      expect(isSupportedCurrency('BTC')).toBe(false);
      expect(isSupportedCurrency('ETH')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isSupportedCurrency('')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isSupportedCurrency('usd')).toBe(false);
      expect(isSupportedCurrency('USD')).toBe(true);
      expect(isSupportedCurrency('Usd')).toBe(false);
    });

    it('should handle special inputs', () => {
      expect(isSupportedCurrency('null')).toBe(false);
      expect(isSupportedCurrency('undefined')).toBe(false);
      expect(isSupportedCurrency(' USD ')).toBe(false); // with spaces
      expect(isSupportedCurrency('USD ')).toBe(false); // trailing space
    });
  });

  describe('Edge cases and data integrity', () => {
    it('should have unique currency code hashes', () => {
      const hashes = Object.values(currencyInfo).map(
        (info) => info.currencyCodeHash
      );
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(hashes.length);
    });

    it('should have unique country codes', () => {
      const countryCodes = Object.values(currencyInfo).map(
        (info) => info.countryCode
      );
      const uniqueCountryCodes = new Set(countryCodes);
      expect(uniqueCountryCodes.size).toBe(countryCodes.length);
    });

    it('should have consistent currency codes', () => {
      Object.entries(currencyInfo).forEach(([key, info]) => {
        expect(key).toBe(info.currency);
        expect(key).toBe(info.currencyCode);
      });
    });
  });
});
