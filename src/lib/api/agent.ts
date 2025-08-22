import { admin } from '@/thirdweb/10/0x0b2c639c533813f4aa9d7837caf62653d097ff85';
import clientPromise from '../mongodb';

import { dbName } from '../mongodb';


// insertAgent
export async function insertAgent(data: any) {
  //console.log('insertAgent data: ' + JSON.stringify(data));
  /*
  insertAgent data: {"agentcode":"testagentcode","agentName":"테스트상점","agentType":"test","agentUrl":"https://test.com","agentDescription":"설명입니다.","agentLogo":"https://test.com/logo.png","agentBanner":"https://test.com/banner.png"}
  */
  if (!data.agentcode || !data.agentName) {
    
    
    console.log('insertAgent data is invalid');
    console.log('insertAgent data: ' + JSON.stringify(data));



    return null;
  }
  const client = await clientPromise;
  const collection = client.db(dbName).collection('agents');
  // check agentcode is unique
  const agents = await collection.findOne<any>(
    {
      //agentcode: data.agentcode or agentName: data.agentName
      $or: [
        { agentcode: data.agentcode },
        { agentName: data.agentName },
      ],

    }
  );

  console.log('insertAgent agents: ' + JSON.stringify(agents));

  if (agents) {
    console.log('agentcode or agentName is already exist');
    return null;
  }



  // insert agentcode
  const result = await collection.insertOne(
    {
      agentcode: data.agentcode,
      agentName: data.agentName.trim(),
      agentType: data.agentType,
      agentUrl: data.agentUrl,
      agentDescription: data.agentDescription,
      agentLogo: data.agentLogo,
      agentBanner: data.agentBanner,
      createdAt: new Date().toISOString(),
    }
  );







  //console.log('insertAgent result: ' + JSON.stringify(result));
  if (result) {
    const updated = await collection.findOne<any>(
      { _id: result.insertedId }
    );
    return {
      _id: result.insertedId,
      agentcode: data.agentcode,
    };
  } else {
    return null;
  }
}








// getAgentByAgentcode
export async function getAgentByAgentcode(
  {
    agentcode,
  }: {
    agentcode: string;
  }

): Promise<any> {

  console.log('getAgentByAgentcode agentcode: ' + agentcode);


  

  const client = await clientPromise;
  const collection = client.db(dbName).collection('agents');

  const result = await collection.findOne<any>(
    { agentcode: agentcode }
  );

  //console.log('getAgentByAgentcode result: ' + JSON.stringify(result));


  /*

getAgentByAgentcode result: {
"_id":"68308cf1c414d831e724a48b",
"agentcode":"gjmrclph","agentName":"SM엔터","agentType":"test","agentUrl":"https://test.com","agentDescription":"SM엔터 에이전트","agentLogo":"https://www.stable.makeup/logo.png","agentBanner":"https://www.stable.makeup/logo.png","createdAt":"2025-05-23T14:57:53.503Z","agentFeeWalletAddress":"0x80bBe3A61124339780E90e8eB2BF58F26e189312",
"adminWalletAddress":"0x98773aF65AE660Be4751ddd09C4350906e9D88F3","totalStoreCount":5}
  */




  if (result) {
    return result;
  } else {
    return null;
  }

}




export async function updateAgentLogo(data: any) {
    const client = await clientPromise;
    const collection = client.db(dbName).collection('agents');
  
  
    // update agentLogo
    const result = await collection.updateOne(
      { agentcode: data.agentcode },
      { $set: { agentLogo: data.agentLogo } }
    );
    if (result.modifiedCount === 0) {
      throw new Error('Failed to update agent logo');
    }
    return {
      success: true,
      message: 'Agent logo updated successfully',
    };
  
}


// updateAgentMemo
export async function updateAgentMemo(data: any) {
    const client = await clientPromise;
    const collection = client.db(dbName).collection('agents');
  
    // update agentMemo
    const result = await collection.updateOne(
      { agentcode: data.agentcode },
      { $set: { agentMemo: data.agentMemo } }
    );
    if (result.modifiedCount === 0) {
      throw new Error('Failed to update agent memo');
    }
    return {
      success: true,
      message: 'Agent memo updated successfully',
    };
  
}

// getOneAgentMemo
export async function getOneAgentMemo(data: any) {
    const client = await clientPromise;
    const collection = client.db(dbName).collection('agents');
  
    // get agentMemo
    const result = await collection.findOne(
      { agentcode: data.agentcode },
      { projection: { agentMemo: 1 } }
    );


    if (!result) {
      throw new Error('Agent not found');
    }


    return {
      success: true,
      message: 'Agent memo retrieved successfully',
      agentMemo: result.agentMemo,
    };
  
}



// updateAgentName
export async function updateAgentName(data: any) {

    //console.log('updateAgentName', data);



    const client = await clientPromise;
    const collection = client.db(dbName).collection('agents');
  
    // update agentName
    const result = await collection.updateOne(
      { agentcode: data.agentcode },
      { $set: { agentName: data.agentName } }
    );
    if (result.modifiedCount === 0) {
      throw new Error('Failed to update agent name');
    }
    return {
      success: true,
      message: 'Agent name updated successfully',
    };
  
}


// updateAgentDescription
export async function updateAgentDescription(data: any) {
    const client = await clientPromise;
    const collection = client.db(dbName).collection('agents');
  
    // update agentDescription
    const result = await collection.updateOne(
      { agentcode: data.agentcode },
      { $set: { agentDescription: data.agentDescription } }
    );
    if (result.modifiedCount === 0) {
      throw new Error('Failed to update agent description');
    }
    return {
      success: true,
      message: 'Agent description updated successfully',
    };
  
}







// updateAgentAdminWalletAddress
export async function updateAgentAdminWalletAddress(
  {
    agentcode,
    adminWalletAddress,
  }: {
    agentcode: string;
    adminWalletAddress: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('agents');

  // update agentcode
  const result = await collection.updateOne(
    { agentcode: agentcode },
    { $set: { adminWalletAddress: adminWalletAddress } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}


// updateAgentSellerWalletAddress
export async function updateAgentSellerWalletAddress(
  {
    agentcode,
    sellerWalletAddress,
  }: {
    agentcode: string;
    sellerWalletAddress: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('agents');

  // update agentcode
  const result = await collection.updateOne(
    { agentcode: agentcode },
    { $set: { sellerWalletAddress: sellerWalletAddress } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}


// updateAgentSettlementWalletAddress
export async function updateAgentSettlementWalletAddress(
  {
    agentcode,
    settlementWalletAddress,
  }: {
    agentcode: string;
    settlementWalletAddress: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('agents');

  // update agentcode
  const result = await collection.updateOne(
    { agentcode: agentcode },
    { $set: { settlementWalletAddress: settlementWalletAddress } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}


//  updateAgentSettlementFeeWalletAddress
export async function updateAgentSettlementFeeWalletAddress(
  {
    agentcode,
    settlementFeeWalletAddress,
  }: {
    agentcode: string;
    settlementFeeWalletAddress: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('agents');

  // update agentcode
  const result = await collection.updateOne(
    { agentcode: agentcode },
    { $set: { settlementFeeWalletAddress: settlementFeeWalletAddress } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}



// updateAgentSettlementFeePercent
export async function updateAgentSettlementFeePercent(
  {
    agentcode,
    settlementFeePercent,
  }: {
    agentcode: string;
    settlementFeePercent: number;
  }
): Promise<boolean> {


  console.log('updateAgentSettlementFeePercent', agentcode, settlementFeePercent);



  const client = await clientPromise;
  const collection = client.db(dbName).collection('agents');

  // update agentcode
  const result = await collection.updateOne(
    { agentcode: agentcode },
    { $set: { settlementFeePercent: settlementFeePercent } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}


// updateAgentBankInfo
export async function updateAgentBankInfo(
  {
    walletAddress,
    agentcode,
    bankName,
    accountNumber,
    accountHolder,
  }: {
    walletAddress: string;
    agentcode: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('agents');

  const bankInfo = {
    bankName,
    accountNumber,
    accountHolder,
  };

  // update agentcode
  const result = await collection.updateOne(
    { agentcode: agentcode },
    { $set: { bankInfo: bankInfo } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}


// getAllAgents
export async function getAllAgents(
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

  console.log('getAllAgents', limit, page, search);


  const client = await clientPromise;
  const collection = client.db(dbName).collection('agents');

  const query: any = {};

  if (search) {
    query.agentName = { $regex: String(search), $options: 'i' };
  }

  // exclude agentcode is "head"
  query.agentcode = { $ne: 'head' };

  

  const totalCount = await collection.countDocuments(query);

  const agents = await collection
    .find(query)
    .project({
      agentcode: 1,
      agentName: 1,
      agentLogo: 1,
      adminWalletAddress: 1,
      agentFeeWalletAddress: 1,

      usdtKRWRate: 1,

      totalStoreCount: 1,
      totalTradeCount: 1,
      totalTradeAmount: 1,
      totalTradeAmountKRW: 1,

      totalKrwAmount: 1,
      totalUsdtAmount: 1,

      totalPaymentConfirmedCount: 1,
      totalPaymentConfirmedAmount: 1,
      totalPaymentConfirmedAmountKRW: 1,

      totalSettlementCount: 1,
      totalSettlementAmount: 1,
      totalSettlementAmountKRW: 1,

      totalFeeAmount: 1,
      totalFeeAmountKRW: 1,



    })
    
    //.sort({ createdAt: -1 })
    // order by totalTradeAmountUSDT descending
    .sort({ totalTradeAmountUSDT: -1 })



    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  //console.log('getAllAgents agents', agents);



  return {
    totalCount,
    agents,
  };
}



// updatePayactionKeys
export async function updatePayactionKeys(
  {
    walletAddress,
    agentcode,
    payactionKey,
  }: {
    walletAddress: string;
    agentcode: string;
    payactionKey: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('agents');

  // update agentcode
  const result = await collection.updateOne(
    { agentcode: agentcode },
    { $set: { payactionKey: payactionKey } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}


// updateBackgroundColor
export async function updateBackgroundColor(
  {
    walletAddress,
    agentcode,
    backgroundColor,
  }: {
    walletAddress: string;
    agentcode: string;
    backgroundColor: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('agents');

  // update agentcode
  const result = await collection.updateOne(
    { agentcode: agentcode },
    { $set: { backgroundColor: backgroundColor } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}



// getAgentByStorecode
export async function getAgentByStorecode(
  {
    storecode,
  }: {
    storecode: string;
  }
): Promise<any> {

  console.log('getAgentByStorecode storecode: ' + storecode);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('agents');

  const result = await collection.findOne<any>(
    { storecode: storecode }
  );

  //console.log('getAgentByStorecode result: ' + JSON.stringify(result));

  if (result) {
    return result;
  } else {
    return null;
  }

}


// updateAgentFeeWalletAddress
export async function updateAgentFeeWalletAddress(
  {
    agentcode,
    agentFeeWalletAddress,
  }: {
    agentcode: string;
    agentFeeWalletAddress: string;
  }
): Promise<boolean> {

  console.log('updateAgentFeeWalletAddress', agentcode, agentFeeWalletAddress);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('agents');

  // update agentcode
  const result = await collection.updateOne(
    { agentcode: agentcode },
    { $set: { agentFeeWalletAddress: agentFeeWalletAddress } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}



// updateAgentFeePercent
export async function updateAgentFeePercent(
  {
    agentcode,
    agentFeePercent,
  }: {
    agentcode: string;
    agentFeePercent: number;
  }
): Promise<boolean> {

  console.log('updateAgentFeePercent', agentcode, agentFeePercent);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('agents');

  // update agentcode
  const result = await collection.updateOne(
    { agentcode: agentcode },
    { $set: { agentFeePercent: agentFeePercent } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}


// updateUsdtKRWRate
export async function updateUsdtKRWRate(
  {
    agentcode,
    usdtKRWRate,
  }: {
    agentcode: string;
    usdtKRWRate: number;
  }
): Promise<boolean> {

  console.log('updateUsdtKRWRate', agentcode, usdtKRWRate);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('agents');

  // update agentcode
  const result = await collection.updateOne(
    { agentcode: agentcode },
    { $set: { usdtKRWRate: usdtKRWRate } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}



// getUsdtKRWRate
export async function getUsdtKRWRate(
  {
    agentcode,
  }: {
    agentcode: string;
  }
): Promise<number | null> {

  console.log('getUsdtKRWRate agentcode: ' + agentcode);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('agents');

  const result = await collection.findOne<any>(
    { agentcode: agentcode },
    {
      projection: {
        usdtKRWRate: 1,
      },
    }
  );

  //console.log('getUsdtKRWRate result: ' + JSON.stringify(result));

  if (result) {
    return result.usdtKRWRate;
  } else {
    return null;
  }

}