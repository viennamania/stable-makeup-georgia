import { NextResponse, type NextRequest } from "next/server";

const SERVER_WALLET_TRANSFER_API_DISABLED = true;
const SERVER_WALLET_TRANSFER_API_DISABLED_MESSAGE = "보안 점검중입니다";

export async function POST(_request: NextRequest) {
  if (SERVER_WALLET_TRANSFER_API_DISABLED) {
    return NextResponse.json(
      {
        result: null,
        success: false,
        error: "Server wallet transfer API is temporarily disabled",
        message: SERVER_WALLET_TRANSFER_API_DISABLED_MESSAGE,
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      result: null,
      success: false,
      error: "Server wallet transfer API is unavailable",
    },
    { status: 503 },
  );
}
