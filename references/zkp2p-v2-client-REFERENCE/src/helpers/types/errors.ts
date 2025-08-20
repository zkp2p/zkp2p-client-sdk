// Standardized error taxonomy for Rollbar logging

export enum ErrorCategory {
  API_ERROR = 'API_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  SIMULATION_ERROR = 'SIMULATION_ERROR',
  BRIDGE_ERROR = 'BRIDGE_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  PROOF_ERROR = 'PROOF_ERROR',
  SMART_ACCOUNT_ERROR = 'SMART_ACCOUNT_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

export interface ErrorContext {
  category: ErrorCategory;
  userJourney?: {
    currentStep: string;
    previousSteps: string[];
    timeElapsed: number;
    retryCount: number;
  };
  sessionId?: string;
  correlationId?: string;
  smartAccountState?: {
    isEnabled: boolean;
    isAuthorized: boolean;
    gasSaved?: string;
  };
}

export interface RollbarErrorLog {
  message: string;
  category: ErrorCategory;
  context: ErrorContext & Record<string, any>;
}

// Helper to generate correlation IDs
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Helper to create consistent error logs
export function createErrorLog(
  message: string,
  category: ErrorCategory,
  additionalContext: Record<string, any> = {}
): RollbarErrorLog {
  return {
    message,
    category,
    context: {
      category,
      timestamp: new Date().toISOString(),
      ...additionalContext,
    },
  };
}

// Enhanced error log with journey context
export function createEnhancedErrorLog(
  message: string,
  category: ErrorCategory,
  journeyContext: {
    currentStep: string;
    previousSteps: string[];
    timeElapsed: number;
    sessionDuration: number;
  },
  correlationIds: {
    sessionId: string;
    operationId: string;
  },
  additionalContext: Record<string, any> = {}
): RollbarErrorLog {
  return {
    message,
    category,
    context: {
      category,
      timestamp: new Date().toISOString(),
      userJourney: {
        currentStep: journeyContext.currentStep,
        previousSteps: journeyContext.previousSteps,
        timeElapsed: journeyContext.timeElapsed,
        retryCount: additionalContext.retryCount || 0,
      },
      sessionId: correlationIds.sessionId,
      correlationId: correlationIds.operationId,
      ...additionalContext,
    },
  };
}