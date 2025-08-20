import React, { useEffect, useState } from "react";
import styled from 'styled-components';
import { ArrowLeft, Unlock } from 'react-feather';

import { TransactionButton } from "@components/common/TransactionButton";
import { Overlay } from '@components/modals/Overlay';
import { commonStrings } from '@helpers/strings';
import { ThemedText } from '@theme/text'
import { colors } from '@theme/colors';
import { Z_INDEX } from '@theme/zIndex';


import useDeposits from '@hooks/contexts/useDeposits';
import useSmartContracts from '@hooks/contexts/useSmartContracts';
import useBalances from '@hooks/contexts/useBalance';
import useReleaseFundsToPayerTransaction from '@hooks/transactions/useReleaseFundsToPayer';

interface ConfirmReleaseProps {
  intentHash: string;
  tokenToSend: string;
  amountTokenToSend: string;
  onBackClick: (wasSuccessful?: boolean) => void;
}

export const ConfirmRelease: React.FC<ConfirmReleaseProps> = ({
  intentHash,
  tokenToSend,
  amountTokenToSend,
  onBackClick
}) => {
  /*
   * Contexts
   */

  const {
    escrowAddress,
    escrowAbi,
    blockscanUrl 
  } = useSmartContracts();
  const { refetchUsdcBalance } = useBalances();

  const {
    refetchDepositViews
  } = useDeposits();

  /*
   * State
   */

  const [transactionAddress, setTransactionAddress] = useState<string>("");

  /*
   * Contract Writes
   */

  const onReleaseFundsSuccess = () => {
    refetchDepositViews?.();
    refetchUsdcBalance?.();
  }

  const {
    writeReleaseFundsAsync,
    setIntentHashInput,
    setShouldConfigureReleaseFundsWrite,
    signReleaseFundsTransactionStatus,
    mineReleaseFundsTransactionStatus,
    transactionHash
  } = useReleaseFundsToPayerTransaction(onReleaseFundsSuccess);

  useEffect(() => {
    setIntentHashInput(intentHash);
    setShouldConfigureReleaseFundsWrite(true);
  }, [intentHash]);

  /*
   * Handlers
   */

  const handleOverlayClick = () => {
    onBackClick();
  }

  /*
   * Hooks
   */

  useEffect(() => {
    if (transactionHash) {
      setTransactionAddress(transactionHash);
    }
  }, [transactionHash])

  /*
   * Helpers
   */

  const handleRelease = async () => {
    try {
      await writeReleaseFundsAsync?.();
    } catch (error) {
      console.log('writeReleaseFundsAsync failed: ', error);
    }
  }

  /*
   * Component
   */

  return (
    <ModalAndOverlayContainer>
      <Overlay />

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
            {'Release Funds'}
          </ThemedText.HeadlineSmall>

          <div style={{ flex: 0.25 }}/>
        </TitleCenteredRow>

        <StyledUnlock />

        <InstructionsContainer>
          <InstructionsLabel>
            { commonStrings.get('RELEASE_FUNDS_WARNING_ONE') }
            { `${amountTokenToSend} ${tokenToSend}` }
            { commonStrings.get('RELEASE_FUNDS_WARNING_TWO') }
          </InstructionsLabel>
        </InstructionsContainer>

        { transactionAddress?.length ? (
          <Link
            href={`${blockscanUrl}/tx/${transactionAddress}`}
            target="_blank"
            rel="noopener noreferrer">
              <ThemedText.LabelSmall textAlign="left" paddingBottom={"0.75rem"}>
                View on Explorer ↗
              </ThemedText.LabelSmall>
          </Link>
        ) : null}

        <TransactionButton
          signTransactionStatus={signReleaseFundsTransactionStatus}
          mineTransactionStatus={mineReleaseFundsTransactionStatus}
          defaultLabel={"Submit Transaction"}
          minedLabel={"Go Back"}
          defaultOnClick={handleRelease}
          minedOnClick={() => onBackClick(true)}
          fullWidth={true}
        />
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

const ModalContainer = styled.div`
  width: 80vw;
  max-width: 472px;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.25rem;
  background-color: ${colors.container};
  justify-content: space-between;
  align-items: center;
  z-index: 20;
  gap: 1.3rem;
  
  position: fixed;
  top: 50%;
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

const StyledUnlock = styled(Unlock)`
  width: 56px;
  height: 56px;
  color: #FFF;
  padding: 0.5rem 0;
`;

const InstructionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  padding: 0 1.25rem;
  color: #FFF;
`;

const InstructionsLabel = styled.div`
  font-size: 16px;
  text-align: center;
  line-height: 1.5;
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
