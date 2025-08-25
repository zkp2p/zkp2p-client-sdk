import { PeerauthExtension } from './peerauth';
import type { ExtensionRequestMetadata, PaymentPlatformType } from '../types';
import { logger } from '../utils/logger';

export type MetadataRecord = {
  metadata: ExtensionRequestMetadata[];
  expiresAt: number; // epoch ms
  receivedAt: number; // epoch ms
};

export type ExtensionMetadataFlowOptions = {
  // Optionally ping the extension for version to detect install status
  versionPollMs?: number; // default 5000
  debug?: boolean;
};

type Subscriber = (platform: PaymentPlatformType, record: MetadataRecord) => void;

export class ExtensionMetadataFlow {
  private ext: PeerauthExtension;
  private disposed = false;
  private cache = new Map<PaymentPlatformType, MetadataRecord>();
  private subscribers = new Set<Subscriber>();
  private versionTimer: any = null;

  constructor(opts: ExtensionMetadataFlowOptions = {}) {
    this.ext = new PeerauthExtension({
      onMetadata: (platform, payload) => {
        const record: MetadataRecord = {
          metadata: payload.metadata || [],
          expiresAt: payload.expiresAt || 0,
          receivedAt: Date.now(),
        };
        this.cache.set(platform, record);
        for (const cb of this.subscribers) cb(platform, record);
      },
    }, { debug: opts.debug });

    const poll = Math.max(0, opts.versionPollMs ?? 5000);
    if (poll > 0 && this.ext.isBrowser()) {
      this.versionTimer = setInterval(() => this.ext.fetchVersion(), poll);
      this.ext.fetchVersion();
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.versionTimer) clearInterval(this.versionTimer);
    this.ext.dispose();
    this.subscribers.clear();
    this.cache.clear();
  }

  // Subscribe to metadata updates across all platforms
  subscribe(cb: Subscriber): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  // Access last known metadata for a platform
  get(platform: PaymentPlatformType): MetadataRecord | undefined {
    return this.cache.get(platform);
  }

  // Clear cached metadata for a platform
  clear(platform: PaymentPlatformType) {
    this.cache.delete(platform);
  }

  // Convenience: request metadata by opening the appropriate extension tab/action
  requestMetadata(actionType: string, platform: PaymentPlatformType) {
    if (this.ext && (this.ext as any)._debug) logger.debug('[ExtensionMetadataFlow] requestMetadata', actionType, platform);
    this.ext.openNewTab(actionType, platform);
  }

  // Whether cached metadata is expired relative to current time
  isExpired(platform: PaymentPlatformType): boolean {
    const rec = this.cache.get(platform);
    if (!rec) return true;
    return rec.expiresAt > 0 ? Date.now() >= rec.expiresAt : false;
  }

  // Test/support hook to ingest metadata programmatically (SSR or tests)
  ingest(platform: PaymentPlatformType, metadata: ExtensionRequestMetadata[], expiresAt: number) {
    const record: MetadataRecord = { metadata, expiresAt, receivedAt: Date.now() };
    this.cache.set(platform, record);
    for (const cb of this.subscribers) cb(platform, record);
  }
}

// Utility helpers for integrators to shape/select metadata
export const metadataUtils = {
  filterVisible(list: ExtensionRequestMetadata[]) {
    return (list || []).filter((m) => !m.hidden);
  },
  sortByDateDesc(list: ExtensionRequestMetadata[]) {
    const toEpoch = (d: any): number => {
      if (d == null) return 0;
      if (typeof d === 'number' && Number.isFinite(d)) return d;
      if (typeof d === 'string') {
        // If numeric-like string, parse as int; else Date.parse
        const maybeNum = Number(d);
        if (Number.isFinite(maybeNum)) return maybeNum;
        const parsed = Date.parse(d);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };
    return [...(list || [])].sort((a: any, b: any) => toEpoch(b?.date) - toEpoch(a?.date));
  },
  selectByOriginalIndex(list: ExtensionRequestMetadata[], originalIndex: number) {
    return (list || []).find((m) => m.originalIndex === originalIndex);
  },
};
