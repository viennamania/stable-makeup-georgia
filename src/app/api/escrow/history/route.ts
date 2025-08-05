import { NextResponse, type NextRequest } from "next/server";

import {
  getEscrowHistory,
} from '@lib/api/order';


export async function POST(request: NextRequest) {

    const body = await request.json();

    const {
        storecode,
        limit,
        page,
    } = body;

    const result = await getEscrowHistory({
        storecode: storecode,
        limit: limit,
        page: page,
    });

    if (!result) {
        return NextResponse.json({
            error: "Failed to retrieve escrow history",
        }, { status: 500 });
    }

    return NextResponse.json({
        result: result,
    });

}