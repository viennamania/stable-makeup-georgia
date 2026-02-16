import { NextResponse, type NextRequest } from "next/server";

import {
  updateFavoriteOnAndOff,
} from "@lib/api/store";

export async function POST(request: NextRequest) {
  const body = await request.json();

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
