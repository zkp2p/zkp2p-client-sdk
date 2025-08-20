import React from "react";
import styled from 'styled-components';
import { ArrowLeft } from 'react-feather';

import { Button } from "@components/common/Button";
import { Overlay } from '@components/modals/Overlay';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { Z_INDEX } from '@theme/zIndex';
import { LabeledTextArea } from '@components/common/LabeledTextArea';
import { VERIFY_PAYMENT_ISSUES_DOCS_LINK } from '@helpers/docUrls';
interface ContactSellerModalProps {
  onCloseClick: () => void;
  orderDetails: {
    intentHash: string;
    amount: string;
    currency: string;
    paymentPlatform: string;
    recipientAddress: string;
    depositId: string;
  };
  depositorTgUsername: string;
}

export const ContactSellerModal: React.FC<ContactSellerModalProps> = ({
  onCloseClick,
  orderDetails,
  depositorTgUsername
}) => {
  
  const contactTemplate = `
Hi,

I'm having issues verifying my payment on ZKP2P. Here are my details:

Platform: ${orderDetails.paymentPlatform}
Payment Amount: ${orderDetails.amount} ${orderDetails.currency}
My address: ${orderDetails.recipientAddress}
Order/Intent ID: ${orderDetails.intentHash}

I've sent the payment but the verification is failing with an error. 

Could you confirm my payment was received and settle the transaction manually? Here is my order https://zkp2p.xyz/deposit/${orderDetails.depositId}

Thank you!
`.trim();

  /*
   * Handlers
   */
  const handleOverlayClick = () => onCloseClick();

  const getTelegramLink = () => {
    const cleanedUsername = depositorTgUsername.startsWith('@') 
      ? depositorTgUsername.slice(1) 
      : depositorTgUsername;
    
    return `https://t.me/${cleanedUsername}`;
  }

  const handleOpenTelegram = () => {
    window.open(getTelegramLink(), '_blank');
  };

  const handleOpenDocs = () => {
    window.open(VERIFY_PAYMENT_ISSUES_DOCS_LINK, '_blank');
  };

  /*
   * Render
   */
  return (
    <ModalAndOverlayContainer>
      <Overlay onClick={handleOverlayClick} />

      <ModalContainer>
        <TitleCenteredRow>
          <div style={{ flex: 0.25 }}>
            <button
              onClick={handleOverlayClick}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <StyledArrowLeft/>
            </button>
          </div>

          <ThemedText.HeadlineSmall style={{ flex: '1', margin: 'auto', textAlign: 'center' }}>
            {'Contact Seller'}
          </ThemedText.HeadlineSmall>

          <div style={{ flex: 0.25 }}/>
        </TitleCenteredRow>

        <InstructionsContainer>
          <ThemedText.SubHeader>Problem with verification?</ThemedText.SubHeader>
          
          <StepContainer>
            <StepNumber>1</StepNumber>
            <StepText>
              Verify your payment details (amount, currency, recipient) and try going back to select a different payment if needed.
            </StepText>
          </StepContainer>
           
          <StepContainer>
            <StepNumber>2</StepNumber>
            <StepText>
              Read the <GuideLink onClick={handleOpenDocs}>troubleshooting guide ↗</GuideLink> for common solutions and verification tips.
            </StepText>
          </StepContainer>
        </InstructionsContainer>

        <StepContainer>
          <StepNumber>3</StepNumber>
          <StepText>
            If the issue persists, contact the seller via Telegram using the message below.
          </StepText>
        </StepContainer>

        <MessageSection>
          <LabeledTextAreaContainer>
            <LabeledTextArea
              label=""
              value={contactTemplate}
              disabled={true}
              height={"200px"}
              showCopyButton={true}
            />
          </LabeledTextAreaContainer>
        </MessageSection>

        <ActionButtonsContainer>
          <Button
            onClick={handleOpenTelegram}
            fullWidth={true}
          >
            Contact {depositorTgUsername} on Telegram ↗
          </Button>
        </ActionButtonsContainer>
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
  align-items: center;
  top: 0;
  left: 0;
  z-index: ${Z_INDEX.overlay};

  @media (max-width: 600px) {
    width: 98%;
    padding-left: 0.5rem;
    box-sizing: border-box;
  }
`;

const ModalContainer = styled.div`
  max-width: 410px;
  min-width: 320px;
  width: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.25rem;
  background-color: ${colors.container};
  z-index: 20;
  gap: 1.5rem;
`;

const TitleCenteredRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #FFF;
`;

const StyledArrowLeft = styled(ArrowLeft)`
  color: #FFF;
`;

const InstructionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

const StepContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
`;

const StepNumber = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${colors.defaultBorderColor};
  font-weight: 600;
  flex-shrink: 0;
`;

const StepText = styled.div`
  color: #FFF;
  font-size: 14px;
  line-height: 1.5;
`;

const GuideLink = styled.span`
  color: #1F95E2;
  font-size: 14px;
  line-height: 1.5;
  cursor: pointer;
`;

const MessageSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
`;

const LabeledTextAreaContainer = styled.div`
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  padding-top: 0.5rem;
`;

const TelegramLinkContainer = styled.div`
  margin: auto;
  display: flex;
  flex-direction: row;
  justify-content: center;
  &:hover {
    cursor: pointer;
  }
`;

const TelegramLink = styled.a`
  white-space: pre;
  display: inline-block;
  color: #1F95E2;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`; 