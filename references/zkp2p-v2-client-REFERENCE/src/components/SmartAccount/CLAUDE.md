# Smart Account Components

*This file documents smart account UI components for EIP-7702 integration within the ZKP2P V2 client.*

## Smart Account Architecture

The smart account components provide visual feedback and controls for EIP-7702 delegation and gas sponsorship features:

- **SmartAccountBadge** - Status indicator showing authorization state and gas sponsorship
- **Gas Sponsorship Display** - Shows total gas saved and transaction count (referenced in other components)

## Implementation Patterns

### SmartAccountBadge Component
```typescript
interface SmartAccountBadgeProps {
  status: 'idle' | 'pending' | 'authorized' | 'failed' | 'unauthorized';
  gasSponsored?: boolean;
  compact?: boolean;
}
```

**Status States:**
- `idle` - Hidden state (no badge shown)
- `unauthorized` - Yellow "Enable Smart Account" button
- `pending` - Blue "Authorizing..." indicator during signature
- `authorized` - Green "Gas Free" success state
- `failed` - Red "Authorization Error" warning

**Visual Design:**
- Uses react-feather icons (Shield, Zap, AlertCircle)
- Responsive compact mode for mobile layouts
- Theme-consistent colors from @theme/colors
- Interactive tooltips for user education

### Gas Sponsorship Integration
- Integrates with SmartAccountContext for real-time status updates
- Shows gas savings information when transactions are sponsored
- Provides clear user feedback during authorization flow

## Integration Points

- **SmartAccountContext** - Consumes authorization status and gas sponsorship data
- **Account Components** - Displays in AccountDropdown and user interface areas
- **Transaction Flow** - Shows status during EIP-7702 authorization process
- **Theme System** - Uses consistent color palette and styling patterns

---

*This file was created as part of the 3-tier documentation system to document smart account UI components and EIP-7702 integration patterns.*