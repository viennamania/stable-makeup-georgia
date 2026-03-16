import { NextResponse, type NextRequest } from "next/server";

import {
  getUserByNickname,
} from "@lib/api/user";
import {
  validateNicknameForCreation,
} from "@/lib/server/user-creation-security";

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

export async function POST(request: NextRequest) {
  const body = await request.json();

  const storecode = normalizeString(body?.storecode);
  const nickname = normalizeString(body?.nickname || body?.userCode);

  if (!storecode) {
    return NextResponse.json(
      {
        result: null,
        error: "storecode is required",
      },
      { status: 400 }
    );
  }

  const validationError = validateNicknameForCreation(nickname);
  if (validationError) {
    return NextResponse.json(
      {
        result: null,
        error: validationError,
      },
      { status: 400 }
    );
  }

  const user = await getUserByNickname(storecode, nickname);

  if (!user?.walletAddress) {
    return NextResponse.json(
      {
        result: null,
        error: "등록된 회원을 찾을 수 없습니다.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    result: {
      storecode: user.storecode,
      walletAddress: user.walletAddress,
      nickname: user.nickname,
      userType: user.userType || "",
      buyOrderStatus: user.buyOrderStatus || null,
      liveOnAndOff: user.liveOnAndOff ?? true,
      isBlack: Boolean(user.isBlack),
      buyer: user.buyer || null,
    },
  });
}
