import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { colors } from '@theme/colors';

import { ThemedText } from '@theme/text';
import { SwapQuote } from '@helpers/types/swapQuote';
import { IntentStats } from '@helpers/types/curator';

import useGetIntentStats from '@hooks/backend/useGetIntentStats';

interface QuoteSelectionDisplayProps {
  quotes: SwapQuote[];
  onSelect: (quote: SwapQuote, index: number) => void;
  selectedIndex: number | null;
  inputFiatCurrency: string;
  outputToken: string;
  isQuotesLoading?: boolean;
  failedQuoteIndices?: Set<number>;
}

const QuoteSelectionDisplay: React.FC<QuoteSelectionDisplayProps> = ({
  quotes,
  onSelect,
  selectedIndex,
  inputFiatCurrency,
  outputToken,
  isQuotesLoading,
  failedQuoteIndices = new Set()
}) => {

  /*
   * Hooks
   */
  const { 
    intentStats: fetchedStats,
    fetchIntentStats,
    isLoading: isLoadingOverallStats,
    error: errorOverallStats
  } = useGetIntentStats();
  
  /*
   * State
   */
  const [displayStats, setDisplayStats] = useState<IntentStats[] | null>(null);

  /*
   * Effects
   */
  useEffect(() => {
    if (quotes && quotes.length > 0) {
      const depositIds = quotes.map(q => q.depositId).filter(id => id !== undefined && id !== null);
      if (depositIds.length > 0) {
        fetchIntentStats({ depositIds });
      }
    } else {
      setDisplayStats(null);
    }
  }, [quotes, fetchIntentStats]);

  useEffect(() => {
    setDisplayStats(fetchedStats);
  }, [fetchedStats]);

  /*
   * Render
   */

  if (isQuotesLoading) {
    return (
      <Container>
        <LableContainer>
          <Label>
            Fetching Best Quotes...
          </Label>
        </LableContainer>
        <QuotesContainer>
          {[...Array(3)].map((_, index) => (
            <PulsingQuoteItem key={`pulsing-quote-${index}`}>
              <PulsingQuoteItemRow>
                <PulsingDetailsItemLabel/>
                <PulsingDetailsItemValue/>
              </PulsingQuoteItemRow>
              <PulsingQuoteItemRow>
                <PulsingDetailsItemLabel/>
                <PulsingDetailsItemValue/>
              </PulsingQuoteItemRow>
            </PulsingQuoteItem>
          ))}
        </QuotesContainer>
      </Container>
    );
  }
  
  if (!quotes || quotes.length === 0) {
    return (
      <Container>
        <LableContainer>
          <Label>
           Select a Quote
          </Label>
        </LableContainer>
        <ThemedText.BodySmall style={{ textAlign: 'center', padding: '20px 0' }}>
          No quotes available at the moment.
        </ThemedText.BodySmall>
      </Container>
    );
  }

  return (
    <Container>
      <LableContainer>
        <Label>
          Select a Quote (Best {quotes.length} available)
        </Label>
      </LableContainer>

      <QuotesContainer>
        {quotes.map((quote, index) => {
          const statsForThisQuote = displayStats?.find(s => s.id === quote.depositId);
          const isBestQuote = index === 0;
          let percentageDiffText = "";

          if (!isBestQuote && quotes.length > 0 && quotes[0].outputTokenAmount > 0n) {
            const bestQuoteOutput = quotes[0].outputTokenAmount;
            const currentQuoteOutput = quote.outputTokenAmount;
            
            if (bestQuoteOutput > 0n && currentQuoteOutput < bestQuoteOutput) {
              const diff = bestQuoteOutput - currentQuoteOutput;
              const percentageDiff = Number(diff * 10000n / bestQuoteOutput) / 100;
              percentageDiffText = `-${percentageDiff.toFixed(2)}%`;
            } else if (currentQuoteOutput > bestQuoteOutput) {
              const diff = currentQuoteOutput - bestQuoteOutput;
              const percentageDiff = Number(diff * 10000n / bestQuoteOutput) / 100;
              percentageDiffText = `+${percentageDiff.toFixed(2)}%`;
            } else {
               percentageDiffText = "";
            }
          }

          let showWarning = false;
          let warningText = "";

          if (statsForThisQuote && !isLoadingOverallStats) {
            // subtract active orders from total intents
            const totalIntents = statsForThisQuote.totalIntents - statsForThisQuote.signaledIntents || 0; 
            const fulfilledIntents = statsForThisQuote.fulfilledIntents || 0;
            const prunedIntents = statsForThisQuote.prunedIntents || 0;
            const finalizedForRatioBase = fulfilledIntents + prunedIntents;

            if (totalIntents > 3 && finalizedForRatioBase > 0) { 
              const fulfillmentRatio = (fulfilledIntents / finalizedForRatioBase) * 100;
              if (fulfillmentRatio < 50) {
                showWarning = true;
                warningText = `Low success rate: ${fulfilledIntents}/${finalizedForRatioBase} orders. Consider alternatives.`;
              }
            }
          }

          const isFailed = failedQuoteIndices.has(index);
          
          return (
            <QuoteItem
              key={`quote-item-${index}-${quote.depositId || 'no-id'}`}
              isSelected={selectedIndex === index}
              isFailed={isFailed}
              onClick={() => !isFailed && onSelect(quote, index)}
            >
              <QuoteTopRow>
                <QuoteOutputAmount isSelected={selectedIndex === index} isFailed={isFailed}>
                  {quote.outputTokenFormatted} {outputToken}
                </QuoteOutputAmount>
                {isFailed ? (
                  <FailedTag>FAILED</FailedTag>
                ) : isBestQuote ? (
                  <BestTag>BEST</BestTag>
                ) : (
                  percentageDiffText && <PercentageDiffTag>{percentageDiffText}</PercentageDiffTag>
                )}
              </QuoteTopRow>

              <QuoteBottomRow>
                <QuoteSecondaryInfo>
                  {`≈ $${Number(quote.outputTokenAmountInUsd || 0).toFixed(2)}`}
                </QuoteSecondaryInfo>
                <QuotePrimaryInfo>
                  {`${Number(quote.usdcToFiatRate).toString()} ${inputFiatCurrency} / USDC`}
                </QuotePrimaryInfo>
              </QuoteBottomRow>
              
              {/* {isLoadingOverallStats && !statsForThisQuote && !errorOverallStats &&
                <LoadingStatsText>Loading stats...</LoadingStatsText>
              } */}
              {showWarning && 
                <WarningText isSelected={selectedIndex === index}>{warningText}</WarningText>
              }
            </QuoteItem>
          );
        })}
      </QuotesContainer>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background-color: ${colors.container};
  box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.25);
  border-radius: 16px;
  border: 1px solid ${colors.defaultBorderColor};
  max-width: 480px;
  min-width: 380px;
  width: 90%;
  
  @media (max-width: 720px) {
    width: 98%;
    min-width: 200px;
    max-width: 98%;
    margin: 0 auto;
  }
`;

const LableContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.25rem;
`;

const Label = styled.label`
  display: flex;
  font-size: 14px;
  font-weight: 550;
  color: ${colors.white};
`;

const QuotesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${colors.lightGrayText};
    border-radius: 2px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: ${colors.grayText};
  }
  scrollbar-width: thin;
  scrollbar-color: ${colors.lightGrayText} transparent;
`;

const QuoteItem = styled.div<{isSelected: boolean; isFailed: boolean}>`
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: ${({isFailed}) => isFailed ? 'not-allowed' : 'pointer'};
  opacity: ${({isFailed}) => isFailed ? 0.5 : 1};
  background-color: ${({isSelected, isFailed}) => 
    isFailed ? 'rgba(45, 51, 78, 0.3)' : 
    isSelected ? colors.container : 'rgba(45, 51, 78, 0.6)'};
  border: 1px solid ${({isSelected, isFailed}) => 
    isFailed ? colors.warningRed : 
    isSelected ? colors.white : 'transparent'};
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, opacity 0.2s ease-in-out;

  &:hover {
    background-color: ${({isSelected, isFailed}) => 
      isFailed ? 'rgba(45, 51, 78, 0.3)' :
      isSelected ? colors.container : 'rgba(55, 61, 88, 0.6)'};
    border-color: ${({isSelected, isFailed}) => 
      isFailed ? colors.warningRed :
      isSelected ? colors.white : colors.defaultBorderColor};
  }
`;

const QuoteTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const QuoteOutputAmount = styled(ThemedText.HeadlineSmall)<{isSelected: boolean; isFailed?: boolean}>`
  color: ${({isSelected, isFailed}) => 
    isFailed ? colors.warningRed :
    isSelected ? colors.white : colors.lightGrayText};
  font-weight: 500;
  font-size: 1.05rem;
  text-decoration: ${({isFailed}) => isFailed ? 'line-through' : 'none'};
`;

const TagBase = styled.div`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 600;
  line-height: 1.2;
  text-transform: uppercase;
`;

const BestTag = styled(TagBase)`
  color: ${colors.validGreen};
  font-size: 12px;
  font-weight: 500;
`;

const PercentageDiffTag = styled(TagBase)`
  color: ${colors.warningRed};
  font-size: 12px;
  font-weight: 500;
`;

const FailedTag = styled(TagBase)`
  color: ${colors.warningRed};
  background-color: rgba(232, 67, 67, 0.1);
  font-size: 12px;
  font-weight: 600;
`;

const QuoteBottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const QuoteSecondaryInfo = styled(ThemedText.BodySmall)`
  color: ${colors.lightGrayText};
  font-size: 0.75rem;
`;

const QuotePrimaryInfo = styled(ThemedText.BodySmall)`
  color: ${colors.lightGrayText};
  font-size: 0.75rem;
  text-align: right;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const LoadingStatsText = styled(ThemedText.Caption)`
  color: ${colors.lightGrayText};
  font-size: 10px;
  font-style: italic;
  margin-top: 4px;
  text-align: left;
  padding-left: 2px;
`;

const WarningText = styled(ThemedText.Caption)<{isSelected: boolean}>`
  color: ${({isSelected}) => isSelected ? colors.warningYellow : colors.lightGrayText};
  font-size: 10px;
  font-weight: 500;
  margin-top: 4px;
  padding: 2px 0px;
  line-height: 1.3;
`;

const PulsingQuoteItem = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid ${colors.defaultBorderColor};
  background-color: rgba(45, 51, 78, 0.3);
  // width: 380px;
`;

const pulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

const PulsingQuoteItemRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: center;
`;

const PulsingPlaceholderBase = styled.div`
  border-radius: 4px;
  background-color: ${colors.defaultBorderColor};
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const PulsingDetailsItemLabel = styled(PulsingPlaceholderBase)`
  width: 60%;
  height: 18px;
`;

const PulsingDetailsItemValue = styled(PulsingPlaceholderBase)`
  width: 25%;
  height: 14px;
`;

export default React.memo(QuoteSelectionDisplay); 