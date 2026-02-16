import { create } from 'domain';
import clientPromise from '../mongodb';

import { dbName } from '../mongodb';
import { paymentUrl } from '@/app/config/payment';
import { access } from 'fs';




// insertStore
export async function insertStore(data: any) {
  //console.log('insertStore data: ' + JSON.stringify(data));
  /*
  insertStore data: {"storecode":"teststorecode","storeName":"테스트상점","storeType":"test","storeUrl":"https://test.com","storeDescription":"설명입니다.","storeLogo":"https://test.com/logo.png","storeBanner":"https://test.com/banner.png"}
  */
  if (!data.storecode || !data.storeName || !data.agentcode) {
    
    
    console.log('insertStore data is invalid');
    console.log('insertStore data: ' + JSON.stringify(data));



    return null;
  }


  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');
  // check storecode is unique
  const stores = await collection.findOne<any>(
    {
      //storecode: data.storecode or storeName: data.storeName
      $or: [
        { storecode: data.storecode },
        { storeName: data.storeName },
      ],

    }
  );

  //console.log('insertStore stores: ' + JSON.stringify(stores));

  if (stores) {
    console.log('storecode or storeName is already exist');
    return null;
  }



  // insert storecode
  const result = await collection.insertOne(
    {
      agentcode: data.agentcode,
      storecode: data.storecode,
      storeName: data.storeName.trim(),
      storeType: data.storeType,
      storeUrl: data.storeUrl,
      storeDescription: data.storeDescription,
      storeLogo: data.storeLogo,
      storeBanner: data.storeBanner,
      createdAt: new Date().toISOString(),
    }
  );



  // update agent totalStoreCount
  // sum of stores with same agentcode
  // get sum of stores with same agentcode from stores collection
  const sumOfStores = await collection.countDocuments(
    { agentcode: data.agentcode }
  );

  console.log('sumOfStores: ' + sumOfStores);


  const agentCollection = client.db(dbName).collection('agents');
  await agentCollection.updateOne(
    { agentcode: data.agentcode },
    { $set: { totalStoreCount: sumOfStores } },
  );


  //console.log('insertStore result: ' + JSON.stringify(result));
  if (result) {
    const updated = await collection.findOne<any>(
      { _id: result.insertedId }
    );
    return {
      _id: result.insertedId,
      storecode: data.storecode,
    };
  } else {
    return null;
  }
}






// getStoreByStorecode
export async function getStoreByStorecode(
  {
    storecode,
  }: {
    storecode: string;
  }

): Promise<any> {

  //console.log('getStoreByStorecode storecode: ' + storecode);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');


  // join with agents collection

  const resultArray = await collection.aggregate([
    { $match: { storecode: storecode } },
    {
      $lookup: {
        from: 'agents',
        localField: 'agentcode',
        foreignField: 'agentcode',
        as: 'agentInfo',
      },
    },
    {
      $unwind: { path: '$agentInfo', preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        createdAt: 1,
        storecode: 1,
        storeName: 1,
        storeLogo: 1,
        storeBanner: 1,
        storeType: 1,
        storeUrl: 1,
        storeDescription: 1,
        settlementFeePercent: 1,
        settlementFeeWalletAddress: 1,
        
        sellerWalletAddress: 1,
        escrowAmountUSDT: 1,

        adminWalletAddress: 1,
        settlementWalletAddress: 1,
        privateSellerWalletAddress: 1,
        privateSaleWalletAddress: 1,
        agentFeePercent: 1,
        agentFeeWalletAddress: 1,

        payactionKey: 1,
        backgroundColor: 1,
        

        totalBuyerCount: 1,
        totalKrwAmount: 1,
        totalPaymentConfirmedCount: 1,
        totalUsdtAmount: 1,

        totalSettlementCount: 1,
        totalSettlementAmount: 1,
        totalSettlementAmountKRW: 1,
        
        totalFeeAmount: 1,
        totalFeeAmountKRW: 1,

        totalAgentFeeAmount: 1,
        totalAgentFeeAmountKRW: 1,


        totalPaymentConfirmedClearanceCount: 1,
        totalKrwAmountClearance: 1,
        totalUsdtAmountClearance: 1,
        
        bankInfo: 1,
        bankInfoAAA: 1,
        bankInfoBBB: 1,
        bankInfoCCC: 1,
        bankInfoDDD: 1,
        bankInfoEEE: 1,

        withdrawalBankInfo: 1,
        withdrawalBankInfoAAA: 1,
        withdrawalBankInfoBBB: 1,
        withdrawalBankInfoCCC: 1,
        
        totalWithdrawalCount: 1,
        totalWithdrawalAmount: 1,
        totalWithdrawalAmountKRW: 1,
        totalSettlementFeeAmount: 1,
        totalSettlementFeeAmountKRW: 1,

        agentcode: 1,
        agentName: { $ifNull: ['$agentInfo.agentName', null] },
        agentLogo: { $ifNull: ['$agentInfo.agentLogo', null] },


        paymentUrl: 1,
        maxPaymentAmountKRW: 1,
        accessToken: 1,
        paymentCallbackUrl: 1,
 

        liveOnAndOff: { $ifNull: ['$liveOnAndOff', true] },
        viewOnAndOff: { $ifNull: ['$viewOnAndOff', true] },

      },
    },
  ]).toArray();

  const result = resultArray.length > 0 ? resultArray[0] : null;




  /*
  const result = await collection.findOne<any>(
    { storecode: storecode }
  );
  */

  //console.log('getStoreByStorecode result: ' + JSON.stringify(result));

  if (result) {
    return result;
  } else {
    return null;
  }

}




export async function updateStoreLogo(data: any) {
    const client = await clientPromise;
    const collection = client.db(dbName).collection('stores');
  
  
    // update storeLogo
    const result = await collection.updateOne(
      { storecode: data.storecode },
      { $set: { storeLogo: data.storeLogo } }
    );
    if (result.modifiedCount === 0) {
      throw new Error('Failed to update store logo');
    }
    return {
      success: true,
      message: 'Store logo updated successfully',
    };
  
}


// updateStoreMemo
export async function updateStoreMemo(data: any) {
    const client = await clientPromise;
    const collection = client.db(dbName).collection('stores');
  
    // update storeMemo
    const result = await collection.updateOne(
      { storecode: data.storecode },
      { $set: { storeMemo: data.storeMemo } }
    );
    if (result.modifiedCount === 0) {
      throw new Error('Failed to update store memo');
    }
    return {
      success: true,
      message: 'Store memo updated successfully',
    };
  
}

// getOneStoreMemo
export async function getOneStoreMemo(data: any) {
    const client = await clientPromise;
    const collection = client.db(dbName).collection('stores');
  
    // get storeMemo
    const result = await collection.findOne(
      { storecode: data.storecode },
      { projection: { storeMemo: 1 } }
    );


    if (!result) {
      throw new Error('Store not found');
    }


    return {
      success: true,
      message: 'Store memo retrieved successfully',
      storeMemo: result.storeMemo,
    };
  
}



// updateStoreName
export async function updateStoreName(data: any) {

    //console.log('updateStoreName', data);



    const client = await clientPromise;
    const collection = client.db(dbName).collection('stores');
  
    // update storeName
    const result = await collection.updateOne(
      { storecode: data.storecode },
      { $set: { storeName: data.storeName } }
    );
    if (result.modifiedCount === 0) {
      throw new Error('Failed to update store name');
    }
    return {
      success: true,
      message: 'Store name updated successfully',
    };
  
}


// updateStoreDescription
export async function updateStoreDescription(data: any) {
    const client = await clientPromise;
    const collection = client.db(dbName).collection('stores');
  
    // update storeDescription
    const result = await collection.updateOne(
      { storecode: data.storecode },
      { $set: { storeDescription: data.storeDescription } }
    );
    if (result.modifiedCount === 0) {
      throw new Error('Failed to update store description');
    }
    return {
      success: true,
      message: 'Store description updated successfully',
    };
  
}







// updateStoreAdminWalletAddress
export async function updateStoreAdminWalletAddress(
  {
    storecode,
    adminWalletAddress,
  }: {
    storecode: string;
    adminWalletAddress: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { adminWalletAddress: adminWalletAddress } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}


// updateStoreSellerWalletAddress
export async function updateStoreSellerWalletAddress(
  {
    storecode,
    sellerWalletAddress,
  }: {
    storecode: string;
    sellerWalletAddress: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { sellerWalletAddress: sellerWalletAddress } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}


// updateStoreSettlementWalletAddress
export async function updateStoreSettlementWalletAddress(
  {
    storecode,
    settlementWalletAddress,
  }: {
    storecode: string;
    settlementWalletAddress: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { settlementWalletAddress: settlementWalletAddress } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}


// updateStorePrivateSellerWalletAddress
export async function updateStorePrivateSellerWalletAddress(
  {
    storecode,
    privateSellerWalletAddress,
  }: {
    storecode: string;
    privateSellerWalletAddress: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');
  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { privateSellerWalletAddress: privateSellerWalletAddress } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}



//  updateStoreSettlementFeeWalletAddress
export async function updateStoreSettlementFeeWalletAddress(
  {
    storecode,
    settlementFeeWalletAddress,
  }: {
    storecode: string;
    settlementFeeWalletAddress: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { settlementFeeWalletAddress: settlementFeeWalletAddress } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}



// updateStoreSettlementFeePercent
export async function updateStoreSettlementFeePercent(
  {
    storecode,
    settlementFeePercent,
  }: {
    storecode: string;
    settlementFeePercent: number;
  }
): Promise<boolean> {


  console.log('updateStoreSettlementFeePercent', storecode, settlementFeePercent);



  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { settlementFeePercent: settlementFeePercent } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}


// updateStoreBankInfo
const logStoreBankInfoHistory = async (historyCollection: any, payload: any) => {
  try {
    await historyCollection.insertOne(payload);
  } catch (error) {
    console.error('Failed to log store bank info history', error);
  }
};

export async function updateStoreBankInfo(
  {
    walletAddress,
    storecode,
    bankName,
    accountNumber,
    accountHolder,
  }: {
    walletAddress: string;
    storecode: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db(dbName);
  const collection = db.collection('stores');
  const historyCollection = db.collection('storeBankInfoHistory');

  const bankInfo = {
    bankName,
    accountNumber,
    accountHolder,
  };

  const projection: any = { bankInfo: 1 };
  const existing = await collection.findOne({ storecode }, { projection });
  const beforeInfo = existing?.bankInfo || null;

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { bankInfo: bankInfo } }
  );

  if (result && result.matchedCount > 0) {
    const isSame =
      (beforeInfo?.bankName || '') === bankInfo.bankName &&
      (beforeInfo?.accountNumber || '') === bankInfo.accountNumber &&
      (beforeInfo?.accountHolder || '') === bankInfo.accountHolder;

    if (!isSame) {
      await logStoreBankInfoHistory(historyCollection, {
        storecode,
        field: 'bankInfo',
        before: beforeInfo,
        after: bankInfo,
        updatedBy: walletAddress || '',
        updatedAt: new Date(),
      });
    }
  }

  return !!result;
}


// updateStoreBankInfoAAA
export async function updateStoreBankInfoAAA(
  {
    walletAddress,
    storecode,
    bankName,
    accountNumber,
    accountHolder
  }: {
    walletAddress: string;
    storecode: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db(dbName);
  const collection = db.collection('stores');
  const historyCollection = db.collection('storeBankInfoHistory');

  const bankInfoAAA = {
    bankName: bankName,
    accountNumber: accountNumber,
    accountHolder: accountHolder,
  };

  const projection: any = { bankInfoAAA: 1 };
  const existing = await collection.findOne({ storecode }, { projection });
  const beforeInfo = existing?.bankInfoAAA || null;

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { bankInfoAAA: bankInfoAAA } }
  );

  if (result && result.matchedCount > 0) {
    const isSame =
      (beforeInfo?.bankName || '') === bankInfoAAA.bankName &&
      (beforeInfo?.accountNumber || '') === bankInfoAAA.accountNumber &&
      (beforeInfo?.accountHolder || '') === bankInfoAAA.accountHolder;

    if (!isSame) {
      await logStoreBankInfoHistory(historyCollection, {
        storecode,
        field: 'bankInfoAAA',
        before: beforeInfo,
        after: bankInfoAAA,
        updatedBy: walletAddress || '',
        updatedAt: new Date(),
      });
    }
  }

  return !!result;
}



// updateStoreBankInfoBBB
export async function updateStoreBankInfoBBB(
  {
    walletAddress,
    storecode,
    bankName,
    accountNumber,
    accountHolder
  }: {
    walletAddress: string;
    storecode: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db(dbName);
  const collection = db.collection('stores');
  const historyCollection = db.collection('storeBankInfoHistory');

  const bankInfoBBB = {
    bankName: bankName,
    accountNumber: accountNumber,
    accountHolder: accountHolder,
  };

  const projection: any = { bankInfoBBB: 1 };
  const existing = await collection.findOne({ storecode }, { projection });
  const beforeInfo = existing?.bankInfoBBB || null;

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { bankInfoBBB: bankInfoBBB } }
  );

  if (result && result.matchedCount > 0) {
    const isSame =
      (beforeInfo?.bankName || '') === bankInfoBBB.bankName &&
      (beforeInfo?.accountNumber || '') === bankInfoBBB.accountNumber &&
      (beforeInfo?.accountHolder || '') === bankInfoBBB.accountHolder;

    if (!isSame) {
      await logStoreBankInfoHistory(historyCollection, {
        storecode,
        field: 'bankInfoBBB',
        before: beforeInfo,
        after: bankInfoBBB,
        updatedBy: walletAddress || '',
        updatedAt: new Date(),
      });
    }
  }

  return !!result;
}


// updateStoreBankInfoCCC
export async function updateStoreBankInfoCCC(
  {
    walletAddress,
    storecode,
    bankName,
    accountNumber,
    accountHolder
  }: {
    walletAddress: string;
    storecode: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db(dbName);
  const collection = db.collection('stores');
  const historyCollection = db.collection('storeBankInfoHistory');

  const bankInfoCCC = {
    bankName: bankName,
    accountNumber: accountNumber,
    accountHolder: accountHolder,
  };

  const projection: any = { bankInfoCCC: 1 };
  const existing = await collection.findOne({ storecode }, { projection });
  const beforeInfo = existing?.bankInfoCCC || null;

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { bankInfoCCC: bankInfoCCC } }
  );

  if (result && result.matchedCount > 0) {
    const isSame =
      (beforeInfo?.bankName || '') === bankInfoCCC.bankName &&
      (beforeInfo?.accountNumber || '') === bankInfoCCC.accountNumber &&
      (beforeInfo?.accountHolder || '') === bankInfoCCC.accountHolder;

    if (!isSame) {
      await logStoreBankInfoHistory(historyCollection, {
        storecode,
        field: 'bankInfoCCC',
        before: beforeInfo,
        after: bankInfoCCC,
        updatedBy: walletAddress || '',
        updatedAt: new Date(),
      });
    }
  }

  return !!result;
}


//updateStoreBankInfoDDD
export async function updateStoreBankInfoDDD(
  {
    walletAddress,
    storecode,
    bankName,
    accountNumber,
    accountHolder
  }: {
    walletAddress: string;
    storecode: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db(dbName);
  const collection = db.collection('stores');
  const historyCollection = db.collection('storeBankInfoHistory');

  const bankInfoDDD = {
    bankName: bankName,
    accountNumber: accountNumber,
    accountHolder: accountHolder,
  };

  const projection: any = { bankInfoDDD: 1 };
  const existing = await collection.findOne({ storecode }, { projection });
  const beforeInfo = existing?.bankInfoDDD || null;

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { bankInfoDDD: bankInfoDDD } }
  );

  if (result && result.matchedCount > 0) {
    const isSame =
      (beforeInfo?.bankName || '') === bankInfoDDD.bankName &&
      (beforeInfo?.accountNumber || '') === bankInfoDDD.accountNumber &&
      (beforeInfo?.accountHolder || '') === bankInfoDDD.accountHolder;

    if (!isSame) {
      await logStoreBankInfoHistory(historyCollection, {
        storecode,
        field: 'bankInfoDDD',
        before: beforeInfo,
        after: bankInfoDDD,
        updatedBy: walletAddress || '',
        updatedAt: new Date(),
      });
    }
  }

  return !!result;
}

export async function getStoreBankInfoHistory({
  storecode,
  limit = 50,
  field,
  dateFrom,
  dateTo,
}: {
  storecode: string;
  limit?: number;
  field?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  if (!storecode) {
    return [];
  }
  const client = await clientPromise;
  const collection = client.db(dbName).collection('storeBankInfoHistory');

  const query: Record<string, any> = { storecode };
  if (field) {
    query.field = field;
  }

  if (dateFrom || dateTo) {
    const range: Record<string, Date> = {};
    if (dateFrom) {
      const start = new Date(`${dateFrom}T00:00:00`);
      if (!Number.isNaN(start.getTime())) {
        range.$gte = start;
      }
    }
    if (dateTo) {
      const end = new Date(`${dateTo}T23:59:59.999`);
      if (!Number.isNaN(end.getTime())) {
        range.$lte = end;
      }
    }
    if (Object.keys(range).length > 0) {
      query.updatedAt = range;
    }
  }

  const history = await collection
    .find(query)
    .sort({ updatedAt: -1, _id: -1 })
    .limit(Math.max(1, limit))
    .toArray();

  return history;
}







// updateStoreWithdrawalBankInfo
export async function updateStoreWithdrawalBankInfo(
  {
    walletAddress,
    storecode,
    withdrawalBankName,
    withdrawalAccountNumber,
    withdrawalAccountHolder,
    withdrawalBankCode,
  }: {
    walletAddress: string;
    storecode: string;
    withdrawalBankName: string;
    withdrawalAccountNumber: string;
    withdrawalAccountHolder: string;
    withdrawalBankCode: string;
  }
): Promise<boolean> {


  ///console.log('updateStoreWithdrawalBankInfo', storecode, withdrawalBankName, withdrawalAccountNumber, withdrawalAccountHolder, withdrawalBankCode);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  const withdrawalBankInfo = {
    bankName: withdrawalBankName,
    accountNumber: withdrawalAccountNumber,
    accountHolder: withdrawalAccountHolder,
    accountBankCode: withdrawalBankCode,
    createdAt: new Date().toISOString(),
  };

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { withdrawalBankInfo: withdrawalBankInfo } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}

// updateStoreWithdrawalBankInfoAAA
export async function updateStoreWithdrawalBankInfoAAA(
  {
    walletAddress,
    storecode,
    withdrawalBankName,
    withdrawalAccountNumber,
    withdrawalAccountHolder,
    withdrawalBankCode,
  }: {
    walletAddress: string;
    storecode: string;
    withdrawalBankName: string;
    withdrawalAccountNumber: string;
    withdrawalAccountHolder: string;
    withdrawalBankCode: string;
  }
): Promise<boolean> {


  //console.log('updateStoreWithdrawalBankInfoAAA', storecode, withdrawalBankName, withdrawalAccountNumber, withdrawalAccountHolder, withdrawalBankCode);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  const withdrawalBankInfoAAA = {
    bankName: withdrawalBankName,
    accountNumber: withdrawalAccountNumber,
    accountHolder: withdrawalAccountHolder,
    accountBankCode: withdrawalBankCode,
    createdAt: new Date().toISOString(),
  };

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { withdrawalBankInfoAAA: withdrawalBankInfoAAA } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}

// updateStoreWithdrawalBankInfoBBB
export async function updateStoreWithdrawalBankInfoBBB(
  {
    walletAddress,
    storecode,
    withdrawalBankName,
    withdrawalAccountNumber,
    withdrawalAccountHolder,
    withdrawalBankCode,
  }: {
    walletAddress: string;
    storecode: string;
    withdrawalBankName: string;
    withdrawalAccountNumber: string;
    withdrawalAccountHolder: string;
    withdrawalBankCode: string;
  }
): Promise<boolean> {
  //console.log('updateStoreWithdrawalBankInfoBBB', storecode, withdrawalBankName, withdrawalAccountNumber, withdrawalAccountHolder, withdrawalBankCode);
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');
  const withdrawalBankInfoBBB = {
    bankName: withdrawalBankName,
    accountNumber: withdrawalAccountNumber,
    accountHolder: withdrawalAccountHolder,
    accountBankCode: withdrawalBankCode,
    createdAt: new Date().toISOString(),
  };
  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { withdrawalBankInfoBBB: withdrawalBankInfoBBB } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}







// updateMaxPaymentAmountKRW
export async function updateMaxPaymentAmountKRW(
  {
    walletAddress,
    storecode,
    maxPaymentAmountKRW,
  }: {
    walletAddress: string;
    storecode: string;
    maxPaymentAmountKRW: number;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { maxPaymentAmountKRW: maxPaymentAmountKRW } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}



// updateStoreAccessToken
export async function updateStoreAccessToken(
  {
    storecode,
    accessToken,
  }: {
    storecode: string;
    accessToken: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { accessToken: accessToken } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}

// updateStorePaymentUrl
export async function updateStorePaymentUrl(
  {
    storecode,
    paymentUrl,
  }: {
    storecode: string;
    paymentUrl: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { paymentUrl: paymentUrl } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}

// updateStorePaymentCallbackUrl
export async function updateStorePaymentCallbackUrl(
  {
    storecode,
    paymentCallbackUrl,
  }: {
    storecode: string;
    paymentCallbackUrl: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { paymentCallbackUrl: paymentCallbackUrl } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}



// getAllStores
export async function getAllStores(
  {
    limit,
    page,
    search,
    agentcode,
    sortBy = '',

    fromDate = new Date(0).toISOString(),
    toDate = new Date().toISOString(),
  }: {
    limit: number;
    page: number;
    search: string;
    agentcode: string;
    sortBy?: string;

    fromDate?: string;
    toDate?: string;

  }
): Promise<any> {

  //console.log('getAllStores', limit, page, search, agentcode);

  // join with agents collection  stores.agentcode = agents.agentcode
  // when stores has not agentcode, it should return null for agentName and agentLogo



  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  const query: any = {};

  if (search) {
    query.storeName = { $regex: String(search), $options: 'i' };
  }
  if (agentcode) {
    query.agentcode = { $regex: String(agentcode), $options: 'i' };
  }


  // exclude if stroecode is 'admin' or 'agent'

  query.storecode = { $nin: ['admin', 'agent'] };

  

  const totalCount = await collection.countDocuments(query);

  //console.log('getAllStores totalCount', totalCount);


  try {
    const sortStage =
      sortBy === 'storeNameDesc'
        ? { storeName: -1, createdAt: -1 }
        : { totalUsdtAmount: -1, createdAt: -1 };
    const aggregateOptions =
      sortBy === 'storeNameDesc'
        ? { collation: { locale: 'ko', strength: 1 } }
        : {};

    const stores = await collection.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'agents',
          localField: 'agentcode',
          foreignField: 'agentcode',
          as: 'agentInfo',
        },
      },
      {
        $unwind: { path: '$agentInfo', preserveNullAndEmptyArrays: true }
      },
      {
        
        $project: {
          createdAt: 1,
          storecode: 1,
          storeName: 1,
          storeLogo: 1,
          favoriteOnAndOff: 1,
          clearanceSortOrder: 1,
          backgroundColor: 1,
   

          settlementFeePercent: 1,
          settlementFeeWalletAddress: 1,
          sellerWalletAddress: 1,
          adminWalletAddress: 1,
          settlementWalletAddress: 1,

          agentFeePercent: 1,
      

          

          totalBuyerCount: 1,
          totalKrwAmount: 1,
          totalPaymentConfirmedCount: 1,
          totalUsdtAmount: 1,


          totalSettlementCount: 1,

          totalSettlementAmount: 1,
          totalSettlementAmountKRW: 1,

          totalFeeAmount: 1,
          totalFeeAmountKRW: 1,

          totalAgentFeeAmount: 1,
          totalAgentFeeAmountKRW: 1,
    


          totalPaymentConfirmedClearanceCount: 1,
          totalKrwAmountClearance: 1,
          totalUsdtAmountClearance: 1,
          

          bankInfo: 1,
          bankInfoAAA: 1,
          bankInfoBBB: 1,
          bankInfoCCC: 1,
          bankInfoDDD: 1,

 
          agentcode: 1,
          agentName: { $ifNull: ['$agentInfo.agentName', null] },
          agentLogo: { $ifNull: ['$agentInfo.agentLogo', null] },
          agentFeeWalletAddress: { $ifNull: ['$agentInfo.agentFeeWalletAddress', null] },

          escrowAmountUSDT: 1,

          maxPaymentAmountKRW: 1,
          paymentUrl: 1,
       
        },
      },
      
      { $sort: sortStage },


      { $skip: (page - 1) * limit },
      { $limit: limit },
    ], aggregateOptions).toArray();





    //console.log('getAllStores stores', stores);



    return {
      totalCount,
      stores,
    };

  } catch (error) {
    console.error('Error fetching stores:', error);
    throw new Error('Failed to fetch stores');
  }
}





// getAllStoresForAgent
export async function getAllStoresForAgent(
  {
    limit,
    page,
    agentcode,
  }: {
    limit: number;
    page: number;
    agentcode?: string;
  }
): Promise<any> {
  console.log('getAllStoresForAgent', limit, page, agentcode);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  const query: any = {};

  if (agentcode) {
    query.agentcode = { $eq: agentcode };
  }

  const totalCount = await collection.countDocuments(query);

  try {
    
    
    const stores = await collection.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'agents',
          localField: 'agentcode',
          foreignField: 'agentcode',
          as: 'agentInfo',
        },
      },
      {
        $unwind: { path: '$agentInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          createdAt: 1,
          storecode: 1,
          storeName: 1,
          
          agentFeeRate: 1,


          storeLogo: 1,
          agentcode: 1,
          agentName: { $ifNull: ['$agentInfo.agentName', null] },
          agentLogo: { $ifNull: ['$agentInfo.agentLogo', null] },
        },
      },
      { $sort: { createdAt: -1 } }, // Sort by createdAt in descending order
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]).toArray();

    
    // totalBuyerCount,
    // totalTradeCount, totalKrwAmount, totalUsdtAmount,
    // totalSettlementAmountKRW, totalSettlementAmount
    // totalAgentFeeAmountKRW, totalAgentFeeAmount
    // for each store


    for (const store of stores) {
      const storecode = store.storecode;

      // get totalBuyerCount
      const totalBuyerCount = await collection.countDocuments({ storecode: storecode, totalBuyerCount: { $gt: 0 } });

      // get totalTradeCount
      const totalTradeCount = await collection.countDocuments({ storecode: storecode, totalTradeCount: { $gt: 0 } });

      // get totalKrwAmount
      const totalKrwAmount = await collection.aggregate([
        { $match: { storecode: storecode } },
        { $group: { _id: null, totalKrwAmount: { $sum: '$totalKrwAmount' } } }
      ]).toArray();
      store.totalKrwAmount = totalKrwAmount[0]?.totalKrwAmount || 0;

      // get totalUsdtAmount
      const totalUsdtAmount = await collection.aggregate([
        { $match: { storecode: storecode } },
        { $group: { _id: null, totalUsdtAmount: { $sum: '$totalUsdtAmount' } } }
      ]).toArray();
      store.totalUsdtAmount = totalUsdtAmount[0]?.totalUsdtAmount || 0;

      // get totalSettlementAmountKRW
      const totalSettlementAmountKRW = await collection.aggregate([
        { $match: { storecode: storecode } },
        { $group: { _id: null, totalSettlementAmountKRW: { $sum: '$totalSettlementAmountKRW' } } }
      ]).toArray();
      store.totalSettlementAmountKRW = totalSettlementAmountKRW[0]?.totalSettlementAmountKRW || 0;

      // get totalSettlementAmount
      const totalSettlementAmount = await collection.aggregate([
        { $match: { storecode: storecode } },
        { $group: { _id: null, totalSettlementAmount: { $sum: '$totalSettlementAmount' } } }
      ]).toArray();
      store.totalSettlementAmount = totalSettlementAmount[0]?.totalSettlementAmount || 0;

    }

 
    
    
    return {
      totalCount,
      stores,


    };


  } catch (error) {
    console.error('Error fetching stores for agent:', error);
    throw new Error('Failed to fetch stores for agent');
  }
}











// getAllStoresForBalanceInquiry
export async function getAllStoresForBalanceInquiry(
  {
    limit,
    page,
    search,
  }: {
    limit: number;
    page: number;
    search: string;
  }
): Promise<any> {


  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  const query: any = {};

  if (search) {
    query.storeName = { $regex: String(search), $options: 'i' };
  }


  // exclude if stroecode is 'admin' or 'agent'

  query.storecode = { $nin: ['admin', 'agent'] };

  

  const totalCount = await collection.countDocuments(query);

  //console.log('getAllStores totalCount', totalCount);


  try {
    const stores = await collection.aggregate([
      { $match: query },
      {
        
        $project: {
          createdAt: 1,
          storecode: 1,
          storeName: 1,
          storeLogo: 1,
          backgroundColor: 1,

          totalUsdtAmount: 1,

          settlementWalletAddress: 1,

          //liveOnAndOff: 1,
          // if liveOnAndOff is not exist, set it to true
          liveOnAndOff: { $ifNull: ['$liveOnAndOff', true] },

          viewOnAndOff: { $ifNull: ['$viewOnAndOff', true]  },
       
        },
      },
      
      //{ $sort: { createdAt: -1 } }, // Sort by createdAt in descending order
      // sort by totalUsdtAmount in descending order
      { $sort: { totalUsdtAmount: -1, createdAt: -1 } }, // Sort by totalUsdtAmount in descending order and then by createdAt in descending order


      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]).toArray();





    //console.log('getAllStores stores', stores);



    return {
      totalCount,
      stores,
    };

  } catch (error) {
    console.error('Error fetching stores:', error);
    throw new Error('Failed to fetch stores');
  }
}













// updatePayactionKeys
export async function updatePayactionKeys(
  {
    walletAddress,
    storecode,
    payactionKey,
  }: {
    walletAddress: string;
    storecode: string;
    payactionKey: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { payactionKey: payactionKey } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}


// getPayactionKeys
export async function getPayactionKeys(
  {
    storecode,
  }: {
    storecode: string;
  }
): Promise<any> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');
  // get storecode
  const result = await collection.findOne<any>(
    { storecode: storecode },
    { projection: { payactionKey: 1 } }
  );
  if (result && result.payactionKey) {
    return result.payactionKey;
  } else {
    return null;
  }
}



// updateBackgroundColor
export async function updateBackgroundColor(
  {
    walletAddress,
    storecode,
    backgroundColor,
  }: {
    walletAddress: string;
    storecode: string;
    backgroundColor: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { backgroundColor: backgroundColor } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}



/// updateAgentcode
export async function updateAgentcode(
  {
    walletAddress,
    storecode,
    agentcode,
  }: {
    walletAddress: string;
    storecode: string;
    agentcode: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { agentcode: agentcode } }
  );



  // update agents totalStoreCount
  // if totalStoreCount is not exist, set it to 0


  const agentCollection = client.db(dbName).collection('agents');
  await agentCollection.updateOne(
    { agentcode: agentcode },
    { $inc: { totalStoreCount: 1 } },
  )
    




  if (result) {
    return true;
  } else {
    return false;
  }
}



// updateStoreAgentFeeWalletAddress
export async function updateStoreAgentFeeWalletAddress(
  {
    storecode,
    agentFeeWalletAddress,
  }: {
    storecode: string;
    agentFeeWalletAddress: string;
  }
): Promise<boolean> {

  console.log('updateStoreAgentFeeWalletAddress', storecode, agentFeeWalletAddress);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { agentFeeWalletAddress: agentFeeWalletAddress } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}



// updateStoreAgentFeePercent
export async function updateStoreAgentFeePercent(
  {
    storecode,
    agentFeePercent,
  }: {
    storecode: string;
    agentFeePercent: number;
  }
): Promise<boolean> {


  console.log('updateStoreAgentFeePercent', storecode, agentFeePercent);
  if (agentFeePercent < 0 || agentFeePercent > 100) {
    throw new Error('agentFeePercent must be between 0 and 100');
  }




  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { agentFeePercent: agentFeePercent } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}





// updateStoreEscrowAmountUSDT
export async function updateStoreEscrowAmountUSDT(
  {
    storecode,
    escrowAmountUSDT,
  }: {
    storecode: string;
    escrowAmountUSDT: number;
  }
): Promise<boolean> {

  console.log('updateStoreEscrowAmountUSDT', storecode, escrowAmountUSDT);

  if (escrowAmountUSDT < 0) {
    throw new Error('escrowAmountUSDT must be greater than or equal to 0');
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { escrowAmountUSDT: escrowAmountUSDT } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}




// updateLiveOnAndOff
export async function updateLiveOnAndOff(
  {
    storecode,
    liveOnAndOff,
  }: {
    storecode: string;
    liveOnAndOff: boolean;
  }
): Promise<boolean> {

  console.log('updateLiveOnAndOff', storecode, liveOnAndOff);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { liveOnAndOff: liveOnAndOff } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}


// updateViewOnAndOff
export async function updateViewOnAndOff(
  {
    storecode,
    viewOnAndOff,
  }: {
    storecode: string;
    viewOnAndOff: boolean;
  }
): Promise<boolean> {

  console.log('updateViewOnAndOff', storecode, viewOnAndOff);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // update storecode
  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { viewOnAndOff: viewOnAndOff } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}


// updateFavoriteOnAndOff
export async function updateFavoriteOnAndOff(
  {
    storecode,
    favoriteOnAndOff,
  }: {
    storecode: string;
    favoriteOnAndOff: boolean;
  }
): Promise<boolean> {

  console.log('updateFavoriteOnAndOff', storecode, favoriteOnAndOff);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  const result = await collection.updateOne(
    { storecode: storecode },
    { $set: { favoriteOnAndOff: favoriteOnAndOff } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}

export async function updateClearanceSortOrders(
  {
    orders,
  }: {
    orders: {
      storecode: string;
      clearanceSortOrder: number;
    }[];
  }
): Promise<boolean> {
  if (!Array.isArray(orders) || orders.length === 0) {
    return false;
  }

  const normalizedOrderMap = new Map<string, number>();
  for (const order of orders) {
    const storecode = String(order?.storecode || "").trim();
    const clearanceSortOrder = Number(order?.clearanceSortOrder);
    if (
      storecode &&
      Number.isFinite(clearanceSortOrder) &&
      clearanceSortOrder > 0
    ) {
      normalizedOrderMap.set(storecode, clearanceSortOrder);
    }
  }

  const normalizedOrders = Array.from(normalizedOrderMap.entries()).map(
    ([storecode, clearanceSortOrder]) => ({
      storecode,
      clearanceSortOrder,
    })
  );

  if (normalizedOrders.length === 0) {
    return false;
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  const operations = normalizedOrders.map((order) => ({
    updateOne: {
      filter: { storecode: order.storecode },
      update: { $set: { clearanceSortOrder: order.clearanceSortOrder } },
    },
  }));

  const result: any = await collection.bulkWrite(operations, { ordered: false });

  if (typeof result?.acknowledged === "boolean") {
    return result.acknowledged;
  }

  if (typeof result?.result?.ok === "number") {
    return result.result.ok === 1;
  }

  if (typeof result?.matchedCount === "number") {
    return result.matchedCount >= 0;
  }

  if (typeof result?.modifiedCount === "number") {
    return result.modifiedCount >= 0;
  }

  // bulkWrite가 예외 없이 종료되면 성공으로 간주
  return true;
}





// getPrivateSellerWalletAddressFromStorecode
export async function getPrivateSellerWalletAddressFromStorecode(
  {
    storecode,
  }: {
    storecode: string;
  }
): Promise<string | null> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // get storecode
  const result = await collection.findOne<any>(
    { storecode: storecode },
    { projection: { privateSellerWalletAddress: 1 } }
  );
  if (result && result.privateSellerWalletAddress) {
    return result.privateSellerWalletAddress;
  } else {
    return null;
  }
}



// bankAccountNumber 가 stores collection 에 있으면 storeInfo 반환
export async function getStoreByBankAccountNumber({
  bankAccountNumber,
}: {
  bankAccountNumber: string;
}): Promise<any> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  const result = await collection.findOne<any>(
    {
      $or: [
        { 'bankInfo.accountNumber': bankAccountNumber },
        { 'bankInfoAAA.accountNumber': bankAccountNumber },
        { 'bankInfoBBB.accountNumber': bankAccountNumber },
        { 'bankInfoCCC.accountNumber': bankAccountNumber },
        { 'bankInfoDDD.accountNumber': bankAccountNumber },
      ],
    },
  );

  return result;
}
