# Account Context - Development Context

## Overview
The Account Context manages user authentication and wallet state through Privy.io. It provides a unified interface for both social logins (email, Google, Twitter) and Web3 wallet connections, with special handling for Privy's embedded wallets and external wallet integrations.

## Key Files and Structure
```
src/contexts/Account/
├── AccountContext.tsx      # Main context provider
├── AccountProvider.tsx     # Provider component with business logic
└── types.ts               # TypeScript interfaces and enums
```

## Architecture Patterns

### Context State Structure
```typescript
interface AccountContextType {
  // Authentication state
  authenticatedUser: PrivyUser | null;
  loginState: LoginState;
  accountDisplay: string;
  
  // Wallet state
  connectedWallet: ConnectedWallet | null;
  walletAddress: Address | null;
  isEmbeddedWallet: boolean;
  
  // Network state
  currentChainId: number;
  isOnCorrectChain: boolean;
  
  // Actions
  login: () => Promise<void>;
  logout: () => Promise<void>;
  connectWallet: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
  exportWallet: () => Promise<void>;
  
  // Privy utilities
  getAccessToken: () => Promise<string>;
  signMessage: (message: string) => Promise<string>;
}
```

### Login State Management
```typescript
enum LoginState {
  LOGGED_OUT = 'logged_out',       // No authentication
  AUTHENTICATED = 'authenticated',  // Privy authenticated (may have embedded wallet)
  EOA = 'eoa'                      // External wallet connected
}
```

### Provider Implementation Pattern
```typescript
export const AccountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Privy hooks
  const { user, authenticated, ready, login, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { connectWallet } = useConnectWallet();
  const { signMessage } = useSignMessage();
  const { getAccessToken } = usePrivyAccessToken();
  
  // Derive login state
  const loginState = useMemo(() => {
    if (!authenticated) return LoginState.LOGGED_OUT;
    
    const hasEmbeddedWallet = wallets.some(w => w.walletClientType === 'privy');
    const hasExternalWallet = wallets.some(w => w.walletClientType !== 'privy');
    
    if (hasExternalWallet) return LoginState.EOA;
    if (hasEmbeddedWallet) return LoginState.AUTHENTICATED;
    
    return LoginState.LOGGED_OUT;
  }, [authenticated, wallets]);
  
  // Active wallet selection
  const connectedWallet = useMemo(() => {
    // Prioritize external wallets over embedded
    const externalWallet = wallets.find(w => w.walletClientType !== 'privy');
    if (externalWallet) return externalWallet;
    
    // Fall back to embedded wallet
    return wallets.find(w => w.walletClientType === 'privy');
  }, [wallets]);
  
  // Account display logic
  const accountDisplay = useMemo(() => {
    if (user?.email?.address) return user.email.address;
    if (user?.google?.username) return user.google.username;
    if (user?.twitter?.username) return `@${user.twitter.username}`;
    if (connectedWallet?.address) return truncateAddress(connectedWallet.address);
    return 'Not connected';
  }, [user, connectedWallet]);
  
  return (
    <AccountContext.Provider value={contextValue}>
      {children}
    </AccountContext.Provider>
  );
};
```

## Development Guidelines

### Authentication Flow
```typescript
// Social login flow
const handleSocialLogin = async () => {
  try {
    await login(); // Opens Privy modal
    // Embedded wallet automatically created for new users
    // User lands in AUTHENTICATED state
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// External wallet connection
const handleWalletConnect = async () => {
  try {
    await connectWallet(); // Opens wallet selection
    // User transitions to EOA state
  } catch (error) {
    console.error('Wallet connection failed:', error);
  }
};
```

### Wallet Priority System
1. **External wallets** take precedence when connected
2. **Embedded wallets** used as fallback
3. **Smart account** authorization attempted for embedded wallets

```typescript
// Wallet selection logic
const getActiveWallet = (wallets: Wallet[]): Wallet | null => {
  // 1. Check for external wallet (MetaMask, Rainbow, etc.)
  const external = wallets.find(w => 
    w.walletClientType !== 'privy' && 
    w.connected
  );
  if (external) return external;
  
  // 2. Fall back to embedded wallet
  const embedded = wallets.find(w => 
    w.walletClientType === 'privy'
  );
  if (embedded) return embedded;
  
  return null;
};
```

### Network Management
```typescript
// Ensure correct chain
const ensureCorrectChain = async () => {
  if (!isOnCorrectChain) {
    await switchNetwork(BASE_CHAIN_ID);
  }
};

// Chain validation
const validateChain = (chainId: number): boolean => {
  const supportedChains = [
    8453,  // Base mainnet
    84532, // Base Sepolia
    31337  // Hardhat local
  ];
  return supportedChains.includes(chainId);
};
```

## Testing Strategy

### Mock Provider Pattern
```typescript
const MockAccountProvider = ({ children, mockState = {} }) => {
  const defaultState = {
    authenticatedUser: null,
    loginState: LoginState.LOGGED_OUT,
    connectedWallet: null,
    login: vi.fn(),
    logout: vi.fn(),
    ...mockState
  };
  
  return (
    <AccountContext.Provider value={defaultState}>
      {children}
    </AccountContext.Provider>
  );
};
```

### Authentication State Tests
```typescript
describe('Account Context', () => {
  it('should handle email authentication', async () => {
    const { result } = renderHook(() => useAccount(), {
      wrapper: AccountProvider
    });
    
    await act(async () => {
      await result.current.login();
    });
    
    expect(result.current.loginState).toBe(LoginState.AUTHENTICATED);
    expect(result.current.authenticatedUser?.email).toBeDefined();
  });
});
```

## Common Tasks

### Checking Authentication
```typescript
const { loginState, authenticatedUser } = useAccount();

if (loginState === LoginState.LOGGED_OUT) {
  return <LoginPrompt />;
}

if (loginState === LoginState.AUTHENTICATED) {
  // User has embedded wallet
  return <DashboardWithEmbeddedWallet />;
}

if (loginState === LoginState.EOA) {
  // User has external wallet
  return <DashboardWithExternalWallet />;
}
```

### Getting Access Token for API
```typescript
const { getAccessToken } = useAccount();

const fetchUserData = async () => {
  const token = await getAccessToken();
  
  const response = await fetch('/api/user', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
};
```

### Wallet Export Flow
```typescript
const { exportWallet, isEmbeddedWallet } = useAccount();

const handleExportWallet = async () => {
  if (!isEmbeddedWallet) {
    toast.error('Only embedded wallets can be exported');
    return;
  }
  
  try {
    await exportWallet();
    toast.success('Wallet exported successfully');
  } catch (error) {
    toast.error('Failed to export wallet');
  }
};
```

## Integration Points

### Connected Systems
- **SmartAccountContext**: Uses account for EIP-7702 authorization
- **BackendContext**: Uses access token for API authentication
- **SmartContractsContext**: Uses wallet for contract interactions
- **Transaction Hooks**: Use wallet for signing transactions

### Privy Configuration
```typescript
// Configured in src/index.tsx
<PrivyProvider
  appId={PRIVY_APP_ID}
  config={{
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
      requireUserPasswordOnCreate: false
    },
    loginMethods: ['email', 'google', 'twitter', 'wallet'],
    appearance: {
      theme: '#0E111C',
      accentColor: '#df2e2d'
    },
    chains: [base, baseSepolia]
  }}
>
```

## Security Considerations

### Access Token Management
- Tokens expire after 1 hour
- Automatically refreshed by Privy SDK
- Never store tokens in localStorage
- Always use getAccessToken() for fresh tokens

### Wallet Security
- Private keys for embedded wallets managed by Privy
- External wallet signing through wallet provider
- No private keys exposed to application code
- User consent required for all transactions

### Session Management
```typescript
// Automatic session validation
useEffect(() => {
  const validateSession = async () => {
    try {
      await getAccessToken();
    } catch (error) {
      // Session expired, log out user
      await logout();
    }
  };
  
  const interval = setInterval(validateSession, 5 * 60 * 1000); // Every 5 minutes
  return () => clearInterval(interval);
}, []);
```

## Performance Considerations

### State Derivation
- Use `useMemo` for computed values
- Avoid unnecessary re-renders
- Cache wallet selection logic
- Debounce network checks

### Initialization
```typescript
// Wait for Privy to be ready
const { ready: privyReady } = usePrivy();
const { ready: walletsReady } = useWallets();

const isReady = privyReady && walletsReady;

if (!isReady) {
  return <LoadingSpinner />;
}
```

### Error Handling
```typescript
const handleAuthError = (error: PrivyError) => {
  switch (error.code) {
    case 'user_cancelled':
      // User closed modal, no action needed
      break;
    case 'network_error':
      toast.error('Network error. Please try again.');
      break;
    case 'invalid_credentials':
      toast.error('Invalid credentials');
      break;
    default:
      console.error('Auth error:', error);
      toast.error('Authentication failed');
  }
};
```