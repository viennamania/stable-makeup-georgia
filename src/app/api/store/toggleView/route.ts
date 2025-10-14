import { NextResponse, type NextRequest } from "next/server";

import {
	updateViewOnAndOff,
} from '@lib/api/store';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { storecode, viewOnAndOff } = body;

  console.log("toggleLiveNotification storecode", storecode);
  console.log("toggleLiveNotification viewOn", viewOnAndOff);

  try {
    // Call the function to update the live notification setting
    const updatedStore = await updateViewOnAndOff({
      storecode,
      viewOnAndOff,
    });

    console.log("Updated store:", updatedStore);


    if (updatedStore) {
      return NextResponse.json({
        success: true,
        message: "View status updated successfully",
        ///order: updatedOrder,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "No order found with the provided ID",
      });
    }

  } catch (error) {
    console.error("Error updating view status:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to update view status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

}
