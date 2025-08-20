import styled from 'styled-components';
import { ArrowRight } from 'react-feather';

import { colors } from '@theme/colors';
import useQuery from '@hooks/useQuery';

const StyledArrowRight = styled(ArrowRight)`
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  color: ${colors.darkText};
`

const StyledCard = styled.div<{ cursor: string, backgroundColor: string }>`
  display: flex;
  background-color: ${({ backgroundColor }) => backgroundColor};
  background-size: auto 100%;
  background-position: right;
  background-repeat: no-repeat;
  background-origin: border-box;

  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  text-decoration: none;
  color: ${({ theme }) => theme.neutral1};
  padding: 24px;
  height: auto;
  min-height: 228px;
  border-radius: 24px;
  border: 1px solid ${colors.defaultBorderColor};
  cursor: ${({ cursor }) => cursor};
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translateY(-4px);
  }

  &:hover ${StyledArrowRight} {
    opacity: 1;
  }
`

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 64px;
  height: 64px;
`

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
`

const CardTitle = styled.div`
  font-size: 24px;
  line-height: 24px;
  font-weight: 600;
  color: ${colors.darkText};
`

const CardDescription = styled.div`
  font-size: 18px;
  line-height: 28px;
  color: ${colors.darkText};
`

const CardCTA = styled.div`
  color: ${colors.white};
  font-weight: 535;
  font-size: 16px;
  line-height: 24px;
  margin-top: auto;
  transition: opacity 250ms ease 0s;
  &:hover {
    opacity: 0.6;
  }
`

const ConnectCard = ({
  title,
  description,
  icon,
  cta,
  navigateTo,
  backgroundColor = colors.container,
}: {
  title: string
  description: string
  icon?: React.ReactNode
  cta?: string
  navigateTo?: string
  backgroundColor?: string
}) => {
  const { navigateWithQuery } = useQuery()

  const handleClick = () => {
    if (navigateTo) {
      if (navigateTo.startsWith('http') || navigateTo.startsWith('mailto')) {
        window.open(navigateTo, '_blank')
      } else {
        navigateWithQuery(navigateTo)
      }
    }
  }

  return (
    <StyledCard
      cursor={navigateTo ? 'pointer' : 'default'}
      onClick={handleClick}
      backgroundColor={backgroundColor}
    >
      <CardContent>
        <IconWrapper>
          {icon}
        </IconWrapper>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {cta && (
          <CardCTA>
            {cta}
            <StyledArrowRight size={16} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
          </CardCTA>
        )}
      </CardContent>
    </StyledCard>
  )
}

export default ConnectCard;