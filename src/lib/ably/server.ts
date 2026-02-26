import * as Ably from "ably";

import {
  BANKTRANSFER_ABLY_CHANNEL,
  BANKTRANSFER_ABLY_EVENT_NAME,
  type BankTransferDashboardEvent,
} from "@lib/ably/constants";

let ablyRestClient: Ably.Rest | null = null;
let warnedMissingKey = false;

function getAblyApiKey(): string {
  return process.env.ABLY_API_KEY?.trim() || "";
}

export function getAblyRestClient(): Ably.Rest | null {
  if (ablyRestClient) {
    return ablyRestClient;
  }

  const apiKey = getAblyApiKey();
  if (!apiKey) {
    if (!warnedMissingKey) {
      console.warn("ABLY_API_KEY is not set. Realtime publish is disabled.");
      warnedMissingKey = true;
    }
    return null;
  }

  ablyRestClient = new Ably.Rest({ key: apiKey });
  return ablyRestClient;
}

export async function publishBankTransferEvent(event: BankTransferDashboardEvent): Promise<void> {
  const client = getAblyRestClient();
  if (!client) {
    return;
  }

  const channel = client.channels.get(BANKTRANSFER_ABLY_CHANNEL);

  const maxRetries = Math.min(Math.max(Number(process.env.REALTIME_PUBLISH_MAX_RETRIES) || 3, 1), 8);
  const baseDelayMs = Math.min(Math.max(Number(process.env.REALTIME_PUBLISH_RETRY_DELAY_MS) || 200, 50), 5000);

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await channel.publish(
        {
          id: event.eventId,
          name: BANKTRANSFER_ABLY_EVENT_NAME,
          data: event,
        },
        { quickAck: true },
      );
      return;
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error;
      }

      const waitMs = baseDelayMs * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
}
