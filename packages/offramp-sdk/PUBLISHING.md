# Publishing @zkp2p/client-sdk

This guide covers publishing prereleases (dev) and stable releases to npm.

Prereqs
- npm access to the `@zkp2p` org
- Node 18+
- 2FA token (if your npm account requires it)

Build & Verify
1) Install and build the package
```
cd packages/client-sdk
npm ci
npm run typecheck
npm run test
npm run build
```

2) Sanity‑check the tarball contents (optional)
```
npm pack --dry-run
```

Dev (prerelease) publish
- Use a `dev` dist‑tag so consumers can test without moving `latest`.
```
cd packages/client-sdk
npm publish --access public --tag dev --no-provenance --otp <CODE>
# without 2FA:
# npm publish --access public --tag dev --no-provenance
```

Stable (latest) publish
- Publish the same version without the `dev` tag, or promote an existing version to `latest`.
```
cd packages/client-sdk
npm publish --access public --no-provenance --otp <CODE>
# or promote an existing version:
npm dist-tag add @zkp2p/client-sdk@<version> latest --otp <CODE>
```

Notes
- `--no-provenance` is required when publishing from a private repo or local machine. Use provenance from public CI only.
- Verify the tags:
```
npm view @zkp2p/client-sdk dist-tags
```
- The README shown on the npm landing page is from the version tagged as `latest`.
