"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Ably from "ably";
import { createPortal } from "react-dom";

import RealtimeTopNav from "@components/realtime/RealtimeTopNav";
import {
  BUYORDER_STATUS_ABLY_CHANNEL,
  BUYORDER_STATUS_ABLY_EVENT_NAME,
  type BuyOrderStatusRealtimeEvent,
} from "@lib/ably/constants";
import { getRelativeTimeInfo, type RelativeTimeTone } from "@lib/realtime/timeAgo";

type RealtimeItem = {
  id: string;
  receivedAt: string;
  data: BuyOrderStatusRealtimeEvent;
  highlightUntil: number;
};

type JackpotBurst = {
  id: string;
  amountUsdt: number;
  storeLabel: string;
};

type TodaySummary = {
  dateKst: string;
  confirmedCount: number;
  confirmedAmountKrw: number;
  confirmedAmountUsdt: number;
  pgFeeAmountKrw: number;
  pgFeeAmountUsdt: number;
  updatedAt: string;
};

type PendingBuyOrderItem = {
  orderId: string;
  tradeId: string | null;
  status: "ordered" | "accepted" | "paymentRequested";
  createdAt: string | null;
  amountKrw: number;
  amountUsdt: number;
  buyerName: string | null;
  buyerAccountNumber: string | null;
  storeLogo: string | null;
  storeName: string | null;
  storeCode: string | null;
};

type BuyOrderListStatusFilter =
  | "all"
  | "ordered"
  | "accepted"
  | "paymentRequested"
  | "paymentConfirmed"
  | "cancelled"
  | "paymentSettled";

type BuyOrderListItem = {
  orderId: string;
  tradeId: string | null;
  status: Exclude<BuyOrderListStatusFilter, "all">;
  createdAt: string | null;
  amountKrw: number;
  amountUsdt: number;
  buyerName: string | null;
  buyerAccountNumber: string | null;
  storeLogo: string | null;
  storeName: string | null;
  storeCode: string | null;
};

type BuyOrderStoreOption = {
  storeCode: string;
  storeName: string;
  storeLogo: string | null;
};

type SellerWalletBalanceItem = {
  walletAddress: string;
  orderCount: number;
  totalAmountUsdt: number;
  latestOrderCreatedAt: string | null;
  currentUsdtBalance: number;
};

type RealtimeManualAdminSession = {
  enabled: boolean;
  authenticated: boolean;
  expiresAt: string | null;
};

type RealtimeManualConfirmOrder = {
  orderId: string;
  tradeId: string | null;
  status: string | null;
  paymentMethod: string | null;
  storeCode: string | null;
  storeName: string | null;
  storeLogo: string | null;
  buyerName: string | null;
  buyerAccountNumber: string | null;
  krwAmount: number;
  usdtAmount: number;
  createdAt: string | null;
  paymentRequestedAt: string | null;
  sellerBankName: string | null;
  sellerAccountNumber: string | null;
  sellerAccountHolder: string | null;
};

type RealtimeManualConfirmDeposit = {
  id: string;
  transactionName: string | null;
  amount: number;
  bankAccountNumber: string | null;
  balance: number;
  transactionDate: string | null;
  memo: string | null;
  isAmountMatch: boolean;
  isNameMatch: boolean;
};

type RealtimeManualConfirmPayload = {
  order: RealtimeManualConfirmOrder;
  deposits: RealtimeManualConfirmDeposit[];
  recommendedFromDate: string | null;
  recommendedToDate: string | null;
};

type ActionDockNoticeTone = "info" | "success" | "error";

type ActionDockNotice = {
  tone: ActionDockNoticeTone;
  message: string;
};

const MAX_EVENTS = 150;
const RESYNC_LIMIT = 120;
const RESYNC_INTERVAL_MS = 12_000;
const TODAY_SUMMARY_REFRESH_MS = 10_000;
const PENDING_BUYORDER_REFRESH_MS = 10_000;
const PENDING_BUYORDER_FETCH_LIMIT = 30;
const BUYORDER_LIST_REFRESH_MS = 12_000;
const BUYORDER_LIST_PAGE_LIMIT = 12;
const BUYORDER_STORE_OPTIONS_REFRESH_MS = 60_000;
const SELLER_WALLET_BALANCE_REFRESH_MS = 12_000;
const SELLER_WALLET_BALANCE_LIMIT = 12;
const NEW_EVENT_HIGHLIGHT_MS = 3_600;
const TIME_AGO_TICK_MS = 5_000;
const COUNTDOWN_TICK_MS = 1_000;
const COUNT_UP_MIN_MS = 640;
const COUNT_UP_MAX_MS = 1_480;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const JACKPOT_BURST_DURATION_MS = 3_300;
const JACKPOT_MAX_ACTIVE_BURSTS = 3;
const JACKPOT_TRIGGERED_EVENT_CACHE_LIMIT = 700;
const PARTY_CONFETTI_COUNT = 72;
const PARTY_STREAMER_COUNT = 16;
const PARTY_FIREWORK_COUNT = 6;
const PARTY_FIREWORK_RAY_COUNT = 12;
const PENDING_BUYORDER_STATUS_SET = new Set(["ordered", "accepted", "paymentRequested"]);
const BUYORDER_LIST_STATUS_SET = new Set([
  "ordered",
  "accepted",
  "paymentRequested",
  "paymentConfirmed",
  "cancelled",
  "paymentSettled",
]);
const BUYORDER_LIST_STATUS_OPTIONS: Array<{ value: BuyOrderListStatusFilter; label: string }> = [
  { value: "all", label: "전체 상태" },
  { value: "ordered", label: "주문접수" },
  { value: "accepted", label: "매칭완료" },
  { value: "paymentRequested", label: "결제요청" },
  { value: "paymentConfirmed", label: "결제완료" },
  { value: "cancelled", label: "취소" },
  { value: "paymentSettled", label: "정산완료" },
];

function isPaymentConfirmedStatus(status: string | null | undefined): boolean {
  return status === "paymentConfirmed";
}

function isPendingBuyOrderStatus(status: string | null | undefined): status is PendingBuyOrderItem["status"] {
  return PENDING_BUYORDER_STATUS_SET.has(String(status || ""));
}

function isBuyOrderListStatus(value: string | null | undefined): value is BuyOrderListItem["status"] {
  return BUYORDER_LIST_STATUS_SET.has(String(value || ""));
}

function toTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "ordered":
      return "주문접수";
    case "accepted":
      return "매칭완료";
    case "paymentRequested":
      return "결제요청";
    case "paymentConfirmed":
      return "결제완료";
    case "cancelled":
      return "취소";
    case "paymentSettled":
      return "정산완료";
    default:
      return String(status || "-");
  }
}

function getStatusClassName(status: string | null | undefined): string {
  switch (status) {
    case "paymentConfirmed":
      return "border border-emerald-400/35 bg-emerald-500/15 text-emerald-200";
    case "paymentRequested":
      return "border border-amber-400/35 bg-amber-500/15 text-amber-200";
    case "accepted":
      return "border border-sky-400/35 bg-sky-500/15 text-sky-200";
    case "cancelled":
      return "border border-rose-400/35 bg-rose-500/15 text-rose-200";
    case "ordered":
      return "border border-slate-500/40 bg-slate-700/45 text-slate-100";
    default:
      return "border border-zinc-500/35 bg-zinc-700/45 text-zinc-200";
  }
}

function getStatusClassNameOnLight(status: string | null | undefined): string {
  switch (status) {
    case "paymentConfirmed":
      return "border border-emerald-400 bg-emerald-200 text-emerald-900";
    case "paymentRequested":
      return "border border-amber-400 bg-amber-200 text-amber-900";
    case "accepted":
      return "border border-sky-400 bg-sky-200 text-sky-900";
    case "cancelled":
      return "border border-rose-400 bg-rose-200 text-rose-900";
    case "ordered":
      return "border border-slate-400 bg-slate-200 text-slate-900";
    case "paymentSettled":
      return "border border-violet-400 bg-violet-200 text-violet-900";
    default:
      return "border border-zinc-400 bg-zinc-200 text-zinc-900";
  }
}

function getActionDockNoticeClassName(tone: ActionDockNoticeTone): string {
  switch (tone) {
    case "success":
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    case "error":
      return "border-rose-300 bg-rose-50 text-rose-800";
    default:
      return "border-cyan-300 bg-cyan-50 text-cyan-800";
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

function maskName(value: string | null | undefined): string {
  const name = String(value || "").trim();
  if (!name) {
    return "-";
  }
  if (name.length <= 1) {
    return "*";
  }
  if (name.length === 2) {
    return `${name[0]}*`;
  }
  if (name.length === 3) {
    return `${name[0]}*${name[2]}`;
  }
  return `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}`;
}

function maskAccountNumber(value: string | null | undefined): string {
  const accountNumber = String(value || "").trim();
  if (!accountNumber) {
    return "-";
  }
  const visibleTailLength = Math.min(4, accountNumber.length);
  const head = accountNumber.slice(0, -visibleTailLength);
  const tail = accountNumber.slice(-visibleTailLength);
  return `${head.replace(/[0-9A-Za-z가-힣]/g, "*")}${tail}`;
}

function formatShortHash(value: string | null | undefined): string {
  const hash = String(value || "").trim();
  if (!hash) {
    return "-";
  }
  if (hash.length <= 20) {
    return hash;
  }
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function formatShortWalletAddress(value: string | null | undefined): string {
  const address = String(value || "").trim();
  if (!address) {
    return "-";
  }
  if (address.length <= 14) {
    return address;
  }
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function getOptionalText(value: string | null | undefined): string | null {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function getRelativeTimeToneClassName(tone: RelativeTimeTone): string {
  switch (tone) {
    case "live":
      return "animate-pulse border-cyan-300/75 bg-cyan-400/22 text-cyan-50 shadow-[0_0_0_1px_rgba(34,211,238,0.3),0_0_16px_rgba(34,211,238,0.24)]";
    case "fresh":
      return "border-teal-300/65 bg-teal-400/18 text-teal-50 shadow-[0_0_0_1px_rgba(45,212,191,0.2)]";
    case "recent":
      return "border-sky-300/55 bg-sky-400/14 text-sky-100";
    case "normal":
      return "border-slate-500/50 bg-slate-700/55 text-slate-100";
    default:
      return "border-slate-700/70 bg-slate-900/70 text-slate-400";
  }
}

function getRelativeTimeToneClassNameOnLight(tone: RelativeTimeTone): string {
  switch (tone) {
    case "live":
      return "animate-pulse border-cyan-500 bg-cyan-100 text-cyan-900 shadow-[0_0_0_1px_rgba(6,182,212,0.22)]";
    case "fresh":
      return "border-emerald-500 bg-emerald-100 text-emerald-900";
    case "recent":
      return "border-sky-500 bg-sky-100 text-sky-900";
    case "normal":
      return "border-slate-400 bg-slate-100 text-slate-800";
    default:
      return "border-zinc-400 bg-zinc-100 text-zinc-700";
  }
}

function getKstDateKey(value: Date): string {
  const kst = new Date(value.getTime() + KST_OFFSET_MS);
  const year = kst.getUTCFullYear();
  const month = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getKstDateLabel(referenceDate: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(referenceDate);
}

function getRemainingKstMs(referenceMs: number): number {
  const shifted = new Date(referenceMs + KST_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const day = shifted.getUTCDate();
  const nextMidnightShiftedMs = Date.UTC(year, month, day + 1, 0, 0, 0, 0);
  return Math.max(0, nextMidnightShiftedMs - shifted.getTime());
}

function formatCountdownHms(totalMs: number): string {
  const totalSec = Math.max(0, Math.floor(totalMs / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function easeOutCubic(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return 1 - Math.pow(1 - clamped, 3);
}

function getCountUpDurationMs(fromValue: number, toValue: number): number {
  const delta = Math.abs(toValue - fromValue);
  if (delta <= 0) {
    return COUNT_UP_MIN_MS;
  }

  const scaled = 520 + Math.log10(delta + 1) * 280;
  return Math.round(Math.max(COUNT_UP_MIN_MS, Math.min(COUNT_UP_MAX_MS, scaled)));
}

function useCountUpValue(targetValue: number, fractionDigits = 0): number {
  const safeTarget = Number.isFinite(targetValue)
    ? Number(targetValue.toFixed(fractionDigits))
    : 0;
  const [displayValue, setDisplayValue] = useState<number>(safeTarget);
  const previousTargetRef = useRef<number>(safeTarget);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const nextTarget = Number.isFinite(targetValue)
      ? Number(targetValue.toFixed(fractionDigits))
      : 0;
    const startValue = previousTargetRef.current;

    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (startValue === nextTarget) {
      setDisplayValue(nextTarget);
      previousTargetRef.current = nextTarget;
      return;
    }

    const durationMs = getCountUpDurationMs(startValue, nextTarget);
    let startTimestamp = 0;

    const animate = (timestamp: number) => {
      if (!startTimestamp) {
        startTimestamp = timestamp;
      }

      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = easeOutCubic(progress);
      const interpolated = startValue + (nextTarget - startValue) * eased;
      setDisplayValue(Number(interpolated.toFixed(fractionDigits)));

      if (progress < 1) {
        rafRef.current = window.requestAnimationFrame(animate);
        return;
      }

      setDisplayValue(nextTarget);
      previousTargetRef.current = nextTarget;
      rafRef.current = null;
    };

    rafRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [fractionDigits, targetValue]);

  return displayValue;
}

export default function RealtimeBuyOrderPage() {
  const params = useParams();
  const lang = typeof params?.lang === "string" ? params.lang : "ko";

  const [events, setEvents] = useState<RealtimeItem[]>([]);
  const [jackpotBursts, setJackpotBursts] = useState<JackpotBurst[]>([]);
  const [connectionState, setConnectionState] = useState<Ably.ConnectionState>("initialized");
  const [connectionErrorMessage, setConnectionErrorMessage] = useState<string | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [countdownNowMs, setCountdownNowMs] = useState(() => Date.now());
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [todaySummaryErrorMessage, setTodaySummaryErrorMessage] = useState<string | null>(null);
  const [pendingBuyOrders, setPendingBuyOrders] = useState<PendingBuyOrderItem[]>([]);
  const [pendingBuyOrdersTotalCount, setPendingBuyOrdersTotalCount] = useState(0);
  const [pendingBuyOrdersUpdatedAt, setPendingBuyOrdersUpdatedAt] = useState<string | null>(null);
  const [pendingBuyOrdersErrorMessage, setPendingBuyOrdersErrorMessage] = useState<string | null>(null);
  const [pendingBuyOrderHighlightUntilMap, setPendingBuyOrderHighlightUntilMap] = useState<Record<string, number>>({});
  const [buyOrderListItems, setBuyOrderListItems] = useState<BuyOrderListItem[]>([]);
  const [buyOrderListTotalCount, setBuyOrderListTotalCount] = useState(0);
  const [buyOrderListPage, setBuyOrderListPage] = useState(1);
  const [buyOrderListTotalPages, setBuyOrderListTotalPages] = useState(1);
  const [buyOrderListStatusFilter, setBuyOrderListStatusFilter] = useState<BuyOrderListStatusFilter>("all");
  const [buyOrderListStoreCodeFilter, setBuyOrderListStoreCodeFilter] = useState("all");
  const [buyOrderListQueryInput, setBuyOrderListQueryInput] = useState("");
  const [buyOrderListQuery, setBuyOrderListQuery] = useState("");
  const [buyOrderStoreOptions, setBuyOrderStoreOptions] = useState<BuyOrderStoreOption[]>([]);
  const [isStoreFilterOpen, setIsStoreFilterOpen] = useState(false);
  const [buyOrderListUpdatedAt, setBuyOrderListUpdatedAt] = useState<string | null>(null);
  const [buyOrderListErrorMessage, setBuyOrderListErrorMessage] = useState<string | null>(null);
  const [buyOrderListHighlightUntilMap, setBuyOrderListHighlightUntilMap] = useState<Record<string, number>>({});
  const [sellerWalletBalances, setSellerWalletBalances] = useState<SellerWalletBalanceItem[]>([]);
  const [sellerWalletBalancesUpdatedAt, setSellerWalletBalancesUpdatedAt] = useState<string | null>(null);
  const [sellerWalletBalancesErrorMessage, setSellerWalletBalancesErrorMessage] = useState<string | null>(null);
  const [isBuyOrderListLoading, setIsBuyOrderListLoading] = useState(false);
  const [copiedTradeId, setCopiedTradeId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [manualAdminSession, setManualAdminSession] = useState<RealtimeManualAdminSession>({
    enabled: false,
    authenticated: false,
    expiresAt: null,
  });
  const [manualAdminPassword, setManualAdminPassword] = useState("");
  const [isManualAdminSessionLoading, setIsManualAdminSessionLoading] = useState(false);
  const [actionDockNotice, setActionDockNotice] = useState<ActionDockNotice | null>(null);
  const [manualConfirmModalOpen, setManualConfirmModalOpen] = useState(false);
  const [manualConfirmLoadingOrderId, setManualConfirmLoadingOrderId] = useState<string | null>(null);
  const [manualConfirmSubmittingOrderId, setManualConfirmSubmittingOrderId] = useState<string | null>(null);
  const [manualConfirmPayload, setManualConfirmPayload] = useState<RealtimeManualConfirmPayload | null>(null);
  const [manualConfirmErrorMessage, setManualConfirmErrorMessage] = useState<string | null>(null);
  const [selectedManualDepositIds, setSelectedManualDepositIds] = useState<string[]>([]);

  const cursorRef = useRef<string | null>(null);
  const jackpotTimerMapRef = useRef<Map<string, number>>(new Map());
  const triggeredJackpotEventIdsRef = useRef<string[]>([]);
  const copiedTradeTimerRef = useRef<number | null>(null);
  const storeFilterDropdownRef = useRef<HTMLDivElement | null>(null);
  const pendingBuyOrderSeenIdsRef = useRef<Set<string>>(new Set());
  const pendingBuyOrderHighlightInitializedRef = useRef(false);
  const buyOrderListSeenIdsRef = useRef<Set<string>>(new Set());
  const buyOrderListHighlightInitializedRef = useRef(false);
  const buyOrderListFetchInFlightRef = useRef(false);

  const clientId = useMemo(() => {
    return `buyorder-dashboard-${Math.random().toString(36).slice(2, 10)}`;
  }, []);

  const updateCursor = useCallback((nextCursor: string | null | undefined) => {
    if (!nextCursor) {
      return;
    }

    setCursor((previousCursor) => {
      if (!previousCursor || nextCursor > previousCursor) {
        cursorRef.current = nextCursor;
        return nextCursor;
      }
      return previousCursor;
    });
  }, []);

  const registerJackpotTrigger = useCallback((eventId: string): boolean => {
    const cache = triggeredJackpotEventIdsRef.current;
    if (cache.includes(eventId)) {
      return false;
    }

    cache.push(eventId);
    if (cache.length > JACKPOT_TRIGGERED_EVENT_CACHE_LIMIT) {
      cache.splice(0, cache.length - JACKPOT_TRIGGERED_EVENT_CACHE_LIMIT);
    }
    return true;
  }, []);

  const triggerJackpotBurst = useCallback((event: BuyOrderStatusRealtimeEvent, eventId: string) => {
    if (!registerJackpotTrigger(eventId)) {
      return;
    }

    const burstId = `jackpot-${eventId}-${Date.now().toString(36)}`;
    const burst: JackpotBurst = {
      id: burstId,
      amountUsdt: Number(event.amountUsdt || 0),
      storeLabel: event.store?.name || event.store?.code || "Unknown Store",
    };

    setJackpotBursts((previous) => [...previous.slice(-(JACKPOT_MAX_ACTIVE_BURSTS - 1)), burst]);

    const timer = window.setTimeout(() => {
      jackpotTimerMapRef.current.delete(burstId);
      setJackpotBursts((previous) => previous.filter((item) => item.id !== burstId));
    }, JACKPOT_BURST_DURATION_MS);

    jackpotTimerMapRef.current.set(burstId, timer);
  }, [registerJackpotTrigger]);

  const partyConfettiBlueprint = useMemo(() => {
    const colors = [
      "rgba(52, 211, 153, 0.95)",
      "rgba(34, 211, 238, 0.95)",
      "rgba(250, 204, 21, 0.95)",
      "rgba(244, 114, 182, 0.92)",
      "rgba(196, 181, 253, 0.92)",
      "rgba(251, 146, 60, 0.92)",
    ];

    return Array.from({ length: PARTY_CONFETTI_COUNT }, (_, index) => {
      const left = 2 + ((index * 37) % 96);
      const delay = (index % 10) * 90;
      const duration = 1_240 + (index % 9) * 230;
      const sway = (index % 2 === 0 ? 1 : -1) * (18 + ((index * 13) % 68));
      const spin = (index % 2 === 0 ? 1 : -1) * (220 + ((index * 29) % 280));
      const width = 4 + (index % 4) * 2;
      const height = 10 + (index % 3) * 5;

      return {
        left,
        delay,
        duration,
        sway,
        spin,
        width,
        height,
        color: colors[index % colors.length],
      };
    });
  }, []);

  const partyStreamerBlueprint = useMemo(() => {
    const colors = [
      "rgba(45, 212, 191, 0.9)",
      "rgba(56, 189, 248, 0.88)",
      "rgba(250, 204, 21, 0.86)",
      "rgba(244, 114, 182, 0.84)",
    ];

    return Array.from({ length: PARTY_STREAMER_COUNT }, (_, index) => {
      const left = 4 + ((index * 61) % 92);
      const delay = (index % 8) * 75;
      const duration = 950 + (index % 5) * 160;
      const tilt = (index % 2 === 0 ? 1 : -1) * (9 + ((index * 5) % 17));

      return {
        left,
        delay,
        duration,
        tilt,
        color: colors[index % colors.length],
      };
    });
  }, []);

  const partyFireworkBlueprint = useMemo(() => {
    const colors = [
      "rgba(110, 231, 183, 0.95)",
      "rgba(250, 204, 21, 0.95)",
      "rgba(56, 189, 248, 0.95)",
      "rgba(251, 146, 60, 0.92)",
      "rgba(244, 114, 182, 0.9)",
      "rgba(196, 181, 253, 0.92)",
    ];

    return Array.from({ length: PARTY_FIREWORK_COUNT }, (_, index) => {
      const left = 12 + ((index * 19) % 76);
      const top = 14 + ((index * 17) % 30);
      const delay = 90 + index * 120;
      const scale = 0.84 + (index % 3) * 0.2;

      return {
        left,
        top,
        delay,
        scale,
        color: colors[index % colors.length],
      };
    });
  }, []);

  const upsertRealtimeEvents = useCallback(
    (incomingEvents: BuyOrderStatusRealtimeEvent[], options?: { highlightNew?: boolean }) => {
      if (incomingEvents.length === 0) {
        return;
      }

      const highlightNew = options?.highlightNew ?? true;
      const now = Date.now();
      const jackpotCandidates: Array<{ eventId: string; event: BuyOrderStatusRealtimeEvent }> = [];

      setEvents((previousEvents) => {
        const map = new Map(previousEvents.map((item) => [item.id, item]));

        for (const incomingEvent of incomingEvents) {
          const nextId =
            incomingEvent.eventId ||
            incomingEvent.cursor ||
            `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

          const existing = map.get(nextId);

          if (existing) {
            const previousWasPaymentConfirmed = isPaymentConfirmedStatus(existing.data.statusTo);
            const nextIsPaymentConfirmed = isPaymentConfirmedStatus(incomingEvent.statusTo);
            if (highlightNew && nextIsPaymentConfirmed && !previousWasPaymentConfirmed) {
              jackpotCandidates.push({
                eventId: nextId,
                event: incomingEvent,
              });
            }

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

          if (highlightNew && isPaymentConfirmedStatus(incomingEvent.statusTo)) {
            jackpotCandidates.push({
              eventId: nextId,
              event: incomingEvent,
            });
          }
        }

        const merged = Array.from(map.values());
        merged.sort((left, right) => {
          return (
            toTimestamp(right.data.publishedAt || right.receivedAt) -
            toTimestamp(left.data.publishedAt || left.receivedAt)
          );
        });

        return merged.slice(0, MAX_EVENTS);
      });

      for (const incomingEvent of incomingEvents) {
        updateCursor(incomingEvent.cursor || null);
      }

      for (const candidate of jackpotCandidates) {
        triggerJackpotBurst(candidate.event, candidate.eventId);
      }
    },
    [triggerJackpotBurst, updateCursor],
  );

  const syncFromApi = useCallback(
    async (sinceOverride?: string | null) => {
      const since = sinceOverride ?? cursorRef.current;
      const params = new URLSearchParams({
        limit: String(RESYNC_LIMIT),
        public: "1",
      });

      if (since) {
        params.set("since", since);
      }

      setIsSyncing(true);
      let lastError: string | null = null;

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response = await fetch(`/api/realtime/buyorder/events?${params.toString()}`, {
            method: "GET",
            cache: "no-store",
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status} ${text}`);
          }

          const data = await response.json();
          const incomingEvents = Array.isArray(data.events)
            ? (data.events as BuyOrderStatusRealtimeEvent[])
            : [];

          upsertRealtimeEvents(incomingEvents, { highlightNew: Boolean(since) });
          updateCursor(typeof data.nextCursor === "string" ? data.nextCursor : null);
          setSyncErrorMessage(null);
          setIsSyncing(false);
          return;
        } catch (error) {
          lastError = error instanceof Error ? error.message : "sync failed";

          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 300));
          }
        }
      }

      setSyncErrorMessage(lastError || "재동기화에 실패했습니다.");
      setIsSyncing(false);
    },
    [upsertRealtimeEvents, updateCursor],
  );

  const fetchTodaySummary = useCallback(async () => {
    try {
      const response = await fetch("/api/realtime/buyorder/summary?public=1", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status} ${text}`);
      }

      const data = await response.json();
      const summaryData = data?.summary || {};

      const nextSummary: TodaySummary = {
        dateKst: String(summaryData.dateKst || getKstDateKey(new Date())),
        confirmedCount: Number(summaryData.confirmedCount || 0),
        confirmedAmountKrw: Number(summaryData.confirmedAmountKrw || 0),
        confirmedAmountUsdt: Number(summaryData.confirmedAmountUsdt || 0),
        pgFeeAmountKrw: Number(summaryData.pgFeeAmountKrw || 0),
        pgFeeAmountUsdt: Number(summaryData.pgFeeAmountUsdt || 0),
        updatedAt: String(summaryData.updatedAt || new Date().toISOString()),
      };

      setTodaySummary(nextSummary);
      setTodaySummaryErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "오늘 누적 집계 조회 실패";
      setTodaySummaryErrorMessage(message);
    }
  }, []);

  const fetchPendingBuyOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        public: "1",
        limit: String(PENDING_BUYORDER_FETCH_LIMIT),
      });
      const response = await fetch(`/api/realtime/buyorder/pending?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status} ${text}`);
      }

      const data = await response.json();
      const nextOrders = Array.isArray(data?.orders)
        ? (data.orders as Array<Record<string, unknown>>).map((item) => {
            const statusRaw = String(item?.status || "");
            return {
              orderId: String(item?.orderId || ""),
              tradeId: item?.tradeId ? String(item.tradeId) : null,
              status: isPendingBuyOrderStatus(statusRaw) ? statusRaw : "ordered",
              createdAt: item?.createdAt ? String(item.createdAt) : null,
              amountKrw: Number(item?.amountKrw || 0),
              amountUsdt: Number(item?.amountUsdt || 0),
              buyerName: item?.buyerName ? String(item.buyerName) : null,
              buyerAccountNumber: item?.buyerAccountNumber ? String(item.buyerAccountNumber) : null,
              storeLogo: item?.storeLogo ? String(item.storeLogo) : null,
              storeName: item?.storeName ? String(item.storeName) : null,
              storeCode: item?.storeCode ? String(item.storeCode) : null,
            } satisfies PendingBuyOrderItem;
          })
        : [];
      const nextOrderIds = new Set(
        nextOrders
          .map((order) => String(order.orderId || order.tradeId || "").trim())
          .filter(Boolean),
      );
      const now = Date.now();

      if (!pendingBuyOrderHighlightInitializedRef.current) {
        pendingBuyOrderHighlightInitializedRef.current = true;
        pendingBuyOrderSeenIdsRef.current = nextOrderIds;
        setPendingBuyOrderHighlightUntilMap((previousMap) => {
          const nextMap: Record<string, number> = {};
          for (const [orderId, highlightUntil] of Object.entries(previousMap)) {
            if (highlightUntil > now && nextOrderIds.has(orderId)) {
              nextMap[orderId] = highlightUntil;
            }
          }
          return nextMap;
        });
      } else {
        const addedHighlightMap: Record<string, number> = {};
        for (const orderId of nextOrderIds) {
          if (!pendingBuyOrderSeenIdsRef.current.has(orderId)) {
            addedHighlightMap[orderId] = now + NEW_EVENT_HIGHLIGHT_MS;
          }
        }
        pendingBuyOrderSeenIdsRef.current = nextOrderIds;
        setPendingBuyOrderHighlightUntilMap((previousMap) => {
          const nextMap: Record<string, number> = {};
          for (const [orderId, highlightUntil] of Object.entries(previousMap)) {
            if (highlightUntil > now && nextOrderIds.has(orderId)) {
              nextMap[orderId] = highlightUntil;
            }
          }
          for (const [orderId, highlightUntil] of Object.entries(addedHighlightMap)) {
            nextMap[orderId] = highlightUntil;
          }
          return nextMap;
        });
      }

      setPendingBuyOrders(nextOrders);
      setPendingBuyOrdersTotalCount(Number(data?.totalCount || nextOrders.length));
      setPendingBuyOrdersUpdatedAt(data?.updatedAt ? String(data.updatedAt) : new Date().toISOString());
      setPendingBuyOrdersErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "진행중 주문 조회 실패";
      setPendingBuyOrdersErrorMessage(message);
    }
  }, []);

  const fetchBuyOrderList = useCallback(async () => {
    if (buyOrderListFetchInFlightRef.current) {
      return;
    }

    buyOrderListFetchInFlightRef.current = true;
    setIsBuyOrderListLoading(true);
    try {
      const params = new URLSearchParams({
        public: "1",
        page: String(buyOrderListPage),
        limit: String(BUYORDER_LIST_PAGE_LIMIT),
        status: buyOrderListStatusFilter,
      });

      if (buyOrderListStoreCodeFilter !== "all") {
        params.set("storeCode", buyOrderListStoreCodeFilter);
      }

      if (buyOrderListQuery) {
        params.set("q", buyOrderListQuery);
      }

      const response = await fetch(`/api/realtime/buyorder/list?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status} ${text}`);
      }

      const data = await response.json();
      const nextOrders = Array.isArray(data?.orders)
        ? (data.orders as Array<Record<string, unknown>>).map((item) => {
            const rawStatus = String(item?.status || "");
            return {
              orderId: String(item?.orderId || ""),
              tradeId: item?.tradeId ? String(item.tradeId) : null,
              status: isBuyOrderListStatus(rawStatus) ? rawStatus : "ordered",
              createdAt: item?.createdAt ? String(item.createdAt) : null,
              amountKrw: Number(item?.amountKrw || 0),
              amountUsdt: Number(item?.amountUsdt || 0),
              buyerName: item?.buyerName ? String(item.buyerName) : null,
              buyerAccountNumber: item?.buyerAccountNumber ? String(item.buyerAccountNumber) : null,
              storeLogo: item?.storeLogo ? String(item.storeLogo) : null,
              storeName: item?.storeName ? String(item.storeName) : null,
              storeCode: item?.storeCode ? String(item.storeCode) : null,
            } satisfies BuyOrderListItem;
          })
        : [];
      const nextOrderIds = new Set(
        nextOrders
          .map((order) => String(order.orderId || order.tradeId || "").trim())
          .filter(Boolean),
      );
      const now = Date.now();

      if (!buyOrderListHighlightInitializedRef.current) {
        buyOrderListHighlightInitializedRef.current = true;
        buyOrderListSeenIdsRef.current = nextOrderIds;
        setBuyOrderListHighlightUntilMap((previousMap) => {
          const nextMap: Record<string, number> = {};
          for (const [orderId, highlightUntil] of Object.entries(previousMap)) {
            if (highlightUntil > now && nextOrderIds.has(orderId)) {
              nextMap[orderId] = highlightUntil;
            }
          }
          return nextMap;
        });
      } else {
        const addedHighlightMap: Record<string, number> = {};
        for (const orderId of nextOrderIds) {
          if (!buyOrderListSeenIdsRef.current.has(orderId)) {
            addedHighlightMap[orderId] = now + NEW_EVENT_HIGHLIGHT_MS;
          }
        }
        buyOrderListSeenIdsRef.current = nextOrderIds;
        setBuyOrderListHighlightUntilMap((previousMap) => {
          const nextMap: Record<string, number> = {};
          for (const [orderId, highlightUntil] of Object.entries(previousMap)) {
            if (highlightUntil > now && nextOrderIds.has(orderId)) {
              nextMap[orderId] = highlightUntil;
            }
          }
          for (const [orderId, highlightUntil] of Object.entries(addedHighlightMap)) {
            nextMap[orderId] = highlightUntil;
          }
          return nextMap;
        });
      }

      const nextPage = Math.max(1, Number(data?.page || buyOrderListPage));
      const nextTotalPages = Math.max(1, Number(data?.totalPages || 1));

      setBuyOrderListItems(nextOrders);
      setBuyOrderListTotalCount(Number(data?.totalCount || 0));
      setBuyOrderListTotalPages(nextTotalPages);
      setBuyOrderListPage((previous) => (previous === nextPage ? previous : nextPage));
      setBuyOrderListUpdatedAt(data?.updatedAt ? String(data.updatedAt) : new Date().toISOString());
      setBuyOrderListErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "구매주문 목록 조회 실패";
      setBuyOrderListErrorMessage(message);
    } finally {
      buyOrderListFetchInFlightRef.current = false;
      setIsBuyOrderListLoading(false);
    }
  }, [buyOrderListPage, buyOrderListQuery, buyOrderListStatusFilter, buyOrderListStoreCodeFilter]);

  const fetchBuyOrderStoreOptions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        public: "1",
        limit: "300",
      });
      const response = await fetch(`/api/realtime/buyorder/stores?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status} ${text}`);
      }

      const data = await response.json();
      const options = Array.isArray(data?.stores)
        ? (data.stores as Array<Record<string, unknown>>).map((item) => ({
            storeCode: String(item?.storeCode || ""),
            storeName: String(item?.storeName || item?.storeCode || ""),
            storeLogo: item?.storeLogo ? String(item.storeLogo) : null,
          }))
          .filter((item) => item.storeCode)
        : [];

      setBuyOrderStoreOptions(options);
    } catch (error) {
      console.error("Failed to fetch buyorder store options:", error);
    }
  }, []);

  const fetchSellerWalletBalances = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        public: "1",
        limit: String(SELLER_WALLET_BALANCE_LIMIT),
      });
      const response = await fetch(`/api/realtime/buyorder/seller-wallets?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status} ${text}`);
      }

      const data = await response.json();
      const wallets = Array.isArray(data?.wallets)
        ? (data.wallets as Array<Record<string, unknown>>).map((item) => ({
            walletAddress: String(item?.walletAddress || ""),
            orderCount: Number(item?.orderCount || 0),
            totalAmountUsdt: Number(item?.totalAmountUsdt || 0),
            latestOrderCreatedAt: item?.latestOrderCreatedAt ? String(item.latestOrderCreatedAt) : null,
            currentUsdtBalance: Number(item?.currentUsdtBalance || 0),
          }))
          .filter((item) => item.walletAddress)
        : [];

      setSellerWalletBalances(wallets);
      setSellerWalletBalancesUpdatedAt(data?.updatedAt ? String(data.updatedAt) : new Date().toISOString());
      setSellerWalletBalancesErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "판매자 지갑 잔고 조회 실패";
      setSellerWalletBalancesErrorMessage(message);
    }
  }, []);

  const fetchManualAdminSession = useCallback(async () => {
    setIsManualAdminSessionLoading(true);
    try {
      const response = await fetch("/api/realtime/buyorder/admin/session", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status} ${text}`);
      }

      const data = await response.json();
      setManualAdminSession({
        enabled: Boolean(data?.enabled),
        authenticated: Boolean(data?.authenticated),
        expiresAt: data?.expiresAt ? String(data.expiresAt) : null,
      });
    } catch (error) {
      console.error("Failed to fetch realtime manual admin session:", error);
      setManualAdminSession({
        enabled: false,
        authenticated: false,
        expiresAt: null,
      });
      setActionDockNotice({
        tone: "error",
        message: "수동입금확인 관리자 상태를 불러오지 못했습니다.",
      });
    } finally {
      setIsManualAdminSessionLoading(false);
    }
  }, []);

  const handleBuyOrderListSearchSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const nextQuery = buyOrderListQueryInput.trim();
      setBuyOrderListPage(1);
      setBuyOrderListQuery(nextQuery);
    },
    [buyOrderListQueryInput],
  );

  const handleBuyOrderListFilterReset = useCallback(() => {
    setBuyOrderListStatusFilter("all");
    setBuyOrderListStoreCodeFilter("all");
    setIsStoreFilterOpen(false);
    setBuyOrderListQueryInput("");
    setBuyOrderListQuery("");
    setBuyOrderListPage(1);
  }, []);

  const handleCopyTradeId = useCallback(async (tradeId: string | null) => {
    if (!tradeId || !navigator?.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(tradeId);
      setCopiedTradeId(tradeId);

      if (copiedTradeTimerRef.current !== null) {
        window.clearTimeout(copiedTradeTimerRef.current);
      }
      copiedTradeTimerRef.current = window.setTimeout(() => {
        setCopiedTradeId(null);
        copiedTradeTimerRef.current = null;
      }, 1300);
    } catch (error) {
      console.error("Failed to copy tradeId:", error);
    }
  }, []);

  const handleManualAdminLogin = useCallback(async () => {
    const password = manualAdminPassword.trim();
    if (!password) {
      setActionDockNotice({
        tone: "error",
        message: "관리자 비밀번호를 입력해주세요.",
      });
      return;
    }

    setIsManualAdminSessionLoading(true);
    setActionDockNotice(null);
    try {
      const response = await fetch("/api/realtime/buyorder/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(String(data?.message || `HTTP ${response.status}`));
      }

      setManualAdminPassword("");
      setActionDockNotice({
        tone: "success",
        message: "수동입금확인 잠금이 해제되었습니다.",
      });
      await fetchManualAdminSession();
    } catch (error) {
      setActionDockNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "수동입금확인 잠금 해제에 실패했습니다.",
      });
    } finally {
      setIsManualAdminSessionLoading(false);
    }
  }, [fetchManualAdminSession, manualAdminPassword]);

  const handleManualAdminLogout = useCallback(async () => {
    setIsManualAdminSessionLoading(true);
    try {
      await fetch("/api/realtime/buyorder/admin/session", {
        method: "DELETE",
      });
      setManualConfirmModalOpen(false);
      setManualConfirmPayload(null);
      setManualConfirmErrorMessage(null);
      setSelectedManualDepositIds([]);
      setActionDockNotice({
        tone: "info",
        message: "수동입금확인 잠금을 종료했습니다.",
      });
      await fetchManualAdminSession();
    } catch (error) {
      setActionDockNotice({
        tone: "error",
        message: "로그아웃 처리에 실패했습니다.",
      });
    } finally {
      setIsManualAdminSessionLoading(false);
    }
  }, [fetchManualAdminSession]);

  const loadManualConfirmOptions = useCallback(async (orderId: string) => {
    if (!manualAdminSession.enabled) {
      setActionDockNotice({
        tone: "error",
        message: "REALTIME_BUYORDER_ADMIN_PASSWORD 설정이 없어 수동입금확인이 비활성화되어 있습니다.",
      });
      return;
    }

    if (!manualAdminSession.authenticated) {
      setActionDockNotice({
        tone: "info",
        message: "Action Dock에서 관리자 잠금을 먼저 해제해주세요.",
      });
      return;
    }

    setManualConfirmModalOpen(true);
    setManualConfirmPayload(null);
    setManualConfirmErrorMessage(null);
    setSelectedManualDepositIds([]);
    setManualConfirmLoadingOrderId(orderId);

    try {
      const response = await fetch("/api/realtime/buyorder/admin/manual-payment-options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) {
          await fetchManualAdminSession();
        }
        throw new Error(String(data?.message || `HTTP ${response.status}`));
      }

      const nextPayload: RealtimeManualConfirmPayload = {
        order: {
          orderId: String(data?.order?.orderId || orderId),
          tradeId: data?.order?.tradeId ? String(data.order.tradeId) : null,
          status: data?.order?.status ? String(data.order.status) : null,
          paymentMethod: data?.order?.paymentMethod ? String(data.order.paymentMethod) : null,
          storeCode: data?.order?.storeCode ? String(data.order.storeCode) : null,
          storeName: data?.order?.storeName ? String(data.order.storeName) : null,
          storeLogo: data?.order?.storeLogo ? String(data.order.storeLogo) : null,
          buyerName: data?.order?.buyerName ? String(data.order.buyerName) : null,
          buyerAccountNumber: data?.order?.buyerAccountNumber ? String(data.order.buyerAccountNumber) : null,
          krwAmount: Number(data?.order?.krwAmount || 0),
          usdtAmount: Number(data?.order?.usdtAmount || 0),
          createdAt: data?.order?.createdAt ? String(data.order.createdAt) : null,
          paymentRequestedAt: data?.order?.paymentRequestedAt ? String(data.order.paymentRequestedAt) : null,
          sellerBankName: data?.order?.sellerBankName ? String(data.order.sellerBankName) : null,
          sellerAccountNumber: data?.order?.sellerAccountNumber ? String(data.order.sellerAccountNumber) : null,
          sellerAccountHolder: data?.order?.sellerAccountHolder ? String(data.order.sellerAccountHolder) : null,
        },
        deposits: Array.isArray(data?.deposits)
          ? (data.deposits as Array<Record<string, unknown>>).map((deposit) => ({
              id: String(deposit?.id || ""),
              transactionName: deposit?.transactionName ? String(deposit.transactionName) : null,
              amount: Number(deposit?.amount || 0),
              bankAccountNumber: deposit?.bankAccountNumber ? String(deposit.bankAccountNumber) : null,
              balance: Number(deposit?.balance || 0),
              transactionDate: deposit?.transactionDate ? String(deposit.transactionDate) : null,
              memo: deposit?.memo ? String(deposit.memo) : null,
              isAmountMatch: Boolean(deposit?.isAmountMatch),
              isNameMatch: Boolean(deposit?.isNameMatch),
            }))
          : [],
        recommendedFromDate: data?.recommendedFromDate ? String(data.recommendedFromDate) : null,
        recommendedToDate: data?.recommendedToDate ? String(data.recommendedToDate) : null,
      };

      setManualConfirmPayload(nextPayload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "입금 후보를 불러오지 못했습니다.";
      setManualConfirmErrorMessage(message);
      setActionDockNotice({
        tone: "error",
        message,
      });
    } finally {
      setManualConfirmLoadingOrderId(null);
    }
  }, [fetchManualAdminSession, manualAdminSession.authenticated, manualAdminSession.enabled]);

  const closeManualConfirmModal = useCallback(() => {
    if (manualConfirmSubmittingOrderId) {
      return;
    }
    setManualConfirmModalOpen(false);
    setManualConfirmPayload(null);
    setManualConfirmErrorMessage(null);
    setSelectedManualDepositIds([]);
  }, [manualConfirmSubmittingOrderId]);

  const refreshManualConfirmOptions = useCallback(async () => {
    if (!manualConfirmPayload?.order.orderId) {
      return;
    }
    await loadManualConfirmOptions(manualConfirmPayload.order.orderId);
  }, [loadManualConfirmOptions, manualConfirmPayload?.order.orderId]);

  const handleManualConfirmSubmit = useCallback(async () => {
    if (!manualConfirmPayload?.order.orderId) {
      return;
    }

    const currentPayload = manualConfirmPayload;
    const orderId = currentPayload.order.orderId;
    const selectedDeposits = currentPayload.deposits.filter((deposit) => selectedManualDepositIds.includes(deposit.id));
    const selectedTotalAmount = selectedDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);

    if (selectedManualDepositIds.length > 0 && selectedTotalAmount !== currentPayload.order.krwAmount) {
      setManualConfirmErrorMessage("선택한 입금 합계와 주문 금액이 일치해야 완료할 수 있습니다.");
      return;
    }

    setManualConfirmSubmittingOrderId(orderId);
    setManualConfirmErrorMessage(null);
    try {
      const response = await fetch("/api/realtime/buyorder/admin/manual-confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          bankTransferIds: selectedManualDepositIds,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) {
          await fetchManualAdminSession();
        }
        throw new Error(String(data?.message || `HTTP ${response.status}`));
      }

      const matchedCount = Array.isArray(data?.result?.matchedTransferIds)
        ? data.result.matchedTransferIds.length
        : 0;
      const unmatchedCount = Array.isArray(data?.result?.unmatchedTransferIds)
        ? data.result.unmatchedTransferIds.length
        : 0;

      setActionDockNotice({
        tone: unmatchedCount > 0 ? "info" : "success",
        message:
          unmatchedCount > 0
            ? `주문을 완료했고 입금 ${matchedCount}건만 매칭되었습니다. 미매칭 ${unmatchedCount}건은 별도 확인이 필요합니다.`
            : selectedManualDepositIds.length > 0
              ? `주문을 완료하고 입금 ${matchedCount}건을 매칭했습니다.`
              : "주문을 수동으로 결제완료 처리했습니다.",
      });

      setManualConfirmModalOpen(false);
      setManualConfirmPayload(null);
      setSelectedManualDepositIds([]);
      await Promise.all([
        fetchTodaySummary(),
        fetchPendingBuyOrders(),
        fetchBuyOrderList(),
        fetchSellerWalletBalances(),
        syncFromApi(),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "수동입금확인 처리에 실패했습니다.";
      setManualConfirmErrorMessage(message);
      setActionDockNotice({
        tone: "error",
        message,
      });
    } finally {
      setManualConfirmSubmittingOrderId(null);
    }
  }, [
    fetchBuyOrderList,
    fetchManualAdminSession,
    fetchPendingBuyOrders,
    fetchSellerWalletBalances,
    fetchTodaySummary,
    manualConfirmPayload,
    selectedManualDepositIds,
    syncFromApi,
  ]);

  useEffect(() => {
    const realtime = new Ably.Realtime({
      authUrl: `/api/realtime/ably-token?public=1&stream=buyorder&clientId=${clientId}`,
    });

    const channel = realtime.channels.get(BUYORDER_STATUS_ABLY_CHANNEL);

    const onConnectionStateChange = (stateChange: Ably.ConnectionStateChange) => {
      setConnectionState(stateChange.current);
      if (stateChange.reason) {
        setConnectionErrorMessage(stateChange.reason.message || "Ably connection error");
      }

      if (stateChange.current === "connected") {
        void syncFromApi();
        void fetchTodaySummary();
        void fetchPendingBuyOrders();
        void fetchBuyOrderList();
        void fetchBuyOrderStoreOptions();
        void fetchSellerWalletBalances();
      }
    };

    const onMessage = (message: Ably.Message) => {
      const data = message.data as BuyOrderStatusRealtimeEvent;
      const normalizedEvent: BuyOrderStatusRealtimeEvent = {
        ...data,
        eventId: data.eventId || String(message.id || ""),
      };
      upsertRealtimeEvents(
        [normalizedEvent],
        { highlightNew: true },
      );
      if (
        isPaymentConfirmedStatus(normalizedEvent.statusTo) ||
        isPaymentConfirmedStatus(normalizedEvent.statusFrom)
      ) {
        void fetchTodaySummary();
      }
      if (
        isPendingBuyOrderStatus(normalizedEvent.statusTo) ||
        isPendingBuyOrderStatus(normalizedEvent.statusFrom)
      ) {
        void fetchPendingBuyOrders();
      }
      void fetchBuyOrderList();
      void fetchSellerWalletBalances();
    };

    realtime.connection.on(onConnectionStateChange);
    void channel.subscribe(BUYORDER_STATUS_ABLY_EVENT_NAME, onMessage);

    return () => {
      channel.unsubscribe(BUYORDER_STATUS_ABLY_EVENT_NAME, onMessage);
      realtime.connection.off(onConnectionStateChange);
      realtime.close();
    };
  }, [clientId, fetchBuyOrderList, fetchBuyOrderStoreOptions, fetchPendingBuyOrders, fetchSellerWalletBalances, fetchTodaySummary, syncFromApi, upsertRealtimeEvents]);

  useEffect(() => {
    void syncFromApi(null);

    const timer = window.setInterval(() => {
      void syncFromApi();
    }, RESYNC_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [syncFromApi]);

  useEffect(() => {
    void fetchTodaySummary();

    const timer = window.setInterval(() => {
      void fetchTodaySummary();
    }, TODAY_SUMMARY_REFRESH_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [fetchTodaySummary]);

  useEffect(() => {
    void fetchPendingBuyOrders();

    const timer = window.setInterval(() => {
      void fetchPendingBuyOrders();
    }, PENDING_BUYORDER_REFRESH_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [fetchPendingBuyOrders]);

  useEffect(() => {
    buyOrderListHighlightInitializedRef.current = false;
    buyOrderListSeenIdsRef.current = new Set();
    setBuyOrderListHighlightUntilMap({});
  }, [buyOrderListPage, buyOrderListQuery, buyOrderListStatusFilter, buyOrderListStoreCodeFilter]);

  useEffect(() => {
    void fetchBuyOrderList();
  }, [fetchBuyOrderList]);

  useEffect(() => {
    void fetchBuyOrderStoreOptions();

    const timer = window.setInterval(() => {
      void fetchBuyOrderStoreOptions();
    }, BUYORDER_STORE_OPTIONS_REFRESH_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [fetchBuyOrderStoreOptions]);

  useEffect(() => {
    void fetchSellerWalletBalances();

    const timer = window.setInterval(() => {
      void fetchSellerWalletBalances();
    }, SELLER_WALLET_BALANCE_REFRESH_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [fetchSellerWalletBalances]);

  useEffect(() => {
    void fetchManualAdminSession();
  }, [fetchManualAdminSession]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void fetchBuyOrderList();
    }, BUYORDER_LIST_REFRESH_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [fetchBuyOrderList]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, TIME_AGO_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdownNowMs(Date.now());
    }, COUNTDOWN_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const timerMap = jackpotTimerMapRef.current;
    return () => {
      for (const timer of timerMap.values()) {
        window.clearTimeout(timer);
      }
      timerMap.clear();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (copiedTradeTimerRef.current !== null) {
        window.clearTimeout(copiedTradeTimerRef.current);
        copiedTradeTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const now = Date.now();
    const activeHighlights = Object.values(pendingBuyOrderHighlightUntilMap).filter((highlightUntil) => highlightUntil > now);
    if (activeHighlights.length === 0) {
      return;
    }

    const nextExpireAt = Math.min(...activeHighlights);
    const timer = window.setTimeout(() => {
      const current = Date.now();
      setPendingBuyOrderHighlightUntilMap((previousMap) => {
        const nextMap: Record<string, number> = {};
        for (const [orderId, highlightUntil] of Object.entries(previousMap)) {
          if (highlightUntil > current) {
            nextMap[orderId] = highlightUntil;
          }
        }
        return nextMap;
      });
    }, Math.max(80, nextExpireAt - now + 20));

    return () => {
      window.clearTimeout(timer);
    };
  }, [pendingBuyOrderHighlightUntilMap]);

  useEffect(() => {
    const now = Date.now();
    const activeHighlights = Object.values(buyOrderListHighlightUntilMap).filter((highlightUntil) => highlightUntil > now);
    if (activeHighlights.length === 0) {
      return;
    }

    const nextExpireAt = Math.min(...activeHighlights);
    const timer = window.setTimeout(() => {
      const current = Date.now();
      setBuyOrderListHighlightUntilMap((previousMap) => {
        const nextMap: Record<string, number> = {};
        for (const [orderId, highlightUntil] of Object.entries(previousMap)) {
          if (highlightUntil > current) {
            nextMap[orderId] = highlightUntil;
          }
        }
        return nextMap;
      });
    }, Math.max(80, nextExpireAt - now + 20));

    return () => {
      window.clearTimeout(timer);
    };
  }, [buyOrderListHighlightUntilMap]);

  useEffect(() => {
    if (!isStoreFilterOpen) {
      return;
    }

    const handleMouseDown = (event: MouseEvent) => {
      const root = storeFilterDropdownRef.current;
      if (!root) {
        return;
      }
      if (!root.contains(event.target as Node)) {
        setIsStoreFilterOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsStoreFilterOpen(false);
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isStoreFilterOpen]);

  useEffect(() => {
    if (!manualConfirmModalOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeManualConfirmModal();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [closeManualConfirmModal, manualConfirmModalOpen]);

  useEffect(() => {
    const now = Date.now();
    const activeHighlights = events
      .map((item) => item.highlightUntil)
      .filter((until) => until > now);

    if (activeHighlights.length === 0) {
      return;
    }

    const nextExpiryAt = Math.min(...activeHighlights);
    const waitMs = Math.max(80, nextExpiryAt - now + 20);

    const timer = window.setTimeout(() => {
      setEvents((previous) => {
        const current = Date.now();
        return previous.map((item) => {
          if (item.highlightUntil > current) {
            return item;
          }
          if (item.highlightUntil === 0) {
            return item;
          }
          return {
            ...item,
            highlightUntil: 0,
          };
        });
      });
    }, waitMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [events]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((left, right) => {
      return (
        toTimestamp(right.data.publishedAt || right.receivedAt) -
        toTimestamp(left.data.publishedAt || left.receivedAt)
      );
    });
  }, [events]);

  const summary = useMemo(() => {
    const counts = new Map<string, number>();
    let totalKrw = 0;
    let totalUsdt = 0;
    let confirmedAmountKrw = 0;
    let confirmedAmountUsdt = 0;

    for (const item of sortedEvents) {
      const status = String(item.data.statusTo || "unknown");
      counts.set(status, (counts.get(status) || 0) + 1);
      const amountKrw = Number(item.data.amountKrw || 0);
      const amountUsdt = Number(item.data.amountUsdt || 0);
      totalKrw += amountKrw;
      totalUsdt += amountUsdt;

      if (status === "paymentConfirmed") {
        confirmedAmountKrw += amountKrw;
        confirmedAmountUsdt += amountUsdt;
      }
    }

    return {
      totalKrw,
      totalUsdt,
      confirmedCount: counts.get("paymentConfirmed") || 0,
      confirmedAmountKrw,
      confirmedAmountUsdt,
      latestStatus: sortedEvents[0]?.data.statusTo || "-",
    };
  }, [sortedEvents]);

  const todayTotals = todaySummary || {
    dateKst: getKstDateKey(new Date(countdownNowMs)),
    confirmedCount: 0,
    confirmedAmountKrw: 0,
    confirmedAmountUsdt: 0,
    pgFeeAmountKrw: 0,
    pgFeeAmountUsdt: 0,
    updatedAt: new Date().toISOString(),
  };
  const animatedTodayConfirmedCount = useCountUpValue(todayTotals.confirmedCount);
  const animatedTodayConfirmedAmountKrw = useCountUpValue(todayTotals.confirmedAmountKrw);
  const animatedTodayConfirmedAmountUsdt = useCountUpValue(todayTotals.confirmedAmountUsdt, 3);
  const animatedTodayPgFeeAmountKrw = useCountUpValue(todayTotals.pgFeeAmountKrw);
  const animatedTodayPgFeeAmountUsdt = useCountUpValue(todayTotals.pgFeeAmountUsdt, 3);
  const todayDateLabelKst = useMemo(() => getKstDateLabel(new Date(countdownNowMs)), [countdownNowMs]);
  const remainingMsToday = useMemo(() => getRemainingKstMs(countdownNowMs), [countdownNowMs]);
  const countdownLabel = useMemo(() => formatCountdownHms(remainingMsToday), [remainingMsToday]);
  const remainingDayRatio = Math.max(0, Math.min(100, (remainingMsToday / ONE_DAY_MS) * 100));
  const confirmedCountRatio = summary.confirmedCount > 0
    ? Math.max(8, Math.min(100, (todayTotals.confirmedCount / summary.confirmedCount) * 100))
    : 8;
  const confirmedAmountKrwRatio = summary.confirmedAmountKrw > 0
    ? Math.max(8, Math.min(100, (todayTotals.confirmedAmountKrw / summary.confirmedAmountKrw) * 100))
    : 8;
  const pgFeeRatio = todayTotals.confirmedAmountUsdt > 0
    ? Math.max(8, Math.min(100, (todayTotals.pgFeeAmountUsdt / todayTotals.confirmedAmountUsdt) * 100))
    : 8;
  const pgFeePercent = todayTotals.confirmedAmountUsdt > 0
    ? (todayTotals.pgFeeAmountUsdt / todayTotals.confirmedAmountUsdt) * 100
    : 0;
  const selectedStoreFilterOption = useMemo(() => {
    if (buyOrderListStoreCodeFilter === "all") {
      return null;
    }
    return buyOrderStoreOptions.find((store) => store.storeCode === buyOrderListStoreCodeFilter) || null;
  }, [buyOrderListStoreCodeFilter, buyOrderStoreOptions]);
  const manualAdminSessionExpiryInfo = useMemo(
    () => getRelativeTimeInfo(manualAdminSession.expiresAt, nowMs),
    [manualAdminSession.expiresAt, nowMs],
  );
  const selectedManualDeposits = useMemo(() => {
    if (!manualConfirmPayload) {
      return [] as RealtimeManualConfirmDeposit[];
    }

    return manualConfirmPayload.deposits.filter((deposit) => selectedManualDepositIds.includes(deposit.id));
  }, [manualConfirmPayload, selectedManualDepositIds]);
  const selectedManualDepositTotal = useMemo(
    () => selectedManualDeposits.reduce((sum, deposit) => sum + deposit.amount, 0),
    [selectedManualDeposits],
  );
  const manualDepositAmountMatches = useMemo(() => {
    if (!manualConfirmPayload || selectedManualDepositIds.length === 0) {
      return true;
    }

    return selectedManualDepositTotal === manualConfirmPayload.order.krwAmount;
  }, [manualConfirmPayload, selectedManualDepositIds.length, selectedManualDepositTotal]);

  const manualConfirmModalLayer =
    isHydrated && manualConfirmModalOpen && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[2600] flex items-center justify-center p-3">
            <button
              type="button"
              aria-label="Close manual confirm modal"
              onClick={closeManualConfirmModal}
              className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]"
            />

            <section className="relative z-[1] flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_32px_80px_-36px_rgba(15,23,42,0.46)]">
              <div className="border-b border-slate-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(239,246,255,0.98))] px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
                      Manual Confirm
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950">수동입금확인</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      지갑 연결 없이 `paymentRequested` 주문을 결제완료로 처리하고, 필요한 경우 입금내역을 수동 매칭합니다.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void refreshManualConfirmOptions();
                      }}
                      disabled={Boolean(manualConfirmLoadingOrderId || manualConfirmSubmittingOrderId)}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      새로고침
                    </button>
                    <button
                      type="button"
                      onClick={closeManualConfirmModal}
                      disabled={Boolean(manualConfirmSubmittingOrderId)}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50/80 px-4 py-4">
                {manualConfirmLoadingOrderId && !manualConfirmPayload && (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center">
                    <p className="text-sm font-semibold text-slate-900">입금 후보를 불러오는 중입니다.</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">orderId={manualConfirmLoadingOrderId}</p>
                  </div>
                )}

                {!manualConfirmLoadingOrderId && manualConfirmErrorMessage && !manualConfirmPayload && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">
                    {manualConfirmErrorMessage}
                  </div>
                )}

                {manualConfirmPayload && (
                  <div className="space-y-4">
                    <section className="grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`h-11 w-11 shrink-0 rounded-full border border-slate-200 bg-cover bg-center ${manualConfirmPayload.order.storeLogo ? "bg-white" : "bg-slate-100"}`}
                            style={manualConfirmPayload.order.storeLogo ? { backgroundImage: `url(${manualConfirmPayload.order.storeLogo})` } : undefined}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950">
                              {manualConfirmPayload.order.storeName || manualConfirmPayload.order.storeCode || "-"}
                            </p>
                            <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                              {manualConfirmPayload.order.tradeId || manualConfirmPayload.order.orderId}
                            </p>
                          </div>
                          <span className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClassNameOnLight(manualConfirmPayload.order.status)}`}>
                            {getStatusLabel(manualConfirmPayload.order.status)}
                          </span>
                        </div>

                        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <dt className="text-slate-500">구매자</dt>
                            <dd className="mt-1 font-semibold text-slate-900">
                              {manualConfirmPayload.order.buyerName || "-"}
                            </dd>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <dt className="text-slate-500">입금계좌</dt>
                            <dd className="mt-1 font-mono font-semibold text-slate-900">
                              {manualConfirmPayload.order.buyerAccountNumber || "-"}
                            </dd>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <dt className="text-slate-500">결제수단</dt>
                            <dd className="mt-1 font-semibold uppercase text-slate-900">
                              {manualConfirmPayload.order.paymentMethod || "-"}
                            </dd>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <dt className="text-slate-500">주문금액</dt>
                            <dd className="mt-1 font-mono text-[15px] font-bold text-slate-950">
                              {formatKrw(manualConfirmPayload.order.krwAmount)} KRW
                            </dd>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <dt className="text-slate-500">전송예정</dt>
                            <dd className="mt-1 font-mono text-[15px] font-bold text-cyan-700">
                              {formatUsdt(manualConfirmPayload.order.usdtAmount)} USDT
                            </dd>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <dt className="text-slate-500">결제요청시각</dt>
                            <dd className="mt-1 text-[11px] font-semibold text-slate-900">
                              {getRelativeTimeInfo(
                                manualConfirmPayload.order.paymentRequestedAt || manualConfirmPayload.order.createdAt,
                                nowMs,
                              ).absoluteLabel}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-950">판매자 입금통장</p>
                        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
                          <p className="text-xs text-emerald-700">입금은행</p>
                          <p className="mt-1 text-sm font-semibold text-emerald-950">
                            {manualConfirmPayload.order.sellerBankName || "-"}
                          </p>
                          <p className="mt-3 text-xs text-emerald-700">계좌번호</p>
                          <p className="mt-1 font-mono text-base font-bold text-emerald-950">
                            {manualConfirmPayload.order.sellerAccountNumber || "-"}
                          </p>
                          <p className="mt-3 text-xs text-emerald-700">예금주</p>
                          <p className="mt-1 text-sm font-semibold text-emerald-950">
                            {manualConfirmPayload.order.sellerAccountHolder || "-"}
                          </p>
                        </div>

                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                          <p>
                            추천 조회일:
                            <span className="ml-1 font-mono text-slate-900">
                              {manualConfirmPayload.recommendedFromDate || "-"}
                            </span>
                          </p>
                          <p className="mt-1">
                            선택하지 않고 완료하면 입금내역 매칭 없이 주문만 결제완료 처리합니다.
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">입금 후보 목록</p>
                          <p className="mt-1 text-xs text-slate-500">
                            amount/name match를 우선 정렬했습니다. 다중 선택 가능, 합계가 주문금액과 같아야 매칭됩니다.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedManualDepositIds([]);
                          }}
                          disabled={selectedManualDepositIds.length === 0}
                          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          선택해제
                        </button>
                      </div>

                      <div className="max-h-[340px] overflow-y-auto px-4 py-3">
                        {manualConfirmPayload.deposits.length === 0 && (
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                            추천 조건으로 조회된 미매칭 입금내역이 없습니다. 필요하면 선택 없이 완료할 수 있습니다.
                          </div>
                        )}

                        {manualConfirmPayload.deposits.length > 0 && (
                          <div className="space-y-2">
                            {manualConfirmPayload.deposits.map((deposit) => {
                              const isSelected = selectedManualDepositIds.includes(deposit.id);
                              return (
                                <button
                                  key={deposit.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedManualDepositIds((previous) => (
                                      previous.includes(deposit.id)
                                        ? previous.filter((item) => item !== deposit.id)
                                        : [...previous, deposit.id]
                                    ));
                                  }}
                                  className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                                    isSelected
                                      ? "border-cyan-400 bg-cyan-50 shadow-[0_0_0_1px_rgba(6,182,212,0.18)]"
                                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
                                  }`}
                                >
                                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold ${
                                    isSelected
                                      ? "border-cyan-500 bg-cyan-500 text-white"
                                      : "border-slate-300 bg-white text-slate-400"
                                  }`}>
                                    {isSelected ? "✓" : ""}
                                  </span>

                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-semibold text-slate-900">
                                        {deposit.transactionName || "-"}
                                      </span>
                                      {deposit.isAmountMatch && (
                                        <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                                          금액일치
                                        </span>
                                      )}
                                      {deposit.isNameMatch && (
                                        <span className="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-800">
                                          입금자일치
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                                      <span className="font-mono">{deposit.bankAccountNumber || "-"}</span>
                                      <span>{getRelativeTimeInfo(deposit.transactionDate, nowMs).absoluteLabel}</span>
                                      <span className="font-mono">bal {formatKrw(deposit.balance)} KRW</span>
                                      {deposit.memo ? <span>memo {deposit.memo}</span> : null}
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <p className="font-mono text-[15px] font-bold text-slate-950">
                                      {formatKrw(deposit.amount)}
                                    </p>
                                    <p className="mt-1 font-mono text-[10px] text-slate-400">{deposit.id}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-500">선택 입금 합계</p>
                      <p className="mt-0.5 font-mono text-base font-bold text-slate-950">
                        {formatKrw(selectedManualDepositTotal)} KRW
                      </p>
                    </div>
                    <div className={`rounded-2xl border px-3 py-2 ${
                      manualDepositAmountMatches
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}>
                      <p className="text-[11px]">주문금액 일치 여부</p>
                      <p className="mt-0.5 font-semibold">
                        {selectedManualDepositIds.length === 0
                          ? "선택 없음"
                          : manualDepositAmountMatches
                            ? "일치"
                            : "불일치"}
                      </p>
                    </div>
                    {manualConfirmErrorMessage && (
                      <p className="text-sm font-medium text-rose-700">{manualConfirmErrorMessage}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void handleManualConfirmSubmit();
                    }}
                    disabled={Boolean(manualConfirmLoadingOrderId || manualConfirmSubmittingOrderId)}
                    className="rounded-full bg-[linear-gradient(135deg,#0f766e,#2563eb)] px-5 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_-18px_rgba(37,99,235,0.6)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {manualConfirmSubmittingOrderId ? "처리중..." : "결제완료 처리"}
                  </button>
                </div>
              </div>
            </section>
          </div>,
          document.body,
        )
      : null;

  const jackpotOverlayLayer =
    isHydrated && typeof document !== "undefined"
      ? createPortal(
          jackpotBursts.map((burst) => (
            <div key={burst.id} className="jackpot-overlay pointer-events-none fixed inset-0 z-[2500]">
              <div className="party-backdrop" />
              <div className="party-flash" />

              <div className="party-streamers">
                {partyStreamerBlueprint.map((streamer, index) => (
                  <span
                    key={`${burst.id}-streamer-${index}`}
                    className="party-streamer"
                    style={
                      {
                        left: `${streamer.left}%`,
                        animationDelay: `${streamer.delay}ms`,
                        animationDuration: `${streamer.duration}ms`,
                        "--stream-tilt": `${streamer.tilt}deg`,
                        "--stream-color": streamer.color,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>

              <div className="party-fireworks">
                {partyFireworkBlueprint.map((firework, fireworkIndex) => (
                  <span
                    key={`${burst.id}-firework-${fireworkIndex}`}
                    className="party-firework"
                    style={
                      {
                        left: `${firework.left}%`,
                        top: `${firework.top}%`,
                        animationDelay: `${firework.delay}ms`,
                        "--firework-scale": String(firework.scale),
                        "--firework-color": firework.color,
                      } as React.CSSProperties
                    }
                  >
                    {Array.from({ length: PARTY_FIREWORK_RAY_COUNT }).map((_, rayIndex) => (
                      <i
                        key={`${burst.id}-firework-${fireworkIndex}-ray-${rayIndex}`}
                        className="party-firework-ray"
                        style={{ transform: `rotate(${(360 / PARTY_FIREWORK_RAY_COUNT) * rayIndex}deg)` }}
                      />
                    ))}
                  </span>
                ))}
              </div>

              <div className="party-confetti">
                {partyConfettiBlueprint.map((particle, index) => (
                  <span
                    key={`${burst.id}-confetti-${index}`}
                    className="party-confetti-piece"
                    style={
                      {
                        left: `${particle.left}%`,
                        animationDelay: `${particle.delay}ms`,
                        animationDuration: `${particle.duration}ms`,
                        width: `${particle.width}px`,
                        height: `${particle.height}px`,
                        background: particle.color,
                        "--confetti-sway": `${particle.sway}px`,
                        "--confetti-spin": `${particle.spin}deg`,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>

              <div className="party-center">
                <p className="party-title">PAYMENT CONFIRMED</p>
                <p className="party-subtitle">{formatUsdt(burst.amountUsdt)} USDT · {burst.storeLabel}</p>
              </div>
            </div>
          )),
          document.body,
        )
      : null;

  return (
    <main className="w-full max-w-[1680px] space-y-4 pt-20 text-slate-100">
      <RealtimeTopNav lang={lang} current="buyorder" />
      {manualConfirmModalLayer}
      {jackpotOverlayLayer}

      <section className="overflow-hidden rounded-xl border border-slate-700/70 bg-[linear-gradient(160deg,rgba(14,116,144,0.22),rgba(2,6,23,0.96)_48%)] p-4 shadow-[0_14px_38px_-24px_rgba(6,182,212,0.35)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-cyan-100">BuyOrder Realtime Dashboard</h1>
          </div>

          <div className="w-full max-w-[920px] space-y-1.5">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => void syncFromApi(null)}
                className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSyncing}
              >
                {isSyncing ? "재동기화 중..." : "재동기화"}
              </button>
            </div>

            <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
              <article className="relative overflow-hidden rounded-lg border border-violet-300/35 bg-gradient-to-br from-indigo-500/22 via-violet-500/14 to-slate-950/72 px-2.5 py-2.5 shadow-[0_10px_24px_-20px_rgba(99,102,241,0.75)]">
                <div className="pointer-events-none absolute -right-10 -top-8 h-24 w-24 rounded-full bg-violet-300/25 blur-2xl" />
                <p className="relative text-[10px] uppercase tracking-[0.1em] text-violet-100/90">오늘 날짜 (KST)</p>
                <p className="relative mt-1 text-base font-semibold leading-tight text-violet-50">{todayDateLabelKst}</p>
                <div className="relative mt-1.5 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-violet-100/80">오늘 남은 시간</p>
                    <p className="mt-1 font-mono text-xl font-semibold leading-none tabular-nums text-violet-50 animate-pulse">
                      {countdownLabel}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-violet-300/45 bg-violet-400/20 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-violet-50">
                    COUNTDOWN
                  </span>
                </div>
                <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-violet-100/30">
                  <div
                    className="h-full rounded-full bg-violet-300 transition-all duration-700"
                    style={{ width: `${remainingDayRatio}%` }}
                  />
                </div>
              </article>

              <article className="relative overflow-hidden rounded-lg border border-sky-400/35 bg-gradient-to-br from-sky-500/20 via-cyan-500/12 to-slate-950/70 px-2.5 py-2.5 shadow-[0_10px_24px_-20px_rgba(14,165,233,0.75)]">
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-300/20 blur-2xl" />
                <p className="relative text-[10px] uppercase tracking-[0.1em] text-sky-100/85">오늘 결제완료 거래건수 (KST)</p>
                <p className="relative mt-1 text-xl font-semibold leading-tight tabular-nums text-sky-50">
                  {animatedTodayConfirmedCount.toLocaleString("ko-KR")}
                  <span className="ml-1 text-xs font-medium text-sky-200/90">건</span>
                </p>
                <div className="relative mt-1 flex items-center justify-end text-[11px]">
                  <span className="inline-flex rounded-full border border-sky-300/40 bg-sky-400/20 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-sky-50">
                    LIVE
                  </span>
                </div>
                <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-sky-100/30">
                  <div
                    className="h-full rounded-full bg-sky-300 transition-all duration-500"
                    style={{ width: `${confirmedCountRatio}%` }}
                  />
                </div>
              </article>

              <article className="relative overflow-hidden rounded-lg border border-emerald-400/35 bg-gradient-to-br from-emerald-500/20 via-emerald-500/12 to-slate-950/70 px-2.5 py-2.5 shadow-[0_10px_24px_-20px_rgba(16,185,129,0.75)]">
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-300/20 blur-2xl" />
                <p className="relative text-[10px] uppercase tracking-[0.1em] text-emerald-100/85">오늘 결제완료 거래금액 (KST)</p>
                <p className="relative mt-1 text-xl font-semibold leading-tight tabular-nums text-emerald-50">
                  {formatKrw(animatedTodayConfirmedAmountKrw)}
                  <span className="ml-1 text-xs font-medium text-emerald-200/90">KRW</span>
                </p>
                <div className="relative mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-100/90">{formatUsdt(animatedTodayConfirmedAmountUsdt)} USDT</span>
                  <span className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-400/20 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-50">
                    LIVE
                  </span>
                </div>
                <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-emerald-100/30">
                  <div
                    className="h-full rounded-full bg-emerald-300 transition-all duration-500"
                    style={{ width: `${confirmedAmountKrwRatio}%` }}
                  />
                </div>
              </article>

              <article className="relative overflow-hidden rounded-lg border border-amber-300/45 bg-gradient-to-br from-amber-500/22 via-orange-500/14 to-slate-950/70 px-2.5 py-2.5 shadow-[0_10px_24px_-20px_rgba(245,158,11,0.75)]">
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-300/20 blur-2xl" />
                <p className="relative text-[10px] uppercase tracking-[0.1em] text-amber-100/90">오늘 PG 수수료 (KST)</p>
                <p className="relative mt-1 text-xl font-semibold leading-tight tabular-nums text-amber-50">
                  {formatKrw(animatedTodayPgFeeAmountKrw)}
                  <span className="ml-1 text-xs font-medium text-amber-200/90">KRW</span>
                </p>
                <div className="relative mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-amber-100/90">{formatUsdt(animatedTodayPgFeeAmountUsdt)} USDT</span>
                  <span className="inline-flex rounded-full border border-amber-300/40 bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-amber-50">
                    {pgFeePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-amber-100/30">
                  <div
                    className="h-full rounded-full bg-amber-300 transition-all duration-500"
                    style={{ width: `${pgFeeRatio}%` }}
                  />
                </div>
              </article>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/65 px-2 py-1.5 text-xs text-slate-200">
            Connection <span className="ml-2 font-semibold text-cyan-200">{connectionState}</span>
          </div>
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/65 px-2 py-1.5 text-xs text-slate-200">
            Sync <span className="ml-2 font-semibold text-cyan-200">{isSyncing ? "running" : "idle"}</span>
          </div>
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/65 px-2 py-1.5 text-xs text-slate-200">
            Cursor <span className="ml-2 break-all font-mono text-xs text-cyan-200">{cursor || "-"}</span>
          </div>
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/65 px-2 py-1.5 text-xs text-slate-200">
            Last Status <span className="ml-2 font-semibold text-cyan-200">{getStatusLabel(summary.latestStatus)}</span>
          </div>
        </div>

        <div className="mt-2 rounded-lg border border-slate-700/70 bg-slate-950/55 px-2.5 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold text-cyan-100">판매자 지갑 USDT 잔고 (LIVE)</p>
            <p className="text-[10px] text-slate-400">
              updated {getRelativeTimeInfo(sellerWalletBalancesUpdatedAt, nowMs).relativeLabel}
            </p>
          </div>
          {sellerWalletBalances.length === 0 && (
            <p className="mt-1 rounded border border-slate-800 bg-slate-900/70 px-2 py-1 text-[11px] text-slate-500">
              seller.walletAddress 데이터가 없습니다.
            </p>
          )}
          {sellerWalletBalances.length > 0 && (
            <div className="mt-1.5 max-h-36 space-y-1 overflow-y-auto pr-1">
              {sellerWalletBalances.map((item, index) => {
                const latestInfo = getRelativeTimeInfo(item.latestOrderCreatedAt, nowMs);
                return (
                  <div
                    key={`seller-wallet-balance-${item.walletAddress}-${index}`}
                    className="grid grid-cols-[26px_minmax(0,1.3fr)_minmax(0,1fr)_74px_78px] items-center gap-1 rounded border border-slate-800/80 bg-slate-900/75 px-1.5 py-1 text-[10px]"
                  >
                    <span className="font-mono text-slate-500">{String(index + 1).padStart(2, "0")}</span>
                    <span className="truncate font-mono text-cyan-200" title={item.walletAddress}>
                      {formatShortWalletAddress(item.walletAddress)}
                    </span>
                    <span className="truncate text-right font-mono tabular-nums text-emerald-200">
                      {formatUsdt(item.currentUsdtBalance)} USDT
                    </span>
                    <span className="truncate text-right text-slate-300">{item.orderCount.toLocaleString("ko-KR")}건</span>
                    <span className="truncate text-right text-slate-500" title={latestInfo.absoluteLabel}>
                      {latestInfo.relativeLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {connectionErrorMessage && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/55 px-3 py-2 text-sm text-rose-200">
          {connectionErrorMessage}
        </div>
      )}

      {syncErrorMessage && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/55 px-3 py-2 text-sm text-rose-200">
          {syncErrorMessage}
        </div>
      )}

      {todaySummaryErrorMessage && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/45 px-3 py-2 text-sm text-amber-200">
          오늘 결제완료 집계 조회 실패: {todaySummaryErrorMessage}
        </div>
      )}

      {pendingBuyOrdersErrorMessage && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/45 px-3 py-2 text-sm text-amber-200">
          진행중 구매주문 목록 조회 실패: {pendingBuyOrdersErrorMessage}
        </div>
      )}

      {buyOrderListErrorMessage && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/45 px-3 py-2 text-sm text-amber-200">
          구매주문 목록 조회 실패: {buyOrderListErrorMessage}
        </div>
      )}

      {sellerWalletBalancesErrorMessage && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/45 px-3 py-2 text-sm text-amber-200">
          판매자 지갑 잔고 조회 실패: {sellerWalletBalancesErrorMessage}
        </div>
      )}

      <section className="grid gap-2.5 xl:grid-cols-[minmax(0,0.62fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-2xl border border-amber-300/70 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.3),rgba(255,251,235,0.97)_38%),linear-gradient(160deg,rgba(255,255,255,0.98),rgba(250,245,255,0.94))] shadow-[0_16px_40px_-28px_rgba(217,119,6,0.42)]">
          <div className="pointer-events-none absolute -left-8 top-4 h-20 w-20 rounded-full bg-amber-300/35 blur-2xl" />
          <div className="pointer-events-none absolute -right-8 bottom-10 h-24 w-24 rounded-full bg-sky-300/25 blur-2xl" />

          <div className="relative border-b border-amber-300/40 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-amber-700/80">Live Pending</p>
                <p className="mt-0.5 text-sm font-semibold text-amber-950">진행중 구매주문 목록</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded border border-amber-400/60 bg-amber-200/65 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                  JACKPOT {pendingBuyOrdersTotalCount.toLocaleString("ko-KR")}
                </span>
                <span className="rounded border border-cyan-400/60 bg-cyan-200/65 px-2 py-0.5 text-[11px] font-semibold text-cyan-900">
                  REEL {pendingBuyOrders.length.toLocaleString("ko-KR")}
                </span>
              </div>
            </div>
            <p className="mt-1 font-mono text-[11px] text-amber-900/70">
              ordered / accepted / paymentRequested · updated {getRelativeTimeInfo(pendingBuyOrdersUpdatedAt, nowMs).relativeLabel}
            </p>

            <div className="mt-2 rounded-lg border border-amber-300/55 bg-white/85 p-2 shadow-[inset_0_0_16px_rgba(251,191,36,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-amber-800/80">Action Dock</p>
                  <p className="mt-0.5 text-xs font-semibold text-amber-950">수동입금확인 관리자 잠금</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  manualAdminSession.enabled
                    ? manualAdminSession.authenticated
                      ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border border-amber-300 bg-amber-50 text-amber-800"
                    : "border border-slate-300 bg-slate-100 text-slate-600"
                }`}>
                  {manualAdminSession.enabled
                    ? manualAdminSession.authenticated
                      ? "UNLOCKED"
                      : "LOCKED"
                    : "DISABLED"}
                </span>
              </div>

              {!manualAdminSession.enabled && (
                <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">
                  `REALTIME_BUYORDER_ADMIN_PASSWORD` 환경변수를 설정하면 이 화면에서도 지갑 연결 없이 수동입금확인이 가능합니다.
                </p>
              )}

              {manualAdminSession.enabled && !manualAdminSession.authenticated && (
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="password"
                    value={manualAdminPassword}
                    onChange={(event) => {
                      setManualAdminPassword(event.target.value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleManualAdminLogin();
                      }
                    }}
                    placeholder="관리자 비밀번호"
                    className="h-9 flex-1 rounded-md border border-amber-300/70 bg-white px-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void handleManualAdminLogin();
                    }}
                    disabled={isManualAdminSessionLoading}
                    className="h-9 rounded-md border border-amber-400/70 bg-amber-100 px-3 text-xs font-semibold text-amber-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isManualAdminSessionLoading ? "확인중..." : "잠금해제"}
                  </button>
                </div>
              )}

              {manualAdminSession.enabled && manualAdminSession.authenticated && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-emerald-900">
                      수동입금확인 활성화됨
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-emerald-700">
                      session expires {manualAdminSessionExpiryInfo.relativeLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void handleManualAdminLogout();
                    }}
                    disabled={isManualAdminSessionLoading}
                    className="rounded-md border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    잠금종료
                  </button>
                </div>
              )}

              {actionDockNotice && (
                <div className={`mt-2 rounded-md border px-2.5 py-2 text-[11px] font-medium ${getActionDockNoticeClassName(actionDockNotice.tone)}`}>
                  {actionDockNotice.message}
                </div>
              )}
            </div>
          </div>

          <div className="relative max-h-[780px] space-y-1 overflow-y-auto bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.95)_0px,rgba(255,255,255,0.95)_30px,rgba(255,247,237,0.95)_30px,rgba(255,247,237,0.95)_60px)] p-2">
            {pendingBuyOrders.length === 0 && (
              <div className="rounded-xl border border-amber-300/70 bg-white/95 px-3 py-8 text-center">
                <p className="font-mono text-xs text-amber-900/85">[IDLE] 슬롯에 올라온 진행중 주문이 없습니다.</p>
              </div>
            )}

            {pendingBuyOrders.length > 0 && (
              <div className="space-y-1">
                {pendingBuyOrders.map((order, index) => {
                  const createdAtInfo = getRelativeTimeInfo(order.createdAt, nowMs);
                  const lineNo = String(index + 1).padStart(3, "0");
                  const storeLabel = order.storeName || order.storeCode || "-";
                  const buyerLabel = maskName(order.buyerName);
                  const hasStoreLogo = Boolean(order.storeLogo);
                  const copied = Boolean(order.tradeId && copiedTradeId === order.tradeId);
                  const rowId = String(order.orderId || order.tradeId || "").trim();
                  const isHighlighted = rowId ? (pendingBuyOrderHighlightUntilMap[rowId] || 0) > Date.now() : false;

                  return (
                    <article
                      key={`pending-order-${order.orderId || index}`}
                      className={`grid grid-cols-[74px_88px_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)] items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] transition-all duration-500 ${
                        isHighlighted
                          ? "new-record-row-highlight border-cyan-300/80 bg-cyan-50/95 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.3)]"
                          : "border-amber-200/80 bg-white/95 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.12)]"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="shrink-0 rounded border border-amber-300/70 bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-900">
                          {lineNo}
                        </span>
                        <span className={`truncate rounded px-1.5 py-0.5 text-[10px] font-semibold ${getStatusClassNameOnLight(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                        {isHighlighted && (
                          <span className="new-record-pill animate-pulse rounded border border-cyan-300 bg-cyan-100 px-1 py-0.5 font-mono text-[9px] font-semibold text-cyan-800">
                            NEW
                          </span>
                        )}
                      </div>

                      <div className="flex min-w-0 flex-col items-center gap-1 text-center">
                        <span
                          className={`h-6 w-6 shrink-0 rounded-full border border-amber-300/75 bg-cover bg-center ${hasStoreLogo ? "bg-white" : "bg-amber-100"}`}
                          style={hasStoreLogo ? { backgroundImage: `url(${order.storeLogo})` } : undefined}
                        />
                        <span className="min-w-0 truncate text-[11px] font-semibold leading-tight text-slate-900" title={storeLabel}>
                          {storeLabel}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-mono text-[12px] font-bold leading-none tabular-nums text-amber-950">
                          {formatKrw(order.amountKrw)} KRW
                        </p>
                        <p className="mt-0.5 truncate font-mono text-[10px] leading-none text-cyan-700">
                          {formatUsdt(order.amountUsdt)} USDT
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-900">{buyerLabel}</p>
                      </div>

                      <div className="min-w-0 text-right">
                        {order.tradeId && (
                          <button
                            type="button"
                            onClick={() => {
                              void handleCopyTradeId(order.tradeId);
                            }}
                            title="tradeId 복사"
                            className={`block max-w-full truncate font-mono text-[10px] underline underline-offset-2 transition ${
                              copied ? "text-emerald-700 decoration-emerald-500" : "text-cyan-700 decoration-cyan-500 hover:text-cyan-900"
                            }`}
                          >
                            {order.tradeId}
                          </button>
                        )}
                        {!order.tradeId && <span className="font-mono text-[10px] text-slate-400">-</span>}
                      </div>

                      <div className="min-w-0 text-right">
                        <span className={`inline-flex rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${getRelativeTimeToneClassNameOnLight(createdAtInfo.tone)}`}>
                          {createdAtInfo.relativeLabel}
                        </span>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
                          {createdAtInfo.absoluteLabel}
                        </p>
                        {order.status === "paymentRequested" && (
                          <button
                            type="button"
                            onClick={() => {
                              void loadManualConfirmOptions(order.orderId);
                            }}
                            disabled={Boolean(manualConfirmLoadingOrderId || manualConfirmSubmittingOrderId)}
                            className="mt-1 inline-flex rounded border border-cyan-300 bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {manualConfirmLoadingOrderId === order.orderId ? "확인중..." : "수동입금"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-300/70 bg-white/95 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.28)]">
          <div className="border-b border-slate-200/80 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">구매주문 목록</p>
              <span className="rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                총 {buyOrderListTotalCount.toLocaleString("ko-KR")}건
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              updated {getRelativeTimeInfo(buyOrderListUpdatedAt, nowMs).relativeLabel}
            </p>

            <form
              onSubmit={handleBuyOrderListSearchSubmit}
              className="mt-2 grid gap-1.5 sm:grid-cols-[108px_168px_minmax(0,1fr)_72px_72px]"
            >
              <select
                value={buyOrderListStatusFilter}
                onChange={(event) => {
                  setBuyOrderListStatusFilter(event.target.value as BuyOrderListStatusFilter);
                  setBuyOrderListPage(1);
                }}
                className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none transition focus:border-cyan-400"
              >
                {BUYORDER_LIST_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div ref={storeFilterDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsStoreFilterOpen((previous) => !previous);
                  }}
                  className="flex h-8 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none transition focus:border-cyan-400"
                  aria-haspopup="listbox"
                  aria-expanded={isStoreFilterOpen}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className={`h-4 w-4 shrink-0 rounded-full border border-slate-200 bg-cover bg-center ${selectedStoreFilterOption?.storeLogo ? "bg-white" : "bg-slate-100"}`}
                      style={selectedStoreFilterOption?.storeLogo ? { backgroundImage: `url(${selectedStoreFilterOption.storeLogo})` } : undefined}
                    />
                    <span className="min-w-0 truncate">
                      {selectedStoreFilterOption?.storeName || selectedStoreFilterOption?.storeCode || "전체 가맹점"}
                    </span>
                  </span>
                  <span className="ml-1 flex shrink-0 items-center gap-1 font-mono text-[10px] text-slate-400">
                    <span>{selectedStoreFilterOption?.storeCode || "ALL"}</span>
                    <span className={`text-[9px] text-slate-500 transition ${isStoreFilterOpen ? "rotate-180" : ""}`}>▼</span>
                  </span>
                </button>

                {isStoreFilterOpen && (
                  <div className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-md border border-slate-300 bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.45)]">
                    <div className="max-h-64 overflow-y-auto py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setBuyOrderListStoreCodeFilter("all");
                          setBuyOrderListPage(1);
                          setIsStoreFilterOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-2 py-1.5 text-left text-xs transition ${buyOrderListStoreCodeFilter === "all" ? "bg-cyan-50 text-cyan-800" : "text-slate-700 hover:bg-slate-50"}`}
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="h-4 w-4 shrink-0 rounded-full border border-slate-200 bg-slate-100" />
                          <span className="truncate">전체 가맹점</span>
                        </span>
                        <span className="ml-2 shrink-0 font-mono text-[10px] text-slate-400">ALL</span>
                      </button>

                      {buyOrderStoreOptions.map((store) => {
                        const isSelected = buyOrderListStoreCodeFilter === store.storeCode;
                        const storeLabel = store.storeName || store.storeCode;
                        return (
                          <button
                            key={store.storeCode}
                            type="button"
                            onClick={() => {
                              setBuyOrderListStoreCodeFilter(store.storeCode);
                              setBuyOrderListPage(1);
                              setIsStoreFilterOpen(false);
                            }}
                            className={`flex w-full items-center justify-between px-2 py-1.5 text-left text-xs transition ${isSelected ? "bg-cyan-50 text-cyan-800" : "text-slate-700 hover:bg-slate-50"}`}
                          >
                            <span className="flex min-w-0 items-center gap-1.5">
                              <span
                                className={`h-4 w-4 shrink-0 rounded-full border border-slate-200 bg-cover bg-center ${store.storeLogo ? "bg-white" : "bg-slate-100"}`}
                                style={store.storeLogo ? { backgroundImage: `url(${store.storeLogo})` } : undefined}
                              />
                              <span className="min-w-0 truncate">{storeLabel}</span>
                            </span>
                            <span className="ml-2 shrink-0 font-mono text-[10px] text-slate-400">{store.storeCode}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <input
                value={buyOrderListQueryInput}
                onChange={(event) => {
                  setBuyOrderListQueryInput(event.target.value);
                }}
                placeholder="tradeId/입금자 검색"
                className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-400"
              />
              <button
                type="submit"
                className="h-8 rounded-md border border-cyan-300 bg-cyan-50 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100"
              >
                검색
              </button>
              <button
                type="button"
                onClick={handleBuyOrderListFilterReset}
                className="h-8 rounded-md border border-slate-300 bg-slate-100 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                초기화
              </button>
            </form>
          </div>

          <div className="max-h-[780px] space-y-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.96))] p-2">
            {buyOrderListItems.length === 0 && (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-8 text-center text-xs text-slate-500">
                {isBuyOrderListLoading ? "[LOADING] 목록을 불러오는 중..." : "[EMPTY] 조건에 맞는 주문이 없습니다."}
              </div>
            )}

            {buyOrderListItems.length > 0 && (
              <div className="space-y-1">
                {buyOrderListItems.map((item, index) => {
                  const storeLabel = item.storeName || item.storeCode || "-";
                  const buyerLabel = maskName(item.buyerName);
                  const createdAtInfo = getRelativeTimeInfo(item.createdAt, nowMs);
                  const rowNo = String((buyOrderListPage - 1) * BUYORDER_LIST_PAGE_LIMIT + index + 1).padStart(3, "0");
                  const copied = Boolean(item.tradeId && copiedTradeId === item.tradeId);
                  const rowId = String(item.orderId || item.tradeId || "").trim();
                  const isHighlighted = rowId ? (buyOrderListHighlightUntilMap[rowId] || 0) > Date.now() : false;

                  return (
                    <article
                      key={`buyorder-list-${item.orderId || index}`}
                      className={`grid grid-cols-[84px_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,0.78fr)_minmax(0,1.2fr)_minmax(0,1fr)] items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] transition-all duration-500 ${
                        isHighlighted
                          ? "new-record-row-highlight border-cyan-300/80 bg-cyan-50 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.3)]"
                          : "border-slate-200 bg-white shadow-[inset_0_0_0_1px_rgba(148,163,184,0.06)]"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="font-mono text-[10px] text-slate-400">{rowNo}</span>
                        <span className={`truncate rounded px-1.5 py-0.5 text-[10px] font-semibold ${getStatusClassNameOnLight(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                        {isHighlighted && (
                          <span className="new-record-pill animate-pulse rounded border border-cyan-300 bg-cyan-100 px-1 py-0.5 font-mono text-[9px] font-semibold text-cyan-800">
                            NEW
                          </span>
                        )}
                      </div>

                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`h-6 w-6 shrink-0 rounded-full border border-slate-200 bg-cover bg-center ${item.storeLogo ? "bg-white" : "bg-slate-100"}`}
                          style={item.storeLogo ? { backgroundImage: `url(${item.storeLogo})` } : undefined}
                        />
                        <span className="min-w-0 truncate text-[12px] font-medium text-slate-900" title={storeLabel}>
                          {storeLabel}
                        </span>
                      </div>

                      <div className="min-w-0 text-right">
                        <p className="truncate font-mono text-[12px] font-semibold leading-none tabular-nums text-slate-900">
                          {formatKrw(item.amountKrw)} KRW
                        </p>
                        <p className="truncate font-mono text-[10px] leading-none text-cyan-700">
                          {formatUsdt(item.amountUsdt)} USDT
                        </p>
                      </div>

                      <div className="min-w-0 truncate text-[12px] font-medium text-slate-900">{buyerLabel}</div>

                      <div className="min-w-0 text-right">
                        {item.tradeId && (
                          <button
                            type="button"
                            onClick={() => {
                              void handleCopyTradeId(item.tradeId);
                            }}
                            title="tradeId 복사"
                            className={`block max-w-full truncate font-mono text-[10px] underline underline-offset-2 transition ${
                              copied ? "text-emerald-700 decoration-emerald-500" : "text-cyan-700 decoration-cyan-500 hover:text-cyan-900"
                            }`}
                          >
                            {item.tradeId}
                          </button>
                        )}
                        {!item.tradeId && <span className="font-mono text-[10px] text-slate-400">-</span>}
                      </div>

                      <div className="min-w-0 text-right">
                        <span className={`inline-flex rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${getRelativeTimeToneClassNameOnLight(createdAtInfo.tone)}`}>
                          {createdAtInfo.relativeLabel}
                        </span>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
                          {createdAtInfo.absoluteLabel}
                        </p>
                        {item.status === "paymentRequested" && (
                          <button
                            type="button"
                            onClick={() => {
                              void loadManualConfirmOptions(item.orderId);
                            }}
                            disabled={Boolean(manualConfirmLoadingOrderId || manualConfirmSubmittingOrderId)}
                            className="mt-1 inline-flex rounded border border-cyan-300 bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {manualConfirmLoadingOrderId === item.orderId ? "확인중..." : "수동입금"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/80 bg-white px-3 py-2">
            <p className="text-[11px] text-slate-600">
              page {buyOrderListPage} / {buyOrderListTotalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setBuyOrderListPage((previous) => Math.max(1, previous - 1));
                }}
                disabled={buyOrderListPage <= 1 || isBuyOrderListLoading}
                className="h-7 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                이전
              </button>
              <button
                type="button"
                onClick={() => {
                  setBuyOrderListPage((previous) => Math.min(buyOrderListTotalPages, previous + 1));
                }}
                disabled={buyOrderListPage >= buyOrderListTotalPages || isBuyOrderListLoading}
                className="h-7 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/75 shadow-lg shadow-black/20">
          <div className="border-b border-slate-700/80 px-4 py-3">
            <p className="font-semibold text-slate-100">실시간 BuyOrder 시스템 로그</p>
            <p className="mt-1 font-mono text-[11px] text-slate-500">tail -f /var/log/buyorder/realtime.log</p>
          </div>

          <div className="border-b border-slate-800/80 bg-slate-950/85 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
              <span className="ml-2 font-mono text-[11px] text-slate-500">buyorder-realtime@{connectionState}</span>
            </div>
          </div>

          <div className="max-h-[780px] space-y-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(2,6,23,0.95),rgba(2,6,23,0.92))] p-3">
            {sortedEvents.length === 0 && (
              <div className="rounded-lg border border-slate-800/80 bg-slate-950/70 px-3 py-8 text-center font-mono text-xs text-slate-500">
                [WAITING] 아직 수신된 이벤트가 없습니다.
              </div>
            )}

            {sortedEvents.map((item, index) => {
              const fromLabel = item.data.statusFrom ? getStatusLabel(item.data.statusFrom) : "초기";
              const toLabel = getStatusLabel(item.data.statusTo);
              const isHighlighted = item.highlightUntil > Date.now();
              const isJackpotEvent = isPaymentConfirmedStatus(item.data.statusTo);
              const timeInfo = getRelativeTimeInfo(item.data.publishedAt || item.receivedAt, nowMs);
              const detailTradeId = getOptionalText(item.data.tradeId);
              const detailOrderId = getOptionalText(item.data.orderId);
              const detailSource = getOptionalText(item.data.source);
              const detailTxHash = getOptionalText(item.data.transactionHash);
              const detailEscrowTxHash = getOptionalText(item.data.escrowTransactionHash);
              const detailQueueId = getOptionalText(item.data.queueId);
              const detailMinedAt = getOptionalText(item.data.minedAt);
              const detailReason = getOptionalText(item.data.reason);
              const lineNo = String(sortedEvents.length - index).padStart(4, "0");
              const statusTo = String(item.data.statusTo || "").toLowerCase();
              const level = statusTo === "cancelled" ? "WARN" : statusTo === "paymentConfirmed" ? "INFO" : "TRACE";
              const levelClassName =
                level === "WARN"
                  ? "bg-amber-500/20 text-amber-200"
                  : level === "INFO"
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "bg-slate-700/80 text-slate-200";
              const storeLabel = item.data.store?.name || item.data.store?.code || "-";

              return (
                <article
                  key={`log-${item.id}`}
                  className={`rounded-lg border px-3 py-2 transition-all duration-500 ${
                    isHighlighted
                      ? isJackpotEvent
                        ? "jackpot-row-highlight border-emerald-300/55 bg-emerald-500/14 shadow-[inset_0_0_0_1px_rgba(110,231,183,0.35)]"
                        : "border-cyan-400/45 bg-cyan-500/10 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.26)]"
                      : "border-slate-800/80 bg-slate-950/65"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-600">#{lineNo}</span>
                    <span className="text-slate-500">{timeInfo.absoluteLabel}</span>
                    <span className={`rounded px-1.5 py-0.5 font-semibold ${levelClassName}`}>{level}</span>
                    <span className={`rounded border px-1.5 py-0.5 font-semibold tabular-nums ${getRelativeTimeToneClassName(timeInfo.tone)}`}>
                      {timeInfo.relativeLabel}
                    </span>
                    {isHighlighted && (
                      <span className="animate-pulse rounded border border-cyan-400/40 bg-cyan-500/20 px-1.5 py-0.5 text-cyan-100">
                        NEW
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] leading-relaxed">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${getStatusClassName(item.data.statusFrom)}`}>
                      {fromLabel}
                    </span>
                    <span className="text-slate-500">→</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${getStatusClassName(
                        item.data.statusTo,
                      )} ${isJackpotEvent ? "jackpot-status-pill" : ""}`}
                    >
                      {toLabel}
                    </span>
                    <span className="text-cyan-300">
                      usdt=<span className="text-cyan-100">{formatUsdt(item.data.amountUsdt)}</span>
                    </span>
                    <span className="text-slate-300">
                      krw=<span className="text-slate-100">{formatKrw(item.data.amountKrw)}</span>
                    </span>
                    <span className="text-slate-400">
                      buyer={maskName(item.data.buyerName)}:{maskAccountNumber(item.data.buyerAccountNumber)}
                    </span>
                    <span className="text-cyan-300">wallet={formatShortWalletAddress(item.data.buyerWalletAddress)}</span>
                    <span className="text-slate-400">store={storeLabel}</span>
                    {detailTradeId ? <span className="text-cyan-300">tid={detailTradeId}</span> : null}
                    {detailOrderId ? <span className="text-slate-400">oid={detailOrderId}</span> : null}
                    {detailSource ? <span className="text-slate-500">source={detailSource}</span> : null}
                    {detailTxHash ? <span className="text-violet-300">tx={formatShortHash(detailTxHash)}</span> : null}
                    {detailEscrowTxHash ? <span className="text-blue-300">escrow={formatShortHash(detailEscrowTxHash)}</span> : null}
                    {detailQueueId ? <span className="text-slate-500">queue={detailQueueId}</span> : null}
                    {detailMinedAt ? <span className="text-slate-500">mined={detailMinedAt}</span> : null}
                    {detailReason ? <span className="text-rose-300">reason={detailReason}</span> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <style jsx global>{`
        .jackpot-overlay {
          animation: jackpotOverlayFade ${JACKPOT_BURST_DURATION_MS}ms ease-out both;
          overflow: hidden;
          isolation: isolate;
        }

        .party-backdrop {
          position: absolute;
          inset: 0;
          background: radial-gradient(
              circle at 50% 38%,
              rgba(16, 185, 129, 0.24) 0%,
              rgba(56, 189, 248, 0.2) 30%,
              rgba(15, 23, 42, 0.5) 68%,
              rgba(2, 6, 23, 0.66) 100%
            ),
            linear-gradient(
              125deg,
              rgba(52, 211, 153, 0.16) 0%,
              rgba(250, 204, 21, 0.14) 38%,
              rgba(244, 114, 182, 0.14) 70%,
              rgba(56, 189, 248, 0.16) 100%
            );
        }

        .party-flash {
          position: absolute;
          inset: -30% -20%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0) 64%);
          mix-blend-mode: screen;
          opacity: 0;
          animation: partyFlashPulse 760ms ease-out both;
        }

        .party-streamers {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .party-streamer {
          position: absolute;
          top: -124vh;
          width: 2px;
          height: 190vh;
          opacity: 0;
          transform: translateX(-50%) rotate(var(--stream-tilt));
          transform-origin: top center;
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.85) 0%,
            var(--stream-color) 18%,
            rgba(15, 23, 42, 0) 100%
          );
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.16);
          animation: partyStreamerDrop cubic-bezier(0.28, 0.86, 0.38, 1) both;
        }

        .party-fireworks {
          position: absolute;
          inset: 0;
        }

        .party-firework {
          position: absolute;
          width: 0;
          height: 0;
          opacity: 0;
          transform: translate(-50%, -50%) scale(var(--firework-scale));
          animation: partyFireworkBloom 820ms ease-out both;
        }

        .party-firework-ray {
          position: absolute;
          display: block;
          left: -2px;
          top: -2px;
          width: 4px;
          height: 92px;
          opacity: 0;
          transform-origin: center 2px;
          border-radius: 9999px;
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.95) 0%,
            var(--firework-color) 34%,
            rgba(15, 23, 42, 0) 100%
          );
          animation: partyFireworkRay 820ms ease-out both;
          animation-delay: inherit;
        }

        .party-confetti {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .party-confetti-piece {
          position: absolute;
          top: -14vh;
          border-radius: 2px;
          opacity: 0;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.45);
          animation-name: partyConfettiFall;
          animation-timing-function: cubic-bezier(0.2, 0.74, 0.32, 1);
          animation-fill-mode: both;
        }

        .party-center {
          position: absolute;
          left: 50%;
          top: 11%;
          width: min(92vw, 640px);
          padding: 0.88rem 1.2rem;
          border-radius: 9999px;
          text-align: center;
          transform: translateX(-50%);
          border: 1px solid rgba(236, 253, 245, 0.5);
          background: linear-gradient(
            145deg,
            rgba(15, 118, 110, 0.66) 0%,
            rgba(12, 74, 110, 0.68) 50%,
            rgba(88, 28, 135, 0.58) 100%
          );
          backdrop-filter: blur(8px);
          box-shadow: 0 0 50px rgba(16, 185, 129, 0.26), 0 0 60px rgba(250, 204, 21, 0.2);
          animation: partyCenterRise 880ms cubic-bezier(0.22, 1.14, 0.33, 1) both;
        }

        .party-title {
          margin: 0;
          line-height: 1;
          font-size: clamp(1.25rem, 3.9vw, 2.2rem);
          letter-spacing: 0.12em;
          font-weight: 900;
          color: transparent;
          background-image: linear-gradient(
            95deg,
            rgba(250, 204, 21, 1) 0%,
            rgba(255, 255, 255, 0.98) 34%,
            rgba(110, 231, 183, 0.98) 66%,
            rgba(34, 211, 238, 0.98) 100%
          );
          background-size: 210% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          text-shadow: 0 0 18px rgba(250, 204, 21, 0.28);
          animation: partyTitleSheen 920ms linear infinite;
        }

        .party-subtitle {
          margin-top: 0.34rem;
          font-size: clamp(0.72rem, 2.2vw, 0.92rem);
          color: rgba(240, 253, 250, 0.96);
          font-weight: 700;
          letter-spacing: 0.03em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .jackpot-row-highlight {
          animation: jackpotRowGlow 1.2s ease-in-out infinite;
        }

        .jackpot-card-highlight {
          animation: jackpotCardGlow 1.1s ease-in-out infinite;
        }

        .jackpot-status-pill {
          box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.25), 0 0 16px rgba(16, 185, 129, 0.35);
          animation: jackpotStatusPulse 980ms ease-in-out infinite;
        }

        .new-record-row-highlight {
          animation: newRecordRowGlow 1.05s ease-in-out infinite;
        }

        .new-record-pill {
          animation: newRecordPillBlink 980ms ease-in-out infinite;
        }

        @keyframes jackpotOverlayFade {
          0% {
            opacity: 0;
          }
          6% {
            opacity: 1;
          }
          88% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes partyFlashPulse {
          0% {
            opacity: 0;
            transform: scale(0.72);
          }
          34% {
            opacity: 0.9;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.3);
          }
        }

        @keyframes partyStreamerDrop {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-18vh) rotate(var(--stream-tilt));
          }
          18% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(118vh) rotate(var(--stream-tilt));
          }
        }

        @keyframes partyFireworkBloom {
          0% {
            opacity: 0;
          }
          22% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes partyFireworkRay {
          0% {
            opacity: 0;
            height: 30px;
          }
          26% {
            opacity: 1;
            height: 94px;
          }
          100% {
            opacity: 0;
            height: 138px;
          }
        }

        @keyframes partyConfettiFall {
          0% {
            opacity: 0;
            transform: translate3d(0, -12vh, 0) rotate(0deg);
          }
          14% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--confetti-sway), 112vh, 0) rotate(var(--confetti-spin));
          }
        }

        @keyframes partyCenterRise {
          0% {
            opacity: 0;
            transform: translate(-50%, -18px) scale(0.92);
          }
          36% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1.04);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }

        @keyframes partyTitleSheen {
          0% {
            background-position: 210% 50%;
          }
          100% {
            background-position: -16% 50%;
          }
        }

        @keyframes jackpotStatusPulse {
          0%,
          100% {
            transform: translateZ(0) scale(1);
          }
          50% {
            transform: translateZ(0) scale(1.06);
          }
        }

        @keyframes jackpotRowGlow {
          0%,
          100% {
            box-shadow: inset 0 0 0 1px rgba(110, 231, 183, 0.3);
          }
          50% {
            box-shadow: inset 0 0 0 1px rgba(110, 231, 183, 0.6), inset 0 0 42px rgba(52, 211, 153, 0.18);
          }
        }

        @keyframes jackpotCardGlow {
          0%,
          100% {
            box-shadow: inset 0 0 0 1px rgba(110, 231, 183, 0.3);
          }
          50% {
            box-shadow: inset 0 0 0 1px rgba(110, 231, 183, 0.62), inset 0 0 30px rgba(52, 211, 153, 0.24);
          }
        }

        @keyframes newRecordRowGlow {
          0%,
          100% {
            box-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.25);
          }
          50% {
            box-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.5), inset 0 0 24px rgba(34, 211, 238, 0.18);
          }
        }

        @keyframes newRecordPillBlink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.55;
          }
        }

        @media (max-width: 640px) {
          .party-center {
            top: 8%;
            width: min(95vw, 520px);
            padding: 0.72rem 0.9rem;
            border-radius: 1rem;
          }

          .party-title {
            font-size: clamp(1.08rem, 6vw, 1.5rem);
          }

          .party-subtitle {
            font-size: clamp(0.64rem, 3.2vw, 0.84rem);
          }

          .party-firework-ray {
            height: 74px;
          }

          .party-streamer {
            width: 1.5px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .jackpot-row-highlight,
          .jackpot-card-highlight,
          .jackpot-status-pill,
          .new-record-row-highlight,
          .new-record-pill {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}
