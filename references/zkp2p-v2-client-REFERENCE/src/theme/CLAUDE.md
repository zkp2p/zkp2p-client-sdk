# Theme - Development Context

## Overview

The theme directory contains the design system for the ZKP2P V2 client, including colors, typography, spacing, responsive breakpoints, and z-index management. The system uses a hybrid approach where most components import design tokens directly, while some use styled-components theme context for dynamic theming.

## Key Files and Structure

```
src/theme/
├── colors.tsx         # Color palette and opacity utilities (76 tokens)
├── fonts.tsx          # Font families and font-face declarations
├── text.tsx           # ThemedText component library (15 variants)
├── media.tsx          # Responsive breakpoints and device queries
├── spacing.tsx        # Spacing scale and layout utilities
├── zIndex.tsx         # Z-index layering system (enum)
└── index.tsx          # Theme object composition and export
```

## Architecture Patterns

### Direct Token Access Pattern (Primary)
Most components import design tokens directly for explicit control:

```typescript
// Component file
import { colors } from '@theme/colors';
import { ThemedText } from '@theme/text';
import { Z_INDEX } from '@theme/zIndex';

const StyledComponent = styled.div`
  background: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  z-index: ${Z_INDEX.modal};
`;
```

### Theme Context Pattern (Secondary)
Used selectively in components that need dynamic theming:

```typescript
// Theme-aware component
const ThemedComponent = styled.div`
  ${({ theme }) => `
    background: ${theme.colors.container};
    color: ${theme.colors.darkText};
  `}
`;
```

### Mixed Pattern Reality
Many components use both approaches:

```typescript
// Real-world example from modals
import { colors } from '@theme/colors';  // Direct import

const ModalOverlay = styled.div`
  background: ${colors.blackOpacity50};  // Direct usage
  
  ${({ theme }) => `
    z-index: ${theme.zIndex.modalOverlay};  // Theme context
  `}
`;
```

## Color System

### Complete Palette (76 tokens)
```typescript
export const colors = {
  // Primary UI Colors
  container: '#1A1B1F',              // Main container background
  defaultBorderColor: '#98a1c03d',   // Default borders
  buttonDefault: '#6D7282',          // Primary buttons
  buttonHover: '#5B5F6B',            // Button hover state
  
  // Text Colors
  white: '#FFFFFF',                  // Primary text
  darkText: '#0E111C',              // Dark mode text
  grayText: '#9CA3AF',              // Secondary text
  lightGrayText: '#d3d3d3',         // Tertiary text
  
  // Status Colors
  warningRed: '#F44061',            // Errors and warnings
  successGreen: '#00D311',          // Success states
  greenForButton: '#40D09C',        // Action buttons
  usdcBlue: '#2774CA',              // USDC branding
  
  // Interactive States
  selectorHover: '#3E4252',         // Dropdown hover
  selectorHoverBorder: '#5B5F6B',   // Dropdown hover border
  activeGreen: '#5ED40A',           // Active indicators
  
  // Special Purpose
  inversePrimarySoft: '#E8E8E8',    // Soft inverse
  blackOpacity50: 'rgba(0, 0, 0, 0.5)', // Modal overlays
  zkp2pGreen: '#13D592',            // Brand color
  
  // ... 50+ more tokens
};
```

### Opacity Utility
```typescript
export function opacify(amount: number, hexColor: string): string {
  // Validates hex color format
  if (!hexColor.match(/^#[0-9A-F]{6}$/i)) {
    return hexColor;
  }
  
  // Clamps opacity between 0-255
  const opacity = Math.round(Math.min(Math.max(amount || 1, 0), 1) * 255);
  return hexColor + opacity.toString(16).toUpperCase();
}

// Usage
const fadedBackground = opacify(0.5, colors.container); // '#1A1B1F80'
```

## Typography System

### ThemedText Components
```typescript
// Headline Components
ThemedText.Hero         // 72px, weight 535, line 90px
ThemedText.HeadlineLarge // 48px, weight 500, line 56px  
ThemedText.HeadlineMedium // 36px, weight 535, line 44px
ThemedText.HeadlineSmall // 28px, weight 535, line 36px
ThemedText.SubHeader     // 20px, weight 535, line 28px
ThemedText.SubHeaderLarge // 24px, weight 500, line 32px
ThemedText.SubHeaderSmall // 16px, weight 535, line 24px

// Body Text
ThemedText.BodyPrimary    // 16px, weight 400, line 24px
ThemedText.BodySecondary  // 14px, weight 400, line 20px
ThemedText.LabelSmall     // 12px, weight 535, line 16px
ThemedText.Caption        // 12px, weight 400, line 16px

// Interactive Elements  
ThemedText.Link          // Inherits size, weight 500, blue color
ThemedText.UtilityButton // 12px, weight 700, line 16px
ThemedText.DeprecatedMain // 16px, weight 500 (legacy)
ThemedText.DeprecatedLink // 14px, weight 535 (legacy)
```

### Usage Patterns
```typescript
// Standard typography
<ThemedText.HeadlineMedium>Page Title</ThemedText.HeadlineMedium>
<ThemedText.BodyPrimary>Body content here</ThemedText.BodyPrimary>

// Custom styling
<ThemedText.BodySecondary style={{ color: colors.grayText }}>
  Secondary information
</ThemedText.BodySecondary>

// Link with hover
<ThemedText.Link onClick={handleClick}>
  Click here
</ThemedText.Link>
```

## Responsive Design

### Breakpoint System
```typescript
export const MEDIA_SIZE = {
  mobile: 425,    // Mobile devices
  tablet: 768,    // Tablets  
  laptop: 1024    // Desktop/laptop
};

// Device queries
export const device = {
  mobile: `(max-width: ${MEDIA_SIZE.mobile}px)`,
  tablet: `(max-width: ${MEDIA_SIZE.tablet}px)`,
  laptop: `(max-width: ${MEDIA_SIZE.laptop}px)`
};
```

### Mobile-First Approach
```typescript
const ResponsiveComponent = styled.div`
  // Mobile styles (default)
  padding: 8px;
  font-size: 14px;
  
  // Tablet and up
  @media (min-width: ${MEDIA_SIZE.mobile + 1}px) {
    padding: 16px;
    font-size: 16px;
  }
  
  // Desktop and up
  @media (min-width: ${MEDIA_SIZE.tablet + 1}px) {
    padding: 24px;
    font-size: 18px;
  }
`;
```

### Common Responsive Patterns
```typescript
// Grid layouts
const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  
  @media (min-width: ${MEDIA_SIZE.tablet}px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: ${MEDIA_SIZE.laptop}px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

// Text sizing
const ResponsiveText = styled(ThemedText.HeadlineLarge)`
  font-size: 32px;
  
  @media (min-width: ${MEDIA_SIZE.mobile}px) {
    font-size: 40px;
  }
`;
```

## Z-Index Management

### Centralized Z-Index System
```typescript
export enum Z_INDEX {
  // Base layers (1-10)
  grid_guide = 1,
  page_background = 5,
  
  // Content layers (10-100)  
  sticky_table = 40,
  hover_element = 50,
  above_chart = 99,
  
  // Navigation (100-200)
  bottom_nav = 100,
  navigation = 150,
  landing_hero = 152,
  
  // Overlays (200-500)
  expanded_add_liquidity_widget = 200,
  swap_settings = 250,
  sidebar = 300,
  expanded_swap_widget = 350,
  dropdown = 400,
  
  // Modals (500-1000)
  modal = 500,
  modalOverlay = 600,
  tooltip = 700,
  popover = 750,
  
  // Critical overlays (1000+)
  alert = 1000
}
```

### Usage Guidelines
```typescript
// Modal with proper layering
const Modal = styled.div`
  z-index: ${Z_INDEX.modal};
`;

const ModalOverlay = styled.div`
  z-index: ${Z_INDEX.modalOverlay};
`;

// Tooltip above modal
const Tooltip = styled.div`
  z-index: ${Z_INDEX.tooltip};
`;
```

## Development Guidelines

### Adding New Colors
```typescript
// 1. Add to colors.tsx
export const colors = {
  // ... existing colors
  newFeatureAccent: '#FF6B6B',
  newFeatureBackground: '#2A2B2F'
};

// 2. Use in components
import { colors } from '@theme/colors';

const FeatureCard = styled.div`
  background: ${colors.newFeatureBackground};
  border-left: 3px solid ${colors.newFeatureAccent};
`;
```

### Creating Custom Text Components
```typescript
// Extend ThemedText for feature-specific typography
const FeatureTitle = styled(ThemedText.HeadlineSmall)`
  color: ${colors.zkp2pGreen};
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

// Or create from scratch
const CustomText = styled.div`
  font-family: ${fonts.text};
  font-size: 18px;
  font-weight: 600;
  line-height: 1.5;
`;
```

### Responsive Component Development
```typescript
// Mobile-first component
const FeatureSection = styled.section`
  // Base mobile styles
  padding: ${({ theme }) => theme.spacing.md};
  
  // Progressive enhancement
  @media (min-width: ${MEDIA_SIZE.tablet}px) {
    padding: ${({ theme }) => theme.spacing.lg};
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
`;
```

## Integration Patterns

### Theme Object Structure
```typescript
// src/theme/index.tsx
export const theme = {
  colors: { ...colors },
  fonts,
  spacing,
  zIndex: Z_INDEX,
  media: MEDIA_SIZE
};

// Usage in styled-components ThemeProvider
<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>
```

### Component Usage Examples
```typescript
// Mixed approach (common in codebase)
import { colors } from '@theme/colors';
import { ThemedText } from '@theme/text';

const Card = styled.div`
  // Direct import
  background: ${colors.container};
  
  // Theme context
  ${({ theme }) => `
    padding: ${theme.spacing.lg};
    z-index: ${theme.zIndex.dropdown};
  `}
`;

const CardTitle = () => (
  <ThemedText.HeadlineSmall>
    Card Title
  </ThemedText.HeadlineSmall>
);
```

## Common Tasks

### Update Brand Colors
1. Modify primary colors in `colors.tsx`
2. Update `zkp2pGreen` and related brand tokens
3. Check components using brand colors
4. Test color contrast for accessibility

### Add New Typography Variant
1. Create new component in `text.tsx`
2. Define font size, weight, line-height
3. Export from ThemedText namespace
4. Document usage guidelines

### Implement Dark/Light Mode
1. Create color mapping objects
2. Implement theme context switching
3. Update components to use theme colors
4. Add mode toggle component

## Best Practices

### Color Usage
- Use semantic color names (`warningRed` not `red`)
- Maintain consistent opacity patterns
- Test color contrast for accessibility
- Use status colors consistently

### Typography
- Follow established hierarchy
- Use ThemedText components
- Avoid inline font styles
- Maintain consistent line heights

### Responsive Design
- Start with mobile layout
- Use breakpoint constants
- Test on actual devices
- Consider touch targets

### Z-Index Management
- Always use Z_INDEX enum
- Don't use arbitrary z-index values
- Consider stacking context
- Document complex layering

Remember: The theme system provides consistency across the financial application. Use established patterns and tokens to maintain visual coherence and user experience quality.