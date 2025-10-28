// Breaking SDK export: single modern client (v3 contracts + indexer)
export { Zkp2pClient } from './client/Zkp2pClient';

// Public indexer types
export type {
  DepositEntity as IndexerDeposit,
  IntentEntity as IndexerIntent,
  DepositWithRelations as IndexerDepositWithRelations,
  IntentFulfilledEntity as IndexerIntentFulfilled,
} from './indexer/types';
export {
  fetchFulfillmentAndPayment as fetchIndexerFulfillmentAndPayment,
  type FulfillmentRecord as IndexerFulfillmentRecord,
  type PaymentVerifiedRecord as IndexerPaymentVerifiedRecord,
  type FulfillmentAndPaymentResponse as IndexerFulfillmentAndPaymentResponse,
} from './indexer/intentVerification';

// Generic utilities and errors
export { logger, setLogLevel, type LogLevel } from './utils/logger';
export {
  encodeProofAsBytes,
  encodeTwoProofs,
  encodeManyProofs,
  encodeProofAndPaymentMethodAsBytes,
  assembleProofBytes,
  intentHashHexToDecimalString,
  type ReclaimProof,
} from './utils/proofEncoding';
export * from './errors';

// Optional utilities
export { ensureBytes32, asciiToBytes32 } from './utils/bytes32';
export { resolvePaymentMethodHash, resolveFiatCurrencyBytes32 } from './utils/paymentResolution';
export { resolvePaymentMethodHashFromCatalog, resolvePaymentMethodNameFromHash } from './utils/paymentResolution';
export { mapConversionRatesToOnchainMinRate, Currency, currencyInfo, getCurrencyInfoFromHash, getCurrencyInfoFromCountryCode, getCurrencyCodeFromHash, isSupportedCurrencyHash } from './utils/currency';
export type { CurrencyType, CurrencyData } from './utils/currency';
export { getContracts, getPaymentMethodsCatalog, getGatingServiceAddress, type RuntimeEnv } from './contracts';
export type { PaymentMethodCatalog } from './contracts';
export { PAYMENT_PLATFORMS, PLATFORM_METADATA } from './constants';
export type { PaymentPlatformType } from './types';
export { enrichPvDepositView, enrichPvIntentView } from './utils/protocolViewerParsers';
