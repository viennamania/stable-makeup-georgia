export const BANKTRANSFER_ABLY_CHANNEL = "banktransfer-events";
export const BANKTRANSFER_ABLY_EVENT_NAME = "banktransfer.updated";

export type BankTransferDashboardEvent = {
  traceId: string | null;
  transactionType: string;
  amount: number;
  transactionName: string;
  bankAccountNumber: string;
  transactionDate: string;
  processingDate: string | null;
  status: "stored" | "error";
  storecode: string | null;
  tradeId: string | null;
  match: string | null;
  errorMessage: string | null;
  publishedAt: string;
};
