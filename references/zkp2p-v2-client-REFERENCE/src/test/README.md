# Test Infrastructure

This directory contains the testing setup for the ZKP2P V2 client.

## Important Note About Error Messages

When running tests, you may see error messages in stderr like:
- "Failed to save quote data to localStorage: Error: Storage quota exceeded"
- "Failed to retrieve quote data from localStorage: SyntaxError: Unexpected token..."
- "Failed to clear quote data from localStorage: Error: Permission denied"

**These are NOT test failures!** They are expected outputs from tests that specifically verify error handling behavior. The tests are designed to ensure the application handles errors gracefully.

## Test Structure

- `setup.ts` - Global test setup with browser API mocks
- `mocks/` - Reusable mock implementations
- `utils/` - Test utilities and helpers

## Running Tests

```bash
yarn test          # Run tests in watch mode
yarn test --run    # Run tests once
yarn test:ui       # Run tests with UI
yarn test:coverage # Generate coverage report
```

All 135+ tests should pass successfully.