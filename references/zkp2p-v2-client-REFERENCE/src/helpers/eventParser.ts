import { ethers } from 'ethers';
import { abi as EscrowAbi } from '@helpers/abi/escrow.abi';

// Create an interface using the ABI
const escrowInterface = new ethers.Interface(EscrowAbi);

/**
 * Extract the intentHash from transaction logs by looking for the IntentSignaled event
 * @param logs Array of transaction logs from a receipt
 * @returns The intentHash from the first IntentSignaled event found, or null if not found
 */
export function extractIntentHashFromLogs(logs: any[]): string | null {
  if (!logs || !Array.isArray(logs)) {
    return null;
  }

  // Look for IntentSignaled events in the logs
  for (const log of logs) {
    try {
      // Try to parse the log using our interface
      const parsedLog = escrowInterface.parseLog(log);

      // Check if this is the IntentSignaled event
      if (parsedLog && parsedLog.name === 'IntentSignaled') {
        // The intentHash is the first parameter (it's indexed)
        return parsedLog.args.intentHash;
      }
    } catch (error) {
      // Skip logs that can't be parsed with our interface
      continue;
    }
  }

  return null; // No IntentSignaled event found
}