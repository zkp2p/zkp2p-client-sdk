# SVG Icon Components

*This file documents the SVG icon system within the ZKP2P V2 client.*

## SVG Icon Architecture

The SVGIcon components provide a centralized icon system for consistent iconography:

- **SVGIcon** - Basic SVG icon component with name-based selection
- **SVGIconThemed** - Theme-aware SVG icon component
- **CSS Styling** - Icon-specific styling and responsive behavior

## Implementation Patterns

### SVGIcon Component
**Icon Management:**
```typescript
interface SVGIconProps {
  iconName: string;
  width?: string;
  height?: string;
}
```

**Available Icons:**
- `dark-telegram` - Telegram social icon
- `dark-github` - GitHub social icon  
- `dark-usdc` - USDC token icon
- `dark-twitter` - Twitter social icon
- `ethereum-logo` - Default Ethereum token logo
- `dark-lightning` - Lightning/speed indicator
- `dark-cash` - Cash/payment icon
- `dark-padlock` - Security/lock icon
- `dark-arrow-down` - Dropdown arrow

**Technical Implementation:**
- Uses Vite's `?react` import syntax for SVG components
- Centralized icon registry with switch-case selection
- Customizable width and height properties
- CSS class-based styling system

### SVGIconThemed Component
**Theme Integration:**
- Automatically adapts to current theme colors
- Responsive to light/dark mode changes
- Consistent with application color palette
- Enhanced accessibility with theme-aware contrast

### Icon Management System
**Organization:**
- Icons stored in `/src/icons/svg/` directory
- Imported as React components using Vite SVGR plugin
- Centralized management reduces bundle duplication
- Type-safe icon name selection

## Integration Points

- **Theme System** - Icons inherit theme colors and adapt to mode changes
- **Asset Management** - Integrated with Vite build system for optimization
- **Component System** - Used throughout UI components for consistent iconography
- **Responsive Design** - Icons scale appropriately for different screen sizes

## Usage Patterns

### Basic Usage
```typescript
<SVGIcon iconName="dark-usdc" width="24px" height="24px" />
```

### Themed Usage
```typescript
<SVGIconThemed iconName="dark-lightning" />
```

### Styling
- Icons include dedicated CSS files for base styling
- Theme-aware icons automatically inherit theme colors
- Responsive behavior through CSS media queries
- Hover states and interaction feedback

## Asset Optimization

**Build Integration:**
- SVG assets processed by vite-plugin-svgr
- Tree-shaking removes unused icons from bundle
- Optimized SVG output with cleaned markup
- Consistent icon sizing and viewport configuration

---

*This file was created as part of the 3-tier documentation system to document the SVG icon system and consistent iconography patterns.*