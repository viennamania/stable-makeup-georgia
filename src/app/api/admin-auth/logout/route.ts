import { NextResponse, type NextRequest } from "next/server";

import {
  clearAdminPasswordSessionCookie,
  revokeAdminPasswordSession,
} from "@/lib/server/admin-password-auth";

export const runtime = "nodejs";

const logout = async (request: NextRequest) => {
  await revokeAdminPasswordSession(request).catch(() => false);

  const response = NextResponse.json({
    status: "success",
    result: {
      authenticated: false,
    },
  });

  clearAdminPasswordSessionCookie(response);
  return response;
};

export async function POST(request: NextRequest) {
  return logout(request);
}

export async function DELETE(request: NextRequest) {
  return logout(request);
}
