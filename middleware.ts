import { NextRequest, NextResponse } from "next/server";

import {
  IP_BLOCK_NOTICE_BY_LANG,
  detectIpBlockNoticeLangFromAcceptLanguage,
  resolveIpBlockNoticeLang,
  type IpBlockNoticeLang,
} from "@/lib/security/ip-block-notice";

const INTERNAL_CHECK_PATH = "/api/security/internal/check-ip";
const BLOCKED_PAGE_PATH = "/ip-blocked";
const IP_SECURITY_CHECK_TIMEOUT_MS = Number(process.env.IP_SECURITY_CHECK_TIMEOUT_MS || 1800);
const IP_SECURITY_MIDDLEWARE_ALLOWED_CACHE_TTL_MS = Math.max(
  Number(process.env.IP_SECURITY_MIDDLEWARE_ALLOWED_CACHE_TTL_MS || 3000),
  250,
);
const IP_SECURITY_MIDDLEWARE_BLOCKED_CACHE_TTL_MS = Math.max(
  Number(process.env.IP_SECURITY_MIDDLEWARE_BLOCKED_CACHE_TTL_MS || 5000),
  500,
);
const IP_SECURITY_ERROR_LOG_THROTTLE_MS = Math.max(
  Number(process.env.IP_SECURITY_ERROR_LOG_THROTTLE_MS || 60000),
  1000,
);

let lastIpSecurityMiddlewareErrorLoggedAt = 0;

const globalIpSecurityMiddlewareState = globalThis as typeof globalThis & {
  __ipSecurityMiddlewareCheckCache?: Map<string, { blocked: boolean; reason: string | null; expiresAt: number }>;
};

const PUBLIC_FILE_REGEX = /\.[^/]+$/;

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizePublicIp = (value: unknown) => {
  let raw = normalizeString(value);
  if (!raw) {
    return "";
  }

  if (raw.includes(",")) {
    raw = raw.split(",")[0]?.trim() || "";
  }

  if (raw.startsWith("[") && raw.includes("]")) {
    raw = raw.slice(1, raw.indexOf("]"));
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(raw)) {
    raw = raw.split(":")[0] || raw;
  }

  return raw.toLowerCase();
};

const getRequestIp = (request: NextRequest) => {
  const xForwardedFor = normalizeString(request.headers.get("x-forwarded-for"));
  if (xForwardedFor) {
    return normalizePublicIp(xForwardedFor);
  }

  const xRealIp = normalizeString(request.headers.get("x-real-ip"));
  if (xRealIp) {
    return normalizePublicIp(xRealIp);
  }

  return "";
};

const getRequestCountry = (request: NextRequest) => {
  const candidates = [
    request.headers.get("x-vercel-ip-country"),
    request.headers.get("cf-ipcountry"),
    request.headers.get("x-country-code"),
    request.headers.get("x-geo-country"),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeString(candidate).toUpperCase();
    if (!normalized || normalized === "UNKNOWN") {
      continue;
    }
    return normalized;
  }

  return "";
};

const getInternalSecurityKey = () => {
  return (
    normalizeString(process.env.IP_SECURITY_INTERNAL_KEY) ||
    normalizeString(process.env.THIRDWEB_SECRET_KEY)
  );
};

const getIpSecurityMiddlewareCache = () => {
  if (!globalIpSecurityMiddlewareState.__ipSecurityMiddlewareCheckCache) {
    globalIpSecurityMiddlewareState.__ipSecurityMiddlewareCheckCache = new Map();
  }
  return globalIpSecurityMiddlewareState.__ipSecurityMiddlewareCheckCache;
};

const getCachedIpSecurityCheckResult = (ip: string) => {
  const cache = getIpSecurityMiddlewareCache();
  const cached = cache.get(ip);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    cache.delete(ip);
    return null;
  }

  return cached;
};

const setCachedIpSecurityCheckResult = ({
  ip,
  blocked,
  reason,
}: {
  ip: string;
  blocked: boolean;
  reason: string | null;
}) => {
  const cache = getIpSecurityMiddlewareCache();
  const ttlMs = blocked
    ? IP_SECURITY_MIDDLEWARE_BLOCKED_CACHE_TTL_MS
    : IP_SECURITY_MIDDLEWARE_ALLOWED_CACHE_TTL_MS;

  cache.set(ip, {
    blocked,
    reason,
    expiresAt: Date.now() + ttlMs,
  });
};

const shouldBypass = (pathname: string) => {
  if (!pathname) {
    return true;
  }

  if (pathname.startsWith("/_next/")) {
    return true;
  }

  if (pathname === "/favicon.ico" || pathname === "/robots.txt" || pathname === "/sitemap.xml") {
    return true;
  }

  if (pathname.startsWith(BLOCKED_PAGE_PATH)) {
    return true;
  }

  if (pathname.startsWith(INTERNAL_CHECK_PATH)) {
    return true;
  }

  if (PUBLIC_FILE_REGEX.test(pathname)) {
    return true;
  }

  return false;
};

const detectPathLang = (pathname: string): IpBlockNoticeLang | null => {
  const segment = normalizeString(pathname.split("/")[1] || "");
  if (!segment) {
    return null;
  }
  const mapped = resolveIpBlockNoticeLang(segment, "en");
  if (mapped === "en" && !segment.toLowerCase().startsWith("en")) {
    return null;
  }
  return mapped;
};

const buildApiBlockedPayload = ({
  lang,
  ip,
}: {
  lang: IpBlockNoticeLang;
  ip: string;
}) => {
  const current = IP_BLOCK_NOTICE_BY_LANG[lang];
  const messages = {
    ko: IP_BLOCK_NOTICE_BY_LANG.ko.legalNotice,
    en: IP_BLOCK_NOTICE_BY_LANG.en.legalNotice,
    ja: IP_BLOCK_NOTICE_BY_LANG.ja.legalNotice,
    zh: IP_BLOCK_NOTICE_BY_LANG.zh.legalNotice,
  };

  return {
    success: false,
    error: "IP_BLOCKED",
    title: current.title,
    message: current.legalNotice,
    detail: current.detail,
    publicIp: ip || null,
    messages,
  };
};

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const logIpSecurityMiddlewareErrorThrottled = (message: string, error?: unknown) => {
  const now = Date.now();
  if (now - lastIpSecurityMiddlewareErrorLoggedAt < IP_SECURITY_ERROR_LOG_THROTTLE_MS) {
    return;
  }

  lastIpSecurityMiddlewareErrorLoggedAt = now;
  if (typeof error === "undefined") {
    console.error(message);
    return;
  }

  console.error(message, error);
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (shouldBypass(pathname)) {
    return NextResponse.next();
  }

  const ip = getRequestIp(request);
  if (!ip) {
    return NextResponse.next();
  }

  const internalSecurityKey = getInternalSecurityKey();
  if (!internalSecurityKey) {
    return NextResponse.next();
  }

  const isApiRequest = pathname.startsWith("/api/");
  const cachedCheckResult = getCachedIpSecurityCheckResult(ip);

  const pathLang = detectPathLang(pathname);
  const noticeLang =
    pathLang ||
    detectIpBlockNoticeLangFromAcceptLanguage(
      request.headers.get("accept-language"),
      "en",
    );

  if (cachedCheckResult) {
    if (!cachedCheckResult.blocked) {
      return NextResponse.next();
    }

    if (isApiRequest) {
      return NextResponse.json(buildApiBlockedPayload({ lang: noticeLang, ip }), {
        status: 451,
      });
    }

    const redirectUrl = new URL(BLOCKED_PAGE_PATH, request.url);
    redirectUrl.searchParams.set("lang", noticeLang);
    redirectUrl.searchParams.set("ip", ip);
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const checkUrl = new URL(INTERNAL_CHECK_PATH, request.url);
    const checkResponse = await fetchWithTimeout(checkUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ip-security-key": internalSecurityKey,
      },
      body: JSON.stringify({
        ip,
        pathname,
        method: request.method,
        isApi: isApiRequest,
        country: getRequestCountry(request),
        userAgent: request.headers.get("user-agent") || "",
        referer: request.headers.get("referer") || "",
        acceptLanguage: request.headers.get("accept-language") || "",
      }),
      cache: "no-store",
    }, IP_SECURITY_CHECK_TIMEOUT_MS);

    const checkResult = checkResponse.ok
      ? await checkResponse.json()
      : { blocked: false };
    const blocked = Boolean(checkResult?.blocked);
    const blockReason = normalizeString(checkResult?.reason) || null;
    setCachedIpSecurityCheckResult({ ip, blocked, reason: blockReason });

    if (blocked) {
      if (isApiRequest) {
        return NextResponse.json(buildApiBlockedPayload({ lang: noticeLang, ip }), {
          status: 451,
        });
      }

      const redirectUrl = new URL(BLOCKED_PAGE_PATH, request.url);
      redirectUrl.searchParams.set("lang", noticeLang);
      redirectUrl.searchParams.set("ip", ip);
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      logIpSecurityMiddlewareErrorThrottled(
        `IP security middleware check timed out after ${IP_SECURITY_CHECK_TIMEOUT_MS}ms`,
      );
    } else {
      logIpSecurityMiddlewareErrorThrottled("IP security middleware check failed:", error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
