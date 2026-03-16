export const BANKTRANSFER_ABLY_CHANNEL = "banktransfer-events";
export const BANKTRANSFER_ABLY_EVENT_NAME = "banktransfer.updated";
export const BANKTRANSFER_UNMATCHED_ABLY_CHANNEL = "banktransfer-unmatched-events";
export const BANKTRANSFER_UNMATCHED_ABLY_EVENT_NAME = "banktransfer.unmatched";
export const BUYORDER_STATUS_ABLY_CHANNEL = "buyorder-status-events";
export const BUYORDER_STATUS_ABLY_EVENT_NAME = "buyorder.status.changed";
export const BUYORDER_BLOCKED_ABLY_CHANNEL = "buyorder-blocked-events";
export const BUYORDER_BLOCKED_ABLY_EVENT_NAME = "buyorder.blocked";
export const USDT_TRANSACTION_HASH_ABLY_CHANNEL = "usdt-transaction-hash-events";
export const USDT_TRANSACTION_HASH_ABLY_EVENT_NAME = "usdt.transactionHash.registered";

export type BankTransferDashboardStore = {
  code: string | null;
  logo: string | null;
  name: string | null;
};

export type BankTransferDashboardReceiver = {
  nickname: string | null;
  walletAddress: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
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
  receiver: BankTransferDashboardReceiver | null;
  tradeId: string | null;
  match: string | null;
  errorMessage: string | null;
  publishedAt: string;
};

export type BankTransferUnmatchedRealtimeEvent = {
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
  store: BankTransferDashboardStore | null;
  storecode: string | null;
  receiver: BankTransferDashboardReceiver | null;
  tradeId: string | null;
  match: string | null;
  reason: string | null;
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

export type BlockedBuyOrderRealtimeEvent = {
  eventId: string;
  logId: string;
  route: string;
  guardType: string;
  status: "blocked";
  reason: string | null;
  orderId: string | null;
  tradeId: string | null;
  storecode: string | null;
  publicIp: string | null;
  requesterWalletAddress: string | null;
  requestBody: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  publishedAt: string;
};

export type UsdtTransactionHashRealtimeEvent = {
  eventId: string;
  idempotencyKey: string;
  source: string;
  orderId: string | null;
  tradeId: string | null;
  chain: string | null;
  tokenSymbol: string;
  store: BuyOrderRealtimeStore | null;
  amountUsdt: number;
  transactionHash: string;
  logIndex?: string | null;
  fromWalletAddress: string | null;
  toWalletAddress: string | null;
  fromLabel: string | null;
  toLabel: string | null;
  fromIdentity?: {
    badgeLabel: string | null;
    nickname: string | null;
    storecode: string | null;
    storeName: string | null;
    storeLogo: string | null;
    userType: string | null;
    role: string | null;
    bankName: string | null;
    accountNumber: string | null;
    accountHolder: string | null;
  } | null;
  toIdentity?: {
    badgeLabel: string | null;
    nickname: string | null;
    storecode: string | null;
    storeName: string | null;
    storeLogo: string | null;
    userType: string | null;
    role: string | null;
    bankName: string | null;
    accountNumber: string | null;
    accountHolder: string | null;
  } | null;
  status: string | null;
  queueId: string | null;
  minedAt: string | null;
  createdAt: string;
  publishedAt: string;
};
