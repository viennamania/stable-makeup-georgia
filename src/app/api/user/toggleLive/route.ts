import { NextResponse, type NextRequest } from "next/server";

import {
	updateLiveOnAndOff,
} from '@lib/api/user';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { walletAddress, liveOnAndOff } = body;

  console.log("toggleLiveNotification walletAddress", walletAddress);
  console.log("toggleLiveNotification liveOn", liveOnAndOff);

  try {
    // Call the function to update the live notification setting
    const updatedStore = await updateLiveOnAndOff({
      walletAddress,
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
