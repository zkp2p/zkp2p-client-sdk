import { PeerauthExtension } from './peerauth';
import { parseExtensionProof } from './proof';
import type { PaymentPlatformType } from '../types';
import type { ReclaimProof } from '../utils/proofEncoding';

export type ExtensionProofFlowOptions = {
  pollIntervalMs?: number;
  timeoutMs?: number;
  requiredProofs?: number; // defaults to 1
};

export type ExtensionProofFlowProgress =
  | { stage: 'waiting_proof_id'; proofIndex: number }
  | { stage: 'polling_proof'; proofIndex: number }
  | { stage: 'proof_success'; proofIndex: number }
  | { stage: 'proof_error'; proofIndex: number; message?: string };

export class ExtensionProofFlow {
  private ext: PeerauthExtension;
  private proofId: string | null = null;
  private lastRequest: any | null = null;
  private disposed = false;

  constructor(opts: { debug?: boolean } = {}) {
    this.ext = new PeerauthExtension({
      onProofId: (id) => {
        this.proofId = id;
      },
      onProof: (req) => {
        this.lastRequest = req;
      },
    }, { debug: opts.debug });
  }

  dispose() {
    if (this.disposed) return;
    this.ext.dispose();
    this.disposed = true;
  }

  async generateProofs(
    platform: PaymentPlatformType,
    intentHash: string,
    originalIndex: number,
    opts: ExtensionProofFlowOptions = {},
    onProgress?: (p: ExtensionProofFlowProgress) => void
  ): Promise<ReclaimProof[]> {
    const pollInterval = opts.pollIntervalMs ?? 3000;
    const timeoutMs = opts.timeoutMs ?? 60000;
    const total = Math.max(1, opts.requiredProofs ?? 1);
    const proofs: ReclaimProof[] = [];

    for (let i = 0; i < total; i++) {
      this.proofId = null;
      this.lastRequest = null;

      // Request generation (pass proofIndex for additional proofs)
      this.ext.generateProof(platform, intentHash, originalIndex, i > 0 ? i : undefined);

      // Wait for a proofId
      onProgress?.({ stage: 'waiting_proof_id', proofIndex: i });
      await this.waitFor(() => !!this.proofId, timeoutMs, 'Timed out waiting for proof id');

      // Poll until we get a terminal status
      onProgress?.({ stage: 'polling_proof', proofIndex: i });
      const start = Date.now();
      // immediate poll once
      this.ext.fetchProofById();
      while (true) {
        if (Date.now() - start > timeoutMs) {
          onProgress?.({ stage: 'proof_error', proofIndex: i, message: 'Timed out waiting for proof' });
          throw new Error('Timed out waiting for proof');
        }
        const status = this.lastRequest?.status as string | undefined;
        if (status === 'success') {
          try {
            const parsed = parseExtensionProof(this.lastRequest.proof);
            proofs.push(parsed);
            onProgress?.({ stage: 'proof_success', proofIndex: i });
            break;
          } catch (e) {
            onProgress?.({ stage: 'proof_error', proofIndex: i, message: (e as Error)?.message });
            throw e;
          }
        }
        if (status === 'error') {
          onProgress?.({ stage: 'proof_error', proofIndex: i });
          throw new Error('Extension returned error generating proof');
        }
        await this.sleep(pollInterval);
        this.ext.fetchProofById();
      }
    }

    return proofs;
  }

  private async waitFor(cond: () => boolean, timeoutMs: number, message: string) {
    const start = Date.now();
    while (!cond()) {
      if (Date.now() - start > timeoutMs) throw new Error(message);
      await this.sleep(50);
    }
  }

  private sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }
}
