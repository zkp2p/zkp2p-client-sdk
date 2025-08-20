import React from "react";
import styled from "styled-components";
import { X } from "react-feather";
import { colors } from "@theme/colors";
import { ThemedText } from "@theme/text";
import { CustomCheckbox } from "@components/common/Checkbox";

interface MoreFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewMode: "orderbook" | "table";
  onViewModeChange: (mode: "orderbook" | "table") => void;
  showLowLiquidity: boolean;
  onShowLowLiquidityChange: (show: boolean) => void;
}

export const MoreFiltersModal: React.FC<MoreFiltersModalProps> = ({
  isOpen,
  onClose,
  viewMode,
  onViewModeChange,
  showLowLiquidity,
  onShowLowLiquidityChange,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <Overlay onClick={onClose} />
      <ModalContainer>
        <ModalHeader>
          <ThemedText.SubHeaderLarge>More Filters</ThemedText.SubHeaderLarge>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalContent>
          <FilterSection>
            <SectionLabel>View Type</SectionLabel>
            <ViewTypeContainer>
              <ViewTypeButton $isActive={viewMode === "orderbook"} onClick={() => onViewModeChange("orderbook")}>
                Order Book
              </ViewTypeButton>
              <ViewTypeButton $isActive={viewMode === "table"} onClick={() => onViewModeChange("table")}>
                Table View
              </ViewTypeButton>
            </ViewTypeContainer>
          </FilterSection>

          <FilterSection>
            <SectionLabel>Liquidity Options</SectionLabel>
            <LiquidityOptionContainer onClick={() => onShowLowLiquidityChange(!showLowLiquidity)}>
              <LiquidityOptionInfo>
                <LiquidityOptionTitle>Low Liquidity Deposits</LiquidityOptionTitle>
                <LiquidityOptionDescription>
                  Deposits with less than $5 USD available liquidity
                </LiquidityOptionDescription>
              </LiquidityOptionInfo>
              <CustomCheckbox
                checked={showLowLiquidity}
                onChange={(e) => {
                  e.stopPropagation();
                  onShowLowLiquidityChange(!showLowLiquidity);
                }}
              />
            </LiquidityOptionContainer>
          </FilterSection>
        </ModalContent>
      </ModalContainer>
    </>
  );
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 16px;
  width: 90%;
  max-width: 420px;
  z-index: 1001;
  animation: slideUp 0.2s ease-out;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translate(-50%, -45%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid ${colors.defaultBorderColor};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${colors.grayText};
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: ${colors.white};
  }
`;

const ModalContent = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const FilterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SectionLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${colors.grayText};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ViewTypeContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px;
  padding: 0.25rem;
`;

const ViewTypeButton = styled.button<{ $isActive: boolean }>`
  flex: 1;
  padding: 0.5rem 1rem;
  background: ${(props) => (props.$isActive ? colors.buttonDefault : "transparent")};
  color: ${(props) => (props.$isActive ? colors.white : colors.grayText)};
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => (props.$isActive ? colors.buttonDefault : "rgba(255, 255, 255, 0.05)")};
    color: ${colors.white};
  }
`;

const LiquidityOptionContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const LiquidityOptionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

const LiquidityOptionTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${colors.white};
  line-height: 1.2;
`;

const LiquidityOptionDescription = styled.div`
  font-size: 12px;
  color: ${colors.grayText};
  line-height: 1.3;
`;
