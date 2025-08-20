import React, { useState } from "react";
import styled from 'styled-components';
import { ArrowLeft, AlertTriangle } from 'react-feather';

import { TransactionButton } from "@components/common/TransactionButton";
import { Overlay } from '@components/modals/Overlay';
import { ThemedText } from '@theme/text'
import { colors } from '@theme/colors';
import { Z_INDEX } from '@theme/zIndex';
import { ZKP2P_TG_SUPPORT_CHAT_LINK } from "@helpers/docUrls";
import useBackend from '@hooks/contexts/useBackend';

const TALLY_FORM_ID = '3ykrag'; // Using the same form ID as ContactSupportModal

interface ConfirmCancelIntentProps {
  onBackClick: () => void;
  onCancelClick: () => void;
  signCancelIntentTransactionStatus: string;
  mineCancelIntentTransactionStatus: string;
  intentHash: string;
}

export const ConfirmCancelIntent: React.FC<ConfirmCancelIntentProps> = ({
  onBackClick,
  onCancelClick,
  signCancelIntentTransactionStatus,
  mineCancelIntentTransactionStatus,
  intentHash
}) => {
  /*
   * Contexts
   */
  const { depositorTgUsername } = useBackend();

  /*
   * State
   */
  const [hasConfirmedNoPayment, setHasConfirmedNoPayment] = useState(false);

  /*
   * Helpers
   */
  const getTelegramSupportLink = () => {
    if (depositorTgUsername) {
      const cleanedUsername = depositorTgUsername.startsWith('@') 
        ? depositorTgUsername.slice(1) 
        : depositorTgUsername;
      
      return `https://t.me/${cleanedUsername}`;
    }
  }

  const openSupportForm = () => {
    if (window.Tally && typeof window.Tally.openPopup === 'function') {
      window.Tally.openPopup(TALLY_FORM_ID, {
        emoji: { text: '👋', animation: 'wave' },
        hiddenFields: {
          page: 'ConfirmCancelIntent',
          intentHash: intentHash,
          errorMessage: `Info: Seller TG username: ${depositorTgUsername}`,
        },
        onSubmit: (payload: any) => {
          console.log('Tally form submitted from ConfirmCancelIntent:', payload);
        }
      });
    } else {
      console.error('Tally is not available. Please ensure embed.js is loaded.');
    }
  };

  /*
   * Handlers
   */
  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBackClick();
  }

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  /*
   * Component
   */
  return (
    <ModalAndOverlayContainer onClick={(e) => e.stopPropagation()}>
      <Overlay />

      <ModalContainer onClick={handleModalClick}>
        <TitleCenteredRow>
          <div style={{ flex: 0.25 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOverlayClick(e);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <StyledArrowLeft/>
            </button>
          </div>

          <ThemedText.HeadlineSmall style={{ flex: '1', margin: 'auto', textAlign: 'center' }}>
            {'Cancel Order'}
          </ThemedText.HeadlineSmall>

          <div style={{ flex: 0.25 }}/>
        </TitleCenteredRow>

        <StyledAlertTriangle />

        <WarningContainer>
          <WarningTitle>WARNING: Risk of Fund Loss</WarningTitle>
          <WarningText>
            <strong>Cancelling your order after making payment may result in permanent loss of your funds.</strong>
            {' '}Only cancel if you are absolutely certain no payment has been made. If you have already sent payment, contact the seller or support instead.
          </WarningText>
        </WarningContainer>

        <ContactOptionsContainer>
          {depositorTgUsername && (
            <Link
              href={getTelegramSupportLink()}
              target="_blank"
              rel="noopener noreferrer">
                <ThemedText.LabelSmall textAlign="center" paddingBottom={"0.5rem"}>
                  {`Contact seller (${depositorTgUsername}) ↗`}
                </ThemedText.LabelSmall>
            </Link>
          )}
          
          <SupportButton
            onClick={(e) => {
              e.stopPropagation();
              openSupportForm();
            }}
          >
            <ThemedText.LabelSmall textAlign="center" paddingBottom={"0.5rem"}>
              Contact Support
            </ThemedText.LabelSmall>
          </SupportButton>
        </ContactOptionsContainer>

        <CheckboxContainer>
          <Checkbox
            type="checkbox"
            checked={hasConfirmedNoPayment}
            onChange={(e) => {
              e.stopPropagation();
              setHasConfirmedNoPayment(e.target.checked);
            }}
          />
          <CheckboxLabel 
            isChecked={hasConfirmedNoPayment}
            onClick={(e) => {
              e.stopPropagation();
              setHasConfirmedNoPayment(!hasConfirmedNoPayment);
            }}
          >
            I confirm I have not made any payment
          </CheckboxLabel>
        </CheckboxContainer>

        <TransactionButton
          signTransactionStatus={signCancelIntentTransactionStatus}
          mineTransactionStatus={mineCancelIntentTransactionStatus}
          defaultLabel={"Cancel Order"}
          minedLabel={"Go Back"}
          defaultOnClick={onCancelClick}
          fullWidth={true}
          minedOnClick={onBackClick}
          disabled={!hasConfirmedNoPayment}
        />
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

const WarningContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background-color: rgba(255, 69, 58, 0.1);
  border: 1px solid rgba(255, 69, 58, 0.3);
  border-radius: 8px;
`;

const WarningTitle = styled.div`
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  color: #FF453A;
`;

const WarningText = styled.div`
  font-size: 16px;
  text-align: center;
  line-height: 1.5;
  color: #FFF;
  
  strong {
    color: #FF453A;
  }
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

const ContactOptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`;

const Link = styled.a`
  white-space: pre;
  display: inline-block;
  color: #1F95E2;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const SupportButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: #1F95E2;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0 1rem;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const CheckboxLabel = styled.label<{ isChecked?: boolean }>`
  color: ${props => props.isChecked ? '#FFF' : colors.grayText};
  font-size: 14px;
  cursor: pointer;
`;
