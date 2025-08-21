# CLAUDE.md - Layout Components Documentation

## Overview

The layouts directory contains navigation and structural components that provide the foundational UI architecture for the ZKP2P V2 client. These components handle responsive navigation, device detection, and consistent layout patterns across the application.

## Key Files and Structure

```
src/components/layouts/
├── TopNav/
│   ├── index.tsx           # Primary navigation bar with logo and auth
│   └── NavItem.tsx         # Individual navigation items with active states
├── BottomNav/
│   └── index.tsx           # Mobile bottom navigation bar
├── Column/
│   └── index.tsx           # Flexbox column layout utility
├── Row/
│   └── index.tsx           # Flexbox row layout utility
├── MenuDropdown/
│   └── index.tsx           # Dropdown menu component
└── EnvironmentBanner.tsx   # Development environment indicator
```

## Architecture Patterns

### Responsive Navigation Strategy

The application uses a dual navigation system that adapts to device size:

```typescript
// TopNav.tsx - Device-aware navigation rendering
export const TopNav: React.FC<{ withoutLinks?: boolean }> = ({ withoutLinks }) => {
  const currentDeviceSize = useMediaQuery();
  
  if (currentDeviceSize === 'mobile') {
    return (
      <NavBar>
        <Logo />
        <CustomConnectButton height={40}/>
      </NavBar>
    );
  } else {
    return (
      <NavBar>
        <LogoAndNavItems>
          <Logo />
          {(currentDeviceSize === 'laptop' || currentDeviceSize === 'tablet') && (
            <NavItem selectedItem={selectedItem} setSelectedItem={setSelectedItem} />
          )}
        </LogoAndNavItems>
        <CustomConnectButton height={40} />
      </NavBar>
    );
  }
};
```

### Route-Based Active State Management

Navigation components maintain active state based on current route:

```typescript
// Pattern: Route-driven active state
const location = useLocation();
const [selectedItem, setSelectedItem] = useState<string>('Landing');

useEffect(() => {
  const routeName = location.pathname.split('/')[1];
  setSelectedItem(routeName || 'Landing');
}, [location]);
```

### Conditional Navigation Rendering

Support for different navigation modes based on context:

```typescript
// Pattern: Context-driven navigation
export const TopNav: React.FC<{ withoutLinks?: boolean }> = ({ withoutLinks }) => {
  return (
    <NavBar>
      {withoutLinks ? (
        <NavBarCentered>
          <Logo />
        </NavBarCentered>
      ) : (
        <LogoAndNavItems>
          <Logo />
          <NavItem />
        </LogoAndNavItems>
      )}
    </NavBar>
  );
};
```

## Key Layout Components

### TopNav - Primary Navigation

**Purpose**: Main navigation bar with logo, navigation items, and authentication controls

**Key Features**:
- Responsive design with mobile/desktop variants
- Logo with programmatic navigation using query preservation
- Integration with authentication system
- Conditional rendering based on `withoutLinks` prop

**Device Behavior**:
- **Mobile**: Logo-only with connect button
- **Tablet/Desktop**: Full navigation with nav items

**Styling Patterns**:
```typescript
const NavBar = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.75rem 1.75rem 1.5rem; 

  @media (min-width: 600px) {
    padding: 28px;
  }

  @media (max-width: 1024px) {
    padding: 1.5rem 1rem 1.75rem 1rem;
  }
`;
```

### BottomNav - Mobile Navigation

**Purpose**: Fixed bottom navigation for mobile devices

**Key Features**:
- Fixed positioning with proper z-index management  
- Reuses NavItem component with top indicator
- Dark background with subtle border

**Integration**:
```typescript
// App.tsx - Conditional mobile navigation
{(currentDeviceSize === 'mobile') &&
  <BottomNav />
}
```

**Styling Approach**:
```typescript
const Wrapper = styled.div`
  display: flex;
  width: 100%;
  z-index: ${Z_INDEX.bottom_nav};
  position: fixed;
  bottom: 0;
`;

const NavItemWrapper = styled.div`
  background: #0D111C;
  border-top: 1px solid #98a1c03d;
  padding: 16px 24px;
  width: 100%;
`;
```

### NavItem - Navigation Links

**Purpose**: Individual navigation items with active state management

**Key Features**:
- Active state indication with visual feedback
- Support for top and bottom indicator positions
- Route-based state management
- Programmatic navigation with query preservation

**Props Interface**:
```typescript
interface NavItemProps {
  selectedItem: string;
  setSelectedItem: (item: string) => void;
  indicatorPosition?: 'top' | 'bottom';
}
```

### Layout Utilities (Row/Column)

**Purpose**: Flexbox-based layout primitives for consistent spacing

**Column Component**:
```typescript
export const Column = styled.div`
  display: flex;
  flex-direction: column;
`;
```

**Row Component**:
```typescript
export const Row = styled.div`
  display: flex;
  align-items: center;
`;
```

**Usage Pattern**:
```typescript
<Column gap={16}>
  <Row justifyContent="space-between">
    <HeaderText>Title</HeaderText>
    <ActionButton />
  </Row>
  <ContentArea />
</Column>
```

### EnvironmentBanner

**Purpose**: Development environment indicator for non-production builds

**Key Features**:
- Environment detection
- Non-intrusive banner design
- Development workflow integration

## Development Guidelines

### Responsive Design Patterns

Use the established device detection pattern:

```typescript
const currentDeviceSize = useMediaQuery();
const isMobile = currentDeviceSize === 'mobile';
const isTablet = currentDeviceSize === 'tablet';
const isDesktop = currentDeviceSize === 'laptop';

// Conditional rendering
{isMobile ? <MobileComponent /> : <DesktopComponent />}

// Conditional styling
const StyledComponent = styled.div<{ $isMobile: boolean }>`
  padding: ${props => props.$isMobile ? '16px' : '24px'};
`;
```

### Navigation State Management

Follow the established pattern for route-based active states:

```typescript
const location = useLocation();
const [selectedItem, setSelectedItem] = useState<string>('Landing');

useEffect(() => {
  const routeName = location.pathname.split('/')[1];
  setSelectedItem(routeName || 'Landing');
}, [location]);
```

### Z-Index Management

Use the centralized z-index system:

```typescript
import { Z_INDEX } from '@theme/zIndex';

const FixedComponent = styled.div`
  position: fixed;
  z-index: ${Z_INDEX.bottom_nav};
`;
```

### Logo and Branding

Maintain consistent logo implementation:

```typescript
const Logo = styled(Link)<{ size?: number }>`
  img {
    width: ${({ size }) => size || 32}px;
    height: ${({ size }) => size || 32}px;
    object-fit: cover;
  }
`;

// Usage with environment variable
<img src={`${import.meta.env.VITE_PUBLIC_URL || ''}/logo192.png`} alt="logo" />
```

### Query Preservation Navigation

Use the query preservation pattern for navigation:

```typescript
const { navigateWithQuery } = useQuery();

const handleLogoClick = (e) => {
  e.preventDefault();
  navigateWithQuery('/');
  setSelectedItem('Landing');
};
```

## Styling Architecture

### Theme Integration

Layout components integrate with the centralized theme system:

```typescript
import { colors } from '@theme/colors';
import { Z_INDEX } from '@theme/zIndex';

const StyledComponent = styled.div`
  background: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  z-index: ${Z_INDEX.navigation};
`;
```

### Media Query Patterns

Follow established breakpoint patterns:

```typescript
const ResponsiveComponent = styled.div`
  // Mobile first
  padding: 1rem;
  
  // Tablet
  @media (min-width: 600px) {
    padding: 1.5rem;
  }
  
  // Desktop
  @media (min-width: 1024px) {
    padding: 2rem;
  }
`;
```

### Color and Spacing Consistency

Use theme values for consistent design:

```typescript
const NavigationItem = styled.button`
  color: ${colors.white};
  background: ${colors.container};
  padding: ${spacing.md};
  border: 1px solid ${colors.defaultBorderColor};
  
  &:hover {
    background: ${colors.selectorHover};
    border-color: ${colors.selectorHoverBorder};
  }
`;
```

## Testing Strategy

### Component Testing

Test responsive behavior and state management:

```typescript
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TopNav } from '../TopNav';

// Mock useMediaQuery hook
jest.mock('@hooks/useMediaQuery');

describe('TopNav', () => {
  it('should render mobile layout on mobile devices', () => {
    (useMediaQuery as jest.Mock).mockReturnValue('mobile');
    
    render(
      <BrowserRouter>
        <TopNav />
      </BrowserRouter>
    );
    
    expect(screen.getByAltText('logo')).toBeInTheDocument();
    expect(screen.queryByTestId('nav-items')).not.toBeInTheDocument();
  });

  it('should render desktop layout on larger screens', () => {
    (useMediaQuery as jest.Mock).mockReturnValue('laptop');
    
    render(
      <BrowserRouter>
        <TopNav />
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('nav-items')).toBeInTheDocument();
  });
});
```

### Navigation Testing

Test route-based active state management:

```typescript
it('should update active state based on current route', () => {
  const mockLocation = { pathname: '/swap' };
  jest.spyOn(require('react-router-dom'), 'useLocation')
    .mockReturnValue(mockLocation);
    
  render(<NavItem />);
  
  expect(screen.getByText('Swap')).toHaveClass('active');
});
```

## Common Development Tasks

### Adding New Navigation Items

1. **Update NavItem component** with new route:
```typescript
const navigationItems = [
  { name: 'Migrate', path: '/', routeName: 'Landing', icon: RefreshCw },
  { name: 'Buy', path: '/swap', routeName: 'swap', icon: Repeat },
  { name: 'Sell', path: '/pool', routeName: 'pool', icon: Download },
  { name: 'Liquidity', path: '/liquidity', routeName: 'liquidity', icon: DollarSign },
];
```

2. **Add route to App.tsx**:
```typescript
<Route path="/new-item" element={<NewItemPage />} />
```

3. **Update active state logic** if needed

### Customizing Navigation Behavior

For context-specific navigation needs:

```typescript
// Conditional navigation rendering
const shouldShowNavigation = useContext(SomeContext);

return (
  <TopNav withoutLinks={!shouldShowNavigation} />
);
```

### Adding New Layout Utilities

Follow the established pattern for new layout components:

```typescript
// src/components/layouts/Grid/index.tsx
export const Grid = styled.div<{ columns: number; gap?: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.columns}, 1fr);
  gap: ${props => props.gap || 16}px;
`;

// Usage
<Grid columns={3} gap={24}>
  <GridItem />
  <GridItem />
  <GridItem />
</Grid>
```

### Environment-Specific Features

Add environment detection for development features:

```typescript
const isDevelopment = import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT === 'LOCAL';

return (
  <>
    {isDevelopment && <DevelopmentBanner />}
    <MainNavigation />
  </>
);
```

## Integration Points

### Context Dependencies

Layout components integrate with:
- **useMediaQuery**: Device size detection
- **useQuery**: Navigation with query preservation  
- **AccountContext**: Authentication state for connect button
- **React Router**: Location and navigation

### Component Communication

Layout components communicate through:
- **Props**: Configuration and callback functions
- **Context**: Global application state
- **Router state**: URL-based active states

### Theme System Integration

All layout components use:
- **colors**: Consistent color palette
- **Z_INDEX**: Layering management
- **media queries**: Responsive breakpoints
- **spacing**: Consistent spacing scale

## Performance Considerations

### Responsive Design Optimization

Minimize layout thrashing with proper media queries:

```typescript
// Use CSS media queries instead of JavaScript when possible
const ResponsiveComponent = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

// Rather than
const ResponsiveComponent = () => {
  const isMobile = useMediaQuery();
  return isMobile ? null : <Component />;
};
```

### Navigation State Optimization

Debounce route changes for smooth navigation:

```typescript
const [selectedItem, setSelectedItem] = useState<string>('Landing');

useEffect(() => {
  const timeoutId = setTimeout(() => {
    const routeName = location.pathname.split('/')[1];
    setSelectedItem(routeName || 'Landing');
  }, 100);
  
  return () => clearTimeout(timeoutId);
}, [location]);
```

### Memory Management

Clean up event listeners and subscriptions:

```typescript
useEffect(() => {
  const handleResize = () => {
    // Handle resize logic
  };
  
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

Remember: Layout components should focus on structure and navigation while remaining flexible enough to support various content types and user flows.