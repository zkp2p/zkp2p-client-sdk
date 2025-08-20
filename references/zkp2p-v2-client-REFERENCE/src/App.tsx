import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes
} from "react-router-dom";

import useMediaQuery from '@hooks/useMediaQuery';

import { TopNav } from "@components/layouts/TopNav";
import { BottomNav } from "@components/layouts/BottomNav";
import { EnvironmentBanner } from '@components/layouts/EnvironmentBanner';

import { Landing } from "./pages/Landing";
import { Swap } from "./pages/Swap";
import { Liquidity } from "./pages/Liquidity";
import { DepositPage } from "./pages/Deposit";
import { DepositDetail } from "./pages/DepositDetail";
import { Privacy } from "./pages/Privacy";
import { Tos } from "./pages/Tos";
import Modals from "./pages/Modals";

// Common Contexts
import AccountProvider from "@contexts/Account/AccountProvider";
import { SmartAccountProvider } from "@contexts/SmartAccount";
import BalancesProvider from "@contexts/Balances/BalancesProvider";
import SmartContractsProvider from '@contexts/SmartContracts/SmartContractsProvider';
import ExtensionProxyProofsProvider from '@contexts/ExtensionProxyProofs/ExtensionProxyProofsProvider';
import { ModalSettingsProvider } from '@contexts/ModalSettings';
import OnRamperIntentsProvider from '@contexts/OnRamperIntents/OnRamperIntentsProvider';
import DepositsProvider from '@contexts/Deposits/DepositsProvider';
import LiquidityProvider from '@contexts/Liquidity/LiquidityProvider';
import EscrowProvider from '@contexts/Escrow/EscrowProvider';
import BackendProvider from '@contexts/Backend/BackendContextProvider';
import GeolocationProvider from '@contexts/Geolocation/GeolocationProvider';
import TokenDataProvider from '@contexts/TokenData/TokenDataProvider';

import "./App.css";
import "./styles.css";

// Lazy load PersistentIframes
const PersistentIframes = lazy(() => import('@components/common/PersistentIFrames'));

const App = () => {
  const currentDeviceSize = useMediaQuery();

  useEffect(() => {
    const scriptId = 'tally-embed-script';
    if (document.getElementById(scriptId)) {
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = "https://tally.so/widgets/embed.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);
  
  return (
    <Router>
      <Providers>
        <div className="app-container">
          <EnvironmentBanner />
          <TopNav />
          <Modals />
          <Suspense fallback={<div />}>
            <PersistentIframes />
          </Suspense>
          <div className="app-content">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/swap" element={<Swap />} />
              <Route path="/liquidity" element={<Liquidity />} />
              <Route path="/pool" element={<DepositPage />} />
              <Route path="/deposit/:depositId" element={<DepositDetail />} />
              <Route path="/pp" element={<Privacy />} />
              <Route path="/tos" element={<Tos />} />
              <Route path="*" element={<div>Not found</div>} />
            </Routes>
          </div>

          {(currentDeviceSize === 'mobile') &&
            <BottomNav />
          }
        </div>
      </Providers>
    </Router>
  );
};

type ProvidersType = [React.ElementType, Record<string, unknown>];
type ChildrenType = {
  children: Array<React.ElementType>;
};

export const buildProvidersTree = (
  componentsWithProps: Array<ProvidersType>,
) => {
  const initialComponent = ({children}: {children: React.ReactNode}) => <>{children}</>;
  return componentsWithProps.reduce(
    (
      AccumulatedComponents: React.ElementType,
      [Provider, props = {}]: ProvidersType,
    ) => {
      return ({children}: ChildrenType) => {
        return (
          <AccumulatedComponents>
            <Provider {...props}>{children}</Provider>
          </AccumulatedComponents>
        );
      };
    },
    initialComponent,
  );
};

const providersWithProps: ProvidersType[] = [
  [TokenDataProvider, {}],
  [AccountProvider, {}],
  [SmartAccountProvider, {}], // Must come after AccountProvider but before SmartContractsProvider
  [SmartContractsProvider, {}],
  [BalancesProvider, {}],
  [EscrowProvider, {}],
  [DepositsProvider, {}],
  [LiquidityProvider, {}],
  [BackendProvider, {}],
  [ExtensionProxyProofsProvider, {}],
  [ModalSettingsProvider, {}],
  [OnRamperIntentsProvider, {}],
  [GeolocationProvider, {}],
];

const ProviderTree = buildProvidersTree(providersWithProps);

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return <ProviderTree>{children}</ProviderTree>;
}

export default App;