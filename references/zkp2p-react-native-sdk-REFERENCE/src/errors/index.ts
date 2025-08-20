export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // API errors
  API_ERROR = 'API_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  NOT_FOUND = 'NOT_FOUND',

  // Contract errors
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_CHAIN = 'INVALID_CHAIN',

  // Proof errors
  PROOF_GENERATION_FAILED = 'PROOF_GENERATION_FAILED',
}

export class ZKP2PError extends Error {
  constructor(
    message: string,
    public code: ErrorCode = ErrorCode.API_ERROR,
    public details?: any
  ) {
    super(message);
    this.name = 'ZKP2PError';
  }
}

// Specific error classes for better instanceof checks
export class NetworkError extends ZKP2PError {
  constructor(message: string, details?: any) {
    super(message, ErrorCode.NETWORK_ERROR, details);
    this.name = 'NetworkError';
  }
}

export class APIError extends ZKP2PError {
  constructor(
    message: string,
    public status?: number,
    details?: any
  ) {
    super(message, ErrorCode.API_ERROR, details);
    this.name = 'APIError';
  }
}

export class ContractError extends ZKP2PError {
  constructor(
    message: string,
    public reason?: string,
    details?: any
  ) {
    super(message, ErrorCode.CONTRACT_ERROR, details);
    this.name = 'ContractError';
  }
}

export class ValidationError extends ZKP2PError {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, { field });
    this.name = 'ValidationError';
  }
}

export class ProofGenerationError extends ZKP2PError {
  constructor(message: string, details?: any) {
    super(message, ErrorCode.PROOF_GENERATION_FAILED, details);
    this.name = 'ProofGenerationError';
  }
}
