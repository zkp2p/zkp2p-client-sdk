# CLAUDE.md - ExtensionProxyProofs Context Documentation

This document provides guidance for working with the ExtensionProxyProofs context in the ZKP2P V2 client. This context manages communication with the browser extension for zero-knowledge proof generation and handles platform-specific metadata and proof verification workflows.

## 🎯 Overview

The ExtensionProxyProofs context serves as the bridge between the web application and the browser extension, facilitating secure communication for ZK proof generation. It manages extension detection, version checking, proof generation workflows, and platform-specific metadata caching.

### Core Responsibilities
- **Extension Communication**: Bidirectional messaging with browser extension
- **Proof Generation**: Coordinate ZK proof creation workflows
- **Version Management**: Track extension version and compatibility
- **Metadata Caching**: Store platform-specific proof metadata
- **Platform Support**: Handle multiple payment platforms

## 🏗️ Architecture

### Context Structure
```typescript
interface ExtensionProxyProofsContextType {
  // Extension Status
  isSidebarInstalled: boolean;
  sideBarVersion: string | null;
  refetchExtensionVersion: () => void;
  
  // Extension Actions
  openNewTab: (actionType: string, platform: string) => void;
  
  // Metadata Management
  platformMetadata: Record<PaymentPlatformType, MetadataInfo>;
  clearPlatformMetadata: (platform: PaymentPlatformType) => void;
  
  // Proof Generation
  paymentProof: ExtensionNotaryProofRequest | null;
  generatePaymentProof: (platform: PaymentPlatformType, intentHash: string, originalIndex: number, proofIndex?: number) => void;
  fetchPaymentProof: () => void;
  resetProofState: () => void;
}
```

### Communication Flow
```
Web App → postMessage → Extension → Background Script → Response → Web App
```

## 🔧 Core Components

### ExtensionProxyProofsProvider (`ExtensionProxyProofsProvider.tsx`)

#### State Management

**Extension Status**
```typescript
const [isSidebarInstalled, setIsSidebarInstalled] = useState<boolean>(false);
const [sideBarVersion, setSideBarVersion] = useState<string | null>(null);
```

**Proof State**
```typescript
const [proofId, setProofId] = useState<string | null>(null);
const [paymentProof, setPaymentProof] = useState<ExtensionNotaryProofRequest | null>(null);
```

**Metadata Storage**
```typescript
const [platformMetadata, setPlatformMetadata] = useState<Record<PaymentPlatformType, MetadataInfo>>({} as Record<PaymentPlatformType, MetadataInfo>);
```

**Polling Management**
```typescript
const intervalRef = useRef<NodeJS.Timeout | null>(null);
```

#### Message Handling System

**Outbound Messages (Web App → Extension)**
```typescript
// Extension version check
const refetchExtensionVersion = () => {
  window.postMessage({ type: ExtensionPostMessage.FETCH_EXTENSION_VERSION }, '*');
};

// Open new tab for proof generation
const openNewTab = (actionType: string, platform: string) => {
  window.postMessage({ type: ExtensionPostMessage.OPEN_NEW_TAB, actionType, platform }, '*');
};

// Generate payment proof
const generatePaymentProof = (platform, intentHash, originalIndex, proofIndex) => {
  window.postMessage({
    type: ExtensionPostMessage.GENERATE_PROOF,
    intentHash,
    originalIndex,
    platform,
    proofIndex,
  }, '*');
};
```

**Inbound Message Router**
```typescript
const handleExtensionMessage = (event: any) => {
  if (event.origin !== window.location.origin) return;

  switch (event.data.type) {
    case ExtensionReceiveMessage.EXTENSION_VERSION_RESPONSE:
      handleExtensionVersionMessageReceived(event);
      break;
    case ExtensionReceiveMessage.METADATA_MESSAGES_RESPONSE:
      handleExtensionMetadataMessagesResponse(event);
      break;
    case ExtensionReceiveMessage.FETCH_PROOF_REQUEST_ID_RESPONSE:
      handleExtensionProofIdMessageReceived(event);
      break;
    case ExtensionReceiveMessage.FETCH_PROOF_BY_ID_RESPONSE:
      handleExtensionProofByIdMessageReceived(event);
      break;
  }
};
```

## 🔄 Core Functionality

### Extension Detection and Version Management

**Automatic Detection**
```typescript
useEffect(() => {
  // Poll for extension every 5 seconds
  intervalRef.current = setInterval(refetchExtensionVersion, 5000);
  refetchExtensionVersion(); // Initial check
  
  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}, []);
```

**Version Handling**
```typescript
const handleExtensionVersionMessageReceived = (event: ExtensionEventVersionMessage) => {
  const version = event.data.version;
  
  setSideBarVersion(version);
  setIsSidebarInstalled(true);
  
  // Stop polling once extension is detected
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
};
```

### Metadata Management

**Platform-Specific Metadata Storage**
```typescript
interface MetadataInfo {
  metadata: any;
  expiresAt: number;
}

const handleExtensionMetadataMessagesResponse = (event: ExtensionRequestMetadataMessage) => {
  const platform = event.data.platform as PaymentPlatformType;
  
  setPlatformMetadata(prev => ({
    ...prev,
    [platform]: {
      metadata: event.data.metadata,
      expiresAt: event.data.expiresAt
    }
  }));
};
```

**Metadata Cleanup**
```typescript
const clearPlatformMetadata = useCallback((platform: PaymentPlatformType) => {
  setPlatformMetadata(prev => {
    const newState = { ...prev };
    if (newState[platform]) {
      delete newState[platform];
    }
    return newState;
  });
}, []);
```

### Proof Generation Workflow

**Initiate Proof Generation**
```typescript
const generatePaymentProof = useCallback((
  platform: PaymentPlatformType,
  intentHash: string,
  originalIndex: number,
  proofIndex?: number,
) => {
  resetProofState(); // Clear previous state
  
  window.postMessage({
    type: ExtensionPostMessage.GENERATE_PROOF,
    intentHash,
    originalIndex,
    platform,
    proofIndex,
  }, '*');
}, []);
```

**Handle Proof ID Response**
```typescript
const handleExtensionProofIdMessageReceived = (event: ExtensionEventMessage) => {
  if (!event.data.proofId) {
    setProofId(null);
    return;
  }
  
  setProofId(event.data.proofId);
};
```

**Fetch Completed Proof**
```typescript
const fetchPaymentProof = useCallback(() => {
  if (proofId) {
    window.postMessage({ type: ExtensionPostMessage.FETCH_PROOF_BY_ID, proofId }, '*');
  }
}, [proofId]);
```

**Handle Proof Data Response**
```typescript
const handleExtensionProofByIdMessageReceived = (event: ExtensionEventMessage) => {
  if (event.data.requestHistory && event.data.requestHistory.notaryRequest) {
    const requestHistory = event.data.requestHistory.notaryRequest;
    setPaymentProof(requestHistory);
  }
};
```

## 🔄 Usage Patterns

### Extension Status Check
```typescript
import useExtensionProxyProofs from '@hooks/contexts/useExtensionProxyProofs';

const ExtensionStatus: React.FC = () => {
  const { isSidebarInstalled, sideBarVersion } = useExtensionProxyProofs();
  
  if (!isSidebarInstalled) {
    return (
      <div>
        <p>Extension not detected</p>
        <button>Install Extension</button>
      </div>
    );
  }
  
  return (
    <div>
      <p>Extension installed: v{sideBarVersion}</p>
    </div>
  );
};
```

### Proof Generation Flow
```typescript
const ProofGenerator: React.FC = () => {
  const { 
    generatePaymentProof, 
    paymentProof, 
    fetchPaymentProof,
    resetProofState 
  } = useExtensionProxyProofs();
  
  const handleGenerateProof = async () => {
    resetProofState(); // Clear previous state
    
    generatePaymentProof(
      PaymentPlatform.VENMO,
      intentHash,
      0, // originalIndex
      1  // proofIndex (optional)
    );
  };
  
  useEffect(() => {
    if (proofId && !paymentProof) {
      // Poll for proof completion
      const interval = setInterval(fetchPaymentProof, 2000);
      return () => clearInterval(interval);
    }
  }, [proofId, paymentProof, fetchPaymentProof]);
  
  return (
    <div>
      <button onClick={handleGenerateProof}>Generate Proof</button>
      {paymentProof && <ProofDisplay proof={paymentProof} />}
    </div>
  );
};
```

### Platform Metadata Usage
```typescript
const MetadataManager: React.FC = () => {
  const { platformMetadata, clearPlatformMetadata } = useExtensionProxyProofs();
  
  const venmoMetadata = platformMetadata[PaymentPlatform.VENMO];
  
  useEffect(() => {
    // Check if metadata is expired
    if (venmoMetadata && Date.now() > venmoMetadata.expiresAt) {
      clearPlatformMetadata(PaymentPlatform.VENMO);
    }
  }, [venmoMetadata, clearPlatformMetadata]);
  
  return (
    <div>
      {venmoMetadata ? (
        <div>Metadata available for Venmo</div>
      ) : (
        <div>No Venmo metadata</div>
      )}
    </div>
  );
};
```

### Extension Tab Management
```typescript
const TabManager: React.FC = () => {
  const { openNewTab } = useExtensionProxyProofs();
  
  const handleOpenProofTab = () => {
    openNewTab('generate_proof', 'venmo');
  };
  
  const handleOpenRegistrationTab = () => {
    openNewTab('register', 'venmo');
  };
  
  return (
    <div>
      <button onClick={handleOpenProofTab}>Open Proof Tab</button>
      <button onClick={handleOpenRegistrationTab}>Open Registration Tab</button>
    </div>
  );
};
```

## 🎯 Message Types

### Outbound Messages (ExtensionPostMessage)
```typescript
enum ExtensionPostMessage {
  FETCH_EXTENSION_VERSION = 'FETCH_EXTENSION_VERSION',
  OPEN_NEW_TAB = 'OPEN_NEW_TAB',
  GENERATE_PROOF = 'GENERATE_PROOF',
  FETCH_PROOF_BY_ID = 'FETCH_PROOF_BY_ID',
}
```

### Inbound Messages (ExtensionReceiveMessage)
```typescript
enum ExtensionReceiveMessage {
  EXTENSION_VERSION_RESPONSE = 'EXTENSION_VERSION_RESPONSE',
  METADATA_MESSAGES_RESPONSE = 'METADATA_MESSAGES_RESPONSE',
  FETCH_PROOF_REQUEST_ID_RESPONSE = 'FETCH_PROOF_REQUEST_ID_RESPONSE',
  FETCH_PROOF_BY_ID_RESPONSE = 'FETCH_PROOF_BY_ID_RESPONSE',
}
```

### Message Payloads
```typescript
// Version response
interface ExtensionEventVersionMessage {
  data: {
    type: ExtensionReceiveMessage.EXTENSION_VERSION_RESPONSE;
    version: string;
  };
}

// Metadata response
interface ExtensionRequestMetadataMessage {
  data: {
    type: ExtensionReceiveMessage.METADATA_MESSAGES_RESPONSE;
    platform: string;
    metadata: any;
    expiresAt: number;
  };
}

// Proof generation request
interface GenerateProofMessage {
  type: ExtensionPostMessage.GENERATE_PROOF;
  intentHash: string;
  originalIndex: number;
  platform: PaymentPlatformType;
  proofIndex?: number;
}
```

## ⚠️ Important Considerations

### Security
- **Origin Validation**: All messages validate origin matches window.location.origin
- **Message Filtering**: Only processes known message types
- **Data Sanitization**: Extension data should be validated before use
- **Cross-Frame Communication**: Messages only accepted from same origin

### Extension Compatibility
- **Version Checking**: Tracks extension version for compatibility
- **Feature Detection**: Graceful degradation for missing features
- **Error Handling**: Robust error handling for extension communication failures
- **Timeout Management**: Proper cleanup of polling intervals

### State Management
- **Proof Lifecycle**: Clear proof state between generations
- **Metadata Expiration**: Handle expired platform metadata
- **Memory Leaks**: Proper cleanup of intervals and event listeners
- **State Synchronization**: Ensure UI reflects extension state

### Performance
- **Polling Optimization**: Stop version polling once extension detected
- **Message Debouncing**: Prevent excessive message sending
- **Metadata Caching**: Efficient platform metadata storage
- **Resource Cleanup**: Proper cleanup on component unmount

## 🔍 Debugging Common Issues

### Extension Not Detected
```typescript
// Check if extension is actually installed
const { isSidebarInstalled, refetchExtensionVersion } = useExtensionProxyProofs();

if (!isSidebarInstalled) {
  // Manually trigger detection
  refetchExtensionVersion();
  
  // Check browser console for extension errors
  console.log('Extension detection failed - check if extension is installed');
}
```

### Message Communication Failures
```typescript
// Debug message handling
const handleExtensionMessage = (event: any) => {
  console.log('Received message:', event.data);
  
  if (event.origin !== window.location.origin) {
    console.warn('Message from different origin:', event.origin);
    return;
  }
  
  // ... handle message
};

// Check if messages are being sent
const generatePaymentProof = (...args) => {
  console.log('Sending GENERATE_PROOF message:', args);
  window.postMessage({...}, '*');
};
```

### Proof Generation Issues
```typescript
// Monitor proof state changes
useEffect(() => {
  console.log('Proof ID changed:', proofId);
}, [proofId]);

useEffect(() => {
  console.log('Payment proof updated:', paymentProof);
}, [paymentProof]);

// Check for stale proof states
const resetProofState = () => {
  console.log('Resetting proof state');
  setProofId(null);
  setPaymentProof(null);
};
```

### Metadata Management
```typescript
// Debug metadata expiration
useEffect(() => {
  Object.entries(platformMetadata).forEach(([platform, metadata]) => {
    if (metadata.expiresAt < Date.now()) {
      console.warn(`Metadata expired for platform: ${platform}`);
    }
  });
}, [platformMetadata]);
```

## 🚀 Advanced Usage

### Custom Proof Polling
```typescript
const useProofPolling = (proofId: string | null) => {
  const { fetchPaymentProof, paymentProof } = useExtensionProxyProofs();
  const [isPolling, setIsPolling] = useState(false);
  
  useEffect(() => {
    if (proofId && !paymentProof) {
      setIsPolling(true);
      const interval = setInterval(() => {
        fetchPaymentProof();
      }, 1000); // Poll every second
      
      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    }
  }, [proofId, paymentProof, fetchPaymentProof]);
  
  return { isPolling };
};
```

### Metadata Validation
```typescript
const useMetadataValidator = () => {
  const { platformMetadata } = useExtensionProxyProofs();
  
  const validateMetadata = (platform: PaymentPlatformType) => {
    const metadata = platformMetadata[platform];
    
    if (!metadata) {
      return { isValid: false, reason: 'No metadata found' };
    }
    
    if (metadata.expiresAt < Date.now()) {
      return { isValid: false, reason: 'Metadata expired' };
    }
    
    return { isValid: true, metadata: metadata.metadata };
  };
  
  return { validateMetadata };
};
```

### Extension Health Monitoring
```typescript
const useExtensionHealth = () => {
  const { isSidebarInstalled, sideBarVersion } = useExtensionProxyProofs();
  const [lastHealthCheck, setLastHealthCheck] = useState(Date.now());
  
  useEffect(() => {
    const healthCheckInterval = setInterval(() => {
      if (isSidebarInstalled) {
        setLastHealthCheck(Date.now());
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(healthCheckInterval);
  }, [isSidebarInstalled]);
  
  const isHealthy = isSidebarInstalled && (Date.now() - lastHealthCheck) < 15000;
  
  return {
    isHealthy,
    version: sideBarVersion,
    lastSeen: lastHealthCheck
  };
};
```

## 📚 Related Documentation

- **Main CLAUDE.md**: Project architecture overview
- **`src/contexts/CLAUDE.md`**: Context system documentation
- **Browser Extension**: Extension-specific documentation
- **`src/helpers/types/browserExtension.ts`**: Type definitions
- **ZK Proof Generation**: Proof generation workflows

## 🎯 Future Enhancements

Planned improvements to the ExtensionProxyProofs system:

- **Multi-Extension Support**: Support for multiple extension providers
- **Enhanced Error Handling**: Better error recovery and user feedback
- **Proof Caching**: Local storage of completed proofs
- **Batch Processing**: Multiple proof generation support
- **Extension Analytics**: Usage and performance monitoring
- **Auto-Update**: Automatic extension version management

The ExtensionProxyProofs context provides the critical bridge between the web application and browser extension, enabling secure and efficient ZK proof generation workflows.