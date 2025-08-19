# zkp2p-client-sdk

ZKP2P Client SDK workspace
- Primary package: `packages/client-sdk/` — see `packages/client-sdk/README.md` for integration docs.

Maintainer notes
- CI: typecheck/lint/build/tests on PRs; publish on `v*` tags via GitHub Actions.
- Releases: run `npx release-it --ci` locally to bump + changelog, then push the tag to publish via CI.
