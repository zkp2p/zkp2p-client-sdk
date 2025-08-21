# String Constants - Development Context

## Overview
This directory centralizes all user-facing string constants for the ZKP2P V2 client. It provides a type-safe, maintainable system for managing UI text across different payment platforms and features. The architecture supports future internationalization (i18n) efforts.

## Key Files and Structure
```
src/helpers/strings/
├── index.ts            # Main string provider and exports
├── revolut.ts          # Revolut-specific strings
├── venmo.ts            # Venmo-specific strings
├── wise.ts             # Wise-specific strings
└── zelle.ts            # Zelle-specific strings
```

## Architecture Patterns

### String Organization Structure
Each file exports a typed object containing categorized strings:

```typescript
// Platform-specific string structure
export const venmoStrings = {
  // Registration instructions
  REGISTRATION_INSTRUCTIONS: {
    TITLE: "Venmo Registration",
    DESCRIPTION: "Connect your Venmo account to start trading",
    STEPS: [
      "Open Venmo app",
      "Navigate to Settings",
      "Enable API access"
    ]
  },
  
  // Payment instructions
  PAYMENT_INSTRUCTIONS: {
    SEND: "Send payment via Venmo to complete transaction",
    RECEIVE: "You will receive payment to your Venmo account",
    CONFIRMATION: "Confirm payment ID in Venmo app"
  },
  
  // Error messages
  ERRORS: {
    INVALID_USERNAME: "Invalid Venmo username format",
    PAYMENT_NOT_FOUND: "Payment not found in Venmo history",
    INSUFFICIENT_BALANCE: "Insufficient Venmo balance"
  },
  
  // UI labels
  LABELS: {
    USERNAME: "Venmo Username",
    PAYMENT_ID: "Payment ID",
    AMOUNT: "Amount (USD)"
  }
};
```

### String Provider Pattern
The index file provides centralized access:

```typescript
// index.ts
import { venmoStrings } from './venmo';
import { revolutStrings } from './revolut';
import { wiseStrings } from './wise';
import { zelleStrings } from './zelle';

export const strings = {
  venmo: venmoStrings,
  revolut: revolutStrings,
  wise: wiseStrings,
  zelle: zelleStrings,
  
  // Common strings across platforms
  common: {
    CONFIRM: "Confirm",
    CANCEL: "Cancel",
    LOADING: "Loading...",
    SUCCESS: "Success",
    ERROR: "Error",
    RETRY: "Retry"
  }
};

// Type-safe string getter
export const getString = (
  platform: PaymentPlatform,
  category: string,
  key: string
): string => {
  const platformStrings = strings[platform.toLowerCase()];
  if (!platformStrings) {
    console.warn(`No strings found for platform: ${platform}`);
    return key;
  }
  
  const categoryStrings = platformStrings[category];
  if (!categoryStrings) {
    console.warn(`No category ${category} for platform: ${platform}`);
    return key;
  }
  
  return categoryStrings[key] || key;
};
```

### Platform-Specific Patterns

#### Venmo Strings (`venmo.ts`)
```typescript
export const venmoStrings = {
  ONBOARDING: {
    TITLE: "Connect Venmo",
    SUBTITLE: "Link your Venmo account to trade USDC",
    REQUIREMENTS: [
      "Active Venmo account",
      "Verified phone number",
      "Transaction history enabled"
    ]
  },
  
  PROOF_GENERATION: {
    INSTRUCTIONS: "Generate proof of Venmo payment",
    STEPS: [
      "Open Venmo transaction",
      "Copy transaction ID",
      "Paste in verification field"
    ],
    WARNINGS: {
      PRIVATE_TRANSACTION: "Transaction must be public or friends-only",
      EXPIRED: "Proof expired after 6 hours"
    }
  }
};
```

#### Revolut Strings (`revolut.ts`)
```typescript
export const revolutStrings = {
  ONBOARDING: {
    TITLE: "Connect Revolut",
    SUBTITLE: "Link your Revolut account to trade crypto",
    SUPPORTED_REGIONS: [
      "United States",
      "United Kingdom", 
      "European Union"
    ]
  },
  
  TRANSFER_LIMITS: {
    DAILY: "Daily limit: $10,000",
    MONTHLY: "Monthly limit: $50,000",
    PER_TRANSACTION: "Per transaction: $5,000"
  }
};
```

#### Wise Strings (`wise.ts`)
```typescript
export const wiseStrings = {
  MULTI_CURRENCY: {
    TITLE: "Multi-Currency Support",
    SUPPORTED: ["USD", "EUR", "GBP", "AUD", "CAD"],
    CONVERSION_NOTE: "Exchange rates provided by Wise"
  },
  
  RECIPIENT_DETAILS: {
    FIELDS: {
      EMAIL: "Recipient email",
      REFERENCE: "Payment reference",
      ACCOUNT_TYPE: "Account type (Personal/Business)"
    }
  }
};
```

#### Zelle Strings (`zelle.ts`)
```typescript
export const zelleStrings = {
  BANK_SPECIFIC: {
    CHASE: {
      NAME: "Chase QuickPay with Zelle",
      INSTRUCTIONS: "Use Chase mobile app or chase.com"
    },
    WELLS_FARGO: {
      NAME: "Wells Fargo Zelle",
      INSTRUCTIONS: "Available in Wells Fargo Mobile app"
    },
    BANK_OF_AMERICA: {
      NAME: "Bank of America Zelle",
      INSTRUCTIONS: "Access through BofA Online Banking"
    }
  },
  
  ENROLLMENT: {
    CHECK_STATUS: "Check if your bank supports Zelle",
    ENROLL_STEPS: [
      "Log into your bank's app",
      "Find Zelle in payments section",
      "Enroll with email or phone"
    ]
  }
};
```

## Development Guidelines

### Adding New Strings
1. Identify the appropriate platform file
2. Add strings to relevant category
3. Maintain consistent naming convention
4. Update TypeScript types if needed

```typescript
// Example: Adding new error message
export const venmoStrings = {
  // ... existing categories
  ERRORS: {
    // ... existing errors
    NEW_ERROR: "Your descriptive error message here"
  }
};
```

### Creating New Platform File
```typescript
// mercadopago.ts
export const mercadopagoStrings = {
  ONBOARDING: {
    TITLE: "Connect MercadoPago",
    SUBTITLE: "Trade crypto with MercadoPago",
    // ... platform-specific content
  },
  // ... other categories
};

// Update index.ts
import { mercadopagoStrings } from './mercadopago';
export const strings = {
  // ... existing platforms
  mercadopago: mercadopagoStrings
};
```

### String Formatting
```typescript
// For dynamic values, use template functions
export const formatAmount = (amount: string, currency: string): string => {
  return `${amount} ${currency}`;
};

export const formatError = (platform: string, error: string): string => {
  return `${platform} Error: ${error}`;
};
```

## Testing Strategy

### String Validation Tests
```typescript
describe('String Constants', () => {
  it('should have all required platforms', () => {
    expect(strings).toHaveProperty('venmo');
    expect(strings).toHaveProperty('revolut');
    expect(strings).toHaveProperty('wise');
    expect(strings).toHaveProperty('zelle');
  });
  
  it('should return fallback for missing strings', () => {
    const result = getString('venmo', 'INVALID', 'KEY');
    expect(result).toBe('KEY'); // Returns key as fallback
  });
  
  it('should have consistent structure across platforms', () => {
    Object.values(strings).forEach(platformStrings => {
      expect(platformStrings).toHaveProperty('ONBOARDING');
      expect(platformStrings).toHaveProperty('ERRORS');
    });
  });
});
```

### Internationalization Testing
```typescript
// Future i18n support testing
describe('I18n Support', () => {
  it('should support language switching', () => {
    const enString = getString('venmo', 'ONBOARDING', 'TITLE', 'en');
    const esString = getString('venmo', 'ONBOARDING', 'TITLE', 'es');
    expect(enString).not.toBe(esString);
  });
});
```

## Common Tasks

### Accessing Strings in Components
```typescript
import { strings, getString } from '@helpers/strings';
import { PaymentPlatform } from '@helpers/types';

const PaymentInstructions = ({ platform }: { platform: PaymentPlatform }) => {
  // Direct access
  const instructions = strings[platform.toLowerCase()]?.PAYMENT_INSTRUCTIONS;
  
  // Or using helper
  const title = getString(platform, 'ONBOARDING', 'TITLE');
  
  return (
    <div>
      <h2>{title}</h2>
      <p>{instructions?.SEND}</p>
    </div>
  );
};
```

### Dynamic String Interpolation
```typescript
const getPaymentMessage = (
  platform: PaymentPlatform,
  amount: string,
  recipient: string
): string => {
  const template = getString(platform, 'PAYMENT', 'MESSAGE');
  return template
    .replace('{amount}', amount)
    .replace('{recipient}', recipient);
};
```

### Platform-Specific Rendering
```typescript
const PlatformInstructions = ({ platform }: { platform: PaymentPlatform }) => {
  const platformStrings = strings[platform.toLowerCase()];
  
  if (!platformStrings) {
    return <div>Platform not supported</div>;
  }
  
  return (
    <div>
      <h3>{platformStrings.ONBOARDING.TITLE}</h3>
      <ul>
        {platformStrings.ONBOARDING.STEPS.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ul>
    </div>
  );
};
```

## Integration Points

### Connected Systems
- **Component Layer**: UI components consume strings
- **Error Handling**: Error messages centralized here
- **Forms**: Form labels and validation messages
- **Modals**: Modal titles and content
- **Notifications**: Toast messages and alerts

### Type System Integration
```typescript
// Ensure type safety with TypeScript
type StringCategory = 'ONBOARDING' | 'ERRORS' | 'LABELS';
type StringKey = string;

interface PlatformStrings {
  [category: string]: {
    [key: string]: string | string[];
  };
}
```

## Security Considerations

### Sensitive Information
- Never include API keys or secrets in strings
- Avoid exposing internal system details in error messages
- Sanitize user input before string interpolation
- Use generic messages for security-related errors

### XSS Prevention
```typescript
// Always escape HTML in dynamic strings
import { escapeHtml } from '@helpers/security';

const safeString = escapeHtml(userProvidedString);
```

## Performance Considerations

### String Loading
- Strings are bundled at build time
- No runtime fetching required
- Tree-shaking removes unused strings
- Minimal memory footprint

### Optimization Strategies
```typescript
// Lazy load platform-specific strings
const loadPlatformStrings = async (platform: PaymentPlatform) => {
  switch(platform) {
    case PaymentPlatform.VENMO:
      return import('./venmo');
    case PaymentPlatform.REVOLUT:
      return import('./revolut');
    // ... other platforms
  }
};
```

## Future Enhancements

### Internationalization (i18n)
Structure supports future i18n:
```typescript
// Future structure
src/helpers/strings/
├── en/
│   ├── venmo.ts
│   ├── revolut.ts
│   └── ...
├── es/
│   ├── venmo.ts
│   ├── revolut.ts
│   └── ...
└── index.ts
```

### Dynamic String Management
- CMS integration for non-technical updates
- A/B testing different string variations
- User-specific string customization
- Real-time string updates without deployment