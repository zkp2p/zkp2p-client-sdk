# Deployment & Infrastructure Documentation

This document contains deployment and infrastructure configuration for the ZKP2P V2 client application.

## Deployment Platform

The application is deployed on **Vercel** with the following configuration:
- Node.js version: 18.x (required)
- Build tool: Vite
- Framework preset: Vite
- Build command: `yarn build`
- Output directory: `build/`

## Environment Configuration

### Required Environment Variables

All environment variables must be prefixed with `VITE_` for Vite to expose them to the application:

```bash
# Core Infrastructure
VITE_ALCHEMY_API_KEY=            # Ethereum RPC provider
VITE_ALCHEMY_SOLANA_API_KEY=     # Solana RPC provider (optional)
VITE_PRIVY_APP_ID=               # Authentication service with EIP-7702 support

# Smart Account Infrastructure
VITE_ZERODEV_APP_ID=             # ZeroDev project ID for smart accounts
# ZeroDev infrastructure uses PIMLICO as the bundler/paymaster provider
# Endpoints are constructed as:
# - Bundler: https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID}?provider=PIMLICO
# - Paymaster: https://rpc.zerodev.app/api/v2/paymaster/${PROJECT_ID}?provider=PIMLICO

# Zero-Knowledge Proof
VITE_RECLAIM_APP_ID=             # ZK proof generation
VITE_RECLAIM_APP_SECRET=         # ZK proof secret

# Backend Services
VITE_CURATOR_API_URL=            # Backend API endpoint

# Environment
VITE_DEPLOYMENT_ENVIRONMENT=     # LOCAL|staging|production

# Optional Services
VITE_SOCKET_API_KEY=             # Socket bridge API key (optional)
VITE_ROLLBAR_CLIENT_ACCESS_TOKEN= # Error tracking (optional)
```

### Environment-Specific Configurations

#### Production
- `VITE_DEPLOYMENT_ENVIRONMENT=production`
- `VITE_CURATOR_API_URL=https://api.zkp2p.xyz`
- Uses Base mainnet (chain ID: 8453)

#### Staging
- `VITE_DEPLOYMENT_ENVIRONMENT=staging`
- `VITE_CURATOR_API_URL=https://api-staging.zkp2p.xyz`
- Uses Base Sepolia testnet (chain ID: 84532)

#### Local Development
- `VITE_DEPLOYMENT_ENVIRONMENT=LOCAL`
- `VITE_CURATOR_API_URL=http://localhost:3001`
- Supports local Hardhat network

## Infrastructure Architecture

### Smart Account Infrastructure

The application uses **ZeroDev** for EIP-7702 smart account functionality with the following configuration:

- **Provider**: PIMLICO (switched from ALCHEMY for improved reliability)
- **Kernel Version**: V3.3
- **Authorization Model**: EIP-7702 delegation
- **Gas Sponsorship**: All user transactions sponsored via ZeroDev paymaster

**Infrastructure URLs**:
```typescript
const BUNDLER_RPC = `https://rpc.zerodev.app/api/v2/bundler/${ZERODEV_PROJECT_ID}?provider=PIMLICO`;
const PAYMASTER_RPC = `https://rpc.zerodev.app/api/v2/paymaster/${ZERODEV_PROJECT_ID}?provider=PIMLICO`;
```

### RPC Infrastructure

Primary RPC providers via Alchemy:
- **Ethereum Mainnet**: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
- **Base Mainnet**: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
- **Base Sepolia**: `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
- **Solana Mainnet**: `https://solana-mainnet.g.alchemy.com/v2/${ALCHEMY_SOLANA_API_KEY}`

### Authentication Infrastructure

**Privy.io** configuration:
- Embedded wallet creation for users without wallets
- EIP-7702 authorization support
- Login methods: Email, Google, Twitter, Coinbase Smart Wallet
- Backend authentication via Privy access tokens

## Build & Deployment Process

### Build Configuration

The application uses Vite with the following optimizations:
- Code splitting for lazy loading
- Asset hashing for cache busting
- Source maps disabled in production
- Node.js polyfills for blockchain libraries
- Environment variable injection at build time

### Deployment Process

1. **Automatic Deployments**
   - Production: Merge to `main` branch
   - Staging: Merge to `staging` branch
   - Preview: Any pull request

2. **Build Steps**
   ```bash
   yarn install --frozen-lockfile
   yarn build
   ```

3. **Vercel Configuration** (`vercel.json`)
   - Redirects all routes to index.html for SPA routing
   - Headers configured for security and performance

## Monitoring & Observability

### Error Tracking
- **Rollbar** integration for error monitoring
- Client-side error tracking with source maps
- Environment-specific project configuration

### Performance Monitoring
- Web Vitals tracking for Core Web Vitals
- Bundle size analysis via rollup-plugin-visualizer

## Security Considerations

### Environment Variables
- Never commit `.env` files
- Use Vercel's environment variable UI for production secrets
- Rotate API keys regularly
- Use separate keys for each environment

### Content Security Policy
- Configured in Vercel headers
- Restricts resource loading to trusted domains

## Scaling Considerations

### Smart Account Infrastructure
- ZeroDev's PIMLICO provider handles bundler/paymaster scaling
- Automatic failover between infrastructure providers
- Rate limiting handled at the provider level

### RPC Scaling
- Alchemy provides automatic scaling for RPC requests
- Consider implementing request caching for frequently accessed data
- Monitor rate limits and upgrade plans as needed

## Recent Infrastructure Changes

### ZeroDev Provider Migration
- **Previous**: ALCHEMY provider for bundler/paymaster services
- **Current**: PIMLICO provider for improved reliability and performance
- **Migration Date**: Recent (as per staging branch)
- **Impact**: No code changes required, only URL parameter update

This change improves the reliability of smart account operations and gas sponsorship services.