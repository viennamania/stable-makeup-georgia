import { NextRequest, NextResponse } from "next/server";

import {
  IP_BLOCK_NOTICE_BY_LANG,
  detectIpBlockNoticeLangFromAcceptLanguage,
  resolveIpBlockNoticeLang,
  type IpBlockNoticeLang,
} from "@/lib/security/ip-block-notice";

const INTERNAL_CHECK_PATH = "/api/security/internal/check-ip";
const BLOCKED_PAGE_PATH = "/ip-blocked";

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

  const pathLang = detectPathLang(pathname);
  const noticeLang =
    pathLang ||
    detectIpBlockNoticeLangFromAcceptLanguage(
      request.headers.get("accept-language"),
      "en",
    );

  try {
    const checkUrl = new URL(INTERNAL_CHECK_PATH, request.url);
    const checkResponse = await fetch(checkUrl, {
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
    });

    const checkResult = checkResponse.ok
      ? await checkResponse.json()
      : { blocked: false };

    if (Boolean(checkResult?.blocked)) {
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
    console.error("IP security middleware check failed:", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
