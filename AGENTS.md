# Repository Guidelines

## Project Structure & Module Organization
- `packages/offramp-sdk/`: Browser-first TypeScript SDK (ESM/CJS builds). Entry points: `src/index.ts` (core) and `src/react/index.ts` (React hooks).
- Docs: `packages/offramp-sdk/README.md` (integrator docs).

## Build, Test, and Development Commands
- Navigate to the package: `cd packages/offramp-sdk`
- Build: `npm run build` — builds ESM/CJS bundles and type declarations via tsup.
- Type-check: `npm run typecheck` — runs `tsc -p tsconfig.json --noEmit`.
- Lint: `npm run lint` — runs ESLint on `src`.
- Test: `npm run test` — runs Vitest (add tests under `src/**/__tests__` or `src/**/*.test.ts`).

## Coding Style & Naming Conventions
- Language: TypeScript (strict). Prefer explicit types for public APIs.
- Modules: framework-agnostic core under `src/`, React hooks under `src/react/`.
- Types: use `CurrencyType` for ISO-like codes and `OnchainCurrency` for `{ code, conversionRate }`.
- Platforms: use `PaymentPlatformType` (derived union) from `PAYMENT_PLATFORMS`.

## Testing Guidelines
- Framework: Vitest. Aim for unit tests of adapters and contract call arg shaping.
- Suggested locations: `src/**/__tests__` or `src/**/*.test.ts`.
- Run: `npm run test`. Add focused tests before broader integration.

## Commit & Pull Request Guidelines
- Commit messages: follow Conventional Commits (e.g., `feat: add deposit filtering`, `fix: handle API 429 retry`).
- Pull requests should include:
  - Clear description of changes and rationale.
  - Linked issue(s) when applicable.
  - Screenshots/logs for developer UX changes (if relevant).
  - Checklist: build passes, typecheck/lint clean, tests added/updated.

## Security & Configuration Tips
- Do not commit API keys. Pass them at runtime via app configuration.
- React hooks are optional; the core SDK works with any framework.

## Release Workflow
- Dev (manual):
  - `cd packages/offramp-sdk && npm pkg set version=0.1.0`
  - `npm ci && npm run build`
  - Publish as dev tag (doesn't affect `latest`):
    - With 2FA: `npm publish --access public --tag dev --no-provenance --otp <CODE>`
    - Without 2FA: `npm publish --access public --tag dev --no-provenance`
  - Verify: `npm view @zkp2p/offramp-sdk dist-tags`
- Stable:
  - Bump version (semver) and publish without `--tag dev`.
  - Use provenance if publishing from a public CI; avoid provenance from private repos.
  - Verify dist-tags and share install instructions.
