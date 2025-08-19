import { currencyKeccak256 } from './keccak';

export const Currency = {
  AED: 'AED',
  ARS: 'ARS',
  AUD: 'AUD',
  CAD: 'CAD',
  CHF: 'CHF',
  CNY: 'CNY',
  CZK: 'CZK',
  DKK: 'DKK',
  EUR: 'EUR',
  GBP: 'GBP',
  HKD: 'HKD',
  HUF: 'HUF',
  IDR: 'IDR',
  ILS: 'ILS',
  INR: 'INR',
  JPY: 'JPY',
  KES: 'KES',
  MXN: 'MXN',
  MYR: 'MYR',
  NOK: 'NOK',
  NZD: 'NZD',
  PHP: 'PHP',
  PLN: 'PLN',
  RON: 'RON',
  SAR: 'SAR',
  SEK: 'SEK',
  SGD: 'SGD',
  THB: 'THB',
  TRY: 'TRY',
  UGX: 'UGX',
  USD: 'USD',
  VND: 'VND',
  ZAR: 'ZAR'
} as const;

export type CurrencyType = (typeof Currency)[keyof typeof Currency];

export type CurrencyData = {
  currency: CurrencyType;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  currencyCodeHash: string;
  countryCode: string;
};

export const currencyInfo: Record<CurrencyType, CurrencyData> = {
  AED: { currency: 'AED', currencyCode: 'AED', currencyName: 'United Arab Emirates Dirham', currencyCodeHash: currencyKeccak256('AED'), currencySymbol: 'د.إ', countryCode: 'ae' },
  ARS: { currency: 'ARS', currencyCode: 'ARS', currencyName: 'Argentine Peso', currencyCodeHash: currencyKeccak256('ARS'), currencySymbol: '$', countryCode: 'ar' },
  AUD: { currency: 'AUD', currencyCode: 'AUD', currencyName: 'Australian Dollar', currencyCodeHash: currencyKeccak256('AUD'), currencySymbol: 'A$', countryCode: 'au' },
  CAD: { currency: 'CAD', currencyCode: 'CAD', currencyName: 'Canadian Dollar', currencyCodeHash: currencyKeccak256('CAD'), currencySymbol: 'C$', countryCode: 'ca' },
  CHF: { currency: 'CHF', currencyCode: 'CHF', currencyName: 'Swiss Franc', currencyCodeHash: currencyKeccak256('CHF'), currencySymbol: 'Fr', countryCode: 'ch' },
  CNY: { currency: 'CNY', currencyCode: 'CNY', currencyName: 'Chinese Yuan', currencyCodeHash: currencyKeccak256('CNY'), currencySymbol: '¥', countryCode: 'cn' },
  CZK: { currency: 'CZK', currencyCode: 'CZK', currencyName: 'Czech Koruna', currencyCodeHash: currencyKeccak256('CZK'), currencySymbol: 'Kč', countryCode: 'cz' },
  DKK: { currency: 'DKK', currencyCode: 'DKK', currencyName: 'Danish Krone', currencyCodeHash: currencyKeccak256('DKK'), currencySymbol: 'kr', countryCode: 'dk' },
  EUR: { currency: 'EUR', currencyCode: 'EUR', currencyName: 'Euro', currencyCodeHash: currencyKeccak256('EUR'), currencySymbol: '€', countryCode: 'eu' },
  GBP: { currency: 'GBP', currencyCode: 'GBP', currencyName: 'British Pound', currencyCodeHash: currencyKeccak256('GBP'), currencySymbol: '£', countryCode: 'gb' },
  HKD: { currency: 'HKD', currencyCode: 'HKD', currencyName: 'Hong Kong Dollar', currencyCodeHash: currencyKeccak256('HKD'), currencySymbol: 'HK$', countryCode: 'hk' },
  HUF: { currency: 'HUF', currencyCode: 'HUF', currencyName: 'Hungarian Forint', currencyCodeHash: currencyKeccak256('HUF'), currencySymbol: 'Ft', countryCode: 'hu' },
  IDR: { currency: 'IDR', currencyCode: 'IDR', currencyName: 'Indonesian Rupiah', currencyCodeHash: currencyKeccak256('IDR'), currencySymbol: 'Rp', countryCode: 'id' },
  ILS: { currency: 'ILS', currencyCode: 'ILS', currencyName: 'Israeli New Shekel', currencyCodeHash: currencyKeccak256('ILS'), currencySymbol: '₪', countryCode: 'il' },
  INR: { currency: 'INR', currencyCode: 'INR', currencyName: 'Indian Rupee', currencyCodeHash: currencyKeccak256('INR'), currencySymbol: '₹', countryCode: 'in' },
  JPY: { currency: 'JPY', currencyCode: 'JPY', currencyName: 'Japanese Yen', currencyCodeHash: currencyKeccak256('JPY'), currencySymbol: '¥', countryCode: 'jp' },
  KES: { currency: 'KES', currencyCode: 'KES', currencyName: 'Kenyan Shilling', currencyCodeHash: currencyKeccak256('KES'), currencySymbol: 'KSh', countryCode: 'ke' },
  MXN: { currency: 'MXN', currencyCode: 'MXN', currencyName: 'Mexican Peso', currencyCodeHash: currencyKeccak256('MXN'), currencySymbol: '$', countryCode: 'mx' },
  MYR: { currency: 'MYR', currencyCode: 'MYR', currencyName: 'Malaysian Ringgit', currencyCodeHash: currencyKeccak256('MYR'), currencySymbol: 'RM', countryCode: 'my' },
  NOK: { currency: 'NOK', currencyCode: 'NOK', currencyName: 'Norwegian Krone', currencyCodeHash: currencyKeccak256('NOK'), currencySymbol: 'kr', countryCode: 'no' },
  NZD: { currency: 'NZD', currencyCode: 'NZD', currencyName: 'New Zealand Dollar', currencyCodeHash: currencyKeccak256('NZD'), currencySymbol: 'NZ$', countryCode: 'nz' },
  PHP: { currency: 'PHP', currencyCode: 'PHP', currencyName: 'Philippine Peso', currencyCodeHash: currencyKeccak256('PHP'), currencySymbol: '₱', countryCode: 'ph' },
  PLN: { currency: 'PLN', currencyCode: 'PLN', currencyName: 'Polish Złoty', currencyCodeHash: currencyKeccak256('PLN'), currencySymbol: 'zł', countryCode: 'pl' },
  RON: { currency: 'RON', currencyCode: 'RON', currencyName: 'Romanian Leu', currencyCodeHash: currencyKeccak256('RON'), currencySymbol: 'lei', countryCode: 'ro' },
  SAR: { currency: 'SAR', currencyCode: 'SAR', currencyName: 'Saudi Riyal', currencyCodeHash: currencyKeccak256('SAR'), currencySymbol: '﷼', countryCode: 'sa' },
  SEK: { currency: 'SEK', currencyCode: 'SEK', currencyName: 'Swedish Krona', currencyCodeHash: currencyKeccak256('SEK'), currencySymbol: 'kr', countryCode: 'se' },
  SGD: { currency: 'SGD', currencyCode: 'SGD', currencyName: 'Singapore Dollar', currencyCodeHash: currencyKeccak256('SGD'), currencySymbol: 'S$', countryCode: 'sg' },
  THB: { currency: 'THB', currencyCode: 'THB', currencyName: 'Thai Baht', currencyCodeHash: currencyKeccak256('THB'), currencySymbol: '฿', countryCode: 'th' },
  TRY: { currency: 'TRY', currencyCode: 'TRY', currencyName: 'Turkish Lira', currencyCodeHash: currencyKeccak256('TRY'), currencySymbol: '₺', countryCode: 'tr' },
  UGX: { currency: 'UGX', currencyCode: 'UGX', currencyName: 'Ugandan Shilling', currencyCodeHash: currencyKeccak256('UGX'), currencySymbol: 'USh', countryCode: 'ug' },
  USD: { currency: 'USD', currencyCode: 'USD', currencyName: 'United States Dollar', currencyCodeHash: currencyKeccak256('USD'), currencySymbol: '$', countryCode: 'us' },
  VND: { currency: 'VND', currencyCode: 'VND', currencyName: 'Vietnamese Dong', currencyCodeHash: currencyKeccak256('VND'), currencySymbol: '₫', countryCode: 'vn' },
  ZAR: { currency: 'ZAR', currencyCode: 'ZAR', currencyName: 'South African Rand', currencyCodeHash: currencyKeccak256('ZAR'), currencySymbol: 'R', countryCode: 'za' },
} as unknown as Record<CurrencyType, CurrencyData>;

export type UICurrencyRate = { currency: CurrencyType; conversionRate: string };

export type OnchainCurrency = { code: `0x${string}`; conversionRate: bigint };

export function mapConversionRatesToOnchain(
  groups: UICurrencyRate[][],
  expectedGroups?: number
): OnchainCurrency[][] {
  if (!Array.isArray(groups) || !Array.isArray(groups[0])) {
    throw new Error('conversionRates must be a nested array per processor');
  }
  if (typeof expectedGroups === 'number' && groups.length !== expectedGroups) {
    throw new Error(`conversionRates length (${groups.length}) must match processorNames length (${expectedGroups})`);
  }
  return groups.map((group) => group.map((r) => {
    const info = currencyInfo[r.currency as CurrencyType];
    if (!info?.currencyCodeHash) throw new Error('Invalid currency');
    return { code: info.currencyCodeHash as `0x${string}`, conversionRate: BigInt(r.conversionRate) };
  }));
}
