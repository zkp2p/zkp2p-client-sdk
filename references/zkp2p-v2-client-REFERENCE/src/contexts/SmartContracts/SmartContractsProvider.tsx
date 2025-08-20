import { useEffect, useState, ReactNode } from 'react'
import { erc20Abi } from 'viem';

import { abi as escrowAbi } from "@helpers/abi/escrow.abi";
import { abi as venmoReclaimVerifierAbi } from "@helpers/abi/venmoReclaimVerifier.abi";
import { abi as revolutReclaimVerifierAbi } from "@helpers/abi/revolutReclaimVerifier.abi";
import { abi as cashappReclaimVerifierAbi } from "@helpers/abi/cashappReclaimVerifier.abi";
import { abi as wiseReclaimVerifierAbi } from "@helpers/abi/wiseReclaimVerifier.abi";
import { abi as mercadopagoReclaimVerifierAbi } from "@helpers/abi/mercadoPagoReclaimVerifier.abi";
import { abi as zelleBaseVerifierAbi } from "@helpers/abi/zelleBaseVerifier.abi";
import { abi as paypalReclaimVerifierAbi } from "@helpers/abi/paypalReclaimVerifier.abi";
import { abi as monzoReclaimVerifierAbi } from "@helpers/abi/monzoReclaimVerifier.abi";
import { contractAddresses, blockExplorerUrls, chainIds } from "@helpers/deployed_addresses";
import { esl, DEFAULT_NETWORK } from '@helpers/constants';
import { Abi, PaymentPlatform, PaymentPlatformType } from '@helpers/types';
import useAccount from '@hooks/contexts/useAccount'

import SmartContractsContext from './SmartContractsContext';


interface ProvidersProps {
  children: ReactNode;
}

const SmartContractsProvider = ({ children }: ProvidersProps) => {
  /*
   * Context
   */

  const { network, isLoggedIn } = useAccount();

  /*
   * State
   */

  const [usdcAddress, setUsdcAddress] = useState<string | null>(null);
  const [usdtAddress, setUsdtAddress] = useState<string | null>(null);
  const [blockscanUrl, setBlockscanUrl] = useState<string>(blockExplorerUrls[DEFAULT_NETWORK]);
  const [chainId, setChainId] = useState<string | null>(chainIds[DEFAULT_NETWORK]);

  // Escrow
  const [escrowAddress, setEscrowAddress] = useState<string | null>(null);

  // Verifiers
  const [platformToVerifierAddress, setPlatformToVerifierAddress] = useState<{ [key in PaymentPlatformType]?: string }>({});
  const [platformToVerifierAbi, setPlatformToVerifierAbi] = useState<{ [key in PaymentPlatformType]?: Abi }>({});
  const [addressToPlatform, setAddressToPlatform] = useState<{ [key: string]: PaymentPlatformType }>({});

  // Gating Service
  const [gatingServiceAddress, setGatingServiceAddress] = useState<string | null>(null);

  // Witness Signer Addresses
  const [witnessAddresses, setWitnessAddresses] = useState<string[] | null>(null);

  /*
   * Hooks
   */

  useEffect(() => {

    const deploymentEnvironment = import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT || 'LOCAL';

    let networkToUse = null;
    
    // Always use deployment environment for STAGING_TESTNET
    if (deploymentEnvironment === 'STAGING_TESTNET') {
      networkToUse = 'base_sepolia';
    } else if (isLoggedIn) {
      // If logged in but network is still loading, don't clear addresses
      if (network === null) {
        return; // Keep current addresses during network transition
      }
      networkToUse = network;
    } else {
      // Not logged in - use deployment environment defaults
      switch (deploymentEnvironment) {
        case 'PRODUCTION':
        case 'STAGING':
          networkToUse = 'base';
          break;

        default:
          networkToUse = 'hardhat';
          break;
      }
    }

    if (networkToUse) {
      switch (deploymentEnvironment) {
        case 'PRODUCTION':
          setAddressWithNetworkEnvKey(networkToUse, 'base_production');
          break;
  
        default:
          switch (networkToUse) {
            case 'base':
              setAddressWithNetworkEnvKey(networkToUse, 'base_staging');
              break;
  
            case 'base_sepolia':
              setAddressWithNetworkEnvKey(networkToUse, 'base_sepolia');
              break;
  
            case 'hardhat':
            default:
              setAddressWithNetworkEnvKey(networkToUse, 'localhardhat');
              break;
          }
        }
    } else {
      // Only clear addresses if we're not in a transition state
      if (!isLoggedIn) {
        setEmptyAddresses();
      }
    }
  }, [network, isLoggedIn]);

  /*
   * Helpers
   */

  const setEmptyAddresses = () => {
    const defaultNetworkToUse = DEFAULT_NETWORK;
    setBlockscanUrl(blockExplorerUrls[defaultNetworkToUse]);
    setChainId(chainIds[defaultNetworkToUse]);

    setUsdcAddress(null);
    setUsdtAddress(null);
    // Escrow
    setEscrowAddress(null);

    // Gating Service
    setGatingServiceAddress(null);

    // Witness Signer Address
    setWitnessAddresses(null);

    // Verifiers
    setPlatformToVerifierAddress({});
    setPlatformToVerifierAbi({});
    setAddressToPlatform({}); 
  };

  const setAddressWithNetworkEnvKey = (network: string, networkEnvKey: string) => {
    const contractsForNetwork = contractAddresses[networkEnvKey];

    setBlockscanUrl(blockExplorerUrls[network]);
    setChainId(chainIds[network]);
    setUsdcAddress(contractsForNetwork.usdc);
    setUsdtAddress(contractsForNetwork.usdt);
    // Escrow
    setEscrowAddress(contractsForNetwork.escrow);

    // Gating Service
    setGatingServiceAddress(contractsForNetwork.gatingService);

    // Witness Signer Address
    setWitnessAddresses([
      contractsForNetwork.zkp2pWitnessSigner,
      contractsForNetwork.reclaimWitnessSigner,
    ]);

    // Verifiers
    setPlatformToVerifierAddress({
      [PaymentPlatform.VENMO]: contractsForNetwork.venmoReclaimVerifier,
      [PaymentPlatform.REVOLUT]: contractsForNetwork.revolutReclaimVerifier,
      [PaymentPlatform.CASHAPP]: contractsForNetwork.cashappReclaimVerifier,
      [PaymentPlatform.WISE]: contractsForNetwork.wiseReclaimVerifier,
      [PaymentPlatform.MERCADO_PAGO]: contractsForNetwork.mercadopagoReclaimVerifier,
      [PaymentPlatform.ZELLE]: contractsForNetwork.zelleBaseVerifier,
      [PaymentPlatform.PAYPAL]: contractsForNetwork.paypalReclaimVerifier,
      [PaymentPlatform.MONZO]: contractsForNetwork.monzoReclaimVerifier,
    });
    setPlatformToVerifierAbi({
      [PaymentPlatform.VENMO]: venmoReclaimVerifierAbi as Abi,
      [PaymentPlatform.REVOLUT]: revolutReclaimVerifierAbi as Abi,
      [PaymentPlatform.CASHAPP]: cashappReclaimVerifierAbi as Abi,
      [PaymentPlatform.WISE]: wiseReclaimVerifierAbi as Abi,
      [PaymentPlatform.MERCADO_PAGO]: mercadopagoReclaimVerifierAbi as Abi,
      [PaymentPlatform.ZELLE]: zelleBaseVerifierAbi as Abi,
      [PaymentPlatform.PAYPAL]: paypalReclaimVerifierAbi as Abi,
      [PaymentPlatform.MONZO]: monzoReclaimVerifierAbi as Abi,
    });
    setAddressToPlatform({
      [contractsForNetwork.venmoReclaimVerifier]: PaymentPlatform.VENMO,
      [contractsForNetwork.revolutReclaimVerifier]: PaymentPlatform.REVOLUT,
      [contractsForNetwork.cashappReclaimVerifier]: PaymentPlatform.CASHAPP,
      [contractsForNetwork.wiseReclaimVerifier]: PaymentPlatform.WISE,
      [contractsForNetwork.mercadopagoReclaimVerifier]: PaymentPlatform.MERCADO_PAGO,
      [contractsForNetwork.zelleBaseVerifier]: PaymentPlatform.ZELLE,
      [contractsForNetwork.paypalReclaimVerifier]: PaymentPlatform.PAYPAL,
      [contractsForNetwork.monzoReclaimVerifier]: PaymentPlatform.MONZO,
    }); 
  };

  return (
    <SmartContractsContext.Provider
      value={{
        usdcAddress,
        usdcAbi: erc20Abi as any,
        usdtAddress,
        usdtAbi: erc20Abi as any,
        blockscanUrl: blockscanUrl,
        chainId,
        // Escrow
        escrowAddress,
        escrowAbi: escrowAbi as Abi,  

        // Verifier for each platform
        platformToVerifierAddress,
        platformToVerifierAbi,
        addressToPlatform,

        // Gating Service
        gatingServiceAddress,

        // Witness Signer Address
        witnessAddresses,
      }}
    >
      {children}
    </SmartContractsContext.Provider>
  );
};

export default SmartContractsProvider;
