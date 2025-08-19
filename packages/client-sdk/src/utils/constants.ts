import type { Address } from 'viem';

export const DEFAULT_BASE_API_URL = 'https://api.zkp2p.xyz/v1';
export const DEFAULT_WITNESS_URL = 'https://witness-proxy.zkp2p.xyz';

type Contracts = {
  [chainId: number]: {
    usdc: Address;
    escrow: Address;
    venmo: Address;
    revolut: Address;
    cashapp: Address;
    wise: Address;
    mercadopago: Address;
    zelle: Address;
    gatingService: Address;
    zkp2pWitnessSigner: Address;
  };
};

export const DEPLOYED_ADDRESSES: Contracts = {
  8453: {
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    escrow: '0xCA38607D85E8F6294Dc10728669605E6664C2D70',
    venmo: '0x9a733B55a875D0DB4915c6B36350b24F8AB99dF5',
    revolut: '0xAA5A1B62B01781E789C900d616300717CD9A41aB',
    cashapp: '0x76D33A33068D86016B806dF02376dDBb23Dd3703',
    wise: '0xFF0149799631D7A5bdE2e7eA9b306c42b3d9a9ca',
    mercadopago: '0xf2AC5be14F32Cbe6A613CFF8931d95460D6c33A3',
    zelle: '0x431a078A5029146aAB239c768A615CD484519aF7',
    gatingService: '0x396D31055Db28C0C6f36e8b36f18FE7227248a97',
    zkp2pWitnessSigner: '0x0636c417755E3ae25C6c166D181c0607F4C572A3',
  },
  84532: {
    usdc: '0x17463cb89A62c7b4A5ecD949aFDEDBD0Aa047ad1',
    escrow: '0x15EF83EBB422B4AC8e3b8393d016Ed076dc50CB7',
    venmo: '0x8499f2e7c4496Acfe0D7Ca5C7b6522514877b33F',
    revolut: '0x7E34909A1C1b2a4D2FAbA61c17a0F59ECAce6F29',
    cashapp: '0xe4148B108Fe4D7421853FE8cFfd35bDc2c0d95Ec',
    wise: '0x54c92a8828A393C5A6D1DfbB71d0e9e97329b39C',
    mercadopago: '0x4367155Fe7BAA99d9AE99fE4F6aC1b8E87012e6b',
    zelle: '0xbeeC239145b3c461422BC2fC45B78E5fd70862F1',
    gatingService: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    zkp2pWitnessSigner: '0x0636c417755E3ae25C6c166D181c0607F4C572A3',
  },
  31337: {
    usdc: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    escrow: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    venmo: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    revolut: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    cashapp: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
    wise: '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82',
    mercadopago: '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1',
    zelle: '0x3Aa5ebB10DC797CAC828524e59A333d0A371443c',
    gatingService: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    zkp2pWitnessSigner: '0x0636c417755E3ae25C6c166D181c0607F4C572A3',
  },
  534352: {
    usdc: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',
    escrow: '0x5Fb325174fAFb22C46f7796Ca129980aA16F3405',
    venmo: '0x120F2AC79c5921f8CFAe530Ceac5E635DC6972b5',
    revolut: '0x17463cb89A62c7b4A5ecD949aFDEDBD0Aa047ad1',
    cashapp: '0x8499f2e7c4496Acfe0D7Ca5C7b6522514877b33F',
    wise: '0x7E34909A1C1b2a4D2FAbA61c17a0F59ECAce6F29',
    mercadopago: '0xe4148B108Fe4D7421853FE8cFfd35bDc2c0d95Ec',
    zelle: '0x54c92a8828A393C5A6D1DfbB71d0e9e97329b39C',
    gatingService: '0x396D31055Db28C0C6f36e8b36f18FE7227248a97',
    zkp2pWitnessSigner: '0x0636c417755E3ae25C6c166D181c0607F4C572A3',
  },
};

