import { PaymentPlatformType } from '@helpers/types';

export interface ProofGenerationError {
  type: 'VALIDATION_FAILED' | 'TIMEOUT' | 'EXTENSION_ERROR' | 'UNKNOWN';
  field?: string;
  expectedPattern?: string;
  userMessage: string;
  technicalDetails: string;
  suggestedActions: string[];
}

interface ExtensionError {
  id?: string;
  metadata?: any[];
  actionType?: string;
  timestamp?: number;
  status?: string;
  error?: {
    message?: string;
  };
}

// Platform-specific error patterns
const WISE_ERROR_PATTERNS = [
  {
    pattern: /state.*OUTGOING_PAYMENT/i,
    error: {
      type: 'VALIDATION_FAILED' as const,
      field: 'paymentStatus',
      userMessage: 'This payment hasn\'t been sent yet',
      suggestedActions: [
        'Check if the payment is still processing',
        'Wait for the payment to complete in Wise'
      ]
    }
  }
];

const VENMO_ERROR_PATTERNS: any[] = [
];

const REVOLUT_ERROR_PATTERNS: any[] = [
];

const CASHAPP_ERROR_PATTERNS: any[] = [
];

const PAYPAL_ERROR_PATTERNS: any[] = [
];

const ZELLE_ERROR_PATTERNS: any[] = [
];

const MERCADOPAGO_ERROR_PATTERNS: any[] = [
];

const ERROR_PATTERN_MAP: Record<PaymentPlatformType, any[]> = {
  'wise': WISE_ERROR_PATTERNS,
  'venmo': VENMO_ERROR_PATTERNS,
  'revolut': REVOLUT_ERROR_PATTERNS,
  'cashapp': CASHAPP_ERROR_PATTERNS,
  'paypal': PAYPAL_ERROR_PATTERNS,
  'zelle': ZELLE_ERROR_PATTERNS,
  'mercadopago': MERCADOPAGO_ERROR_PATTERNS,
};

function parseWiseError(error: ExtensionError): ProofGenerationError {
  const message = error.error?.message || '';

  // Check against known patterns
  for (const { pattern, error: errorDetails } of WISE_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return {
        ...errorDetails,
        technicalDetails: JSON.stringify(error, null, 2)
      };
    }
  }

  // Generic Wise error
  return {
    type: 'VALIDATION_FAILED',
    userMessage: 'Unable to verify your Wise payment',
    suggestedActions: [
      'Ensure the payment shows as "Sent" in Wise',
      'Check that all payment details are visible',
      'Try selecting a different payment'
    ],
    technicalDetails: JSON.stringify(error, null, 2)
  };
}

function parseVenmoError(error: ExtensionError): ProofGenerationError {
  const message = error.error?.message || '';

  for (const { pattern, error: errorDetails } of VENMO_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return {
        ...errorDetails,
        technicalDetails: JSON.stringify(error, null, 2)
      };
    }
  }

  return {
    type: 'VALIDATION_FAILED',
    userMessage: 'Unable to verify your Venmo payment',
    suggestedActions: [
      'Ensure the payment is completed (not pending)',
      'Check that the payment is visible to friends or public',
      'Try selecting a different payment'
    ],
    technicalDetails: JSON.stringify(error, null, 2)
  };
}

function parseRevolutError(error: ExtensionError): ProofGenerationError {
  const message = error.error?.message || '';

  for (const { pattern, error: errorDetails } of REVOLUT_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return {
        ...errorDetails,
        technicalDetails: JSON.stringify(error, null, 2)
      };
    }
  }

  return {
    type: 'VALIDATION_FAILED',
    userMessage: 'Unable to verify your Revolut payment',
    suggestedActions: [
      'Ensure the transaction is completed',
      'Check that all transaction details are visible',
      'Try selecting a different transaction'
    ],
    technicalDetails: JSON.stringify(error, null, 2)
  };
}

function parseGenericError(error: ExtensionError, platform: PaymentPlatformType): ProofGenerationError {
  // Check for timeout
  if (error.error?.message?.toLowerCase().includes('timeout')) {
    return {
      type: 'TIMEOUT',
      userMessage: 'Verification took too long',
      suggestedActions: [
        'Try again - the service might be temporarily slow',
        'Check your internet connection',
        'If the problem persists, try a different payment'
      ],
      technicalDetails: JSON.stringify(error, null, 2)
    };
  }

  // Default unknown error
  return {
    type: 'UNKNOWN',
    userMessage: `Unable to verify ${platform} payment`,
    suggestedActions: [
      'Try selecting a different payment',
      'Ensure all payment details are clearly visible',
      'Contact support if the issue persists'
    ],
    technicalDetails: JSON.stringify(error, null, 2)
  };
}

export function parseProofGenerationError(
  extensionError: any,
  platform: PaymentPlatformType,
  paymentMethod: number
): ProofGenerationError {
  // Ensure we have a proper error object
  const error: ExtensionError = extensionError || {};

  // Platform-specific parsing
  switch (platform) {
    case 'wise':
      return parseWiseError(error);
    case 'venmo':
      return parseVenmoError(error);
    case 'revolut':
      return parseRevolutError(error);
    default:
      return parseGenericError(error, platform);
  }
}

// Helper to get a concise error summary for buttons/titles
export function getErrorSummary(error: ProofGenerationError): string {
  switch (error.type) {
    case 'VALIDATION_FAILED':
      if (error.field === 'paymentStatus') return 'Payment Not Ready';
      if (error.field === 'amount') return 'Amount Mismatch';
      if (error.field === 'recipient') return 'Recipient Mismatch';
      if (error.field === 'paymentDate') return 'Date Issue';
      return 'Verification Failed';
    case 'TIMEOUT':
      return 'Verification Timeout';
    case 'EXTENSION_ERROR':
      return 'Extension Error';
    default:
      return 'Verification Failed';
  }
}