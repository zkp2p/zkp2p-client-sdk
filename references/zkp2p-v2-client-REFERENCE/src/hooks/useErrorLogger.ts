import { useRollbar } from '@rollbar/react';
import { useCallback } from 'react';
import { ErrorCategory, createErrorLog, generateCorrelationId } from '@helpers/types/errors';

/**
 * Simple hook for consistent error logging with Rollbar
 */
export function useErrorLogger() {
  const rollbar = useRollbar();
  const isProduction = import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT === 'PRODUCTION';
  
  const logError = useCallback((
    message: string,
    category: ErrorCategory,
    context: Record<string, any> = {},
    correlationId?: string
  ) => {
    // Generate correlation ID first to avoid initialization issues
    const finalCorrelationId = correlationId || generateCorrelationId();
    
    // Create consistent error log format
    const errorLog = createErrorLog(message, category, {
      ...context,
      correlationId: finalCorrelationId,
    });
    
    // Only log to Rollbar in production
    if (isProduction) {
      rollbar.error(errorLog.message, errorLog.context);
    } else {
      // In non-production environments, log to console for debugging
      console.error(`[${errorLog.category}] ${errorLog.message}`, errorLog.context);
    }
  }, [rollbar, isProduction]);
  
  return { logError };
}