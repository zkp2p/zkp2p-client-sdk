import React, { useCallback, useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import styled from 'styled-components';
import { ChevronDown } from 'react-feather';

import { colors } from '@theme/colors';
import { InstructionsRow } from '@components/Swap/CompleteOrder/Extension/InstructionsRow';


export const UpdateInstructions: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  /*
   * State
   */

  const [isOpen, setIsOpen] = useState(true);

  const [centerPosition, setCenterPosition] = useState(0);

  const [canAnimate, setCanAnimate] = useState(false);

  /*
   * Hooks
   */

  const updateCenterPosition = useCallback(() => {
    if (containerRef.current && titleRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const titleWidth = titleRef.current.offsetWidth;
      const newCenterPosition = (containerWidth - titleWidth) / 2;
      setCenterPosition(newCenterPosition);
    }
  }, []);

  useLayoutEffect(() => {
    updateCenterPosition();
  }, [updateCenterPosition]);

  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(updateCenterPosition);
    };

    window.addEventListener('resize', handleResize);
    
    const timer = setTimeout(() => setCanAnimate(true), 0);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [updateCenterPosition]);

  const toggleOpen = useCallback(() => setIsOpen(prev => !prev), []);

  const titleStyle = useMemo(() => ({
    transform: `translateX(${isOpen ? centerPosition : 0}px)`
  }), [isOpen, centerPosition]);

  /*
   * Component
   */

  return (
    <Wrapper ref={wrapperRef}>
        <TitleLabelAndDropdownIconContainer ref={containerRef} $isOpen={isOpen}>
          <TitleLabelWrapper>
            <TitleLabel  ref={titleRef}  $canAnimate={canAnimate} style={titleStyle}>
              Update PeerAuth Extension
            </TitleLabel>
          </TitleLabelWrapper>
          
          <StyledChevronDown
            onClick={toggleOpen}
            $isOpen={isOpen}
          />
        </TitleLabelAndDropdownIconContainer>

        <InstructionsDropdown $isOpen={isOpen}>
            <InstructionsRow step={1}>
              Open a new tab and enter <strong>chrome://extensions</strong> in the address bar
            </InstructionsRow>
            <InstructionsRow step={2}>
              Enable <strong>Developer mode</strong> in the top right corner.
            </InstructionsRow>
            <InstructionsRow step={3}>
              Click <strong>Update</strong> button in the top left corner.
            </InstructionsRow>
            <InstructionsRow step={4}>
              Return to this page and refresh
            </InstructionsRow>
        </InstructionsDropdown>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 14px 20px 12px 20px;
  border-radius: 8px;
  border: 1px solid ${colors.defaultBorderColor};
  background-color: ${colors.defaultInputColor};

  --center-position: 0px;
`;

const TitleLabelAndDropdownIconContainer = styled.div<{ $isOpen: boolean }>`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  transition: padding-bottom 0.4s ease-out;
  padding-bottom: ${({ $isOpen }) => $isOpen ? '1.25rem' : '0rem'};
  align-items: center;
`;

const TitleLabelWrapper = styled.div`
  flex-grow: 1;
  display: flex;
  justify-content: flex-start;
  overflow: hidden;
`;

const TitleLabel = styled.div<{ $canAnimate: boolean }>`
  display: flex;
  align-items: center;
  font-size: 15px;
  transition: ${({ $canAnimate }) => $canAnimate ? 'transform 0.4s ease-out' : 'none'};
`;

const StyledChevronDown = styled(ChevronDown)<{ $isOpen: boolean }>`
  width: 20px;
  height: 20px;
  color: #CED4DA;
  flex-shrink: 0;
  transition: transform 0.4s ease-out;
  transform: ${({ $isOpen }) => $isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const InstructionsDropdown = styled.div<{ $isOpen: boolean }>`
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${colors.defaultInputColor};
  color: #FFF;
  gap: 16px;
  overflow: hidden;
  max-height: ${({ $isOpen }) => $isOpen ? '500px' : '0rem'};
  transition: max-height 0.4s ease-out;
`;
