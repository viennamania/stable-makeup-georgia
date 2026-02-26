export const BANKTRANSFER_ABLY_CHANNEL = "banktransfer-events";
export const BANKTRANSFER_ABLY_EVENT_NAME = "banktransfer.updated";
export const BUYORDER_STATUS_ABLY_CHANNEL = "buyorder-status-events";
export const BUYORDER_STATUS_ABLY_EVENT_NAME = "buyorder.status.changed";

export type BankTransferDashboardStore = {
  code: string | null;
  logo: string | null;
  name: string | null;
};

export type BankTransferDashboardEvent = {
  eventId: string;
  idempotencyKey: string;
  cursor?: string | null;
  traceId: string | null;
  transactionType: string;
  amount: number;
  transactionName: string;
  bankAccountNumber: string;
  transactionDate: string;
  processingDate: string | null;
  status: "stored" | "error";
  store: BankTransferDashboardStore | null;
  storecode: string | null;
  tradeId: string | null;
  match: string | null;
  errorMessage: string | null;
  publishedAt: string;
};

export type BuyOrderRealtimeStore = {
  code: string | null;
  logo: string | null;
  name: string | null;
};

export type BuyOrderStatusRealtimeEvent = {
  eventId: string;
  idempotencyKey: string;
  cursor?: string | null;
  source: string;
  orderId: string | null;
  tradeId: string | null;
  statusFrom: string | null;
  statusTo: string;
  store: BuyOrderRealtimeStore | null;
  amountKrw: number;
  amountUsdt: number;
  buyerName: string | null;
  buyerWalletAddress: string | null;
  buyerAccountNumber: string | null;
  transactionHash: string | null;
  escrowTransactionHash: string | null;
  queueId: string | null;
  minedAt: string | null;
  reason: string | null;
  publishedAt: string;
};
