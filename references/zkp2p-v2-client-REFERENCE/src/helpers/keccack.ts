import { keccak256 as viemKeccak256, toHex, encodePacked, sha256 as viemSha256 } from "viem";

export const keccak256 = (inputString: string): string => {
  return viemKeccak256(encodePacked(["string"], [inputString]));
};

export const currencyKeccak256 = (inputString: string): string => {
  const bytes = new TextEncoder().encode(inputString);
  return viemKeccak256(bytes);
};

export const sha256 = (inputString: string): string => {
  return viemSha256(encodePacked(["string"], [inputString]));
};
