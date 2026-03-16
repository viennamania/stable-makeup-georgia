import { chain as configuredChain } from "@/app/config/contractAddresses";
import {
  USDT_TRANSACTION_HASH_ABLY_CHANNEL,
  USDT_TRANSACTION_HASH_ABLY_EVENT_NAME,
} from "@lib/ably/constants";

export type ScanThirdwebWebhookStatusRecord = {
  id?: string;
  name?: string | null;
  webhookUrl?: string;
  disabled?: boolean;
  urlMatchesExpected?: boolean;
  walletCount?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ScanThirdwebWebhookStatus =
  | {
      ok: true;
      mode?: "live" | "persisted-fallback";
      fetchedAt?: string;
      receiverUrl?: string | null;
      expectedWalletCount?: number;
      expectedWebhookCount?: number;
      managedWebhookCount?: number;
      activeWebhookCount?: number;
      disabledWebhookCount?: number;
      urlMismatchCount?: number;
      webhooks?: ScanThirdwebWebhookStatusRecord[];
    }
  | {
      ok: false;
      mode?: "live" | "persisted-fallback";
      fetchedAt?: string;
      receiverUrl?: string | null;
      expectedWalletCount?: number;
      expectedWebhookCount?: number;
      managedWebhookCount?: number;
      activeWebhookCount?: number;
      disabledWebhookCount?: number;
      urlMismatchCount?: number;
      webhooks?: ScanThirdwebWebhookStatusRecord[];
      error?: string;
    };

export type ScanFeedMeta = {
  channel?: string;
  eventName?: string;
  authUrl?: string;
  snapshotUrl?: string;
  ingestUrl?: string;
  authHeaders?: string[];
  thirdwebWebhookUrl?: string;
  thirdwebWebhookHeaders?: string[];
  thirdwebWebhookTopic?: string;
  thirdwebWebhookContractAddress?: string;
  thirdwebWebhookSigHash?: string;
  thirdwebWebhookFilterHint?: string;
  thirdwebWebhookStatus?: ScanThirdwebWebhookStatus;
};

export type ScanSnapshotResponse = {
  result?: unknown[];
  meta?: ScanFeedMeta;
};

export type ResolvedScanFeedMeta = Required<Omit<ScanFeedMeta, "thirdwebWebhookStatus">>;

export function normalizeAddress(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

export function toTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function formatUsdt(value: number): string {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });
}

export function formatDateTime(value: string | null | undefined): string {
  const text = String(value || "").trim();
  if (!text) {
    return "-";
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return text;
  }

  return date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatShortHash(value: string | null | undefined): string {
  const hash = String(value || "").trim();
  if (!hash) {
    return "-";
  }
  if (hash.length <= 22) {
    return hash;
  }
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export function formatShortAddress(value: string | null | undefined): string {
  const address = String(value || "").trim();
  if (!address) {
    return "-";
  }
  if (address.length <= 18) {
    return address;
  }
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export function getExplorerBaseUrl(): string {
  if (configuredChain === "ethereum") {
    return "https://etherscan.io";
  }
  if (configuredChain === "polygon") {
    return "https://polygonscan.com";
  }
  if (configuredChain === "bsc") {
    return "https://bscscan.com";
  }
  return "https://arbiscan.io";
}

export function getExplorerTxUrl(hash: string | null | undefined): string {
  const normalized = String(hash || "").trim();
  if (!normalized) {
    return "";
  }
  return `${getExplorerBaseUrl()}/tx/${normalized}`;
}

export function resolveScanFeedMeta(feedMeta: ScanFeedMeta | null | undefined): ResolvedScanFeedMeta {
  return {
    channel: feedMeta?.channel || USDT_TRANSACTION_HASH_ABLY_CHANNEL,
    eventName: feedMeta?.eventName || USDT_TRANSACTION_HASH_ABLY_EVENT_NAME,
    authUrl: feedMeta?.authUrl || "/api/realtime/ably-token?public=1&stream=usdt-txhash",
    snapshotUrl: feedMeta?.snapshotUrl || "/api/realtime/scan/usdt-token-transfers",
    ingestUrl: feedMeta?.ingestUrl || "/api/realtime/scan/usdt-token-transfers/ingest",
    thirdwebWebhookUrl: feedMeta?.thirdwebWebhookUrl || "/api/webhook/thirdweb/usdt-token-transfers",
    thirdwebWebhookHeaders:
      Array.isArray(feedMeta?.thirdwebWebhookHeaders) && feedMeta.thirdwebWebhookHeaders.length > 0
        ? feedMeta.thirdwebWebhookHeaders
        : ["x-webhook-id", "x-webhook-signature"],
    thirdwebWebhookTopic: feedMeta?.thirdwebWebhookTopic || "v1.events",
    thirdwebWebhookContractAddress: feedMeta?.thirdwebWebhookContractAddress || "",
    thirdwebWebhookSigHash: feedMeta?.thirdwebWebhookSigHash || "",
    thirdwebWebhookFilterHint:
      feedMeta?.thirdwebWebhookFilterHint
      || "v1.events · USDT Transfer(address,address,uint256) · store-configured server wallets only",
    authHeaders:
      Array.isArray(feedMeta?.authHeaders) && feedMeta.authHeaders.length > 0
        ? feedMeta.authHeaders
        : ["x-api-key", "x-signature", "x-timestamp", "x-nonce"],
  };
}
