// Setup environment variables for tests
// This must be imported before any modules that use import.meta.env

// Set default test environment variables
const testEnvVars = {
  VITE_CURATOR_API_URL: 'https://api.test.com',
  VITE_ALCHEMY_API_KEY: 'test-alchemy-key',
  VITE_PRIVY_APP_ID: 'test-privy-app-id',
  VITE_DEPLOYMENT_ENVIRONMENT: 'test',
};

// Ensure import.meta.env exists
if (!import.meta.env) {
  (import.meta as any).env = {};
}

// Apply test environment variables
Object.entries(testEnvVars).forEach(([key, value]) => {
  (import.meta.env as any)[key] = value;
});

// Also set them on process.env for compatibility
Object.entries(testEnvVars).forEach(([key, value]) => {
  process.env[key] = value;
});