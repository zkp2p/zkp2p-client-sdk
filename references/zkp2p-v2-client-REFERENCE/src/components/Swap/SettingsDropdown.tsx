import { useRef, useReducer } from 'react';
import { Settings } from 'react-feather';
import styled from "styled-components";
import { colors } from '@theme/colors';

import { useOnClickOutside } from '@hooks/useOnClickOutside';
import { SimpleInput } from "@components/common/SimpleInput";


interface SettingsDropdownProps {
  quotesToFetch: number;
  setQuotesToFetch: (count: number) => void;
}

export const SettingsDropdown: React.FC<SettingsDropdownProps>= ({
  quotesToFetch,
  setQuotesToFetch,
}) => {
  /*
   * State
   */

  const [isOpen, toggleOpen] = useReducer((s) => !s, false);

  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, isOpen ? toggleOpen : undefined);


  /*
   * Handlers
   */
  const handleInputChange = (value: string) => {
    if (value === ""){
      setQuotesToFetch(0);
    } else if (value === "0") {
      setQuotesToFetch(0);
    } else if (value === ".") {
      setQuotesToFetch(0);
    } else if (parseInt(value) > 0 && parseInt(value) <= 10) {
      setQuotesToFetch(parseInt(value));
    }
  };
  /*
   * Component
   */

  return (
    <Wrapper ref={ref}>
      <SettingsButton onClick={toggleOpen}>
        <StyledSettings />
      </SettingsButton>

      {isOpen && (
        <Dropdown>
          <DropdownItems>
            <QuotesToFetchContainer>
              Number of quotes to fetch (max 10)
            </QuotesToFetchContainer>

            <QuotesToFetchInputContainer>
              <SimpleInput
                label="Quotes"
                name="quotesToFetch"
                type="number"
                value={quotesToFetch?.toString() || '4'}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Number of quotes (1-10)"
              />
            </QuotesToFetchInputContainer>
          </DropdownItems>
        </Dropdown>
      )}
    </Wrapper>
  )
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  align-items: flex-start;
`;

const StyledSettings = styled(Settings)`
  color: #FFF;
  width: 16px;
  height: 16px;
`;

const SettingsButton = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Dropdown = styled.div`
  display: flex;
  width: 70vw;
  max-width: 240px;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.25rem;
  background-color: ${colors.container};
  position: absolute;
  top: calc(100% + 14px);
  right: -10px;
  z-index: 20;
  color: #CED4DA;
`;

const DropdownItems = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const QuotesToFetchContainer = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
`;

const QuotesToFetchInputContainer = styled.div`
`;
