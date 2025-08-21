# Documentation Architecture

This project uses a **3-tier documentation system** that organizes knowledge by stability and scope, enabling efficient AI context loading and scalable development.

## How the 3-Tier System Works

**Tier 1 (Foundation)**: Stable, system-wide documentation that rarely changes - architectural principles, technology decisions, cross-component patterns, and core development protocols.

**Tier 2 (Component)**: Component-level CLAUDE.md files that document major feature areas - high-level patterns, architecture decisions, and component-specific conventions.

**Tier 3 (Feature-Specific)**: Granular documentation for specific features or subsystems - implementation details, integration patterns, and technical specifications that evolve with the code.

This hierarchy allows AI agents to load targeted context efficiently while maintaining a stable foundation of core knowledge.

## Documentation Principles
- **Co-location**: Documentation lives near relevant code
- **Smart Extension**: New documentation files created automatically when warranted
- **AI-First**: Optimized for efficient AI context loading and machine-readable patterns

## Tier 1: Foundational Documentation (System-Wide)

- **[Master Context](/CLAUDE.md)** - *Essential for every session.* Coding standards, security requirements, development protocols, and component overview
- **[Ecosystem Context](/Users/andrewwilkinson/Documents/Github/CLAUDE.md)** - *Ecosystem-wide patterns.* Cross-repository integration, shared infrastructure
- **[Project Structure](/docs/ai-context/project-structure.md)** - *REQUIRED reading.* Complete technology stack, file tree, and system architecture
- **[System Integration](/docs/ai-context/system-integration.md)** - *Integration patterns.* Browser extension communication, backend API, smart contracts
- **[Deployment Infrastructure](/docs/ai-context/deployment-infrastructure.md)** - *Deployment patterns.* Environment configuration, Vercel setup, monitoring
- **[Task Management](/docs/ai-context/handoff.md)** - *Session continuity.* Current tasks, recent changes, and next session goals
- **[MCP Assistant Rules](/MCP-ASSISTANT-RULES.md)** - *MCP configuration.* Assistant behavior rules and project-specific overrides

## Tier 2: Component-Level Documentation

### Page Components
- **[Pages Guide](/src/pages/CLAUDE.md)** - *Route-level components.* Page orchestration, URL synchronization, multi-step flow management

### UI Components
- **[Components Guide](/src/components/CLAUDE.md)** - *Component patterns.* React component architecture, styling patterns, and reusability guidelines
- **[Layout Components](/src/components/layouts/CLAUDE.md)** - *Navigation & layout.* TopNav, BottomNav, responsive design, navigation patterns
- **[Common Components](/src/components/common/CLAUDE.md)** - *Reusable UI.* Design system integration, form patterns, shared components
- **[Modal Components](/src/components/modals/CLAUDE.md)** - *Modal system.* Modal management, selector patterns, confirmation flows
- **[Swap Components](/src/components/Swap/CLAUDE.md)** - *Swap flow.* Multi-step swap interface, proof submission, order completion  
- **[Liquidity Components](/src/components/Liquidity/CLAUDE.md)** - *Liquidity features.* Deposit management, APR calculations, withdrawal flows
- **[Account Components](/src/components/Account/CLAUDE.md)** - *Account management.* Authentication, wallet connection, user profiles
- **[Deposit Management](/src/components/Deposit/CLAUDE.md)** - *Individual deposits.* Deposit details, orders, updates, buy flows
- **[Deposits Listing](/src/components/Deposits/CLAUDE.md)** - *Deposits marketplace.* Listing, filtering, creation flows
- **[Send Components](/src/components/Send/CLAUDE.md)** - *Token sending.* Multi-token support, ENS resolution, address validation
- **[Smart Account UI](/src/components/SmartAccount/CLAUDE.md)** - *EIP-7702 interface.* Authorization status, gas sponsorship display
- **[SVG Icons](/src/components/SVGIcon/CLAUDE.md)** - *Icon system.* Centralized iconography, theme integration

### State Management
- **[Contexts Guide](/src/contexts/CLAUDE.md)** - *Context patterns.* React Context architecture, provider composition, state management
- **[Smart Contracts Context](/src/contexts/SmartContracts/CLAUDE.md)** - *Contract integration.* Web3 provider setup, contract instances, network management

### Configuration & Design
- **[Configuration Guide](/src/config/CLAUDE.md)** - *App configuration.* Wagmi setup, multi-chain configuration, environment management
- **[Design System](/src/theme/CLAUDE.md)** - *Theme & styling.* Color system, typography, responsive design, styled-components patterns

### Testing Infrastructure
- **[Test Infrastructure](/src/test/CLAUDE.md)** - *Testing strategy.* Vitest configuration, mocking patterns, financial testing, BigInt safety

### Business Logic
- **[Helpers Guide](/src/helpers/CLAUDE.md)** - *Utilities and types.* Common helpers, BigInt serialization, type definitions
- **[Hooks Guide](/src/hooks/CLAUDE.md)** - *Custom hooks.* Hook patterns, composition strategies, testing approaches

## Tier 3: Feature-Specific Documentation

### Testing Documentation
- **[Test Infrastructure](/src/test/README.md)** - *Testing setup.* Vitest configuration, mock strategies, test utilities

### Component-Specific Docs
- **[Component Tier 2](/docs/CONTEXT-tier2-component.md)** - *Component architecture.* High-level component design patterns
- **[Feature Tier 3](/docs/CONTEXT-tier3-feature.md)** - *Feature details.* Specific implementation patterns

### Issue Documentation
- **[Open Issues](/docs/open-issues/)** - *Active issues.* Current problems, investigations, and proposed solutions

### Specifications
- **[Technical Specs](/docs/specs/)** - *Feature specifications.* Detailed technical requirements and design documents



## Adding New Documentation

### New Component
1. Create `/new-component/CONTEXT.md` (Tier 2)
2. Add entry to this file under appropriate section
3. Create feature-specific Tier 3 docs as features develop

### New Feature
1. Create `/component/src/feature/CONTEXT.md` (Tier 3)
2. Reference parent component patterns
3. Add entry to this file under component's features

### Deprecating Documentation
1. Remove obsolete CONTEXT.md files
2. Update this mapping document
3. Check for broken references in other docs

---

*This documentation architecture template should be customized to match your project's actual structure and components. Add or remove sections based on your architecture.*