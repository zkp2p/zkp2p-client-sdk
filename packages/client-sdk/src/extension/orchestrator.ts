import { ExtensionMetadataFlow, metadataUtils } from './metadataFlow';
import { ExtensionProofFlow } from './flow';
import { resolvePlatformMethod } from './platformConfig';
import { intentHashHexToDecimalString, assembleProofBytes, type ReclaimProof } from '../utils/proofEncoding';
import type { PaymentPlatformType } from '../types';
import { logger } from '../utils/logger';

export type OrchestratorOptions = {
  debug?: boolean;
  versionPollMs?: number;
  // Maximum time to wait for the first metadata payload to arrive after requesting
  metadataTimeoutMs?: number; // default 60000
};

export type AuthenticateOptions = {
  paymentMethod?: number;
  autoGenerateProof?: {
    intentHashHex: `0x${string}`;
    itemIndex?: number;
    onProofGenerated?: (proofs: ReclaimProof[]) => void;
    onProofError?: (error: Error) => void;
    onProgress?: (progress: ExtensionProofFlowProgress) => void;
  };
  onPaymentsReceived?: (payments: ReturnType<typeof metadataUtils.sortByDateDesc>) => void;
};

export type ExtensionProofFlowProgress = {
  stage: 'waiting_proof_id' | 'polling_proof' | 'proof_success' | 'proof_error';
  proofIndex: number;
  message?: string;
};

export class ExtensionOrchestrator {
  private meta: ExtensionMetadataFlow;
  private debug: boolean;
  private metadataTimeoutMs: number;

  constructor(opts: OrchestratorOptions = {}) {
    this.meta = new ExtensionMetadataFlow({ versionPollMs: opts.versionPollMs ?? 5000, debug: opts.debug });
    this.debug = !!opts.debug;
    this.metadataTimeoutMs = typeof opts.metadataTimeoutMs === 'number' ? opts.metadataTimeoutMs : 60000;
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
    const rec = await this.waitForMetadata(platform, this.metadataTimeoutMs);
    const visible = metadataUtils.filterVisible(rec.metadata);
    const sorted = metadataUtils.sortByDateDesc(visible);
    if (this.debug) logger.debug('[ExtensionOrchestrator] received payments', { count: sorted.length });
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
        if (this.debug) logger.debug('[ExtensionOrchestrator] progress', p);
      });
      return proofs;
    } finally {
      flow.dispose();
    }
  }

  buildProofBytes(proofs: ReclaimProof[], paymentMethod?: number): `0x${string}` {
    return assembleProofBytes(proofs, { paymentMethod });
  }

  /**
   * Unified authentication method that combines metadata request and optional proof generation
   * @param platform - Payment platform type
   * @param options - Authentication options including auto proof generation
   * @returns Object containing payments and optionally proofs
   */
  async authenticateAndGenerateProof(
    platform: PaymentPlatformType,
    options: AuthenticateOptions = {}
  ): Promise<{
    payments: ReturnType<typeof metadataUtils.sortByDateDesc>;
    proofs?: ReclaimProof[];
    proofBytes?: `0x${string}`;
  }> {
    try {
      // Step 1: Request and get payments
      const payments = await this.requestAndGetPayments(platform, options.paymentMethod);
      
      // Callback for payments received
      options.onPaymentsReceived?.(payments);

      // If no auto-proof generation requested, return just payments
      if (!options.autoGenerateProof) {
        return { payments };
      }

      // Step 2: Generate proofs if requested
      const { intentHashHex, itemIndex = 0, onProofGenerated, onProofError, onProgress } = options.autoGenerateProof;
      
      try {
        const proofs = await this.generateProofsWithProgress(
          platform,
          intentHashHex,
          itemIndex,
          options.paymentMethod,
          onProgress
        );
        
        const proofBytes = this.buildProofBytes(proofs, options.paymentMethod);
        
        // Success callback
        onProofGenerated?.(proofs);
        
        return { payments, proofs, proofBytes };
      } catch (error) {
        // Error callback
        onProofError?.(error as Error);
        throw error;
      }
    } catch (error) {
      if (this.debug) logger.error('[ExtensionOrchestrator] authenticateAndGenerateProof error', error);
      throw error;
    }
  }

  /**
   * Generate proofs with enhanced progress callbacks
   */
  private async generateProofsWithProgress(
    platform: PaymentPlatformType,
    intentHashHex: `0x${string}`,
    originalIndex: number,
    paymentMethod?: number,
    onProgress?: (progress: ExtensionProofFlowProgress) => void
  ): Promise<ReclaimProof[]> {
    const method = resolvePlatformMethod(platform, paymentMethod);
    const total = method.requiredProofs;
    const dec = intentHashHexToDecimalString(intentHashHex);
    const flow = new ExtensionProofFlow();
    
    try {
      const proofs = await flow.generateProofs(
        platform, 
        dec, 
        originalIndex, 
        { requiredProofs: total }, 
        (p) => {
          if (this.debug) logger.debug('[ExtensionOrchestrator] progress', p);
          // Convert internal progress to our exposed format
          const progress: ExtensionProofFlowProgress = {
            stage: p.stage,
            proofIndex: p.proofIndex,
            message: 'message' in p ? p.message : undefined
          };
          onProgress?.(progress);
        }
      );
      return proofs;
    } finally {
      flow.dispose();
    }
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
