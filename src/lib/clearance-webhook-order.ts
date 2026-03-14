const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export const WITHDRAWAL_WEBHOOK_CLEARANCE_CREATED_BY_ROUTE =
  "/api/order/createClearanceOrderFromWithdrawalWebhook";
export const WITHDRAWAL_WEBHOOK_CLEARANCE_SOURCE =
  "banktransfer_withdrawn_webhook";
export const WITHDRAWAL_WEBHOOK_CLEARANCE_DUMMY_TRANSFER_REASON =
  "withdrawal_webhook_auto_stub";

export const isWithdrawalWebhookGeneratedClearanceOrder = (orderLike: any) => {
  const createdBy = orderLike?.createdBy || null;
  const route = normalizeString(
    createdBy?.route || orderLike?.clearanceSource?.route,
  );
  const source = normalizeString(
    createdBy?.source
      || orderLike?.source
      || orderLike?.automationSource
      || orderLike?.clearanceSource?.source,
  );

  return (
    route === WITHDRAWAL_WEBHOOK_CLEARANCE_CREATED_BY_ROUTE
    || source === WITHDRAWAL_WEBHOOK_CLEARANCE_SOURCE
  );
};

export const isWithdrawalWebhookGeneratedClearanceOrderDummyTransfer = (
  orderLike: any,
) => {
  if (!isWithdrawalWebhookGeneratedClearanceOrder(orderLike)) {
    return false;
  }

  if (orderLike?.transactionHashDummy === true) {
    return true;
  }

  const reason = normalizeString(
    orderLike?.transactionHashDummyReason
      || orderLike?.createdBy?.transactionHashDummyReason
      || orderLike?.clearanceSource?.transactionHashDummyReason,
  );

  return reason === WITHDRAWAL_WEBHOOK_CLEARANCE_DUMMY_TRANSFER_REASON;
};

export const isWithdrawalWebhookGeneratedClearanceOrderDeletable = (
  orderLike: any,
) => {
  if (!isWithdrawalWebhookGeneratedClearanceOrder(orderLike)) {
    return false;
  }

  const status = normalizeString(orderLike?.status).toLowerCase();
  const transactionHash = normalizeString(orderLike?.transactionHash).toLowerCase();
  const queueId = normalizeString(orderLike?.queueId);
  const settlementTxid = normalizeString(orderLike?.settlement?.txid).toLowerCase();
  const isDummyTransfer = isWithdrawalWebhookGeneratedClearanceOrderDummyTransfer(orderLike);

  if (status === "cancelled" || status === "paymentsettled") {
    return false;
  }

  return (
    (!transactionHash || transactionHash === "0x" || isDummyTransfer)
    && !queueId
    && (!settlementTxid || settlementTxid === "0x")
  );
};
