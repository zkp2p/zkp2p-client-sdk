export const abi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_escrow",
        "type": "address"
      },
      {
        "internalType": "contract INullifierRegistry",
        "name": "_nullifierRegistry",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_timestampBuffer",
        "type": "uint256"
      },
      {
        "internalType": "bytes32[]",
        "name": "_currencies",
        "type": "bytes32[]"
      },
      {
        "internalType": "string[]",
        "name": "_providerHashes",
        "type": "string[]"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "currencyCode",
        "type": "bytes32"
      }
    ],
    "name": "CurrencyAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "currencyCode",
        "type": "bytes32"
      }
    ],
    "name": "CurrencyRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "providerHash",
        "type": "string"
      }
    ],
    "name": "ProviderHashAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "providerHash",
        "type": "string"
      }
    ],
    "name": "ProviderHashRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestampBuffer",
        "type": "uint256"
      }
    ],
    "name": "TimestampBufferSet",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "COMPLETE_PAYMENT_STATUS",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_currencyCode",
        "type": "bytes32"
      }
    ],
    "name": "addCurrency",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_newProviderHash",
        "type": "string"
      }
    ],
    "name": "addProviderHash",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "escrow",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrencies",
    "outputs": [
      {
        "internalType": "bytes32[]",
        "name": "",
        "type": "bytes32[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getProviderHashes",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "isCurrency",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "isProviderHash",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nullifierRegistry",
    "outputs": [
      {
        "internalType": "contract INullifierRegistry",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "providerHashes",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_currencyCode",
        "type": "bytes32"
      }
    ],
    "name": "removeCurrency",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_removeProviderHash",
        "type": "string"
      }
    ],
    "name": "removeProviderHash",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_timestampBuffer",
        "type": "uint256"
      }
    ],
    "name": "setTimestampBuffer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "timestampBuffer",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes",
            "name": "paymentProof",
            "type": "bytes"
          },
          {
            "internalType": "address",
            "name": "depositToken",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "intentAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "intentTimestamp",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "payeeDetails",
            "type": "string"
          },
          {
            "internalType": "bytes32",
            "name": "fiatCurrency",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "conversionRate",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "internalType": "struct IPaymentVerifier.VerifyPaymentData",
        "name": "_verifyPaymentData",
        "type": "tuple"
      }
    ],
    "name": "verifyPayment",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      },
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "components": [
              {
                "internalType": "string",
                "name": "provider",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "parameters",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "context",
                "type": "string"
              }
            ],
            "internalType": "struct Claims.ClaimInfo",
            "name": "claimInfo",
            "type": "tuple"
          },
          {
            "components": [
              {
                "components": [
                  {
                    "internalType": "bytes32",
                    "name": "identifier",
                    "type": "bytes32"
                  },
                  {
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                  },
                  {
                    "internalType": "uint32",
                    "name": "timestampS",
                    "type": "uint32"
                  },
                  {
                    "internalType": "uint32",
                    "name": "epoch",
                    "type": "uint32"
                  }
                ],
                "internalType": "struct Claims.CompleteClaimData",
                "name": "claim",
                "type": "tuple"
              },
              {
                "internalType": "bytes[]",
                "name": "signatures",
                "type": "bytes[]"
              }
            ],
            "internalType": "struct Claims.SignedClaim",
            "name": "signedClaim",
            "type": "tuple"
          },
          {
            "internalType": "bool",
            "name": "isAppclipProof",
            "type": "bool"
          }
        ],
        "internalType": "struct IReclaimVerifier.ReclaimProof",
        "name": "proof",
        "type": "tuple"
      },
      {
        "internalType": "address[]",
        "name": "_witnesses",
        "type": "address[]"
      },
      {
        "internalType": "uint256",
        "name": "_requiredThreshold",
        "type": "uint256"
      }
    ],
    "name": "verifyProofSignatures",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  }
];