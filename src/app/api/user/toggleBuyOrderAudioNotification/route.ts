import { NextResponse, type NextRequest } from "next/server";

import {
	updateBuyOrderAudioNotification,
} from '@lib/api/user';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const {
    walletAddress,
    storecode,
    audioOn,
  } = body;

  console.log("toggleAudioNotification walletAddress", walletAddress);
  console.log("toggleAudioNotification audioOn", audioOn);

  try {
    // Call the function to update the audio notification setting
    const updated = await updateBuyOrderAudioNotification({
      walletAddress,
      storecode,
      audioOn,
    });

    //console.log("Updated order:", updated);
    if (!updated) {
      return NextResponse.json({
        success: false,
        message: "Failed to update audio notification setting",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Audio notification setting updated successfully",
    });

  } catch (error) {
    console.error("Error updating audio notification setting:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to update audio notification setting",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

}
