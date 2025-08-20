import { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import TextTransition, { presets } from 'react-text-transition';
import { DollarSign, Lock, BookOpen, HelpCircle, MessageCircle, Zap } from 'react-feather';
import { Helmet } from 'react-helmet-async';

import { Button } from '@components/common/Button';
import { SVGIconThemed } from '@components/SVGIcon/SVGIconThemed';
import ConnectCard from '@components/Landing/ConnectCard';
import SwapPreview from '@components/Landing/SwapPreview';
import ValueCard from '@components/Landing/ValueCard';
import { Z_INDEX } from '@theme/zIndex';
import useMediaQuery from '@hooks/useMediaQuery';
import useQuery from '@hooks/useQuery';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { ZKP2P_BLOG_PROFILE_LINK } from '@helpers/docUrls';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'SGD', 'HKD', 'THB', 'CAD', 'AUD'];

export const Landing: React.FC = () => {
  /*
   * Contexts
   */
  
  const currentDeviceSize = useMediaQuery();

  const cardsRef = useRef<HTMLDivElement>(null);
  const { navigateWithQuery } = useQuery();

  /*
   * State
   */

  const [index, setIndex] = useState(0);

  /*
   * Hooks
   */

  useEffect(() => {
    const intervalId = setInterval(
      () => setIndex((index) => index + 1),
      3000,
    );
    return () => clearTimeout(intervalId);
  }, []);

  /*
   * Handlers
   */

  const navigateToSwapHandler = () => {
    navigateWithQuery('/swap');
  };

  const jumpToMedia = (url: string) => {
    window.open(url, '_blank');
  };

  /*
   * Helpers
   */
  const getValueIconForIndex = (index: number, size: number = 64) => {
    switch (index) {
      case 0:
        return <StyledZap size={size} />;
      case 1:
        return <StyledDollarSign size={size} />;
      case 2:
      default:
        return <StyledLock size={size} />;
    }
  };

  const getConnectIconForIndex = (index: number, size: number = 24) => {
    switch (index) {
      case 0:
        return <BookOpen size={size} />;
        case 1:
          return <HelpCircle size={size} />;
        case 2:
        default:
          return <MessageCircle size={size} />;
    }
  };

  const VALUE_CARDS = [
    {
      title: "Fast",
      description: "Generate a proof in seconds, no waiting for seller to release funds",
    },
    {
      title: "Cheap",
      description: "No intermediaries, every transaction is directly with a seller",
    },
    {
      title: "Zero fraud",
      description: "Cryptographic proofs ensure all transactions are authentic",
    },
  ];

  const CONNECT_CARDS = [
    {
      title: 'Documentation',
      description: 'Learn how to use and integrate ZKP2P',
      cta: '',
      navigateTo: 'https://docs.zkp2p.xyz/',
    },
    {
      title: 'Community',
      description: 'Follow us on X for the latest updates',
      cta: '',
      navigateTo: 'https://x.com/ZKP2P',
    },
    {
      title: 'Contact us',
      description: 'Get help or just say hi!',
      cta: '',
      navigateTo: 'mailto:team@zkp2p.xyz',
    },
  ];

  return (
    <>
      <Helmet>
        <title>ZKP2P | Permissionless Crypto On-Ramp</title>
        <meta 
          name="description" 
          content="Buy crypto like USDC globally using Venmo, Wise, Revolut, Zelle, Cashapp. Fast, no fee, permissionless crypto on-ramp." 
        />
      </Helmet>
      <PageWrapper $isMobile={currentDeviceSize === 'tablet' || currentDeviceSize === 'mobile'}>
        <Container>
          <HeroContainer style={{ padding: currentDeviceSize === 'mobile' ? '0 1.6rem' : '0', width: currentDeviceSize === 'mobile' ? 'auto' : '50%' }}> 
          <SwapPreviewContainer onClick={() => navigateWithQuery('/swap')}>
            <SwapPreview />
          </SwapPreviewContainer>

          <HeroTextContainer>
            <ThemedText.Hero>
              <div style={{ display: 'flex', justifyContent: 'center', fontSize: currentDeviceSize === 'mobile' ? 44 : 60, fontWeight: 600 }}>
                <span>Onramp&nbsp;</span>
                <TextTransitionContainer>
                  <TextTransition 
                    springConfig={presets.stiff}
                    direction="down"
                    inline={true}
                    style={{
                      width: currentDeviceSize === 'mobile' ? '88px' : '128px',
                      height: currentDeviceSize === 'mobile' ? '48.5px' : '70.5px',
                      minWidth: currentDeviceSize === 'mobile' ? '88px' : '128px',
                      maxHeight: currentDeviceSize === 'mobile' ? '48.5px' : '70.5px',
                    }} 
                  >
                    {CURRENCIES[index % CURRENCIES.length]}
                  </TextTransition>
                </TextTransitionContainer>
              </div>
              
              <div style={{ width: '100%', textAlign: 'center', fontSize: currentDeviceSize === 'mobile' ? 44 : 60, fontWeight: 600 }}>in 60 seconds</div>
            </ThemedText.Hero>
          </HeroTextContainer>

          <SubHeaderContainer>
            <ThemedText.SubHeaderLarge style={{ textAlign: 'center', lineHeight: '1.3', fontSize: currentDeviceSize === 'mobile' ? 20 : 24 }}>
              Buy crypto directly from your peers using any payment network
            </ThemedText.SubHeaderLarge>
          </SubHeaderContainer>

          <ButtonContainer>
            <Button
              onClick={navigateToSwapHandler}
            >
              Get Started
            </Button>
          </ButtonContainer>

          <LearnMoreContainer
            onClick={() => {
              cardsRef?.current?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Learn more
            <Icon icon="arrow-down" />
          </LearnMoreContainer>
        </HeroContainer>

        <ValueContainer ref={cardsRef} paddingHorizontal={currentDeviceSize === 'mobile' ? 0 : 16}>
          <ValueContent>
            <ThemedText.HeadlineLarge style={{ fontSize: currentDeviceSize === 'mobile' ? 32 : 40 }}>
              What is ZKP2P?
            </ThemedText.HeadlineLarge>
            <ValueContentBottom>
              <ValueText>
                ZKP2P is the first trustless P2P on/offramping bulletin board. This enables a new buying and selling crypto experience that is fast, cheap and composable with DeFi.
              </ValueText>
              <ValueText>
                Currently, the only way to buy and sell crypto is through centralized exchanges or custodians, which are expensive, slow, and require unnecessarily intrusive identity verification.
              </ValueText>
              <ValueText>
                Using cryptographic proofs of transfer, ZKP2P allows buyers to authenticate that they have transferred the correct value to sellers. Buyers instantly receive their crypto in less than 60 seconds with settlement facilitated by fully noncustodial smart contracts.
              </ValueText>
            </ValueContentBottom>
          </ValueContent>
          <ValueCardGrid>
            {VALUE_CARDS.map((card, index) => (
              <ValueCard
                key={index}
                {...card}
                icon={getValueIconForIndex(index)}
              />
            ))}
          </ValueCardGrid>
        </ValueContainer>

        <ConnectContainer paddingHorizontal={currentDeviceSize === 'mobile' ? 0 : 16}>
          <ConnectContainerTop>
            <ThemedText.HeadlineLarge style={{ textAlign: 'center', fontSize: currentDeviceSize === 'mobile' ? 32 : 40 }}>
              Connect with us
            </ThemedText.HeadlineLarge>
          </ConnectContainerTop>
          <ConnectCardGrid>
            {CONNECT_CARDS.map((card, index) => (
              <ConnectCard
                {...card}
                key={index}
                icon={getConnectIconForIndex(index, 24)}
                backgroundColor={colors.defaultInputColor}
              />
            ))}
          </ConnectCardGrid>
        </ConnectContainer>
      </Container>
      <FooterWrapper>
        <FooterContainer>
          <FooterBottomSection>
            <FooterLinks>
              <FooterLinkGroup>
                <FooterLinkTitle>App</FooterLinkTitle>
                <FooterLink onClick={() => jumpToMedia('https://zkp2p.xyz/swap')}>App</FooterLink>
                <FooterLink onClick={() => jumpToMedia('https://domains.zkp2p.xyz')}>Domains</FooterLink>
                <FooterLink onClick={() => jumpToMedia('https://tickets.zkp2p.xyz')}>Tickets</FooterLink>
              </FooterLinkGroup>
              <FooterLinkGroup>
                <FooterLinkTitle>Resources</FooterLinkTitle>
                <FooterLink onClick={() => jumpToMedia('https://docs.zkp2p.xyz')}>Documentation</FooterLink>
                <FooterLink onClick={() => jumpToMedia(ZKP2P_BLOG_PROFILE_LINK)}>Blog</FooterLink>
                <FooterLink onClick={() => jumpToMedia('https://github.com/zkp2p')}>Github</FooterLink>
              </FooterLinkGroup>
              <FooterLinkGroup>
                <FooterLinkTitle>Contact</FooterLinkTitle>
                <FooterLink onClick={() => jumpToMedia('mailto:team@zkp2p.xyz')}>Email</FooterLink>
                <FooterLink onClick={() => jumpToMedia('https://t.me/+XDj9FNnW-xs5ODNl')}>Telegram</FooterLink>
              </FooterLinkGroup>
            </FooterLinks>
          </FooterBottomSection>
        </FooterContainer>
        <FooterBottomBar>
          <FooterLeft>
            <FooterCopyright>© 2025 - P2P Labs Inc.</FooterCopyright>
            <FooterPolicies>
            <StyledFooterLink as={Link} to="/tos">Terms of Service</StyledFooterLink>
              <StyledFooterLink as={Link} to="/pp">Privacy Policy</StyledFooterLink>
            </FooterPolicies>
          </FooterLeft>
          <StyledSocialIcons>
            <StyledSocialIcon
              icon={'twitter'}
              darkOpacity={0}
              onClick={() => jumpToMedia('https://twitter.com/zkp2p')}
            />

            <StyledSocialIcon
              icon={'github'}
              darkOpacity={0}
              onClick={() => jumpToMedia('https://github.com/zkp2p')}
            />

            <StyledSocialIcon
              icon={'telegram'}
              darkOpacity={0}
              onClick={() => jumpToMedia('https://t.me/+XDj9FNnW-xs5ODNl')}
            />
          </StyledSocialIcons>
        </FooterBottomBar>
      </FooterWrapper>
    </PageWrapper>
    </>
  )
};

const PageWrapper = styled.div<{ $isMobile: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 4rem;
  
  @media (min-width: 600px) {
    padding: 12px 8px;
    padding-bottom: 0rem;
  }
`;

const Container = styled.div`
  width: 100%;
  min-height: 535px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: flex-end;
  padding: 0 0 40px;
`;

const HeroContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  min-height: 535px;
  max-height: 1000px;

  @media (max-width: 600px) {
    padding: 0 1rem;
    margin-top: 80px;
  }
`;

const SwapPreviewContainer = styled.div`
  position: absolute;
  cursor: pointer;
  padding: 0 24px;
  margin-bottom: calc(360px + 32vw); 

  @media (min-width: 600px) {
    width: 450px;
    margin-bottom: 542px;
  }
`;

const ButtonContainer = styled.div`
  width: 150px;
  display: grid;
  padding-top: 1rem;
`;

const HeroTextContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding-top: 2rem;
  gap: 0.5rem;
  width: 100%;
  z-index: ${Z_INDEX.landing_hero};
`;

const TextTransitionContainer = styled.div`
  width: 88px;
  height: 48.5px;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (min-width: 600px) {
    width: 128px;
    height: 70.5px;
  }
`;

const LearnMoreContainer = styled.div`
  display: flex;
  align-items: center;
  color: rgb(94, 94, 94);
  cursor: pointer;
  font-size: 20px;
  font-weight: 535;
  margin: 18px 0px 36px;
  padding-left: 12px;
  pointer-events: auto;
  gap: 8px;

  &:hover {
    opacity: 0.6;
  }
`;

const Icon = styled(SVGIconThemed)`
  width: 20px;
  height: 20px;
  cursor: pointer;
  transition: opacity 0.2s ease-in-out;

  &:hover {
    opacity: 0.6;
  }
`;

const SubHeaderContainer = styled.div`
  display: grid;
  justify-content: center;
  flex-direction: column;
  padding-top: 1rem;
  gap: 1rem;

  @media (max-width: 768px) {
    font-size: 14px;
    line-height: 24px;
    padding-top: 1.5rem;
  }
`;

const ValueContainer = styled.div<{ paddingHorizontal: number }>`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  max-height: 1000px;
  padding: 1rem 1rem 1rem 1rem;
  gap: 3rem;
  max-width: 1200px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ValueContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: space-between;
`;

const ValueContentBottom = styled.div`
  display: flex;
  flex-direction: column;
  gap: .5rem;
`;

const ValueText = styled.p`
  color: ${colors.white};
  font-size: 1.2rem;
  line-height: 1.5;
  margin-bottom: .4rem;
`;

const ValueCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  flex: 1;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StyledZap = styled(Zap)`
  width: 20px;
  height: 20px;
  color: ${colors.white};
`;

const StyledDollarSign = styled(DollarSign)`
  width: 20px;
  height: 20px;
  color: ${colors.white};
`;

const StyledLock = styled(Lock)`
  width: 20px;
  height: 20px;
  color: ${colors.white};
`;


const ConnectContainer = styled.div<{ paddingHorizontal: number }>`
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: flex-start;
  margin-top: 2rem;
  padding: 4rem 0 0;
  width: 100%;
`;

const ConnectContainerTop = styled.div`
  @media (max-width: 600px) {
    padding: 0 1rem;
    margin-top: 10vh;
  }
`;

const ConnectCardGrid = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  gap: 2rem;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 0 1rem;
    box-sizing: border-box;
  }
`;

const FooterWrapper = styled.div`
  width: 90%;
  padding-top: 4rem;

  @media (max-width: 768px) {
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
`;

const FooterContainer = styled.div`
  margin: 0 auto;
  padding: 3rem 0rem;
`;

const FooterBottomSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 4rem;
`;

const StyledSocialIcons = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    align-self: flex-start;
  }
`;

const StyledSocialIcon = styled(SVGIconThemed)`
  width: 24px;
  height: 24px;
  cursor: pointer;
  transition: opacity 0.2s ease-in-out;

  &:hover {
    opacity: 0.6;
  }
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 5rem;
  flex-wrap: wrap;
  width: 100%;

  @media (max-width: 768px) {
    gap: 1.5rem;
  }
`;

const FooterLinkGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FooterLinkTitle = styled.div`
  font-size: 1.2rem;
  padding-bottom: .75rem;
`;

const FooterLink = styled.a`
  color: ${colors.grayText};
  text-decoration: none;
  font-size: 1rem;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const FooterBottomBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
  border-top: 1px solid ${colors.defaultBorderColor};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const FooterCopyright = styled.div`
  font-size: 1rem;
`;

const FooterPolicies = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 1rem;
`;

const StyledFooterLink = styled.a`
  color: inherit;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;