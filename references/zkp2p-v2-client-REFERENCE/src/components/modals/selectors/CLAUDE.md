# Modal Selectors - Development Context

## Overview
The selectors directory implements a sophisticated component system for currency, platform, and token selection with consistent APIs, mobile optimization, and advanced features like dynamic token loading and multi-chain support.

## Key Files and Structure
```
src/components/modals/selectors/
├── currency/                   # Currency selection with flag icons
│   ├── CurrencySelector.tsx   # Main currency selector component
│   └── hooks/                 # Currency-specific hooks
├── currencyPlatform/          # Combined currency + platform selector
│   └── CurrencyPlatformSelector.tsx
├── platform/                  # Payment platform selection
│   └── PlatformSelector.tsx  # Platform selector with icons
└── token/                     # Multi-chain token selector
    ├── TokenSelector.tsx      # Advanced token selector
    ├── TokenSelectorModal.tsx # Modal wrapper with search
    └── components/            # Sub-components
        ├── ChainSelector.tsx  # Chain filtering
        └── TokenGrid.tsx      # Token display grid
```

## Architecture Patterns

### Consistent Selector Interface
All selectors follow a unified prop pattern for consistency:
```typescript
interface SelectorProps<T> {
  selected[Item]: T | null;
  setSelected[Item]: (item: T) => void;
  // Feature-specific props
}
```

### Mobile-First Design
- Slide-up animations for mobile modals
- Touch-optimized targets (minimum 44px)
- Full-height layouts on mobile devices
- Responsive grid layouts for desktop

### Dynamic Data Loading
Token selector implements on-demand loading:
- Chains loaded when accessed
- Popular tokens pre-loaded
- Balance data fetched asynchronously
- Unverified token warnings

## Component Details

### Currency Selector
- **Flag Icon Integration**: Uses flag-icons library for country flags
- **Search Functionality**: Real-time filtering of currencies
- **Keyboard Navigation**: Arrow keys and Enter support
- **Mobile Optimization**: Slide animations and touch scrolling

### Token Selector
- **Multi-Chain Support**: 80+ chains with dynamic loading
- **Two-Column Layout**: Desktop shows chains + tokens
- **Popular Token Grid**: Quick access (ETH, USDC, WETH, DEGEN)
- **Address Search**: Contract address pasting support
- **Balance Display**: Optional user balance sorting
- **Verification Status**: Warning modal for unverified tokens

### Platform Selector
- **Platform Icons**: Visual identification with logos
- **Currency Filtering**: Shows platforms supporting selected currency
- **Availability States**: Handles platform availability by region
- **Payment Method Support**: Multiple methods per platform (Zelle banks)

### Currency-Platform Selector
- **Combined Selection**: Unified currency and platform choice
- **Smart Filtering**: Platform availability based on currency
- **Validation Logic**: Ensures valid currency-platform combinations
- **User Guidance**: Helper text for selection constraints

## Development Guidelines

### Adding a New Selector Type
1. Create directory under `/selectors/[type]/`
2. Implement main selector component
3. Follow consistent prop interface pattern
4. Add mobile-specific optimizations
5. Implement search/filter functionality
6. Add keyboard navigation support

### Styling Patterns
```typescript
// Mobile-responsive styling
const Container = styled.div<{ $isMobile: boolean }>`
  ${({ $isMobile }) => $isMobile ? `
    height: 100vh;
    border-radius: 16px 16px 0 0;
  ` : `
    max-height: 600px;
    border-radius: 16px;
  `}
`;
```

### Performance Optimization
- Use React.memo for list items
- Implement virtualization for large lists
- Lazy load images and icons
- Debounce search inputs
- Cache frequently accessed data

## Testing Strategy

### Component Testing
- Render with various prop combinations
- Test selection callbacks
- Verify search filtering
- Test keyboard navigation
- Validate mobile vs desktop rendering

### Integration Testing
- Test with real data from contexts
- Verify chain/token loading
- Test error states and fallbacks
- Validate unverified token warnings

## Common Tasks

### Customizing Selector Behavior
```typescript
// Example: Token selector with custom filtering
<TokenSelector
  selectedToken={token}
  setSelectedToken={setToken}
  onlyShowCurrentNetwork={true}      // Filter by current chain
  onlyShowDepositAllowedTokens={true} // Custom token filter
  showBalance={true}                  // Display balances
  stopSelection={isLoading}           // Disable during loading
/>
```

### Adding Search to a Selector
1. Add search state: `useState<string>('')`
2. Implement filter function
3. Add search input component
4. Apply filter to displayed items
5. Handle empty state messaging

### Implementing Keyboard Navigation
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  switch(e.key) {
    case 'ArrowDown':
      setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
      break;
    case 'ArrowUp':
      setSelectedIndex(prev => Math.max(prev - 1, 0));
      break;
    case 'Enter':
      selectItem(items[selectedIndex]);
      break;
    case 'Escape':
      closeModal();
      break;
  }
};
```

## Integration Points

### Context Dependencies
- **TokenDataContext**: Dynamic token information
- **BalancesContext**: User token balances
- **GeolocationContext**: Default currency selection
- **SmartContractsContext**: Platform availability

### UI Components Used
- **ThemedText**: Consistent typography
- **ModalAndOverlayContainer**: Modal wrapper
- **SVGIcon**: Icon display system
- **Flag components**: Country flag display

### Parent Components
- **SwapModal**: Uses platform and currency selectors
- **SendForm**: Uses token selector
- **DepositModal**: Uses currency-platform selector
- **LiquidityModal**: Uses multiple selectors