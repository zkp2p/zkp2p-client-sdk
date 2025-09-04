import { keccak256 as _keccak256, sha256 as _sha256, encodePacked, stringToHex } from 'viem';

export const keccak256 = (inputString: string): string => {
  // Equivalent to solidityKeccak256(['string'], [inputString])
  return _keccak256(encodePacked(['string'], [inputString]));
};

export const currencyKeccak256 = (inputString: string): string => {
  // Raw keccak of UTF-8 bytes
  return _keccak256(stringToHex(inputString));
};

export const sha256 = (inputString: string): string => {
  // Equivalent to soliditySha256(['string'], [inputString])
  return _sha256(encodePacked(['string'], [inputString]));
};
