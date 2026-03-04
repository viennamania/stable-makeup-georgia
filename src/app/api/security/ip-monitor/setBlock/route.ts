import { NextRequest, NextResponse } from "next/server";

import { setBlockedIpRule } from "@/lib/api/ipSecurity";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";

export const runtime = "nodejs";

const SIGNING_PREFIX = "stable-georgia:ip-security-block:v1";
const ROUTE_PATH = "/api/security/ip-monitor/setBlock";

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const ip = normalizeString(body?.ip);
  const enabled = Boolean(body?.enabled);
  const reason = normalizeString(body?.reason);
  const expiresAtRaw = normalizeString(body?.expiresAt);
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;
  const expiresAtIso =
    expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt.toISOString() : "";

  const actionFields: Record<string, unknown> = {
    ip,
    enabled: enabled ? "true" : "false",
    reason,
  };

  if (expiresAtRaw) {
    actionFields.expiresAt = expiresAtRaw;
  }

  if (!ip) {
    return NextResponse.json(
      {
        result: null,
        error: "ip is required",
      },
      { status: 400 },
    );
  }

  const auth = await verifyAdminSignedAction({
    request,
    route: ROUTE_PATH,
    signingPrefix: SIGNING_PREFIX,
    requesterStorecodeRaw: body?.requesterStorecode,
    requesterWalletAddressRaw: body?.requesterWalletAddress,
    signatureRaw: body?.signature,
    signedAtRaw: body?.signedAt,
    nonceRaw: body?.nonce,
    actionFields,
  });

  if (!auth.ok) {
    return NextResponse.json(
      {
        result: null,
        error: auth.error,
      },
      { status: auth.status },
    );
  }

  try {
    const result = await setBlockedIpRule({
      ip,
      enabled,
      reason,
      expiresAt: expiresAtIso ? expiresAt : null,
      requesterWalletAddress: auth.requesterWalletAddress,
      requesterUser: auth.requesterUser,
    });

    return NextResponse.json({
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        result: null,
        error:
          error instanceof Error && error.message
            ? error.message
            : "failed_to_update_block_rule",
      },
      { status: 500 },
    );
  }
}
