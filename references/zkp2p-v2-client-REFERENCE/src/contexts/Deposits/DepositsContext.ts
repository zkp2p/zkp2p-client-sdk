import { createContext } from 'react';

import { EscrowDepositView, EscrowIntentView } from '@helpers/types/escrow';


interface DepositsValues {
  depositViews: EscrowDepositView[] | null;
  intentViews: EscrowIntentView[] | null;
  refetchDepositViews: (() => void) | null;
  triggerDepositRefresh: (() => void) | null;
  shouldFetchDepositViews: boolean;
  refetchIntentViews: (() => void) | null;
  shouldFetchIntentViews: boolean;
}

const defaultValues: DepositsValues = {
  depositViews: null,
  intentViews: null,
  refetchDepositViews: null,
  triggerDepositRefresh: null,
  shouldFetchDepositViews: false,
  refetchIntentViews: null,
  shouldFetchIntentViews: false
};

const DepositsContext = createContext<DepositsValues>(defaultValues)

export default DepositsContext