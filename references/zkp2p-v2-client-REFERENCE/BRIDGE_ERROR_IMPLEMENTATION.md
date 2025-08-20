# Bridge Error Handling Implementation

This document outlines the comprehensive bridge error handling system implemented for zkp2p-v2-client to provide better user experience when bridge operations fail.

## Overview

The implementation enhances the existing bridge error handling with:
1. **Comprehensive error categorization** - Maps bridge errors to user-friendly categories
2. **User-friendly error messages** - Provides clear descriptions and recovery actions
3. **Enhanced error logging** - Improved Rollbar integration with structured data
4. **Visual error display** - Custom component with recovery suggestions

## Files Modified/Created

### Core Error Handling
- **`/src/helpers/bridgeErrors.ts`** - ✅ Already existed with comprehensive error mapping
- **`/src/components/common/BridgeErrorDisplay.tsx`** - ✅ New component for displaying errors with recovery actions

### Bridge Hook Updates
- **`/src/hooks/useRelayBridge.ts`** - ✅ Enhanced with error categorization and logging
- **`/src/hooks/useSocketBridge.ts`** - ✅ Enhanced with error categorization and logging

### UI Component Updates
- **`/src/components/Swap/CompleteOrder/index.tsx`** - ✅ Integrated bridge error handling
- **`/src/components/Swap/CompleteOrder/ExtensionProofForm.tsx`** - ✅ Pass bridge error details
- **`/src/components/Swap/CompleteOrder/ProvePayment/ProvePayment.tsx`** - ✅ Display enhanced errors

## Error Categories Implemented

### Bridge Error Types
```typescript
enum BridgeErrorType {
  INSUFFICIENT_GAS = 'INSUFFICIENT_GAS',
  NO_LIQUIDITY = 'NO_LIQUIDITY', 
  BRIDGE_TIMEOUT = 'BRIDGE_TIMEOUT',
  API_ERROR = 'API_ERROR',
  NETWORK_CONGESTION = 'NETWORK_CONGESTION',
  INVALID_ROUTE = 'INVALID_ROUTE',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',
  WALLET_ERROR = 'WALLET_ERROR',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  UNSUPPORTED_TOKEN = 'UNSUPPORTED_TOKEN',
  RATE_LIMITED = 'RATE_LIMITED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```

### Error Message Structure
Each error type includes:
- **Title**: Short, descriptive error name
- **Description**: Detailed explanation of what went wrong
- **Recovery Actions**: Step-by-step instructions to resolve
- **Severity**: Low/Medium/High for UI styling
- **Category**: For error logging taxonomy
- **Retry Configuration**: Whether retryable and estimated delay

## Key Features

### 1. Intelligent Error Categorization
```typescript
const bridgeErrorMessage = getBridgeErrorMessage(error, {
  bridgeProvider: 'relay',
  retryCount: executionRetryCount,
  transactionType: 'execute',
  tokenSymbol: tokenInfo[storedQuoteData.token]?.ticker,
  networkName: tokenInfo[storedQuoteData.token]?.chainName,
});
```

### 2. Enhanced Error Logging
```typescript
logError(
  'Relay bridge execution failed',
  ErrorCategory.BRIDGE_ERROR,
  {
    bridgeErrorType: categorizeBridgeError(error),
    bridgeErrorSeverity: bridgeErrorMessage.severity,
    bridgeErrorCategory: bridgeErrorMessage.category,
    bridgeErrorRecoveryActions: bridgeErrorMessage.recoveryActions,
    isRetryable: bridgeErrorMessage.isRetryable,
    // ... additional context
  }
);
```

### 3. Visual Error Display Component
```typescript
<BridgeErrorDisplay
  errorDetails={bridgeErrorDetails}
  retryCount={Math.max(bridgeRetryCount, quoteRetryCount, executionRetryCount)}
  maxRetries={maxRetries}
  onManualRetry={handleManualRetryBridgeQuote}
  isRetrying={status === ProofGenerationStatus.SWAP_QUOTE_REQUESTING}
/>
```

## Error Flow

### 1. Error Detection
- Bridge operations catch errors in try/catch blocks
- Errors occur in quote fetching, transaction execution, or status checking

### 2. Error Categorization
- `categorizeBridgeError()` analyzes error message/code using regex patterns
- Returns specific `BridgeErrorType` based on confidence scoring

### 3. Message Generation
- `getBridgeErrorMessage()` creates user-friendly error with recovery actions
- Customizes message based on context (retry count, token symbol, etc.)

### 4. State Management
- Error details stored in component state as `bridgeErrorDetails`
- Includes error type, message, recovery actions, and retry configuration

### 5. UI Display
- `BridgeErrorDisplay` component shows error with:
  - Severity-based color coding
  - Clear error title and description
  - Bullet-point recovery actions
  - Retry button (if applicable)
  - Retry status/progress

### 6. Enhanced Logging
- Structured error logs sent to Rollbar with:
  - Error categorization
  - Bridge provider context
  - Retry attempt details
  - Transaction parameters
  - Recovery recommendations

## Error Message Examples

### Insufficient Liquidity Error
- **Title**: "Insufficient Liquidity"
- **Description**: "Not enough liquidity available for this token pair and amount."
- **Recovery Actions**:
  - Try a smaller amount (reduce by 20-50%)
  - Wait 10-30 minutes for liquidity to replenish
  - Consider using a different destination token
  - Check if the token is supported on the destination chain

### Network Congestion Error
- **Title**: "Network Congestion Detected"
- **Description**: "High network traffic is causing delays and higher fees."
- **Recovery Actions**:
  - Transaction will retry automatically with adjusted gas
  - Consider waiting 10-20 minutes for congestion to clear
  - Monitor network status for optimal timing
  - Higher fees may apply during congestion

## Integration Points

### Bridge Hooks
- Both Relay and Socket bridge hooks now use enhanced error handling
- Automatic error categorization and structured logging
- Context-aware error messages

### Complete Order Flow
- Main CompleteOrder component sets `bridgeErrorDetails` state
- Error details passed through component hierarchy
- Replaces generic error messages with specific bridge errors

### UI Components
- `BridgeErrorDisplay` component provides rich error visualization
- Fallback to generic error message for non-bridge errors
- Severity-based styling (red for critical, yellow for warnings, blue for info)

## Benefits

### For Users
- **Clear error explanations** - Users understand what went wrong
- **Actionable recovery steps** - Specific instructions to resolve issues
- **Automated retry handling** - System attempts recovery automatically
- **Visual error indicators** - Color-coded severity and clear messaging

### For Developers
- **Structured error logs** - Better debugging with categorized errors
- **Enhanced monitoring** - Track specific error patterns in Rollbar
- **Comprehensive context** - Full transaction details in error logs
- **Pattern recognition** - Identify common failure modes

### For Support
- **Better error classification** - Quickly identify error types
- **Recovery guidance** - Standard troubleshooting steps
- **Correlation tracking** - Link related errors across sessions
- **Performance insights** - Understanding of bridge reliability

## Testing

The implementation has been validated through:
- ✅ TypeScript compilation passes
- ✅ Application builds successfully
- ✅ All error types have corresponding messages
- ✅ Error categorization patterns cover common failure modes
- ✅ Component hierarchy correctly passes error details

## Future Enhancements

Potential improvements:
1. **Error Analytics Dashboard** - Track error patterns over time
2. **Smart Retry Logic** - Adjust retry delays based on error type
3. **User Notifications** - Proactive alerts for network issues
4. **Error Prediction** - Warn users about likely failures before attempting
5. **Bridge Selection** - Automatically try alternative bridges on failures

## Conclusion

This comprehensive bridge error handling implementation significantly improves user experience by:
- Providing clear, actionable error messages instead of technical failures
- Enabling better monitoring and debugging through structured logging
- Offering visual feedback with recovery suggestions
- Maintaining system reliability through intelligent retry mechanisms

The system is designed to be extensible, allowing for easy addition of new error types and bridge providers as the platform grows.