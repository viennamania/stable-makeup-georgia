export type RelativeTimeTone = "live" | "fresh" | "recent" | "normal" | "stale";

export type RelativeTimeInfo = {
  timestamp: number;
  ageMs: number;
  relativeLabel: string;
  absoluteLabel: string;
  tone: RelativeTimeTone;
};

const ABSOLUTE_TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function toTimestamp(value: string | number | Date | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const raw = value instanceof Date ? value.getTime() : Date.parse(String(value));
  return Number.isNaN(raw) ? 0 : raw;
}

function getRelativeLabel(ageMs: number): string {
  if (ageMs < 5_000) {
    return "방금 전";
  }
  if (ageMs < 60_000) {
    return `${Math.floor(ageMs / 1_000)}초 전`;
  }
  if (ageMs < 3_600_000) {
    return `${Math.floor(ageMs / 60_000)}분 전`;
  }
  if (ageMs < 86_400_000) {
    return `${Math.floor(ageMs / 3_600_000)}시간 전`;
  }
  return `${Math.floor(ageMs / 86_400_000)}일 전`;
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
    relativeLabel: getRelativeLabel(ageMs),
    absoluteLabel: ABSOLUTE_TIME_FORMATTER.format(new Date(timestamp)),
    tone: getTone(ageMs),
  };
}
