import { NextResponse, type NextRequest } from "next/server";

import { getAgentDirectory } from "@lib/api/agent";

const globalAgentDirectoryRouteState = globalThis as typeof globalThis & {
  __agentDirectoryRouteCache?: Map<string, { expiresAt: number; value: any }>;
};

const AGENT_DIRECTORY_ROUTE_CACHE_TTL_MS = Number.parseInt(
  process.env.AGENT_DIRECTORY_ROUTE_CACHE_TTL_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.AGENT_DIRECTORY_ROUTE_CACHE_TTL_MS || "", 10)
  : 20000;

const getRouteCache = () => {
  if (!globalAgentDirectoryRouteState.__agentDirectoryRouteCache) {
    globalAgentDirectoryRouteState.__agentDirectoryRouteCache = new Map();
  }
  return globalAgentDirectoryRouteState.__agentDirectoryRouteCache;
};

const getStaleRouteCacheEntry = (cacheKey: string) => {
  const routeCache = getRouteCache();
  return routeCache.get(cacheKey) || null;
};

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeNumber = (value: unknown, fallback: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(parsed), max);
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const safeLimit = normalizeNumber(body.limit, 200, 300);
  const safePage = normalizeNumber(body.page, 1, 1000);
  const safeSearch = normalizeString(body.searchAgent);
  const cacheKey = JSON.stringify({
    limit: safeLimit,
    page: safePage,
    searchAgent: safeSearch.toLowerCase(),
  });

  const routeCache = getRouteCache();
  const cached = routeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({
      result: cached.value,
      cached: true,
    });
  }

  try {
    const result = await getAgentDirectory({
      limit: safeLimit,
      page: safePage,
      search: safeSearch,
    });

    routeCache.set(cacheKey, {
      value: result,
      expiresAt: Date.now() + AGENT_DIRECTORY_ROUTE_CACHE_TTL_MS,
    });

    return NextResponse.json({
      result,
      cached: false,
    });
  } catch (error) {
    const stale = getStaleRouteCacheEntry(cacheKey);
    if (stale) {
      return NextResponse.json({
        result: stale.value,
        cached: true,
        stale: true,
        warning: error instanceof Error ? error.message : "Failed to refresh agent directory",
      });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load agents",
        result: {
          totalCount: 0,
          agents: [],
        },
      },
      { status: 500 },
    );
  }
}
