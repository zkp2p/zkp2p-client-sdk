# Contributing to ZKP2P Client SDK

Thank you for your interest in contributing to the ZKP2P Client SDK! We welcome contributions from the community and are grateful for any help you can provide.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Contributions](#making-contributions)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and considerate in all interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/zkp2p-client-sdk.git
   cd zkp2p-client-sdk
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/zkp2p/zkp2p-client-sdk.git
   ```

## Development Setup

### Prerequisites

- Node.js 18+ and npm 9+
- Git
- TypeScript knowledge

### Installation

This repository hosts the SDK under `packages/client-sdk/` with its own lockfile. For deterministic installs and CI parity, run commands from that package directory.

```bash
# Install dependencies for the SDK package
cd packages/client-sdk
npm ci

# Build the project
npm run build

# Run tests
npm test
```

### Project Structure

```
zkp2p-client-sdk/
├── packages/
│   └── client-sdk/       # Main SDK package
│       ├── src/          # Source code
│       ├── dist/         # Built output
│       └── __tests__/    # Tests
├── examples/             # Example implementations
└── docs/                 # Documentation
```

## Making Contributions

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes**: Fix issues and improve stability
- **Features**: Add new capabilities to the SDK
- **Documentation**: Improve or add documentation
- **Tests**: Add test coverage
- **Examples**: Create or improve example implementations
- **Performance**: Optimize existing code

### Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Write clean, readable code
   - Follow existing patterns and conventions
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**:
   ```bash
   npm test
   npm run typecheck
   npm run lint
   npm run build
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```
   
   We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `test:` Test additions or fixes
   - `refactor:` Code refactoring
   - `chore:` Maintenance tasks

## Pull Request Process

1. **Update your branch**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request**:
   - Go to the [repository](https://github.com/zkp2p/zkp2p-client-sdk)
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template with:
     - Clear description of changes
     - Related issues (if any)
     - Testing performed
     - Breaking changes (if any)

4. **PR Review Process**:
   - Maintainers will review your PR
   - Address any feedback or requested changes
   - Once approved, your PR will be merged

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Ensure strict type safety
- Avoid `any` types where possible
- Export types from `types/index.ts`

### Code Style

- We use ESLint and Prettier for code formatting
- Run `npm run lint` to check for issues
- Run `npm run lint:fix` to auto-fix issues

### Best Practices

- Keep functions small and focused
- Use descriptive variable and function names
- Add JSDoc comments for public APIs
- Avoid breaking changes when possible
- Maintain backward compatibility

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Place tests in `__tests__` directories
- Name test files as `*.test.ts`
- Use descriptive test names
- Cover edge cases and error scenarios
- Aim for high test coverage

Example test:
```typescript
describe('Zkp2pClient', () => {
  it('should fetch quotes successfully', async () => {
    const client = new Zkp2pClient({ /* config */ });
    const quotes = await client.getQuote({ /* params */ });
    expect(quotes).toBeDefined();
    expect(quotes.success).toBe(true);
  });
});
```

## Documentation

### Code Documentation

- Add JSDoc comments to all public APIs
- Include parameter descriptions and return types
- Provide usage examples where helpful

```typescript
/**
 * Fetches quotes for fiat-to-crypto exchange
 * @param params - Quote request parameters
 * @param params.paymentPlatforms - Array of payment platforms
 * @param params.fiatCurrency - Fiat currency code
 * @returns Promise resolving to quote response
 * @example
 * const quotes = await client.getQuote({
 *   paymentPlatforms: ['wise'],
 *   fiatCurrency: 'USD',
 *   amount: '100'
 * });
 */
```

### README Updates

- Update README.md files when adding features
- Include clear examples
- Document any breaking changes

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Reproduction Steps**: How to reproduce the bug
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**:
   - SDK version
   - Node.js version
   - Browser (if applicable)
   - Operating system
6. **Code Sample**: Minimal code to reproduce
7. **Error Messages**: Any error messages or logs

### Feature Requests

For feature requests, please describe:

1. **Use Case**: What problem does this solve?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: Other approaches considered
4. **Additional Context**: Any other relevant information

## Questions?

If you have questions about contributing:

1. Check existing [issues](https://github.com/zkp2p/zkp2p-client-sdk/issues)
2. Open a new [discussion](https://github.com/zkp2p/zkp2p-client-sdk/discussions)
3. Reach out to maintainers

## License

By contributing to ZKP2P Client SDK, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to ZKP2P Client SDK!
