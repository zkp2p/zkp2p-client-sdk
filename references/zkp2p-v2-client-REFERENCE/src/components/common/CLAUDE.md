# CLAUDE.md - Common Components Documentation

## Overview

The common directory contains reusable UI components that form the foundation of the ZKP2P V2 client design system. These components provide consistent styling, behavior, and accessibility patterns across the entire application. They are designed to be composable, themeable, and responsive.

## Key Files and Structure

```
src/components/common/
├── Button.tsx              # Primary button component with loading states
├── Input.tsx               # Form input with labels, helpers, and accessories
├── ConnectButton.tsx       # Authentication and wallet connection
├── Card.tsx               # Container component for content cards
├── Layout.tsx             # Flexbox layout primitives (Row, Col)
├── Selector.tsx           # Dropdown selector component
├── Spinner.tsx            # Loading indicator
├── Tooltip.tsx            # Hover tooltip component
├── Popover.tsx            # Click-triggered popover component
├── QuestionHelper.tsx     # Help text with question mark icon
├── Checkbox.tsx           # Styled checkbox component
├── TransactionButton.tsx  # Transaction-specific button with states
├── TransactionIconButton.tsx # Icon-only transaction button
├── TextButton.tsx         # Text-only button for secondary actions
├── AccessoryButton.tsx    # Small utility buttons
├── CopyButton.tsx         # Copy-to-clipboard functionality
├── UsdcBalanceDisplay.tsx # Token balance with formatting
├── Breadcrumb.tsx         # Navigation breadcrumb
├── InstructionStep.tsx    # Step-by-step instruction display
├── NumberedStep.tsx       # Numbered instruction steps
├── Skeleton.tsx           # Loading placeholder component
├── WarningTextBox.tsx     # Warning message container
├── DragAndDropTextBox.tsx # File upload area
├── LabeledSwitch.tsx      # Toggle switch with label
├── LabeledTextArea.tsx    # Multi-line text input
├── SortableColumnHeader.tsx # Table column with sorting
├── TallySupportButton.tsx # External support integration
├── PersistentIFrames.tsx  # Lazy-loaded iframe container
├── FlatTooltip.tsx        # Simplified tooltip variant
├── ReadOnlyInput.tsx      # Non-editable input display
├── SimpleInput.tsx        # Minimal input variant
├── SingleLineInput.tsx    # Constrained text input
├── HorizontalInput.tsx    # Side-by-side label/input
└── InputWithSelector.tsx  # Input combined with dropdown
```

## Architecture Patterns

### Design System Integration

All components integrate with the centralized theme system:

```typescript
import { colors } from '@theme/colors';
import styled from 'styled-components';

const StyledComponent = styled.div`
  background: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  color: ${colors.darkText};
  
  &:hover {
    background: ${colors.selectorHover};
    border-color: ${colors.selectorHoverBorder};
  }
`;
```

### Composable Component Pattern

Components are designed to be composed together:

```typescript
// Pattern: Component composition with shared props
interface BaseComponentProps {
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps & BaseComponentProps> = ({
  fullWidth = false,
  disabled = false,
  loading = false,
  // ... other props
}) => {
  return (
    <BaseButton
      $fullWidth={fullWidth}
      $disabled={disabled}
      $loading={loading}
    >
      {loading ? <Spinner /> : children}
    </BaseButton>
  );
};
```

### Accessibility-First Design

Components include proper accessibility attributes:

```typescript
// Pattern: Built-in accessibility
const Input: React.FC<InputProps> = ({ label, name, helperText }) => {
  return (
    <Container>
      <Label htmlFor={name}>
        {label}
      </Label>
      
      {helperText && (
        <QuestionHelper
          text={helperText}
          aria-describedby={`${name}-helper`}
        />
      )}
      
      <StyledInput
        id={name}
        name={name}
        aria-describedby={helperText ? `${name}-helper` : undefined}
        spellCheck="false"
        autoComplete="off"
        data-1p-ignore // Disable password managers
      />
    </Container>
  );
};
```

### Responsive Design Pattern

Components adapt to different screen sizes:

```typescript
// Pattern: Device-aware component behavior
const ConnectButton: React.FC = () => {
  const currentDeviceSize = useMediaQuery();
  const isMobile = currentDeviceSize === 'mobile';
  
  return (
    <AccountContainer>
      {!isMobile && <UsdcBalanceDisplay integrated />}
      {!isMobile && <VerticalDivider />}
      <LoggedInButton>
        {isMobile ? 'Log In' : 'Connect Wallet'}
      </LoggedInButton>
    </AccountContainer>
  );
};
```

## Key Component Categories

### Form Components

**Input.tsx** - Primary form input component
- Features: Labels, placeholders, helper text, accessories, max buttons
- States: Default, focused, disabled, locked, read-only
- Accessibility: Proper labeling, focus management, screen reader support

```typescript
<Input
  label="Amount"
  name="amount"
  value={amount}
  onChange={handleAmountChange}
  placeholder="0.00"
  accessoryLabel="Balance: 1,000 USDC"
  helperText="Minimum swap amount is 10 USDC"
  enableMax
  maxButtonOnClick={() => setAmount(maxAmount)}
  inputLabel="USDC"
/>
```

**Selector.tsx** - Dropdown selection component
- Features: Search functionality, custom options, keyboard navigation
- Integration: Works with currency, token, and platform selectors

### Button Components

**Button.tsx** - Primary action button
- Features: Loading states, icons, full-width variants, SVG overlays
- States: Default, hover, active, disabled, loading

```typescript
<Button
  fullWidth
  loading={isSubmitting}
  disabled={!isValid}
  leftAccessorySvg={platformIcon}
  onClick={handleSubmit}
>
  Create Swap Intent
</Button>
```

**TransactionButton.tsx** - Blockchain transaction button
- Features: Transaction state management, error handling
- Integration: Works with smart account system and gas sponsorship

**ConnectButton.tsx** - Authentication and wallet connection
- Features: Multi-wallet support, ENS resolution, balance display
- Integration: Privy authentication, smart account status

### Display Components

**UsdcBalanceDisplay.tsx** - Token balance formatting
- Features: Real-time balance updates, formatting, integration modes
- States: Loading, error, integrated/standalone display

**Card.tsx** - Content container component
- Features: Consistent spacing, borders, background
- Variants: Default, highlighted, interactive

### Utility Components

**Spinner.tsx** - Loading indicator
- Features: Consistent animation, size variants
- Usage: Button loading states, page transitions, data fetching

**Tooltip.tsx & Popover.tsx** - Contextual help
- Features: Positioning, click/hover triggers, portal rendering
- Accessibility: Focus trapping, escape key handling

**QuestionHelper.tsx** - Inline help text
- Features: Question mark icon with tooltip
- Variants: Different sizes, lock icons for restricted features

## Development Guidelines

### Component Structure Pattern

Follow this consistent structure for all components:

```typescript
// 1. Imports
import React from 'react';
import styled from 'styled-components';
import { colors } from '@theme/colors';

// 2. Interface definition
interface ComponentProps {
  required: string;
  optional?: boolean;
  children?: React.ReactNode;
}

// 3. Component implementation
export const Component: React.FC<ComponentProps> = ({
  required,
  optional = false,
  children
}) => {
  // 4. Hooks and state
  const [state, setState] = useState(initialValue);
  
  // 5. Event handlers
  const handleAction = () => {
    // Handler logic
  };
  
  // 6. Render
  return (
    <StyledContainer>
      {children}
    </StyledContainer>
  );
};

// 7. Styled components
const StyledContainer = styled.div`
  // Styles using theme values
`;
```

### Styling Guidelines

**Use Theme Values**: Always use centralized theme values
```typescript
// Good
background: ${colors.container};
padding: ${spacing.md};

// Bad
background: #1A1B1F;
padding: 16px;
```

**Responsive Design**: Mobile-first approach
```typescript
const ResponsiveComponent = styled.div`
  // Mobile styles (default)
  padding: 8px;
  
  // Tablet and up
  @media (min-width: 768px) {
    padding: 16px;
  }
`;
```

**State Management**: Use transient props for styled-components
```typescript
// Good - transient props don't appear in DOM
const Button = styled.button<{ $loading: boolean }>`
  opacity: ${props => props.$loading ? 0.5 : 1};
`;

// Bad - props appear in DOM
const Button = styled.button<{ loading: boolean }>`
  opacity: ${props => props.loading ? 0.5 : 1};
`;
```

### Accessibility Requirements

**Keyboard Navigation**: Support tab navigation and keyboard interactions
```typescript
const InteractiveComponent = styled.button`
  &:focus {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }
  
  &:focus:not(:focus-visible) {
    outline: none;
  }
`;
```

**Screen Reader Support**: Provide appropriate ARIA attributes
```typescript
<Button
  aria-label="Submit form"
  aria-describedby="submit-help"
  disabled={isSubmitting}
>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</Button>
```

**Color Contrast**: Ensure sufficient contrast ratios
```typescript
// Theme colors are designed for WCAG AA compliance
color: ${colors.darkText}; // High contrast on dark background
background: ${colors.container}; // Sufficient contrast ratio
```

## Testing Strategy

### Component Testing

Test component behavior and accessibility:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('should render children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should handle loading state', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Visual Regression Testing

Test component appearance across different states:

```typescript
describe('Button Visual States', () => {
  it('should render correctly in default state', () => {
    const { container } = render(<Button>Default</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('should render correctly in loading state', () => {
    const { container } = render(<Button loading>Loading</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

### Accessibility Testing

Use testing-library accessibility utilities:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Accessible Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Common Development Tasks

### Creating New Common Components

1. **Define the interface**:
```typescript
interface NewComponentProps {
  required: string;
  optional?: boolean;
  variant?: 'primary' | 'secondary';
  children?: React.ReactNode;
}
```

2. **Implement the component**:
```typescript
export const NewComponent: React.FC<NewComponentProps> = ({
  required,
  optional = false,
  variant = 'primary',
  children
}) => {
  return (
    <StyledContainer $variant={variant}>
      {children}
    </StyledContainer>
  );
};
```

3. **Add styled components**:
```typescript
const StyledContainer = styled.div<{ $variant: string }>`
  background: ${({ $variant }) => 
    $variant === 'primary' ? colors.buttonDefault : colors.buttonSecondary
  };
`;
```

4. **Write tests**:
```typescript
describe('NewComponent', () => {
  it('should render with correct variant', () => {
    render(<NewComponent required="test" variant="secondary" />);
    // Test implementation
  });
});
```

### Extending Existing Components

Add new features while maintaining backward compatibility:

```typescript
// Extend existing props interface
interface ExtendedButtonProps extends ButtonProps {
  newFeature?: boolean;
}

export const ExtendedButton: React.FC<ExtendedButtonProps> = ({
  newFeature = false,
  ...buttonProps
}) => {
  return (
    <Button {...buttonProps}>
      {newFeature && <NewFeatureIcon />}
      {buttonProps.children}
    </Button>
  );
};
```

### Theme Integration

Add new theme values for components:

```typescript
// In theme/colors.tsx
export const colors = {
  // ... existing colors
  newComponentBackground: '#1A1B1F',
  newComponentBorder: '#3A3B3F',
  newComponentText: '#FFFFFF',
};

// In component
const StyledNewComponent = styled.div`
  background: ${colors.newComponentBackground};
  border: 1px solid ${colors.newComponentBorder};
  color: ${colors.newComponentText};
`;
```

## Integration Points

### Context Dependencies

Common components integrate with:
- **Theme System**: Colors, spacing, typography
- **MediaQuery Hook**: Responsive behavior
- **Account Context**: Authentication state
- **Modal Context**: Overlay management

### Form Integration

Form components work with:
- **React Hook Form**: Validation and state management
- **Custom validation hooks**: Business logic validation
- **Error handling**: Display validation errors

### Transaction Integration

Transaction components integrate with:
- **Smart Account System**: Gas sponsorship and UserOperations
- **Wallet Context**: Connection state and switching
- **Error handling**: Transaction failure management

## Performance Considerations

### Memoization

Use React.memo for expensive components:

```typescript
export const ExpensiveComponent = React.memo<ComponentProps>(({
  data,
  onAction
}) => {
  // Expensive rendering logic
  return <ComplexUI data={data} onAction={onAction} />;
});
```

### Event Handler Optimization

Use useCallback for event handlers:

```typescript
const Component: React.FC = () => {
  const handleClick = useCallback(() => {
    // Handler logic
  }, [dependency]);
  
  return <Button onClick={handleClick}>Click me</Button>;
};
```

### Bundle Size Optimization

Use tree shaking and dynamic imports:

```typescript
// Instead of importing entire libraries
import { debounce } from 'lodash';

// Import only what you need
import debounce from 'lodash/debounce';
```

Remember: Common components should be reusable, accessible, and consistent with the design system. They form the building blocks of the entire application UI.