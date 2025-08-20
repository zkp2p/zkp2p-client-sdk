# ZKP2P

## A trustless P2P on/off-ramp powered by ZK proofs

ZKP2P is a trustless and privacy-preserving on/off-ramp powered by ZK proofs. This (V2) repo is currently under active development. Try it out at [zkp2p.xyz](https://zkp2p.xyz/)

![X-blob-background-1500x500px](https://github.com/zkp2p/zk-p2p/assets/6797244/65e8ae36-eb8b-4b53-85e9-fa0801bafcf0)

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 24.3.0 (required for Vercel deployment compatibility)
- **Yarn**: See version requirements below
- **Git**

### Yarn Version Requirements

This project has specific Yarn version requirements due to dependency resolution:

| Yarn Version | Node Requirement | Use Case |
|-------------|------------------|----------|
| **1.22.1** (Classic) | 18.19.0+ | Maximum compatibility, may install newer minor versions |
| **3.2.3** (Berry) | 16.20.1+ | Better dependency resolution, intelligent version management |

**Note**: We recommend using Yarn 3.2.3 for development as it provides better dependency resolution.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/zkp2p/zkp2p-v2-client.git
   cd zkp2p-v2-client
   ```

2. **Set up Node version**
   
   Using nvm (recommended):
   ```bash
   nvm install 18.20.6
   nvm use 18.20.6
   ```

3. **Install Yarn 3.2.3** (recommended)
   ```bash
   corepack enable
   yarn set version 3.2.3
   ```

   Or if you prefer Yarn Classic:
   ```bash
   npm install -g yarn@1.22.1
   ```

4. **Install dependencies**
   ```bash
   yarn install
   ```

### Environment Setup

1. **Create a `.env` file** in the root directory:
   ```bash
   cp .env.default .env
   ```

2. **Required environment variables** (all must be prefixed with `VITE_` for Vite):
   ```env
   # Blockchain RPC
   VITE_ALCHEMY_API_KEY=your_alchemy_api_key
   
   # Authentication
   VITE_PRIVY_APP_ID=your_privy_app_id
   
   # Zero-Knowledge Proofs
   VITE_RECLAIM_APP_ID=your_reclaim_app_id
   VITE_RECLAIM_APP_SECRET=your_reclaim_app_secret
   
   # Backend
   VITE_CURATOR_API_URL=your_backend_api_url
   
   # Environment
   VITE_DEPLOYMENT_ENVIRONMENT=LOCAL  # LOCAL | STAGING | STAGING_TESTNET | PRODUCTION
   
   # Additional Services
   VITE_ZERODEV_APP_ID=your_zerodev_app_id  # For mainnet
   VITE_ZERODEV_SEPOLIA_APP_ID=your_zerodev_sepolia_app_id
   VITE_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
   VITE_ROLLBAR_ACCESS_TOKEN=your_rollbar_token  # Optional for error tracking
   ```

### Running the Application

1. **Start the development server**
   ```bash
   yarn dev
   ```
   The application will be available at `http://localhost:3000`

2. **Build for production**
   ```bash
   yarn build
   ```

3. **Serve production build locally**
   ```bash
   yarn preview
   ```

## 🛠️ Development

### Available Scripts

- `yarn dev` or `yarn start` - Start Vite development server (port 3000)
- `yarn build` - Build for production using Vite
- `yarn preview` - Preview production build locally

### Project Structure

```
zkp2p-v2-client/
├── src/
│   ├── components/      # React components
│   ├── contexts/        # React Context providers
│   ├── helpers/         # Utilities, types, constants
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Route-level components
│   └── theme/           # Design system
├── vite.config.ts       # Vite configuration
├── index.html           # Entry HTML file (at root)
└── public/              # Static assets
```

### Technology Stack

- **Frontend**: React 18, TypeScript, styled-components
- **Blockchain**: Ethers.js, Wagmi, RainbowKit
- **Zero-Knowledge**: snarkjs, Reclaim Protocol SDK
- **Authentication**: Privy.io, ZeroDev (account abstraction)
- **Build Tool**: Vite 6

## 🐛 Troubleshooting

### Common Issues

1. **Environment variable errors**
   - Ensure all required variables are set in `.env` with `VITE_` prefix
   - Access variables using `import.meta.env.VITE_*` instead of `process.env.*`
   - Restart the development server after changing `.env`

2. **Yarn version conflicts**
   - Check Node version: `node --version` (should be 24.3.0+)
   - Verify Yarn version: `yarn --version`
   - Clear cache: `rm -rf node_modules yarn.lock && yarn install`

3. **Build errors**
   - Ensure you're using the correct Node/Yarn versions
   - Clear Vite cache: `rm -rf node_modules/.vite`
   - Try clearing dependencies and reinstalling: `rm -rf node_modules yarn.lock && yarn install`

4. **Network-specific issues**
   - For mainnet: Set `VITE_DEPLOYMENT_ENVIRONMENT=STAGING` or `PRODUCTION`
   - For testnet: Set `VITE_DEPLOYMENT_ENVIRONMENT=STAGING_TESTNET`
   - For local: Set `VITE_DEPLOYMENT_ENVIRONMENT=LOCAL`

5. **Migration from Create React App**
   - All environment variables now require `VITE_` prefix
   - Access env variables with `import.meta.env` instead of `process.env`
   - `index.html` is now at project root (not in `public/`)
   - Development server runs on same port (3000) for compatibility

### Vite Configuration Notes

The project uses Vite for fast development and optimized production builds:

- Lightning-fast Hot Module Replacement (HMR)
- Native ES modules support
- Automatic code splitting and lazy loading
- Node.js polyfills configured for blockchain libraries
- Environment variables must be prefixed with `VITE_` to be exposed to the client

## 📝 Contributing

TODO: Create clear branching conventions and PR process and include here

### Development Guidelines

- Follow existing code patterns and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 🔗 Resources

- **Live Application**: [zkp2p.xyz](https://zkp2p.xyz/)
- **Documentation**: [docs.zkp2p.xyz](https://docs.zkp2p.xyz/) (if available)
- **Repository**: [zkp2p/zkp2p-v2-client](https://github.com/zkp2p/zkp2p-v2-client)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
