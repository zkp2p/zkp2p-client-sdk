import { IndexerClient } from './client';
import { FULFILLMENT_AND_PAYMENT_QUERY } from './queries';

export type FulfillmentRecord = {
  id: string;
  intentHash: string;
  amount: string;
  isManualRelease: boolean;
  fundsTransferredTo: string | null;
};

export type PaymentVerifiedRecord = {
  id: string;
  intentHash: string;
  method: string;
  currency: string;
  amount: string;
  timestamp: string;
  paymentId: string | null;
  payeeId: string | null;
};

export type FulfillmentAndPaymentResponse = {
  Orchestrator_V21_IntentFulfilled: FulfillmentRecord[];
  UnifiedVerifier_V21_PaymentVerified: PaymentVerifiedRecord[];
};

export async function fetchFulfillmentAndPayment(
  client: IndexerClient,
  intentHash: string
): Promise<FulfillmentAndPaymentResponse> {
  return client.query<FulfillmentAndPaymentResponse>({
    query: FULFILLMENT_AND_PAYMENT_QUERY,
    variables: { intentHash },
  });
}
