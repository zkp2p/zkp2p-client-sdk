import React, { useEffect, useState, ReactNode, useCallback } from 'react';
import { useReadContract } from 'wagmi';

import { EscrowIntentView } from '@helpers/types/escrow';
import { esl, ZERO_ADDRESS } from '@helpers/constants';
import useAccount from '@hooks/contexts/useAccount';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import { basePublicClient } from '@helpers/baseClient';

import OnRamperIntentsContext from './OnRamperIntentsContext';
import { parseEscrowIntentView } from '@helpers/parseEscrowState';

interface ProvidersProps {
  children: ReactNode;
}

const OnRamperIntentsProvider = ({ children }: ProvidersProps) => {
  /*
   * Contexts
   */

  const { isLoggedIn, loggedInEthereumAddress } = useAccount();
  const { escrowAddress, escrowAbi } = useSmartContracts();

  /*
   * State
   */

  const [currentIntentView, setCurrentIntentView] = useState<EscrowIntentView | null>(null);
  const [shouldFetchIntentView, setShouldFetchIntentView] = useState<boolean>(false);
  const [currentIntentHash, setCurrentIntentHash] = useState<string | null>(null);

  /*
   * Contract Read Functions using wagmi
   */

  const { 
    data: intentViewRaw,
    isLoading: isLoadingIntentView,
    refetch: refetchIntentView
  } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: escrowAbi,
    functionName: 'getAccountIntent',
    args: [loggedInEthereumAddress || ZERO_ADDRESS],
    query: {
      enabled: shouldFetchIntentView && Boolean(escrowAddress) && Boolean(escrowAbi) && Boolean(loggedInEthereumAddress),
      refetchInterval: 3000, // Poll every 3 seconds for intent updates
      staleTime: 1500, // Consider data stale after 1.5 seconds
    }
  });

  /*
   * Hooks
   */

  useEffect(() => {
    if (isLoggedIn && loggedInEthereumAddress) {
      setShouldFetchIntentView(true);
    } else {
      setShouldFetchIntentView(false);
      setCurrentIntentView(null)
      setCurrentIntentHash(null)
    }
  }, [isLoggedIn, loggedInEthereumAddress]);

  // Process the wagmi data when it changes
  useEffect(() => {
    if (intentViewRaw) {
      const intentViewData = intentViewRaw as any;
      const intentViewProcessed = parseEscrowIntentView(intentViewData);

      if (intentViewProcessed.intent.owner !== ZERO_ADDRESS) {
        setCurrentIntentView(intentViewProcessed);
        setCurrentIntentHash(intentViewProcessed.intentHash);
      } else {
        setCurrentIntentView(null);
        setCurrentIntentHash(null);
      }
    } else if (!isLoadingIntentView && shouldFetchIntentView) {
      // Only clear if we're not loading and should be fetching
      setCurrentIntentView(null);
      setCurrentIntentHash(null);
    }
  }, [intentViewRaw, isLoadingIntentView, shouldFetchIntentView]);

  return (
    <OnRamperIntentsContext.Provider
      value={{
        currentIntentView,
        refetchIntentView,
        shouldFetchIntentView,
        currentIntentHash,
        isLoadingIntentView
      }}
    >
      {children}
    </OnRamperIntentsContext.Provider>
  );
};

export default OnRamperIntentsProvider;
