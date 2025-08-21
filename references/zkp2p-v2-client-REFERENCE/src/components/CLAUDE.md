# Components - Component Context

## Purpose
This document provides comprehensive guidance for working with React components in the ZKP2P V2 client. It covers architectural patterns, styling approaches, component organization, and best practices for building consistent, maintainable UI components.

## Current Status: Active
The component architecture is mature with established patterns. Future development should follow these conventions while refactoring legacy components to align with current standards.

## Component-Specific Development Guidelines

### Technology Stack
- **React**: 18.2.0 with functional components and hooks
- **TypeScript**: 5.3.3 for type safety
- **styled-components**: 5.3.5 for component styling
- **UI Libraries**: Material UI components used sparingly

### Component Organization Pattern
```
Feature/
├── index.tsx              # Main feature component
├── [Feature]Modal.tsx     # Modal variants  
├── [Feature]Table.tsx     # Data display
├── [Feature]Form.tsx      # Form components
├── components/            # Sub-components
│   └── [SubComponent].tsx
└── hooks/                 # Feature-specific hooks
```

### Styling Conventions
```typescript
import styled from 'styled-components';
import { colors } from '@theme/colors';
import { ThemedText } from '@theme/text';

const Container = styled.div`
  background-color: ${colors.container};
  border: 1px solid ${colors.defaultBorder};
  border-radius: 16px;
  padding: 1.5rem;
  
  @media (max-width: 600px) {
    padding: 1rem;
  }
`;
```

## Major Subsystem Organization

### Common Components (`/common`)
Reusable UI building blocks used across features:
- **Inputs**: Input, SimpleInput, SingleLineInput, InputWithSelector
- **Buttons**: Button, TextButton, TransactionButton, AccessoryButton
- **Layout**: Card, Layout, Row, Column
- **Feedback**: Spinner, Tooltip, WarningTextBox, Skeleton
- **Interactive**: CopyButton, LabeledSwitch, Checkbox

### Feature Components
- **Swap**: Main trading interface with multi-step flow
- **Liquidity**: Liquidity provider dashboard and management
- **Deposits**: Deposit creation and management
- **Landing**: Homepage with value propositions
- **Account**: User authentication and profile
- **SmartAccount**: EIP-7702 smart account status and gas sponsorship display

### Modal Components (`/modals`)
- **Base**: Overlay component for modal backdrop
- **Selectors**: Currency, platform, and token selection modals
- **Confirmations**: Transaction and action confirmation modals

## Architectural Patterns

### Component Structure Pattern
```typescript
interface ComponentProps {
  // Required props first
  onAction: () => void;
  data: DataType;
  
  // Optional props with defaults
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Component: React.FC<ComponentProps> = ({
  onAction,
  data,
  isLoading = false,
  disabled = false,
}) => {
  // 1. Context hooks
  const { contextValue } = useContext();
  
  // 2. State declarations
  const [localState, setLocalState] = useState<StateType>();
  
  // 3. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 4. Handlers
  const handleAction = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  
  // 5. Computed values
  const computedValue = useMemo(() => {
    // Computation
  }, [dependencies]);
  
  // 6. Render
  return (
    <Container>
      {/* Component JSX */}
    </Container>
  );
};
```

### Modal Pattern
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const FeatureModal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose,
  title 
}) => {
  if (!isOpen) return null;
  
  return (
    <ModalAndOverlayContainer>
      <Overlay onClick={onClose} />
      <ModalContainer>
        <TitleRow>
          <ThemedText.HeadlineSmall>{title}</ThemedText.HeadlineSmall>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </TitleRow>
        <ModalContent>
          {/* Modal content */}
        </ModalContent>
      </ModalContainer>
    </ModalAndOverlayContainer>
  );
};
```

### Form Component Pattern
```typescript
export const FeatureForm: React.FC<FormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<FormData>(initialState);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validate = useCallback(() => {
    // Validation logic
    return isValid;
  }, [formData]);
  
  const handleSubmit = async () => {
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handling
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <FormContainer>
      {/* Form fields */}
      <Button 
        onClick={handleSubmit}
        disabled={!validate() || isSubmitting}
      >
        {isSubmitting ? <Spinner /> : 'Submit'}
      </Button>
    </FormContainer>
  );
};
```

### Responsive Design Pattern
```typescript
const ResponsiveComponent = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  
  @media (max-width: 600px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

// Or using hooks
const Component = () => {
  const isMobile = useMediaQuery({ query: '(max-width: 600px)' });
  
  return isMobile ? <MobileView /> : <DesktopView />;
};
```

## Integration Points

### Theme Integration
```typescript
import { colors } from '@theme/colors';
import { ThemedText } from '@theme/text';
import { BREAKPOINTS } from '@theme/media';
import * as fonts from '@theme/fonts';
```

### Context Integration
Components access global state through context hooks:
```typescript
import { useAccount } from '@hooks/contexts/useAccount';
import { useSmartContracts } from '@hooks/contexts/useSmartContracts';
import { useModal } from '@hooks/contexts/useModal';
```

### Transaction Integration
```typescript
import { useCreateDeposit } from '@hooks/transactions/useCreateDeposit';

const Component = () => {
  const { writeAsync: createDeposit } = useCreateDeposit(
    onSuccess,
    onError
  );
};
```

## Development Patterns

### State Management
- Use local state for UI-only concerns
- Lift state up when shared between siblings
- Use context for cross-component state
- Implement loading/error states consistently

### Performance Optimization
```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => 
  computeExpensiveValue(data), 
  [data]
);

// Memoize callbacks passed to children
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);

// Memoize components when appropriate
export const Component = React.memo(({ prop1, prop2 }) => {
  // Component logic
});
```

### Error Handling
```typescript
const Component = () => {
  const [error, setError] = useState<string | null>(null);
  
  const handleAction = async () => {
    try {
      setError(null);
      await performAction();
    } catch (err) {
      setError(getErrorMessage(err));
      toast.error('Action failed');
    }
  };
  
  if (error) {
    return <WarningTextBox>{error}</WarningTextBox>;
  }
  
  return <NormalView />;
};
```

### Accessibility Patterns
- Use semantic HTML elements
- Include aria-labels for interactive elements
- Ensure keyboard navigation works
- Maintain focus management in modals
- Provide loading announcements

## Common Pitfalls & Solutions

### Pitfall: Inline Styles
```typescript
// ❌ Avoid
<div style={{ padding: '20px', color: 'red' }}>

// ✅ Prefer
const StyledDiv = styled.div`
  padding: 20px;
  color: ${colors.warningRed};
`;
```

### Pitfall: Direct DOM Manipulation
```typescript
// ❌ Avoid
document.getElementById('element').style.display = 'none';

// ✅ Prefer
const [isVisible, setIsVisible] = useState(true);
return isVisible && <Element />;
```

### Pitfall: Missing Keys in Lists
```typescript
// ❌ Avoid
items.map(item => <Item {...item} />)

// ✅ Prefer
items.map(item => <Item key={item.id} {...item} />)
```

### Pitfall: Uncontrolled Components
```typescript
// ❌ Avoid
<input defaultValue={value} />

// ✅ Prefer
<input 
  value={value} 
  onChange={(e) => setValue(e.target.value)} 
/>
```

## Testing Approach

### Component Testing Pattern
```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component prop="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('handles user interaction', () => {
    const handleClick = jest.fn();
    render(<Component onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Testing with Providers
```typescript
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <MockedAccountProvider>
        {component}
      </MockedAccountProvider>
    </ThemeProvider>
  );
};
```

## Migration Guide

### Legacy Component Migration
1. Convert class components to functional components
2. Replace lifecycle methods with hooks
3. Update styling to styled-components
4. Add TypeScript interfaces
5. Implement proper error boundaries
6. Add loading states
7. Ensure mobile responsiveness

### Adding New Components
1. Create feature directory structure
2. Define TypeScript interfaces
3. Implement component with standard structure
4. Add styled-components styling
5. Integrate with contexts as needed
6. Add tests
7. Document complex logic

## Best Practices Checklist

- [ ] TypeScript interfaces for all props
- [ ] Proper error handling with user feedback
- [ ] Loading states for async operations
- [ ] Mobile-responsive design
- [ ] Memoization where appropriate
- [ ] Accessible markup and interactions
- [ ] Consistent naming conventions
- [ ] Separation of concerns
- [ ] Reusable sub-components extracted
- [ ] Tests for critical functionality