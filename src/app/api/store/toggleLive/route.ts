import { NextResponse, type NextRequest } from "next/server";

import {
	updateLiveOnAndOff,
} from '@lib/api/store';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { storecode, liveOnAndOff } = body;

  console.log("toggleLiveNotification storecode", storecode);
  console.log("toggleLiveNotification liveOn", liveOnAndOff);

  try {
    // Call the function to update the live notification setting
    const updatedOrder = await updateLiveOnAndOff({
      storecode,
      liveOnAndOff,
    });

    console.log("Updated order:", updatedOrder);


    if (updatedOrder) {
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
