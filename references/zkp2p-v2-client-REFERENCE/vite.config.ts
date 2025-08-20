import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // This ensures .env files are loaded properly
  loadEnv(mode, process.cwd(), '');
  
  return {
    // Set base URL for assets (important for deployment)
    // If VITE_PUBLIC_URL is empty string, use '/'
    base: process.env.VITE_PUBLIC_URL || '/',
    plugins: [
      react(),
      svgr(),
      nodePolyfills({
        // Enable all polyfills
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
        // Polyfill specific modules
        protocolImports: true,
      }),
    ],
    // Define global constants
    define: {
      'process.env': {},
      'global': 'globalThis',
      // Add Vercel environment if available
      ...(process.env.VERCEL_ENV && {
        '__VERCEL_ENV__': JSON.stringify(process.env.VERCEL_ENV),
      }),
    },
    // Resolve configuration
    resolve: {
      alias: {
        // Path aliases from tsconfig - matching tsconfig.json paths exactly
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
      },
    },
    // Server configuration for better error visibility
    server: {
      port: 3000,
      hmr: {
        overlay: false,
      },
    },
    // Build configuration
    build: {
      outDir: 'build',
    },
    // Optimize deps configuration
    optimizeDeps: {
      exclude: ['vite-plugin-node-polyfills/shims/buffer', 'vite-plugin-node-polyfills/shims/global', 'vite-plugin-node-polyfills/shims/process']
    },
  };
});
