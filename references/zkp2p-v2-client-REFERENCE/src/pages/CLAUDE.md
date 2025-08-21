# CLAUDE.md - Pages Documentation

## Overview

The pages directory contains route-level components that represent the main application views in the ZKP2P V2 client. These components serve as containers that coordinate between multiple contexts, manage URL state, and orchestrate complex multi-step user flows.

## Key Files and Structure

```
src/pages/
├── Landing.tsx          # Home page with swap preview and marketing content
├── Swap.tsx            # Main trading interface with tab-based navigation
├── Liquidity.tsx       # Liquidity provider dashboard and operations
├── Deposit.tsx         # Create and manage liquidity deposits (/pool route)
├── DepositDetail.tsx   # Individual deposit detail view (/deposit/:depositId)
├── Send.tsx            # Multi-token send interface with ENS/Solana support
├── Privacy.tsx         # Privacy policy page (/pp route)
├── Tos.tsx            # Terms of service page (/tos route)
└── Modals.tsx         # Global modal orchestration system
```

## Architecture Patterns

### Route-Level State Management

Pages serve as the integration layer between React Router, URL parameters, and application contexts:

```typescript
// Pattern: URL-driven state synchronization
const Swap: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<'buy' | 'send'>(
    tabParam === 'send' ? 'send' : 'buy'
  );

  // Bidirectional URL sync
  useEffect(() => {
    const newParams = new URLSearchParams(location.search);
    newParams.set('tab', activeTab);
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
  }, [activeTab]);
};
```

### Multi-Step Flow Orchestration

Pages coordinate complex user journeys across multiple components:

```typescript
// Pattern: State-driven component rendering
const renderComponent = () => {
  if (showCompleteOrder) {
    return <CompleteOrderForm 
      handleBackClick={() => {
        setShowCompleteOrder(false);
        setShowSendModal(true);
      }}
      handleGoBackToSwap={() => {
        setShowCompleteOrder(false);
        setShowSendModal(false);
      }}
    />;
  }

  if (showSendModal) {
    return <SendPaymentForm
      onBackClick={() => setShowSendModal(false)}
      onCompleteClick={() => {
        setShowSendModal(false);
        setShowCompleteOrder(true);
      }}
    />;
  }

  return <MainInterface />;
};
```

### Context Integration

Pages manage coordination between multiple contexts to prevent unnecessary re-renders:

```typescript
// Pattern: Selective context refetching
const { refetchUsdcBalance, shouldFetchUsdcBalance } = useBalances();
const { refetchIntentView, shouldFetchIntentView } = useOnRamperIntents();
const { refetchDepositCounter, shouldFetchEscrowState } = useEscrowState();

useEffect(() => {
  // Only refetch when contexts indicate stale data
  if (shouldFetchUsdcBalance) refetchUsdcBalance?.();
  if (shouldFetchIntentView) refetchIntentView?.();
  if (shouldFetchEscrowState) refetchDepositCounter?.();
}, []);
```

### Responsive Layout Management

Pages handle device-specific layout and navigation patterns:

```typescript
// Pattern: Device-aware layout
const isMobile = currentDeviceSize === 'tablet' || currentDeviceSize === 'mobile';

return (
  <PageWrapper $isMobile={isMobile}>
    {renderComponent()}
  </PageWrapper>
);

const PageWrapper = styled.div<{ $isMobile: boolean }>`
  padding: ${props => props.$isMobile ? '0' : '4px 8px'};
  padding-bottom: ${props => props.$isMobile ? '4.5rem' : '2rem'};
  height: ${props => props.$isMobile ? '100%' : 'auto'};
  overflow: ${props => props.$isMobile ? 'hidden' : 'visible'};
`;
```

## Routing Configuration

The application uses React Router with the following route mapping defined in `App.tsx`:

```typescript
<Route path="/" element={<Landing />} />              // Home page
<Route path="/swap" element={<Swap />} />             // Trading interface
<Route path="/liquidity" element={<Liquidity />} />   // Liquidity dashboard
<Route path="/pool" element={<DepositPage />} />      // Deposit creation (uses Deposit.tsx)
<Route path="/deposit/:depositId" element={<DepositDetail />} /> // Individual deposit
<Route path="/pp" element={<Privacy />} />            // Privacy policy
<Route path="/tos" element={<Tos />} />               // Terms of service
<Route path="*" element={<div>Not found</div>} />     // 404 fallback
```

### Special Route Handling

- **Privacy Policy**: Accessible via `/pp` instead of `/privacy`
- **Terms of Service**: Accessible via `/tos` instead of `/terms`
- **Deposit Creation**: Uses `/pool` route but renders `Deposit.tsx` component
- **Dynamic Routes**: `/deposit/:depositId` for individual deposit details

## Key Page Components

### Swap.tsx - Main Trading Interface

**Purpose**: Primary trading page with Buy/Send tabs and multi-step flow management

**Key Features**:
- Tab-based navigation with URL persistence
- Multi-step user flows (Buy → Send Payment → Complete Order)
- Context integration for balance updates
- SEO optimization with Helmet

**State Management**:
- `activeTab`: 'buy' | 'send' - controls tab display
- `showCompleteOrder`: boolean - renders proof submission flow
- `showSendModal`: boolean - renders payment instruction flow

**URL Parameters**:
- `tab`: 'buy' | 'send' - determines active tab
- `view`: 'sendPayment' - triggers direct navigation to send payment flow

### Landing.tsx - Marketing and Preview

**Purpose**: Home page with swap preview and onboarding content

**Key Features**:
- Interactive swap preview with live pricing data
- Animated currency carousel using `react-text-transition`
- Marketing sections with value propositions (Fast, Cheap, Zero fraud)
- Footer with comprehensive links and social media integration
- Smooth scrolling navigation to different sections
- Mobile-optimized responsive design

**Technical Implementation**:
- Uses `TextTransition` for cycling currency displays (USD, EUR, GBP, SGD, etc.)
- Implements scroll-to-section navigation with `scrollIntoView`
- Comprehensive footer with organized link groups
- Full-screen hero section with interactive elements

**SEO Optimization**:
```typescript
<Helmet>
  <title>ZKP2P | Permissionless Crypto On-Ramp</title>
  <meta name="description" content="Buy crypto like USDC globally using Venmo, Wise, Revolut, Zelle, Cashapp. Fast, no fee, permissionless crypto on-ramp." />
</Helmet>
```

### Liquidity.tsx - Provider Dashboard

**Purpose**: Interface for liquidity providers to manage deposits and view yield opportunities

**Key Features**:
- Comprehensive deposit table with sorting and filtering
- New deposit creation flow
- APR calculations and performance metrics
- Real-time deposit counter updates from escrow state
- Tally support integration for user assistance

**Context Dependencies**:
- `useEscrowState()`: For deposit counter and escrow state
- `useLiquidity()`: For deposit views and liquidity operations
- `useMediaQuery()`: For responsive design

**SEO Optimization**:
```typescript
<Helmet>
  <title>ZKP2P | Provide Liquidity and Earn Yield</title>
  <meta name="description" content="Provide liquidity and earn yield on your stablecoins. Fast, no fee, permissionless crypto on-ramp." />
</Helmet>
```

### Deposit.tsx - Deposit Creation Page

**Purpose**: Create and manage liquidity deposits (accessible via `/pool` route)

**Key Features**:
- Deposit creation interface with form validation
- Balance integration for USDC deposits
- Real-time deposit and intent view updates
- Tally support integration for user assistance

**Context Dependencies**:
- `useDeposits()`: For deposit operations and intent management
- `useBalances()`: For USDC balance tracking
- `useMediaQuery()`: For responsive layout

**SEO Optimization**:
```typescript
<Helmet>
  <title>ZKP2P | Sell Crypto to Venmo, Zelle, Revolut and Bank Accounts</title>
  <meta name="description" content="Sell crypto globally like USDC directly to Venmo, Wise, Revolut, Zelle, Cashapp. Fast, no fee, permissionless crypto off-ramp." />
</Helmet>
```

### DepositDetail.tsx - Individual Deposit View

**Purpose**: Detailed view and management of specific liquidity deposits (route: `/deposit/:depositId`)

**Key Features**:
- Individual deposit analytics and statistics
- Order history and fulfillment data
- Deposit management actions and controls
- Real-time updates for deposit and intent states
- Tally support integration for deposit-specific assistance

**Context Dependencies**:
- `useDeposits()`: For specific deposit data and operations
- `useBalances()`: For balance updates after deposit actions
- `useMediaQuery()`: For responsive design

**Route Parameters**:
- `depositId`: URL parameter for specific deposit identification

### Send.tsx - Multi-Token Sending

**Purpose**: Standalone token sending interface supporting multiple tokens and chains

**Key Features**:
- Multi-token support via TokenDataContext integration
- ENS name resolution for Ethereum addresses
- Partial Solana address support for cross-chain sending
- Cross-chain bridging integration (Relay and Socket)
- Balance tracking for USDC and ETH
- Tally support integration for sending assistance

**Context Dependencies**:
- `useBalances()`: For USDC and ETH balance management
- `useMediaQuery()`: For responsive layout design

**Technical Implementation**:
- Renders `SendForm` component as main interface
- Integrates with cross-chain bridging providers
- Supports multiple token types beyond just USDC
- Real-time balance updates after sending operations

### Privacy.tsx & Tos.tsx - Legal Pages

**Purpose**: Static legal content pages for privacy policy and terms of service

**Key Features**:
- **Privacy.tsx** (`/pp` route): Complete privacy policy with GDPR/CCPA compliance
- **Tos.tsx** (`/tos` route): Comprehensive terms of service and legal disclaimers
- Mobile-responsive layout with proper typography
- Structured content with headers and sections
- Consistent styling patterns using styled-components

**Technical Implementation**:
- Uses `useMediaQuery()` for responsive design
- Implements proper semantic HTML structure
- Custom styled components for legal content formatting
- Mobile-first responsive design with desktop enhancements

**Content Structure** (Both pages):
- Header with title and last modified date
- Organized sections with clear hierarchy
- Mobile-optimized padding and typography
- Maximum content width for readability

### Modals.tsx - Global Modal System

**Purpose**: Centralized modal orchestration and rendering system

**Key Features**:
- Modal state management via `useModal()` context integration
- Conditional rendering based on `currentModal` state
- Overlay rendering and focus management
- Centralized modal routing and deep linking support

**Current Modal Types**:
- `MODALS.RECEIVE`: Renders `ReceiveModal` for receiving tokens
- Commented out: `MODALS.NOT_SUPPORTED_PLATFORM_DEVICE` for mobile landing

**Technical Implementation**:
```typescript
export default function Modals() {
  const { currentModal } = useModal();

  return (
    <>
      {currentModal === MODALS.RECEIVE && <ReceiveModal />}
    </>
  );
}
```

## Common Page Patterns

### TallySupportButton Integration

Most functional pages include a `TallySupportButton` component for user assistance:

```typescript
<TallySupportButton
  page="pageName" // Identifies the page for support context
/>
```

**Pages with Tally Support**:
- Send.tsx: `page="send"`
- Liquidity.tsx: `page="liquidity"`  
- Deposit.tsx: No explicit page prop
- DepositDetail.tsx: `page="depositDetails"`

### Context Refetching Pattern

Pages implement a consistent pattern for refreshing stale context data:

```typescript
const {
  refetchDataFunction,
  shouldFetchData
} = useContextHook();

useEffect(() => {
  if (shouldFetchData) {
    refetchDataFunction?.();
  }
}, []);
```

This pattern prevents unnecessary API calls while ensuring fresh data when needed.

### Mobile-First Responsive Design

All pages follow a consistent responsive pattern:

```typescript
const currentDeviceSize = useMediaQuery();
const isMobile = currentDeviceSize === 'tablet' || currentDeviceSize === 'mobile';

const PageWrapper = styled.div<{ $isMobile: boolean }>`
  padding-bottom: ${props => props.$isMobile ? '7rem' : '3rem'};
  
  @media (min-width: 600px) {
    padding: 12px 8px;
  }
`;
```

### Main Content Structure

Most pages follow this consistent layout structure:

```typescript
<PageWrapper $isMobile={isMobile}>
  <Main>
    {/* Page-specific content */}
  </Main>
  
  <TallySupportButton page="pageName" />
</PageWrapper>
```

## Development Guidelines

### Page Component Structure

Follow this pattern for all page components:

```typescript
export const PageName: React.FC = () => {
  // 1. Hooks and context access
  const currentDeviceSize = useMediaQuery();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 2. URL parameter parsing
  const queryParams = new URLSearchParams(location.search);
  const param = queryParams.get('param');
  
  // 3. Local state management
  const [localState, setLocalState] = useState(initialValue);
  
  // 4. Context integration
  const { contextValue, refetchFunction } = useContext();
  
  // 5. Effects for initialization and URL sync
  useEffect(() => {
    // Initialization logic
  }, []);
  
  // 6. Event handlers
  const handleAction = () => {
    // Action logic
  };
  
  // 7. Render logic
  return (
    <>
      <Helmet>
        <title>Page Title</title>
        <meta name="description" content="Page description" />
      </Helmet>
      <PageWrapper>
        {/* Component content */}
      </PageWrapper>
    </>
  );
};
```

### URL State Management

Always maintain URL state for user navigation and deep linking:

```typescript
// Reading URL parameters
const queryParams = new URLSearchParams(location.search);
const tab = queryParams.get('tab');

// Updating URL without page refresh
const updateURL = (newParams: Record<string, string>) => {
  const searchParams = new URLSearchParams(location.search);
  Object.entries(newParams).forEach(([key, value]) => {
    searchParams.set(key, value);
  });
  navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
};
```

### SEO and Meta Tags

Use React Helmet for dynamic meta tags. Follow these SEO patterns observed across pages:

```typescript
<Helmet>
  <title>ZKP2P | [Page-Specific Action/Description]</title>
  <meta 
    name="description" 
    content="[Detailed description with key payment methods and value props]" 
  />
</Helmet>
```

**SEO Title Patterns**:
- **Landing**: "ZKP2P | Permissionless Crypto On-Ramp"
- **Swap**: "ZKP2P | Buy crypto with Venmo, Zelle and Bank Transfer"
- **Liquidity**: "ZKP2P | Provide Liquidity and Earn Yield"
- **Deposit**: "ZKP2P | Sell Crypto to Venmo, Zelle, Revolut and Bank Accounts"

**Description Best Practices**:
- Always mention key payment methods: "Venmo, Wise, Revolut, Zelle, Cashapp"
- Include value propositions: "Fast, no fee, permissionless"
- Specify crypto types: "USDC" or "crypto like USDC"
- Use action-oriented language: "Buy crypto", "Provide liquidity", "Sell crypto"

**Pages Without Helmet**:
- Privacy.tsx, Tos.tsx, DepositDetail.tsx, Send.tsx, Modals.tsx
- Consider adding SEO optimization to these pages

### Mobile-First Responsive Design

Design for mobile first, then enhance for larger screens:

```typescript
const isMobile = currentDeviceSize === 'tablet' || currentDeviceSize === 'mobile';

const PageWrapper = styled.div<{ $isMobile: boolean }>`
  // Mobile-first styles
  padding: 0;
  
  // Desktop enhancements
  ${props => !props.$isMobile && css`
    padding: 4px 8px;
    max-width: 1200px;
    margin: 0 auto;
  `}
`;
```

## Testing Strategy

### Page Integration Tests

Test page-level functionality with context providers:

```typescript
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Swap } from '../Swap';
import { TestProviders } from '@test/utils/test-utils';

describe('Swap Page', () => {
  it('should render buy tab by default', () => {
    render(
      <BrowserRouter>
        <TestProviders>
          <Swap />
        </TestProviders>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Buy')).toBeInTheDocument();
  });

  it('should handle tab switching with URL updates', () => {
    // Test tab switching and URL state management
  });
});
```

### URL State Testing

Test URL parameter handling and navigation:

```typescript
it('should initialize with correct tab from URL', () => {
  // Mock useLocation to return specific search params
  const mockLocation = {
    search: '?tab=send',
    pathname: '/swap'
  };
  
  jest.spyOn(require('react-router-dom'), 'useLocation')
    .mockReturnValue(mockLocation);
    
  render(<SwapPage />);
  expect(screen.getByText('Send')).toHaveClass('active');
});
```

## Common Development Tasks

### Adding a New Page

1. **Create the page component**:
```typescript
// src/pages/NewPage.tsx
export const NewPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>New Page | ZKP2P</title>
      </Helmet>
      <PageWrapper>
        {/* Page content */}
      </PageWrapper>
    </>
  );
};
```

2. **Add route to App.tsx**:
```typescript
<Route path="/new-page" element={<NewPage />} />
```

3. **Update navigation components** if needed

### Implementing Multi-Step Flows

Use state machines for complex flows:

```typescript
type FlowState = 'initial' | 'step1' | 'step2' | 'complete';

const [flowState, setFlowState] = useState<FlowState>('initial');

const renderStep = () => {
  switch (flowState) {
    case 'initial':
      return <InitialStep onNext={() => setFlowState('step1')} />;
    case 'step1':
      return <Step1 
        onNext={() => setFlowState('step2')} 
        onBack={() => setFlowState('initial')} 
      />;
    // ... other steps
  }
};
```

### Adding URL Parameters

Follow consistent naming and handle edge cases:

```typescript
// Reading with defaults
const tab = queryParams.get('tab') || 'default';

// Validation
const isValidTab = (tab: string): tab is TabType => {
  return ['buy', 'send'].includes(tab);
};

// Safe parameter setting
const setTabParam = (tab: TabType) => {
  const newParams = new URLSearchParams(location.search);
  newParams.set('tab', tab);
  navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
};
```

## Integration Points

### Context Dependencies

Pages typically depend on these contexts:
- **AccountContext**: User authentication state
- **SmartAccountContext**: Smart account functionality  
- **BalancesContext**: Token balance information
- **ModalSettingsContext**: Modal state management
- **OnRamperIntentsContext**: User swap intents

### Component Communication

Pages communicate with child components through:
- **Props drilling**: For simple state
- **Callback props**: For user actions
- **Context updates**: For global state changes

### Router Integration

Pages integrate with React Router for:
- **URL parameter management**: Tab state, filters
- **Navigation actions**: Programmatic routing
- **Route protection**: Authentication guards
- **Deep linking**: Shareable URLs

## Performance Considerations

### Code Splitting

Use lazy loading for heavy page components:

```typescript
const HeavyPage = lazy(() => import('./HeavyPage'));

// In App.tsx
<Suspense fallback={<PageSkeleton />}>
  <HeavyPage />
</Suspense>
```

### Context Optimization

Minimize context re-renders with selective subscriptions:

```typescript
// Instead of subscribing to entire context
const { value1, value2, ...rest } = useContext();

// Subscribe only to needed values
const value1 = useContext(Context, (state) => state.value1);
const value2 = useContext(Context, (state) => state.value2);
```

### Memory Management

Clean up subscriptions and effects:

```typescript
useEffect(() => {
  const subscription = subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

Remember: Pages are the coordination layer of the application. They should focus on orchestrating child components and managing URL state rather than implementing complex business logic.