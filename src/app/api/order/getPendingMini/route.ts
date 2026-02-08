import { NextResponse, type NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { dbName } from "@/lib/mongodb";

const PENDING_STATUSES = ["paymentRequested"];

const KST_OFFSET = 9 * 60 * 60 * 1000;

const getKSTRangesByOffset = (offsetDays = 0) => {
  const now = new Date();
  const kstNow = new Date(now.getTime() + KST_OFFSET);
  kstNow.setUTCDate(kstNow.getUTCDate() - offsetDays);

  const year = kstNow.getUTCFullYear();
  const month = kstNow.getUTCMonth();
  const date = kstNow.getUTCDate();

  const start = new Date(Date.UTC(year, month, date, 0, 0, 0) - KST_OFFSET);
  const end = new Date(Date.UTC(year, month, date, 23, 59, 59, 999) - KST_OFFSET);

  return { start, end };
};

const rangeToOffset = (range?: string) => {
  if (range === "yesterday") return 1;
  if (range === "dayBeforeYesterday") return 2;
  return 0; // today
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get("range") || "today";
  const offset = rangeToOffset(range);
  const { start, end } = getKSTRangesByOffset(offset);

  const client = await clientPromise;
  const collection = client.db(dbName).collection("buyorders");

  const docs = await collection.aggregate([
    {
      $addFields: {
        createdAtDate: { $toDate: "$createdAt" },
      },
    },
    {
      $match: {
        status: { $in: PENDING_STATUSES },
        createdAtDate: { $gte: start, $lte: end },
        privateSale: { $ne: true },
      },
    },
    { $sort: { createdAtDate: -1, _id: -1 } },
    { $limit: 50 },
    {
      $project: {
        status: 1,
        krwAmount: 1,
        usdtAmount: 1,
        rate: 1,
        tradeId: 1,
        buyer: 1,
        nickname: 1,
        depositName: "$buyer.depositName",
        buyerBankAccountNumber: 1,
        createdAt: 1,
        storeName: "$store.storeName",
        storeLogo: "$store.storeLogo",
        buyerBankInfo: "$buyer.bankInfo",
        sellerBankInfo: "$seller.bankInfo",
      },
    },
  ]).toArray();

  const paymentConfirmed = await collection
    .aggregate([
      {
        $addFields: {
          paymentConfirmedAtDate: { $toDate: "$paymentConfirmedAt" },
        },
      },
      {
        $match: {
          status: "paymentConfirmed",
          paymentConfirmedAtDate: { $gte: start, $lte: end },
          privateSale: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $convert: {
                input: { $ifNull: ["$paymentAmount", { $ifNull: ["$krwAmount", 0] }] },
                to: "double",
                onError: 0,
                onNull: 0,
              },
            },
          },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const paymentConfirmedSum = paymentConfirmed?.[0]?.total ?? 0;
  const paymentConfirmedCount = paymentConfirmed?.[0]?.count ?? 0;

  return NextResponse.json({ orders: docs, paymentConfirmedSum, paymentConfirmedCount });
}
