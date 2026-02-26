"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Ably from "ably";
import { useQRCode } from "next-qrcode";
import { ConnectButton, useActiveAccount, useActiveWallet } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import { arbitrum, bsc, ethereum, polygon } from "thirdweb/chains";

import {
  BANKTRANSFER_ABLY_CHANNEL,
  BANKTRANSFER_ABLY_EVENT_NAME,
  BUYORDER_STATUS_ABLY_CHANNEL,
  BUYORDER_STATUS_ABLY_EVENT_NAME,
  type BankTransferDashboardEvent,
  type BuyOrderStatusRealtimeEvent,
} from "@lib/ably/constants";
import { getRelativeTimeInfo, type RelativeTimeTone } from "@lib/realtime/timeAgo";
import { client } from "@/app/client";
import { chain as configuredChain } from "@/app/config/contractAddresses";

type BankFeedItem = {
  id: string;
  receivedAt: string;
  data: BankTransferDashboardEvent;
  highlightUntil: number;
};

type BuyFeedItem = {
  id: string;
  receivedAt: string;
  data: BuyOrderStatusRealtimeEvent;
  highlightUntil: number;
};

type WalletTransferRecord = {
  _id?: string;
  sendOrReceive?: string;
  transferData?: {
    transactionHash?: string;
    fromAddress?: string;
    toAddress?: string;
    value?: string | number;
    timestamp?: string | number;
  };
};

const MAX_FEED_ITEMS = 180;
const MAX_SETTLEMENT_FEED_ITEMS = 300;
const API_SYNC_LIMIT = 140;
const SETTLEMENT_BOOTSTRAP_LIMIT = 300;
const RESYNC_INTERVAL_MS = 12_000;
const NOW_TICK_MS = 1_000;
const NEW_EVENT_HIGHLIGHT_MS = 6_000;
const WALLET_TRANSFER_POLL_INTERVAL_MS = 15_000;
const WALLET_TRANSFER_FETCH_LIMIT = 20;
const WALLET_PANEL_HISTORY_LIMIT = 10;

const promotionWallets = [
  inAppWallet({
    auth: {
      options: ["phone"],
      defaultSmsCountryCode: "KR",
    },
  }),
];

const promotionWalletChain =
  configuredChain === "ethereum"
    ? ethereum
    : configuredChain === "polygon"
      ? polygon
      : configuredChain === "bsc"
        ? bsc
        : arbitrum;

function toTimestamp(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return 0;
  }

  if (/^\d{10,13}$/.test(normalized)) {
    const numeric = Number(normalized);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    return normalized.length === 10 ? numeric * 1_000 : numeric;
  }

  const raw = Date.parse(normalized);
  return Number.isNaN(raw) ? 0 : raw;
}

function getEventTimestamp(primary: string | null | undefined, fallback: string): number {
  return toTimestamp(primary) || toTimestamp(fallback);
}

function updateCursorValue(
  target: { current: string | null },
  nextCursor: string | null | undefined,
): void {
  if (!nextCursor) {
    return;
  }
  if (!target.current || nextCursor > target.current) {
    target.current = nextCursor;
  }
}

function formatKrw(value: number): string {
  return Number(value || 0).toLocaleString("ko-KR");
}

function formatUsdt(value: number): string {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatWalletAddressCompact(value: string | null | undefined): string {
  const address = String(value || "").trim();
  if (!address) {
    return "-";
  }
  if (address.length <= 14) {
    return address;
  }
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function normalizeTransferUsdt(value: string | number | null | undefined): number {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  const absolute = Math.abs(parsed);
  if (absolute >= 1e15) {
    return parsed / 1e18;
  }
  if (absolute >= 1e7) {
    return parsed / 1e6;
  }
  return parsed;
}

function formatWalletTransferTime(value: string | number | null | undefined): string {
  const timestamp = toTimestamp(value);
  if (!timestamp) {
    return "-";
  }
  return new Date(timestamp).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function getExplorerTxUrl(txHash: string | null | undefined): string {
  const hash = String(txHash || "").trim();
  if (!hash) {
    return "";
  }
  if (configuredChain === "ethereum") {
    return `https://etherscan.io/tx/${hash}`;
  }
  if (configuredChain === "polygon") {
    return `https://polygonscan.com/tx/${hash}`;
  }
  if (configuredChain === "bsc") {
    return `https://bscscan.com/tx/${hash}`;
  }
  return `https://arbiscan.io/tx/${hash}`;
}

function getExplorerAddressUrl(address: string | null | undefined): string {
  const normalized = String(address || "").trim();
  if (!normalized) {
    return "";
  }
  if (configuredChain === "ethereum") {
    return `https://etherscan.io/address/${normalized}`;
  }
  if (configuredChain === "polygon") {
    return `https://polygonscan.com/address/${normalized}`;
  }
  if (configuredChain === "bsc") {
    return `https://bscscan.com/address/${normalized}`;
  }
  return `https://arbiscan.io/address/${normalized}`;
}

function shortenText(
  value: string | null | undefined,
  headLength = 8,
  tailLength = 6,
): string {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "-";
  }
  if (normalized.length <= headLength + tailLength + 3) {
    return normalized;
  }
  return `${normalized.slice(0, headLength)}...${normalized.slice(-tailLength)}`;
}

function getTransactionTypeLabel(transactionType: string | null | undefined): string {
  if (transactionType === "deposited") {
    return "입금";
  }
  if (transactionType === "withdrawn") {
    return "출금";
  }
  return transactionType || "-";
}

function getTransactionTypeClassName(transactionType: string | null | undefined): string {
  if (transactionType === "deposited") {
    return "border border-emerald-300/60 bg-emerald-400/20 text-emerald-50";
  }
  if (transactionType === "withdrawn") {
    return "border border-rose-300/60 bg-rose-400/20 text-rose-50";
  }
  return "border border-slate-400/60 bg-slate-500/20 text-slate-100";
}

function getBuyStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "ordered":
      return "주문접수";
    case "accepted":
      return "매칭완료";
    case "paymentRequested":
      return "결제요청";
    case "paymentConfirmed":
      return "결제완료";
    case "paymentSettled":
      return "정산완료";
    case "cancelled":
      return "취소";
    default:
      return status || "-";
  }
}

function getBuyStatusClassName(status: string | null | undefined): string {
  switch (status) {
    case "paymentSettled":
      return "border border-emerald-300/60 bg-emerald-400/20 text-emerald-50";
    case "paymentConfirmed":
      return "border border-emerald-300/60 bg-emerald-400/20 text-emerald-50";
    case "paymentRequested":
      return "border border-amber-300/60 bg-amber-400/20 text-amber-50";
    case "accepted":
      return "border border-sky-300/60 bg-sky-400/20 text-sky-50";
    case "cancelled":
      return "border border-rose-300/60 bg-rose-400/20 text-rose-50";
    default:
      return "border border-slate-400/60 bg-slate-500/20 text-slate-100";
  }
}

function isSettlementBuyEvent(event: BuyOrderStatusRealtimeEvent): boolean {
  const source = String(event.source || "").toLowerCase();
  return (
    event.statusTo === "paymentSettled" ||
    event.statusFrom === "paymentSettled" ||
    source.includes("settlement")
  );
}

function getRelativeTimeBadgeClassName(tone: RelativeTimeTone): string {
  switch (tone) {
    case "live":
      return "animate-pulse border-cyan-200/80 bg-cyan-300/25 text-cyan-50 shadow-[0_0_12px_rgba(34,211,238,0.55)]";
    case "fresh":
      return "border-teal-200/75 bg-teal-300/22 text-teal-50";
    case "recent":
      return "border-sky-200/65 bg-sky-300/18 text-sky-50";
    case "normal":
      return "border-slate-400/60 bg-slate-500/18 text-slate-100";
    default:
      return "border-slate-600/70 bg-slate-800/65 text-slate-400";
  }
}

export default function PromotionPage() {
  const params = useParams();
  const lang = typeof params?.lang === "string" ? params.lang : "ko";
  const { Canvas: WalletAddressQrCanvas } = useQRCode();
  const activeAccount = useActiveAccount();
  const activeWallet = useActiveWallet();
  const walletAddress = activeAccount?.address || "";

  const [bankEvents, setBankEvents] = useState<BankFeedItem[]>([]);
  const [buyEvents, setBuyEvents] = useState<BuyFeedItem[]>([]);
  const [settlementEvents, setSettlementEvents] = useState<BuyFeedItem[]>([]);
  const [connectionState, setConnectionState] = useState<Ably.ConnectionState>("initialized");
  const [connectionErrorMessage, setConnectionErrorMessage] = useState<string | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isHeroBursting, setIsHeroBursting] = useState(false);
  const [walletPanelOpen, setWalletPanelOpen] = useState(false);
  const [walletPanelTab, setWalletPanelTab] = useState<"deposit" | "withdraw" | "history">(
    "deposit",
  );
  const [walletTransfers, setWalletTransfers] = useState<WalletTransferRecord[]>([]);
  const [walletTransfersLoading, setWalletTransfersLoading] = useState(false);
  const [walletTransferError, setWalletTransferError] = useState<string | null>(null);
  const [walletAddressCopied, setWalletAddressCopied] = useState(false);

  const heroBurstTimerRef = useRef<number | null>(null);
  const bankCursorRef = useRef<string | null>(null);
  const buyCursorRef = useRef<string | null>(null);
  const walletAddressCopiedTimerRef = useRef<number | null>(null);

  const clientId = useMemo(() => {
    return `promotion-${Math.random().toString(36).slice(2, 10)}`;
  }, []);

  const triggerHeroBurst = useCallback(() => {
    setIsHeroBursting(true);
    if (heroBurstTimerRef.current) {
      window.clearTimeout(heroBurstTimerRef.current);
    }
    heroBurstTimerRef.current = window.setTimeout(() => {
      setIsHeroBursting(false);
      heroBurstTimerRef.current = null;
    }, 1_200);
  }, []);

  const copyWalletAddress = useCallback(async () => {
    if (!walletAddress) {
      return;
    }
    try {
      await navigator.clipboard.writeText(walletAddress);
      setWalletAddressCopied(true);
      if (walletAddressCopiedTimerRef.current) {
        window.clearTimeout(walletAddressCopiedTimerRef.current);
      }
      walletAddressCopiedTimerRef.current = window.setTimeout(() => {
        setWalletAddressCopied(false);
        walletAddressCopiedTimerRef.current = null;
      }, 1_600);
    } catch (error) {
      console.error("failed to copy wallet address", error);
    }
  }, [walletAddress]);

  const disconnectWallet = useCallback(async () => {
    if (!activeWallet?.disconnect) {
      return;
    }
    try {
      await activeWallet.disconnect();
    } catch (error) {
      console.error("failed to disconnect wallet", error);
    }
  }, [activeWallet]);

  const fetchWalletTransfers = useCallback(async () => {
    if (!walletAddress) {
      setWalletTransfers([]);
      setWalletTransferError(null);
      setWalletTransfersLoading(false);
      return;
    }

    setWalletTransfersLoading(true);
    try {
      const response = await fetch("/api/wallet/getTransfersByWalletAddress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          page: 1,
          limit: WALLET_TRANSFER_FETCH_LIMIT,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`wallet transfers fetch failed (${response.status}) ${text}`);
      }

      const data = (await response.json()) as {
        result?: {
          transfers?: WalletTransferRecord[];
        } | null;
      };

      setWalletTransfers(Array.isArray(data.result?.transfers) ? data.result?.transfers : []);
      setWalletTransferError(null);
    } catch (error) {
      setWalletTransferError(error instanceof Error ? error.message : "전송내역 조회에 실패했습니다.");
    } finally {
      setWalletTransfersLoading(false);
    }
  }, [walletAddress]);

  const upsertBankEvents = useCallback(
    (incomingEvents: BankTransferDashboardEvent[], highlightNew: boolean) => {
      if (incomingEvents.length === 0) {
        return;
      }

      const now = Date.now();
      setBankEvents((previousEvents) => {
        const map = new Map(previousEvents.map((item) => [item.id, item]));

        for (const incomingEvent of incomingEvents) {
          const nextId =
            incomingEvent.eventId ||
            incomingEvent.cursor ||
            `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

          const existing = map.get(nextId);
          if (existing) {
            map.set(nextId, {
              ...existing,
              data: incomingEvent,
            });
            continue;
          }

          map.set(nextId, {
            id: nextId,
            receivedAt: new Date().toISOString(),
            data: incomingEvent,
            highlightUntil: highlightNew ? now + NEW_EVENT_HIGHLIGHT_MS : 0,
          });
        }

        const merged = Array.from(map.values());
        merged.sort((left, right) => {
          return (
            getEventTimestamp(right.data.publishedAt, right.receivedAt) -
            getEventTimestamp(left.data.publishedAt, left.receivedAt)
          );
        });

        return merged.slice(0, MAX_FEED_ITEMS);
      });

      for (const incomingEvent of incomingEvents) {
        updateCursorValue(bankCursorRef, incomingEvent.cursor || null);
      }

      if (highlightNew) {
        triggerHeroBurst();
      }
    },
    [triggerHeroBurst],
  );

  const upsertBuyEvents = useCallback(
    (incomingEvents: BuyOrderStatusRealtimeEvent[], highlightNew: boolean) => {
      if (incomingEvents.length === 0) {
        return;
      }

      const now = Date.now();
      setBuyEvents((previousEvents) => {
        const map = new Map(previousEvents.map((item) => [item.id, item]));

        for (const incomingEvent of incomingEvents) {
          const nextId =
            incomingEvent.eventId ||
            incomingEvent.cursor ||
            `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

          const existing = map.get(nextId);
          if (existing) {
            map.set(nextId, {
              ...existing,
              data: incomingEvent,
            });
            continue;
          }

          map.set(nextId, {
            id: nextId,
            receivedAt: new Date().toISOString(),
            data: incomingEvent,
            highlightUntil: highlightNew ? now + NEW_EVENT_HIGHLIGHT_MS : 0,
          });
        }

        const merged = Array.from(map.values());
        merged.sort((left, right) => {
          return (
            getEventTimestamp(right.data.publishedAt, right.receivedAt) -
            getEventTimestamp(left.data.publishedAt, left.receivedAt)
          );
        });

        return merged.slice(0, MAX_FEED_ITEMS);
      });

      for (const incomingEvent of incomingEvents) {
        updateCursorValue(buyCursorRef, incomingEvent.cursor || null);
      }

      if (highlightNew) {
        triggerHeroBurst();
      }
    },
    [triggerHeroBurst],
  );

  const upsertSettlementEvents = useCallback(
    (incomingEvents: BuyOrderStatusRealtimeEvent[], highlightNew: boolean) => {
      if (incomingEvents.length === 0) {
        return;
      }

      const now = Date.now();
      setSettlementEvents((previousEvents) => {
        const map = new Map(previousEvents.map((item) => [item.id, item]));

        for (const incomingEvent of incomingEvents) {
          const nextId =
            incomingEvent.eventId ||
            incomingEvent.cursor ||
            `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

          const existing = map.get(nextId);
          if (existing) {
            map.set(nextId, {
              ...existing,
              data: incomingEvent,
            });
            continue;
          }

          map.set(nextId, {
            id: nextId,
            receivedAt: new Date().toISOString(),
            data: incomingEvent,
            highlightUntil: highlightNew ? now + NEW_EVENT_HIGHLIGHT_MS : 0,
          });
        }

        const merged = Array.from(map.values());
        merged.sort((left, right) => {
          return (
            getEventTimestamp(right.data.publishedAt, right.receivedAt) -
            getEventTimestamp(left.data.publishedAt, left.receivedAt)
          );
        });

        return merged.slice(0, MAX_SETTLEMENT_FEED_ITEMS);
      });

      if (highlightNew) {
        triggerHeroBurst();
      }
    },
    [triggerHeroBurst],
  );

  const syncBankEvents = useCallback(
    async (sinceOverride?: string | null) => {
      const since = sinceOverride ?? bankCursorRef.current;
      const searchParams = new URLSearchParams({
        limit: String(API_SYNC_LIMIT),
        public: "1",
      });
      if (since) {
        searchParams.set("since", since);
      }

      let lastError: string | null = null;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response = await fetch(`/api/realtime/banktransfer/events?${searchParams.toString()}`, {
            method: "GET",
            cache: "no-store",
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`banktransfer sync failed (${response.status}) ${text}`);
          }

          const data = await response.json();
          const incomingEvents = Array.isArray(data.events)
            ? (data.events as BankTransferDashboardEvent[])
            : [];

          upsertBankEvents(incomingEvents, Boolean(since));
          updateCursorValue(
            bankCursorRef,
            typeof data.nextCursor === "string" ? data.nextCursor : null,
          );
          return;
        } catch (error) {
          lastError = error instanceof Error ? error.message : "banktransfer sync failed";
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
          }
        }
      }

      throw new Error(lastError || "banktransfer sync failed");
    },
    [upsertBankEvents],
  );

  const syncBuyEvents = useCallback(
    async (sinceOverride?: string | null) => {
      const since = sinceOverride ?? buyCursorRef.current;
      const searchParams = new URLSearchParams({
        limit: String(API_SYNC_LIMIT),
        public: "1",
      });
      if (since) {
        searchParams.set("since", since);
      }

      let lastError: string | null = null;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response = await fetch(`/api/realtime/buyorder/events?${searchParams.toString()}`, {
            method: "GET",
            cache: "no-store",
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`buyorder sync failed (${response.status}) ${text}`);
          }

          const data = await response.json();
          const incomingEvents = Array.isArray(data.events)
            ? (data.events as BuyOrderStatusRealtimeEvent[])
            : [];

          upsertBuyEvents(incomingEvents, Boolean(since));
          upsertSettlementEvents(
            incomingEvents.filter((event) => isSettlementBuyEvent(event)),
            Boolean(since),
          );

          // Promotion summary should show enough settlement context even when recent buyorder feed is settlement-light.
          if (!since) {
            try {
              const bootstrapResponse = await fetch(
                `/api/realtime/settlement/bootstrap?public=1&limit=${SETTLEMENT_BOOTSTRAP_LIMIT}`,
                {
                  method: "GET",
                  cache: "no-store",
                },
              );

              if (bootstrapResponse.ok) {
                const bootstrapData = await bootstrapResponse.json();
                const bootstrapEvents = Array.isArray(bootstrapData.events)
                  ? (bootstrapData.events as BuyOrderStatusRealtimeEvent[])
                  : [];

                upsertSettlementEvents(bootstrapEvents, false);
              }
            } catch (bootstrapError) {
              console.error("failed to fetch settlement bootstrap events", bootstrapError);
            }
          }

          updateCursorValue(
            buyCursorRef,
            typeof data.nextCursor === "string" ? data.nextCursor : null,
          );
          return;
        } catch (error) {
          lastError = error instanceof Error ? error.message : "buyorder sync failed";
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
          }
        }
      }

      throw new Error(lastError || "buyorder sync failed");
    },
    [upsertBuyEvents, upsertSettlementEvents],
  );

  const syncAllEvents = useCallback(
    async (forceFullSync = false) => {
      setIsSyncing(true);
      try {
        await Promise.all([
          syncBankEvents(forceFullSync ? null : undefined),
          syncBuyEvents(forceFullSync ? null : undefined),
        ]);
        setSyncErrorMessage(null);
      } catch (error) {
        setSyncErrorMessage(error instanceof Error ? error.message : "재동기화에 실패했습니다.");
      } finally {
        setIsSyncing(false);
      }
    },
    [syncBankEvents, syncBuyEvents],
  );

  useEffect(() => {
    const realtime = new Ably.Realtime({
      authUrl: `/api/realtime/ably-token?public=1&clientId=${clientId}`,
    });

    const bankChannel = realtime.channels.get(BANKTRANSFER_ABLY_CHANNEL);
    const buyChannel = realtime.channels.get(BUYORDER_STATUS_ABLY_CHANNEL);

    const onConnectionStateChange = (stateChange: Ably.ConnectionStateChange) => {
      setConnectionState(stateChange.current);
      if (stateChange.reason) {
        setConnectionErrorMessage(stateChange.reason.message || "Ably connection error");
      } else {
        setConnectionErrorMessage(null);
      }

      if (stateChange.current === "connected") {
        void syncAllEvents(false);
      }
    };

    const onBankMessage = (message: Ably.Message) => {
      const data = message.data as BankTransferDashboardEvent;
      upsertBankEvents(
        [
          {
            ...data,
            eventId: data.eventId || String(message.id || ""),
          },
        ],
        true,
      );
    };

    const onBuyMessage = (message: Ably.Message) => {
      const data = message.data as BuyOrderStatusRealtimeEvent;
      const realtimeEvent = {
        ...data,
        eventId: data.eventId || String(message.id || ""),
      };
      upsertBuyEvents([realtimeEvent], true);
      if (isSettlementBuyEvent(realtimeEvent)) {
        upsertSettlementEvents([realtimeEvent], true);
      }
    };

    realtime.connection.on(onConnectionStateChange);
    void bankChannel.subscribe(BANKTRANSFER_ABLY_EVENT_NAME, onBankMessage);
    void buyChannel.subscribe(BUYORDER_STATUS_ABLY_EVENT_NAME, onBuyMessage);

    return () => {
      bankChannel.unsubscribe(BANKTRANSFER_ABLY_EVENT_NAME, onBankMessage);
      buyChannel.unsubscribe(BUYORDER_STATUS_ABLY_EVENT_NAME, onBuyMessage);
      realtime.connection.off(onConnectionStateChange);
      realtime.close();
    };
  }, [clientId, syncAllEvents, upsertBankEvents, upsertBuyEvents, upsertSettlementEvents]);

  useEffect(() => {
    void syncAllEvents(true);

    const timer = window.setInterval(() => {
      void syncAllEvents(false);
    }, RESYNC_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [syncAllEvents]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, NOW_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 640px)");
    setWalletPanelOpen(mediaQuery.matches);

    const onMediaQueryChange = (event: MediaQueryListEvent) => {
      setWalletPanelOpen(event.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onMediaQueryChange);
      return () => {
        mediaQuery.removeEventListener("change", onMediaQueryChange);
      };
    }

    mediaQuery.addListener(onMediaQueryChange);
    return () => {
      mediaQuery.removeListener(onMediaQueryChange);
    };
  }, []);

  useEffect(() => {
    if (!walletAddress) {
      setWalletTransfers([]);
      setWalletTransfersLoading(false);
      setWalletTransferError(null);
      return;
    }

    void fetchWalletTransfers();
    const timer = window.setInterval(() => {
      void fetchWalletTransfers();
    }, WALLET_TRANSFER_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [fetchWalletTransfers, walletAddress]);

  useEffect(() => {
    const now = Date.now();
    const candidates = [...bankEvents, ...buyEvents, ...settlementEvents]
      .map((item) => item.highlightUntil)
      .filter((until) => until > now);

    if (candidates.length === 0) {
      return;
    }

    const nextExpiryAt = Math.min(...candidates);
    const waitMs = Math.max(90, nextExpiryAt - now + 20);
    const timer = window.setTimeout(() => {
      const current = Date.now();
      setBankEvents((previousEvents) =>
        previousEvents.map((item) => {
          if (item.highlightUntil > current || item.highlightUntil === 0) {
            return item;
          }
          return {
            ...item,
            highlightUntil: 0,
          };
        }),
      );
      setBuyEvents((previousEvents) =>
        previousEvents.map((item) => {
          if (item.highlightUntil > current || item.highlightUntil === 0) {
            return item;
          }
          return {
            ...item,
            highlightUntil: 0,
          };
        }),
      );
      setSettlementEvents((previousEvents) =>
        previousEvents.map((item) => {
          if (item.highlightUntil > current || item.highlightUntil === 0) {
            return item;
          }
          return {
            ...item,
            highlightUntil: 0,
          };
        }),
      );
    }, waitMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [bankEvents, buyEvents, settlementEvents]);

  useEffect(() => {
    return () => {
      if (heroBurstTimerRef.current) {
        window.clearTimeout(heroBurstTimerRef.current);
      }
      if (walletAddressCopiedTimerRef.current) {
        window.clearTimeout(walletAddressCopiedTimerRef.current);
      }
    };
  }, []);

  const sortedBankEvents = useMemo(() => {
    return [...bankEvents].sort((left, right) => {
      return (
        getEventTimestamp(right.data.publishedAt, right.receivedAt) -
        getEventTimestamp(left.data.publishedAt, left.receivedAt)
      );
    });
  }, [bankEvents]);

  const sortedBuyEvents = useMemo(() => {
    return [...buyEvents].sort((left, right) => {
      return (
        getEventTimestamp(right.data.publishedAt, right.receivedAt) -
        getEventTimestamp(left.data.publishedAt, left.receivedAt)
      );
    });
  }, [buyEvents]);

  const sortedSettlementEvents = useMemo(() => {
    return [...settlementEvents].sort((left, right) => {
      return (
        getEventTimestamp(right.data.publishedAt, right.receivedAt) -
        getEventTimestamp(left.data.publishedAt, left.receivedAt)
      );
    });
  }, [settlementEvents]);

  const settlementBuyEvents = sortedSettlementEvents;

  const latestBank = sortedBankEvents[0];
  const latestBuy = sortedBuyEvents[0];
  const latestSettlement = settlementBuyEvents[0];
  const latestBuyWalletExplorerUrl = getExplorerAddressUrl(latestBuy?.data.buyerWalletAddress);
  const latestSettlementTimeInfo = latestSettlement
    ? getRelativeTimeInfo(latestSettlement.data.publishedAt || latestSettlement.receivedAt, nowMs)
    : null;
  const isSettlementCtaHot = Boolean(
    latestSettlement && latestSettlement.highlightUntil > nowMs,
  );

  const summary = useMemo(() => {
    let depositedAmount = 0;
    let depositedCount = 0;
    let confirmedCount = 0;
    let pendingCount = 0;
    let totalUsdt = 0;
    let buyFeedSettlementCount = 0;
    let buyFeedSettlementUsdt = 0;
    let settlementCount = 0;
    let settlementUsdt = 0;
    let settlementKrw = 0;

    for (const item of sortedBankEvents) {
      if (item.data.transactionType === "deposited") {
        depositedAmount += Number(item.data.amount || 0);
        depositedCount += 1;
      }
    }

    for (const item of sortedBuyEvents) {
      totalUsdt += Number(item.data.amountUsdt || 0);
      if (item.data.statusTo === "paymentConfirmed") {
        confirmedCount += 1;
      }
      if (
        item.data.statusTo === "ordered" ||
        item.data.statusTo === "accepted" ||
        item.data.statusTo === "paymentRequested"
      ) {
        pendingCount += 1;
      }

      if (isSettlementBuyEvent(item.data)) {
        buyFeedSettlementCount += 1;
        buyFeedSettlementUsdt += Number(item.data.amountUsdt || 0);
      }
    }

    for (const item of sortedSettlementEvents) {
      settlementCount += 1;
      settlementUsdt += Number(item.data.amountUsdt || 0);
      settlementKrw += Number(item.data.amountKrw || 0);
    }

    const settlementCountRatio =
      sortedBuyEvents.length > 0
        ? Math.round((buyFeedSettlementCount / sortedBuyEvents.length) * 1000) / 10
        : 0;
    const settlementUsdtRatio =
      totalUsdt > 0 ? Math.round((buyFeedSettlementUsdt / totalUsdt) * 1000) / 10 : 0;

    return {
      totalEvents: sortedBankEvents.length + sortedBuyEvents.length,
      depositedAmount,
      depositedCount,
      confirmedCount,
      pendingCount,
      totalUsdt,
      settlementCount,
      settlementUsdt,
      settlementKrw,
      settlementCountRatio,
      settlementUsdtRatio,
    };
  }, [sortedBankEvents, sortedBuyEvents, sortedSettlementEvents]);

  const latestTimestamp = useMemo(() => {
    const bankTime = latestBank ? getEventTimestamp(latestBank.data.publishedAt, latestBank.receivedAt) : 0;
    const buyTime = latestBuy ? getEventTimestamp(latestBuy.data.publishedAt, latestBuy.receivedAt) : 0;
    const settlementTime = latestSettlement
      ? getEventTimestamp(latestSettlement.data.publishedAt, latestSettlement.receivedAt)
      : 0;
    return Math.max(bankTime, buyTime, settlementTime);
  }, [latestBank, latestBuy, latestSettlement]);

  const latestTimeInfo = getRelativeTimeInfo(latestTimestamp || null, nowMs);

  const tickerTexts = useMemo(() => {
    const merged = [
      ...sortedBankEvents.slice(0, 8).map((item) => ({
        id: `bank-${item.id}`,
        timestamp: getEventTimestamp(item.data.publishedAt, item.receivedAt),
        text: `[Bank] ${getTransactionTypeLabel(item.data.transactionType)} ${formatKrw(item.data.amount)} KRW ${
          item.data.store?.name || item.data.storecode || "Unknown Store"
        }`,
      })),
      ...sortedBuyEvents.slice(0, 8).map((item) => ({
        id: `buy-${item.id}`,
        timestamp: getEventTimestamp(item.data.publishedAt, item.receivedAt),
        text: `[BuyOrder] ${getBuyStatusLabel(item.data.statusTo)} ${formatUsdt(item.data.amountUsdt)} USDT ${
          item.data.store?.name || "Unknown Store"
        }`,
      })),
      ...settlementBuyEvents.slice(0, 6).map((item) => ({
        id: `settlement-${item.id}`,
        timestamp: getEventTimestamp(item.data.publishedAt, item.receivedAt),
        text: `[Settlement] ${formatUsdt(item.data.amountUsdt)} USDT / ${
          item.data.store?.name || "Unknown Store"
        }`,
      })),
    ].sort((left, right) => right.timestamp - left.timestamp);

    if (merged.length === 0) {
      return ["실시간 이벤트 대기 중입니다. 잠시 후 자동으로 갱신됩니다."];
    }

    const labels = merged.map((item) => item.text);
    return [...labels, ...labels];
  }, [sortedBankEvents, sortedBuyEvents, settlementBuyEvents]);

  const walletHistoryItems = useMemo(() => {
    return walletTransfers.slice(0, WALLET_PANEL_HISTORY_LIMIT);
  }, [walletTransfers]);
  const walletExplorerUrl = useMemo(() => getExplorerAddressUrl(walletAddress), [walletAddress]);

  return (
    <main className="relative w-full min-h-screen overflow-hidden bg-[#030711] text-slate-100">
      <aside
        className={`fixed left-2 top-2 z-[140] w-[min(calc(100vw-1rem),366px)] sm:left-auto sm:right-4 sm:top-4 ${
          walletPanelOpen ? "" : "max-sm:w-[212px]"
        }`}
      >
        <section className="overflow-hidden rounded-2xl border border-cyan-300/35 bg-slate-950/88 shadow-[0_18px_42px_-24px_rgba(34,211,238,0.72)] backdrop-blur-xl">
          <header className="flex items-center justify-between border-b border-slate-700/70 px-3 py-2.5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">My Wallet</p>
              <p className="text-[11px] text-slate-400">고정 지갑 패널</p>
            </div>
            <button
              type="button"
              onClick={() => setWalletPanelOpen((previous) => !previous)}
              className="rounded-lg border border-slate-600/70 bg-slate-900/80 px-2 py-1 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/70 hover:text-cyan-100"
            >
              {walletPanelOpen ? "접기" : "열기"}
            </button>
          </header>

          {walletPanelOpen && (
            <div className="space-y-3 p-3">
              {!walletAddress ? (
                <div className="space-y-2">
                  <ConnectButton
                    client={client}
                    wallets={promotionWallets}
                    showAllWallets={false}
                    chain={promotionWalletChain}
                    theme="dark"
                    locale="ko_KR"
                    connectButton={{
                      label: "지갑연결하기",
                      style: {
                        width: "100%",
                        minHeight: "42px",
                        borderRadius: "12px",
                        border: "1px solid rgba(34,211,238,0.55)",
                        background:
                          "linear-gradient(135deg, rgba(8,145,178,0.34), rgba(6,182,212,0.24))",
                        color: "#ecfeff",
                        fontWeight: 700,
                        fontSize: "14px",
                      },
                    }}
                    connectModal={{
                      size: "wide",
                      titleIcon: "https://www.stable.makeup/logo.png",
                      showThirdwebBranding: false,
                    }}
                    appMetadata={{
                      name: "OneClick Stable",
                      description: "Promotion wallet panel",
                      url: "https://www.stable.makeup",
                      logoUrl: "https://www.stable.makeup/logo.png",
                    }}
                  />
                  <p className="text-xs text-slate-400">
                    로그인하면 입금(주소/QR), 출금, 전송내역을 이 패널에서 바로 확인할 수 있습니다.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Connected Wallet</p>
                    {walletExplorerUrl ? (
                      <>
                        <a
                          href={walletExplorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={walletAddress}
                          className="mt-1 inline-flex w-fit max-w-full font-mono text-sm text-cyan-100 underline decoration-cyan-300/55 underline-offset-2 transition hover:text-cyan-50"
                        >
                          {formatWalletAddressCompact(walletAddress)}
                        </a>
                        <a
                          href={walletExplorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={walletAddress}
                          className="mt-1 block break-all font-mono text-[11px] text-slate-500 transition hover:text-slate-300"
                        >
                          {walletAddress}
                        </a>
                      </>
                    ) : (
                      <>
                        <p className="mt-1 font-mono text-sm text-cyan-100">
                          {formatWalletAddressCompact(walletAddress)}
                        </p>
                        <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{walletAddress}</p>
                      </>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => void copyWalletAddress()}
                        className="rounded-lg border border-cyan-400/50 bg-cyan-500/14 px-2 py-1 text-[11px] font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
                      >
                        주소 복사
                      </button>
                      <button
                        type="button"
                        onClick={() => void disconnectWallet()}
                        className="rounded-lg border border-rose-400/50 bg-rose-500/14 px-2 py-1 text-[11px] font-semibold text-rose-100 transition hover:bg-rose-400/20"
                      >
                        연결해제
                      </button>
                      {walletAddressCopied && (
                        <span className="rounded-lg border border-emerald-400/50 bg-emerald-500/16 px-2 py-1 text-[11px] font-semibold text-emerald-100">
                          복사됨
                        </span>
                      )}
                    </div>
                  </div>

                  <nav className="grid grid-cols-3 gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setWalletPanelTab("deposit")}
                      className={`rounded-lg border px-2 py-1.5 font-semibold transition ${
                        walletPanelTab === "deposit"
                          ? "border-emerald-300/65 bg-emerald-500/20 text-emerald-50"
                          : "border-slate-700/80 bg-slate-900/70 text-slate-300 hover:border-slate-500/80"
                      }`}
                    >
                      입금
                    </button>
                    <button
                      type="button"
                      onClick={() => setWalletPanelTab("withdraw")}
                      className={`rounded-lg border px-2 py-1.5 font-semibold transition ${
                        walletPanelTab === "withdraw"
                          ? "border-amber-300/65 bg-amber-500/20 text-amber-50"
                          : "border-slate-700/80 bg-slate-900/70 text-slate-300 hover:border-slate-500/80"
                      }`}
                    >
                      출금
                    </button>
                    <button
                      type="button"
                      onClick={() => setWalletPanelTab("history")}
                      className={`rounded-lg border px-2 py-1.5 font-semibold transition ${
                        walletPanelTab === "history"
                          ? "border-cyan-300/65 bg-cyan-500/20 text-cyan-50"
                          : "border-slate-700/80 bg-slate-900/70 text-slate-300 hover:border-slate-500/80"
                      }`}
                    >
                      전송내역
                    </button>
                  </nav>

                  {walletPanelTab === "deposit" && (
                    <section className="rounded-xl border border-emerald-400/35 bg-emerald-950/26 p-2.5">
                      <p className="text-[10px] uppercase tracking-[0.1em] text-emerald-200/90">
                        Deposit Address
                      </p>
                      <div className="mt-2 grid gap-2 min-[360px]:grid-cols-[126px_minmax(0,1fr)]">
                        <div className="flex items-center justify-center rounded-lg border border-emerald-300/45 bg-slate-950/75 p-2">
                          <WalletAddressQrCanvas
                            text={walletAddress}
                            options={{
                              errorCorrectionLevel: "M",
                              margin: 1,
                              scale: 4,
                              width: 116,
                              color: {
                                dark: "#d1fae5",
                                light: "#0000",
                              },
                            }}
                          />
                        </div>
                        <div className="rounded-lg border border-emerald-300/35 bg-slate-950/72 p-2">
                          <p className="text-[10px] uppercase tracking-[0.08em] text-emerald-200/90">
                            Wallet Address
                          </p>
                          {walletExplorerUrl ? (
                            <a
                              href={walletExplorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={walletAddress}
                              className="mt-1 block break-all font-mono text-[11px] text-emerald-100 underline decoration-emerald-300/55 underline-offset-2 transition hover:text-emerald-50"
                            >
                              {walletAddress}
                            </a>
                          ) : (
                            <p className="mt-1 break-all font-mono text-[11px] text-emerald-100">
                              {walletAddress}
                            </p>
                          )}
                          <p className="mt-1 text-[11px] text-emerald-200/80">
                            위 주소와 QR 코드로 입금하면 됩니다.
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                  {walletPanelTab === "withdraw" && (
                    <section className="space-y-2 rounded-xl border border-amber-400/35 bg-amber-950/25 p-2.5">
                      <p className="text-[10px] uppercase tracking-[0.1em] text-amber-200/90">
                        Withdraw
                      </p>
                      <p className="text-xs text-amber-100/90">
                        출금은 전용 화면에서 진행합니다. 연결된 지갑 주소 기준으로 진행하세요.
                      </p>
                      <Link
                        href={`/${lang}/promotion/withdraw`}
                        className="inline-flex min-h-[38px] w-full items-center justify-center rounded-lg border border-amber-300/65 bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-50 transition hover:border-amber-200/85 hover:bg-amber-400/28"
                      >
                        출금 화면 열기
                      </Link>
                    </section>
                  )}

                  {walletPanelTab === "history" && (
                    <section className="space-y-2 rounded-xl border border-cyan-400/35 bg-cyan-950/25 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] uppercase tracking-[0.1em] text-cyan-200/90">
                          Transfer History
                        </p>
                        <button
                          type="button"
                          onClick={() => void fetchWalletTransfers()}
                          className="rounded-md border border-cyan-300/55 bg-cyan-500/16 px-1.5 py-1 text-[10px] font-semibold text-cyan-100 transition hover:bg-cyan-400/22"
                        >
                          새로고침
                        </button>
                      </div>

                      {walletTransfersLoading && (
                        <div className="rounded-lg border border-slate-700/80 bg-slate-950/72 px-2 py-2 text-xs text-slate-400">
                          전송내역을 불러오는 중입니다.
                        </div>
                      )}

                      {walletTransferError && (
                        <div className="rounded-lg border border-rose-500/45 bg-rose-950/55 px-2 py-2 text-xs text-rose-200">
                          {walletTransferError}
                        </div>
                      )}

                      {!walletTransfersLoading && !walletTransferError && walletHistoryItems.length === 0 && (
                        <div className="rounded-lg border border-slate-700/80 bg-slate-950/72 px-2 py-2 text-xs text-slate-400">
                          표시할 전송내역이 없습니다.
                        </div>
                      )}

                      {!walletTransfersLoading && !walletTransferError && walletHistoryItems.length > 0 && (
                        <ul className="space-y-1.5">
                          {walletHistoryItems.map((item, index) => {
                            const tx = item.transferData;
                            const txHash = String(tx?.transactionHash || "");
                            const isSend = item.sendOrReceive === "send";
                            const counterparty = isSend ? tx?.toAddress : tx?.fromAddress;
                            const usdtValue = normalizeTransferUsdt(tx?.value);
                            const explorerUrl = getExplorerTxUrl(txHash);
                            const counterpartyUrl = getExplorerAddressUrl(counterparty);

                            return (
                              <li
                                key={item._id || `${txHash}-${index}`}
                                className="rounded-lg border border-slate-700/75 bg-slate-950/72 p-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${
                                      isSend
                                        ? "border-rose-400/55 bg-rose-500/16 text-rose-100"
                                        : "border-emerald-400/55 bg-emerald-500/16 text-emerald-100"
                                    }`}
                                  >
                                    {isSend ? "출금" : "입금"}
                                  </span>
                                  <span className="font-mono text-[10px] text-cyan-100">
                                    {formatUsdt(usdtValue)} USDT
                                  </span>
                                </div>
                                <p className="mt-1 font-mono text-[10px] text-slate-300">
                                  상대:{" "}
                                  {counterpartyUrl ? (
                                    <a
                                      href={counterpartyUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={String(counterparty || "")}
                                      className="underline decoration-cyan-300/45 underline-offset-2 transition hover:text-cyan-100"
                                    >
                                      {formatWalletAddressCompact(counterparty)}
                                    </a>
                                  ) : (
                                    formatWalletAddressCompact(counterparty)
                                  )}
                                </p>
                                <p className="mt-1 font-mono text-[10px] text-slate-500">
                                  {formatWalletTransferTime(tx?.timestamp)}
                                </p>
                                {explorerUrl ? (
                                  <a
                                    href={explorerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={txHash}
                                    className="mt-1 inline-flex font-mono text-[10px] text-cyan-200 underline underline-offset-2"
                                  >
                                    TX: {shortenText(txHash, 10, 8)}
                                  </a>
                                ) : (
                                  <p className="mt-1 font-mono text-[10px] text-slate-500">TX: -</p>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </section>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      </aside>

      <div className="pointer-events-none absolute inset-0">
        <div className="promo-grid absolute inset-0 opacity-35" />
        <div className="promo-orb promo-orb-a" />
        <div className="promo-orb promo-orb-b" />
        <div className="promo-orb promo-orb-c" />
      </div>

      <section className="promo-shell relative mx-auto w-full max-w-[1320px] space-y-3 px-2.5 pb-3 pt-[5.25rem] sm:space-y-4 sm:px-5 sm:pb-5 sm:pt-5 lg:px-8">
        <header
          className={`relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/86 p-3.5 shadow-[0_18px_42px_-28px_rgba(15,23,42,0.9)] backdrop-blur sm:rounded-[24px] sm:p-5 ${isHeroBursting ? "promo-hero-burst" : ""}`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(20,184,166,0.2),rgba(2,6,23,0)_48%),radial-gradient(circle_at_88%_24%,rgba(56,189,248,0.14),rgba(2,6,23,0)_45%)]" />

          <nav className="relative flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="promo-live-dot h-2.5 w-2.5 rounded-full bg-emerald-300" />
              <span className="promo-live-caption text-[10px] uppercase tracking-[0.18em] text-emerald-100/95 sm:text-xs sm:tracking-[0.22em]">
                VASP Operated Realtime Hub
              </span>
              <span className="rounded-full border border-emerald-300/65 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-50 sm:text-[11px]">
                VASP 운영
              </span>
            </div>
            <div className="promo-nav-links grid w-full grid-cols-1 gap-1.5 min-[390px]:grid-cols-3 sm:flex sm:w-auto sm:flex-wrap">
              <Link
                href={`/${lang}/realtime-banktransfer`}
                className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-slate-600/70 bg-slate-900/70 px-2.5 py-1.5 text-center text-[11px] leading-tight text-slate-200 transition hover:border-cyan-300/70 hover:text-cyan-100 sm:text-xs"
              >
                Banktransfer
              </Link>
              <Link
                href={`/${lang}/realtime-buyorder`}
                className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-slate-600/70 bg-slate-900/70 px-2.5 py-1.5 text-center text-[11px] leading-tight text-slate-200 transition hover:border-cyan-300/70 hover:text-cyan-100 sm:text-xs"
              >
                BuyOrder
              </Link>
              <Link
                href={`/${lang}/realtime-settlement`}
                className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-emerald-500/65 bg-emerald-500/20 px-2.5 py-1.5 text-center text-[11px] font-semibold leading-tight text-emerald-50 transition hover:border-emerald-300/80 hover:bg-emerald-400/24 sm:text-xs"
              >
                Settlement
              </Link>
            </div>
          </nav>

          <div className="relative mt-3 grid gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h1 className="promo-hero-title text-[1.55rem] font-semibold leading-tight sm:text-[2.05rem]">
                <span className="promo-title-shine">VASP 운영</span> 기반 USDT 정산 플랫폼
              </h1>
              <p className="promo-hero-copy mt-2 max-w-xl text-[12.5px] leading-relaxed text-slate-300 sm:text-sm">
                입출금, 주문, 정산 상태를 한 화면에서 확인하는 실시간 USDT 운영 홈입니다.
                핵심 지표와 최근 이벤트를 컴팩트하게 제공합니다.
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] sm:text-[11px]">
                <span className="rounded-full border border-emerald-300/50 bg-emerald-500/15 px-2.5 py-1 text-emerald-100">
                  VASP 운영 모니터링
                </span>
                <span className="rounded-full border border-cyan-300/50 bg-cyan-500/15 px-2.5 py-1 text-cyan-100">
                  USDT 온체인 정산 추적
                </span>
              </div>

              <div className="promo-cta-grid mt-4 grid grid-cols-1 gap-1.5 min-[390px]:grid-cols-2 min-[430px]:grid-cols-3 sm:flex sm:flex-wrap sm:gap-2">
                <Link
                  href={`/${lang}/realtime-settlement`}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-emerald-300/80 bg-emerald-500/28 px-3 py-1.5 text-center text-xs font-semibold leading-tight text-emerald-50 transition hover:-translate-y-0.5 hover:bg-emerald-400/34"
                >
                  정산 라이브 보기
                </Link>
                <Link
                  href={`/${lang}/realtime-buyorder`}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-cyan-300/70 bg-cyan-400/20 px-3 py-1.5 text-center text-xs font-semibold leading-tight text-cyan-50 transition hover:-translate-y-0.5 hover:bg-cyan-300/28"
                >
                  BuyOrder 라이브 보기
                </Link>
                <Link
                  href={`/${lang}/realtime-banktransfer`}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-slate-500/70 bg-slate-800/70 px-3 py-1.5 text-center text-xs font-semibold leading-tight text-slate-100 transition hover:-translate-y-0.5 hover:border-slate-300/70"
                >
                  입출금 라이브 보기
                </Link>
              </div>

              <div className="promo-status-grid mt-3 grid gap-1.5 text-[11px] text-slate-300 sm:flex sm:flex-wrap">
                <span className="w-full rounded-lg border border-slate-700/70 bg-slate-900/75 px-2 py-1 sm:w-auto">
                  Connection: <span className="font-semibold text-emerald-200">{connectionState}</span>
                </span>
                <span className="w-full rounded-lg border border-slate-700/70 bg-slate-900/75 px-2 py-1 sm:w-auto">
                  Sync: <span className="font-semibold text-emerald-200">{isSyncing ? "running" : "idle"}</span>
                </span>
                <span className="w-full rounded-lg border border-slate-700/70 bg-slate-900/75 px-2 py-1 sm:w-auto">
                  Last Update:{" "}
                  <span className="font-semibold text-emerald-200">{latestTimeInfo.relativeLabel}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <article className="rounded-xl border border-emerald-300/45 bg-emerald-950/30 p-3 shadow-lg shadow-black/20 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.08em] text-emerald-200">핵심 지표 | Settlement USDT</p>
                <p className="promo-kpi-value mt-1.5 text-[1.7rem] font-bold leading-none text-emerald-50 sm:text-[1.95rem]">
                  {formatUsdt(summary.settlementUsdt)}
                  <span className="ml-1 text-sm font-semibold text-emerald-200">USDT</span>
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="rounded-md border border-emerald-300/40 bg-emerald-500/12 px-2 py-1 text-emerald-100">
                    정산완료 {summary.settlementCount.toLocaleString("ko-KR")}건
                  </span>
                  <span className="text-emerald-200/90">
                    USDT 기준 비중 {formatPercent(summary.settlementUsdtRatio)}
                  </span>
                </div>
              </article>

              <article className="rounded-xl border border-cyan-500/40 bg-cyan-950/28 p-3 shadow-lg shadow-black/20">
                <p className="text-xs uppercase tracking-[0.08em] text-cyan-200">플랫폼 USDT</p>
                <p className="mt-1.5 text-lg font-semibold leading-tight text-cyan-50">
                  {formatUsdt(summary.totalUsdt)} USDT
                </p>
                <p className="mt-1.5 text-[11px] text-cyan-300/80">BuyOrder 누적 유동량</p>
              </article>

              <article className="rounded-xl border border-amber-500/40 bg-amber-950/28 p-3 shadow-lg shadow-black/20">
                <p className="text-xs uppercase tracking-[0.08em] text-amber-200">정산 이벤트 비중</p>
                <p className="promo-kpi-value mt-1.5 text-[1.65rem] font-semibold leading-none text-amber-50">
                  {formatPercent(summary.settlementCountRatio)}
                </p>
                <p className="mt-1.5 text-[11px] text-amber-300/80">BuyOrder 이벤트 대비</p>
              </article>
            </div>
          </div>
        </header>

        {connectionErrorMessage && (
          <div className="rounded-xl border border-rose-500/45 bg-rose-950/55 px-3 py-2 text-sm text-rose-200">
            {connectionErrorMessage}
          </div>
        )}

        {syncErrorMessage && (
          <div className="rounded-xl border border-rose-500/45 bg-rose-950/55 px-3 py-2 text-sm text-rose-200">
            {syncErrorMessage}
          </div>
        )}

        <section className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/70 p-3.5 shadow-lg shadow-black/20 sm:p-4">
          <span className="mb-2 inline-flex rounded-full border border-emerald-200/55 bg-emerald-400/14 px-2 py-0.5 text-[10px] font-semibold tracking-[0.1em] text-emerald-100 sm:absolute sm:right-4 sm:top-4 sm:mb-0">
            SETTLEMENT
          </span>
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-emerald-200/85">Settlement Spotlight</p>
              <h2 className="promo-spotlight-title mt-1 text-base font-semibold text-emerald-50 sm:text-lg">
                정산 상태를 우선 노출하는 실시간 공시 카드
              </h2>
              <p className="mt-1.5 max-w-3xl text-[12.5px] leading-relaxed text-emerald-100/78 sm:text-[13px]">
                최근 정산 건수, 금액, 처리 시점을 핵심만 요약해 제공합니다.
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded-lg border border-emerald-300/35 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100">
                  정산 이벤트 {summary.settlementCount.toLocaleString("ko-KR")}건
                </span>
                <span className="rounded-lg border border-emerald-300/35 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100">
                  {formatUsdt(summary.settlementUsdt)} USDT
                </span>
                <span className="rounded-lg border border-emerald-300/35 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100">
                  {formatKrw(summary.settlementKrw)} KRW
                </span>
                <span className="rounded-lg border border-emerald-300/35 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100">
                  정산 비중 {formatPercent(summary.settlementCountRatio)}
                </span>
              </div>
            </div>

            <div
              className={`promo-settlement-cta rounded-xl border p-3 sm:rounded-xl ${
                isSettlementCtaHot || isHeroBursting ? "promo-settlement-cta-burst" : ""
              }`}
            >
              <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.1em] text-emerald-100">
                    <span className="promo-live-dot h-2 w-2 rounded-full bg-emerald-300" />
                    Realtime Settlement Log
                  </p>
                  <h3 className="promo-settlement-title mt-1 text-sm font-semibold leading-tight text-emerald-50">
                    최신 정산 이벤트 즉시 확인
                  </h3>
                  <p className="mt-1 text-[11px] text-emerald-200/90">
                    {latestSettlementTimeInfo
                      ? `최근 정산 이벤트 ${latestSettlementTimeInfo.relativeLabel}`
                      : "최근 정산 이벤트 대기 중"}
                  </p>
                </div>

                <span className="promo-settlement-ping self-start rounded-full border border-emerald-200/75 bg-emerald-400/24 px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] text-emerald-50 sm:self-auto">
                  LIVE
                </span>
              </div>

              <div className="mt-2.5 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
                <div className="rounded-lg border border-emerald-400/35 bg-emerald-500/12 px-2 py-1.5 text-emerald-100">
                  <p className="text-[10px] uppercase tracking-[0.09em] text-emerald-200/90">Settlement Count</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {summary.settlementCount.toLocaleString("ko-KR")}건
                  </p>
                </div>
                <div className="rounded-lg border border-cyan-400/35 bg-cyan-500/12 px-2 py-1.5 text-cyan-100">
                  <p className="text-[10px] uppercase tracking-[0.09em] text-cyan-200/90">Settlement USDT</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {formatUsdt(summary.settlementUsdt)}{" "}
                    <span className="text-[11px] font-bold tracking-[0.08em]">USDT</span>
                  </p>
                </div>
              </div>

              <Link
                href={`/${lang}/realtime-settlement`}
                className="promo-settlement-btn mt-2.5 inline-flex min-h-[40px] w-full items-center justify-between gap-2 rounded-lg border border-emerald-200/65 bg-emerald-400/22 px-3 py-1.5 text-xs font-semibold leading-tight text-emerald-50 transition hover:-translate-y-0.5 hover:bg-emerald-300/30"
              >
                <span>정산 대시보드 바로가기</span>
                <span aria-hidden className="text-base leading-none">
                  →
                </span>
              </Link>

              <ul className="mt-2.5 space-y-1.5 sm:space-y-2">
                {settlementBuyEvents.slice(0, 3).map((item) => {
                  const isHighlighted = item.highlightUntil > nowMs;
                  const timeInfo = getRelativeTimeInfo(item.data.publishedAt || item.receivedAt, nowMs);

                  return (
                    <li
                      key={`spot-${item.id}`}
                      className={`rounded-lg border px-2 py-1.5 transition-all duration-500 ${
                        isHighlighted
                          ? "promo-event-flash border-emerald-300/62 bg-emerald-400/14 shadow-[0_10px_18px_-14px_rgba(16,185,129,0.9)]"
                          : "border-emerald-500/24 bg-slate-950/56"
                      }`}
                    >
                      <div className="promo-event-row flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="promo-event-store truncate text-xs text-emerald-50">
                          {item.data.store?.name || "Unknown Store"}
                        </span>
                        <span className="promo-time-badge font-mono text-[11px] text-emerald-200">
                          {timeInfo.relativeLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-base font-semibold text-emerald-100">
                        {formatUsdt(item.data.amountUsdt)}
                        <span className="ml-1 text-xs font-bold tracking-[0.08em] text-emerald-200">USDT</span>
                      </p>
                    </li>
                  );
                })}

                {settlementBuyEvents.length === 0 && (
                  <li className="rounded-lg border border-slate-700/70 bg-slate-900/70 px-2.5 py-3 text-xs text-slate-400">
                    수신된 정산 이벤트가 없습니다.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>

        <section className="grid gap-2.5 sm:gap-3 xl:grid-cols-2">
          <article className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/72 p-3 shadow-lg shadow-black/20 sm:p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-emerald-300">Banktransfer Live</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-100">입출금 실시간 하이라이트</h2>
              </div>
              <span className="rounded-full border border-emerald-300/60 bg-emerald-400/20 px-2 py-1 text-[10px] font-semibold text-emerald-50 sm:text-xs">
                LIVE
              </span>
            </div>

            {latestBank ? (
              <div className="mt-3 rounded-xl border border-slate-600/80 bg-slate-950/70 p-2.5">
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 w-full items-center gap-2 sm:w-auto">
                    {latestBank.data.store?.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={latestBank.data.store.logo}
                        alt={latestBank.data.store.name || "store"}
                        className="h-10 w-10 shrink-0 rounded-md border border-slate-700 object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-md border border-slate-700 bg-slate-800" />
                    )}
                    <div className="min-w-0">
                      <p className="promo-event-store truncate text-sm font-medium text-slate-100">
                        {latestBank.data.store?.name || latestBank.data.storecode || "Unknown Store"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {getTransactionTypeLabel(latestBank.data.transactionType)} /{" "}
                        {formatKrw(latestBank.data.amount)} KRW
                      </p>
                    </div>
                  </div>
                  <span
                    className={`promo-time-badge self-start rounded-md border px-2 py-1 font-mono text-[11px] sm:self-auto sm:shrink-0 ${getRelativeTimeBadgeClassName(
                      getRelativeTimeInfo(
                        latestBank.data.publishedAt || latestBank.receivedAt,
                        nowMs,
                      ).tone,
                    )}`}
                  >
                    {
                      getRelativeTimeInfo(
                        latestBank.data.publishedAt || latestBank.receivedAt,
                        nowMs,
                      ).relativeLabel
                    }
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-950/70 p-3 text-sm text-slate-400">
                아직 수신된 입출금 이벤트가 없습니다.
              </div>
            )}

            <ul className="mt-2.5 space-y-1.5">
              {sortedBankEvents.slice(0, 6).map((item) => {
                const isHighlighted = item.highlightUntil > Date.now();
                const timeInfo = getRelativeTimeInfo(item.data.publishedAt || item.receivedAt, nowMs);

                return (
                  <li
                    key={item.id}
                    className={`rounded-xl border px-3 py-2 transition-all duration-500 ${
                      isHighlighted
                        ? "promo-event-flash border-cyan-300/60 bg-cyan-400/12"
                        : "border-slate-700/80 bg-slate-950/60"
                    }`}
                  >
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getTransactionTypeClassName(
                              item.data.transactionType,
                            )}`}
                          >
                            {getTransactionTypeLabel(item.data.transactionType)}
                          </span>
                          <span className="promo-event-store truncate text-xs text-slate-300">
                            {item.data.store?.name || item.data.storecode || "-"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold tabular-nums text-slate-100">
                          {formatKrw(item.data.amount)} KRW
                        </p>
                      </div>
                      <span
                        className={`promo-time-badge self-start rounded-md border px-1.5 py-1 font-mono text-[10px] sm:self-auto sm:shrink-0 ${getRelativeTimeBadgeClassName(
                          timeInfo.tone,
                        )}`}
                      >
                        {timeInfo.relativeLabel}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </article>

          <article className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/72 p-3 shadow-lg shadow-black/20 sm:p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-cyan-200">BuyOrder USDT Live</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-100">USDT 주문 상태 하이라이트</h2>
              </div>
              <span className="rounded-full border border-cyan-300/60 bg-cyan-400/20 px-2 py-1 text-[10px] font-semibold text-cyan-50 sm:text-xs">
                LIVE
              </span>
            </div>

            {latestBuy ? (
              <div className="mt-3 rounded-xl border border-slate-600/80 bg-slate-950/70 p-2.5">
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getBuyStatusClassName(
                          latestBuy.data.statusTo,
                        )}`}
                      >
                        {getBuyStatusLabel(latestBuy.data.statusTo)}
                      </span>
                      <span className="promo-event-store truncate text-xs text-slate-300">
                        {latestBuy.data.store?.name || "-"}
                      </span>
                    </div>
                    <p className="mt-1 text-base font-semibold tabular-nums text-cyan-100">
                      {formatUsdt(latestBuy.data.amountUsdt)} USDT
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-slate-400">
                      Buyer:{" "}
                      {latestBuyWalletExplorerUrl ? (
                        <a
                          href={latestBuyWalletExplorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={String(latestBuy.data.buyerWalletAddress || "")}
                          className="underline decoration-cyan-300/45 underline-offset-2 transition hover:text-cyan-100"
                        >
                          {shortenText(latestBuy.data.buyerWalletAddress, 8, 6)}
                        </a>
                      ) : (
                        shortenText(latestBuy.data.buyerWalletAddress, 8, 6)
                      )}
                    </p>
                  </div>
                  <span
                    className={`promo-time-badge self-start rounded-md border px-2 py-1 font-mono text-[11px] sm:self-auto sm:shrink-0 ${getRelativeTimeBadgeClassName(
                      getRelativeTimeInfo(latestBuy.data.publishedAt || latestBuy.receivedAt, nowMs)
                        .tone,
                    )}`}
                  >
                    {getRelativeTimeInfo(latestBuy.data.publishedAt || latestBuy.receivedAt, nowMs).relativeLabel}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-950/70 p-3 text-sm text-slate-400">
                아직 수신된 BuyOrder 이벤트가 없습니다.
              </div>
            )}

            <ul className="mt-2.5 space-y-1.5">
              {sortedBuyEvents.slice(0, 6).map((item) => {
                const isHighlighted = item.highlightUntil > Date.now();
                const timeInfo = getRelativeTimeInfo(item.data.publishedAt || item.receivedAt, nowMs);
                const buyerWalletExplorerUrl = getExplorerAddressUrl(item.data.buyerWalletAddress);

                return (
                  <li
                    key={item.id}
                    className={`rounded-xl border px-3 py-2 transition-all duration-500 ${
                      isHighlighted
                        ? "promo-event-flash border-cyan-300/60 bg-cyan-400/12"
                        : "border-slate-700/80 bg-slate-950/60"
                    }`}
                  >
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getBuyStatusClassName(
                              item.data.statusTo,
                            )}`}
                          >
                            {getBuyStatusLabel(item.data.statusTo)}
                          </span>
                          <span className="promo-event-store truncate text-xs text-slate-300">
                            {item.data.store?.name || "-"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold tabular-nums text-cyan-100">
                          {formatUsdt(item.data.amountUsdt)} USDT
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-slate-400">
                          Wallet:{" "}
                          {buyerWalletExplorerUrl ? (
                            <a
                              href={buyerWalletExplorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={String(item.data.buyerWalletAddress || "")}
                              className="underline decoration-cyan-300/45 underline-offset-2 transition hover:text-cyan-100"
                            >
                              {shortenText(item.data.buyerWalletAddress, 8, 6)}
                            </a>
                          ) : (
                            shortenText(item.data.buyerWalletAddress, 8, 6)
                          )}
                        </p>
                      </div>
                      <span
                        className={`promo-time-badge self-start rounded-md border px-1.5 py-1 font-mono text-[10px] sm:self-auto sm:shrink-0 ${getRelativeTimeBadgeClassName(
                          timeInfo.tone,
                        )}`}
                      >
                        {timeInfo.relativeLabel}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/72 shadow-lg shadow-black/20">
          <div className="border-b border-slate-700/80 px-3 py-2.5 sm:px-4">
            <p className="font-semibold text-slate-100">실시간 이벤트 티커</p>
            <p className="text-[11px] text-slate-400">입출금/주문/정산 이벤트를 순환 표시합니다.</p>
          </div>
          <div className="overflow-hidden px-3 py-2.5">
            <div className="promo-marquee-track">
              {tickerTexts.map((text, index) => (
                <span
                  key={`ticker-${index}-${text}`}
                  className="inline-flex max-w-[78vw] shrink-0 items-center truncate rounded-full border border-cyan-300/30 bg-cyan-400/8 px-2.5 py-0.5 text-[11px] text-cyan-100 sm:max-w-none"
                >
                  {text}
                </span>
              ))}
            </div>
          </div>
        </section>
      </section>

      <style jsx>{`
        .promo-grid {
          background-image: linear-gradient(
              to right,
              rgba(148, 163, 184, 0.08) 1px,
              transparent 1px
            ),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.07) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: radial-gradient(circle at 50% 40%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0) 78%);
          animation: promoGridMove 30s linear infinite;
        }

        .promo-orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(24px);
          opacity: 0.34;
        }

        .promo-orb-a {
          left: -100px;
          top: -50px;
          height: 300px;
          width: 300px;
          background: rgba(34, 211, 238, 0.22);
          animation: promoFloatA 16s ease-in-out infinite;
        }

        .promo-orb-b {
          right: -60px;
          top: 120px;
          height: 250px;
          width: 250px;
          background: rgba(52, 211, 153, 0.2);
          animation: promoFloatB 18s ease-in-out infinite;
        }

        .promo-orb-c {
          left: 35%;
          bottom: -120px;
          height: 300px;
          width: 300px;
          background: rgba(56, 189, 248, 0.16);
          animation: promoFloatC 24s ease-in-out infinite;
        }

        .promo-live-dot {
          animation: promoLivePulse 1.6s ease-out infinite;
          box-shadow: 0 0 0 rgba(34, 211, 238, 0.7);
        }

        .promo-title-shine {
          color: transparent;
          background: linear-gradient(92deg, #67e8f9 12%, #f0f9ff 45%, #6ee7b7 75%, #67e8f9 98%);
          background-size: 220% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          animation: promoTitleShine 4s linear infinite;
        }

        .promo-hero-burst {
          animation: promoHeroBurst 1.1s ease;
        }

        .promo-event-flash {
          animation: promoEventFlash 1.2s ease;
        }

        .promo-settlement-cta {
          position: relative;
          overflow: hidden;
          border-color: rgba(110, 231, 183, 0.32);
          background: linear-gradient(
            145deg,
            rgba(5, 46, 36, 0.72) 0%,
            rgba(3, 15, 28, 0.82) 56%,
            rgba(6, 78, 59, 0.74) 100%
          );
          box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.14),
            0 14px 26px -20px rgba(16, 185, 129, 0.5);
        }

        .promo-settlement-cta::before {
          content: "";
          position: absolute;
          inset: -130% -36%;
          background: linear-gradient(
            110deg,
            transparent 36%,
            rgba(110, 231, 183, 0.12) 50%,
            rgba(103, 232, 249, 0.18) 58%,
            transparent 71%
          );
          transform: rotate(10deg);
          animation: promoSettlementSweep 7.5s linear infinite;
          pointer-events: none;
        }

        .promo-settlement-cta::after {
          content: "";
          position: absolute;
          inset: -20%;
          background: radial-gradient(
            circle at 75% 18%,
            rgba(16, 185, 129, 0.16) 0%,
            rgba(2, 6, 23, 0) 58%
          );
          animation: promoSettlementAura 4.5s ease-in-out infinite;
          pointer-events: none;
        }

        .promo-settlement-cta > * {
          position: relative;
          z-index: 1;
        }

        .promo-settlement-cta-burst {
          animation: promoSettlementBurst 1.15s ease;
        }

        .promo-settlement-ping {
          animation: promoSettlementPing 1.15s ease-out infinite;
          box-shadow: 0 0 0 0 rgba(110, 231, 183, 0.55);
        }

        .promo-settlement-btn {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          animation: promoSettlementBtnLift 3.2s ease-in-out infinite;
        }

        .promo-settlement-btn::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: -38%;
          width: 34%;
          background: linear-gradient(
            110deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.22) 48%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-18deg);
          animation: promoSettlementBtnShine 4.4s linear infinite;
          z-index: 0;
        }

        .promo-settlement-btn > span {
          position: relative;
          z-index: 1;
        }

        .promo-marquee-track {
          display: flex;
          width: max-content;
          gap: 0.6rem;
          animation: promoMarquee 42s linear infinite;
        }

        @keyframes promoGridMove {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-42px, -42px, 0);
          }
        }

        @keyframes promoFloatA {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(50px, 26px, 0);
          }
        }

        @keyframes promoFloatB {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(-42px, -18px, 0);
          }
        }

        @keyframes promoFloatC {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(26px, -30px, 0);
          }
        }

        @keyframes promoLivePulse {
          0% {
            box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.72);
          }
          100% {
            box-shadow: 0 0 0 11px rgba(34, 211, 238, 0);
          }
        }

        @keyframes promoTitleShine {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -20% 0;
          }
        }

        @keyframes promoHeroBurst {
          0% {
            box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.2);
          }
          35% {
            box-shadow: 0 0 0 7px rgba(45, 212, 191, 0.2);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(45, 212, 191, 0);
          }
        }

        @keyframes promoEventFlash {
          0% {
            transform: translateY(6px) scale(0.985);
            opacity: 0.7;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes promoSettlementSweep {
          0% {
            transform: translate3d(-42%, -18%, 0) rotate(10deg);
          }
          100% {
            transform: translate3d(38%, 22%, 0) rotate(10deg);
          }
        }

        @keyframes promoSettlementAura {
          0%,
          100% {
            opacity: 0.56;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.04);
          }
        }

        @keyframes promoSettlementBurst {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.2);
          }
          32% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.2);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }

        @keyframes promoSettlementPing {
          0% {
            box-shadow: 0 0 0 0 rgba(110, 231, 183, 0.66);
          }
          100% {
            box-shadow: 0 0 0 10px rgba(110, 231, 183, 0);
          }
        }

        @keyframes promoSettlementBtnLift {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-1px);
          }
        }

        @keyframes promoSettlementBtnShine {
          0% {
            left: -42%;
          }
          100% {
            left: 132%;
          }
        }

        @keyframes promoMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @media (max-width: 430px) {
          .promo-shell {
            padding-left: 0.7rem;
            padding-right: 0.7rem;
          }

          .promo-live-caption {
            letter-spacing: 0.12em;
          }

          .promo-hero-title {
            font-size: 1.42rem;
            line-height: 1.26;
          }

          .promo-hero-copy {
            font-size: 12.3px;
          }

          .promo-nav-links > a,
          .promo-cta-grid > a {
            padding-left: 0.8rem;
            padding-right: 0.8rem;
          }

          .promo-cta-grid > a,
          .promo-settlement-btn {
            font-size: 0.76rem;
          }

          .promo-status-grid > span {
            font-size: 0.66rem;
          }

          .promo-spotlight-title {
            line-height: 1.34;
          }

          .promo-settlement-title {
            font-size: 0.9rem;
          }

          .promo-kpi-value {
            font-size: 1.45rem;
          }

          .promo-event-store {
            max-width: 100%;
            word-break: break-word;
          }

          .promo-time-badge {
            white-space: nowrap;
          }
        }

        @media (max-width: 390px) {
          .promo-shell {
            padding-left: 0.625rem;
            padding-right: 0.625rem;
          }

          .promo-hero-title {
            font-size: 1.32rem;
          }

          .promo-hero-copy {
            font-size: 11.9px;
          }

          .promo-nav-links {
            gap: 0.42rem;
          }

          .promo-nav-links > a {
            min-height: 36px;
            font-size: 0.66rem;
          }

          .promo-cta-grid > a {
            min-height: 38px;
            font-size: 0.74rem;
          }

          .promo-settlement-btn {
            min-height: 38px;
            font-size: 0.74rem;
          }

          .promo-kpi-value {
            font-size: 1.34rem;
          }

          .promo-marquee-track > span {
            max-width: 76vw;
          }
        }

        @media (max-width: 360px) {
          .promo-shell {
            padding-left: 0.56rem;
            padding-right: 0.56rem;
          }

          .promo-live-caption {
            display: none;
          }

          .promo-hero-title {
            font-size: 1.22rem;
          }

          .promo-hero-copy {
            font-size: 11.5px;
          }

          .promo-status-grid > span {
            font-size: 0.63rem;
          }

          .promo-settlement-title {
            font-size: 0.82rem;
          }

          .promo-settlement-btn span[aria-hidden] {
            display: none;
          }

          .promo-kpi-value {
            font-size: 1.26rem;
          }

          .promo-time-badge {
            font-size: 8.5px;
          }

          .promo-marquee-track > span {
            max-width: 70vw;
          }
        }

        @media (max-width: 320px) {
          .promo-shell {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }

          .promo-hero-title {
            font-size: 1.1rem;
          }

          .promo-hero-copy {
            font-size: 11px;
          }

          .promo-nav-links > a {
            font-size: 0.6rem;
            padding-left: 0.56rem;
            padding-right: 0.56rem;
          }

          .promo-cta-grid > a {
            font-size: 0.68rem;
            padding-left: 0.56rem;
            padding-right: 0.56rem;
          }

          .promo-settlement-btn {
            font-size: 0.68rem;
          }

          .promo-status-grid > span {
            font-size: 0.58rem;
          }

          .promo-kpi-value {
            font-size: 1.15rem;
          }

          .promo-marquee-track > span {
            max-width: 66vw;
            font-size: 9.5px;
          }
        }

        @media (max-width: 640px) {
          .promo-grid {
            background-size: 28px 28px;
          }

          .promo-orb {
            filter: blur(14px);
            opacity: 0.3;
          }

          .promo-orb-a {
            left: -90px;
            top: -70px;
            height: 220px;
            width: 220px;
          }

          .promo-orb-b {
            right: -70px;
            top: 190px;
            height: 200px;
            width: 200px;
          }

          .promo-orb-c {
            left: 20%;
            bottom: -95px;
            height: 220px;
            width: 220px;
          }

          .promo-marquee-track {
            gap: 0.45rem;
            animation-duration: 48s;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .promo-grid,
          .promo-orb,
          .promo-live-dot,
          .promo-title-shine,
          .promo-hero-burst,
          .promo-event-flash,
          .promo-settlement-cta,
          .promo-settlement-cta-burst,
          .promo-settlement-ping,
          .promo-settlement-btn,
          .promo-marquee-track {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}
