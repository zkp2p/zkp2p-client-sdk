import { createContext } from 'react';

import {
  EscrowDepositView
} from '@helpers/types/escrow';

interface LiquidityValues {
  depositViews: EscrowDepositView[] | null;
  refetchDepositViews: (() => void) | null;
  shouldFetchDepositViews: boolean;
}

const defaultValues: LiquidityValues = {
  depositViews: null,
  refetchDepositViews: null,
  shouldFetchDepositViews: false
};

const LiquidityContext = createContext<LiquidityValues>(defaultValues);

export default LiquidityContext;
