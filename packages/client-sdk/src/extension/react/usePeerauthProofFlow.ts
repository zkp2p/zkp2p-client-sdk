import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PaymentPlatformType } from '../../types';
import type { ReclaimProof } from '../../utils/proofEncoding';
import { ExtensionProofFlow, type ExtensionProofFlowOptions, type ExtensionProofFlowProgress } from '../flow';

export type UsePeerauthProofFlowOptions = ExtensionProofFlowOptions & { debug?: boolean };

export type UsePeerauthProofFlowState = {
  status: 'idle' | 'waiting_proof_id' | 'polling_proof' | 'success' | 'error' | 'done';
  progress?: { stage: ExtensionProofFlowProgress['stage']; proofIndex: number; message?: string };
  proofs: ReclaimProof[];
  error: Error | null;
};

export function usePeerauthProofFlow(opts: UsePeerauthProofFlowOptions = {}) {
  const flowRef = useRef<ExtensionProofFlow | null>(null);
  const [state, setState] = useState<UsePeerauthProofFlowState>({ status: 'idle', proofs: [], error: null });

  const initFlow = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!flowRef.current) flowRef.current = new ExtensionProofFlow({ debug: opts.debug });
  }, [opts.debug]);

  useEffect(() => {
    initFlow();
    return () => {
      try { flowRef.current?.dispose(); } catch (_e) { /* ignore */ }
      flowRef.current = null;
    };
  }, [initFlow]);

  const start = useCallback(async (platform: PaymentPlatformType, intentHash: string, originalIndex: number) => {
    initFlow();
    if (!flowRef.current) throw new Error('Peerauth flow unavailable in this environment');
    setState({ status: 'idle', proofs: [], error: null });
    try {
      const proofs = await flowRef.current.generateProofs(platform, intentHash, originalIndex, opts, (p) => {
        setState((prev) => ({
          ...prev,
          status: p.stage === 'proof_success' ? 'success' : p.stage === 'proof_error' ? 'error' : (p.stage as any),
          progress: { stage: p.stage, proofIndex: (p as any).proofIndex, message: (p as any).message },
        }));
      });
      setState({ status: 'done', proofs, error: null });
      return proofs;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setState({ status: 'error', proofs: [], error: err });
      throw err;
    }
  }, [opts, initFlow]);

  const reset = useCallback(() => setState({ status: 'idle', proofs: [], error: null }), []);

  return useMemo(() => ({ ...state, start, reset }), [state, start, reset]);
}
