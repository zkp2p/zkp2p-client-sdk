# Payment Platform Type System - Development Context

## Overview
The payment platform type system provides a modular architecture that defines how different payment platforms (Venmo, Revolut, Zelle, etc.) integrate with the ZKP2P protocol. Each platform has unique requirements for sending payments, verifying transactions, and handling deposits.

## Key Files and Structure
```
src/helpers/types/paymentPlatforms/
├── index.ts                    # Central export and platform registry
├── types.ts                    # Core type definitions and interfaces
├── venmo.ts                    # Venmo-specific configuration
├── cashapp.ts                  # CashApp configuration  
├── revolut.ts                  # Revolut configuration
├── zelle.ts                    # Zelle configuration (multiple banks)
├── wise.ts                     # Wise configuration
├── mercadoPago.ts             # MercadoPago configuration
├── paypal.ts                   # PayPal configuration
└── monzo.ts                   # Monzo configuration
```

## Architecture Patterns

### Platform Configuration Structure
Each platform implements the `PaymentPlatformConfig` interface:
```typescript
export interface PaymentPlatformConfig {
  platformId: PaymentPlatformType;
  platformName: string;
  platformCurrencies: CurrencyType[];
  minFiatAmount: string;
  localeTimeString: string;
  
  depositConfig: PlatformDepositConfig;
  hasMultiplePaymentMethods: boolean;
  paymentMethods: PaymentMethodConfig[];
}
```

### Multi-Bank Support (Zelle)
Zelle uniquely supports multiple banks with different verification methods:
- Base Zelle (ZK proofs)
- PNC Bank specific
- Bank of America specific
- Chase specific

### International Platforms
- **Revolut**: EUR, GBP currencies for European markets
- **MercadoPago**: ARS, BRL, MXN for Latin American markets
- **Wise**: Multi-currency international transfers
- **Monzo**: GBP for UK market

## Development Guidelines

### Adding New Payment Platforms
1. Create platform configuration file in `paymentPlatforms/`
2. Implement all required interfaces
3. Add to platform registry in `index.ts`
4. Update smart contract addresses
5. Implement input validation functions
6. Add comprehensive tests

### Platform-Specific Configuration
Each platform defines:
- **Send Configuration**: Payment link generation, QR codes, warnings
- **Verification Configuration**: Proof requirements, parsing functions
- **Deposit Configuration**: Payee detail validation and storage

### Input Validation Patterns
```typescript
// Platform-specific validation
const validateVenmoUsername = (username: string): boolean => {
  return /^[a-zA-Z0-9_-]{5,30}$/.test(username);
};

const validateZelleEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

## Testing Strategy

### Unit Testing
- Validate all platform configurations
- Test parameter parsing functions
- Verify payment link generation
- Test input validation logic

### Integration Testing
- Test with actual payment platforms
- Verify proof generation compatibility
- Test deposit creation flows
- Validate multi-currency support

## Common Tasks

### Implementing Platform-Specific Features
```typescript
// Custom QR code support
useCustomQRCode?: boolean;

// Platform-specific warnings
sendPaymentWarning?: (currency: CurrencyType, amount: string) => string;

// Authentication links
authLink: string;
```

### Handling Multi-Proof Platforms
Venmo and some platforms require multiple proofs:
```typescript
totalProofs: 2, // Venmo requires 2 proofs
```

### Currency-Specific Formatting
```typescript
const formatAmount = (amount: string, currency: CurrencyType): string => {
  switch (currency) {
    case Currency.USD: return `$${amount}`;
    case Currency.EUR: return `€${amount}`;
    case Currency.GBP: return `£${amount}`;
    default: return amount;
  }
};
```

## Integration Points

### Smart Contract Verifiers
Each platform has a dedicated verifier contract for proof validation.

### Extension Communication
Platforms define how the browser extension interacts with their payment systems.

### Backend API
Platform configurations determine how deposits are stored and retrieved.

### UI Components
Platform configurations drive the UI for payment sending and verification.