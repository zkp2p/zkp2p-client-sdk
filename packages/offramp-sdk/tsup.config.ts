import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    react: 'src/react/index.ts',
  },
  format: ['esm', 'cjs'],
  outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.mjs' }),
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'es2020',
  platform: 'browser',
  // Externalize React (peer dependency) and @zkp2p/contracts-v2 deep imports.
  // Resolve only non-JSON deep imports from @zkp2p/contracts-v2 at runtime.
  // Keep JSON (abis, paymentMethods) bundled to avoid Node ESM import assertion issues.
  external: [
    'react',
    '@zkp2p/contracts-v2',
    '@zkp2p/contracts-v2/addresses/*',
    '@zkp2p/contracts-v2/constants/*',
  ],
});
