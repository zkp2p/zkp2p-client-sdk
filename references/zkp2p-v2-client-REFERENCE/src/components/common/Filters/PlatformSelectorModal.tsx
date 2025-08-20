import React, { useState, useMemo } from 'react';
import { X, Search } from 'react-feather';
import styled from 'styled-components';
import Link from '@mui/material/Link';

import { PaymentPlatformType, paymentPlatformInfo, PaymentPlatform } from '@helpers/types';
import { Overlay } from '@components/modals/Overlay';
import { PlatformRow } from '@components/modals/selectors/platform/PlatformRow';
import PlatformIconHelper from '@components/modals/selectors/platform/PlatformIconHelper';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { Z_INDEX } from '@theme/zIndex';
import { ZKP2P_TG_LINK } from "@helpers/docUrls";
import useMediaQuery from '@hooks/useMediaQuery';

interface PlatformSelectorModalProps {
  selectedPlatform: PaymentPlatformType | null;
  onSelectPlatform: (platform: PaymentPlatformType | null) => void;
  allPlatforms?: PaymentPlatformType[];
  onClose: () => void;
}

export const PlatformSelectorModal: React.FC<PlatformSelectorModalProps> = ({
  selectedPlatform,
  onSelectPlatform,
  allPlatforms,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const currentDevice = useMediaQuery();
  const isMobile = currentDevice === 'mobile';

  const platforms = allPlatforms || Object.keys(paymentPlatformInfo) as PaymentPlatformType[];

  const filteredPlatforms = useMemo(() => {
    return platforms.filter(platform => 
      paymentPlatformInfo[platform].platformName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [platforms, searchTerm]);

  const handleSelectPlatform = (platform: PaymentPlatformType | null) => {
    onSelectPlatform(platform);
    onClose();
  };

  return (
    <ModalAndOverlayContainer>
      <Overlay onClick={onClose}/>
      
      <ModalContainer $isMobile={isMobile}>
        <TableHeader>
          <ThemedText.SubHeader style={{ textAlign: 'left' }}>
            Select Payment Method
          </ThemedText.SubHeader>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <StyledX/>
          </button>
        </TableHeader>

        <HorizontalDivider/>

        <SearchContainer onClick={(e) => e.stopPropagation()}>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Search platform"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </SearchContainer>

        <Table>
          {/* All Platforms option */}
          <AllPlatformsRow
            onClick={() => handleSelectPlatform(null)}
            selected={selectedPlatform === null}
          >
            <DetailsContainer>
              <PlatformIconHelper 
                keyType={'browser'} 
                name={'All Platforms'}
              />
              <PlatformLabel>All Platforms</PlatformLabel>
            </DetailsContainer>
          </AllPlatformsRow>
          
          {filteredPlatforms.map((platform, platformIndex) => {
            const platformInfo = paymentPlatformInfo[platform];
            
            // Create a custom row with logo for each platform
            return (
              <PlatformRowWithLogo
                key={platformIndex}
                onClick={() => handleSelectPlatform(platform)}
                selected={platform === selectedPlatform}
              >
                <DetailsContainer>
                  {(platform === PaymentPlatform.VENMO || platform === PaymentPlatform.PAYPAL) ? (
                    <PlatformLogoContainer>
                      <PlatformLogoFallback 
                        $backgroundColor={platformInfo.platformColor}
                      >
                        {platform === PaymentPlatform.VENMO ? 'V' : 'P'}
                      </PlatformLogoFallback>
                    </PlatformLogoContainer>
                  ) : platformInfo.platformLogo ? (
                    <PlatformLogoContainer>
                      <img 
                        src={platformInfo.platformLogo} 
                        alt={platformInfo.platformName}
                        width="32"
                        height="32"
                        style={{ borderRadius: '6px' }}
                      />
                    </PlatformLogoContainer>
                  ) : (
                    <PlatformIconHelper 
                      keyType={'browser'} 
                      name={platformInfo.platformName}
                    />
                  )}
                  <PlatformAndCurrencyLabel>
                    <PlatformLabel>{platformInfo.platformName}</PlatformLabel>
                    <CurrencyLabel>
                      {platformInfo.platformCurrencies.length > 4 
                        ? `${platformInfo.platformCurrencies.slice(0, 4).join(', ')}...`
                        : platformInfo.platformCurrencies.join(', ')
                      }
                    </CurrencyLabel>
                  </PlatformAndCurrencyLabel>
                </DetailsContainer>
              </PlatformRowWithLogo>
            );
          })}
        </Table>

        <FooterContainer>
          <FooterText>
            Don't see your app?{" "}
            <Link
              href={ZKP2P_TG_LINK}
              target="_blank"
              style={{
                color: colors.linkBlue,
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              Request support
            </Link>
          </FooterText>
        </FooterContainer>
      </ModalContainer>
    </ModalAndOverlayContainer>
  );
};

const ModalAndOverlayContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  position: fixed;
  align-items: flex-start;
  top: 0;
  left: 0;
  z-index: ${Z_INDEX.overlay};
`;

const ModalContainer = styled.div<{ $isMobile: boolean }>`
  position: fixed;
  top: ${props => props.$isMobile ? '20%' : '50%'};
  left: 50%;
  transform: ${props => props.$isMobile ? 'translateX(-50%)' : 'translate(-50%, -50%)'};
  width: ${props => props.$isMobile ? '100vw' : '80vw'};
  max-width: ${props => props.$isMobile ? '100vw' : '400px'};
  max-height: ${props => props.$isMobile ? '80vh' : '600px'};
  background: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: ${props => props.$isMobile ? '16px 16px 0 0' : '16px'};
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 20;
  
  ${props => props.$isMobile && `
    bottom: 0;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    
    @keyframes slideUp {
      0% { transform: translate(-50%, 100%); }
      100% { transform: translateX(-50%); }
    }
  `}
`;

const TableHeader = styled.div`
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledX = styled(X)`
  color: ${colors.lightGrayText};
  size: 24px;
  
  &:hover {
    color: ${colors.white};
  }
`;

const HorizontalDivider = styled.div`
  height: 1px;
  width: 100%;
  background-color: ${colors.defaultBorderColor};
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid ${colors.defaultBorderColor};
  background: ${colors.container};
`;

const SearchIcon = styled(Search)`
  color: ${colors.grayText};
  size: 20px;
  flex-shrink: 0;
`;

const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: ${colors.white};
  font-size: 16px;
  outline: none;
  
  &::placeholder {
    color: ${colors.grayText};
  }
`;

const Table = styled.div`
  overflow-y: auto;
  flex: 1;
`;

const FooterContainer = styled.div`
  padding: 20px;
  border-top: 1px solid ${colors.defaultBorderColor};
  text-align: center;
`;

const FooterText = styled.div`
  color: ${colors.grayText};
  font-size: 14px;
`;

// Use same style as PlatformRow from the original component
const AllPlatformsRow = styled.div<{ selected: boolean }>`
  display: flex;
  flex-direction: row;
  min-height: 50px;
  padding: 12px 24px 12px 20px;

  ${({ selected }) => selected && `
    background-color: ${colors.rowSelectorColor};
    box-shadow: none;
  `}

  ${({ selected }) => !selected && `
    &:hover {
      background-color: ${colors.rowSelectorHover};
      box-shadow: none;
    }
  `}
`;

const PlatformRowWithLogo = styled.div<{ selected: boolean }>`
  display: flex;
  flex-direction: row;
  min-height: 50px;
  padding: 12px 24px 12px 20px;

  ${({ selected }) => selected && `
    background-color: ${colors.rowSelectorColor};
    box-shadow: none;
  `}

  ${({ selected }) => !selected && `
    &:hover {
      background-color: ${colors.rowSelectorHover};
      box-shadow: none;
    }
  `}
`;

const DetailsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex: 1;
`;

const PlatformAndCurrencyLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-grow: 1;
  flex-wrap: wrap;
`;

const PlatformLabel = styled.div`
  display: flex;
  flex-direction: row;
  padding-top: 2px;
  color: #FFFFFF;
`;

const CurrencyLabel = styled.div`
  padding-top: 4px;
  color: ${colors.offWhite};

  @media (max-width: 600px) {
    white-space: normal;
    overflow: hidden;
    text-align: right;
    min-width: 0;
    flex: 1 1 auto;
    max-width: 100px;
  }
`;

const PlatformLogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PlatformLogoFallback = styled.div<{ $backgroundColor?: string }>`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background-color: ${({ $backgroundColor }) => $backgroundColor || colors.grayText};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
`;