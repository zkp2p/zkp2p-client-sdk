/**
 * Error codes for categorizing SDK errors.
 */
export enum ErrorCode {
  /** Input validation failed */
  VALIDATION = 'VALIDATION',
  /** Network/RPC error */
  NETWORK = 'NETWORK',
  /** API request failed */
  API = 'API',
  /** Smart contract error */
  CONTRACT = 'CONTRACT',
  /** Unknown/uncategorized error */
  UNKNOWN = 'UNKNOWN'
}

/**
 * Base error class for all SDK errors.
 *
 * All SDK-specific errors extend this class, making it easy to catch
 * and handle SDK errors uniformly.
 *
 * @example
 * ```typescript
 * try {
 *   await client.createDeposit(...);
 * } catch (error) {
 *   if (error instanceof ZKP2PError) {
 *     console.log('SDK Error:', error.code, error.message);
 *     console.log('Details:', error.details);
 *   }
 * }
 * ```
 */
export class ZKP2PError extends Error {
  /** Error category code */
  code: ErrorCode;
  /** Additional error details (varies by error type) */
  details?: unknown;
  /** Field that caused the error (for validation errors) */
  field?: string;

  constructor(message: string, code: ErrorCode = ErrorCode.UNKNOWN, details?: unknown, field?: string) {
    super(message);
    this.name = 'ZKP2PError';
    this.code = code;
    this.details = details;
    this.field = field;
  }
}

/**
 * Thrown when input validation fails.
 *
 * @example
 * ```typescript
 * throw new ValidationError('Amount must be positive', 'amount');
 * ```
 */
export class ValidationError extends ZKP2PError {
  constructor(message: string, field?: string, details?: unknown) {
    super(message, ErrorCode.VALIDATION, details, field);
    this.name = 'ValidationError';
  }
}

/**
 * Thrown when a network or RPC request fails.
 */
export class NetworkError extends ZKP2PError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.NETWORK, details);
    this.name = 'NetworkError';
  }
}

/**
 * Thrown when an API request fails.
 *
 * @example
 * ```typescript
 * catch (error) {
 *   if (error instanceof APIError) {
 *     console.log('HTTP Status:', error.status);
 *   }
 * }
 * ```
 */
export class APIError extends ZKP2PError {
  /** HTTP status code (if applicable) */
  status?: number;

  constructor(message: string, status?: number, details?: unknown) {
    super(message, ErrorCode.API, details);
    this.status = status;
    this.name = 'APIError';
  }
}

/**
 * Thrown when a smart contract call fails.
 *
 * Check the `details` property for the underlying viem error.
 */
export class ContractError extends ZKP2PError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.CONTRACT, details);
    this.name = 'ContractError';
  }
}

