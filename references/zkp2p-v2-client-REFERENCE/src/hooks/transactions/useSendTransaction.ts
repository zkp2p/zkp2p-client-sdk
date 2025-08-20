import { useCallback } from 'react';
import { type Address, type Hex } from 'viem';
import usePrivyTransaction from '@hooks/usePrivyTransaction';
import { TokenData } from '@helpers/types/tokens';


interface SendTransactionParams {
  to: Address;
  amount: string; // Amount in token units
  token: TokenData;
  chainId: number;
}

interface SendTransactionResult {
  hash: Hex;
  transactionHash: Hex;
  logs?: any[];
}

export default function useSendTransaction(
  onSuccess?: (data: SendTransactionResult) => void,
  onError?: (error: Error) => void
) {
  const { writeContractAsync, sendTransaction, isLoading, error } = usePrivyTransaction({
    onSuccess,
    onError,
    gasSponsorship: true, // Enable for embedded wallets
  });

  const executeSend = useCallback(async (params: SendTransactionParams) => {
    const { to, amount, token, chainId } = params;

    try {
      // Validate inputs
      if (!to || !amount || amount === '0') {
        throw new Error('Invalid send parameters');
      }

      // Convert amount string to BigInt
      const amountBigInt = BigInt(amount);

      // For ERC20 tokens (like USDC)
      if (token.address !== '0x0000000000000000000000000000000000000000') {
        console.log(`Sending ${amount} ${token.ticker} to ${to} on chain ${chainId}`);

        // Import ERC20 ABI
        const ERC20_ABI = [
          {
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            name: 'transfer',
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'nonpayable',
            type: 'function'
          }
        ] as const;

        const result = await writeContractAsync({
          address: token.address as Address,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [to, amountBigInt],
        });

        return result;
      } else {
        // For native token transfers
        console.log(`Sending ${amount} native token to ${to} on chain ${chainId}`);

        const result = await sendTransaction({
          to,
          value: amountBigInt,
        });

        return result;
      }
    } catch (err) {
      console.error('Send transaction failed:', err);
      throw err;
    }
  }, [writeContractAsync, sendTransaction]);

  return {
    executeSend,
    isLoading,
    error
  };
}