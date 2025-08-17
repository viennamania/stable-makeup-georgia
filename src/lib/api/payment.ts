import clientPromise from '../mongodb';

import { dbName } from '../mongodb';

// payments collection
/*
{
  "_id": {
    "$oid": "68233a6fd590cf24cf1726f5"
  },
  "order": {
    "_id": {
      "$oid": "68232ac057fd8f91442809a9"
    },
    "storecode": "yudejfss",
    "walletAddress": "0xDD25d881E66B1bF1D6b711eF2a1Ea4C39054b654",
    "usdtAmount": 2.03,
    "user": {
      "_id": {
        "$oid": "68230420fc6a1d75386837dd"
      },
      "id": 8068058,
      "email": null,
      "nickname": "oss1114",
      "mobile": "+821012345678",
      "storecode": "yudejfss",
      "store": {
        "_id": {
          "$oid": "68219f5518fb58e5f4a220b2"
        },
        "storecode": "yudejfss",
        "storeName": "test99",
        "storeType": "test",
        "storeUrl": "https://test.com",
        "storeDescription": "설명입니다.",
        "storeLogo": "https://vzrcy5vcsuuocnf3.public.blob.vercel-storage.com/5M8446y-TT1KF2HDXnBNi0ESO5gFaWcbjJAQHi.png",
        "storeBanner": "https://www.stable.makeup/logo.png",
        "createdAt": "2025-05-12T07:12:21.336Z",
        "totalBuyerCount": 11,
        "settlementWalletAddress": "0xB35e743dA3d53f869a1b705fF91365715aC55DD4",
        "totalKrwAmount": 37000,
        "totalPaymentConfirmedCount": 7,
        "totalUsdtAmount": 26.15,
        "totalDealerAmount": 0.026149,
        "totalDealerAmountKRW": 0,
        "totalDealerCount": 7,
        "totalFeeAmount": 0.078446,
        "totalFeeAmountKRW": 100,
        "totalFeeCount": 7,
        "totalSettlementAmount": 26.045405000000002,
        "totalSettlementAmountKRW": 36500,
        "totalSettlementCount": 7
      },
      "walletAddress": "0xDD25d881E66B1bF1D6b711eF2a1Ea4C39054b654",
      "walletPrivateKey": "0x89b7a4b1e7c956faac7ac4cfaf6c8c292382edc2bede7cc4edf900c6f432683a",
      "createdAt": "2025-05-13T08:34:40.736Z",
      "settlementAmountOfFee": "0",
      "password": "12345678",
      "buyer": {
        "depositBankAccountNumber": "5172764425175",
        "depositBankName": "농협은행",
        "depositName": "오성수"
      }
    },
    "store": {
      "_id": {
        "$oid": "68219f5518fb58e5f4a220b2"
      },
      "storecode": "yudejfss",
      "storeName": "test99",
      "storeType": "test",
      "storeUrl": "https://test.com",
      "storeDescription": "설명입니다.",
      "storeLogo": null,
      "storeBanner": "https://www.stable.makeup/logo.png",
      "createdAt": "2025-05-12T07:12:21.336Z",
      "totalBuyerCount": 15,
      "settlementWalletAddress": "0xB35e743dA3d53f869a1b705fF91365715aC55DD4",
      "totalKrwAmount": 93000,
      "totalPaymentConfirmedCount": 20,
      "totalUsdtAmount": 64.00999999999999,
      "totalDealerAmount": 0.053863,
      "totalDealerAmountKRW": "80",
      "totalDealerCount": 17,
      "totalFeeAmount": 0.161606,
      "totalFeeAmountKRW": "239",
      "totalFeeCount": 17,
      "totalSettlementAmount": 53.654531,
      "totalSettlementAmountKRW": "79409",
      "totalSettlementCount": 17,
      "storeMemo": "12131231231"
    }
  },
  "store": {
    "_id": {
      "$oid": "68219f5518fb58e5f4a220b2"
    },
    "storecode": "yudejfss",
    "storeName": "test99",
    "storeType": "test",
    "storeUrl": "https://test.com",
    "storeDescription": "설명입니다.",
    "storeLogo": null,
    "storeBanner": "https://www.stable.makeup/logo.png",
    "createdAt": "2025-05-12T07:12:21.336Z",
    "totalBuyerCount": 15,
    "settlementWalletAddress": "0xB35e743dA3d53f869a1b705fF91365715aC55DD4",
    "totalKrwAmount": 93000,
    "totalPaymentConfirmedCount": 20,
    "totalUsdtAmount": 64.00999999999999,
    "totalDealerAmount": 0.053863,
    "totalDealerAmountKRW": "80",
    "totalDealerCount": 17,
    "totalFeeAmount": 0.161606,
    "totalFeeAmountKRW": "239",
    "totalFeeCount": 17,
    "totalSettlementAmount": 53.654531,
    "totalSettlementAmountKRW": "79409",
    "totalSettlementCount": 17,
    "storeMemo": "12131231231"
  },
  "user": {
    "_id": {
      "$oid": "68230420fc6a1d75386837dd"
    },
    "id": 8068058,
    "email": null,
    "nickname": "oss1114",
    "mobile": "+821012345678",
    "storecode": "yudejfss",
    "store": {
      "_id": {
        "$oid": "68219f5518fb58e5f4a220b2"
      },
      "storecode": "yudejfss",
      "storeName": "test99",
      "storeType": "test",
      "storeUrl": "https://test.com",
      "storeDescription": "설명입니다.",
      "storeLogo": "https://vzrcy5vcsuuocnf3.public.blob.vercel-storage.com/5M8446y-TT1KF2HDXnBNi0ESO5gFaWcbjJAQHi.png",
      "storeBanner": "https://www.stable.makeup/logo.png",
      "createdAt": "2025-05-12T07:12:21.336Z",
      "totalBuyerCount": 11,
      "settlementWalletAddress": "0xB35e743dA3d53f869a1b705fF91365715aC55DD4",
      "totalKrwAmount": 37000,
      "totalPaymentConfirmedCount": 7,
      "totalUsdtAmount": 26.15,
      "totalDealerAmount": 0.026149,
      "totalDealerAmountKRW": 0,
      "totalDealerCount": 7,
      "totalFeeAmount": 0.078446,
      "totalFeeAmountKRW": 100,
      "totalFeeCount": 7,
      "totalSettlementAmount": 26.045405000000002,
      "totalSettlementAmountKRW": 36500,
      "totalSettlementCount": 7
    },
    "walletAddress": "0xDD25d881E66B1bF1D6b711eF2a1Ea4C39054b654",
    "walletPrivateKey": "0x89b7a4b1e7c956faac7ac4cfaf6c8c292382edc2bede7cc4edf900c6f432683a",
    "createdAt": "2025-05-13T08:34:40.736Z",
    "settlementAmountOfFee": "0",
    "password": "12345678",
    "buyer": {
      "depositBankAccountNumber": "5172764425175",
      "depositBankName": "농협은행",
      "depositName": "오성수"
    }
  },
  "settlement": {
    "txid": "0x821886a239cc3144e923415e99fdeaababdc9b4c15f51b1ef7b3cd7236e0e252",
    "paymentAmount": 2.03,
    "settlementAmount": 2.021881,
    "feeAmount": 0.00609,
    "agentFeeAmount": 0.002029,
    "status": "paymentSettled",
    "createdAt": {
      "$date": "2025-05-13T12:26:23.173Z"
    }
  },
  "createdAt": {
    "$date": "2025-05-13T12:26:23.247Z"
  }
}
*/


// get all payments by storecode
export async function getAllPaymentsByStorecode(
{
    storecode,
    limit = 10,
    page = 1,
}: {
    storecode: string;
    limit?: number;
    page?: number;
}): Promise<any[]> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('payments');

  // get all payments by storecode
  const payments = await collection
    .find({ 'order.storecode': storecode })
    .skip((page - 1) * limit)
    .limit(limit)
    .project({
      'order.storecode': 1,
      'order.walletAddress': 1,
      'order.usdtAmount': 1,
      'order.user.nickname': 1,
      'order.user.mobile': 1,
      'order.user.store.storeName': 1,
      'order.user.store.storeType': 1,
      'order.user.store.storeUrl': 1,
      'order.user.store.storeDescription': 1,
      'order.user.store.storeLogo': 1,
      'order.user.store.storeBanner': 1,
      'settlement.txid': 1,
      'settlement.paymentAmount': 1,
      'settlement.settlementAmount': 1,
      'settlement.feeAmount': 1,
      'settlement.agentFeeAmount': 1,
      'settlement.status': 1,
    })
    .sort({ createdAt: -1 })
    .toArray();

  return payments;

}
