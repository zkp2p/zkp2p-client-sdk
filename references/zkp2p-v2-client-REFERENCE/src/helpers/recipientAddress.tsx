import React from 'react';
import Link from '@mui/material/Link';
import { ENSName, AddressDisplayEnum } from 'react-ens-name';
import { ensProvider } from './ensProvider';
import { TokenData } from '@helpers/types/tokens';

interface RecipientAddressDisplayProps {
  recipientAddress: string;
  tokenData: TokenData;
  defaultBlockExplorerUrl?: string;
  displayType?: AddressDisplayEnum;
}

/**
 * A reusable component for displaying recipient address details
 * @returns An object with label and value properties
 */
export const getRecipientAddressDisplay = ({
  recipientAddress,
  tokenData,
  defaultBlockExplorerUrl = 'https://basescan.org',
  displayType = AddressDisplayEnum.FIRST6,
}: RecipientAddressDisplayProps) => {
  if (!recipientAddress) {
    return null;
  }

  // Get the block explorer URL and chain info based on the token
  let blockExplorerUrl = tokenData.blockExplorerUrl;
  let isEvm = tokenData.vmType === 'evm';
  let chainName = tokenData.chainName;
  
  // Determine label based on chain
  const label = `Recipient${chainName ? ` (${chainName})` : ' Address'}`;
  
  // For Non-EVM addresses, we don't show the ENS name
  if (!isEvm) {
    return {
      label,
      value: (
        <Link href={`${blockExplorerUrl}/address/${recipientAddress}`} target="_blank">
          {recipientAddress.slice(0, 8)}
        </Link>
      )
    };
  }
  
  // For EVM addresses, use ENSName component
  return {
    label,
    value: (
      <Link href={`${blockExplorerUrl}/address/${recipientAddress}`} target="_blank">
        <ENSName
          provider={ensProvider}
          address={recipientAddress}
          displayType={displayType}
        />
      </Link>
    )
  };
}; 