// Versioned v1 entry point
// Exposes the current stable v1 client, types, and utilities.

// Core client
export { Zkp2pClient } from '../client/Zkp2pClient';
import { Zkp2pClient } from '../client/Zkp2pClient';

// Types and errors (v1 shapes)
export * from '../types';
export * from '../errors';

// Constants
export * from '../constants';

// Utilities
export {
  encodeProofAsBytes,
  encodeTwoProofs,
  encodeManyProofs,
  encodeProofAndPaymentMethodAsBytes,
  assembleProofBytes,
  intentHashHexToDecimalString,
  type ReclaimProof,
} from '../utils/proofEncoding';
export { logger, setLogLevel, type LogLevel } from '../utils/logger';

// React hooks (browser environments)
export * from '../react';

// Convenience factory for v1
import type { Zkp2pClientOptions } from '../types';
export function createClient(options: Zkp2pClientOptions) {
  return new Zkp2pClient(options);
}
