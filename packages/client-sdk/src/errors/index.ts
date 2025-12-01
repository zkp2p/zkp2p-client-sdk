export enum ErrorCode {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  API = 'API',
  CONTRACT = 'CONTRACT',
  PROOF_GENERATION = 'PROOF_GENERATION',
  UNKNOWN = 'UNKNOWN'
}

export class ZKP2PError extends Error {
  code: ErrorCode;
  details?: unknown;
  field?: string;
  constructor(message: string, code: ErrorCode = ErrorCode.UNKNOWN, details?: unknown, field?: string) {
    super(message);
    this.name = 'ZKP2PError';
    this.code = code;
    this.details = details;
    this.field = field;
  }
}

export class ValidationError extends ZKP2PError {
  constructor(message: string, field?: string, details?: unknown) {
    super(message, ErrorCode.VALIDATION, details, field);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends ZKP2PError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.NETWORK, details);
    this.name = 'NetworkError';
  }
}

export class APIError extends ZKP2PError {
  status?: number;
  constructor(message: string, status?: number, details?: unknown) {
    super(message, ErrorCode.API, details);
    this.status = status;
    this.name = 'APIError';
  }
}

export class ContractError extends ZKP2PError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.CONTRACT, details);
    this.name = 'ContractError';
  }
}

export class ProofGenerationError extends ZKP2PError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.PROOF_GENERATION, details);
    this.name = 'ProofGenerationError';
  }
}

