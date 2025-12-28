import { useState, useCallback, useMemo, useEffect } from 'react';
import { formatUnits } from 'viem';
import type { Zkp2pClient } from '../../client/Zkp2pClient';
import type { GetTakerTierRequest, TakerTier } from '../../types';

export interface UseGetTakerTierOptions {
  client: Zkp2pClient | null;
  owner?: string | null;
  chainId?: number | null;
  autoFetch?: boolean;
  onSuccess?: (tier: TakerTier) => void;
  onError?: (error: Error) => void;
}

export function useGetTakerTier({
  client,
  owner,
  chainId,
  autoFetch = true,
  onSuccess,
  onError,
}: UseGetTakerTierOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [takerTier, setTakerTier] = useState<TakerTier | null>(null);

  const getTakerTier = useCallback(
    async (params?: GetTakerTierRequest) => {
      if (!client) {
        const err = new Error('Zkp2pClient is not initialized');
        setError(err);
        onError?.(err);
        return null;
      }

      const request = params ?? (owner && chainId ? { owner, chainId } : null);
      if (!request) {
        const err = new Error('Owner address and chainId are required');
        setError(err);
        onError?.(err);
        return null;
      }

      setIsLoading(true);
      setError(null);
      setTakerTier(null);

      try {
        const response = await client.getTakerTier(request);
        setTakerTier(response.responseObject);
        onSuccess?.(response.responseObject);
        return response;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        onError?.(e);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [client, owner, chainId, onSuccess, onError]
  );

  useEffect(() => {
    if (!autoFetch || !owner || !chainId) return;
    void getTakerTier({ owner, chainId });
  }, [autoFetch, owner, chainId, getTakerTier]);

  return useMemo(
    () => ({ getTakerTier, takerTier, isLoading, error }),
    [getTakerTier, takerTier, isLoading, error]
  );
}

const TIER_CAPS: Record<string, number> = {
  PEASANT: 100,
  PEER: 500,
  PLUS: 5000,
  PRO: 10000,
  PLATINUM: 25000,
};

export function getNextTierCap(currentTier: string | undefined): string | null {
  if (!currentTier) return null;

  const tierOrder = ['PEASANT', 'PEER', 'PLUS', 'PRO', 'PLATINUM'];
  const currentIndex = tierOrder.indexOf(currentTier);

  if (currentIndex === -1 || currentIndex >= tierOrder.length - 1) {
    return null;
  }

  const nextTier = tierOrder[currentIndex + 1];
  const nextCap = TIER_CAPS[nextTier];
  return nextCap ? `$${nextCap.toLocaleString()}` : null;
}

function formatCapFromBaseUnits(baseUnits: string): string {
  if (!baseUnits || baseUnits === '') return '$0';
  const value = Number(formatUnits(BigInt(baseUnits), 6));
  return `$${value.toLocaleString()}`;
}

export function getTierDisplayInfo(tier: TakerTier | undefined): {
  tierLabel: string;
  capDisplay: string;
  isNewUser: boolean;
  showScore: boolean;
} {
  if (!tier) {
    return {
      tierLabel: 'Loading...',
      capDisplay: '...',
      isNewUser: false,
      showScore: false,
    };
  }

  const isNewUser = tier.source === 'fallback';
  const isZeroFulfills = tier.stats?.lifetimeFulfilledCount === 0;

  const tierLabels: Record<string, string> = {
    PEASANT: 'Peer Peasant',
    PEER: 'Peer',
    PLUS: 'Peer Plus',
    PRO: 'Peer Pro',
    PLATINUM: 'Peer Platinum',
  };

  const capDisplay = formatCapFromBaseUnits(tier.perIntentCapBaseUnits);

  return {
    tierLabel: tierLabels[tier.tier] || tier.tier,
    capDisplay,
    isNewUser: isNewUser || isZeroFulfills,
    showScore: !isNewUser && !!tier.stats && tier.stats.lockScoreDiluted !== '0',
  };
}
