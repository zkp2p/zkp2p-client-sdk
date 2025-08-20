import React, { useState } from "react";
import styled from "styled-components";
import Link from "@mui/material/Link";
import { X } from "react-feather";
import { ZKP2P_CASHBACK_LINK, ZKP2P_V2_BLOG_LINK } from "@helpers/docUrls";

import { commonStrings } from "@helpers/strings";
// import useSessionStorage from '@hooks/useSessionStorage';

export const EnvironmentBanner: React.FC = () => {
  /*
   * State
   */

  // Turn this on for local storage
  const storedBannerSettings = localStorage.getItem("dismissedEnvironmentBanner");
  const [isEnvironmentBannerDismissed, setIsEnvironmentBannerDismissed] = useState<boolean>(
    storedBannerSettings === "true"
  );

  /*
   * Handlers
   */

  const handleOverlayClick = () => {
    setIsEnvironmentBannerDismissed(true);

    localStorage.setItem("dismissedEnvironmentBanner", "true");
  };

  /*
   * Helpers
   */

  const bannerCopyForEnv = (env: string) => {
    switch (env) {
      case "PRODUCTION":
        return commonStrings.get("PRODUCTION_ENV_BANNER");

      case "STAGING_TESTNET":
        return commonStrings.get("STAGING_TESTNET_ENV_BANNER");

      case "STAGING":
        return commonStrings.get("STAGING_ENV_BANNER");

      default:
        return commonStrings.get("LOCAL_ENV_BANNER");
    }
  };

  const env = import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT || "LOCAL";

  const isEnvProduction = env === "PRODUCTION";

  /*
   * Component
   */

  // Comment this to always show the banner
  if (isEnvironmentBannerDismissed) {
    return null;
  }

  // Temporarily hide production banner; Comment this to show banner on production
  // TODO: Re-enable when needed by removing this condition
  // if (isEnvProduction) {
  //   return null;
  // }

  return (
    <Container>
      <div style={{ flex: 0.1 }} />

      <StyledLabel style={{ flex: "1", margin: "auto" }}>
        {bannerCopyForEnv(env)}
        {/* {isEnvProduction && (
          <Link href={ZKP2P_V2_BLOG_LINK} color="inherit" target="_blank">
            Read More
          </Link>
        )} */}
      </StyledLabel>

      {/* Comment this to remove the close button */}
      <StyledButton onClick={handleOverlayClick}>
        <StyledX />
      </StyledButton>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  position: relative;
  align-items: center;
  text-align: center;
  padding: 10px 0px;
  background-color: #df2e2d;
`;

const StyledLabel = styled.span`
  flex-grow: 1;
  color: #ffffff;
  font-size: 14px;
  color: #ffffff;
  font-weight: 600;
`;

const StyledButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  flex: 0.1;
`;

const StyledX = styled(X)`
  color: #ffffff;
  width: 16px;
  height: 16px;
`;
