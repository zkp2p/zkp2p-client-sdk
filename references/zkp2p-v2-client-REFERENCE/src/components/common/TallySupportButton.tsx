// src/components/common/TallySupportButton.tsx
import { colors } from '@theme/colors';
import React, { useState } from 'react';
import styled from 'styled-components';

// All forms are the same for now, but we can change them later.
const TALLY_GENERIC_FORM_ID = '3ykrag';
const TALLY_SWAP_PAGE_FAQ_FORM_ID = '3ykrag';
const TALLY_SEND_PAGE_FAQ_FORM_ID = '3ykrag';
const TALLY_SEND_PAYMENT_SUPPORT_FORM_ID = '3ykrag';
const TALLY_DEPOSIT_PAGE_FAQ_FORM_ID = '3ykrag';
const TALLY_NEW_DEPOSIT_PAGE_FAQ_FORM_ID = '3ykrag';
const TALLY_DEPOSIT_DETAILS_PAGE_FAQ_FORM_ID = '3ykrag';
const TALLY_LIQUIDITY_PAGE_FAQ_FORM_ID = '3ykrag';
const TALLY_PROVE_PAYMENT_SUPPORT_FORM_ID = '3ykrag';

interface TallySupportButtonProps {
  page: 'swap' | 'send'| 'sendPayment' | 'deposit' | 'liquidity' | 'newDeposit' | 'provePayment' | 'depositDetails';
  currentIntentHash?: string;
  errorMessage?: string;
  paymentProof?: string;
}

// TypeScript declaration for the Tally object on the window
declare global {
  interface Window {
    Tally?: {
      openPopup: (formId: string, options?: any) => void;
    };
  }
}

const TallySupportButton: React.FC<TallySupportButtonProps> = ({ page, currentIntentHash, errorMessage, paymentProof }) => {
  const [isVisible, setIsVisible] = useState(true);


  const getTallyFormId = () => {
    switch (page) {
      case 'swap':
        return TALLY_SWAP_PAGE_FAQ_FORM_ID;
      case 'send':
        return TALLY_SEND_PAGE_FAQ_FORM_ID;
      case 'deposit':
        return TALLY_DEPOSIT_PAGE_FAQ_FORM_ID;
      case 'depositDetails':
        return TALLY_DEPOSIT_DETAILS_PAGE_FAQ_FORM_ID;
      case 'liquidity':
        return TALLY_LIQUIDITY_PAGE_FAQ_FORM_ID;
      case 'provePayment':
        return TALLY_PROVE_PAYMENT_SUPPORT_FORM_ID;
      case 'sendPayment':
        return TALLY_SEND_PAYMENT_SUPPORT_FORM_ID;
      case 'newDeposit':
        return TALLY_NEW_DEPOSIT_PAGE_FAQ_FORM_ID;
      default:
        return TALLY_GENERIC_FORM_ID;
    }
  }


  const openTallyPopup = () => {
    // Set to false before attempting to open, to hide the button immediately.
    setIsVisible(false);

    if (window.Tally && typeof window.Tally.openPopup === 'function') {
      // Try opening the popup
      window.Tally.openPopup(getTallyFormId(), {
        emoji: { text: '👋', animation: 'wave' },
        onOpen: () => {
          console.log('Tally form opened');
        },
        onClose: () => {
          console.log('Tally form closed');
          setIsVisible(true); // Show the button when Tally popup closes
        },
        onSubmit: (payload: any) => console.log('Tally form submitted:', payload),
        hiddenFields: {
          page,
          intentHash: currentIntentHash || '',
          errorMessage: errorMessage || '',
          paymentProof: paymentProof || '',
        },
      });
    } else {
      // If Tally is not available (fails to open), log error and make button visible again.
      console.error('Tally is not available on window. Ensure embed.js is loaded.');
      setIsVisible(true);
    }
  };

  if (!isVisible) {
    return null; // Don't render the button if it's not visible
  }

  return (
    <StyledButton onClick={openTallyPopup}>
      <span>Help</span>
      <span role="img" aria-label="wave emoji">👋</span>
    </StyledButton>
  );
};

const StyledButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 15px; // Adjusted padding
  background-color: #1a1a1a;
  color: white;
  border: none;
  border-radius: 25px; // More rounded
  cursor: pointer;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); // Adjusted shadow
  border: 1px solid ${colors.defaultBorderColor};
  z-index: 10000; // High z-index
  display: flex;
  align-items: center;
  gap: 8px; // Space between text and emoji

  &:hover {
    background-color: #333333; // Darker hover
    border-color: ${colors.white};
  }

  @media (max-width: 768px) {
    bottom: 70px;
    right: 10px;
  }
`;


export default TallySupportButton;