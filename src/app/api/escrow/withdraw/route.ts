import { NextResponse, type NextRequest } from "next/server";

import {
  withdrawEscrow,
} from '@lib/api/order';


export async function POST(request: NextRequest) {

    const body = await request.json();

    const {
        storecode,
        date,
        withdrawAmount
    } = body;

    const result = await withdrawEscrow({
        storecode: storecode,
        date: date,
        withdrawAmount: withdrawAmount
    });

    if (!result) {
        return NextResponse.json({
            error: "Failed to withdraw from escrow",
        }, { status: 500 });
    }

    return NextResponse.json({
        result: "Escrow withdrawal successful",
    });

}