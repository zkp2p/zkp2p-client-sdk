# Publishing @zkp2p/offramp-sdk

This guide covers publishing prereleases (dev) and stable releases to npm.

## Prerequisites

- npm access to the `@zkp2p` org
- Node 18+
- 2FA token (if your npm account requires it)

## Build & Verify

1. Install and build the package:

```bash
cd packages/offramp-sdk
npm install
npm run typecheck
npm run test
npm run build
```

2. Sanity-check the tarball contents (optional):

```bash
npm pack --dry-run
```

## Dev (prerelease) Publish

Use a `dev` dist-tag so consumers can test without moving `latest`:

```bash
cd packages/offramp-sdk
npm publish --access public --tag dev --no-provenance --otp <CODE>

# Without 2FA:
npm publish --access public --tag dev --no-provenance
```

## Stable (latest) Publish

Publish the same version without the `dev` tag, or promote an existing version to `latest`:

```bash
cd packages/offramp-sdk
npm publish --access public --no-provenance --otp <CODE>

# Or promote an existing version:
npm dist-tag add @zkp2p/offramp-sdk@<version> latest --otp <CODE>
```

## Notes

- `--no-provenance` is required when publishing from a private repo or local machine. Use provenance from public CI only.
- Verify the tags:

```bash
npm view @zkp2p/offramp-sdk dist-tags
```

- The README shown on the npm landing page is from the version tagged as `latest`.
