import { NextResponse, type NextRequest } from "next/server";

import {
  getOneBuyOrder,
  updateBuyOrderSettlement,
} from '@lib/api/order';
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";

const normalizeStorecode = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
};

const normalizeTransactionHash = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const isValidTransactionHash = (value: string) => {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
};



export async function POST(request: NextRequest) {


  const body = await request.json();

  const {
    orderId,
    transactionHash,
    storecode,
    //settlement,
  } = body;

  if (typeof orderId !== "string" || !orderId.trim()) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const guard = await verifyCenterStoreAdminGuard({
    request,
    route: "/api/order/updateBuyOrderSettlement",
    body,
    storecodeRaw: storecode,
  });

  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }


  /*

                const settlement = {
                    txid: txid,
                    krwRate: krwRate,
                    paymentAmount: paymentAmount,
                    
                    settlementWalletAddress: settlementWalletAddress,
                    settlementAmount: settlementAmount,

                    settlementAmountKRW: settlementAmountKRW,
                    feeWalletAddress: feeWalletAddress,
                    feePercent: feePercent,
                    feeAmount: feeAmount,
                    feeAmountKRW: feeAmountKRW,

                    agentWalletAddress: "",
                    agentFeePercent: agentFeePercent,

                    dealerAmount: 0,
                    dealerAmountKRW: "0",


                    status: "paymentSettled",
                    createdAt: new Date().toISOString(),
                };

                console.log("settlement", settlement);

                // update buyorder
                
                const result = await collectionBuyorders.updateOne(
                    { _id: buyorders[i]._id },
                    {
                        $set: {
                            settlement: settlement,
                        },
                    }
                );


                console.log("result", result);
                if (result.modifiedCount === 0) {
                    console.log("update failed");
                    
                    //continue;
                    console.log("Error in settlement process for buyorder:", buyorders[i]._id);

                    return;
                }



                // totalSettlementCount is count of all buyorders with settlement and storecode
                const totalSettlementCount = await collectionBuyorders.countDocuments({
                    storecode: storecode,
                    settlement: {$exists: true}
                });
                console.log("totalSettlementCount", totalSettlementCount);
                const totalSettlementAmountResult = await collectionBuyorders.aggregate([
                    {
                        $match: {
                            storecode: storecode,
                            settlement: {$exists: true}
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalSettlementAmount: { $sum: "$settlement.settlementAmount" },

                            totalSettlementAmountKRW: { $sum: { $toDouble: "$settlement.settlementAmountKRW" } },


                            totalFeeAmount: { $sum: "$settlement.feeAmount" },

                            totalFeeAmountKRW: { $sum: { $toDouble: "$settlement.feeAmountKRW" } },
                        }
                    }
                ]).toArray();

                const totalSettlementAmount = totalSettlementAmountResult[0].totalSettlementAmount;

                const totalSettlementAmountKRW = totalSettlementAmountResult[0].totalSettlementAmountKRW;

                const totalFeeAmount = totalSettlementAmountResult[0].totalFeeAmount;

                const totalFeeAmountKRW = totalSettlementAmountResult[0].totalFeeAmountKRW;

                // update store
                const resultStore = await collectionStore.updateOne(
                    { storecode: storecode },
                    {
                        $set: {
                            totalSettlementCount: totalSettlementCount,
                            totalSettlementAmount: totalSettlementAmount,
                            totalSettlementAmountKRW: totalSettlementAmountKRW,
                            totalFeeAmount: totalFeeAmount,
                            totalFeeAmountKRW: totalFeeAmountKRW,
                        },
                    }
                );
                */


    /* settlement
    settlement
        Object
        txid
        "0xfa087dc1f0c61324359670c9ca1602bd27e1266edef4bbf216b7a187c27adaf8"
        krwRate
        1400
        paymentAmount
        1500000
        settlementWalletAddress
        "0x1eba71B17AA4beE24b54dC10cA32AAF0789b8D9A"
        settlementAmount
        1080.4389999999999
        settlementAmountKRW
        "1491006"
        feeWalletAddress
        "0x3f1e7D26A2704BE994aF84cEbf19BA9683E23666"
        feePercent
        0.35
        feeAmount
        3.804
        feeAmountKRW
        "5250"
        agentFeeWalletAddress
        "0x6ee78e5e6912d41d0Ad73a94b22b99957c3Cdd1a"
        agentFeePercent
        0.25
        agentFeeAmount
        2.717
        agentFeeAmountKRW
        "3749"
        status
        "paymentSettled"
        createdAt
        "2025-07-03T09:04:12.858Z"
    */


  
    
    // getOneBuyOrder
    const buyOrderResult = await getOneBuyOrder({
      orderId: orderId,
      limit: 1,
      page: 1,
    });


    if (!buyOrderResult) {
      console.log("buyOrder not found for orderId:", orderId);
      return NextResponse.json({
        result: null,
      });
    }


    const buyOrder = buyOrderResult.orders[0] as any;
    if (!buyOrder) {
      console.log("buyOrder not found for orderId:", orderId);
      return NextResponse.json({
        result: null,
      });
    }

    const requestedStorecode = normalizeStorecode(storecode);
    const buyOrderStorecode = normalizeStorecode(
      buyOrder.storecode || buyOrder.store?.storecode,
    );

    if (!buyOrderStorecode || buyOrderStorecode !== requestedStorecode) {
      console.log("buyOrder storecode mismatch for orderId:", orderId, {
        requestedStorecode,
        buyOrderStorecode,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (buyOrder.status !== "paymentConfirmed") {
      return NextResponse.json({ error: "BuyOrder is not settlement-ready" }, { status: 409 });
    }

    if (buyOrderStorecode === "admin") {
      return NextResponse.json({ error: "Admin store orders cannot be settled manually" }, { status: 403 });
    }

    if (buyOrder.transactionHashFail === true) {
      return NextResponse.json({ error: "BuyOrder transaction marked as failed" }, { status: 409 });
    }

    if (buyOrder?.settlement?.settlementAmount !== undefined && buyOrder?.settlement?.settlementAmount !== null) {
      return NextResponse.json({ error: "BuyOrder already settled" }, { status: 409 });
    }

    let txid = normalizeTransactionHash(transactionHash);
    if (!txid) {
      txid = normalizeTransactionHash(buyOrder.transactionHash);
    }
    if (!isValidTransactionHash(txid)) {
      return NextResponse.json({ error: "Invalid transactionHash" }, { status: 400 });
    }

    const krwRate = buyOrder.rate;
    const paymentAmount = buyOrder.krwAmount; // Assuming paymentAmount is in KRW
    const settlementWalletAddress = buyOrder.store.settlementWalletAddress;
    const agentFeeWalletAddress = buyOrder.agent.agentFeeWalletAddress;



    const settlementFeePercent = buyOrder.store.settlementFeePercent || 0.0; // Default to 0.0 if not set
    if (settlementFeePercent < 0 || settlementFeePercent > 100) {
      console.log("Invalid settlement fee percent:", settlementFeePercent);
      return NextResponse.json({
        result: null,
      });
    }

    const agentFeePercent = buyOrder.store.agentFeePercent || 0.0; // Default to 0.0 if not set
    if (agentFeePercent < 0 || agentFeePercent > 100) {
      console.log("Invalid agent fee percent:", agentFeePercent);
      return NextResponse.json({
        result: null,
      });
    }



    

    const settlementFeeAmountUSDT = parseFloat(Number(buyOrder.usdtAmount * settlementFeePercent * 0.01).toFixed(3)); // Calculate settlement fee amount in USDT
    const settlementFeeAmountKRW = (Number(settlementFeeAmountUSDT) * krwRate).toFixed(0); // Convert settlement fee amount to KRW

    const agentFeeAmountUSDT = parseFloat(Number(buyOrder.usdtAmount * agentFeePercent * 0.01).toFixed(3)); // Calculate agent fee amount in USDT
    const agentFeeAmountKRW = (Number(agentFeeAmountUSDT) * krwRate).toFixed(0); // Convert agent fee amount to KRW
   
    const settlementAmountUSDT = parseFloat((Number(buyOrder.usdtAmount) - Number(settlementFeeAmountUSDT) - Number(agentFeeAmountUSDT)).toFixed(3)); // Calculate settlement amount in USDT
    const settlementAmountKRW = (Number(settlementAmountUSDT) * krwRate).toFixed(0); // Convert settlement amount to KRW


    const feeWalletAddress = buyOrder.store.settlementFeeWalletAddress;



    const settlement = {
        txid: txid,
        krwRate: krwRate,
        paymentAmount: paymentAmount,
        
        settlementWalletAddress: settlementWalletAddress,
        settlementAmount: settlementAmountUSDT,
        settlementAmountKRW: settlementAmountKRW,

        feeWalletAddress: feeWalletAddress,
        feePercent: settlementFeePercent,
        feeAmount: settlementFeeAmountUSDT,
        feeAmountKRW: settlementFeeAmountKRW,


        agentFeeWalletAddress: agentFeeWalletAddress,
        agentFeePercent: agentFeePercent,

 
        agentFeeAmount: agentFeeAmountUSDT,
        agentFeeAmountKRW: agentFeeAmountKRW,


        status: "paymentSettled",
        createdAt: new Date().toISOString(),
    };
    




    // updateBuyOrderSettlement
    const result = await updateBuyOrderSettlement({
      updater: guard.requesterWalletAddress, // who updates the settlement
      orderId: orderId,
      settlement: settlement,
      /////////////storecode: buyOrder.store.storecode, // Assuming storecode is available in the buyOrder
    });


    if (!result) {
      console.log("Error updating buy order settlement for orderId:", orderId);
      return NextResponse.json({
        result: null,
      });
    }


    console.log("Settlement updated successfully for orderId:", orderId);
    return NextResponse.json({
      result: {
        orderId: orderId,
        settlement: settlement,
      },
    });
  
}
