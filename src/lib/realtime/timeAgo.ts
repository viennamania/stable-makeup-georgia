export type RelativeTimeTone = "live" | "fresh" | "recent" | "normal" | "stale";
export type RelativeTimeLocale = "ko" | "en";

export type RelativeTimeInfo = {
  timestamp: number;
  ageMs: number;
  relativeLabel: string;
  absoluteLabel: string;
  tone: RelativeTimeTone;
};

const ABSOLUTE_TIME_FORMATTERS: Record<RelativeTimeLocale, Intl.DateTimeFormat> = {
  ko: new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }),
  en: new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }),
};

function toTimestamp(value: string | number | Date | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const raw = value instanceof Date ? value.getTime() : Date.parse(String(value));
  return Number.isNaN(raw) ? 0 : raw;
}

function pluralize(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

function getRelativeLabel(ageMs: number, locale: RelativeTimeLocale): string {
  if (ageMs < 5_000) {
    return locale === "en" ? "just now" : "방금 전";
  }
  if (ageMs < 60_000) {
    const seconds = Math.floor(ageMs / 1_000);
    return locale === "en" ? pluralize(seconds, "second") : `${seconds}초 전`;
  }
  if (ageMs < 3_600_000) {
    const minutes = Math.floor(ageMs / 60_000);
    return locale === "en" ? pluralize(minutes, "minute") : `${minutes}분 전`;
  }
  if (ageMs < 86_400_000) {
    const hours = Math.floor(ageMs / 3_600_000);
    return locale === "en" ? pluralize(hours, "hour") : `${hours}시간 전`;
  }
  const days = Math.floor(ageMs / 86_400_000);
  return locale === "en" ? pluralize(days, "day") : `${days}일 전`;
}

function getTone(ageMs: number): RelativeTimeTone {
  if (ageMs < 30_000) {
    return "live";
  }
  if (ageMs < 2 * 60_000) {
    return "fresh";
  }
  if (ageMs < 10 * 60_000) {
    return "recent";
  }
  if (ageMs < 60 * 60_000) {
    return "normal";
  }
  return "stale";
}

export function getRelativeTimeInfo(
  value: string | number | Date | null | undefined,
  nowMs = Date.now(),
  locale: RelativeTimeLocale = "ko",
): RelativeTimeInfo {
  const timestamp = toTimestamp(value);
  if (!timestamp) {
    return {
      timestamp: 0,
      ageMs: Number.POSITIVE_INFINITY,
      relativeLabel: "-",
      absoluteLabel: "-",
      tone: "stale",
    };
  }

  const ageMs = Math.max(0, nowMs - timestamp);

  return {
    timestamp,
    ageMs,
    relativeLabel: getRelativeLabel(ageMs, locale),
    absoluteLabel: ABSOLUTE_TIME_FORMATTERS[locale].format(new Date(timestamp)),
    tone: getTone(ageMs),
  };
}
