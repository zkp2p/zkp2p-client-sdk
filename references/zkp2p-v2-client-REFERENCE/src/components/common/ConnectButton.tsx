import React, { useReducer, useRef } from "react";
import styled from 'styled-components';
import { ENSName } from 'react-ens-name';
import { usePrivy } from '@privy-io/react-auth';
import { base } from 'viem/chains';

import { EthereumAvatar } from "@components/Account/Avatar";
import { Button } from '@components/common/Button';
import { AccountDropdown } from "@components/Account/AccountDropdown";
import { UsdcBalanceDisplay } from '@components/common/UsdcBalanceDisplay';
import { useOnClickOutside } from '@hooks/useOnClickOutside';
import useMediaQuery from '@hooks/useMediaQuery';
import useAccount from '@hooks/contexts/useAccount';
import { formatAddress } from '@helpers/addressFormat';
import { ensProvider } from '@helpers/ensProvider';
import { selectedChains } from "../../index";
import baseSvg from '@assets/images/base.svg';
import sepoliaSvg from '@assets/images/sepolia.svg';
import ethSvg from '@assets/images/eth.svg';

interface CustomConnectButtonProps {
  fullWidth?: boolean;
  height?: number;
  width?: number;
}

const getChainLogo = (chainName: string): string | undefined => {
  switch (chainName) {
    case 'Base':
      return baseSvg;
    case 'Base Sepolia':
      return baseSvg;
    case 'Sepolia':
      return sepoliaSvg;
    case 'Hardhat':
    case 'Localhost':
      return ethSvg; // Use ETH logo for local development
    default:
      return undefined;
  }
};

export const CustomConnectButton: React.FC<CustomConnectButtonProps> = ({
  fullWidth = false,
  height = 48,
  width = 112
}) => {
  /*
   * Contexts
   */

  const currentDeviceSize = useMediaQuery();
  const isMobile = currentDeviceSize === 'mobile';

  const {
    accountDisplay,
    authenticatedLogin,
    isLoggedIn,
    loggedInEthereumAddress,
    authenticatedLogout
  } = useAccount();

  const { authenticated } = usePrivy();

  /*
   * State
   */

  const [isDropdownOppen, toggleDropdown] = useReducer((s) => !s, false)

  const accountDropdownRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(accountDropdownRef, isDropdownOppen ? toggleDropdown : undefined)

  /*
   * Handlers
   */

  const onAccountLoginClick = () => {
    if (authenticated) {
      if (authenticatedLogout) {
        authenticatedLogout();
      };
    } else {
      if (authenticatedLogin) {
        authenticatedLogin();
      };
    }
  };

  const onWrongNetworkLogout = () => {
    if (authenticatedLogout) {
      authenticatedLogout();
    }
  };

  // Get current chain - for now we'll use base as default
  const currentChain = selectedChains.find((chain: any) => chain.id === base.id) || base;

  // Check if we're on the wrong network
  // This is a simplified check - in production you'd check against the actual wallet chain
  const isWrongNetwork = false;

  return (
    <div>
      {(() => {
        if (!isLoggedIn) {
          return (
            <Button
              fullWidth={fullWidth}
              width={width}
              onClick={onAccountLoginClick}
              height={height}
            >
              {isMobile ? 'Log In' : 'Log In'}
            </Button>
          );
        }

        if (isWrongNetwork) {
          return (
            <Button
              fullWidth={fullWidth}
              onClick={onWrongNetworkLogout}
              height={height}
            >
              Wrong Network
            </Button>
          );
        }

        return (
          <div style={{ display: 'flex', height: `${height}px`, gap: '8px', alignItems: 'center' }}>
            <AccountContainer>
              {!isMobile && (
                <UsdcBalanceDisplay integrated />
              )}
              
              {!isMobile && (
                <VerticalDivider />
              )}
              
              {!isMobile && (
                <NetworkAndBridgeContainer>
                  <NetworkSelector>
                    {currentChain && (
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 999,
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getChainLogo(currentChain.name) ? (
                          <img
                            alt={currentChain.name}
                            src={getChainLogo(currentChain.name)}
                            style={{ width: 24, height: 24 }}
                          />
                        ) : (
                          <span style={{ fontSize: '12px' }}>🔗</span>
                        )}
                      </div>
                    )}
                  </NetworkSelector>
                </NetworkAndBridgeContainer>
              )}


              <LoggedInBalanceAndAccount onClick={toggleDropdown}>
                <LoggedInButton>
                  <EthereumAvatar address={loggedInEthereumAddress || ''} />
                  <AccountDisplay>
                    {isLoggedIn ? (
                      accountDisplay
                    ) : (
                      <ENSName
                        provider={ensProvider}
                        address={loggedInEthereumAddress || ''}
                        customDisplay={(address) => formatAddress(address)}
                      />
                    )}
                  </AccountDisplay>
                </LoggedInButton>
              </LoggedInBalanceAndAccount>
            </AccountContainer>

            {isDropdownOppen && (
              <AccountDropdown
                ref={accountDropdownRef}
                onOptionSelect={toggleDropdown}
               />
            )}
          </div>
        );
      })()}
    </div>
  );
};

const NetworkAndBridgeContainer = styled.div`
  display: flex;
  border-radius: 0;
  background: transparent;
  height: 100%;
`;

const NetworkSelector = styled.button`
  border: none;
  background: transparent;
  color: #ffffff;
  padding: 0 16px;
  border-radius: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  font-family: 'Graphik';
  font-weight: 700;
  color: #ffffff;
  font-size: 16px;
`;

const AccountContainer = styled.div`
  display: flex;
  border-radius: 24px;
  background: #1A1B1F;
  height: 100%;
`;

const LoggedInBalanceAndAccount = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const LoggedInButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #3A3B3F;
  border-radius: 24px;
  gap: 10px;
  
  letter-spacing: 0.75px;
  color: #ffffff;
  font-family: 'Graphik';
  font-weight: 600;
  font-size: 14px;
  height: 100%;
  padding: 0px 18px 0px 14px;
  cursor: pointer;

  &:hover:not([disabled]) {
    background: #4A4B4F;
  }

  &:active:not([disabled]) {
    background: #202124;
    box-shadow: inset 0px -8px 0px rgba(0, 0, 0, 0.16);
  }
`;

const AccountDisplay = styled.div`
  /* padding-top: 2px; - Removed for better alignment */
`;

const VerticalDivider = styled.div`
  width: 1px;
  height: 60%;
  background-color: #3A3B3F;
  align-self: center;
`;