# Repository Guidelines

## Project Structure & Module Organization
- `packages/client-sdk/`: Browser-first TypeScript SDK (ESM/CJS builds). Entry points: `src/index.ts` (core) and `src/extension/index.ts` (browser-only peerauth helpers).
- `zkp2p-react-native-sdk-REFERENCE/`: Reference RN SDK used for core logic parity.
- `zkp2p-v2-client-REFERENCE/`: Reference web client used for extension flow parity.
- Docs: `CLIENT_SDK_PLAN.md` (plan/progress), `packages/client-sdk/README.md` (integrator docs).

## Build, Test, and Development Commands
- Navigate to the package: `cd packages/client-sdk`
- Build: `npm run build` — builds ESM/CJS bundles and type declarations via tsup.
- Type-check: `npm run typecheck` — runs `tsc -p tsconfig.json --noEmit`.
- Lint: `npm run lint` — runs ESLint on `src`.
- Test: `npm run test` — runs Vitest (add tests under `src/**/__tests__` or `src/**/*.test.ts`).

## Coding Style & Naming Conventions
- Language: TypeScript (strict). Prefer explicit types for public APIs.
- Modules: framework-agnostic core under `src/`, browser-only helpers under `src/extension/`.
- Proof utilities: neutral naming (`proofEncoding`) to reflect no Reclaim SDK dependency in web.
- Types: use `CurrencyType` for ISO-like codes and `OnchainCurrency` for `{ code, conversionRate }`.
- Platforms: use `PaymentPlatformType` (derived union) from `PAYMENT_PLATFORMS`.

## Testing Guidelines
- Framework: Vitest. Aim for unit tests of adapters, proof encoding, and contract call arg shaping.
- Suggested locations: `src/**/__tests__` or `src/**/*.test.ts`.
- Run: `npm run test`. Add focused tests before broader integration.

## Commit & Pull Request Guidelines
- Commit messages: follow Conventional Commits (e.g., `feat: add parseExtensionProof`, `fix: handle API 429 retry`).
- Pull requests should include:
  - Clear description of changes and rationale.
  - Linked issue(s) when applicable.
  - Screenshots/logs for developer UX changes (if relevant).
  - Checklist: build passes, typecheck/lint clean, tests added/updated.

## Security & Configuration Tips
- Extension entry (`@zkp2p/client-sdk/extension`) is browser-only; guard in SSR (`typeof window !== 'undefined'`).
- Do not commit API keys. Pass them at runtime via app configuration.
- Validate `event.origin` for all `postMessage` listeners (already implemented in `PeerauthExtension`).

## Release Workflow
- Versioning: Conventional Commits via `release-it`.
- Dry-run: `cd packages/client-sdk && npx release-it --dry-run --ci`.
- Tag & Publish (CI): push a tag like `v0.1.0` to trigger `.github/workflows/release.yml`.
- Tokens: set `NPM_TOKEN` (repo secret). For GitHub Release notes via API, set `GITHUB_TOKEN` (or rely on web fallback).
