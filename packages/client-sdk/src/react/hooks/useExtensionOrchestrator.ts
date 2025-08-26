import { useState, useCallback, useRef, useEffect } from 'react';
import { ExtensionOrchestrator } from '../../extension/orchestrator';
import type { AuthenticateOptions, ExtensionProofFlowProgress, OrchestratorOptions } from '../../extension/orchestrator';
import type { PaymentPlatformType } from '../../types';
import type { ReclaimProof } from '../../utils/proofEncoding';
import { metadataUtils } from '../../extension/metadataFlow';

export interface UseExtensionOrchestratorOptions extends OrchestratorOptions {
  autoDispose?: boolean; // Automatically dispose orchestrator on unmount
}

/**
 * Hook for managing Extension Orchestrator with unified authentication
 * 
 * @example
 * ```tsx
 * const { 
 *   authenticate, 
 *   payments, 
 *   proofs, 
 *   isAuthenticating, 
 *   isGeneratingProof 
 * } = useExtensionOrchestrator({ 
 *   debug: true,
 *   autoDispose: true,
 * });
 * 
 * // Authenticate and optionally generate proof
 * await authenticate('venmo', {
 *   autoGenerateProof: {
 *     intentHashHex: '0x123...',
 *     itemIndex: 0,
 *     onProofGenerated: (proofs) => console.log('Proofs:', proofs),
 *   }
 * });
 * ```
 */
export function useExtensionOrchestrator(options: UseExtensionOrchestratorOptions = {}) {
  const [payments, setPayments] = useState<ReturnType<typeof metadataUtils.sortByDateDesc> | null>(null);
  const [proofs, setProofs] = useState<ReclaimProof[] | null>(null);
  const [proofBytes, setProofBytes] = useState<`0x${string}` | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<ExtensionProofFlowProgress | null>(null);

  const orchestratorRef = useRef<ExtensionOrchestrator | null>(null);

  // Initialize orchestrator
  useEffect(() => {
    const { autoDispose, ...orchestratorOptions } = options;
    orchestratorRef.current = new ExtensionOrchestrator(orchestratorOptions);

    return () => {
      if (autoDispose !== false && orchestratorRef.current) {
        orchestratorRef.current.dispose();
        orchestratorRef.current = null;
      }
    };
  }, [options.debug, options.versionPollMs, options.metadataTimeoutMs]);

  const authenticate = useCallback(
    async (platform: PaymentPlatformType, authOptions?: AuthenticateOptions) => {
      if (!orchestratorRef.current) {
        const err = new Error('Orchestrator not initialized');
        setError(err);
        return null;
      }

      setIsAuthenticating(true);
      setError(null);
      setProgress(null);

      if (authOptions?.autoGenerateProof) {
        setIsGeneratingProof(true);
      }

      try {
        const result = await orchestratorRef.current.authenticateAndGenerateProof(platform, {
          ...authOptions,
          onPaymentsReceived: (payments) => {
            setPayments(payments);
            authOptions?.onPaymentsReceived?.(payments);
          },
          autoGenerateProof: authOptions?.autoGenerateProof ? {
            ...authOptions.autoGenerateProof,
            onProgress: (progress) => {
              setProgress(progress);
              authOptions.autoGenerateProof?.onProgress?.(progress);
            },
            onProofGenerated: (proofs) => {
              setProofs(proofs);
              authOptions.autoGenerateProof?.onProofGenerated?.(proofs);
            },
            onProofError: (error) => {
              setError(error);
              authOptions.autoGenerateProof?.onProofError?.(error);
            },
          } : undefined,
        });

        setPayments(result.payments);
        if (result.proofs) {
          setProofs(result.proofs);
          setProofBytes(result.proofBytes || null);
        }

        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        return null;
      } finally {
        setIsAuthenticating(false);
        setIsGeneratingProof(false);
      }
    },
    []
  );

  const requestPayments = useCallback(
    async (platform: PaymentPlatformType, paymentMethod?: number) => {
      if (!orchestratorRef.current) {
        const err = new Error('Orchestrator not initialized');
        setError(err);
        return null;
      }

      setIsAuthenticating(true);
      setError(null);

      try {
        const payments = await orchestratorRef.current.requestAndGetPayments(platform, paymentMethod);
        setPayments(payments);
        return payments;
      } catch (err) {
        const error = err as Error;
        setError(error);
        return null;
      } finally {
        setIsAuthenticating(false);
      }
    },
    []
  );

  const generateProofs = useCallback(
    async (
      platform: PaymentPlatformType,
      intentHashHex: `0x${string}`,
      originalIndex: number,
      paymentMethod?: number
    ) => {
      if (!orchestratorRef.current) {
        const err = new Error('Orchestrator not initialized');
        setError(err);
        return null;
      }

      setIsGeneratingProof(true);
      setError(null);
      setProgress(null);

      try {
        const proofs = await orchestratorRef.current.generateProofs(
          platform,
          intentHashHex,
          originalIndex,
          paymentMethod
        );
        
        const proofBytes = orchestratorRef.current.buildProofBytes(proofs, paymentMethod);
        
        setProofs(proofs);
        setProofBytes(proofBytes);
        
        return { proofs, proofBytes };
      } catch (err) {
        const error = err as Error;
        setError(error);
        return null;
      } finally {
        setIsGeneratingProof(false);
      }
    },
    []
  );

  const dispose = useCallback(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.dispose();
      orchestratorRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setPayments(null);
    setProofs(null);
    setProofBytes(null);
    setError(null);
    setProgress(null);
    setIsAuthenticating(false);
    setIsGeneratingProof(false);
  }, []);

  return {
    // Methods
    authenticate,
    requestPayments,
    generateProofs,
    dispose,
    reset,
    // State
    payments,
    proofs,
    proofBytes,
    isAuthenticating,
    isGeneratingProof,
    error,
    progress,
  };
}