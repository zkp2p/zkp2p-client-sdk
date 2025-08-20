import { ExtensionMetadataFlow, metadataUtils } from './metadataFlow';
import { ExtensionProofFlow } from './flow';
import { resolvePlatformMethod } from './platformConfig';
import { intentHashHexToDecimalString, assembleProofBytes, type ReclaimProof } from '../utils/proofEncoding';
import type { PaymentPlatformType } from '../types';

export type OrchestratorOptions = { debug?: boolean; versionPollMs?: number };

export class ExtensionOrchestrator {
  private meta: ExtensionMetadataFlow;
  private debug: boolean;

  constructor(opts: OrchestratorOptions = {}) {
    this.meta = new ExtensionMetadataFlow({ versionPollMs: opts.versionPollMs ?? 5000, debug: opts.debug });
    this.debug = !!opts.debug;
  }

  dispose() {
    this.meta.dispose();
  }

  // Starts the extension UI for metadata, subscribes to updates, and returns a list of visible, sorted payments
  async requestAndGetPayments(
    platform: PaymentPlatformType,
    paymentMethod?: number
  ): Promise<ReturnType<typeof metadataUtils.sortByDateDesc>> {
    const method = resolvePlatformMethod(platform, paymentMethod);
    this.meta.requestMetadata(method.actionType, method.actionPlatform as any);

    // Wait until we have metadata for the platform (basic poll)
    const rec = await this.waitForMetadata(platform, 15000);
    const visible = metadataUtils.filterVisible(rec.metadata);
    const sorted = metadataUtils.sortByDateDesc(visible);
    if (this.debug) console.debug('[ExtensionOrchestrator] received payments', { count: sorted.length });
    return sorted;
  }

  async generateProofs(
    platform: PaymentPlatformType,
    intentHashHex: `0x${string}`,
    originalIndex: number,
    paymentMethod?: number
  ): Promise<ReclaimProof[]> {
    const method = resolvePlatformMethod(platform, paymentMethod);
    const total = method.requiredProofs;
    const dec = intentHashHexToDecimalString(intentHashHex);
    const flow = new ExtensionProofFlow();
    try {
      const proofs = await flow.generateProofs(platform, dec, originalIndex, { requiredProofs: total }, (p) => {
        if (this.debug) console.debug('[ExtensionOrchestrator] progress', p);
      });
      return proofs;
    } finally {
      flow.dispose();
    }
  }

  buildProofBytes(proofs: ReclaimProof[], paymentMethod?: number): `0x${string}` {
    return assembleProofBytes(proofs, { paymentMethod });
  }

  private async waitForMetadata(platform: PaymentPlatformType, timeoutMs: number) {
    const start = Date.now();
    return new Promise<NonNullable<ReturnType<ExtensionMetadataFlow['get']>>>((resolve, reject) => {
      const unsub = this.meta.subscribe((p, record) => {
        if (p !== platform) return;
        unsub();
        resolve(record);
      });
      const check = () => {
        const rec = this.meta.get(platform);
        if (rec) {
          unsub();
          resolve(rec);
        } else if (Date.now() - start > timeoutMs) {
          unsub();
          reject(new Error('Timed out waiting for metadata'));
        } else {
          setTimeout(check, 250);
        }
      };
      check();
    });
  }
}

