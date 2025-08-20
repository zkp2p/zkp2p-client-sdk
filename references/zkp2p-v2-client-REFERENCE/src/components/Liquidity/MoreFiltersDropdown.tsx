import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { MoreHorizontal } from "react-feather";
import { colors } from "@theme/colors";
import { ThemedText } from "@theme/text";
import { CustomCheckbox } from "@components/common/Checkbox";

interface MoreFiltersDropdownProps {
  viewMode: "orderbook" | "table";
  onViewModeChange: (mode: "orderbook" | "table") => void;
  showLowLiquidity: boolean;
  onShowLowLiquidityChange: (show: boolean) => void;
}

export const MoreFiltersDropdown: React.FC<MoreFiltersDropdownProps> = ({
  viewMode,
  onViewModeChange,
  showLowLiquidity,
  onShowLowLiquidityChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <DropdownContainer ref={dropdownRef}>
      <MoreFiltersButton onClick={() => setIsOpen(!isOpen)} $isOpen={isOpen}>
        <MoreHorizontal size={18} style={{ strokeWidth: 2 }} />
        <ButtonText>Display</ButtonText>
      </MoreFiltersButton>

      {isOpen && (
        <DropdownContent>
          {/* View Type Section */}
          <Section>
            <SectionHeader>
              <ViewIcon />
              <SectionTitle>View</SectionTitle>
            </SectionHeader>
            
            <ViewOptions>
              <ViewOption 
                $isActive={viewMode === "orderbook"} 
                onClick={() => {
                  onViewModeChange("orderbook");
                  setIsOpen(false);
                }}
              >
                <BoardIcon />
                <OptionText>Order Book</OptionText>
              </ViewOption>
              
              <ViewOption 
                $isActive={viewMode === "table"} 
                onClick={() => {
                  onViewModeChange("table");
                  setIsOpen(false);
                }}
              >
                <ListIcon />
                <OptionText>Table</OptionText>
              </ViewOption>
            </ViewOptions>
          </Section>

          <Divider />

          {/* Filter Options Section */}
          <Section>
            <SectionHeader>
              <FilterIcon />
              <SectionTitle>Filters</SectionTitle>
            </SectionHeader>
            
            <CheckboxItem onClick={() => onShowLowLiquidityChange(!showLowLiquidity)}>
              <CustomCheckbox
                checked={showLowLiquidity}
                onChange={(e) => {
                  e.stopPropagation();
                  onShowLowLiquidityChange(!showLowLiquidity);
                }}
              />
              <ItemText>Show Low Liquidity Deposits</ItemText>
            </CheckboxItem>
          </Section>
        </DropdownContent>
      )}
    </DropdownContainer>
  );
};

const DropdownContainer = styled.div`
  position: relative;
`;

const MoreFiltersButton = styled.button<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 12px;
  background: #131A2A;
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: ${colors.lightGrayText};

  &:hover {
    background: rgba(255, 255, 255, 0.03);
    border-color: ${colors.lightGrayText};
    color: ${colors.white};
  }

  svg {
    transition: all 0.2s ease;
    opacity: 0.7;
  }
  
  &:hover svg {
    opacity: 1;
  }
`;

const ButtonText = styled.span`
  font-size: 14px;
  font-weight: 500;
  opacity: 0.9;
`;

const DropdownContent = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 260px;
  background: ${colors.container};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  padding: 8px;
  backdrop-filter: blur(10px);
  
  @media (max-width: 600px) {
    right: 50%;
    transform: translateX(50%);
    min-width: 280px;
  }
`;

const Section = styled.div`
  padding: 4px 0;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 12px 8px;
  color: ${colors.grayText};
`;

const SectionTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
`;

const ViewOptions = styled.div`
  display: flex;
  gap: 6px;
  padding: 0px 8px 12px 8px;
`;

const ViewOption = styled.button<{ $isActive: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.$isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent'};
  border: 1px solid ${props => props.$isActive ? colors.defaultBorderColor : 'transparent'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: ${props => props.$isActive ? colors.white : colors.grayText};

  &:hover {
    background: ${props => props.$isActive ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)'};
    border-color: ${props => props.$isActive ? colors.defaultBorderColor : 'rgba(255, 255, 255, 0.1)'};
    color: ${colors.white};
  }
`;

const OptionText = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

const DropdownItem = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  transition: background 0.2s ease;

  &:hover:not([disabled]) {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const CheckboxItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }
`;

const ItemText = styled.span`
  font-size: 14px;
  color: ${colors.lightGrayText};
  font-weight: 500;
`;

const Divider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 2px 8px;
`;

// Icon components
const ViewIcon = styled.div`
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  &::before {
    content: '';
    display: block;
    width: 14px;
    height: 10px;
    border: 1.5px solid currentColor;
    border-radius: 3px;
  }
`;

const ListIcon = styled.div`
  width: 14px;
  height: 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  
  &::before,
  &::after {
    content: '';
    display: block;
    height: 1.5px;
    background: currentColor;
    border-radius: 1px;
  }
  
  &::before {
    width: 100%;
  }
  
  &::after {
    width: 100%;
    opacity: 0.6;
  }
`;

const BoardIcon = styled.div`
  width: 14px;
  height: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  
  &::before,
  &::after {
    content: '';
    display: block;
    background: currentColor;
    border-radius: 2px;
  }
`;

const FilterIcon = styled.div`
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  &::before {
    content: '';
    display: block;
    width: 12px;
    height: 12px;
    border: 1.5px solid currentColor;
    border-radius: 50%;
    position: absolute;
  }
  
  &::after {
    content: '';
    display: block;
    width: 5px;
    height: 5px;
    background: currentColor;
    border-radius: 50%;
    position: absolute;
  }
`;