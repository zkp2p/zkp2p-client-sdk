// Core exports
export { Zkp2pClient } from './client/Zkp2pClient';

// Types and errors
export * from './types';
export * from './errors';

// Constants - comprehensive export for easy access
export * from './constants';

// Utilities
export {
  encodeProofAsBytes,
  encodeTwoProofs,
  encodeManyProofs,
  encodeProofAndPaymentMethodAsBytes,
  assembleProofBytes,
  intentHashHexToDecimalString,
  type ReclaimProof,
} from './utils/proofEncoding';
export { logger, setLogLevel, type LogLevel } from './utils/logger';

// React hooks (only available in browser environments with React)
export * from './react';
