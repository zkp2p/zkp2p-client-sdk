# Assets - Development Context

## Overview
This directory contains all static assets for the ZKP2P V2 client, including fonts, images, and SVG icons. Assets are organized by type and platform, supporting multiple payment providers and blockchain networks.

## Key Files and Structure
```
src/assets/
├── fonts/                      # Custom typography
│   ├── aeonik/                 # Primary font family
│   └── roobert/                # Secondary font family
├── images/                     # Raster images and icons
│   ├── platforms/              # Payment platform logos
│   │   ├── venmo.png          # Venmo logo
│   │   ├── revolut.png        # Revolut logo
│   │   ├── cashapp.png        # Cash App logo
│   │   ├── wise.png           # Wise logo
│   │   ├── mercadopago.png   # MercadoPago logo
│   │   ├── monzo.png         # Monzo logo
│   │   └── zelle/            # Zelle bank-specific icons
│   │       ├── boa.png       # Bank of America
│   │       ├── chase.png     # Chase Bank
│   │       ├── wells.png     # Wells Fargo
│   │       └── ...           # Other banks
│   ├── tokens/                # Token/cryptocurrency icons
│   │   ├── usdc.png          # USDC stablecoin
│   │   ├── eth.png           # Ethereum
│   │   ├── weth.png          # Wrapped ETH
│   │   └── ...               # Other tokens
│   ├── browsers/             # Browser icons for extension
│   │   ├── chrome.png        # Chrome browser
│   │   ├── firefox.png       # Firefox browser
│   │   └── safari.png        # Safari browser
│   └── networks/             # Blockchain network icons
│       ├── base.png          # Base L2
│       ├── ethereum.png      # Ethereum mainnet
│       ├── arbitrum.png      # Arbitrum L2
│       ├── polygon.png       # Polygon network
│       └── ...               # Other chains
└── svg/                      # SVG vector graphics
    ├── arrow-down.svg        # UI arrows
    ├── arrow-up.svg          
    ├── check.svg             # Success indicator
    ├── close.svg             # Close/cancel icon
    ├── copy.svg              # Copy to clipboard
    ├── external-link.svg     # External link indicator
    ├── info.svg              # Information icon
    ├── warning.svg           # Warning indicator
    └── ...                   # Other UI icons
```

## Architecture Patterns

### Asset Loading Strategies

#### Direct Import (Recommended for Static Assets)
```typescript
import venmoLogo from '@assets/images/platforms/venmo.png';
import usdcIcon from '@assets/images/tokens/usdc.png';

const PlatformLogo = () => (
  <img src={venmoLogo} alt="Venmo" width={32} height={32} />
);
```

#### SVG as React Components (Vite Plugin)
```typescript
import { ReactComponent as ArrowIcon } from '@assets/svg/arrow-down.svg';

const Button = () => (
  <button>
    Next <ArrowIcon className="icon" />
  </button>
);
```

#### Dynamic Loading Pattern
```typescript
const getPlatformIcon = (platform: PaymentPlatform): string => {
  const iconMap: Record<PaymentPlatform, string> = {
    [PaymentPlatform.VENMO]: '/src/assets/images/platforms/venmo.png',
    [PaymentPlatform.REVOLUT]: '/src/assets/images/platforms/revolut.png',
    // ... other platforms
  };
  
  return iconMap[platform] || '/src/assets/images/platforms/default.png';
};
```

### Asset Organization Principles

#### Platform-Specific Assets
Payment platform assets follow naming convention:
- Main logo: `[platform].png` (e.g., `venmo.png`)
- Alternative versions: `[platform]-[variant].png`
- Bank-specific (Zelle): `zelle/[bank].png`

#### Token Icons
Cryptocurrency token icons use ticker symbols:
- Standard tokens: `[ticker].png` (e.g., `usdc.png`, `eth.png`)
- Wrapped tokens: `w[ticker].png` (e.g., `weth.png`)
- Chain-specific: `[chain]-[ticker].png`

#### Network Icons
Blockchain network icons use chain names:
- L1 networks: `[network].png` (e.g., `ethereum.png`)
- L2 networks: `[network].png` (e.g., `base.png`, `arbitrum.png`)

## Development Guidelines

### Adding New Payment Platforms
1. Add platform logo to `src/assets/images/platforms/`
2. Use PNG format, 512x512px recommended
3. Optimize with tools like TinyPNG
4. Update platform configuration:
```typescript
// src/helpers/constants.ts
export const PLATFORM_ICONS = {
  [PaymentPlatform.NEW_PLATFORM]: '/src/assets/images/platforms/new-platform.png'
};
```

### Adding New Token Icons
1. Add icon to `src/assets/images/tokens/`
2. Use ticker symbol for filename
3. Maintain consistent 128x128px size
4. Support transparent backgrounds

### Font Management
```css
/* Fonts are loaded via @font-face in global styles */
@font-face {
  font-family: 'Aeonik';
  src: url('@assets/fonts/aeonik/Aeonik-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: 'Roobert';
  src: url('@assets/fonts/roobert/Roobert-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
}
```

### SVG Icon Usage
```typescript
// Import as component for styling flexibility
import { ReactComponent as CopyIcon } from '@assets/svg/copy.svg';

// Style with CSS/styled-components
const StyledIcon = styled(CopyIcon)`
  width: 16px;
  height: 16px;
  fill: ${({ theme }) => theme.colors.primary};
  
  &:hover {
    fill: ${({ theme }) => theme.colors.primaryHover};
  }
`;
```

## Testing Strategy

### Asset Loading Tests
```typescript
describe('Asset Loading', () => {
  it('should load platform images', () => {
    const img = new Image();
    img.src = venmoLogo;
    expect(img.src).toContain('venmo');
  });
  
  it('should render SVG components', () => {
    const { container } = render(<ArrowIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
```

### Performance Testing
- Verify image optimization (file sizes)
- Check lazy loading implementation
- Test fallback images for errors
- Validate responsive image loading

## Common Tasks

### Displaying Platform Logo
```typescript
import { PaymentPlatform } from '@helpers/types';
import { getPlatformIcon } from '@helpers/assets';

const PlatformSelector = ({ platform }: { platform: PaymentPlatform }) => (
  <div className="platform-option">
    <img 
      src={getPlatformIcon(platform)} 
      alt={`${platform} logo`}
      width={40}
      height={40}
    />
    <span>{platform}</span>
  </div>
);
```

### Token Icon with Fallback
```typescript
const TokenIcon = ({ ticker }: { ticker: string }) => {
  const [imgSrc, setImgSrc] = useState(`/src/assets/images/tokens/${ticker.toLowerCase()}.png`);
  
  return (
    <img
      src={imgSrc}
      alt={`${ticker} icon`}
      onError={() => setImgSrc('/src/assets/images/tokens/default.png')}
      width={24}
      height={24}
    />
  );
};
```

### Responsive Images
```typescript
const ResponsiveLogo = () => (
  <picture>
    <source 
      media="(min-width: 768px)" 
      srcSet="/src/assets/images/logo-large.png"
    />
    <source 
      media="(min-width: 480px)" 
      srcSet="/src/assets/images/logo-medium.png"
    />
    <img 
      src="/src/assets/images/logo-small.png" 
      alt="ZKP2P Logo"
    />
  </picture>
);
```

## Integration Points

### Build System (Vite)
- Assets are processed through Vite's asset pipeline
- Small assets (<4KB) are inlined as base64
- Larger assets are copied to build output with hash
- SVGs can be imported as React components via plugin

### Theme Integration
```typescript
// Assets referenced in theme configuration
export const theme = {
  images: {
    logo: '/src/assets/images/logo.png',
    placeholder: '/src/assets/images/placeholder.png',
  },
  icons: {
    arrow: '/src/assets/svg/arrow-down.svg',
    check: '/src/assets/svg/check.svg',
  }
};
```

### Component Library
Assets are consumed by various component systems:
- `PlatformIcon` component for payment platforms
- `TokenIcon` component for cryptocurrencies
- `NetworkBadge` component for blockchain networks
- `Icon` component for UI icons

## Security Considerations

### Asset Validation
- Verify image sources before loading
- Sanitize SVG content if user-provided
- Use Content Security Policy for images
- Validate file types and sizes

### CDN Integration
```typescript
// Production CDN configuration
const getAssetUrl = (path: string): string => {
  if (import.meta.env.PROD) {
    return `${CDN_BASE_URL}${path}`;
  }
  return path;
};
```

## Performance Considerations

### Image Optimization
- Use WebP format where supported
- Implement lazy loading for below-fold images
- Provide multiple resolutions for responsive design
- Compress images without quality loss

### Loading Strategies
```typescript
// Preload critical assets
<link rel="preload" as="image" href={venmoLogo} />

// Lazy load non-critical images
const LazyImage = ({ src, alt }: ImageProps) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    decoding="async"
  />
);
```

### Caching Strategy
- Leverage browser caching with proper headers
- Use service worker for offline asset access
- Implement progressive loading for large images
- Version assets with hash in production

### Bundle Optimization
- Tree-shake unused assets
- Split assets by route/feature
- Inline critical CSS and small images
- Use CDN for production deployment