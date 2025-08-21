# Legacy Components - Development Context

## Overview
This directory contains deprecated React components that remain in the codebase for backward compatibility or reference. These components represent earlier architectural decisions and should not be used in new development. They demonstrate the evolution from basic implementations to the current sophisticated component system.

## Key Files and Structure
```
src/components/legacy/
├── Layout.tsx          # Basic flexbox layout component
├── LabeledTextArea.tsx # Complex textarea with validation
└── StyledLink.tsx      # Simple styled link wrapper
```

## Architecture Patterns

### Legacy Component Characteristics
These components exhibit patterns that have been superseded:
- Hardcoded style values instead of theme integration
- Limited TypeScript typing
- Tightly coupled logic and presentation
- Inline styles over styled-components
- Missing accessibility features

### Component Analysis

#### Layout.tsx - Basic Flexbox Container
**Purpose**: Generic flexbox container with customizable properties

**Implementation**:
```typescript
interface LayoutProps {
  flexDirection?: 'row' | 'column';
  justifyContent?: string;
  alignItems?: string;
  gap?: number;
  padding?: string;
  margin?: string;
  width?: string;
  height?: string;
}

const Layout: React.FC<LayoutProps> = ({
  flexDirection = 'row',
  justifyContent = 'flex-start',
  alignItems = 'stretch',
  gap = 0,
  ...props
}) => {
  // Direct style object creation
  const style = {
    display: 'flex',
    flexDirection,
    justifyContent,
    alignItems,
    gap: `${gap}px`,
    ...props
  };
  
  return <div style={style}>{children}</div>;
};
```

**Issues**:
- No theme integration
- Hardcoded pixel values
- Missing responsive design support
- No semantic HTML elements

**Modern Replacement**:
```typescript
// Use styled-components with theme
const FlexContainer = styled.div<FlexProps>`
  display: flex;
  flex-direction: ${props => props.direction || 'row'};
  justify-content: ${props => props.justify || 'flex-start'};
  align-items: ${props => props.align || 'stretch'};
  gap: ${props => props.theme.spacing[props.gap] || 0};
  
  ${props => props.responsive && css`
    @media (max-width: ${props.theme.breakpoints.mobile}) {
      flex-direction: column;
    }
  `}
`;
```

#### LabeledTextArea.tsx - Form Textarea with Validation
**Purpose**: Multi-line text input with label, validation, and secret display

**Implementation Highlights**:
```typescript
interface LabeledTextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isSecret?: boolean;
  isDisabled?: boolean;
  rows?: number;
  validate?: (value: string) => string | null;
}

const LabeledTextArea: React.FC<LabeledTextAreaProps> = ({
  label,
  value,
  onChange,
  isSecret = false,
  validate,
  ...props
}) => {
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (validate) {
      setError(validate(newValue));
    }
  };
  
  const displayValue = isSecret && !showSecret 
    ? '•'.repeat(value.length) 
    : value;
  
  return (
    <div className="labeled-textarea">
      <label>{label}</label>
      <textarea
        value={displayValue}
        onChange={handleChange}
        className={error ? 'error' : ''}
        {...props}
      />
      {isSecret && (
        <button onClick={() => setShowSecret(!showSecret)}>
          {showSecret ? 'Hide' : 'Show'}
        </button>
      )}
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};
```

**Useful Features** (Worth Preserving):
- Secret value toggling functionality
- Built-in validation with error display
- Flexible rows configuration

**Issues**:
- Class-based styling instead of styled-components
- No theme integration for colors/spacing
- Missing ARIA attributes for accessibility
- Validation logic should be extracted

**Modern Replacement**:
```typescript
// Use form libraries like react-hook-form
import { useForm } from 'react-hook-form';
import { TextArea } from '@components/common/FormElements';

const ModernTextArea = () => {
  const { register, formState: { errors } } = useForm();
  
  return (
    <TextArea
      {...register('field', { 
        required: 'This field is required',
        validate: customValidator
      })}
      error={errors.field?.message}
      isSecret
    />
  );
};
```

#### StyledLink.tsx - Simple Link Component
**Purpose**: Basic styled link wrapper

**Implementation**:
```typescript
interface StyledLinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
}

const StyledLink: React.FC<StyledLinkProps> = ({
  href,
  children,
  external = false,
  className
}) => {
  const linkProps = external 
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};
  
  return (
    <a 
      href={href}
      className={`styled-link ${className || ''}`}
      {...linkProps}
    >
      {children}
      {external && <ExternalLinkIcon />}
    </a>
  );
};
```

**Issues**:
- String concatenation for classes
- No routing integration (React Router)
- Basic external link handling
- Missing hover/focus states

**Modern Replacement**:
```typescript
// Use React Router and styled-components
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const StyledRouterLink = styled(Link)`
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  transition: color 0.2s;
  
  &:hover {
    color: ${props => props.theme.colors.primaryHover};
  }
  
  &:focus-visible {
    outline: 2px solid ${props => props.theme.colors.focus};
  }
`;
```

## Development Guidelines

### Migration Strategy

#### Step 1: Identify Usage
```bash
# Find components still using legacy components
grep -r "from '@components/legacy" src/
```

#### Step 2: Replace with Modern Equivalents
- `Layout` → Use styled-components flexbox utilities
- `LabeledTextArea` → Use form component library
- `StyledLink` → Use Router Link with styling

#### Step 3: Preserve Useful Features
Extract valuable functionality like:
- Secret value toggling logic
- Validation patterns
- External link handling

### When to Keep Legacy Components
Keep legacy components when:
- Active features depend on them
- Migration risk is high
- They contain complex business logic
- Gradual migration is in progress

### When to Remove
Remove when:
- No active usage found
- Modern replacements are tested
- All dependencies are updated
- Team agrees on removal

## Testing Strategy

### Legacy Component Tests
```typescript
describe('Legacy Components', () => {
  describe('LabeledTextArea', () => {
    it('should toggle secret visibility', () => {
      const { getByRole, getByText } = render(
        <LabeledTextArea
          label="Secret"
          value="password123"
          onChange={jest.fn()}
          isSecret
        />
      );
      
      // Initially hidden
      expect(getByRole('textbox')).toHaveValue('•••••••••••');
      
      // Toggle to show
      fireEvent.click(getByText('Show'));
      expect(getByRole('textbox')).toHaveValue('password123');
    });
  });
});
```

### Migration Tests
Ensure feature parity when migrating:
```typescript
// Test both old and new components
it('should maintain feature parity', () => {
  const legacyResult = renderLegacyComponent(props);
  const modernResult = renderModernComponent(props);
  
  expect(modernResult).toMatchFunctionality(legacyResult);
});
```

## Common Tasks

### Extracting Useful Logic
```typescript
// Extract secret toggle logic for reuse
export const useSecretToggle = (initialValue: string) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const displayValue = isVisible 
    ? initialValue 
    : '•'.repeat(initialValue.length);
  
  const toggleVisibility = () => setIsVisible(!isVisible);
  
  return { displayValue, isVisible, toggleVisibility };
};
```

### Creating Migration Wrapper
```typescript
// Temporary wrapper during migration
const LayoutMigrationWrapper: React.FC<LayoutProps> = (props) => {
  if (process.env.USE_LEGACY_LAYOUT) {
    return <LegacyLayout {...props} />;
  }
  return <ModernFlexContainer {...mapPropsToModern(props)} />;
};
```

## Integration Points

### Style Migration Path
Legacy: Inline styles → CSS classes → CSS Modules → Styled Components

### Form Integration Evolution
Legacy: Controlled components → Form libraries → Integrated validation

### Routing Evolution
Legacy: Window.location → React Router v5 → React Router v6

## Security Considerations

### Legacy Security Issues
- Missing input sanitization
- No XSS protection in some components
- Unsafe external link handling
- Missing CSRF protection

### Modern Security Practices
- Input validation and sanitization
- Content Security Policy compliance
- Safe external link handling
- Proper authentication checks

## Performance Considerations

### Legacy Performance Issues
- Unnecessary re-renders
- Missing memoization
- Inline function declarations
- Large bundle size from unused code

### Optimization Opportunities
- Implement React.memo for pure components
- Extract and memoize callbacks
- Lazy load when possible
- Tree-shake unused legacy code

## Lessons Learned

### What Worked
- Simple, understandable components
- Secret value functionality
- Basic validation patterns
- Flexibility in props

### What Didn't Work
- Hardcoded values limiting flexibility
- Missing theme integration
- Poor TypeScript typing
- Lack of accessibility features

### Best Practices Going Forward
- Always use theme system for styling
- Implement comprehensive TypeScript types
- Include accessibility from the start
- Write components with testing in mind
- Document deprecation clearly
- Plan migration paths early