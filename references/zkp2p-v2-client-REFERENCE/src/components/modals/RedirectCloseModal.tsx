import React from "react";
import styled from 'styled-components';
import { ArrowLeft, AlertTriangle } from 'react-feather';

import { Overlay } from '@components/modals/Overlay';
import { ThemedText } from '@theme/text'
import { colors } from '@theme/colors';
import { Z_INDEX } from '@theme/zIndex';

interface RedirectCloseModalProps {
  onBackClick: () => void;
  onConfirmClick: () => void;
}

export const RedirectCloseModal: React.FC<RedirectCloseModalProps> = ({
  onBackClick,
  onConfirmClick
}) => {

  /*
   * Component
   */
  return (
    <ModalAndOverlayContainer onClick={(e) => e.stopPropagation()}>
      <Overlay 
        onClick={onBackClick}
      />

      <ModalContainer>
        <TitleCenteredRow>
          <div style={{ flex: 0.25 }}>
            <button
              onClick={onBackClick}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <StyledArrowLeft/>
            </button>
          </div>

          <ThemedText.HeadlineSmall style={{ flex: '1', margin: 'auto', textAlign: 'center' }}>
            {'Confirm Close Request'}
          </ThemedText.HeadlineSmall>

          <div style={{ flex: 0.25 }}/>
        </TitleCenteredRow>

        <StyledAlertTriangle />

        <InstructionsContainer>
          <InstructionsLabel>
            Are you sure you want to remove this payment request? This action cannot be undone.
          </InstructionsLabel>
        </InstructionsContainer>

        <ButtonContainer>
          <CancelButton onClick={onBackClick}>
            Cancel
          </CancelButton>
          <ConfirmButton onClick={onConfirmClick}>
            Remove
          </ConfirmButton>
        </ButtonContainer>
      </ModalContainer>
    </ModalAndOverlayContainer>
  );
};

const ModalAndOverlayContainer = styled.div`
  display: flex;
  justify-content: center;
  position: fixed;
  align-items: flex-start;
  top: 0;
  left: 0;
  z-index: ${Z_INDEX.overlay};
  cursor: default;
`;

const ModalContainer = styled.div`
  max-width: 420px;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.25rem;
  background-color: ${colors.container};
  justify-content: space-between;
  align-items: center;
  z-index: 20;
  gap: 1.5rem;
  
  position: fixed;
  top: 51.5%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const TitleCenteredRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  color: #FFF;
`;

const StyledArrowLeft = styled(ArrowLeft)`
  color: #FFF;
`;

const StyledAlertTriangle = styled(AlertTriangle)`
  width: 56px;
  height: 56px;
  color: ${colors.buttonDefault};
  padding: 0.5rem 0;
`;

const InstructionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  padding: 0 1.75rem;
  color: #FFF;
`;

const InstructionsLabel = styled.div`
  font-size: 16px;
  text-align: center;
  line-height: 1.5;
`;

const ButtonContainer = styled.div`
  display: flex;
  width: 100%;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const BaseButton = styled.button`
  border-radius: 16px;
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  flex: 1;
  border: none;
`;

const CancelButton = styled(BaseButton)`
  background-color: ${colors.buttonDefault};
  color: ${colors.white};
  
  &:hover {
    background-color: ${colors.buttonHover};
  }
`;

const ConfirmButton = styled(BaseButton)`
  background-color: ${colors.iconButtonDefault};
  color: ${colors.white};
  
  &:hover {
    background-color: ${colors.iconButtonHover};
  }
`; 