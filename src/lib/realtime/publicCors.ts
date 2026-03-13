import { NextResponse } from "next/server";

const PUBLIC_REALTIME_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

export const applyPublicRealtimeCors = (response: NextResponse) => {
  for (const [key, value] of Object.entries(PUBLIC_REALTIME_CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  response.headers.set("Vary", "Origin");
  return response;
};

export const jsonWithPublicRealtimeCors = (
  body: unknown,
  init?: ResponseInit,
) => applyPublicRealtimeCors(NextResponse.json(body, init));

export const createPublicRealtimePreflightResponse = () =>
  applyPublicRealtimeCors(
    new NextResponse(null, {
      status: 204,
    }),
  );
