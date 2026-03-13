import { NextResponse, type NextRequest } from "next/server";

import {
  applyRealtimeBuyorderAdminSession,
  clearRealtimeBuyorderAdminSession,
  isRealtimeBuyorderAdminEnabled,
  readRealtimeBuyorderAdminSession,
  verifyRealtimeBuyorderAdminPassword,
} from "@/lib/server/realtime-buyorder-admin-session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = readRealtimeBuyorderAdminSession(request);

  return NextResponse.json({
    status: "success",
    enabled: session.enabled,
    authenticated: session.authenticated,
    expiresAt: session.expiresAt ? new Date(session.expiresAt).toISOString() : null,
  });
}

export async function POST(request: NextRequest) {
  if (!isRealtimeBuyorderAdminEnabled()) {
    return NextResponse.json(
      {
        status: "error",
        message: "Realtime manual confirm is not configured",
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const password = typeof body?.password === "string" ? body.password : "";
  if (!verifyRealtimeBuyorderAdminPassword(password)) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid password",
      },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    status: "success",
    enabled: true,
    authenticated: true,
  });

  if (!applyRealtimeBuyorderAdminSession(response)) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to create session",
      },
      { status: 500 },
    );
  }

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({
    status: "success",
    authenticated: false,
  });

  clearRealtimeBuyorderAdminSession(response);
  return response;
}
