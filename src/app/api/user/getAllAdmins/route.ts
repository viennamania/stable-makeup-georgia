import { NextResponse, type NextRequest } from "next/server";

import {
	getAllAdmins,
} from '@lib/api/user';




export async function POST(request: NextRequest) {

  const body = await request.json();

  const limitRaw = Number(body?.limit);
  const pageRaw = Number(body?.page);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 5000) : 100;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;


  const result = await getAllAdmins({
    limit,
    page,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
