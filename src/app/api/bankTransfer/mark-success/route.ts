import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { dbName } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const { id, memo } = await req.json();

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "유효하지 않은 ID입니다." }, { status: 400 });
    }

    const client = await clientPromise;
    const collection = client.db(dbName).collection("bankTransfers");

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          match: "success",
          memo: memo || "",
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "업데이트할 항목을 찾지 못했습니다." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("mark-success error", error);
    return NextResponse.json({ error: error?.message || "서버 오류" }, { status: 500 });
  }
}
