import { createContext } from 'react';

import { Abi } from '@helpers/types';
import { PaymentPlatformType } from '@helpers/types';

interface SmartContractsValues {
  blockscanUrl?: string | null;
  usdcAddress: string | null;
  usdcAbi?: Abi | null;
  usdtAddress: string | null;
  usdtAbi?: Abi | null;

  // escrow
  escrowAddress: string | null;
  escrowAbi: Abi | null;

  // Verifier addresses
  platformToVerifierAddress: { [key in PaymentPlatformType]?: string | null };
  platformToVerifierAbi: { [key in PaymentPlatformType]?: Abi | null };
  addressToPlatform: { [key: string]: PaymentPlatformType };

  chainId: string | null;

  // Gating Service
  gatingServiceAddress: string | null;

  // Witness Signer Address
  witnessAddresses: string[] | null;
}

const defaultValues: SmartContractsValues = {
  blockscanUrl: null,
  chainId: null,
  usdcAddress: null,
  usdcAbi: null,
  usdtAddress: null,
  usdtAbi: null,

  // escrow
  escrowAddress: null,
  escrowAbi: null,

  // Verifier addresses
  platformToVerifierAddress: {},
  platformToVerifierAbi: {},
  addressToPlatform: {},

  // Gating Service
  gatingServiceAddress: null,

  // Witness Signer Address
  witnessAddresses: null,
};

const SmartContractsContext = createContext<SmartContractsValues>(defaultValues)

export default SmartContractsContext
