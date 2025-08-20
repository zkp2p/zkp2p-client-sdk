import React from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { colors } from '@theme/colors';
import { AutoColumn } from '@components/layouts/Column';
import useMediaQuery from '@hooks/useMediaQuery';

// New component for persistent iframes
const PersistentIframes = () => {
  // Wrap hooks in try-catch to prevent errors in production
  try {
    const location = useLocation();
    const isMobile = useMediaQuery() === 'mobile';
    const isVisible = location.pathname === '/liquidity' && !isMobile;

    return (
      <div style={{ display: isVisible ? 'block' : 'none' }}>
        <Wrapper>
          <IframeRow>
            <DuneAnalyticsFrame 
              src="https://dune.com/embeds/4799764/7956679?darkMode=true" 
              title="Liquidity Analytics"
            />
            <DuneAnalyticsFrame 
              src="https://dune.com/embeds/4765217/7907697?darkMode=true" 
              title="Volume Analytics"
            />
          </IframeRow>
        </Wrapper>
      </div>
    );
  } catch (error) {
    console.error('PersistentIframes error:', error);
    // Return null if hooks fail (likely due to being rendered outside Router context)
    return null;
  }
};

// Styled components remain the same
const Wrapper = styled(AutoColumn)`
  max-width: 1120px;
  width: 100%;
  margin: 0 auto;
  margin-top: 20px;
`;

const IframeRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  width: 100%;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const DuneAnalyticsFrame = styled.iframe`
  flex: 1;
  height: 300px;
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 12px;
  scrolling: no;
  overflow: hidden;
`;

export default PersistentIframes;