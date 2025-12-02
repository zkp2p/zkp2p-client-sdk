# Publishing Guide

This project publishes the SDK as `@zkp2p/offramp-sdk` on npm. Follow the steps below for development (dev tag) and stable releases.

## Dev Release (recommended for integrators)

- Ensure org access: `npm whoami` (your user must have publish rights to `@zkp2p`)
- Set scope + version in the package:
  - `cd packages/offramp-sdk`
  - `npm pkg set version=0.1.0` (or bump)
- Build and publish using the `dev` dist‑tag so it doesn't affect `latest`:
  - `npm ci && npm run build`
  - With 2FA: `npm publish --access public --tag dev --no-provenance --otp <CODE>`
  - Without 2FA: `npm publish --access public --tag dev --no-provenance`
- Verify and share:
  - `npm view @zkp2p/offramp-sdk dist-tags`
  - Install: `npm i @zkp2p/offramp-sdk@dev`

Notes:
- `--no-provenance` is required when publishing from a private repo. Use provenance only with public CI.

## Stable Release (latest)

- Bump version (semver), keep scope: `@zkp2p/offramp-sdk`.
- Prefer CI with provenance if the repo is public. For manual:
  - `npm publish --access public --no-provenance`
- Verify dist‑tags. Consumers install with `npm i @zkp2p/offramp-sdk` (no tag).

## Tagging (optional)

If you prefer tags to drive CI releases, push `v*` tags and let CI publish (ensure the workflow and tokens are configured). For manual releases, tags are optional.
