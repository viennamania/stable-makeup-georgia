import { put } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";
import { customAlphabet } from "nanoid";

import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import { BANK_INFO_ADMIN_SIGNING_PREFIX } from "@/lib/server/bank-info-admin-guard";

const ROUTE = "/api/upload/admin-bankinfo";

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  7,
);

const toSafeExtension = (contentType: string) => {
  const raw = String(contentType || "")
    .split("/")[1]
    ?.split(";")[0]
    ?.trim() || "bin";
  const cleaned = raw.replace(/[^a-zA-Z0-9]/g, "");
  return cleaned || "bin";
};

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "application/octet-stream";

  const authResult = await verifyAdminSignedAction({
    request,
    route: ROUTE,
    signingPrefix: BANK_INFO_ADMIN_SIGNING_PREFIX,
    requesterStorecodeRaw: request.headers.get("x-admin-requester-storecode") ?? "admin",
    requesterWalletAddressRaw: request.headers.get("x-admin-requester-wallet-address"),
    signatureRaw: request.headers.get("x-admin-signature"),
    signedAtRaw: request.headers.get("x-admin-signed-at"),
    nonceRaw: request.headers.get("x-admin-nonce"),
    actionFields: {
      contentType,
    },
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

  const file = request.body || "";
  const filename = `${nanoid()}.${toSafeExtension(contentType)}`;

  const blob = await put(filename, file, {
    contentType,
    access: "public",
  });

  return NextResponse.json(blob);
}
