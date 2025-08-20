import React, { useEffect } from "react";
// All previous UI-related imports (styled-components, react-feather, Button, Overlay, etc.) are removed.

const TALLY_FORM_ID = '3ykrag'; // Using the same form ID as TallySupportButton.tsx

interface ContactSupportModalProps {
  onCloseClick: () => void;
  intentHash: string;
  errorMessage: string;
  paymentProof: string;
}

// The global Tally declaration is assumed to be handled by TallySupportButton.tsx 
// or a global .d.ts file if you have one.
// If not, you might need to uncomment this or ensure TallySupportButton.tsx is processed first:
/*
declare global {
  interface Window {
    Tally?: {
      openPopup: (formId: string, options?: any) => void;
    };
  }
}
*/

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({
  onCloseClick,
  intentHash,
  errorMessage,
  paymentProof
}) => {
  useEffect(() => {
    if (window.Tally && typeof window.Tally.openPopup === 'function') {
      window.Tally.openPopup(TALLY_FORM_ID, {
        // layout: 'modal', // Optional: Tally can open as a modal or side popup
        // width: 700,      // Optional: specify width if using modal layout
        emoji: { text: '👋', animation: 'wave' }, // Consistent with TallySupportButton
        hiddenFields: {
          page: 'ContactSupportModalOnError', // To identify context
          intentHash: intentHash,
          errorMessage: errorMessage,
          paymentProof: paymentProof,
        },
        onOpen: () => {
          console.log('Tally form opened via ContactSupportModal');
        },
        onClose: () => {
          console.log('Tally form closed via ContactSupportModal');
          onCloseClick(); // Critical: Notify parent component to close this modal's state
        },
        onSubmit: (payload: any) => {
          console.log('Tally form submitted via ContactSupportModal:', payload);
          // Optionally, call onCloseClick() here too if submission should also close the modal state
        }
      });
    } else {
      console.error('Tally is not available on window. Ensure embed.js is loaded and TallySupportButton.tsx (or similar) has declared global Window.Tally.');
      // Fallback: If Tally can't be opened, close the modal state immediately
      // to prevent the user from being stuck with a non-functional invisible modal.
      onCloseClick();
    }

    // Since this modal doesn't have its own UI to close, its lifecycle is tied to the Tally popup.
    // The useEffect runs when props change, potentially re-opening Tally if details update.
  }, [intentHash, errorMessage, paymentProof, onCloseClick]);

  // This component no longer renders its own UI.
  // It acts as a controller to launch the Tally popup when active.
  return null;
};

// All styled-components (ModalAndOverlayContainer, ModalContainer, etc.) are removed
// as they are no longer used.
