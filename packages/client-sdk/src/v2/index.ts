// Versioned v2 entry point (scaffold)
// NOTE: This is a placeholder for the upcoming v2 API client.
// It intentionally does not export the v1 client or types to keep
// compile-time isolation between versions.

// Public types for the v2 client will live here when ready.
// For now, expose a minimal interface to allow typed imports.
export interface Zkp2pClientV2 {
  // Intentionally minimal; expand with real v2 surface when available.
  // Keeping names consistent where stable (e.g., on-chain helpers).
  getUsdcAddress(): string;
}

export type CreateClientV2Options = {
  // Final shape will likely differ from v1's Zkp2pClientOptions.
  // Kept minimal here to avoid leaking v1 types.
  apiKey: string;
  chainId: number;
  baseApiUrl?: string; // If omitted, the v2 client will default to /v2
};

/**
 * Temporary stub for v2 client factory. Throws at runtime to make it clear
 * that v2 implementation is not yet available in this build.
 */
export function createClient(_options: CreateClientV2Options): Zkp2pClientV2 {
  throw new Error(
    "@zkp2p/client-sdk/v2 is not yet available. Install a version that includes the v2 client or use '@zkp2p/client-sdk/v1' for the current API."
  );
}

