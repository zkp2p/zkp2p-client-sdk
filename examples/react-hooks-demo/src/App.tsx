import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';
import {
  useZkp2pClient,
  useQuote,
  useSignalIntent,
  useCreateDeposit,
  useFulfillIntent,
  useExtensionOrchestrator,
  PAYMENT_PLATFORMS,
  PLATFORM_METADATA,
  Currency,
  SUPPORTED_CHAIN_IDS,
  currencyInfo,
  type PaymentPlatformType,
} from '@zkp2p/client-sdk';

// Setup React Query
const queryClient = new QueryClient();

// Main App Component
function ZKP2PDemo() {
  const [selectedPlatform, setSelectedPlatform] = useState<PaymentPlatformType>('venmo');
  const [selectedCurrency, setSelectedCurrency] = useState(Currency.USD);
  const [amount, setAmount] = useState('100');

  // Initialize ZKP2P client
  const { client, isInitialized, error: clientError } = useZkp2pClient({
    walletClient: typeof window !== 'undefined' && window.ethereum
      ? createWalletClient({
          chain: base,
          transport: custom(window.ethereum),
        })
      : undefined,
    apiKey: import.meta.env.VITE_ZKP2P_API_KEY,
    chainId: SUPPORTED_CHAIN_IDS.BASE_MAINNET,
  });

  // Quote management with callbacks
  const {
    fetchQuote,
    quote,
    isLoading: quoteLoading,
    error: quoteError,
    reset: resetQuote,
  } = useQuote({
    client,
    onSuccess: (quote) => {
      console.log('✅ Quote received:', quote);
    },
    onError: (error) => {
      console.error('❌ Quote error:', error);
    },
  });

  // Create deposit with progress tracking
  const {
    createDeposit,
    txHash: depositTxHash,
    depositDetails,
    isLoading: depositLoading,
    error: depositError,
  } = useCreateDeposit({
    client,
    onSuccess: ({ hash, depositDetails }) => {
      console.log('✅ Deposit created!');
      console.log('Transaction:', hash);
      console.log('Details:', depositDetails);
      alert(`Deposit created! TX: ${hash}`);
    },
    onError: (error) => {
      console.error('❌ Deposit failed:', error);
      alert(`Error: ${error.message}`);
    },
  });

  // Signal intent with response handling
  const {
    signalIntent,
    response: intentResponse,
    isLoading: intentLoading,
    error: intentError,
    reset: resetIntent,
  } = useSignalIntent({
    client,
    onSuccess: (response) => {
      console.log('✅ Intent signaled!');
      console.log('Intent Hash:', response.intentHash);
      console.log('Timestamp:', response.timestamp);
    },
    onError: (error) => {
      console.error('❌ Intent signal failed:', error);
    },
  });

  // Extension orchestrator with unified authentication
  const {
    authenticate,
    payments,
    proofs,
    proofBytes,
    isAuthenticating,
    isGeneratingProof,
    progress,
    error: proofError,
    reset: resetOrchestrator,
  } = useExtensionOrchestrator({
    debug: true,
    autoDispose: true,
    metadataTimeoutMs: 60000,
  });

  // Fulfill intent with proof
  const {
    fulfillIntent,
    txHash: fulfillTxHash,
    isLoading: fulfillLoading,
    error: fulfillError,
  } = useFulfillIntent({
    client,
    onSuccess: (hash) => {
      console.log('🎉 Intent fulfilled successfully!');
      console.log('Transaction hash:', hash);
      alert(`Success! View on BaseScan: https://basescan.org/tx/${hash}`);
    },
    onError: (error) => {
      console.error('❌ Fulfill intent failed:', error);
      alert(`Error: ${error.message}`);
    },
  });

  // Handle fetching quote
  const handleFetchQuote = async () => {
    if (!client) {
      alert('Client not initialized');
      return;
    }

    resetQuote();

    await fetchQuote({
      paymentPlatforms: [selectedPlatform],
      fiatCurrency: selectedCurrency,
      user: '0x0000000000000000000000000000000000000001',
      recipient: '0x0000000000000000000000000000000000000002',
      destinationChainId: SUPPORTED_CHAIN_IDS.BASE_MAINNET,
      destinationToken: client.getUsdcAddress(),
      amount,
    });
  };

  // Handle creating a deposit
  const handleCreateDeposit = async () => {
    if (!client) return;

    const conversionRate = '1000000'; // 1:1 for USD
    const amountInWei = BigInt(Math.floor(parseFloat(amount) * 1_000_000));

    await createDeposit({
      token: client.getUsdcAddress(),
      amount: amountInWei,
      intentAmountRange: {
        min: amountInWei / 2n,
        max: amountInWei * 2n,
      },
      conversionRates: [[{ currency: selectedCurrency, conversionRate }]],
      processorNames: [selectedPlatform],
      depositData: [{
        [`${selectedPlatform}Username`]: 'user123',
      }],
    });
  };

  // Handle signaling intent
  const handleSignalIntent = async () => {
    if (!client || !quote) return;

    const selectedQuote = quote.quotes[0];
    if (!selectedQuote) {
      alert('No quote available');
      return;
    }

    await signalIntent({
      processorName: selectedPlatform,
      depositId: selectedQuote.depositId,
      tokenAmount: (parseFloat(amount) * 1_000_000).toString(),
      payeeDetails: JSON.stringify({
        email: 'user@example.com',
        [`${selectedPlatform}Id`]: 'user123',
      }),
      toAddress: '0x0000000000000000000000000000000000000002',
      currency: selectedCurrency,
    });
  };

  // Handle unified authentication and proof generation
  const handleAuthenticateAndProve = async () => {
    if (!intentResponse?.intentHash) {
      alert('Please signal an intent first');
      return;
    }

    resetOrchestrator();

    const result = await authenticate(selectedPlatform, {
      paymentMethod: 1,
      autoGenerateProof: {
        intentHashHex: intentResponse.intentHash as `0x${string}`,
        itemIndex: 0,
        onProofGenerated: (proofs) => {
          console.log('✅ Proofs generated:', proofs);
        },
        onProofError: (error) => {
          console.error('❌ Proof generation failed:', error);
          alert(`Proof error: ${error.message}`);
        },
        onProgress: (progress) => {
          console.log('⏳ Progress:', progress);
        },
      },
      onPaymentsReceived: (payments) => {
        console.log('📱 Payments received:', payments);
      },
    });

    // Automatically fulfill intent if proofs were generated
    if (result?.proofs?.length && intentResponse?.intentHash) {
      await fulfillIntent({
        intentHash: intentResponse.intentHash as `0x${string}`,
        proof: result.proofs[0],
      });
    }
  };

  // Render loading state
  if (!isInitialized) {
    return (
      <div className="loading">
        <h2>Initializing ZKP2P Client...</h2>
        <p>Please make sure MetaMask is connected</p>
      </div>
    );
  }

  // Render error state
  if (clientError) {
    return (
      <div className="error">
        <h2>Initialization Error</h2>
        <p>{clientError.message}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>🚀 ZKP2P Client SDK v1.0.0 Demo</h1>
      
      {/* Configuration Section */}
      <div className="config-section">
        <h2>⚙️ Configuration</h2>
        
        {/* Platform Selector */}
        <div className="platform-selector">
          <h3>Select Payment Platform:</h3>
          <div className="platform-buttons">
            {PAYMENT_PLATFORMS.map((platform) => {
              const meta = PLATFORM_METADATA[platform];
              return (
                <button
                  key={platform}
                  onClick={() => setSelectedPlatform(platform)}
                  className={`platform-btn ${selectedPlatform === platform ? 'active' : ''}`}
                >
                  <span className="platform-logo">{meta.logo}</span>
                  <span className="platform-name">{meta.displayName}</span>
                  <span className="platform-proofs">({meta.requiredProofs} proof)</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Currency Selector */}
        <div className="currency-selector">
          <h3>Select Currency:</h3>
          <select 
            value={selectedCurrency} 
            onChange={(e) => setSelectedCurrency(e.target.value as typeof Currency.USD)}
          >
            {Object.entries(Currency).map(([key, code]) => {
              const info = currencyInfo[code];
              return (
                <option key={code} value={code}>
                  {info.currencySymbol} {code} - {info.currencyName}
                </option>
              );
            })}
          </select>
        </div>

        {/* Amount Input */}
        <div className="amount-input">
          <h3>Amount:</h3>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="1"
            step="0.01"
          />
          <span className="currency-symbol">
            {currencyInfo[selectedCurrency].currencySymbol}
          </span>
        </div>
      </div>

      {/* Quote Section */}
      <div className="quote-section">
        <h2>💰 Get Quote</h2>
        <button onClick={handleFetchQuote} disabled={quoteLoading}>
          {quoteLoading ? 'Fetching Quote...' : 'Fetch Quote'}
        </button>
        
        {quote && (
          <div className="quote-result">
            <h3>Quote Result:</h3>
            <pre>{JSON.stringify(quote, null, 2)}</pre>
          </div>
        )}
        
        {quoteError && (
          <div className="error-msg">
            Error: {quoteError.message}
          </div>
        )}
      </div>

      {/* Deposit Section */}
      <div className="deposit-section">
        <h2>💵 Create Deposit</h2>
        <button onClick={handleCreateDeposit} disabled={depositLoading}>
          {depositLoading ? 'Creating Deposit...' : 'Create Deposit'}
        </button>
        
        {depositTxHash && (
          <div className="success-msg">
            <p>✅ Deposit created!</p>
            <p>TX: {depositTxHash}</p>
            <a 
              href={`https://basescan.org/tx/${depositTxHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              View on BaseScan →
            </a>
          </div>
        )}
      </div>

      {/* Intent Section */}
      <div className="intent-section">
        <h2>🎯 Signal Intent</h2>
        <button onClick={handleSignalIntent} disabled={intentLoading || !quote}>
          {intentLoading ? 'Signaling Intent...' : 'Signal Intent'}
        </button>
        
        {intentResponse && (
          <div className="intent-result">
            <p>✅ Intent Signaled!</p>
            <p>Hash: {intentResponse.intentHash}</p>
            <p>Timestamp: {new Date(intentResponse.timestamp * 1000).toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Proof Generation Section */}
      <div className="proof-section">
        <h2>🔐 Generate Payment Proof</h2>
        <button 
          onClick={handleAuthenticateAndProve} 
          disabled={isAuthenticating || isGeneratingProof || !intentResponse}
        >
          {isAuthenticating 
            ? 'Authenticating...' 
            : isGeneratingProof 
            ? `Generating Proof... ${progress?.stage || ''}`
            : 'Authenticate & Generate Proof'}
        </button>
        
        {/* Progress Display */}
        {progress && (
          <div className="progress-display">
            <h3>Progress:</h3>
            <p>Stage: {progress.stage}</p>
            <p>Proof Index: {progress.proofIndex + 1}</p>
            {progress.message && <p>Message: {progress.message}</p>}
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${((progress.proofIndex + 1) / PLATFORM_METADATA[selectedPlatform].requiredProofs) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Payments Display */}
        {payments && payments.length > 0 && (
          <div className="payments-display">
            <h3>📱 Available Payments ({payments.length}):</h3>
            <ul>
              {payments.slice(0, 5).map((payment, idx) => (
                <li key={idx}>
                  {payment.title} - {payment.amount} - {new Date(payment.date).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Proofs Display */}
        {proofs && (
          <div className="proofs-display">
            <h3>✅ Generated Proofs:</h3>
            <p>Number of proofs: {proofs.length}</p>
            <p>Proof bytes: {proofBytes?.slice(0, 20)}...</p>
          </div>
        )}
      </div>

      {/* Fulfillment Section */}
      {fulfillTxHash && (
        <div className="success-msg">
          <h3>🎉 Intent Fulfilled Successfully!</h3>
          <p>Transaction Hash: {fulfillTxHash}</p>
          <a 
            href={`https://basescan.org/tx/${fulfillTxHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            View on BaseScan →
          </a>
        </div>
      )}

      {/* Status Summary */}
      <div className="status-summary">
        <h2>📊 Status Summary</h2>
        <ul>
          <li>Client: {isInitialized ? '✅ Initialized' : '⏳ Initializing'}</li>
          <li>Quote: {quote ? '✅ Fetched' : '⏳ Not fetched'}</li>
          <li>Deposit: {depositTxHash ? '✅ Created' : '⏳ Not created'}</li>
          <li>Intent: {intentResponse ? '✅ Signaled' : '⏳ Not signaled'}</li>
          <li>Proofs: {proofs ? `✅ Generated (${proofs.length})` : '⏳ Not generated'}</li>
          <li>Fulfillment: {fulfillTxHash ? '✅ Complete' : '⏳ Pending'}</li>
        </ul>
      </div>
    </div>
  );
}

// App wrapper with providers
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ZKP2PDemo />
    </QueryClientProvider>
  );
}
