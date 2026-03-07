import { NextRequest, NextResponse } from "next/server";

import {
  getBlockedIpRule,
  insertApiAccessLog,
  normalizePublicIp,
} from "@/lib/api/ipSecurity";
import { getRequestCountry } from "@/lib/server/user-read-security";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const IP_RULE_LOOKUP_TIMEOUT_MS = Math.max(
  Number(process.env.IP_SECURITY_LOOKUP_TIMEOUT_MS || 1200),
  100,
);
const IP_RULE_BLOCKED_CACHE_TTL_MS = Math.max(
  Number(process.env.IP_SECURITY_BLOCKED_CACHE_TTL_MS || 5000),
  500,
);
const IP_RULE_ALLOWED_CACHE_TTL_MS = Math.max(
  Number(process.env.IP_SECURITY_ALLOWED_CACHE_TTL_MS || 2000),
  200,
);
const IP_RULE_LOOKUP_FAILURE_COOLDOWN_MS = Math.max(
  Number(process.env.IP_SECURITY_LOOKUP_FAILURE_COOLDOWN_MS || 3000),
  250,
);
const IP_SECURITY_ROUTE_ERROR_LOG_THROTTLE_MS = Math.max(
  Number(process.env.IP_SECURITY_ROUTE_ERROR_LOG_THROTTLE_MS || 60000),
  1000,
);

let lastIpSecurityRouteErrorLoggedAt = 0;
const globalIpSecurityCheckRouteState = globalThis as typeof globalThis & {
  __ipSecurityBlockedRuleCache?: Map<string, { expiresAt: number; rule: any | null }>;
  __ipSecurityBlockedRuleLookupInFlight?: Map<string, Promise<any>>;
  __ipSecurityLookupFailureCooldownUntil?: number;
};

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const getInternalSecurityKey = () => {
  return (
    normalizeString(process.env.IP_SECURITY_INTERNAL_KEY) ||
    normalizeString(process.env.THIRDWEB_SECRET_KEY)
  );
};

const isAuthorizedInternalRequest = (request: NextRequest) => {
  const expected = getInternalSecurityKey();
  if (!expected) {
    return false;
  }
  const provided = normalizeString(request.headers.get("x-ip-security-key"));
  return Boolean(provided && provided === expected);
};

const parseBody = async (request: NextRequest) => {
  try {
    return await request.json();
  } catch {
    return {};
  }
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`timeout_after_${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const getBlockedRuleCache = () => {
  if (!globalIpSecurityCheckRouteState.__ipSecurityBlockedRuleCache) {
    globalIpSecurityCheckRouteState.__ipSecurityBlockedRuleCache = new Map();
  }
  return globalIpSecurityCheckRouteState.__ipSecurityBlockedRuleCache;
};

const getLookupInFlight = () => {
  if (!globalIpSecurityCheckRouteState.__ipSecurityBlockedRuleLookupInFlight) {
    globalIpSecurityCheckRouteState.__ipSecurityBlockedRuleLookupInFlight = new Map();
  }
  return globalIpSecurityCheckRouteState.__ipSecurityBlockedRuleLookupInFlight;
};

const getCachedBlockedRule = (ip: string): { hasValue: boolean; rule: any | null } => {
  const cache = getBlockedRuleCache();
  const cached = cache.get(ip);
  if (!cached) {
    return { hasValue: false, rule: null };
  }
  if (cached.expiresAt <= Date.now()) {
    cache.delete(ip);
    return { hasValue: false, rule: null };
  }
  return { hasValue: true, rule: cached.rule };
};

const setCachedBlockedRule = (ip: string, rule: any | null, ttlMs: number) => {
  const cache = getBlockedRuleCache();
  cache.set(ip, {
    rule,
    expiresAt: Date.now() + Math.max(100, ttlMs),
  });
};

const lookupBlockedRuleDeduped = async (ip: string) => {
  const inFlight = getLookupInFlight();
  const pending = inFlight.get(ip);
  if (pending) {
    return pending;
  }

  const job = getBlockedIpRule(ip).finally(() => {
    inFlight.delete(ip);
  });
  inFlight.set(ip, job);
  return job;
};

const isLookupTimeoutError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || "");
  return message.startsWith("timeout_after_");
};

const logIpSecurityRouteErrorThrottled = (message: string, error?: unknown) => {
  const now = Date.now();
  if (now - lastIpSecurityRouteErrorLoggedAt < IP_SECURITY_ROUTE_ERROR_LOG_THROTTLE_MS) {
    return;
  }

  lastIpSecurityRouteErrorLoggedAt = now;
  if (typeof error === "undefined") {
    console.error(message);
    return;
  }

  console.error(message, error);
};

export async function POST(request: NextRequest) {
  if (!isAuthorizedInternalRequest(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }

  const body: any = await parseBody(request);
  const ip = normalizePublicIp(body?.ip);
  const pathname = normalizeString(body?.pathname || "/");
  const method = normalizeString(body?.method || "GET").toUpperCase() || "GET";
  const isApi = Boolean(body?.isApi || pathname.startsWith("/api/"));
  const userAgent = normalizeString(body?.userAgent || "");
  const referer = normalizeString(body?.referer || "");
  const acceptLanguage = normalizeString(body?.acceptLanguage || "");
  const country = normalizeString(body?.country || "") || getRequestCountry(request);

  if (!ip) {
    return NextResponse.json({
      ok: true,
      blocked: false,
      reason: null,
    });
  }

  let blockedRule: any = null;
  const cachedRule = getCachedBlockedRule(ip);

  if (cachedRule.hasValue) {
    blockedRule = cachedRule.rule;
  } else {
    const now = Date.now();
    const cooldownUntil = globalIpSecurityCheckRouteState.__ipSecurityLookupFailureCooldownUntil || 0;
    const lookupDisabledByCooldown = cooldownUntil > now;

    if (!lookupDisabledByCooldown) {
      try {
        blockedRule = await withTimeout(
          lookupBlockedRuleDeduped(ip),
          IP_RULE_LOOKUP_TIMEOUT_MS,
        );

        setCachedBlockedRule(
          ip,
          blockedRule,
          blockedRule ? IP_RULE_BLOCKED_CACHE_TTL_MS : IP_RULE_ALLOWED_CACHE_TTL_MS,
        );
      } catch (error) {
        globalIpSecurityCheckRouteState.__ipSecurityLookupFailureCooldownUntil =
          Date.now() + IP_RULE_LOOKUP_FAILURE_COOLDOWN_MS;
        setCachedBlockedRule(ip, null, Math.min(IP_RULE_ALLOWED_CACHE_TTL_MS, 1000));

        if (isLookupTimeoutError(error)) {
          logIpSecurityRouteErrorThrottled("IP blocked-rule lookup timed out; fail-open mode enabled briefly");
        } else {
          logIpSecurityRouteErrorThrottled("IP blocked-rule lookup timeout/failure:", error);
        }
      }
    }
  }

  const blocked = Boolean(blockedRule);
  const blockReason = blocked ? normalizeString(blockedRule?.reason) : null;

  if (isApi || blocked) {
    void insertApiAccessLog({
      ip,
      method,
      pathname,
      isApi,
      blocked,
      blockReason,
      country,
      userAgent,
      referer,
      acceptLanguage,
      source: "middleware",
    });
  }

  return NextResponse.json({
    ok: true,
    blocked,
    reason: blockReason,
    rule: blocked
      ? {
          ip: blockedRule?.ip || ip,
          reason: blockedRule?.reason || null,
          blockedAt: blockedRule?.blockedAt || null,
          expiresAt: blockedRule?.expiresAt || null,
        }
      : null,
  });
}
