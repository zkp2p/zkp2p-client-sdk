# CLAUDE.md - Backend Context Documentation

This document provides guidance for working with the Backend context in the ZKP2P V2 client. The Backend context manages API integration with the ZKP2P backend services, handling payee details, owner deposits, and backend authentication through Privy tokens.

## 🎯 Overview

The Backend context serves as the primary interface to the ZKP2P backend API, providing authenticated access to user data, deposit management, and payee information. It integrates with Privy authentication to ensure secure API access and manages caching and state for backend-derived data.

### Core Responsibilities
- **Backend Authentication**: Privy token-based API authentication
- **Payee Details**: Fetch and manage payment recipient information
- **Owner Deposits**: Track user's liquidity deposits and orders
- **Platform Integration**: Handle platform-specific payee data formatting
- **State Management**: Cache backend data and manage loading states

## 🏗️ Architecture

### Context Structure
```typescript
interface BackendContextType {
  // Payee details
  rawPayeeDetails: string;
  depositorTgUsername: string;
  fetchPayeeDetails: (hashedOnchainId: string, platform: PaymentPlatformType) => Promise<void>;
  clearPayeeDetails: () => void;
  isFetchingRawPayeeDetails: boolean;
  
  // Owner deposits
  ownerDeposits: any[] | null;
  isLoadingOwnerDeposits: boolean;
  ownerDepositsError: any;
  fetchOwnerDeposits: (address: string) => Promise<void>;
  refetchOwnerDeposits: () => Promise<void>;
}
```

### Data Flow
```
User Authentication → Backend Context → API Hooks → Backend API → State Update
```

## 🔧 Core Components

### BackendProvider (`BackendContextProvider.tsx`)

#### Dependencies and Hooks Integration
```typescript
import usePayeeDetails from '@hooks/backend/useGetPayeeDetails';
import useGetOwnerDeposits from '@hooks/backend/useGetOwnerDeposits';
import useAccount from '@hooks/contexts/useAccount';
import { paymentPlatformInfo } from '@helpers/types/paymentPlatforms';
```

#### State Management

**Payee Details State**
```typescript
const [rawPayeeDetails, setRawPayeeDetails] = useState<string>('');
const [depositorTgUsername, setDepositorTgUsername] = useState<string>('');
const [isFetchingRawPayeeDetails, setIsFetchingRawPayeeDetails] = useState<boolean>(false);
```

**Backend Hook Integration**
```typescript
const { 
  fetchPayeeDetails: fetchPayeeDetailsImpl, 
  data: payeeDetailsResponse
} = usePayeeDetails();

const {
  data: ownerDeposits,
  isLoading: isLoadingOwnerDeposits,
  error: ownerDepositsError,
  fetchOwnerDeposits
} = useGetOwnerDeposits();
```

#### Account Integration
```typescript
const { loggedInEthereumAddress, isLoggedIn } = useAccount();

// Auto-fetch owner deposits when user logs in
useEffect(() => { 
  if (isLoggedIn && loggedInEthereumAddress) {
    fetchOwnerDeposits(loggedInEthereumAddress);
  }
}, [isLoggedIn, loggedInEthereumAddress, fetchOwnerDeposits]);
```

## 🔄 Core Functionality

### Payee Details Management

**Payee Details Processing**
```typescript
useEffect(() => {
  if (payeeDetailsResponse) {
    const platform = payeeDetailsResponse.responseObject.processorName;
    const tgUsername = payeeDetailsResponse.responseObject.depositData.telegramUsername;
    
    // Set Telegram username
    if (tgUsername) {
      setDepositorTgUsername(tgUsername);
    } else {
      setDepositorTgUsername('');
    }
    
    // Format platform-specific payee details
    const depositData = payeeDetailsResponse.responseObject.depositData;
    const rawPayeeDetails = paymentPlatformInfo[platform].depositConfig.getPayeeDetail(depositData);
    
    setRawPayeeDetails(rawPayeeDetails);
    setIsFetchingRawPayeeDetails(false);
  }
}, [payeeDetailsResponse]);
```

**Fetch Payee Details Function**
```typescript
const fetchPayeeDetails = useCallback(async (hashedOnchainId: string, platform: PaymentPlatformType) => {
  setIsFetchingRawPayeeDetails(true);
  await fetchPayeeDetailsImpl(hashedOnchainId, platform);
}, [fetchPayeeDetailsImpl]);
```

**Clear Payee Details**
```typescript
const clearPayeeDetails = useCallback(() => {
  setRawPayeeDetails('');
  setDepositorTgUsername('');
  setIsFetchingRawPayeeDetails(false);
}, []);
```

### Owner Deposits Management

**Auto-Fetch on Login**
```typescript
useEffect(() => { 
  if (isLoggedIn && loggedInEthereumAddress) {
    fetchOwnerDeposits(loggedInEthereumAddress);
  }
}, [isLoggedIn, loggedInEthereumAddress, fetchOwnerDeposits]);
```

**Manual Refetch**
```typescript
const refetchOwnerDeposits = useCallback(async () => {
  if (loggedInEthereumAddress) {
    await fetchOwnerDeposits(loggedInEthereumAddress);
  }
}, [fetchOwnerDeposits, loggedInEthereumAddress]);
```

## 🔄 Usage Patterns

### Payee Information Display
```typescript
import useBackend from '@hooks/contexts/useBackend';

const PayeeInfo: React.FC = () => {
  const { 
    rawPayeeDetails, 
    depositorTgUsername, 
    isFetchingRawPayeeDetails 
  } = useBackend();
  
  if (isFetchingRawPayeeDetails) {
    return <Spinner />;
  }
  
  return (
    <div>
      <p>Payment Details: {rawPayeeDetails}</p>
      {depositorTgUsername && (
        <p>Telegram: @{depositorTgUsername}</p>
      )}
    </div>
  );
};
```

### Fetch Payee Details on Demand
```typescript
const PayeeDetailsLoader: React.FC<{ depositId: string, platform: PaymentPlatformType }> = ({ depositId, platform }) => {
  const { fetchPayeeDetails, clearPayeeDetails } = useBackend();
  
  const loadPayeeDetails = async () => {
    try {
      clearPayeeDetails(); // Clear previous data
      await fetchPayeeDetails(depositId, platform);
    } catch (error) {
      console.error('Failed to fetch payee details:', error);
    }
  };
  
  return (
    <button onClick={loadPayeeDetails}>
      Load Payment Details
    </button>
  );
};
```

### Owner Deposits Management
```typescript
const UserDeposits: React.FC = () => {
  const { 
    ownerDeposits, 
    isLoadingOwnerDeposits, 
    ownerDepositsError,
    refetchOwnerDeposits 
  } = useBackend();
  
  if (isLoadingOwnerDeposits) {
    return <LoadingSpinner />;
  }
  
  if (ownerDepositsError) {
    return (
      <div>
        <p>Error loading deposits: {ownerDepositsError.message}</p>
        <button onClick={refetchOwnerDeposits}>Retry</button>
      </div>
    );
  }
  
  return (
    <div>
      <h3>Your Deposits ({ownerDeposits?.length || 0})</h3>
      <button onClick={refetchOwnerDeposits}>Refresh</button>
      {ownerDeposits?.map(deposit => (
        <DepositCard key={deposit.id} deposit={deposit} />
      ))}
    </div>
  );
};
```

### Platform-Specific Payee Formatting
```typescript
const PlatformPayeeDisplay: React.FC<{ platform: PaymentPlatformType }> = ({ platform }) => {
  const { rawPayeeDetails, fetchPayeeDetails } = useBackend();
  const [depositId, setDepositId] = useState('');
  
  const handleFetch = async () => {
    if (depositId) {
      await fetchPayeeDetails(depositId, platform);
    }
  };
  
  // Different platforms format payee details differently
  const formatPayeeDetails = (details: string, platform: PaymentPlatformType) => {
    switch (platform) {
      case PaymentPlatform.VENMO:
        return `Venmo: ${details}`;
      case PaymentPlatform.REVOLUT:
        return `Revolut: ${details}`;
      default:
        return details;
    }
  };
  
  return (
    <div>
      <input 
        value={depositId}
        onChange={(e) => setDepositId(e.target.value)}
        placeholder="Enter deposit ID"
      />
      <button onClick={handleFetch}>Load Details</button>
      {rawPayeeDetails && (
        <p>{formatPayeeDetails(rawPayeeDetails, platform)}</p>
      )}
    </div>
  );
};
```

## 🎯 Platform Integration

### Payment Platform Info Integration
```typescript
// Platform-specific payee detail extraction
const depositData = payeeDetailsResponse.responseObject.depositData;
const rawPayeeDetails = paymentPlatformInfo[platform].depositConfig.getPayeeDetail(depositData);
```

### Supported Platform Types
- **Venmo**: Venmo ID and username extraction
- **Revolut**: Revolut payment details
- **CashApp**: CashApp handle formatting
- **Wise**: Wise account information
- **Monzo**: Monzo account details
- **Zelle**: Bank-specific Zelle information

### Platform-Specific Data Processing
Each platform has different data structures and formatting requirements handled through the `paymentPlatformInfo` configuration:

```typescript
// Example platform configuration usage
const platformConfig = paymentPlatformInfo[platform];
const payeeDetail = platformConfig.depositConfig.getPayeeDetail(depositData);
```

## ⚠️ Important Considerations

### Authentication Requirements
- **Privy Integration**: All API calls require Privy authentication tokens
- **Token Refresh**: Handles token refresh automatically through hooks
- **Auth State**: Only fetches data when user is logged in
- **Security**: Never stores sensitive API tokens in context state

### Data Lifecycle
- **Auto-Fetch**: Owner deposits fetched automatically on login
- **Manual Fetch**: Payee details fetched on-demand
- **State Cleanup**: Proper cleanup when logging out
- **Error Handling**: Comprehensive error states and recovery

### Performance Considerations
- **Caching**: Backend data cached in context state
- **Selective Updates**: Only refetch when necessary
- **Loading States**: Proper loading indicators for UX
- **Error Recovery**: Retry mechanisms for failed requests

### Platform Compatibility
- **Multi-Platform**: Supports all payment platforms
- **Dynamic Formatting**: Platform-specific payee detail formatting
- **Extensible**: Easy to add new platforms
- **Validation**: Platform data validation and error handling

## 🔍 Debugging Common Issues

### Payee Details Not Loading
```typescript
// Check authentication state
const { isLoggedIn, loggedInEthereumAddress } = useAccount();
console.log('Auth state:', { isLoggedIn, address: loggedInEthereumAddress });

// Check API response
const { fetchPayeeDetails } = useBackend();
await fetchPayeeDetails(hashedId, platform);
// Check network tab for API errors
```

### Owner Deposits Issues
```typescript
// Debug deposits loading
const { ownerDeposits, isLoadingOwnerDeposits, ownerDepositsError } = useBackend();

console.log('Deposits state:', {
  deposits: ownerDeposits,
  loading: isLoadingOwnerDeposits,
  error: ownerDepositsError
});

// Manual refetch
const { refetchOwnerDeposits } = useBackend();
await refetchOwnerDeposits();
```

### Authentication Errors
```typescript
// Check Privy token status
import { usePrivy } from '@privy-io/react-auth';

const { getAccessToken } = usePrivy();
const token = await getAccessToken();
console.log('Access token:', token ? 'Available' : 'Missing');
```

### Platform Data Formatting
```typescript
// Debug platform-specific formatting
import { paymentPlatformInfo } from '@helpers/types/paymentPlatforms';

const platformConfig = paymentPlatformInfo[platform];
console.log('Platform config:', platformConfig);

const payeeDetail = platformConfig.depositConfig.getPayeeDetail(depositData);
console.log('Formatted payee detail:', payeeDetail);
```

## 🚀 Advanced Usage

### Custom Backend Data Hook
```typescript
const useBackendData = (address?: string) => {
  const { ownerDeposits, isLoadingOwnerDeposits, fetchOwnerDeposits } = useBackend();
  const [hasLoaded, setHasLoaded] = useState(false);
  
  useEffect(() => {
    if (address && !hasLoaded) {
      fetchOwnerDeposits(address);
      setHasLoaded(true);
    }
  }, [address, hasLoaded, fetchOwnerDeposits]);
  
  return {
    deposits: ownerDeposits,
    isLoading: isLoadingOwnerDeposits,
    hasData: Boolean(ownerDeposits?.length)
  };
};
```

### Payee Details Cache
```typescript
const usePayeeDetailsCache = () => {
  const { rawPayeeDetails, depositorTgUsername } = useBackend();
  const [cache, setCache] = useState<Record<string, any>>({});
  
  useEffect(() => {
    if (rawPayeeDetails) {
      const cacheKey = `${rawPayeeDetails}-${depositorTgUsername}`;
      setCache(prev => ({
        ...prev,
        [cacheKey]: {
          details: rawPayeeDetails,
          username: depositorTgUsername,
          timestamp: Date.now()
        }
      }));
    }
  }, [rawPayeeDetails, depositorTgUsername]);
  
  return { cache };
};
```

### Error Recovery System
```typescript
const useBackendErrorRecovery = () => {
  const { ownerDepositsError, refetchOwnerDeposits } = useBackend();
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  const handleRetry = useCallback(async () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      await refetchOwnerDeposits();
    }
  }, [retryCount, maxRetries, refetchOwnerDeposits]);
  
  useEffect(() => {
    if (ownerDepositsError && retryCount > 0) {
      const timer = setTimeout(handleRetry, 2000 * retryCount); // Exponential backoff
      return () => clearTimeout(timer);
    }
  }, [ownerDepositsError, retryCount, handleRetry]);
  
  return { 
    canRetry: retryCount < maxRetries,
    retryCount,
    handleRetry 
  };
};
```

## 📚 Related Documentation

- **Main CLAUDE.md**: Project architecture overview
- **`src/contexts/CLAUDE.md`**: Context system documentation
- **`src/hooks/backend/CLAUDE.md`**: Backend API hooks
- **`src/contexts/Account/CLAUDE.md`**: Authentication context
- **Payment Platform Types**: Platform-specific configurations

## 🎯 Future Enhancements

Planned improvements to the Backend context:

- **Real-time Updates**: WebSocket integration for live data
- **Advanced Caching**: More sophisticated caching strategies
- **Batch Operations**: Support for batch API requests
- **Offline Support**: Offline data access and sync
- **Analytics Integration**: User behavior and deposit analytics
- **Enhanced Error Handling**: More granular error states and recovery
- **API Versioning**: Support for multiple API versions

The Backend context provides essential integration with ZKP2P backend services while maintaining clean separation of concerns and optimal user experience.