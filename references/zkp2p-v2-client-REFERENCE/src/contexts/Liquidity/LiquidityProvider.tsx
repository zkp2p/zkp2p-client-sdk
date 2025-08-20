import {
  useEffect,
  useState,
  ReactNode,
  useMemo,
} from 'react';
import { createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { alchemyBaseRpcUrl, alchemyBaseSepoliaRpcUrl } from '@helpers/config';

import {
  Abi,
} from '@helpers/types';
import {
  EscrowDepositView,
} from '@helpers/types/escrow';
import { parseEscrowDepositView } from '@helpers/parseEscrowState';
import { esl, CALLER_ACCOUNT, ZERO, ZERO_ADDRESS } from '@helpers/constants';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import useEscrowState from '@hooks/contexts/useEscrowState';

import LiquidityContext from './LiquidityContext';


const BATCH_SIZE = 30;
const PRUNED_DEPOSITS_PREFIX = 'prunedEscrowDepositIds_';

interface ProvidersProps {
  children: ReactNode;
}

const LiquidityProvider = ({ children }: ProvidersProps) => {
  /*
   * Contexts
   */

  const { escrowAddress, escrowAbi, usdcAddress } = useSmartContracts();
  const { depositCounter } = useEscrowState();

  /*
   * State
   */
  const [fetchDepositsTrigger, setFetchDepositsTrigger] = useState(0);

  const [depositViews, setDepositViews] = useState<EscrowDepositView[] | null>(null);

  const [shouldFetchDepositViews, setShouldFetchDepositViews] = useState<boolean>(false);

  /*
   * Contract Reads
   */

  const fetchAndPruneDeposits = async (depositCounter: number, rampAddress: string) => {
    const existingPrunedIds = fetchStoredPrunedDepositIds(rampAddress);
    const depositIdsToFetch = initializeDepositIdsToFetch(depositCounter, existingPrunedIds);
  
    const batchedDeposits: EscrowDepositView[] = [];
    const depositIdsToPrune: number[] = [];
    
    for (let i = 0; i < depositIdsToFetch.length; i += BATCH_SIZE) {
      const depositIdBatch = depositIdsToFetch.slice(i, i + BATCH_SIZE);
      const rawDepositsData = await fetchDepositBatch(depositIdBatch);

      
      const deposits = sanitizeRawDeposits(rawDepositsData as any);
      for (let j = 0; j < deposits.length; j++) {
        const deposit = deposits[j];

        const orderHasNoAvailableLiquidity = deposit.availableLiquidity < deposit.deposit.intentAmountRange.min;
        const orderHasNoOustandingIntent = deposit.deposit.outstandingIntentAmount === ZERO;
        const orderIsFilled = orderHasNoAvailableLiquidity && orderHasNoOustandingIntent;

        const depositOwner = deposit.deposit.depositor;
        const depositToken = deposit.deposit.token;

        if (orderIsFilled || depositOwner === ZERO_ADDRESS || depositToken !== usdcAddress) {
          depositIdsToPrune.push(Number(deposit.depositId));
        } else {
          batchedDeposits.push(deposit);
        }
      }
    }

    const newPrunedDepositIds = [...existingPrunedIds, ...depositIdsToPrune];
    updateStoredPrunedIds(rampAddress, newPrunedDepositIds);

    batchedDeposits.sort((a, b) => {
      return b.availableLiquidity > a.availableLiquidity ? 1 : -1;
    });
    setDepositViews(batchedDeposits);
  };

  const initializeDepositIdsToFetch = (currentDepositCounter: number, storedDepositIdsToPrune: number[]): number[] => {
    if (currentDepositCounter) {
      const prunedIdsSet = new Set(storedDepositIdsToPrune.map(id => id.toString()));
      const depositIds = [];

      for (let i = 0; i < currentDepositCounter; i++) {
        const depositId = i.toString();
        if (!prunedIdsSet.has(depositId)) {
          depositIds.push(i);
        }
      }
  
      return depositIds;
    } else {
      return [];
    }
  };

  const fetchDepositBatch = async (depositIdBatch: number[]) => {
    try {
      // function getDepositFromIds(uint256[] memory _depositIds) external view returns (DepositView[] memory depositArray)
      // Create a public client for reading contract data
      const env = import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT;
      const isTestnet = env === 'STAGING_TESTNET';
      
      const publicClient = createPublicClient({
        chain: isTestnet ? baseSepolia : base,
        transport: http(isTestnet ? alchemyBaseSepoliaRpcUrl : alchemyBaseRpcUrl),
      });

      const data = await publicClient.readContract({
        address: escrowAddress as `0x${string}`,
        abi: escrowAbi as Abi,
        functionName: 'getDepositFromIds',
        args: [depositIdBatch],
        account: CALLER_ACCOUNT,
      });

      return data;
    } catch (error) {
      console.error('Error fetching deposits batch:', error);
      
      return [];
    }
  };

  const sanitizeRawDeposits = (rawDepositsData: any[]) => {
    const sanitizedDeposits: EscrowDepositView[] = [];

    for (let i = rawDepositsData.length - 1; i >= 0; i--) {
      const escrowDepositView = parseEscrowDepositView(rawDepositsData[i]);

      sanitizedDeposits.push(escrowDepositView);
    }

    return sanitizedDeposits;
  };

  /*
   * Hooks
   */
  useEffect(() => {

    const fetchData = async () => {
      if (depositCounter && escrowAddress) {
  
        setShouldFetchDepositViews(true);

        await fetchAndPruneDeposits(Number(depositCounter), escrowAddress);
      } else {
  
        setShouldFetchDepositViews(false);
  
        setDepositViews(null);
      }
    };
  
    fetchData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depositCounter, escrowAddress, fetchDepositsTrigger]);


  /*
   * Public
   */

  const refetchDepositViews = () => {
    setFetchDepositsTrigger(prev => prev + 1);
  };

  /*
   * Helpers
   */

  const fetchStoredPrunedDepositIds = (contractAddress: string) => {
    const prunedIdsStorageKey = `${PRUNED_DEPOSITS_PREFIX}${contractAddress}`;
    const prunedIdsFromStorage = localStorage.getItem(prunedIdsStorageKey);
    const prunedIdsFromStorageParsed = prunedIdsFromStorage ? JSON.parse(prunedIdsFromStorage) : [];

    return prunedIdsFromStorageParsed;
  };

  const updateStoredPrunedIds = (rampAddress: string, prunedDepositIdsToStore: number[]) => {

    const storageKey = `${PRUNED_DEPOSITS_PREFIX}${rampAddress}`;
    localStorage.setItem(storageKey, JSON.stringify(prunedDepositIdsToStore));
  };

  return (
    <LiquidityContext.Provider
      value={{
        depositViews,
        refetchDepositViews,
        shouldFetchDepositViews
      }}
    >
      {children}
    </LiquidityContext.Provider>
  );
};

export default LiquidityProvider;
