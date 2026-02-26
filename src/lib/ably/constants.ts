export const BANKTRANSFER_ABLY_CHANNEL = "banktransfer-events";
export const BANKTRANSFER_ABLY_EVENT_NAME = "banktransfer.updated";

export type BankTransferDashboardStore = {
  code: string | null;
  logo: string | null;
  name: string | null;
};

export type BankTransferDashboardEvent = {
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
