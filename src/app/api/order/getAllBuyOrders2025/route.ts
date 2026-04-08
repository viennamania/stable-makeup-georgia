import { NextResponse, type NextRequest } from "next/server";

import {
	getBuyOrders,
} from '@lib/api/order';
import clientPromise from '@/lib/mongodb';
import { dbName } from '@/lib/mongodb';

const BUYORDERS_2025_COLLECTION_CANDIDATES = [
  'buyorders_20260210',
  'buyorders_2025',
  'buyorders',
] as const;

const createEmptyBuyOrdersResult = () => ({
  totalCount: 0,
  totalKrwAmount: 0,
  totalUsdtAmount: 0,
  totalTransferCount: 0,
  totalTransferAmount: 0,
  totalTransferAmountKRW: 0,
  totalSettlementCount: 0,
  totalSettlementAmount: 0,
  totalSettlementAmountKRW: 0,
  totalFeeAmount: 0,
  totalFeeAmountKRW: 0,
  totalAgentFeeAmount: 0,
  totalAgentFeeAmountKRW: 0,
  totalByUserType: [],
  totalBySellerBankAccountNumber: [],
  totalByBuyerBankAccountNumber: [],
  orders: [],
});

const resolveBuyOrders2025CollectionName = async () => {
  const client = await clientPromise;
  const collections = await client
    .db(dbName)
    .listCollections({}, { nameOnly: true })
    .toArray();

  const existingCollectionNames = new Set(
    collections
      .map((collection) => String(collection?.name || '').trim())
      .filter(Boolean)
  );

  return (
    BUYORDERS_2025_COLLECTION_CANDIDATES.find((name) =>
      existingCollectionNames.has(name)
    ) || null
  );
};


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    agentcode,
    storecode,
    limit,
    page,
    walletAddress,
    searchMyOrders,
    searchOrderStatusCancelled,
    searchOrderStatusCompleted,

    searchStoreName,

    privateSale,

    searchTradeId,
    searchBuyer,
    searchDepositName,
    searchDepositNameMode,

    searchStoreBankAccountNumber,
    searchBuyerBankAccountNumber,
    searchDepositCompleted,

    fromDate,
    toDate,

    manualConfirmPayment,

    userType,
    includeSummary,

  } = body;

  const isSearchDepositCompleted =
    searchDepositCompleted === true || searchDepositCompleted === "true";

  const normalizedFromDate = fromDate && fromDate !== "" ? fromDate : '2025-01-01';
  const normalizedToDate = toDate && toDate !== "" ? toDate : '2025-12-31';

  const collectionName = await resolveBuyOrders2025CollectionName();

  if (!collectionName) {
    console.error(
      '[getAllBuyOrders2025] no buyorders collection found for 2025 history',
      BUYORDERS_2025_COLLECTION_CANDIDATES
    );

    return NextResponse.json({
      result: createEmptyBuyOrdersResult(),
      resolvedCollectionName: null,
      warning: 'No buyorders collection found for 2025 history',
    });
  }

  try {
    const result = await getBuyOrders({
      limit: limit || 100,
      page: page || 1,
      agentcode: agentcode || "",
      storecode: storecode || "",
      walletAddress:  walletAddress || "",
      searchMyOrders:  searchMyOrders || false,
      searchOrderStatusCancelled,
      searchOrderStatusCompleted,

      searchStoreName: searchStoreName || "",

      privateSale: privateSale || false,

      searchTradeId: searchTradeId || "",
      searchBuyer: searchBuyer || "",
      searchDepositName: searchDepositName || "",
      searchDepositNameMode: typeof searchDepositNameMode === "string" ? searchDepositNameMode.trim() : "",

      searchStoreBankAccountNumber: searchStoreBankAccountNumber || "",

      searchBuyerBankAccountNumber: searchBuyerBankAccountNumber || "",
      searchDepositCompleted: isSearchDepositCompleted,

      fromDate: normalizedFromDate,
      toDate: normalizedToDate,

      manualConfirmPayment: manualConfirmPayment || false,
      includeSummary: includeSummary === undefined
        ? true
        : (includeSummary === true || includeSummary === "true"),

      userType: userType === undefined ? 'all' : userType,

      collectionName,
    });

    return NextResponse.json({
      result,
      resolvedCollectionName: collectionName,
    });
  } catch (error) {
    console.error(
      `[getAllBuyOrders2025] failed for collection ${collectionName}:`,
      error
    );

    return NextResponse.json(
      {
        result: null,
        resolvedCollectionName: collectionName,
        error: error instanceof Error ? error.message : 'Failed to fetch 2025 buy orders',
      },
      {
        status: 500,
      }
    );
  }
  
}
