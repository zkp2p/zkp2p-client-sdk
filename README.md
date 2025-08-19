# zkp2p-client-sdk

ZKP2P Client SDK workspace
- Primary package: `packages/client-sdk/` — see `packages/client-sdk/README.md` for integration docs.

## Supported Platforms and Currencies

- Platforms: `wise`, `venmo`, `revolut`, `cashapp`, `mercadopago`, `zelle`, `paypal`, `monzo`.
- Currencies: Full fiat list aligned with v2 client (incl. AED, ARS, AUD, CAD, CHF, CNY, CZK, DKK, EUR, GBP, HKD, HUF, IDR, ILS, INR, JPY, KES, MXN, MYR, NOK, NZD, PHP, PLN, RON, SAR, SEK, SGD, THB, TRY, UGX, USD, VND, ZAR).

## Browser Extension

- The SDK exposes a browser-only extension helper at `@zkp2p/client-sdk/extension` for peerauth integration (postMessage API).
- In SSR, import dynamically or guard usage with `typeof window !== 'undefined'`.

Maintainer notes
- CI: typecheck/lint/build/tests on PRs; publish on `v*` tags via GitHub Actions.
- Releases: run `npx release-it --ci` locally to bump + changelog, then push the tag to publish via CI.
