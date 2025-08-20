import React, { useState } from 'react';
import styled from 'styled-components';
import { ChevronDown } from 'react-feather';
import { colors } from '@theme/colors';
import { DetailsItem } from '@components/Swap/SendPayment/DetailsItem';
import { Proof } from '@helpers/types';
import { paymentPlatformInfo , PaymentPlatformType } from '@helpers/types/paymentPlatform';
import { ProofExtractedParameters } from '@helpers/types/paymentPlatform';
import { ParsedIntentData } from '@helpers/intentHelper';
import useBackend from '@hooks/contexts/useBackend';

interface ProofDetailsProps {
  isLoading: boolean;
  proof: Proof | null;
  proofErrored: boolean;
  paymentPlatform: PaymentPlatformType;
  paymentMethod: number;
  intentData: ParsedIntentData;
}

export const ProofDetails: React.FC<ProofDetailsProps> = ({
  isLoading,
  proof,
  paymentPlatform,
  paymentMethod,
  proofErrored = false,
  intentData
}) => {

  /*
   * Context
   */

  const { rawPayeeDetails } = useBackend();

  /*
   * State
   */

  const [isOpen, setIsOpen] = useState(false);

  /*
   * Helpers
   */

  const getFieldValue = (
    value: string | undefined
  ) => {
    if (proofErrored) {
      return "Failed";
    }

    if (isLoading) {
      return "Generate proof...";
    }

    return value;
  };

  const getExtractedParams = (): ProofExtractedParameters => {
    if (isLoading) {
      return {
        amount: 'Generate proof...',
        date: 'Generate proof...',
        currency: 'Generate proof...',
        paymentPlatform: 'Generate proof...',
        paymentId: 'Generate proof...',
        recipient: 'Generate proof...',
        intentHash: 'Generate proof...',
        providerHash: 'Generate proof...'
      }
    }

    if (!proof || !proof.claimInfo.context || proofErrored) {
      return {
        amount: 'Failed',
        date: 'Failed',
        currency: 'Failed',
        paymentPlatform: 'Failed',
        paymentId: 'Failed',
        recipient: 'Failed',
        intentHash: 'Failed',
        providerHash: 'Failed'
      }
    }

    const paymentPlatformData = paymentPlatformInfo[paymentPlatform];
    return paymentPlatformData.paymentMethods[paymentMethod].verifyConfig.parseExtractedParameters(proof.claimInfo.context);
  };

  const extractedParams = getExtractedParams();

  /*
   * Render
   */
  return (
    <Container>
      <TitleLabelAndDropdownIconContainer $isOpen={isOpen}>
        <TitleLabel>
          {`Proof Details`}
        </TitleLabel>
        
        <StyledChevronDown
          onClick={() => setIsOpen(!isOpen)}
          $isOpen={isOpen}
        />
      </TitleLabelAndDropdownIconContainer>

      <DetailsDropdown $isOpen={isOpen}>
        <ProofDetailsListContainer>
          <DetailsItem 
            label={"Platform"}
            value={paymentPlatformInfo[paymentPlatform].platformName + " (" + paymentPlatformInfo[paymentPlatform].paymentMethods[paymentMethod].sendConfig.paymentMethodName + ")"}
            loading={isLoading && !proofErrored}
          />
          
          <DetailsItem 
            label={"Recipient"}
            value={extractedParams.recipient}
            loading={isLoading && !proofErrored}
            copyable={!isLoading && !proofErrored}
          />

          <DetailsItem
            label={"Amount"}
            value={extractedParams.amount}
            loading={isLoading && !proofErrored}
            copyable={!isLoading && !proofErrored}
          />

          <DetailsItem
            label={"Currency"}
            value={extractedParams.currency}
            loading={isLoading && !proofErrored}
          />

          <DetailsItem
            label={"Payed At"}
            value={extractedParams.date}
            loading={isLoading && !proofErrored}
          />

          <DetailsItem
            label={"Intent Hash"}
            value={extractedParams.intentHash}
            loading={isLoading && !proofErrored}
            copyable={!isLoading && !proofErrored}
            maxLength={15}
          />

          <DetailsItem
            label={"Provider Hash"}
            value={extractedParams.providerHash}
            loading={isLoading && !proofErrored}
            copyable={!isLoading && !proofErrored}
            maxLength={15}
          />

          <DetailsItem
            label={"Proof Type"}
            value={getFieldValue(proof?.isAppclipProof ? "App Clip" : "Extension")}
            loading={isLoading && !proofErrored}
          />
        </ProofDetailsListContainer>
      </DetailsDropdown>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 16px;
  background: ${colors.container};
  overflow: hidden;
  width: 100%;

  border: 1px solid ${colors.defaultBorderColor};
`;

const TitleLabelAndDropdownIconContainer = styled.div<{ $isOpen: boolean }>`
  min-height: 48px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 20px;  
  width: 90%;
  border-bottom: ${({ $isOpen }) => $isOpen ? `1px solid ${colors.defaultBorderColor}` : 'none'};
  position: relative;
`;

const TitleLabel = styled.div`
  flex: 1;
  text-align: left;
  font-size: 16px;
  padding: 0 5px;

  @media (max-width: 600px) {
    font-size: 16px;
  }
`;

interface StyledChevronDownProps {
  $isOpen?: boolean;
};

const StyledChevronDown = styled(ChevronDown)<StyledChevronDownProps>`
  position: absolute;
  right: 15px;
  width: 20px;
  height: 20px;
  color: ${colors.darkText};
  cursor: pointer;
  transition: transform 0.4s;
  transform: ${({ $isOpen }) => $isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

interface DetailsDropdownProps {
  $isOpen?: boolean;
};

const DetailsDropdown = styled.div<DetailsDropdownProps>`
  width: 100%;
  display: flex;
  flex-direction: column;
  background: ${colors.container};
  color: ${colors.darkText};
  align-items: center;
  overflow: hidden;

  max-height: ${({ $isOpen }) => $isOpen ? '500px' : '0px'};
  transition: max-height 0.4s ease-out;
`;

const ProofDetailsListContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
`;
