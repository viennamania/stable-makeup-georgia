import { NextResponse, type NextRequest } from "next/server";

import { updatePayactionViewOn } from "@lib/api/client";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import {
  CLIENT_SETTINGS_ADMIN_MUTATION_SIGNING_PREFIX,
  CLIENT_SETTINGS_UPDATE_PAYACTION_ROUTE,
  extractClientSettingsAdminActionFields,
  isPlainObject,
} from "@/lib/security/client-settings-admin";

const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "";

export async function POST(request: NextRequest) {
  if (!clientId) {
    return NextResponse.json(
      {
        result: null,
        error: "No clientId configured in environment",
      },
      { status: 500 },
    );
  }

  let body: Record<string, unknown> = {};

  try {
    const parsed = await request.json();
    body = isPlainObject(parsed) ? parsed : {};
  } catch {
    body = {};
  }

  const authResult = await verifyAdminSignedAction({
    request,
    route: CLIENT_SETTINGS_UPDATE_PAYACTION_ROUTE,
    signingPrefix: CLIENT_SETTINGS_ADMIN_MUTATION_SIGNING_PREFIX,
    requesterStorecodeRaw: body.requesterStorecode ?? "admin",
    requesterWalletAddressRaw: body.requesterWalletAddress,
    signatureRaw: body.signature,
    signedAtRaw: body.signedAt,
    nonceRaw: body.nonce,
    actionFields: extractClientSettingsAdminActionFields(body),
  });

  if (!authResult.ok) {
    return NextResponse.json(
      {
        result: null,
        error: authResult.error,
      },
      { status: authResult.status },
    );
  }

  if (typeof body.payactionViewOn !== "boolean") {
    return NextResponse.json(
      {
        result: null,
        error: "payactionViewOn must be a boolean",
      },
      { status: 400 },
    );
  }

  const result = await updatePayactionViewOn(clientId, body.payactionViewOn);

  return NextResponse.json({
    result,
  });
}
