import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    extension: 'src/extension/index.ts',
  },
  format: ['esm', 'cjs'],
  outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.mjs' }),
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'es2020',
  platform: 'browser',
  // Ensure deep imports from @zkp2p/contracts-v2 are resolved at runtime by the consumer,
  // so addresses/ABIs are not baked at publish time and stay up to date.
  external: [
    '@zkp2p/contracts-v2',
    '@zkp2p/contracts-v2/*',
    '@zkp2p/contracts-v2/**',
  ],
});
