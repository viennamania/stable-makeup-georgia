import { NextResponse, type NextRequest } from "next/server";

import {
  depositEscrow,
} from '@lib/api/order';


export async function POST(request: NextRequest) {

    const body = await request.json();

    const {
        storecode,
        date,
        depositAmount
    } = body;


    const result = await depositEscrow({
        storecode: storecode,
        date: date,
        depositAmount: depositAmount
    });

    if (!result) {
        return NextResponse.json({
        error: "Failed to deposit escrow",
        }, { status: 500 });
    }

    return NextResponse.json({
        result: "Escrow deposit successful",
    });
    
}