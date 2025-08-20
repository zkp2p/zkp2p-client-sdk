import { createContext } from 'react';

import { EscrowIntentView } from '@helpers/types/escrow';


interface OnRamperIntentsValues {
  currentIntentView: EscrowIntentView | null;
  refetchIntentView: (() => Promise<void>);
  shouldFetchIntentView: boolean;
  currentIntentHash: string | null;
  isLoadingIntentView: boolean;
};

const defaultValues: OnRamperIntentsValues = {
  currentIntentView: null,
  refetchIntentView: () => Promise.resolve(),
  shouldFetchIntentView: false,
  currentIntentHash: null,
  isLoadingIntentView: false
};

const OnRamperIntentsContext = createContext<OnRamperIntentsValues>(defaultValues);

export default OnRamperIntentsContext;
