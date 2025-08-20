import baseSvg from '../../assets/images/base.svg';
import usdcTokenSvg from '../../assets/images/tokens/usdc.svg';
import { blockExplorerUrls } from '@helpers/deployed_addresses';
import { BASE_CHAIN_ID, BASE_USDC_ADDRESS } from '@helpers/constants';

export interface TokenData {
    tokenId: string; // This will be chainId:address
    name: string;
    decimals: number;
    ticker: string;
    icon: string;
    address: string;
    chainId: number;
    chainName: string;
    chainIcon: string;
    blockExplorerUrl: string;
    isBase: boolean;
    isNative: boolean; // gas token
    vmType: string;
    depositAllowed: boolean;
    verified: boolean; // Whether the token is verified on exchanges
}

export const usdcInfo: TokenData = {
    tokenId: `${BASE_CHAIN_ID}:${BASE_USDC_ADDRESS}`,
    name: "USD Coin",
    decimals: 6,
    ticker: "USDC",
    icon: usdcTokenSvg,
    chainId: BASE_CHAIN_ID,
    chainName: BASE_CHAIN_ID === 84532 ? "Base Sepolia" : "Base",
    chainIcon: baseSvg,
    address: BASE_USDC_ADDRESS,
    depositAllowed: true,
    blockExplorerUrl: blockExplorerUrls[BASE_CHAIN_ID === 84532 ? 'base_sepolia' : 'base'],
    isBase: true,
    vmType: "evm",
    isNative: false,
    verified: true,
}

export const isUsdcToken = (tokenId: string) => {
    return tokenId.toLowerCase() === usdcInfo.tokenId.toLowerCase();
};