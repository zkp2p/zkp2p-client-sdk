import React, { useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useReadContract } from 'wagmi';
import {
  EscrowDepositView,
  EscrowIntentView,
} from '@helpers/types/escrow';
import { esl, ZERO_ADDRESS } from '@helpers/constants';
import {
  parseEscrowDepositView,
  parseEscrowIntentView,
} from '@helpers/parseEscrowState';
import useAccount from '@hooks/contexts/useAccount';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import { basePublicClient } from '@helpers/baseClient';

import DepositsContext from './DepositsContext';


interface ProvidersProps {
  children: ReactNode;
}

const DepositsProvider = ({ children }: ProvidersProps) => {
  /*
   * Contexts
   */

  const { isLoggedIn, loggedInEthereumAddress } = useAccount();
  const { escrowAddress, escrowAbi, usdcAddress } = useSmartContracts();

  /*
   * State
   */

  const [depositViews, setDepositViews] = useState<EscrowDepositView[] | null>(null);
  const [intentViews, setIntentViews] = useState<EscrowIntentView[] | null>(null);
  const [shouldFetchDepositViews, setShouldFetchDepositViews] = useState<boolean>(false);
  const [uniqueIntentHashes, setUniqueIntentHashes] = useState<string[]>([]);
  const [shouldFetchIntentViews, setShouldFetchIntentViews] = useState<boolean>(false);
  
  // Simple polling control - wagmi handles the actual polling
  const [refetchInterval, setRefetchInterval] = useState<number | false>(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /*
   * Contract Read Functions using wagmi
   */

  // Fetch deposit views
  const {
    data: depositViewsRaw,
    isLoading: isLoadingDepositViews,
    refetch: refetchDepositViewsImpl
  } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: escrowAbi,
    functionName: 'getAccountDeposits',
    args: [loggedInEthereumAddress as `0x${string}`],
    query: {
      enabled: shouldFetchDepositViews && Boolean(escrowAddress) && Boolean(escrowAbi) && Boolean(loggedInEthereumAddress),
      // Dynamic polling - controlled by refetchInterval state
      refetchInterval: refetchInterval,
      staleTime: 0, // Always consider data stale to ensure fresh fetches
      gcTime: 0, // Don't cache the data (was cacheTime in wagmi v1)
    }
  });

  // Fetch intent views
  const {
    data: intentViewsRaw,
    isLoading: isLoadingIntentViews,
    refetch: refetchIntentViews
  } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: escrowAbi,
    functionName: 'getIntents',
    args: [uniqueIntentHashes],
    query: {
      enabled: shouldFetchIntentViews && Boolean(escrowAddress) && Boolean(escrowAbi) && uniqueIntentHashes.length > 0,
      // No polling needed - manual refetch after transactions + 5-minute UI interval is sufficient
      staleTime: 0, // Always consider data stale to ensure fresh fetches
      gcTime: 0, // Don't cache the data
    }
  });

  // Start temporary polling after deposit operations
  const triggerDepositRefresh = useCallback(() => {
    // Clear any existing timeout to prevent overlapping timers
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
    }
    
    // Start polling every 2 seconds
    setRefetchInterval(2000);
    
    // Stop polling after 10 seconds
    const timeout = setTimeout(() => {
      setRefetchInterval(false);
      pollingTimeoutRef.current = null;
    }, 10000);
    
    pollingTimeoutRef.current = timeout;
    
    // Also do an immediate refetch
    refetchDepositViewsImpl();
  }, [refetchDepositViewsImpl]);

  // Legacy refetch for backward compatibility
  const refetchDepositViews = useCallback(async () => {
    await refetchDepositViewsImpl();
  }, [refetchDepositViewsImpl]);

  /*
  
   * Hooks
   */

  // Cleanup polling timeout on unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {

    if (isLoggedIn && loggedInEthereumAddress && escrowAddress) {

      setShouldFetchDepositViews(true);
    } else {

      setShouldFetchDepositViews(false);

      setDepositViews(null);
      setIntentViews(null);
    }
  }, [isLoggedIn, loggedInEthereumAddress, escrowAddress]);

  useEffect(() => {

    if (uniqueIntentHashes.length > 0) {

      setShouldFetchIntentViews(true);
    } else {

      setShouldFetchIntentViews(false);

      setIntentViews(null);
    }
  }, [uniqueIntentHashes]);

  // Process deposit views when wagmi data changes
  useEffect(() => {
    if (depositViewsRaw) {
      const depositsArrayRaw = depositViewsRaw as any[];
      const sanitizedDeposits: EscrowDepositView[] = [];
      const depositIntentHashes: string[][] = [];

      for (let i = depositsArrayRaw.length - 1; i >= 0; i--) {
        const escrowDepositView = parseEscrowDepositView(depositsArrayRaw[i]);

        // skip deposits that are not usdc
        if (
          escrowDepositView.deposit.depositor === ZERO_ADDRESS ||
          escrowDepositView.deposit.token !== usdcAddress
        ) {
          continue;
        }

        sanitizedDeposits.push(escrowDepositView);
        depositIntentHashes.push(escrowDepositView.deposit.intentHashes);
      }
          
      setDepositViews(sanitizedDeposits);
      
      const flattenedDepositIntentHashes = depositIntentHashes.flat();
      setUniqueIntentHashes(flattenedDepositIntentHashes);
    } else if (!isLoadingDepositViews && shouldFetchDepositViews) {
      setDepositViews(null);
      setUniqueIntentHashes([]);
    }
  }, [depositViewsRaw, isLoadingDepositViews, shouldFetchDepositViews, usdcAddress]);

  // Process intent views when wagmi data changes
  useEffect(() => {
    if (intentViewsRaw && (intentViewsRaw as any[]).length > 0) {
      const depositIntentsArray = intentViewsRaw as any[];
      const sanitizedIntents: EscrowIntentView[] = [];
      
      for (let i = depositIntentsArray.length - 1; i >= 0; i--) {
        const escrowIntentView = parseEscrowIntentView(depositIntentsArray[i]);

        // skip deposits that are not usdc
        if (
          escrowIntentView.deposit.deposit.depositor === ZERO_ADDRESS ||
          escrowIntentView.deposit.deposit.token !== usdcAddress
        ) {
          continue;
        }

        sanitizedIntents.push(escrowIntentView);
      }

      setIntentViews(sanitizedIntents);
    } else if (!isLoadingIntentViews && shouldFetchIntentViews) {
      setIntentViews([]);
    }
  }, [intentViewsRaw, isLoadingIntentViews, shouldFetchIntentViews, usdcAddress]);

  return (
    <DepositsContext.Provider
      value={{
        depositViews,
        intentViews,
        refetchDepositViews,
        triggerDepositRefresh,
        shouldFetchDepositViews,
        refetchIntentViews,
        shouldFetchIntentViews,
      }}
    >
      {children}
    </DepositsContext.Provider>
  );
};

export default DepositsProvider;
