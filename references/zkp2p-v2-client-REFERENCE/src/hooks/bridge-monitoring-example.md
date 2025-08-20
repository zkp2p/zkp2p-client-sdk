# Bridge Monitoring System Usage Guide

The `useBridgeMonitoring` hook provides comprehensive tracking and analytics for bridge transactions in zkp2p-v2-client. This system helps monitor success rates, performance metrics, and error patterns for both Relay and Bungee bridge providers.

## Features

- **Real-time tracking**: Monitor bridge attempts from start to completion
- **Performance metrics**: Success rates, completion times, gas costs
- **Error categorization**: Detailed error tracking and analysis
- **Provider comparison**: Compare Relay vs Bungee performance
- **Local persistence**: 7-day data retention in localStorage
- **Analytics utilities**: Health scores, recommendations, and insights

## Basic Usage

```typescript
import { useBridgeMonitoring } from '@hooks/useBridgeMonitoring';

function BridgeComponent() {
  const {
    startBridgeAttempt,
    updateBridgeAttempt,
    completeBridgeAttempt,
    failBridgeAttempt,
    metrics,
    exportMonitoringData,
  } = useBridgeMonitoring();

  const handleBridgeTransaction = async () => {
    // Start tracking
    const attemptId = startBridgeAttempt('RELAY', 'QUOTE_FETCH', {
      fromChain: 8453, // Base
      toChain: 1,      // Ethereum
      fromToken: 'USDC',
      toToken: 'USDC',
      amount: '100000000', // 100 USDC
      recipient: '0x...',
    });

    try {
      // Update status as transaction progresses
      updateBridgeAttempt(attemptId, { status: 'QUOTE_FETCHED' });
      
      // Simulate bridge operation
      const result = await performBridgeOperation();
      
      // Complete successfully with cost data
      completeBridgeAttempt(attemptId, {
        costs: {
          gasCostUsd: '2.50',
          bridgeFeeUsd: '0.15',
        },
      });
      
    } catch (error) {
      // Log failure with error details
      failBridgeAttempt(attemptId, {
        code: 'INSUFFICIENT_GAS',
        message: error.message,
        category: ErrorCategory.BRIDGE_ERROR,
      });
    }
  };

  return (
    <div>
      <p>Overall Success Rate: {metrics.successRate.toFixed(1)}%</p>
      <p>Average Completion Time: {Math.round(metrics.averageCompletionTime / 1000)}s</p>
      <p>Average Gas Cost: ${metrics.averageGasCostUsd.toFixed(2)}</p>
    </div>
  );
}
```

## Integration with Bridge Hooks

The monitoring system is already integrated into `useRelayBridge` and `useBungeeExchange`:

### Relay Bridge Integration

```typescript
// In useRelayBridge.ts
const getRelayQuote = useCallback(async (params, context) => {
  const attemptId = startBridgeAttempt('RELAY', 'QUOTE_FETCH', {
    fromChain: params.chainId,
    toChain: params.toChainId,
    // ... other context
  });

  try {
    const quote = await client.actions.getQuote(request);
    
    completeBridgeAttempt(attemptId, {
      costs: {
        gasCostUsd: quote.fees?.gas?.amountUsd,
        bridgeFeeUsd: quote.fees?.relayer?.amountUsd,
      },
    });
    
    return quote;
  } catch (err) {
    failBridgeAttempt(attemptId, {
      code: err.code || 'QUOTE_FETCH_ERROR',
      message: err.message,
      category: ErrorCategory.BRIDGE_ERROR,
    });
    throw err;
  }
}, [startBridgeAttempt, completeBridgeAttempt, failBridgeAttempt]);
```

## Metrics and Analytics

### Available Metrics

```typescript
interface BridgeMetrics {
  totalAttempts: number;
  successRate: number;
  averageCompletionTime: number;
  averageGasCostUsd: number;
  averageBridgeFeeUsd: number;
  totalRetries: number;
  retryRate: number;
  mostCommonErrors: Array<{
    error: string;
    count: number;
    percentage: number;
  }>;
  providerMetrics: Record<'RELAY' | 'BUNGEE', BridgeProviderMetrics>;
  recentPerformance: {
    last24h: PerformanceSnapshot;
    last7d: PerformanceSnapshot;
  };
}
```

### Provider-Specific Metrics

```typescript
function BridgeDashboard() {
  const { metrics, getProviderSuccessRate, getProviderAverageTime } = useBridgeMonitoring();

  return (
    <div>
      <h3>Provider Comparison</h3>
      <div>
        <h4>Relay</h4>
        <p>Success Rate: {getProviderSuccessRate('RELAY').toFixed(1)}%</p>
        <p>Avg Time: {Math.round(getProviderAverageTime('RELAY') / 1000)}s</p>
        <p>Attempts: {metrics.providerMetrics.RELAY.attempts}</p>
      </div>
      <div>
        <h4>Bungee</h4>
        <p>Success Rate: {getProviderSuccessRate('BUNGEE').toFixed(1)}%</p>
        <p>Avg Time: {Math.round(getProviderAverageTime('BUNGEE') / 1000)}s</p>
        <p>Attempts: {metrics.providerMetrics.BUNGEE.attempts}</p>
      </div>
    </div>
  );
}
```

## Advanced Analytics

### Bridge Health Scoring

```typescript
import { calculateBridgeHealthScore } from '@helpers/bridgeMonitoringUtils';

function BridgeHealthIndicator() {
  const { metrics, exportMonitoringData } = useBridgeMonitoring();
  const exportedData = exportMonitoringData();
  
  const relayHealth = calculateBridgeHealthScore(
    metrics.providerMetrics.RELAY, 
    exportedData.rawAttempts.filter(a => a.provider === 'RELAY')
  );

  return (
    <div>
      <h3>Relay Health Score: {relayHealth.overall}/100</h3>
      <p>Reliability: {relayHealth.reliability}/100</p>
      <p>Performance: {relayHealth.performance}/100</p>
      <p>Cost Efficiency: {relayHealth.costEfficiency}/100</p>
      <p>Trend: {relayHealth.details.recentTrend}</p>
    </div>
  );
}
```

### Bridge Provider Recommendations

```typescript
import { getOptimalBridgeProvider } from '@helpers/bridgeMonitoringUtils';

function SmartBridgeSelector({ amount, urgency, fromChain, toChain, token }) {
  const { metrics } = useBridgeMonitoring();
  
  const recommendation = getOptimalBridgeProvider(metrics, {
    amount,
    urgency,
    fromChain,
    toChain,
    token,
  });

  return (
    <div>
      <h3>Recommended Bridge: {recommendation.provider}</h3>
      <p>Confidence: {recommendation.confidence}/100</p>
      <ul>
        {recommendation.reasoning.map((reason, index) => (
          <li key={index}>{reason}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Error Analysis

### Common Failure Patterns

```typescript
function ErrorAnalysis() {
  const { metrics, getMostCommonFailures } = useBridgeMonitoring();
  const topErrors = getMostCommonFailures(5);

  return (
    <div>
      <h3>Most Common Failures</h3>
      <ul>
        {topErrors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
      
      <h3>All Error Categories</h3>
      {metrics.mostCommonErrors.map(error => (
        <div key={error.error}>
          <strong>{error.error}</strong>: {error.count} times ({error.percentage.toFixed(1)}%)
        </div>
      ))}
    </div>
  );
}
```

## Data Export and Monitoring

### Export for Analytics

```typescript
function DataExporter() {
  const { exportMonitoringData, clearMonitoringData } = useBridgeMonitoring();

  const handleExport = () => {
    const data = exportMonitoringData();
    console.log('Bridge Monitoring Data:', data);
    
    // Send to analytics service
    // analytics.track('bridge_monitoring_data', data.summary);
  };

  const handleClear = () => {
    if (confirm('Clear all monitoring data?')) {
      clearMonitoringData();
    }
  };

  return (
    <div>
      <button onClick={handleExport}>Export Data</button>
      <button onClick={handleClear}>Clear Data</button>
    </div>
  );
}
```

### Dashboard Integration

```typescript
function BridgeMonitoringDashboard() {
  const { metrics, exportMonitoringData } = useBridgeMonitoring();
  const formattedData = formatBridgeMetricsForDisplay(metrics);

  return (
    <div className="bridge-dashboard">
      <div className="summary-cards">
        <div className="card">
          <h3>Total Transactions</h3>
          <p>{formattedData.summary.totalTransactions}</p>
        </div>
        <div className="card">
          <h3>Success Rate</h3>
          <p>{formattedData.summary.overallSuccessRate}</p>
        </div>
        <div className="card">
          <h3>Avg Completion Time</h3>
          <p>{formattedData.summary.averageCompletionTime}</p>
        </div>
        <div className="card">
          <h3>Avg Gas Cost</h3>
          <p>{formattedData.summary.averageGasCost}</p>
        </div>
      </div>

      <div className="provider-comparison">
        <h3>Provider Performance</h3>
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Attempts</th>
              <th>Success Rate</th>
              <th>Avg Time</th>
              <th>Avg Cost</th>
            </tr>
          </thead>
          <tbody>
            {formattedData.providers.map(provider => (
              <tr key={provider.name}>
                <td>{provider.name}</td>
                <td>{provider.attempts}</td>
                <td>{provider.successRate}</td>
                <td>{provider.averageTime}</td>
                <td>{provider.averageCost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="recent-trends">
        <h3>Recent Performance</h3>
        <p>Last 24h: {formattedData.recentTrends.last24h.successRate}</p>
        <p>Last 7d: {formattedData.recentTrends.last7d.successRate}</p>
      </div>
    </div>
  );
}
```

## Configuration

### Storage Settings

```typescript
// In useBridgeMonitoring.ts
const STORAGE_KEY = 'zkp2p_bridge_monitoring';
const MAX_STORED_ATTEMPTS = 1000; // Adjust based on storage needs
const RETENTION_PERIOD = 7 * 24 * 60 * 60 * 1000; // 7 days
```

### Error Categories

The system uses standardized error categories from `@helpers/types/errors`:

- `BRIDGE_ERROR`: General bridge failures
- `TIMEOUT_ERROR`: Request timeouts
- `CONTRACT_ERROR`: Smart contract issues
- `VALIDATION_ERROR`: Input validation failures
- `AUTH_ERROR`: Authentication problems

## Performance Considerations

1. **Lightweight**: Minimal performance impact during bridge operations
2. **Efficient Storage**: Automatic cleanup of old data beyond retention period
3. **Memory Management**: Limited to 1000 stored attempts by default
4. **Batch Operations**: Efficient localStorage updates
5. **Background Processing**: Analytics calculations are memoized

## Integration with Rollbar

Failed bridge attempts are automatically logged to Rollbar in production:

```typescript
// Automatic error logging
logError(
  `Bridge ${provider} ${transactionType} failed`,
  error?.category || ErrorCategory.BRIDGE_ERROR,
  {
    attemptId,
    provider,
    transactionType,
    retryCount,
    completionTime,
    errorCode: error?.code,
    errorMessage: error?.message,
    transactionContext,
  }
);
```

This comprehensive monitoring system provides valuable insights for debugging bridge issues and optimizing the user experience in zkp2p-v2-client.