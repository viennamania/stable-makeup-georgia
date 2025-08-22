import { NextResponse, type NextRequest } from "next/server";

import {
	updateAudioNotification,
} from '@lib/api/order';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { orderId, audioOn } = body;

  console.log("toggleAudioNotification orderId", orderId);
  console.log("toggleAudioNotification audioOn", audioOn);

  try {
    // Call the function to update the audio notification setting
    const updatedOrder = await updateAudioNotification({
      orderId,
      audioOn,
    });

    //console.log("Updated order:", updatedOrder);


    return NextResponse.json({
      success: true,
      message: "Audio notification setting updated successfully",
      ///order: updatedOrder,
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
