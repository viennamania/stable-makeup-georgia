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
  await channel.publish(BANKTRANSFER_ABLY_EVENT_NAME, event);
}
