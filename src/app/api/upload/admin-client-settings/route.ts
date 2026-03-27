import { put } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";
import { customAlphabet } from "nanoid";

import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import {
  CLIENT_SETTINGS_ADMIN_UPLOAD_ROUTE,
  CLIENT_SETTINGS_ADMIN_UPLOAD_SIGNING_PREFIX,
} from "@/lib/security/client-settings-admin";

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  7,
);

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const normalizeContentType = (value: string) => {
  return String(value || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
};

export async function POST(request: NextRequest) {
  const contentType = normalizeContentType(
    request.headers.get("content-type") || "application/octet-stream",
  );
  const contentLengthRaw = request.headers.get("content-length") || "";
  const contentLength = Number.parseInt(contentLengthRaw, 10);

  const authResult = await verifyAdminSignedAction({
    request,
    route: CLIENT_SETTINGS_ADMIN_UPLOAD_ROUTE,
    signingPrefix: CLIENT_SETTINGS_ADMIN_UPLOAD_SIGNING_PREFIX,
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

  const extension = ALLOWED_CONTENT_TYPES.get(contentType);
  if (!extension) {
    return NextResponse.json(
      {
        result: null,
        error: "Unsupported file type",
      },
      { status: 400 },
    );
  }

  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        result: null,
        error: "File too large",
      },
      { status: 413 },
    );
  }

  const file = request.body;
  if (!file) {
    return NextResponse.json(
      {
        result: null,
        error: "No file provided",
      },
      { status: 400 },
    );
  }

  const filename = `${nanoid()}.${extension}`;
  const blob = await put(filename, file, {
    contentType,
    access: "public",
  });

  return NextResponse.json(blob);
}
