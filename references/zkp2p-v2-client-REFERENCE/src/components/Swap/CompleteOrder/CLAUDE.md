# Proof Generation Flow - Component Context

## Purpose
This document provides comprehensive guidance for working with the proof generation flow components in the ZKP2P V2 client. These components manage the complex process of generating zero-knowledge proofs for payment verification, including browser extension integration, payment selection, proof generation, and transaction completion.

## Current Status: Active
The proof generation architecture is mature and handles the most critical part of the ZKP2P platform - verifying off-chain payments through zero-knowledge proofs. The flow supports multiple payment platforms (Venmo, Revolut, CashApp, etc.) with multi-proof generation capabilities.

## Component-Specific Development Guidelines

### Core Technologies
- **Browser Extension Integration**: Communication with ZKP2P extension for TLS proof generation
- **Zero-Knowledge Proofs**: snarkjs integration for proof verification
- **Reclaim Protocol**: Alternative proof generation method
- **Payment Platform APIs**: Integration with various payment processors
- **Error Handling**: Structured error parsing and user feedback
- **State Management**: Complex multi-step workflow state coordination

### Component Organization
```
CompleteOrder/
├── index.tsx                    # Main orchestration component
├── ExtensionProofForm.tsx       # Primary proof generation coordinator
├── ConsentInstructions/         # User consent and preparation
│   ├── ConsentInstructionRow.tsx
│   ├── ConsentInstructions.tsx
│   └── index.tsx
├── Extension/                   # Extension management
│   ├── InstallExtension.tsx     # Extension installation flow
│   ├── InstructionsRow.tsx      # Step-by-step instructions
│   ├── UpdateInstructions.tsx   # Extension update prompts
│   └── index.tsx
├── PaymentTable/                # Payment selection interface
│   ├── PaymentRow.tsx           # Individual payment display
│   ├── PaymentTable.tsx         # Payment selection grid
│   └── index.tsx
├── ProvePayment/                # Proof generation UI
│   ├── ProvePayment.tsx         # Main proof generation modal
│   ├── SwapDetails.tsx          # Transaction details display
│   ├── VerificationStepRow.tsx  # Progress step indicator
│   └── index.tsx
└── ProofDetails.tsx             # Technical proof information
```

## Major Subsystem Organization

### Extension Integration Layer
**Purpose**: Manage browser extension lifecycle and communication

- **ExtensionProofForm**: Primary coordinator for extension-based proof generation
- **InstallExtension**: Guide users through extension installation
- **UpdateInstructions**: Handle extension updates and compatibility
- **Extension communication**: window.zktls API integration

### Payment Selection Layer  
**Purpose**: Allow users to select and verify specific payments

- **PaymentTable**: Display available payments from platform
- **PaymentRow**: Individual payment item with selection capabilities
- **Auto-selection logic**: Intelligent payment matching based on amount/timing
- **Payment validation**: Ensure selected payment matches intent parameters

### Proof Generation Layer
**Purpose**: Coordinate zero-knowledge proof creation and verification

- **ProvePayment**: Main proof generation interface with progress tracking
- **Multi-proof support**: Handle platforms requiring multiple proofs
- **Progress tracking**: Visual feedback for proof generation stages
- **Error handling**: Parse and display proof generation errors
- **Timeout management**: Handle proof generation timeouts gracefully

### Consent and Instructions Layer
**Purpose**: Ensure users understand the proof generation process

- **ConsentInstructions**: Platform-specific preparation steps
- **User education**: Clear instructions for payment platform interaction
- **Security warnings**: Important security considerations
- **Compliance**: Ensure users consent to data processing

## Architectural Patterns

### Proof Generation State Machine
```typescript
export enum ProofGenerationStatus {
  NOT_STARTED = 'not-started',
  REQUESTING_PROOF = 'requesting-proof',
  REQUESTING_PROOF_SUCCESS = 'requesting-proof-success', 
  GENERATING_PROOF = 'generating-proof',
  PROOF_GENERATED = 'proof-generated',
  ERROR_FAILED_TO_PROVE = 'error-failed-to-prove',
  TRANSACTION_CONFIRMED = 'transaction-confirmed',
}

// State transitions managed in ExtensionProofForm
const handleProofGeneration = useCallback(async () => {
  setProofGenerationStatus(ProofGenerationStatus.REQUESTING_PROOF);
  
  try {
    // Simulate request processing
    await new Promise(resolve => setTimeout(resolve, 500));
    setProofGenerationStatus(ProofGenerationStatus.REQUESTING_PROOF_SUCCESS);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    setProofGenerationStatus(ProofGenerationStatus.GENERATING_PROOF);
    
    // Start actual proof generation
    generatePaymentProof(paymentPlatform, intentHashDecimals, payment.originalIndex);
    
  } catch (error) {
    setProofGenerationStatus(ProofGenerationStatus.ERROR_FAILED_TO_PROVE);
  }
}, [paymentPlatform, generatePaymentProof]);
```

### Extension Communication Pattern
```typescript
// Integration with browser extension via window.zktls API
const {
  paymentProof: extensionPaymentProof,
  fetchPaymentProof,
  generatePaymentProof,
  resetProofState
} = useExtensionProxyProofs();

// Polling mechanism for proof completion
useEffect(() => {
  if (triggerProofFetchPolling && paymentPlatform) {
    const id = setInterval(() => {
      fetchPaymentProof(paymentPlatform);
    }, PROOF_FETCH_INTERVAL);
    
    setIntervalId(id);
    
    // Timeout handling
    const timeoutId = setTimeout(() => {
      if (intervalId) clearInterval(intervalId);
      setTriggerProofFetchPolling(false);
      setProofGenerationStatus(ProofGenerationStatus.ERROR_FAILED_TO_PROVE);
    }, PROOF_GENERATION_TIMEOUT);
    
    return () => {
      clearInterval(id);
      clearTimeout(timeoutId);
    };
  }
}, [paymentPlatform, fetchPaymentProof, triggerProofFetchPolling]);
```

### Multi-Proof Generation Pattern
```typescript
// Handle platforms requiring multiple proofs (e.g., Venmo requires 2 proofs)
useEffect(() => {
  if (extensionPaymentProof?.status === 'success') {
    const parsedProof = parseExtensionProof(extensionPaymentProof.proof);
    
    // Store proof in array
    setPaymentProofs(prev => {
      const newProofs = prev ? [...prev] : [];
      newProofs[currentProofIndex] = parsedProof;
      return newProofs;
    });

    // Check if more proofs needed
    const requiredProofs = paymentPlatformInfo[paymentPlatform]
      .paymentMethods[paymentMethod].verifyConfig.totalProofs;
    
    if (currentProofIndex < requiredProofs - 1) {
      // Generate next proof
      generatePaymentProof(
        paymentPlatform, 
        intentHashDecimals, 
        selectedPayment?.originalIndex || 0, 
        currentProofIndex + 1
      );
      
      setCurrentProofIndex(prev => prev + 1);
    } else {
      // All proofs generated
      resetProofState();
      setCurrentProofIndex(0);
    }
  }
}, [extensionPaymentProof, currentProofIndex]);
```

### Error Handling Pattern
```typescript
// Structured error parsing for user-friendly messages
import { parseProofGenerationError } from '@helpers/proofErrorParser';

const handleProofError = useCallback((errorData: any) => {
  const parsedError = parseProofGenerationError(
    errorData,
    paymentPlatform,
    paymentMethod
  );
  
  setStructuredProofError(parsedError);
  setProofError(safeStringify(errorData)); // Backwards compatibility
  
  // Log with sanitized data
  logError(
    'Extension proof generation failed',
    ErrorCategory.PROOF_ERROR,
    {
      errorType: parsedError.type,
      errorField: parsedError.field,
      paymentPlatform,
      paymentMethod,
      intentHash,
      currentProofIndex,
      // NO PII - sanitized logging only
      hasSelectedPayment: !!selectedPayment,
      paymentAmount: selectedPayment?.amount,
    }
  );
}, [paymentPlatform, paymentMethod, logError]);
```

### Payment Selection Pattern
```typescript
interface ExtensionRequestMetadata {
  amount: string;
  timestamp: string;
  recipientId: string;
  originalIndex: number;
  date?: string;
  // Platform-specific fields vary
}

const PaymentTable: React.FC = ({ 
  paymentPlatform,
  paymentMethod,
  handleVerifyPaymentWithMetadata,
  autoVerificationAttempted,
  setAutoVerificationAttempted
}) => {
  // Auto-select best matching payment on first load
  useEffect(() => {
    if (!autoVerificationAttempted && payments.length > 0) {
      const bestMatch = findBestPaymentMatch(payments, expectedAmount);
      if (bestMatch) {
        handleVerifyPaymentWithMetadata(bestMatch);
      }
      setAutoVerificationAttempted(true);
    }
  }, [payments, autoVerificationAttempted]);
  
  return (
    <PaymentGrid>
      {payments.map((payment, index) => (
        <PaymentRow
          key={index}
          payment={payment}
          isSelected={selectedPayment?.originalIndex === payment.originalIndex}
          onClick={() => handleVerifyPaymentWithMetadata(payment)}
          platform={paymentPlatform}
        />
      ))}
    </PaymentGrid>
  );
};
```

### Progress Tracking Pattern
```typescript
// Visual progress indication for multi-step proof generation
const ProvePayment: React.FC = ({
  status,
  proof,
  structuredError,
  currentProofIndex,
  totalProofsRequired
}) => {
  const getProgressMessage = () => {
    switch (status) {
      case ProofGenerationStatus.REQUESTING_PROOF:
        return "Requesting proof from extension...";
      case ProofGenerationStatus.GENERATING_PROOF:
        return totalProofsRequired > 1 
          ? `Generating proof ${currentProofIndex + 1} of ${totalProofsRequired}...`
          : "Generating zero-knowledge proof...";
      case ProofGenerationStatus.PROOF_GENERATED:
        return "Proof generated successfully!";
      case ProofGenerationStatus.ERROR_FAILED_TO_PROVE:
        return structuredError 
          ? `Error: ${structuredError.userMessage}`
          : "Proof generation failed";
      default:
        return "Preparing proof generation...";
    }
  };
  
  const getProgressPercentage = () => {
    if (totalProofsRequired > 1) {
      return Math.round(((currentProofIndex + 1) / totalProofsRequired) * 100);
    }
    
    switch (status) {
      case ProofGenerationStatus.REQUESTING_PROOF: return 25;
      case ProofGenerationStatus.GENERATING_PROOF: return 75;
      case ProofGenerationStatus.PROOF_GENERATED: return 100;
      default: return 0;
    }
  };
};
```

## Integration Points

### Extension Proxy Proofs Context
```typescript
// Primary interface to browser extension
const {
  paymentProof,           // Current proof generation result
  fetchPaymentProof,      // Poll for proof completion
  generatePaymentProof,   // Start proof generation
  resetProofState,        // Clear proof state
  extensionVersion,       // Extension version info
  isExtensionInstalled    // Installation status
} = useExtensionProxyProofs();

// Extension communication via window.zktls API
if (window.zktls) {
  window.zktls.generateProof({
    platform: paymentPlatform,
    intentHash: intentHashDecimals,
    paymentIndex: selectedPayment.originalIndex,
    proofIndex: currentProofIndex
  });
}
```

### Smart Contract Integration
```typescript
// Transaction execution after proof generation
const { writeAsync: completeOrder } = useReleaseFundsToPayer(
  onTransactionSuccess,
  onTransactionError
);

const handleCompleteOrder = async () => {
  if (!paymentProofs || paymentProofs.length === 0) {
    throw new Error('No proofs available');
  }
  
  try {
    await completeOrder({
      intentHash,
      proofs: paymentProofs,
      // Additional parameters
    });
  } catch (error) {
    setSimulationErrorMessage(error.message);
  }
};
```

### Bridge Integration for Cross-Chain
```typescript
// Handle cross-chain transactions after proof generation
interface ProofFormProps {
  bridgingNeeded: boolean;
  quoteData: ParsedQuoteData | null;
  bridgeTransactions: {
    txHash: string;
    chainId: number;
  }[] | null;
  handleSubmitSwapClick: () => void;
  handleManualRetryBridgeQuote: () => void;
  bridgeErrorDetails?: BridgeErrorDetails | null;
}

const ProvePayment: React.FC<ProofFormProps> = ({
  bridgingNeeded,
  quoteData,
  handleSubmitSwapClick
}) => {
  const showBridgeFlow = bridgingNeeded && 
    status === ProofGenerationStatus.PROOF_GENERATED;
    
  return (
    <Container>
      {showBridgeFlow ? (
        <BridgeFlowComponent
          quoteData={quoteData}
          onSubmit={handleSubmitSwapClick}
        />
      ) : (
        <StandardProofFlow />
      )}
    </Container>
  );
};
```

### Error Logging Integration
```typescript
// Comprehensive error logging for proof failures
import { ErrorCategory } from '@helpers/types/errors';
import { useErrorLogger } from '@hooks/useErrorLogger';

const logProofError = (error: ProofGenerationError) => {
  logError(
    'Proof generation failed',
    ErrorCategory.PROOF_ERROR,
    {
      // Technical details
      errorType: error.type,
      errorField: error.field,
      paymentPlatform,
      paymentMethod,
      proofIndex: currentProofIndex,
      totalProofsRequired,
      
      // Context (no PII)
      hasExtension: isExtensionInstalled,
      extensionVersion,
      intentHash: intentHash.slice(0, 10) + '...', // Truncated
      
      // User action context
      userFlow: 'extension_proof',
      attemptNumber: retryCount,
      
      // DO NOT LOG: payment details, amounts, recipient info
    }
  );
};
```

## Development Patterns

### Conditional Rendering Based on Status
```typescript
const ConditionalProofFlow = () => {
  if (!isExtensionInstalled) {
    return <InstallExtension />;
  }
  
  if (extensionVersion && needsUpdate(extensionVersion)) {
    return <UpdateInstructions />;
  }
  
  if (!selectedPayment) {
    return (
      <PaymentTable
        onPaymentSelect={handlePaymentSelect}
        autoVerificationAttempted={autoVerificationAttempted}
      />
    );
  }
  
  return (
    <ProvePayment
      status={proofGenerationStatus}
      onRetry={handleRetryProofGen}
    />
  );
};
```

### Cleanup and Memory Management
```typescript
// Proper cleanup of intervals and timeouts
useEffect(() => {
  return () => {
    // Clear proof generation interval
    if (intervalId) {
      clearInterval(intervalId);
    }
    
    // Reset proof state
    resetProofState();
    
    // Clear any error messages
    setSimulationErrorMessage(null);
    setProofError(null);
    setStructuredProofError(null);
  };
}, [intervalId, resetProofState]);

// Cleanup on component unmount or navigation
const handleModalBackClicked = () => {
  if (intervalId) clearInterval(intervalId);
  setSimulationErrorMessage(null);
  setShouldShowVerificationModal(false);
};
```

### Retry Logic Pattern
```typescript
const handleRetryProofGen = useCallback(() => {
  // Clear previous error state
  setProofError(null);
  setStructuredProofError(null);
  setSimulationErrorMessage(null);
  
  // Reset proof generation state
  setProofGenerationStatus(ProofGenerationStatus.NOT_STARTED);
  setCurrentProofIndex(0);
  setPaymentProofs(null);
  
  // Clear any active intervals
  if (intervalId) clearInterval(intervalId);
  
  // Restart proof generation with selected payment
  if (selectedPayment) {
    handleVerifyPaymentWithMetadata(selectedPayment);
  }
}, [selectedPayment, handleVerifyPaymentWithMetadata, intervalId]);
```

### Platform-Specific Configuration
```typescript
// Platform-specific proof generation settings
const getPlatformConfig = (platform: PaymentPlatformType, method: number) => {
  const platformInfo = paymentPlatformInfo[platform];
  const methodConfig = platformInfo.paymentMethods[method];
  
  return {
    totalProofs: methodConfig.verifyConfig.totalProofs,
    getSubjectText: methodConfig.verifyConfig.getSubjectText,
    timeout: methodConfig.proofTimeout || PROOF_GENERATION_TIMEOUT,
    instructions: methodConfig.instructions,
    consentRequired: methodConfig.requiresConsent,
  };
};

// Use configuration in proof generation
const config = getPlatformConfig(paymentPlatform, paymentMethod);
const requiredProofs = config.totalProofs;
const paymentSubject = config.getSubjectText(selectedPayment);
```

## Common Usage Patterns

### Basic Proof Generation Flow
```typescript
const BasicProofFlow = () => {
  const [proofGenerationStatus, setProofGenerationStatus] = useState(
    ProofGenerationStatus.NOT_STARTED
  );
  const [paymentProofs, setPaymentProofs] = useState<Proof[] | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<ExtensionRequestMetadata | null>(null);

  return (
    <ExtensionProofForm
      intentHash={intentHash}
      paymentPlatform={PaymentPlatform.VENMO}
      paymentMethod={0}
      paymentProofs={paymentProofs}
      setPaymentProofs={setPaymentProofs}
      proofGenerationStatus={proofGenerationStatus}
      setProofGenerationStatus={setProofGenerationStatus}
      handleCompleteOrderClick={handleCompleteOrder}
      onProofGenCompletion={onProofComplete}
      handleSubmitSwapClick={handleSubmitSwap}
      completeOrderTransactionSigningStatus={signingStatus}
      completeOrderTransactionMiningStatus={miningStatus}
      completeOrderTransactionHash={txHash}
      // ... other props
    />
  );
};
```

### Multi-Platform Support
```typescript
const MultiPlatformProofFlow = () => {
  const supportedPlatforms = [
    PaymentPlatform.VENMO,
    PaymentPlatform.REVOLUT,
    PaymentPlatform.CASHAPP,
    PaymentPlatform.WISE,
  ];
  
  return (
    <div>
      {supportedPlatforms.map(platform => (
        <PlatformProofFlow
          key={platform}
          platform={platform}
          onProofComplete={(proofs) => handleProofComplete(platform, proofs)}
        />
      ))}
    </div>
  );
};
```

## Common Pitfalls & Solutions

### Pitfall: Memory Leaks from Intervals
```typescript
// ❌ Avoid - Intervals not properly cleared
useEffect(() => {
  if (shouldPoll) {
    setInterval(() => fetchProof(), 1000);
  }
}, [shouldPoll]);

// ✅ Prefer - Proper cleanup
useEffect(() => {
  if (!shouldPoll) return;
  
  const id = setInterval(() => fetchProof(), 1000);
  
  return () => clearInterval(id);
}, [shouldPoll, fetchProof]);
```

### Pitfall: State Updates After Unmount
```typescript
// ❌ Avoid - Can cause React warnings
const generateProof = async () => {
  const result = await extensionAPI.generateProof();
  setProofResult(result); // Component might be unmounted
};

// ✅ Prefer - Check if component is still mounted
const generateProof = async () => {
  const result = await extensionAPI.generateProof();
  
  if (componentIsMounted.current) {
    setProofResult(result);
  }
};
```

### Pitfall: Unhandled Extension Errors
```typescript
// ❌ Avoid - Generic error handling
try {
  await generatePaymentProof(params);
} catch (error) {
  setError('Proof generation failed');
}

// ✅ Prefer - Structured error handling
try {
  await generatePaymentProof(params);
} catch (error) {
  const parsedError = parseProofGenerationError(error, platform, method);
  setStructuredProofError(parsedError);
  
  // Provide specific user guidance
  if (parsedError.type === 'EXTENSION_NOT_FOUND') {
    showExtensionInstallModal();
  } else if (parsedError.type === 'PAYMENT_NOT_FOUND') {
    showPaymentSelectionModal();
  }
}
```

### Pitfall: Race Conditions in Multi-Proof Generation
```typescript
// ❌ Avoid - Concurrent proof generation
const generateAllProofs = async () => {
  const proofPromises = Array.from({ length: totalProofs }, (_, i) => 
    generateProof(i)
  );
  await Promise.all(proofPromises); // Can cause conflicts
};

// ✅ Prefer - Sequential generation
const generateAllProofs = async () => {
  for (let i = 0; i < totalProofs; i++) {
    await generateProof(i);
    // Wait for completion before starting next
    await waitForProofCompletion(i);
  }
};
```

## Testing Approach

### Component Testing
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ExtensionProofForm } from '../ExtensionProofForm';

// Mock extension context
vi.mock('@hooks/contexts/useExtensionProxyProofs', () => ({
  default: () => ({
    paymentProof: null,
    fetchPaymentProof: vi.fn(),
    generatePaymentProof: vi.fn(),
    resetProofState: vi.fn(),
  }),
}));

describe('ExtensionProofForm', () => {
  const defaultProps = {
    intentHash: '0x123',
    paymentPlatform: 'VENMO' as const,
    paymentMethod: 0,
    paymentProofs: null,
    setPaymentProofs: vi.fn(),
    proofGenerationStatus: 'not-started' as const,
    setProofGenerationStatus: vi.fn(),
    // ... other required props
  };

  it('should render payment table initially', () => {
    render(<ExtensionProofForm {...defaultProps} />);
    
    expect(screen.getByText('Select Payment')).toBeInTheDocument();
  });

  it('should start proof generation on payment selection', async () => {
    const mockGenerateProof = vi.fn();
    vi.mocked(useExtensionProxyProofs).mockReturnValue({
      generatePaymentProof: mockGenerateProof,
      // ... other mocked returns
    });

    render(<ExtensionProofForm {...defaultProps} />);
    
    const paymentRow = screen.getByTestId('payment-row-0');
    fireEvent.click(paymentRow);

    await waitFor(() => {
      expect(mockGenerateProof).toHaveBeenCalledWith(
        'VENMO',
        expect.any(String),
        0
      );
    });
  });

  it('should handle proof generation errors', async () => {
    const mockSetStatus = vi.fn();
    
    render(
      <ExtensionProofForm 
        {...defaultProps} 
        setProofGenerationStatus={mockSetStatus}
      />
    );
    
    // Simulate error from extension
    act(() => {
      vi.mocked(useExtensionProxyProofs).mockReturnValue({
        paymentProof: {
          status: 'error',
          error: 'Extension communication failed'
        },
        // ... other mocked returns
      });
    });

    await waitFor(() => {
      expect(mockSetStatus).toHaveBeenCalledWith('error-failed-to-prove');
    });
  });
});
```

### Integration Testing
```typescript
// Test full proof generation flow with mocked extension
describe('Proof Generation Integration', () => {
  it('should complete full proof flow', async () => {
    const mockExtension = {
      generateProof: vi.fn().mockResolvedValue({
        status: 'success',
        proof: mockProofData
      })
    };
    
    // Mock window.zktls API
    Object.defineProperty(window, 'zktls', {
      value: mockExtension,
      writable: true
    });

    render(<CompleteOrderFlow />);
    
    // Select payment
    fireEvent.click(screen.getByTestId('payment-row-0'));
    
    // Wait for proof generation
    await waitFor(() => {
      expect(screen.getByText('Proof generated successfully')).toBeInTheDocument();
    });
    
    // Complete order
    fireEvent.click(screen.getByText('Complete Order'));
    
    await waitFor(() => {
      expect(screen.getByText('Transaction completed')).toBeInTheDocument();
    });
  });
});
```

## Migration Guide

### Adding New Payment Platform
1. Define platform configuration in `paymentPlatformInfo`
2. Add platform-specific proof parsing logic
3. Create platform-specific instruction components
4. Add error handling for platform-specific errors
5. Update payment selection logic
6. Add tests for new platform
7. Update documentation

### Updating Extension Integration
1. Check extension version compatibility
2. Update `window.zktls` API usage if changed
3. Test with new extension version
4. Add migration logic for breaking changes
5. Update error messages and user guidance

## Best Practices Checklist

- [ ] Proper interval and timeout cleanup
- [ ] Structured error handling with user-friendly messages  
- [ ] Progress indication for multi-step operations
- [ ] Extension version compatibility checking
- [ ] Memory leak prevention in async operations
- [ ] Comprehensive error logging (sanitized)
- [ ] Platform-specific configuration management
- [ ] Retry mechanisms with backoff
- [ ] User consent and instruction clarity
- [ ] Cross-chain bridge integration support

Remember: This is the core of the ZKP2P platform - zero-knowledge proof generation for payment verification. Security, reliability, and user experience are paramount. Always test thoroughly across different payment platforms and extension versions.