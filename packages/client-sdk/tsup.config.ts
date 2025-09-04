import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    extension: 'src/extension/index.ts',
    'v1/index': 'src/v1/index.ts',
    'v2/index': 'src/v2/index.ts',
  },
  format: ['esm', 'cjs'],
  outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.mjs' }),
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'es2020',
  platform: 'browser',
});
