import React from 'react';
import styled from 'styled-components';
import { AlertTriangle, Copy, ExternalLink, X } from 'react-feather';
import { colors } from '@theme/colors';
import { Z_INDEX } from '@theme/zIndex';
import { Overlay } from '@components/modals/Overlay';
import { TokenData } from '@helpers/types/tokens';

interface UnverifiedTokenModalProps {
  token: TokenData;
  onCancel: () => void;
  onConfirm: () => void;
}

export const UnverifiedTokenModal: React.FC<UnverifiedTokenModalProps> = ({
  token,
  onCancel,
  onConfirm
}) => {
  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(token.address);
  };

  return (
    <ModalAndOverlayContainer>
      <Overlay onClick={onCancel} />
      
      <ModalContainer>
        <CloseButtonTop onClick={onCancel}>
          <X size={18} />
        </CloseButtonTop>

        <ModalContent>
          <HeaderSection>
            <HeaderText>Unverified Token</HeaderText>

            <TokenWarningContainer>
              <TokenLogoWrapper>
                <TokenLogo src={token.icon} alt={token.name} />
              </TokenLogoWrapper>
              <WarningIconOverlay>
                <AlertTriangle size={24} color="#F5A623" />
              </WarningIconOverlay>
            </TokenWarningContainer>
          </HeaderSection>
          
          <WarningText>
            This token isn't traded on leading centralized exchanges or frequently swapped on major DEXes. Always conduct your own research before trading.
          </WarningText>
          
          <AddressContainer>
            <HashText>{token.address}</HashText>
            <CopyButton onClick={copyAddressToClipboard}>
              <Copy size={14} />
            </CopyButton>
            <ExternalLinkButton href={`${token.blockExplorerUrl}/token/${token.address}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} />
            </ExternalLinkButton>
          </AddressContainer>
          
          <ButtonContainer>
            <CancelButton onClick={onCancel}>Cancel</CancelButton>
            <ConfirmButton onClick={onConfirm}>I Understand</ConfirmButton>
          </ButtonContainer>
        </ModalContent>
      </ModalContainer>
    </ModalAndOverlayContainer>
  );
};

const ModalAndOverlayContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  z-index: ${Z_INDEX.overlay + 10};
`;

const ModalContainer = styled.div`
  width: 90%;
  max-width: 460px;
  background: ${colors.container};
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: ${Z_INDEX.overlay + 10};
  position: relative;
`;

const CloseButtonTop = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.2s;
  z-index: 1;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
`;

const TokenWarningContainer = styled.div`
  position: relative;
  margin-bottom: 16px;
`;

const TokenLogoWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TokenLogo = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const WarningIconOverlay = styled.div`
  position: absolute;
  bottom: -6px;
  right: -6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${colors.container};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${colors.container};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(245, 166, 35, 0.15);
    border-radius: 50%;
  }
`;

const ModalContent = styled.div`
  padding: 24px;
`;

const HeaderText = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin: 0;
  text-align: center;
`;

const WarningText = styled.p`
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 20px;
  text-align: center;
`;

const AddressContainer = styled.div`
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const HashText = styled.div`
  font-family: monospace;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 4px;
  margin-left: 6px;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ExternalLinkButton = styled.a`
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 4px;
  margin-left: 6px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  
  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
`;

const Button = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
`;

const CancelButton = styled(Button)`
  background: rgba(255, 255, 255, 0.1);
  color: white;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const ConfirmButton = styled(Button)`
  background: ${colors.buttonDefault};
  color: ${colors.white};
  
  &:hover {
    background: ${colors.buttonHover};
  }
`; 