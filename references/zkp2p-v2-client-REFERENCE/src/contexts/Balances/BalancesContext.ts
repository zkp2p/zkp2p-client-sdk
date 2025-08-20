import { createContext } from 'react'

interface BalancesValues {
  shouldFetchEthBalance: boolean | null
  usdcBalance: bigint | null
  refetchUsdcBalance: (() => void) | null
  shouldFetchUsdcBalance: boolean | null
  usdcApprovalToEscrow: bigint | null
  refetchUsdcApprovalToEscrow: (() => void) | null

  ethBalance: bigint | null
  refetchEthBalance: (() => void) | null

  // New fields for dynamic token balance management
  tokenBalances: Record<string, bigint | null>
  isTokenBalanceLoading: Record<string, boolean>
  refetchTokenBalance: (tokenId: string) => void
}

const defaultValues: BalancesValues = {
  ethBalance: null,
  refetchEthBalance: null,
  shouldFetchEthBalance: null,
  usdcBalance: null,
  refetchUsdcBalance: null,
  shouldFetchUsdcBalance: null,
  usdcApprovalToEscrow: null,
  refetchUsdcApprovalToEscrow: null,


  // Default values for new fields
  tokenBalances: {},
  isTokenBalanceLoading: {},
  refetchTokenBalance: () => { }
};

const BalancesContext = createContext<BalancesValues>(defaultValues)

export default BalancesContext
