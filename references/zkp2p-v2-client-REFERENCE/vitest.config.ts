import { defineConfig } from 'vitest/config';
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import svgr from "vite-plugin-svgr";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      "@components": path.resolve(__dirname, "./src/components"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@helpers": path.resolve(__dirname, "./src/helpers"),
      "@theme": path.resolve(__dirname, "./src/theme"),
      "@contexts": path.resolve(__dirname, "./src/contexts"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@icons": path.resolve(__dirname, "./src/icons"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@styles": path.resolve(__dirname, "./src/styles"),
      "@test": path.resolve(__dirname, "./src/test"),
    },
  },
  test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/mockData/*',
          'src/helpers/abi/**', // Contract ABIs
          'src/helpers/legacy/**', // Legacy code
          'src/assets/**', // Assets
          'src/**/*.stories.tsx', // Storybook files
        ],
      },
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      // Use threads for better performance and compatibility
      pool: 'threads',
      poolOptions: {
        threads: {
          // Keep isolation enabled for test reliability
          isolate: true,
          // Use multiple threads for faster execution
          maxThreads: 4,
          minThreads: 1,
        },
      },
      // Ensure proper test isolation
      isolate: true,
      // Clear mocks between tests
      clearMocks: true,
      restoreMocks: true,
      mockReset: true,
      // Timeouts
      testTimeout: 20000,
      hookTimeout: 20000,
      // Test sequence configuration
      sequence: {
        // Run hooks in proper order
        hooks: 'stack',
        // Don't shuffle to maintain predictability
        shuffle: false,
      },
      // Optimize dependency handling
      deps: {
        optimizer: {
          web: {
            enabled: true,
            include: ['@helpers/**', '@hooks/**', '@contexts/**']
          }
        }
      },
    },
});