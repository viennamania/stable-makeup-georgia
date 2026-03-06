import { NextResponse, type NextRequest } from "next/server";

import {
	updateLiveOnAndOff,
} from '@lib/api/store';
import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/toggleLive",
    body,
    requireSigned: true,
  });

  if (!guard.ok) {
    return NextResponse.json({
      success: false,
      message: guard.error,
    }, { status: guard.status });
  }

  const requesterStorecode = String((guard as any)?.requesterUser?.storecode || "").trim().toLowerCase();
  const requesterRole = String((guard as any)?.requesterUser?.role || "").trim().toLowerCase();
  if (requesterStorecode !== "admin" || requesterRole !== "admin") {
    return NextResponse.json({
      success: false,
      message: "Forbidden",
    }, { status: 403 });
  }

  const { storecode, liveOnAndOff } = body;
  const normalizedStorecode = typeof storecode === "string" ? storecode.trim() : "";

  if (!normalizedStorecode || typeof liveOnAndOff !== "boolean") {
    return NextResponse.json({
      success: false,
      message: "Invalid request body",
    }, { status: 400 });
  }

  console.log("toggleLiveNotification storecode", normalizedStorecode);
  console.log("toggleLiveNotification liveOn", liveOnAndOff);

  try {
    // Call the function to update the live notification setting
    const updatedStore = await updateLiveOnAndOff({
      storecode: normalizedStorecode,
      liveOnAndOff,
    });

    console.log("Updated store:", updatedStore);


    if (updatedStore) {
      return NextResponse.json({
        success: true,
        message: "Live status updated successfully",
        ///order: updatedOrder,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "No order found with the provided ID",
      });
    }

  } catch (error) {
    console.error("Error updating live status:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to update live status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

}
