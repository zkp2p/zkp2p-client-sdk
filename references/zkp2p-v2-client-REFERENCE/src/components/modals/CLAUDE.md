# CLAUDE.md - Modal System Documentation

## Overview

The modals directory contains the modal system architecture and specialized selector components for the ZKP2P V2 client. This system provides a centralized modal management approach with reusable selector patterns for currencies, payment platforms, and tokens. The modal system emphasizes accessibility, responsive design, and consistent user experience patterns.

## Key Files and Structure

```
src/components/modals/
├── Overlay.tsx                    # Base overlay component with body scroll management
├── ConfirmCancelIntent.tsx        # Intent cancellation confirmation
├── ConfirmRelease.tsx            # Funds release confirmation  
├── ContactSellerModal.tsx        # Support contact modal
├── ContactSupportModal.tsx       # General support modal
├── IntegrationModal.tsx          # Platform integration instructions
├── RedirectCloseModal.tsx        # External redirect confirmation
├── UnverifiedTokenModal.tsx      # Token verification warnings
├── legacy/                       # Deprecated modal components
│   ├── RequirementStepRow.tsx    
│   └── ReviewRequirements.tsx    
└── selectors/                    # Reusable selector modal system
    ├── currency/                 # Currency selection modals
    │   ├── CurrencySelector.tsx  # Main currency selector modal
    │   ├── CurrencyRow.tsx       # Individual currency row component
    │   ├── InputWithCurrencySelector.tsx # Input field with currency selector
    │   └── index.tsx             # Currency selector exports
    ├── platform/                 # Payment platform selectors
    │   ├── PlatformSelector.tsx  # Main platform selector modal
    │   ├── PlatformRow.tsx       # Individual platform row component
    │   ├── PlatformIconHelper.tsx # Platform icon management
    │   ├── LabelWithPlatformSelector.tsx # Label with platform selector
    │   └── index.tsx             # Platform selector exports
    ├── token/                    # Token selection modals
    │   ├── TokenSelector.tsx     # Main token selector modal
    │   ├── TokenRow.tsx          # Individual token row component
    │   ├── InputWithTokenSelector.tsx # Input field with token selector
    │   └── index.tsx             # Token selector exports
    └── currencyPlatform/         # Combined currency/platform selectors
        ├── CurrencyPlatformSelector.tsx # Dual selection modal
        ├── CurrencyRow.tsx       # Currency row for combined selector
        ├── PlatformRow.tsx       # Platform row for combined selector
        ├── InputWithCurrencyPlatformSelector.tsx # Input with dual selector
        ├── LabelWithCurrencyPlatformSelector.tsx # Label with dual selector
        └── index.ts              # Combined selector exports
```

## Architecture Patterns

### Centralized Modal Management

Modal state is managed through a centralized context system:

```typescript
// Global modal orchestration (src/pages/Modals.tsx)
export default function Modals() {
  const { currentModal } = useModal();

  return (
    <>
      {currentModal === MODALS.RECEIVE && (
        <ReceiveModal />
      )}
      {currentModal === MODALS.CONFIRM_CANCEL && (
        <ConfirmCancelIntent />
      )}
      {/* Additional modals... */}
    </>
  );
}
```

### Overlay System with Body Scroll Management

All modals use a consistent overlay pattern:

```typescript
// Overlay.tsx - Base overlay with scroll lock
export const Overlay: React.FC<OverlayProps> = ({ onClick }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden'; // Lock body scroll

    return () => {
      document.body.style.overflow = 'unset'; // Restore scroll
    };
  }, []);

  return <OverlayContainer onClick={onClick} />;
};
```

### Reusable Selector Pattern

Selector modals follow a consistent architecture:

```typescript
// Pattern: Selector modal with search and filtering
export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  setSelectedCurrency,
  allCurrencies,
  width
}) => {
  const [isOpen, toggleOpen] = useReducer((s) => !s, false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCurrencies = useMemo(() => {
    return allCurrencies.filter(currency => 
      currencyInfo[currency].currencyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currencyInfo[currency].currencyCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allCurrencies, searchTerm]);

  return (
    <Wrapper ref={ref}>
      <SelectorButton onClick={toggleOpen}>
        {/* Selector display */}
      </SelectorButton>

      {isOpen && (
        <ModalAndOverlayContainer>
          <Overlay onClick={handleOverlayClick}/>
          <ModalContainer>
            <SearchContainer>
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchContainer>
            
            <Table>
              {filteredCurrencies.map((currency) => (
                <CurrencyRow
                  key={currency}
                  currency={currency}
                  isSelected={currency === selectedCurrency}
                  onRowClick={() => handleSelectCurrency(currency)}
                />
              ))}
            </Table>
          </ModalContainer>
        </ModalAndOverlayContainer>
      )}
    </Wrapper>
  );
};
```

### Responsive Modal Design

Modals adapt to different screen sizes with consistent patterns:

```typescript
// Pattern: Mobile-first responsive modal
const ModalContainer = styled.div<{ $isMobile: boolean }>`
  width: ${props => props.$isMobile ? '100vw' : '80vw'};
  max-width: ${props => props.$isMobile ? '100vw' : '400px'};
  border-radius: ${props => props.$isMobile ? '16px 16px 0 0' : '16px'};
  
  position: fixed;
  top: ${props => props.$isMobile ? '20%' : '50%'};
  bottom: ${props => props.$isMobile ? '0' : 'auto'};
  left: 50%;
  transform: ${props => !props.$isMobile && 'translate(-50%, -50%)'};
  ${props => props.$isMobile && 'transform: translateX(-50%);'}
  
  ${props => props.$isMobile && `
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    
    @keyframes slideUp {
      0% { transform: translate(-50%, 100%); }
      100% { transform: translateX(-50%); }
    }
  `}
`;
```

## Key Modal Components

### Base Modal Components

**Overlay.tsx** - Foundation overlay component
- Features: Body scroll lock, click-to-close, proper z-index layering
- Usage: Base for all modal implementations

**Confirmation Modals**
- `ConfirmCancelIntent.tsx`: Intent cancellation with consequences explanation
- `ConfirmRelease.tsx`: Funds release confirmation with transaction details
- Pattern: Clear action buttons, explanation text, cancel/confirm options

### Selector Modal System

**Currency Selectors**
- `CurrencySelector.tsx`: Main currency selection modal with search
- `InputWithCurrencySelector.tsx`: Input field integrated with currency selector
- Features: Flag icons, search functionality, keyboard navigation

**Platform Selectors**
- `PlatformSelector.tsx`: Payment platform selection with icons
- `LabelWithPlatformSelector.tsx`: Label component with integrated platform selector
- Features: Platform-specific icons, availability indicators

**Token Selectors**
- `TokenSelector.tsx`: Token selection with balance display
- `InputWithTokenSelector.tsx`: Amount input with token selection
- Features: Token logos, balance information, price data

**Combined Selectors**
- `CurrencyPlatformSelector.tsx`: Dual selection for currency and platform
- Features: Coordinated selection logic, platform availability by currency

### Specialized Modals

**ContactSupportModal.tsx** - Support integration
- Features: Tally form integration, context information
- Integration: External support system

**IntegrationModal.tsx** - Platform integration instructions
- Features: Step-by-step guides, external links
- Usage: Onboarding new users to payment platforms

**UnverifiedTokenModal.tsx** - Security warnings
- Features: Token verification status, risk warnings
- Usage: Protecting users from unverified tokens

## Selector Component Patterns

### Search and Filter Pattern

All selector modals implement consistent search functionality:

```typescript
// Pattern: Real-time search with memoized filtering
const [searchTerm, setSearchTerm] = useState('');

const filteredItems = useMemo(() => {
  return allItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [allItems, searchTerm]);

return (
  <SearchContainer>
    <SearchIcon />
    <SearchInput
      type="text"
      placeholder="Search..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </SearchContainer>
);
```

### Row Component Pattern

Selector rows follow a consistent interface:

```typescript
// Pattern: Standardized row component interface
interface RowProps {
  item: ItemType;
  isSelected: boolean;
  onRowClick: () => void;
  isLastRow?: boolean;
}

export const ItemRow: React.FC<RowProps> = ({
  item, 
  isSelected, 
  onRowClick, 
  isLastRow = false
}) => {
  return (
    <RowContainer 
      onClick={onRowClick}
      $isSelected={isSelected}
      $isLastRow={isLastRow}
    >
      <ItemIcon src={item.icon} />
      <ItemInfo>
        <ItemName>{item.name}</ItemName>
        <ItemSymbol>{item.symbol}</ItemSymbol>
      </ItemInfo>
      {isSelected && <CheckIcon />}
    </RowContainer>
  );
};
```

### Integration Pattern

Selectors integrate with form inputs through compound components:

```typescript
// Pattern: Input with integrated selector
export const InputWithSelector: React.FC<Props> = ({
  inputProps,
  selectorProps,
  label
}) => {
  return (
    <Container>
      <Label>{label}</Label>
      <InputContainer>
        <Input {...inputProps} />
        <SelectorContainer>
          <Selector {...selectorProps} />
        </SelectorContainer>
      </InputContainer>
    </Container>
  );
};
```

## Development Guidelines

### Modal Development Pattern

Follow this structure for new modal components:

```typescript
// 1. Interface definition
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  data?: any;
}

// 2. Component implementation
export const NewModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  data
}) => {
  if (!isOpen) return null;

  return (
    <ModalAndOverlayContainer>
      <Overlay onClick={onClose} />
      <ModalContainer>
        <Header>
          <Title>Modal Title</Title>
          <CloseButton onClick={onClose}>
            <X />
          </CloseButton>
        </Header>
        
        <Content>
          {/* Modal content */}
        </Content>
        
        <Actions>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="primary">
            Confirm
          </Button>
        </Actions>
      </ModalContainer>
    </ModalAndOverlayContainer>
  );
};

// 3. Styled components with responsive design
const ModalContainer = styled.div`
  // Modal styling with mobile adaptations
`;
```

### Selector Development Pattern

For new selector types, follow the established pattern:

```typescript
// 1. Create selector component
export const NewSelector: React.FC<SelectorProps> = ({ ... }) => {
  // Selector implementation
};

// 2. Create row component
export const NewRow: React.FC<RowProps> = ({ ... }) => {
  // Row implementation
};

// 3. Create integration components
export const InputWithNewSelector: React.FC<Props> = ({ ... }) => {
  // Integration implementation
};

// 4. Export from index.tsx
export { NewSelector, NewRow, InputWithNewSelector };
```

### Accessibility Requirements

All modals must implement:

```typescript
// Focus management
useEffect(() => {
  if (isOpen) {
    const previouslyFocusedElement = document.activeElement;
    modalRef.current?.focus();
    
    return () => {
      previouslyFocusedElement?.focus();
    };
  }
}, [isOpen]);

// Escape key handling
useEffect(() => {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };
  
  if (isOpen) {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }
}, [isOpen, onClose]);

// ARIA attributes
<ModalContainer
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
```

## Testing Strategy

### Modal Testing

Test modal behavior and accessibility:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencySelector } from '../CurrencySelector';

describe('CurrencySelector', () => {
  it('should open modal when selector is clicked', () => {
    render(
      <CurrencySelector
        selectedCurrency={null}
        setSelectedCurrency={jest.fn()}
        allCurrencies={mockCurrencies}
      />
    );
    
    fireEvent.click(screen.getByText('All currencies'));
    expect(screen.getByText('Select a Currency')).toBeInTheDocument();
  });

  it('should filter currencies based on search term', () => {
    render(<CurrencySelector {...props} />);
    
    fireEvent.click(screen.getByText('All currencies'));
    fireEvent.change(screen.getByPlaceholderText('Search currency'), {
      target: { value: 'USD' }
    });
    
    expect(screen.getByText('US Dollar')).toBeInTheDocument();
    expect(screen.queryByText('Euro')).not.toBeInTheDocument();
  });
});
```

### Accessibility Testing

Test modal accessibility compliance:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Modal Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(
      <CurrencySelector {...props} />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should trap focus within modal', () => {
    render(<CurrencySelector {...props} />);
    
    fireEvent.click(screen.getByText('All currencies'));
    
    // Test focus trapping
    const modal = screen.getByRole('dialog');
    expect(document.activeElement).toBeWithin(modal);
  });
});
```

## Common Development Tasks

### Adding New Modal Types

1. **Add modal type to constants**:
```typescript
// src/helpers/types/modals.ts
export enum MODALS {
  // ... existing modals
  NEW_MODAL = 'NEW_MODAL'
}
```

2. **Create modal component**:
```typescript
// src/components/modals/NewModal.tsx
export const NewModal: React.FC = () => {
  // Modal implementation
};
```

3. **Add to global modal orchestration**:
```typescript
// src/pages/Modals.tsx
{currentModal === MODALS.NEW_MODAL && (
  <NewModal />
)}
```

### Creating Selector Variants

For specialized selectors (e.g., filtered by context):

```typescript
// Pattern: Contextual selector variant
export const FilteredCurrencySelector: React.FC<Props> = ({
  availableCurrencies, // Pre-filtered list
  ...selectorProps
}) => {
  return (
    <CurrencySelector
      allCurrencies={availableCurrencies}
      {...selectorProps}
    />
  );
};
```

### Adding Search Capabilities

Enhance selectors with advanced search:

```typescript
// Pattern: Advanced search with multiple fields
const filteredItems = useMemo(() => {
  const searchLower = searchTerm.toLowerCase();
  
  return allItems.filter(item => 
    item.name.toLowerCase().includes(searchLower) ||
    item.symbol.toLowerCase().includes(searchLower) ||
    item.description?.toLowerCase().includes(searchLower) ||
    item.tags?.some(tag => tag.toLowerCase().includes(searchLower))
  );
}, [allItems, searchTerm]);
```

## Integration Points

### Context Dependencies

Modal system integrates with:
- **ModalSettingsContext**: Global modal state management
- **Theme System**: Consistent styling and responsive behavior
- **Device Detection**: Mobile/desktop modal variants

### Form Integration

Selector modals work with:
- **Form State**: React Hook Form integration
- **Validation**: Real-time validation feedback
- **Data Sources**: Dynamic data from contexts

### External Integrations

Specialized modals integrate with:
- **Tally Forms**: Support ticket creation
- **External URLs**: Platform integration guides
- **Blockchain Data**: Token verification and metadata

## Performance Considerations

### Modal Optimization

Optimize modal performance:

```typescript
// Lazy load heavy modal content
const HeavyModalContent = lazy(() => import('./HeavyModalContent'));

// Use React.memo for selector rows
export const SelectorRow = React.memo<RowProps>(({ ... }) => {
  // Row implementation
});

// Debounce search input
const debouncedSearch = useMemo(
  () => debounce((term: string) => setSearchTerm(term), 300),
  []
);
```

### Memory Management

Clean up modal resources:

```typescript
useEffect(() => {
  return () => {
    // Clean up subscriptions, timers, etc.
    debouncedSearch.cancel();
  };
}, []);
```

Remember: Modal components should provide clear user interactions while maintaining accessibility and performance. The selector system should be consistent and reusable across different data types.