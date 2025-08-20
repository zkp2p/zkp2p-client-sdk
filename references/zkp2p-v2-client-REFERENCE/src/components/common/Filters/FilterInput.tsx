import React from "react";
import styled from "styled-components";
import { colors } from "@theme/colors";

interface FilterInputProps {
  children: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  width?: string;
  disabled?: boolean;
}

export const FilterInput: React.FC<FilterInputProps> = ({
  children,
  onClick,
  isActive = false,
  width = "auto",
  disabled = false,
}) => {
  return (
    <Container onClick={disabled ? undefined : onClick} $isActive={isActive} $width={width} $disabled={disabled}>
      {children}
    </Container>
  );
};

const Container = styled.div<{
  $isActive: boolean;
  $width: string;
  $disabled: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  background: #131A2A;
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px;
  cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s ease;
  width: ${(props) => props.$width};
  min-width: fit-content;
  opacity: ${(props) => (props.$disabled ? 0.6 : 1)};

  &:hover:not([disabled]) {
    border-color: ${colors.lightGrayText};
    background: rgba(255, 255, 255, 0.03);
  }

  &:focus-within {
    border-color: ${colors.buttonDefault};
    background: rgba(255, 255, 255, 0.03);
  }
`;

export const FilterLabel = styled.span`
  font-size: 14px;
  color: ${colors.lightGrayText};
  white-space: nowrap;
`;

export const FilterValue = styled.span`
  font-size: 14px;
  color: ${colors.white};
  font-weight: 500;
  white-space: nowrap;
  flex: 1;
`;

export const FilterIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;

  img,
  svg {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

export const FilterDropdownIcon = styled.div`
  display: flex;
  align-items: center;
  color: ${colors.lightGrayText};
  margin-left: auto;

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const FilterTextInput = styled.input`
  background: transparent;
  border: none;
  outline: none;
  color: ${colors.white};
  font-size: 14px;
  width: 100%;

  &::placeholder {
    color: ${colors.grayText};
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;
