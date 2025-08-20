import { createContext } from 'react';
import { Deposit, DepositStatus } from '@helpers/types/curator';
import { PaymentPlatformType } from '@helpers/types';

interface BackendValues {
  rawPayeeDetails: string;
  depositorTgUsername: string;
  fetchPayeeDetails: (hashedOnchainId: string, platform: PaymentPlatformType) => Promise<void>;
  clearPayeeDetails: () => void;
  isFetchingRawPayeeDetails: boolean;

  // Owner deposits related fields
  ownerDeposits: Deposit[] | null;
  isLoadingOwnerDeposits: boolean;
  ownerDepositsError: Error | null;
  fetchOwnerDeposits: (ownerAddress: string, options?: { status?: DepositStatus, forceRefresh?: boolean }) => Promise<void>;
  refetchOwnerDeposits: () => Promise<void>;
};

const defaultValues: BackendValues = {
  rawPayeeDetails: '',
  depositorTgUsername: '',
  fetchPayeeDetails: async () => { },
  clearPayeeDetails: () => { },
  isFetchingRawPayeeDetails: false,

  // Default values for owner deposits
  ownerDeposits: null,
  isLoadingOwnerDeposits: false,
  ownerDepositsError: null,
  fetchOwnerDeposits: async () => { },
  refetchOwnerDeposits: async () => { }
};

const BackendContext = createContext<BackendValues>(defaultValues);

export default BackendContext;
