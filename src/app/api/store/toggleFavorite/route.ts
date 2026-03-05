import { NextResponse, type NextRequest } from "next/server";

import {
  updateFavoriteOnAndOff,
} from "@lib/api/store";
import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/toggleFavorite",
    body,
    requireSigned: true,
  });

  if (!guard.ok) {
    return NextResponse.json(
      {
        result: null,
        error: guard.error,
      },
      { status: guard.status }
    );
  }

  const { storecode, favoriteOnAndOff } = body;

  try {
    const result = await updateFavoriteOnAndOff({
      storecode,
      favoriteOnAndOff,
    });

    return NextResponse.json({
      result,
    });
  } catch (error) {
    console.error("toggleFavorite error", error);
    return NextResponse.json(
      {
        result: false,
      },
      { status: 500 }
    );
  }
}
