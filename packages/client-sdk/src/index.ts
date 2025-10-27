// Breaking SDK export: single modern client (v3 contracts + indexer)
export { Zkp2pClient } from './client/Zkp2pClient';

// Public indexer types
export type {
  DepositEntity as IndexerDeposit,
  IntentEntity as IndexerIntent,
  DepositWithRelations as IndexerDepositWithRelations,
} from './indexer/types';

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
export { resolvePaymentMethodHashFromCatalog } from './utils/paymentResolution';
export { mapConversionRatesToOnchainMinRate } from './utils/currency';
export { getContracts, getPaymentMethodsCatalog, type RuntimeEnv } from './contracts';
export type { PaymentMethodCatalog } from './contracts';
