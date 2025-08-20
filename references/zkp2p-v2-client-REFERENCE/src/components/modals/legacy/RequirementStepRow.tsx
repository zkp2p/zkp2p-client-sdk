import styled from "styled-components";

export const RequirementStepRow: React.FC<{
  step?: number;
  children: React.ReactNode;
}> = ({ step, children }) => {
  return (
    <Container>
      {step !== undefined && (
        <Label>
          <span>{step}.</span>
        </Label>
      )}
      <RequirementStepText>{children}</RequirementStepText>
    </Container>
  );
};

const Row = styled.div`
  display: flex;
  align-items: center;
`;

const Col = styled.div`
  display: flex;
  flex-direction: column;
`;

const RowSpaceBetween = styled(Row)`
  justify-content: space-between;
`;

const CenterAllDiv = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Header = styled.h2`
  font-weight: 600;
  color: #fff;
  font-size: 2.25rem;
  line-height: 2.5rem;
  letter-spacing: -0.02em;
  margin-top: 0;
`;

const SubHeader = styled(Header)`
  font-size: 1.7em;
  color: rgba(255, 255, 255, 0.9);
`;

const H3 = styled(SubHeader)`
  font-size: 1.4em;
  margin-bottom: -8px;
`;

const Container = styled(Row)`
  gap: 0.75rem;
  border-radius: 12px;
  color: #FFF;
  line-height: 1.35;
  padding: 0rem 0.5rem;
`;

const Label = styled(CenterAllDiv)`
  border-radius: 4px;
  width: 12px;
  height: 12px;
  font-size: 16px;
`;

const RequirementStepText = styled.span`
  font-size: 15px;
`;