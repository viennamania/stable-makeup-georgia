import { use } from 'react';
import clientPromise from '../mongodb';

// object id
import { ObjectId } from 'mongodb';
import { create } from 'domain';
import { stat } from 'fs';


export interface UserProps {
  /*
  name: string;
  username: string;
  email: string;
  image: string;
  bio: string;
  bioMdx: MDXRemoteSerializeResult<Record<string, unknown>>;
  followers: number;
  verified: boolean;
  */

  id: string,
  name: string,
  nickname: string,
  storecode: string,
  email: string,
  avatar: string,
  regType: string,
  mobile: string,
  gender: string,
  weight: number,
  height: number,
  birthDate: string,
  purpose: string,
  marketingAgree: string,
  createdAt: string,
  updatedAt: string,
  deletedAt: string,
  loginedAt: string,
  followers : number,
  emailVerified: boolean,
  bio: string,

  password: string,

  seller: any,

  status: string,

  walletAddress: string,

  tradeId: string,

  usdtAmount: number,
  krwAmount: number,
  
  acceptedAt: string,
  paymentRequestedAt: string,
  paymentConfirmedAt: string,
  cancelledAt: string,

  buyer: any,

  transactionHash: string,

  agentcode: string,

  totalPaymentConfirmedCount: number,
  totalPaymentConfirmedKrwAmount: number,
  totalPaymentConfirmedUsdtAmount: number,

}

export interface ResultProps {
  totalCount: number;
  orders: UserProps[];
}




// get usdtPrice by walletAddress
export async function getUsdtPrice(data: any) {

  if (!data.walletAddress) {
    return null;
  }

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('setup');

  const result = await collection.findOne<UserProps>(
    { $and: [ { walletAddress: data.walletAddress }, { usdtPrice: { $exists: true } } ] }
  );

  ///console.log('getUsdtPrice result: ' + JSON.stringify(result));

  //{"_id":"66b9b4431645dcffd9fbe2c2","walletAddress":"0x68B4F181d97AF97d8b111Ad50A79AfeB33CF6be6","usdtPrice":"1404"}

  if (result) {
    return result;
  } else {
    return null;
  }

}






// updatePrice

export async function updatePrice(data: any) {
  
  ///console.log('updatePrice data: ' + JSON.stringify(data));

  if (!data.walletAddress || !data.price) {
    return null;
  }

  ///console.log('updatePrice data.price: ' + data.price);



  const client = await clientPromise;
  const collection = client.db('ultraman').collection('setup');

  // update and return update, or if not exists, insert and return insert

  // check usdtPrice is field of setup collection
  // if exists, update, else insert

  try {

    const result = await collection.findOneAndUpdate(
      { walletAddress: data.walletAddress },
      { $set: { usdtPrice: data.price } },
      { upsert: true, returnDocument: 'after' }
    );

    if (result) {

      ///console.log('updatePrice result: ' + result);

      return result.value;
    } else {
      return null;
    }


  } catch (error) {

    // updatePrice error: MongoInvalidArgumentError: Update document requires atomic operators
    ///console.log('updatePrice error: ' + error);

    return null;
  }




}








export async function insertSellOrder(data: any) {

  //console.log('insertSellOrder data: ' + JSON.stringify(data));

  if (!data.walletAddress || !data.usdtAmount || !data.krwAmount || !data.rate) {
    return null;
  }



  const client = await clientPromise;



  // get user mobile number by wallet address

  const userCollection = client.db('ultraman').collection('users');


  const user = await userCollection.findOne<UserProps>(
    { walletAddress: data.walletAddress },
    { projection: { _id: 0, emailVerified: 0 } }
  );

  if (!user) {
    return null;
  }



  ////console.log('user: ' + user);

  const nickname = user.nickname;

  const mobile = user.mobile;

  const avatar = user.avatar;

  const seller = user.seller;



  const collection = client.db('ultraman').collection('orders');

 
  const result = await collection.insertOne(

    {
      lang: data.lang,
      chain: data.chain,
      walletAddress: data.walletAddress,
      nickname: nickname,
      mobile: mobile,
      avatar: avatar,
      seller: seller,
      usdtAmount: data.usdtAmount,
      krwAmount: data.krwAmount,
      rate: data.rate,
      createdAt: new Date().toISOString(),
      status: 'ordered',
      privateSale: data.privateSale,
    }
  );


  if (result) {
    return {
      orderId: result.insertedId,
    };
  } else {
    return null;
  }
  

}


// getOrderById
/*
error=====>BSONError: input must be a 24 character hex string, 12 byte Uint8Array, or an integer
*/
export async function getOrderById(orderId: string): Promise<UserProps | null> {

  //console.log('getOrderById orderId: ' + orderId);
  ///  orderId 67470264536de8c4c57ab7488


  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');

  
  // check orderId is valid ObjectId
  if (!ObjectId.isValid(orderId)) {
    console.log('getOrderById invalid orderId: ' + orderId);
    return null;
  }


  const result = await collection.findOne<UserProps>(
    {
      _id: new ObjectId(orderId),
    }
  );


  if (result) {
    return result;
  } else {
    return null;
  }

}



// get count of open orders not expired 24 hours after created
export async function getOpenOrdersCount(): Promise<number> {

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');

  const result = await collection.countDocuments(
    { status: 'ordered', createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() } }
  );

  return result;

}






// get sell orders order by createdAt desc
export async function getSellOrders(

  {

    limit,
    page,
    walletAddress,
    searchMyOrders,
  }: {

    limit: number;
    page: number;
    walletAddress: string;
    searchMyOrders: boolean;
  
  }

): Promise<ResultProps> {

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');


  // status is not 'paymentConfirmed'

  // if searchMyOrders is true, get orders by wallet address is walletAddress
  // else get all orders except paymentConfirmed
  // sort status is accepted first, then createdAt desc

  if (searchMyOrders) {

    const results = await collection.find<UserProps>(

      //{ walletAddress: walletAddress, status: { $ne: 'paymentConfirmed' } },
      { walletAddress: walletAddress },
      
      //{ projection: { _id: 0, emailVerified: 0 } }

    )

    .sort({ createdAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();



    return {
      totalCount: results.length,
      orders: results,
    };

  } else {

    const results = await collection.find<UserProps>(
      {
        //status: 'ordered',
  
        status: { $ne: 'paymentConfirmed' },
  
        // exclude private sale
        //privateSale: { $ne: true },
      },
      
      //{ projection: { _id: 0, emailVerified: 0 } }
  
    ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();
  
    return {
      totalCount: results.length,
      orders: results,
    };

  }


}



// get sell orders order by createdAt desc
export async function getAllSellOrders(

  {
    status,
    limit,
    page,
    walletAddress,
    searchMyOrders,
  }: {
    status: string;
    limit: number;
    page: number;
    walletAddress: string;
    searchMyOrders: boolean;
  
  }

): Promise<ResultProps> {

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');


  // status is not 'paymentConfirmed'

  // if searchMyOrders is true, get orders by wallet address is walletAddress
  // else get all orders except paymentConfirmed
  // sort status is accepted first, then createdAt desc

  ///console.log('getAllSellOrders searchMyOrders: ' + searchMyOrders);

  if (searchMyOrders) {

    // if status is 'all', get all orders by wallet address
    // if status is not 'all', get orders by wallet address and status

    const results = await collection.find<UserProps>(

      //{ walletAddress: walletAddress, status: status },

      {
        walletAddress: walletAddress,

        status: status === 'all' ? { $ne: 'nothing' } : status,

      },


    )
    .sort({ createdAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();

    // get total count of orders
    const totalCount = await collection.countDocuments(
      { walletAddress: walletAddress,
        status: status === 'all' ? { $ne: 'nothing' } : status
      }
    );

    return {
      totalCount: totalCount,
      orders: results,
    };

  } else {

    const results = await collection.find<UserProps>(
      
      //{ status: status, },

      {
        status: status === 'all' ? { $ne: 'nothing' } : status,
      },

    ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();

    // get total count of orders
    const totalCount = await collection.countDocuments(
      { status: status }
    );
  
    return {
      totalCount: totalCount,
      orders: results,
    };

  }


}




export async function getOneSellOrder(

  {
    orderId,
  }: {
    orderId: string;  
  }

): Promise<ResultProps> {

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');


  // status is not 'paymentConfirmed'

  // check orderId is valid ObjectId


  if (!ObjectId.isValid(orderId)) {
    return {
      totalCount: 0,
      orders: [],
    };
  }




  const results = await collection.find<UserProps>(
    {

      _id: new ObjectId(orderId),

      //status: 'ordered',

      ///status: { $ne: 'paymentConfirmed' },

      // exclude private sale
      //privateSale: { $ne: true },
    },
    
    //{ projection: { _id: 0, emailVerified: 0 } }

  ).sort({ createdAt: -1 }).toArray();



  return {
    totalCount: results.length,
    orders: results,
  };

}



// deleete sell order by orderId
export async function deleteSellOrder(

  {
    orderId,
    walletAddress,
  }: {
    orderId: string;
    walletAddress: string;
  
  }


): Promise<boolean> {

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');

  // check orderId is valid ObjectId
  if (!ObjectId.isValid(orderId)) {
    return false;
  }

  // check walletAddress is valid

  if (!walletAddress) {
    return false;
  }

  // status is 'ordered'
  const result = await collection.deleteOne(
    { _id: new ObjectId(orderId), walletAddress: walletAddress, status: 'ordered' }
  );



  if (result.deletedCount === 1) {
    return true;
  } else {
    return false;
  }


}


// cancel sell order by orderId from buyer
export async function cancelTradeByBuyer(

  {
    orderId,
    walletAddress,
    cancelTradeReason,
  }: {
    orderId: string;
    walletAddress: string;
    cancelTradeReason: string;
  
  }

) {

  console.log('cancelTradeByBuyer orderId: ' + orderId);

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');

  // check orderId is valid ObjectId
  if (!ObjectId.isValid(orderId)) {

    console.log('cancelTradeByBuyer invalid orderId: ' + orderId);

    return false;
  }

  // check walletAddress is valid

  if (!walletAddress) {

    console.log('cancelTradeByBuyer invalid walletAddress: ' + walletAddress);
    return false;
  }

  // check status is 'accepted'

  // update status to 'cancelled'

  
  const result = await collection.updateOne(
    {
      _id: new ObjectId(orderId + ''),
      status: 'paymentRequested'
    },
    { $set: {
      status: 'cancelled',
      cancelTradeReason: cancelTradeReason,
      cancelledAt: new Date().toISOString(),
    } }
  );


  console.log('cancelTradeByBuyer result: ' + JSON.stringify(result));
  /*
  cancelTradeByBuyer result: {"acknowledged":true,"modifiedCount":0,"upsertedId":null,"upsertedCount":0,"matchedCount":0}
  */

  const updated = await collection.findOne<UserProps>(
    { _id: new ObjectId(orderId) }
  );

  if (result) {
    return {
      updated,
    }
  } else {
    return null;
  }


}




// cancelTradeByAdmin
// update order status to cancelled
// where status is 'accepted'
// and acceptedAt is more than 1 hour ago

export async function cancelTradeByAdmin() {

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');

  // status is 'accepted'
  // acceptedAt is more than 1 hour ago

  const result = await collection.updateMany(
    { status: 'accepted', acceptedAt: { $lt: new Date(Date.now() - 60 * 60 * 1000).toISOString() } },
    { $set: {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      canceller: 'admin',
    } }
  );

  return result;

}







// get sell orders order by createdAt desc
export async function getSellOrdersForBuyer(

  {
    limit,
    page,
    walletAddress,
    searchMyOrders,
  }: {

    limit: number;
    page: number;
    walletAddress: string;
    searchMyOrders: boolean;
  }

): Promise<ResultProps> {

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');


  // status is not 'paymentConfirmed'



  // if searchMyOrders is true, get orders by buyer wallet address is walletAddress
  // else get all orders except paymentConfirmed

  if (searchMyOrders) {

    const results = await collection.find<UserProps>(
      {
        'buyer.walletAddress': walletAddress,
        status: { $ne: 'paymentConfirmed' },
      },
      
      //{ projection: { _id: 0, emailVerified: 0 } }

    ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();

    return {
      totalCount: results.length,
      orders: results,
    };

  } else {

    const results = await collection.find<UserProps>(
      {
        //status: 'ordered',
  
        status: { $ne: 'paymentConfirmed' },
  
        // exclude private sale
        privateSale: { $ne: true },
      },
      
      //{ projection: { _id: 0, emailVerified: 0 } }
  
    ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();
  
    return {
      totalCount: results.length,
      orders: results,
    };

  }


}





// get sell orders by wallet address order by createdAt desc
export async function getSellOrdersByWalletAddress(

  {
    walletAddress,
    limit,
    page,
  }: {
    walletAddress: string;
    limit: number;
    page: number;
  
  }

): Promise<ResultProps> {

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');


  const results = await collection.find<UserProps>(
    { walletAddress: walletAddress },
  ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();

  return {
    totalCount: results.length,
    orders: results,
  };

}



// accept sell order
// update order status to accepted

export async function acceptSellOrder(data: any) {
  
  ///console.log('acceptSellOrder data: ' + JSON.stringify(data));




  if (!data.orderId || !data.buyerWalletAddress ) {
    return null;
  }

  const buyerMemo = data.buyerMemo || '';


  const depositName = data.depositName || '';

  const depositBankName = data.depositBankName || '';




  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');

  // random number for tradeId
  // 100000 ~ 999999 string

  const tradeId = Math.floor(Math.random() * 900000) + 100000 + '';



  /*
    const result = await collection.findOne<UserProps>(
    { _id: new ObjectId(orderId) }
  );
  */


  ///console.log('acceptSellOrder data.orderId: ' + data.orderId);

 
  // *********************************************
  // update status to accepted if status is ordered

  // if status is not ordered, return null
  // check condition and update status to accepted
  // *********************************************

  const result = await collection.findOneAndUpdate(
    
    { _id: new ObjectId(data.orderId + ''), status: 'ordered' },

    { $set: {
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      tradeId: tradeId,
      buyer: {
        walletAddress: data.buyerWalletAddress,
        nickname: data.buyerNickname,
        avatar: data.buyerAvatar,
        mobile: data.buyerMobile,
        memo: buyerMemo,
        depositName: depositName,
        depositBankName: depositBankName,
      },
    } }
  );









  /*
  const result = await collection.updateOne(
    
    //{ _id: new ObjectId(data.orderId) },

    { _id: new ObjectId( data.orderId + '' ) },




    { $set: {
      status: 'accepted',
      acceptedAt: new Date().toISOString(),


      tradeId: tradeId,

      buyer: {
        walletAddress: data.buyerWalletAddress,
        nickname: data.buyerNickname,
        avatar: data.buyerAvatar,
        mobile: data.buyerMobile,

      },
    } }
  );
  */


  ////console.log('acceptSellOrder result: ' + result);




  if (result) {

    const updated = await collection.findOne<UserProps>(
      { _id: new ObjectId(data.orderId + '') }
    );

    ///console.log('acceptSellOrder updated: ' + JSON.stringify(updated));



    return updated;

  } else {
    return null;
  }
  
}






export async function requestPayment(data: any) {
  
  ///console.log('acceptSellOrder data: ' + JSON.stringify(data));

  if (!data.orderId) {
    return null;
  }

  if (!data.transactionHash) {
    return null;
  }


  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');


  const result = await collection.updateOne(
    
    { _id: new ObjectId(data.orderId + '') },


    { $set: {
      status: 'paymentRequested',
      escrowTransactionHash: data.transactionHash,
      paymentRequestedAt: new Date().toISOString(),
    } }
  );

  if (result) {
    const updated = await collection.findOne<UserProps>(
      { _id: new ObjectId(data.orderId + '') }
    );

    return updated;
  } else {
    return null;
  }
  
}





export async function confirmPayment(data: any) {
  
  if (!data.orderId) {
    return null;
  }

  if (!data.transactionHash) {
    return null;
  }

  const paymentAmount = data.paymentAmount || 0;



  ///console.log('confirmPayment orderId: ' + data.orderId);
  


  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');


  const result = await collection.updateOne(
    
    { _id: new ObjectId(data.orderId+'') },


    { $set: {
      status: 'paymentConfirmed',
      paymentAmount: paymentAmount,
      queueId: data.queueId,
      transactionHash: data.transactionHash,
      paymentConfirmedAt: new Date().toISOString(),
    } }
  );

  if (result) {






    // update store collection
    // get count of paymentConfirmed orders by storecode
    // get sum of krwAmount and usdtAmount by storecode

    // get storecode from order
    const order = await collection.findOne<UserProps>(
      { _id: new ObjectId(data.orderId+'') },
      { projection: {
        storecode: 1,
        agentcode: 1,
      } }
    );


    if (order) {
      const storecode = order.storecode;

      console.log('confirmPayment storecode: ' + storecode);

      const totalPaymentConfirmedCount = await collection.countDocuments(
        { storecode: storecode, status: 'paymentConfirmed' }
      );

      console.log('confirmPayment totalPaymentConfirmedCount: ' + totalPaymentConfirmedCount);


      const totalKrwAmount = await collection.aggregate([
        { $match: { storecode: storecode, status: 'paymentConfirmed' } },
        { $group: { _id: null, totalKrwAmount: { $sum: '$krwAmount' } } }
      ]).toArray();

      console.log('confirmPayment totalKrwAmount: ' + totalKrwAmount[0]?.totalKrwAmount || 0);


      const totalUsdtAmount = await collection.aggregate([
        { $match: { storecode: storecode, status: 'paymentConfirmed' } },
        { $group: { _id: null, totalUsdtAmount: { $sum: '$usdtAmount' } } }
      ]).toArray();

      console.log('confirmPayment totalUsdtAmount: ' + totalUsdtAmount[0]?.totalUsdtAmount || 0);



      // update store collection
      const storeCollection = client.db('ultraman').collection('stores');
      const store = await storeCollection.updateOne(
        { storecode: storecode },
        { $set: {
            totalPaymentConfirmedCount: totalPaymentConfirmedCount,
            totalKrwAmount: totalKrwAmount[0]?.totalKrwAmount || 0,
            totalUsdtAmount: totalUsdtAmount[0]?.totalUsdtAmount || 0,
        } }
      );






    // update agnet collection
      const agentcode = order?.agentcode || '';


      // get totalPaymentConfirmedCount and totalKrwAmount and totalUsdtAmount by agentcode
      if (!agentcode) {
        console.log('confirmPayment agentcode is null');
        return null;
      }

      const totalPaymentConfirmedCountByAgent = await collection.countDocuments(
        { agentcode: agentcode, status: 'paymentConfirmed' }
      );

      console.log('confirmPayment totalPaymentConfirmedCountByAgent: ' + totalPaymentConfirmedCountByAgent);
      const totalKrwAmountByAgent = await collection.aggregate([
        { $match: { agentcode: agentcode, status: 'paymentConfirmed' } },
        { $group: { _id: null, totalKrwAmount: { $sum: '$krwAmount' } } }
      ]).toArray();
      console.log('confirmPayment totalKrwAmountByAgent: ' + totalKrwAmountByAgent[0]?.totalKrwAmount || 0);

      const totalUsdtAmountByAgent = await collection.aggregate([
        { $match: { agentcode: agentcode, status: 'paymentConfirmed' } },
        { $group: { _id: null, totalUsdtAmount: { $sum: '$usdtAmount' } } }
      ]).toArray();
      console.log('confirmPayment totalUsdtAmountByAgent: ' + totalUsdtAmountByAgent[0]?.totalUsdtAmount || 0);


      // update agent collection
      const agentCollection = client.db('ultraman').collection('agents');
      const agent = await agentCollection.updateOne(
        { agentcode: agentcode },
        { $set: {
          totalPaymentConfirmedCount: totalPaymentConfirmedCountByAgent,
          totalKrwAmount: totalKrwAmountByAgent[0]?.totalKrwAmount || 0,
          totalUsdtAmount: totalUsdtAmountByAgent[0]?.totalUsdtAmount || 0,
        } }
      );









    }





   





    const updated = await collection.findOne<UserProps>(
      { _id: new ObjectId(data.orderId+'') }
    );

    return updated;
  } else {
    return null;
  }
  
}





// get sell orders by wallet address order by createdAt desc
export async function getTradesByWalletAddress(

  {
    walletAddress,
    limit,
    page,
  }: {
    walletAddress: string;
    limit: number;
    page: number;
  
  }

): Promise<ResultProps> {



  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');


  // get orders by buyer.walletAddress = walletAddress 
  // tradeId is not null

  const results = await collection.find<UserProps>(

    { 'buyer.walletAddress': walletAddress, tradeId: { $ne: null } },

  ).sort({ acceptedAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();



  //console.log('getTradesByWalletAddress results: ' + JSON.stringify(results)); 



  return {
    totalCount: results.length,
    orders: results,
  };

}




// get sell orders by wallet address order by createdAt desc
export async function getTradesByWalletAddressProcessing(

  {
    walletAddress,
    limit,
    page,
  }: {
    walletAddress: string;
    limit: number;
    page: number;
  
  }

): Promise<ResultProps> {



  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');


  // get orders by buyer.walletAddress = walletAddress 
  // tradeId is not null
  // status is not 'paymentConfirmed'

  const results = await collection.find<UserProps>(

    {
      'buyer.walletAddress': walletAddress,
      tradeId: { $ne: null },
      status: { $ne: 'paymentConfirmed' },
    },

  ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();


  return {
    totalCount: results.length,
    orders: results,
  };

}






// get sell trades by wallet address order by createdAt desc
export async function getSellTradesByWalletAddress(

  {
    walletAddress,
    limit,
    page,
  }: {
    walletAddress: string;
    limit: number;
    page: number;
  
  }

): Promise<ResultProps> {



  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');


  // get orders by buyer.walletAddress = walletAddress 
  // tradeId is not null

  const results = await collection.find<UserProps>(

    { 'walletAddress': walletAddress, tradeId: { $ne: null } },

  ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();


  return {
    totalCount: results.length,
    orders: results,
  };

}




// get sell trades by wallet address order by createdAt desc
// status is not 'paymentConfirmed'
export async function getSellTradesByWalletAddressProcessing(

  {
    walletAddress,
    limit,
    page,
  }: {
    walletAddress: string;
    limit: number;
    page: number;
  
  }

): Promise<ResultProps> {



  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');


  // get orders by buyer.walletAddress = walletAddress 
  // tradeId is not null

  const results = await collection.find<UserProps>(

    {
      'walletAddress': walletAddress,
      tradeId: { $ne: null },
      status: { $ne: 'paymentConfirmed' },
    },

  ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();


  return {
    totalCount: results.length,
    orders: results,
  };

}



// get paymentRequested trades by wallet address
// and sum of usdtAmount
export async function getPaymentRequestedUsdtAmountByWalletAddress(

  {
    walletAddress,
  }: {
    walletAddress: string;
  
  }

): Promise<any> {

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');

  const results = await collection.aggregate([
    {
      $match: {
        'walletAddress': walletAddress,
        status: 'paymentRequested',
      }
    },
    {
      $group: {
        _id: null,
        totalUsdtAmount: { $sum: '$usdtAmount' },
      }
    }
  ]).toArray();

  if (results.length > 0) {
    return results[0];
  } else {
    return null;
  }


}








export async function updateOne(data: any) {
  const client = await clientPromise;
  const collection = client.db('ultraman').collection('users');


  // update and return updated user

  if (!data.walletAddress || !data.nickname) {
    return null;
  }


  const result = await collection.updateOne(
    { walletAddress: data.walletAddress },
    { $set: { nickname: data.nickname } }
  );

  if (result) {
    const updated = await collection.findOne<UserProps>(
      { walletAddress: data.walletAddress },
      { projection: { _id: 0, emailVerified: 0 } }
    );

    return updated;
  }


}





export async function sellOrderRollbackPayment(data: any) {
  

  if (!data.orderId) {
    return null;
  }

  if (!data.transactionHash) {
    return null;
  }

  const paymentAmount = data.paymentAmount || 0;


  const client = await clientPromise;
  const collection = client.db('ultraman').collection('orders');


  const result = await collection.updateOne(
    
    { _id: new ObjectId(data.orderId+'') },


    { $set: {
      status: 'cancelled',
      paymentAmount: paymentAmount,
      queueId: data.queueId,
      transactionHash: data.transactionHash,
      cancelledAt: new Date().toISOString(),
      rollbackAmount: paymentAmount,
    } }
  );

  if (result) {
    const updated = await collection.findOne<UserProps>(
      { _id: new ObjectId(data.orderId+'') }
    );

    return updated;
  } else {
    return null;
  }
  
}










// "ordered" : "주문완료"

export async function insertBuyOrder(data: any) {


  if (!data.storecode || !data.walletAddress || !data.usdtAmount || !data.krwAmount || !data.rate) {
    
    console.log('insertBuyOrder data is null: ' + JSON.stringify(data));
    
    return null;
  }


  const nickname = data.nickname || '';


  const client = await clientPromise;


  const storeCollection = client.db('ultraman').collection('stores');
  const store = await storeCollection.findOne<any>(
    { storecode: data.storecode },
    { projection:
      { _id: 1,
        agentcode: 1,
        storecode: 1,
        storeName: 1,
        storeType: 1,
        storeUrl: 1,
        storeDescription: 1,
        storeLogo: 1,
        totalBuyerCount: 1,
        sellerWalletAddress: 1,
        adminWalletAddress: 1,
        settlementWalletAddress: 1,
        settlementFeeWalletAddress: 1,
        settlementFeePercent: 1,
        bankInfo: 1,
        agentFeePercent: 1,

        totalSettlementAmount: 1,
        totalUsdtAmountClearance: 1,
      }
    }
  );

  if (!store) {

    console.log('insertBuyOrder storecode is not valid: ' + data.storecode);
    return null;
  }


  const userCollection = client.db('ultraman').collection('users');


  const user = await userCollection.findOne<UserProps>(
    {
      storecode: data.storecode,
      walletAddress: data.walletAddress
    },
  );

  if (!user) {
    console.log('insertBuyOrder user is null: ' + JSON.stringify(user));
    return null;
  }


  // get agent by storecode

  const agentcode = store.agentcode || '';


  if (!agentcode) {
    console.log('insertBuyOrder agentcode is null: ' + agentcode);
    return null;
  }


  const agentCollection = client.db('ultraman').collection('agents');
  const agent = await agentCollection.findOne<any>(
    { agentcode: agentcode },
  );

  if (!agent) {
    console.log('insertBuyOrder agent is null: ' + JSON.stringify(agent));
    return null;
  }



  const mobile = user?.mobile;

  const avatar = user?.avatar;

  
  //const seller = user.seller;



  const tradeId = Math.floor(Math.random() * 90000000) + 10000000 + '';

  ///console.log('insertBuyOrder tradeId: ' + tradeId);



  const collection = client.db('ultraman').collection('buyorders');

 
  const result = await collection.insertOne(

    {
      lang: data.lang,
      agentcode: agentcode,
      agent: agent,
      storecode: data.storecode,
      store: store,

      walletAddress: data.walletAddress,
      nickname: nickname,
      mobile: mobile,
      avatar: avatar,
      
      userStats: {
        totalPaymentConfirmedCount: user.totalPaymentConfirmedCount || 0,
        totalPaymentConfirmedKrwAmount: user.totalPaymentConfirmedKrwAmount || 0,
        totalPaymentConfirmedUsdtAmount: user.totalPaymentConfirmedUsdtAmount || 0,
      },
      
      //seller: seller,

      usdtAmount: data.usdtAmount,
      krwAmount: data.krwAmount,
      rate: data.rate,
      createdAt: new Date().toISOString(),
      status: 'ordered',
      privateSale: data.privateSale,
      
      buyer: data.buyer,

      tradeId: tradeId,
    }
  );

  
  
  ///console.log('insertBuyOrder result: ' + JSON.stringify(result));


  if (result) {


    // update user collection buyOrderStatus to "ordered"

    await userCollection.updateOne(
      {
        walletAddress: data.walletAddress,
        storecode: data.storecode,
      },
      { $set: {
        buyOrderStatus: 'ordered',
        latestBuyOrder: {
          _id: result.insertedId,
          tradeId: tradeId,
          storecode: data.storecode,
          storeName: store.storeName,
          storeLogo: store.storeLogo,
          usdtAmount: data.usdtAmount,
          krwAmount: data.krwAmount,
          rate: data.rate,
          createdAt: new Date().toISOString(),
        }
      } }
    );



    const updated = await collection.findOne<UserProps>(
      { _id: result.insertedId }
    );

    return {

      _id: result.insertedId,

      walletAddress: data.walletAddress,
      
    };


    
  } else {
    return null;
  }
  

}









export async function insertBuyOrderForClearance(data: any) {


  if (!data.storecode || !data.walletAddress || !data.usdtAmount || !data.krwAmount || !data.rate) {
    
    console.log('insertBuyOrderForClearance data is null: ' + JSON.stringify(data));
    
    return null;
  }


  const nickname = data.nickname || '';


  const client = await clientPromise;


  const storeCollection = client.db('ultraman').collection('stores');
  const store = await storeCollection.findOne<any>(
    { storecode: data.storecode },
    { projection:
      { _id: 1,
        agentcode: 1,
        storecode: 1,
        storeName: 1,
        storeType: 1,
        storeUrl: 1,
        storeDescription: 1,
        storeLogo: 1,
        totalBuyerCount: 1,
        sellerWalletAddress: 1,
        adminWalletAddress: 1,
        settlementWalletAddress: 1,
        settlementFeeWalletAddress: 1,
        settlementFeePercent: 1,
        bankInfo: 1,
        agentFeePercent: 1,

        totalSettlementAmount: 1,
        totalUsdtAmountClearance: 1,
      }
    }
  );

  if (!store) {

    console.log('insertBuyOrderForClearance storecode is not valid: ' + data.storecode);
    return null;
  }



  // check clearance user exists
  // clearance user's storecode is 'admin'
  const clearanceStorecode = 'admin';

  const userCollection = client.db('ultraman').collection('users');


  const user = await userCollection.findOne<UserProps>(
    {
      storecode: clearanceStorecode,
      walletAddress: data.walletAddress
    },
  );

  if (!user) {
    console.log('insertBuyOrderForClearance user is null: ' + JSON.stringify(user));
    return null;
  }


  // get agent by storecode

  const agentcode = store.agentcode || '';


  if (!agentcode) {
    console.log('insertBuyOrderForClearance agentcode is null: ' + agentcode);
    return null;
  }


  const agentCollection = client.db('ultraman').collection('agents');
  const agent = await agentCollection.findOne<any>(
    { agentcode: agentcode },
  );

  if (!agent) {
    console.log('insertBuyOrderForClearance agent is null: ' + JSON.stringify(agent));
    return null;
  }



  const mobile = user?.mobile;

  const avatar = user?.avatar;

  
  //const seller = user.seller;



  const tradeId = Math.floor(Math.random() * 90000000) + 10000000 + '';

  ///console.log('insertBuyOrder tradeId: ' + tradeId);



  const collection = client.db('ultraman').collection('buyorders');

 
  const result = await collection.insertOne(

    {
      lang: data.lang,
      agentcode: agentcode,
      agent: agent,
      storecode: data.storecode,
      store: store,
      walletAddress: data.walletAddress,
      nickname: nickname,
      mobile: mobile,
      avatar: avatar,
      
      //seller: seller,

      usdtAmount: data.usdtAmount,
      krwAmount: data.krwAmount,
      rate: data.rate,
      createdAt: new Date().toISOString(),
      status: 'ordered',
      privateSale: data.privateSale,
      
      buyer: data.buyer,

      tradeId: tradeId,
    }
  );

  
  
  ///console.log('insertBuyOrder result: ' + JSON.stringify(result));


  if (result) {


    // update user collection buyOrderStatus to "ordered"

    await userCollection.updateOne(
      {
        walletAddress: data.walletAddress,
        storecode: data.storecode,
      },
      { $set: { buyOrderStatus: 'ordered' } }
    );



    const updated = await collection.findOne<UserProps>(
      { _id: result.insertedId }
    );

    return {

      _id: result.insertedId,

      walletAddress: data.walletAddress,
      
    };


    
  } else {
    return null;
  }
  

}

















export async function insertBuyOrderForUser(data: any) {


  if (!data.storecode || !data.walletAddress || !data.usdtAmount || !data.krwAmount || !data.rate) {
    
    console.log('insertBuyOrderForUser data is null: ' + JSON.stringify(data));

    /*
    {
    "walletAddress":"0x1eba71B17AA4beE24b54dC10cA32AAF0789b8D9A",
    "nickname":"",
    "usdtAmount":7.25,
    "krwAmount":10000,"rate":1380,
    "privateSale":true,
    "buyer":{"depositBankName":"","depositName":""}
    }
    */
    
    return null;
  }


  const nickname = data.nickname || '';


  const client = await clientPromise;


  const storeCollection = client.db('ultraman').collection('stores');
  const store = await storeCollection.findOne<any>(
    { storecode: data.storecode },
    { projection:
      { _id: 1,
        agentcode: 1,
        storecode: 1,
        storeName: 1,
        storeType: 1,
        storeUrl: 1,
        storeDescription: 1,
        storeLogo: 1,
        totalBuyerCount: 1,
        sellerWalletAddress: 1,
        adminWalletAddress: 1,
        settlementWalletAddress: 1,
        settlementFeeWalletAddress: 1,
        settlementFeePercent: 1,
        bankInfo: 1,
        agentFeePercent: 1,

        totalSettlementAmount: 1,
        totalUsdtAmountClearance: 1,
      }
    }
  );

  if (!store) {

    console.log('insertBuyOrderForUser storecode is not valid: ' + data.storecode);
    return null;
  }



  // get agent by storecode

  const agentcode = store.agentcode || '';


  if (!agentcode) {
    console.log('insertBuyOrderForUser agentcode is null: ' + agentcode);
    return null;
  }


  const agentCollection = client.db('ultraman').collection('agents');
  const agent = await agentCollection.findOne<any>(
    { agentcode: agentcode },
  );

  if (!agent) {
    console.log('insertBuyOrderForUser agent is null: ' + JSON.stringify(agent));
    return null;
  }



  const tradeId = Math.floor(Math.random() * 90000000) + 10000000 + '';

  ///console.log('insertBuyOrder tradeId: ' + tradeId);



  const collection = client.db('ultraman').collection('buyorders');

  const mobile = '';
  const avatar = '';
 
  const result = await collection.insertOne(

    {
      lang: data.lang,
      agentcode: agentcode,
      agent: agent,
      storecode: data.storecode,
      store: store,
      walletAddress: data.walletAddress,
      nickname: nickname,
      mobile: mobile,
      avatar: avatar,
      
      //seller: seller,

      usdtAmount: data.usdtAmount,
      krwAmount: data.krwAmount,
      rate: data.rate,
      createdAt: new Date().toISOString(),
      
      //status: 'ordered',
      status: 'paymentRequested',
      paymentRequestedAt: new Date().toISOString(),

      privateSale: data.privateSale,
      
      buyer: data.buyer,

      seller: data.seller,

      tradeId: tradeId,
    }
  );

  
  
  ///console.log('insertBuyOrder result: ' + JSON.stringify(result));


  if (result) {


    return {

      _id: result.insertedId,

      walletAddress: data.walletAddress,
      
    };


    
  } else {
    return null;
  }
  

}










// get buy orders order by createdAt desc
export async function getBuyOrders(
  {
    limit,
    page,
    agentcode,
    storecode,
    walletAddress,
    searchMyOrders,
    searchOrderStatusCancelled,
    searchOrderStatusCompleted,

    searchStoreName,

    privateSale,

    searchBuyer,
    searchDepositName,

    searchStoreBankAccountNumber,

    fromDate,
    toDate,

  }: {

    limit: number;
    page: number;
    agentcode: string;
    storecode: string;
    walletAddress: string;
    searchMyOrders: boolean;
    searchOrderStatusCancelled: boolean;
    searchOrderStatusCompleted: boolean;

    searchStoreName: string;

    privateSale: boolean;

    searchBuyer: string;
    searchDepositName: string;

    searchStoreBankAccountNumber: string;

    fromDate: string;
    toDate: string;
  }

): Promise<ResultProps> {


  console.log('getBuyOrders fromDate: ' + fromDate);
  console.log('getBuyOrders toDate: ' + toDate);

  console.log('getBuyOrders agentcode: ==========>' + agentcode);

  /*
  getBuyOrders fromDate: 2025-04-04
  getBuyOrders toDate: 2025-05-30
  */

  


  //console.log('getBuyOrders limit: ' + limit);
  //console.log('getBuyOrders page: ' + page);





  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');


  // status is not 'paymentConfirmed'

  // if searchMyOrders is true, get orders by wallet address is walletAddress
  // else get all orders except paymentConfirmed
  // sort status is accepted first, then createdAt desc

  if (searchMyOrders) {

    const results = await collection.find<UserProps>(

      //{ walletAddress: walletAddress, status: { $ne: 'paymentConfirmed' } },
      {
        agentcode: { $regex: agentcode, $options: 'i' },


        storecode: storecode || { $ne: null },
        walletAddress: walletAddress,
        
        status: (searchOrderStatusCancelled && searchOrderStatusCompleted ? { $in: ['cancelled', 'paymentConfirmed'] }
          : (searchOrderStatusCancelled ? 'cancelled'
          : (searchOrderStatusCompleted ? 'paymentConfirmed'
          : { $ne: 'nothing' }))),

        privateSale: privateSale || { $ne: true },
        "store.storeName": { $regex: searchStoreName, $options: 'i' },
        nickname: { $regex: searchBuyer, $options: 'i' },
        "buyer.depositName": { $regex: searchDepositName, $options: 'i' },

        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

        // filter by fromDate and toDate
        // fromDate format: YYYY-MM-DD
        // toDate format: YYYY-MM-DD
        //createdAt: {
        //  $gte: new Date(fromDate ? fromDate + 'T00:00:00Z' : '1970-01-01T00:00:00Z'),
        //  $lte: new Date(toDate ? toDate + 'T23:59:59Z' : new Date().toISOString()),
        //}

        
      },
      
      //{ projection: { _id: 0, emailVerified: 0 } }

    )

    .sort({ createdAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();


    const totalCount = await collection.countDocuments(
      {

        agentcode: { $regex: agentcode, $options: 'i' },

        storecode: storecode || { $ne: null },
        
        walletAddress: walletAddress,

        status: (searchOrderStatusCancelled && searchOrderStatusCompleted ? { $in: ['cancelled', 'paymentConfirmed'] }
          : (searchOrderStatusCancelled ? 'cancelled'
          : (searchOrderStatusCompleted ? 'paymentConfirmed'
          : { $ne: 'nothing' }))),

        pirvateSale: { $ne: true },

        "store.storeName": { $regex: searchStoreName, $options: 'i' },

        nickname: { $regex: searchBuyer, $options: 'i' },
        "buyer.depositName": { $regex: searchDepositName, $options: 'i' },

        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

        // filter by fromDate and toDate
        ///createdAt: {
        //  $gte: new Date(fromDate ? fromDate + 'T00:00:00Z' : '1970-01-01T00:00:00Z'),
        //  $lte: new Date(toDate ? toDate + 'T23:59:59Z' : new Date().toISOString()),
        //}

      }
    );



    return {
      totalCount: totalCount,
      orders: results,
    };

  } else {

    //const fromDateValue = fromDate ? fromDate + 'T00:00:00Z' : '1970-01-01T00:00:00Z';
    //const toDateValue = toDate ? toDate + 'T23:59:59Z' : new Date().toISOString();
    // korean timezone is UTC+9, so we need to convert to UTC time

    //const fromDateValue = fromDate ? fromDate + 'T00:00:00Z' : '1970-01-01T00:00:00Z';

    const fromDateValue = fromDate ? new Date(fromDate + 'T00:00:00+09:00').toISOString() : '1970-01-01T00:00:00Z';

    //const toDateValue = toDate ? toDate + 'T23:59:59Z' : new Date().toISOString();

    const toDateValue = toDate ? new Date(toDate + 'T23:59:59+09:00').toISOString() : new Date().toISOString();

    
    
    console.log('getBuyOrders fromDateValue: ' + fromDateValue);
    console.log('getBuyOrders toDateValue: ' + toDateValue);


    const results = await collection.find<UserProps>(
      {
        agentcode: { $regex: agentcode, $options: 'i' },


        storecode: storecode || { $ne: null },

        // search status is searchOrderStatusCancelled
        // search status is searchOrderStatusCompleted
        // search status is searchOrderStatusCancelled or searchOrderStatusCompleted
        // search status is searchOrderStatusCancelled and searchOrderStatusCompleted

        // status is "cancelled" or "paymentConfirmed"

        // if searchOrderStatusCancelled is true and searchOrderStatusCompleted is true,
        // then status is "cancelled" or "paymentConfirmed"

        // if searchOrderStatusCancelled is true and searchOrderStatusCompleted is false,
        // then status is "cancelled"
        // if searchOrderStatusCancelled is false and searchOrderStatusCompleted is true,
        // then status is "paymentConfirmed"
        // if searchOrderStatusCancelled is false and searchOrderStatusCompleted is false,
        // then status is ne "nothing"

        status: (searchOrderStatusCancelled && searchOrderStatusCompleted ? { $in: ['cancelled', 'paymentConfirmed'] }
          : (searchOrderStatusCancelled ? 'cancelled'
          : (searchOrderStatusCompleted ? 'paymentConfirmed'
          : { $ne: 'nothing' }))),

        // exclude private sale
        //privateSale: { $ne: true },
        privateSale: privateSale || { $ne: true },


        // search store name
        "store.storeName": { $regex: searchStoreName, $options: 'i' },

        // search buyer name
        nickname: { $regex: searchBuyer, $options: 'i' },
        // search deposit name
        "buyer.depositName": { $regex: searchDepositName, $options: 'i' },

        // search store bank account number
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

        // filter by fromDate and toDate
        /*
        createdAt
        "2025-06-03T07:24:10.135Z"
        */
        /* createdAt is string format */
        /* fromDate is string format YYYY-MM-DD */
        /* convert createdAt to Date object */

        createdAt: {
          $gte: fromDateValue,
          $lte: toDateValue,
        }



      
          



      },
      
      //{ projection: { _id: 0, emailVerified: 0 } }
  
    )
    .sort({ createdAt: -1 })
    .limit(limit).skip((page - 1) * limit)
    .toArray();
    //).sort({ paymentConfirmedAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();




    const totalCount = await collection.countDocuments(
      {
        agentcode: { $regex: agentcode, $options: 'i' },


        storecode: storecode || { $ne: null },
        status: (searchOrderStatusCancelled && searchOrderStatusCompleted ? { $in: ['cancelled', 'paymentConfirmed'] }
          : (searchOrderStatusCancelled ? 'cancelled'
          : (searchOrderStatusCompleted ? 'paymentConfirmed'
          : { $ne: 'nothing' }))),

        //privateSale: { $ne: true },
        privateSale: privateSale || { $ne: true },

        "store.storeName": { $regex: searchStoreName, $options: 'i' },

        nickname: { $regex: searchBuyer, $options: 'i' },
        "buyer.depositName": { $regex: searchDepositName, $options: 'i' },

        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

        // filter by fromDate and toDate
        
        createdAt: {
          $gte: fromDateValue,
          $lte: toDateValue,
        }


      }
    );
  
    return {
      totalCount: totalCount,
      orders: results,
    };

  }


}





// deleete sell order by orderId
export async function deleteBuyOrder(

  {
    orderId,
    walletAddress,
  }: {
    orderId: string;
    walletAddress: string;
  
  }


): Promise<boolean> {

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');

  // check orderId is valid ObjectId
  if (!ObjectId.isValid(orderId)) {
    return false;
  }

  // check walletAddress is valid

  if (!walletAddress) {
    return false;
  }

  // status is 'ordered'
  const result = await collection.deleteOne(
    { _id: new ObjectId(orderId), walletAddress: walletAddress, status: 'ordered' }
  );



  if (result.deletedCount === 1) {
    return true;
  } else {
    return false;
  }


}








// get sell orders order by createdAt desc
export async function getBuyOrdersForSeller(

  {
    storecode,
    limit,
    page,
    walletAddress,
    searchMyOrders,
    searchOrderStatusCancelled,
    searchOrderStatusCompleted,
  }: {
    storecode: string;
    limit: number;
    page: number;
    walletAddress: string;
    searchMyOrders: boolean;
    searchOrderStatusCancelled: boolean;
    searchOrderStatusCompleted: boolean;
  }

): Promise<ResultProps> {

  const client = await clientPromise;

  const collection = client.db('ultraman').collection('buyorders');


  // status is not 'paymentConfirmed'

  console.log('getBuyOrdersForSeller storecode: ' + storecode);
  console.log('getBuyOrdersForSeller limit: ' + limit);
  console.log('getBuyOrdersForSeller page: ' + page);





  // if searchMyOrders is true, get orders by buyer wallet address is walletAddress
  // else get all orders except paymentConfirmed

  // if storecode is empty, get all orders by wallet address

  // if storecode is not empty, get orders by storecode and wallet address


  if (searchMyOrders) {

    const results = await collection.find<UserProps>(

      /*
      {
        'storecode': storecode,
        'walletAddress': walletAddress,

        
        //status: { $ne: 'paymentConfirmed' },

      },
      */

      
      {
        storecode:  storecode,
        walletAddress: walletAddress,
        privateSale: { $ne: true },

        status: (searchOrderStatusCancelled && searchOrderStatusCompleted ? { $in: ['cancelled', 'paymentConfirmed'] }
          : (searchOrderStatusCancelled ? 'cancelled'
          : (searchOrderStatusCompleted ? 'paymentConfirmed'
          : { $ne: 'nothing' }))),
      }
    


      
      //{ projection: { _id: 0, emailVerified: 0 } }

    ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();


    const totalCount = await collection.countDocuments(
      {
        storecode: storecode,
        walletAddress: walletAddress,

        privateSale: { $ne: true },

        status: (searchOrderStatusCancelled && searchOrderStatusCompleted ? { $in: ['cancelled', 'paymentConfirmed'] }
          : (searchOrderStatusCancelled ? 'cancelled'
          : (searchOrderStatusCompleted ? 'paymentConfirmed'
          : { $ne: 'nothing' }))),
      }
    );


    return {
      totalCount: totalCount,
      orders: results,
    };

  } else {



    const results = await collection.find<UserProps>(
      {
        //status: 'ordered',
  
        //status: { $ne: 'paymentConfirmed' },
  
        storecode: storecode,
        // exclude private sale
        privateSale: { $ne: true },

        status: (searchOrderStatusCancelled && searchOrderStatusCompleted ? { $in: ['cancelled', 'paymentConfirmed'] }
          : (searchOrderStatusCancelled ? 'cancelled'
          : (searchOrderStatusCompleted ? 'paymentConfirmed'
          : { $ne: 'nothing' }))),

      },
      
      //{ projection: { _id: 0, emailVerified: 0 } }
  
    ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();
  

    const totalCount = await collection.countDocuments(
      {
        storecode: storecode,
        privateSale: { $ne: true },

        status: (searchOrderStatusCancelled && searchOrderStatusCompleted ? { $in: ['cancelled', 'paymentConfirmed'] }
          : (searchOrderStatusCancelled ? 'cancelled'
          : (searchOrderStatusCompleted ? 'paymentConfirmed'
          : { $ne: 'nothing' }))),

      }
    );

    return {
      totalCount: totalCount,
      orders: results,
    };

  }


}



/*
  {
    lang: 'ko',
    storecode: 'suroggyc',
    orderId: new ObjectId('6827479e460e1b9e73417ebc'),
    sellerWalletAddress: '0x98773aF65AE660Be4751ddd09C4350906e9D88F3',
    sellerStorecode: 'admin'
  }
*/



// accept buy order
// update order status to accepted

export async function acceptBuyOrder(data: any) {
  
  //console.log('acceptBuyOrder data: ' + JSON.stringify(data));


  

  /*
  acceptBuyOrder data: {"lang":"kr","chain":"polygon",
  "orderId":"66cbe428254954dcc8929528",
  "sellerWalletAddress":"0x919eB871C4F99b860Da992f51260790BF6dc25a7",
  "sellerNickname":"",
  "sellerAvatar":""}
  */




  if (!data.orderId || !data.storecode || !data.sellerWalletAddress
    || !data.sellerStorecode

  ) {
    return null;
  }

  const sellerMemo = data.sellerMemo || '';


  //const bankInfo = data?.seller?.bankInfo || {};


  ///console.log('acceptBuyOrder bankInfo: ' + JSON.stringify(bankInfo));



  /*
    if (!data.walletAddress || !data.sellerStatus || !data.bankName || !data.accountNumber || !data.accountHolder) {
    return null;
  }

  const seller = {
    status: data.sellerStatus,
    bankInfo: {
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountHolder: data.accountHolder,
    }
  };
  */


  const client = await clientPromise;



  // check validation of storecode

  const storeCollection = client.db('ultraman').collection('stores');
  const stores = await storeCollection.findOne<any>(
    {
      storecode: data.storecode,
    },
  );
  if (!stores) {

    console.log('acceptBuyOrder storecode is not valid: ' + data.storecode);
    return null;
  }



  // get user by wallet address
  let user: UserProps | null = null;







  // if privateSale is false, then get user by storecode and walletAddress
  const order = await client.db('ultraman')
    .collection('buyorders')
    .findOne<any>(
      { _id: new ObjectId(data.orderId + '')},
      { projection: { privateSale: 1 } }
    );


  if (order && order?.privateSale === false) {
    

    const userCollection = client.db('ultraman').collection('users');
    user = await userCollection.findOne<UserProps>(
      {
        walletAddress: data.sellerWalletAddress,
        storecode: data.sellerStorecode,
      },
    );

    if (!user) {

      console.log('acceptBuyOrder user is null: ' + JSON.stringify(user));


      return null;
    }

  }








  const sellerNickname = user?.nickname || '';
  const sellerAvatar = user?.avatar || '';

  const bankInfo = user?.seller?.bankInfo || {
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  };

  const sellerMobile = user?.mobile || '';







  const collection = client.db('ultraman').collection('buyorders');



  // random number for tradeId
  // 100000 ~ 999999 string

  ////const tradeId = Math.floor(Math.random() * 900000) + 100000 + '';



  /*
    const result = await collection.findOne<UserProps>(
    { _id: new ObjectId(orderId) }
  );
  */


  ///console.log('acceptSellOrder data.orderId: ' + data.orderId);

 
  // *********************************************
  // update status to accepted if status is ordered

  // if status is not ordered, return null
  // check condition and update status to accepted
  // *********************************************

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(data.orderId + ''), status: 'ordered' },
    { $set: {
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      ///tradeId: tradeId,
      
      seller: {
        walletAddress: data.sellerWalletAddress,

        /*
        nickname: data.sellerNickname,
        avatar: data.sellerAvatar,
        mobile: data.sellerMobile,
        */

        nickname: sellerNickname,
        avatar: sellerAvatar,
        mobile: sellerMobile,

        memo: sellerMemo,
        bankInfo: bankInfo,

      },

    } }
  );





  if (result) {



    const updated = await collection.findOne<UserProps>(
      { _id: new ObjectId(data.orderId + '') }
    );

    ///console.log('acceptSellOrder updated: ' + JSON.stringify(updated));



    return updated;

  } else {
    
    return null;
  }
  
}







export async function buyOrderRequestPayment(data: any) {
  
  ///console.log('acceptSellOrder data: ' + JSON.stringify(data));

  if (!data.orderId) {

    console.log('buyOrderRequestPayment orderId is null: ' + JSON.stringify(data));
    return null;
  }

  if (!data.transactionHash) {

    console.log('buyOrderRequestPayment transactionHash is null: ' + JSON.stringify(data));
    return null;
  }


  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');


  let result = null;


  if (data?.bankInfo) {

    result = await collection.updateOne(
    
      { _id: new ObjectId(data.orderId + '') },

      { $set: {
        status: 'paymentRequested',
        escrowTransactionHash: data.transactionHash,
        paymentRequestedAt: new Date().toISOString(),
        "seller.bankInfo": data.bankInfo,
        "seller.memo": data.sellerMemo,
      } }

    );




  } else {
  
  
    result = await collection.updateOne(
    
      { _id: new ObjectId(data.orderId + '') },


      { $set: {
        status: 'paymentRequested',
        escrowTransactionHash: data.transactionHash,
        paymentRequestedAt: new Date().toISOString(),
      } }
      
    );

  }
  





  if (result) {


    const order = await collection.findOne<UserProps>(
      { _id: new ObjectId(data.orderId + '') },
      { projection: { storecode: 1, walletAddress: 1 } }
    );
    if (order) {

      // update user collection buyOrderStatus to "paymentRequested"
      const userCollection = client.db('ultraman').collection('users');
      await userCollection.updateOne(
        {
          walletAddress: order.walletAddress,
          storecode: order.storecode,
        },
        { $set: { buyOrderStatus: 'paymentRequested' } }
      );

    }




    const updated = await collection.findOne<UserProps>(
      { _id: new ObjectId(data.orderId + '') }
    );

    return updated;
  } else {
    return null;
  }
  
}





export async function buyOrderConfirmPayment(data: any) {
  

  if (!data.orderId) {
    return null;
  }

  if (!data.transactionHash) {
    return null;
  }

  const paymentAmount = data.paymentAmount || 0;




  const autoConfirmPayment = data.autoConfirmPayment;


  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');

  let result = null;

  if (autoConfirmPayment) {

    result = await collection.updateOne(
      
      { _id: new ObjectId(data.orderId+'') },


      { $set: {
        status: 'paymentConfirmed',
        paymentAmount: paymentAmount,
        queueId: data.queueId,
        transactionHash: data.transactionHash,
        paymentConfirmedAt: new Date().toISOString(),

        autoConfirmPayment: autoConfirmPayment,

      } }
    );

  } else {

    result = await collection.updateOne(
      
      { _id: new ObjectId(data.orderId+'') },

      { $set: {
        status: 'paymentConfirmed',
        paymentAmount: paymentAmount,
        queueId: data.queueId,
        transactionHash: data.transactionHash,
        paymentConfirmedAt: new Date().toISOString(),

      } }
    );

  }




  if (result) {




    // update store collection

    // get count of paymentConfirmed orders by storecode
    // get sum of krwAmount and usdtAmount by storecode
    // get storecode from order
    const order = await collection.findOne<UserProps>(
      { _id: new ObjectId(data.orderId+'') },
      { projection: {
        storecode: 1,
        agentcode: 1,
        walletAddress: 1,
      } }
    );

    if (order && order.storecode) {


      const storecode = order.storecode;
      const walletAddress = order.walletAddress;

      // update user collection buyOrderStatus to "paymentConfirmed"
      const userCollection = client.db('ultraman').collection('users');

      if (userCollection) {

        //const toalPaymentConfirmedCount = await collection.countDocuments(
        //  { walletAddress: order.walletAddress, storecode: order.storecode, status: 'paymentConfirmed' }
        //);
        const totalPaymentConfirmed = await collection.aggregate([
          { $match: { walletAddress: walletAddress, storecode: storecode, status: 'paymentConfirmed' } },
          { $group: {
            _id: null,
            totalPaymentConfirmedCount: { $sum: 1 },
            totalKrwAmount: { $sum: '$krwAmount' },
            totalUsdtAmount: { $sum: '$usdtAmount' }
          }}
        ]).toArray();

        console.log('confirmPayment totalPaymentConfirmed: ' + JSON.stringify(totalPaymentConfirmed));


        await userCollection.updateOne(
          { walletAddress: walletAddress,
            storecode: storecode,
          },
          { $set: {
              buyOrderStatus: 'paymentConfirmed',
              totalPaymentConfirmedCount: totalPaymentConfirmed[0]?.totalPaymentConfirmedCount || 0,
              totalPaymentConfirmedKrwAmount: totalPaymentConfirmed[0]?.totalKrwAmount || 0,
              totalPaymentConfirmedUsdtAmount: totalPaymentConfirmed[0]?.totalUsdtAmount || 0,
            }
          }
        );



      }


      
      
      //console.log('confirmPayment storecode: ' + storecode);

      /*
      const totalPaymentConfirmedCount = await collection.countDocuments(
        {
          storecode: storecode,
          status: 'paymentConfirmed',
          privateSale: false, // exclude private sale
        }
      );
      //console.log('confirmPayment totalPaymentConfirmedCount: ' + totalPaymentConfirmedCount);


      const totalKrwAmount = await collection.aggregate([
        { $match: {
          storecode: storecode,
          status: 'paymentConfirmed',
          privateSale: false, // exclude private sale
        }},
        { $group: { _id: null, totalKrwAmount: { $sum: '$krwAmount' } } }
      ]).toArray();
      //console.log('confirmPayment totalKrwAmount: ' + totalKrwAmount[0]?.totalKrwAmount || 0);


      const totalUsdtAmount = await collection.aggregate([
        
        //{ $match: { storecode: storecode, status: 'paymentConfirmed' } },
        { $match: {
          storecode: storecode,
          status: 'paymentConfirmed',
          privateSale: false, // exclude private sale
        }},

        { $group: { _id: null, totalUsdtAmount: { $sum: '$usdtAmount' } } }
      ]).toArray();
      //console.log('confirmPayment totalUsdtAmount: ' + totalUsdtAmount[0]?.totalUsdtAmount || 0);


      const totalPaymentConfirmedClearanceCount = await collection.countDocuments(
        {
          storecode: storecode,
          status: 'paymentConfirmed',
          privateSale: true, // include private sale
        }
      );
      //console.log('confirmPayment totalPaymentConfirmedClearanceCount: ' + totalPaymentConfirmedClearanceCount);
      const totalKrwAmountClearance = await collection.aggregate([
        { $match: {
          storecode: storecode,
          status: 'paymentConfirmed',
          privateSale: true, // include private sale
        }},
        { $group: { _id: null, totalKrwAmount: { $sum: '$krwAmount' } } }
      ]).toArray();
      //console.log('confirmPayment totalKrwAmountClearance: ' + totalKrwAmountClearance[0]?.totalKrwAmount || 0);
      const totalUsdtAmountClearance = await collection.aggregate([
        { $match: {
          storecode: storecode,
          status: 'paymentConfirmed',
          privateSale: true, // include private sale
        }},
        { $group: { _id: null, totalUsdtAmount: { $sum: '$usdtAmount' } } }
      ]).toArray();



      // update store collection
      const storeCollection = client.db('ultraman').collection('stores');
      const store = await storeCollection.updateOne(
        { storecode: storecode },
        { $set: {
          totalPaymentConfirmedCount: totalPaymentConfirmedCount,
          totalKrwAmount: totalKrwAmount[0]?.totalKrwAmount || 0,
          totalUsdtAmount: totalUsdtAmount[0]?.totalUsdtAmount || 0,

          totalPaymentConfirmedClearanceCount: totalPaymentConfirmedClearanceCount,
          totalKrwAmountClearance: totalKrwAmountClearance[0]?.totalKrwAmount || 0,
          totalUsdtAmountClearance: totalUsdtAmountClearance[0]?.totalUsdtAmount || 0,
        } }
      );
      */

      const totalPaymentConfirmed = await collection.aggregate([
        { $match: {
          storecode: storecode,
          status: 'paymentConfirmed',
          privateSale: false, // exclude private sale
        }},
        { $group: {
          _id: null,
          totalPaymentConfirmedCount: { $sum: 1 },
          totalKrwAmount: { $sum: '$krwAmount' },
          totalUsdtAmount: { $sum: '$usdtAmount' }
        } }
      ]).toArray();


      //console.log('confirmPayment totalPaymentConfirmed: ' + JSON.stringify(totalPaymentConfirmed));
      const totalPaymentConfirmedClearance = await collection.aggregate([
        { $match: {
          storecode: storecode,
          status: 'paymentConfirmed',
          privateSale: true, // include private sale
        }},
        { $group: {
          _id: null,
          totalPaymentConfirmedClearanceCount: { $sum: 1 },
          totalKrwAmountClearance: { $sum: '$krwAmount' },
          totalUsdtAmountClearance: { $sum: '$usdtAmount' }
        } }
      ]).toArray();


      //console.log('confirmPayment totalPaymentConfirmedClearance: ' + JSON.stringify(totalPaymentConfirmedClearance));
      // update store collection
      const storeCollection = client.db('ultraman').collection('stores');
      const store = await storeCollection.updateOne(
        { storecode: storecode },
        { $set: {
          totalPaymentConfirmedCount: totalPaymentConfirmed[0]?.totalPaymentConfirmedCount || 0,
          totalKrwAmount: totalPaymentConfirmed[0]?.totalKrwAmount || 0,
          totalUsdtAmount: totalPaymentConfirmed[0]?.totalUsdtAmount || 0,
          totalPaymentConfirmedClearanceCount: totalPaymentConfirmedClearance[0]?.totalPaymentConfirmedClearanceCount || 0,
          totalKrwAmountClearance: totalPaymentConfirmedClearance[0]?.totalKrwAmountClearance || 0,
          totalUsdtAmountClearance: totalPaymentConfirmedClearance[0]?.totalUsdtAmountClearance || 0,
        } }
      );



    }



    if (order && order.agentcode) {
      

      const agentcode = order.agentcode;

      /*
      // settlement
      const totalPaymentConfirmedCount = await collection.countDocuments(
        {
          agentcode: agentcode,
          status: 'paymentConfirmed',
          privateSale: false, // exclude private sale
        }
      );

      //console.log('confirmPayment totalPaymentConfirmedCount: ' + totalPaymentConfirmedCount);
      const totalKrwAmount = await collection.aggregate([
        { $match: {
          agentcode: agentcode,
          status: 'paymentConfirmed',
          privateSale: false, // exclude private sale
        }},
        { $group: { _id: null, totalKrwAmount: { $sum: '$krwAmount' } } }
      ]).toArray();
      //console.log('confirmPayment totalKrwAmount: ' + totalKrwAmount[0]?.totalKrwAmount || 0);
      const totalUsdtAmount = await collection.aggregate([
        { $match: {
          agentcode: agentcode,
          status: 'paymentConfirmed',
          privateSale: false, // exclude private sale
        }},
        { $group: { _id: null, totalUsdtAmount: { $sum: '$usdtAmount' } } }
      ]).toArray(); 
      //console.log('confirmPayment totalUsdtAmount: ' + totalUsdtAmount[0]?.totalUsdtAmount || 0);






      // clearance
      const totalPaymentConfirmedClearanceCount = await collection.countDocuments(
        {
          agentcode: agentcode,
          status: 'paymentConfirmed',
          privateSale: true, // include private sale
        }
      );
      //console.log('confirmPayment totalPaymentConfirmedClearanceCount: ' + totalPaymentConfirmedClearanceCount);
      const totalKrwAmountClearance = await collection.aggregate([
        { $match: {
          agentcode: agentcode,
          status: 'paymentConfirmed',
          privateSale: true, // include private sale
        }},
        { $group: { _id: null, totalKrwAmount: { $sum: '$krwAmount' } } }
      ]).toArray();
      //console.log('confirmPayment totalKrwAmountClearance: ' + totalKrwAmountClearance[0]?.totalKrwAmount || 0);
      const totalUsdtAmountClearance = await collection.aggregate([
        { $match: {
          agentcode: agentcode,
          status: 'paymentConfirmed',
          privateSale: true, // include private sale
        }},
        { $group: { _id: null, totalUsdtAmount: { $sum: '$usdtAmount' } } }
      ]).toArray();
      //console.log('confirmPayment totalUsdtAmountClearance: ' + totalUsdtAmountClearance[0]?.totalUsdtAmount || 0);
      // update agent collection
      const agentCollection = client.db('ultraman').collection('agents');

      
      const agent = await agentCollection.updateOne(
        { agentcode: agentcode },
        { $set: {
          totalPaymentConfirmedCount: totalPaymentConfirmedCount,
          totalKrwAmount: totalKrwAmount[0]?.totalKrwAmount || 0,
          totalUsdtAmount: totalUsdtAmount[0]?.totalUsdtAmount || 0,


          totalPaymentConfirmedClearanceCount: totalPaymentConfirmedClearanceCount,
          totalKrwAmountClearance: totalKrwAmountClearance[0]?.totalKrwAmount || 0,
          totalUsdtAmountClearance: totalUsdtAmountClearance[0]?.totalUsdtAmount || 0,
        } }
      );
      */

      const totalPaymentConfirmed = await collection.aggregate([
        { $match: {
          agentcode: agentcode,
          status: 'paymentConfirmed',
          privateSale: false, // exclude private sale
        }},
        { $group: {
          _id: null,
          totalPaymentConfirmedCount: { $sum: 1 },
          totalKrwAmount: { $sum: '$krwAmount' },
          totalUsdtAmount: { $sum: '$usdtAmount' }
        } }
      ]).toArray();

      //console.log('confirmPayment totalPaymentConfirmed: ' + JSON.stringify(totalPaymentConfirmed));
      const totalPaymentConfirmedClearance = await collection.aggregate([
        { $match: {
          agentcode: agentcode,
          status: 'paymentConfirmed',
          privateSale: true, // include private sale
        }},
        { $group: {
          _id: null,
          totalPaymentConfirmedClearanceCount: { $sum: 1 },
          totalKrwAmountClearance: { $sum: '$krwAmount' },
          totalUsdtAmountClearance: { $sum: '$usdtAmount' }
        } }
      ]).toArray();
      
      //console.log('confirmPayment totalPaymentConfirmedClearance: ' + JSON.stringify(totalPaymentConfirmedClearance));
      // update agent collection
      const agentCollection = client.db('ultraman').collection('agents');
      const agent = await agentCollection.updateOne(
        { agentcode: agentcode },
        { $set: {
          totalPaymentConfirmedCount: totalPaymentConfirmed[0]?.totalPaymentConfirmedCount || 0,
          totalKrwAmount: totalPaymentConfirmed[0]?.totalKrwAmount || 0,
          totalUsdtAmount: totalPaymentConfirmed[0]?.totalUsdtAmount || 0,
          totalPaymentConfirmedClearanceCount: totalPaymentConfirmedClearance[0]?.totalPaymentConfirmedClearanceCount || 0,
          totalKrwAmountClearance: totalPaymentConfirmedClearance[0]?.totalKrwAmountClearance || 0,
          totalUsdtAmountClearance: totalPaymentConfirmedClearance[0]?.totalUsdtAmountClearance || 0,
        } }
      );




    }




    



    /*
    const updated = await collection.findOne<UserProps>(
      { _id: new ObjectId(data.orderId+'') }
    );

    return updated;
    */
    return {
      status: 'paymentConfirmed',
      paymentAmount: paymentAmount,
      queueId: data.queueId,
      transactionHash: data.transactionHash,
      paymentConfirmedAt: new Date().toISOString(),
      autoConfirmPayment: autoConfirmPayment,
    };

    
  } else {
    return null;
  }
  
}




export async function buyOrderRollbackPayment(data: any) {
  

  if (!data.orderId) {
    return null;
  }

  if (!data.transactionHash) {
    return null;
  }

  const paymentAmount = data.paymentAmount || 0;


  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');


  const result = await collection.updateOne(
    
    { _id: new ObjectId(data.orderId+'') },


    { $set: {
      status: 'cancelled',
      paymentAmount: paymentAmount,
      queueId: data.queueId,
      transactionHash: data.transactionHash,
      cancelledAt: new Date().toISOString(),
      rollbackAmount: paymentAmount,
    } }
  );

  if (result) {


    // update user collection buyOrderStatus to "cancelled"
    const order = await collection.findOne<any>(
      { _id: new ObjectId(data.orderId+'') },
      { projection: { storecode: 1, walletAddress: 1 } }
    );

    if (order) {
      
      // update user collection buyOrderStatus to "cancelled"
      const userCollection = client.db('ultraman').collection('users');
      await userCollection.updateOne(
        {
          walletAddress: order.walletAddress,
          storecode: order.storecode,
        },
        { $set: { buyOrderStatus: 'cancelled' } }
      );

    }


    


    const updated = await collection.findOne<any>(
      { _id: new ObjectId(data.orderId+'') }
    );

    return updated;
  } else {
    return null;
  }
  
}





// getOrderById
export async function buyOrderGetOrderById(orderId: string): Promise<UserProps | null> {

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');

  const result = await collection.findOne<UserProps>(
    { _id: new ObjectId(orderId) }
  );

  if (result) {
    return result;
  } else {
    return null;
  }

}






// cancel buy order by orderId from seller
export async function cancelTradeBySeller(

  {
    storecode,
    orderId,
    walletAddress,
    cancelTradeReason,

  }: {
    storecode: string;
    orderId: string;
    walletAddress: string;
    cancelTradeReason: string;
  
  }

) {




  const client = await clientPromise;


  // check validation of storecode
  const storeCollection = client.db('ultraman').collection('stores');
  const stores = await storeCollection.findOne<any>(
    {
      storecode: storecode,
    },
  );
  if (!stores) {

    console.log('cancelTradeBySeller storecode is not valid: ' + storecode);

    return null;
  }



  const collection = client.db('ultraman').collection('buyorders');

  // check orderId is valid ObjectId
  if (!ObjectId.isValid(orderId)) {
    console.log('cancelTradeBySeller orderId is not valid: ' + orderId);
    return false;
  }

  // check walletAddress is valid

  if (!walletAddress) {
    console.log('cancelTradeBySeller walletAddress is not valid: ' + walletAddress);
    return false;
  }

  // check status is 'accepted' or 'paymentRequested'

  // update status to 'cancelled'

  const result = await collection.updateOne(
    { _id: new ObjectId(orderId),
      ////////'seller.walletAddress': walletAddress,

      //status: 'accepted'
      status: { $in: ['accepted', 'paymentRequested'] },

    },
    { $set: {
      
      status: 'cancelled',

      cancelledAt: new Date().toISOString(),
      cancelTradeReason: cancelTradeReason,
    } }
  );

  if (result) {

    const order = await collection.findOne<any>(
      { _id: new ObjectId(orderId) },
      { projection: { storecode: 1, walletAddress: 1 } }
    );


    // update user status to 'cancelled'
    const userCollection = client.db('ultraman').collection('users');

    await userCollection.updateOne(
      {
        walletAddress: order.walletAddress,
        storecode: order.storecode,
      },
      { $set: { buyOrderStatus: 'cancelled' } }
    );



    //console.log('cancelTradeBySeller result: ' + JSON.stringify(result));

    const updated = await collection.findOne<UserProps>(
      { _id: new ObjectId(orderId) }
    );

    return updated;

  } else {
    console.log('cancelTradeBySeller result is null');

    return null;
  }




}







export async function getOneBuyOrder(

  {
    orderId,
    limit,
    page,
  }: {
    orderId: string;
    limit: number;
    page: number;
  
  }

): Promise<ResultProps> {

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');


  // status is not 'paymentConfirmed'

  // check orderId is valid ObjectId


  if (!ObjectId.isValid(orderId)) {
    return {
      totalCount: 0,
      orders: [],
    };
  }




  const results = await collection.find<UserProps>(
    {

      _id: new ObjectId(orderId),

      //status: 'ordered',

      ///status: { $ne: 'paymentConfirmed' },

      // exclude private sale
      //privateSale: { $ne: true },
    },
    
    //{ projection: { _id: 0, emailVerified: 0 } }

  ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();



  return {
    totalCount: results.length,
    orders: results,
  };

}



// getOneBuyOrderByTradeId
export async function getOneBuyOrderByTradeId(
  {
    tradeId,
  }: {
    tradeId: string;
  }
): Promise<any | null> {
  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');
  const result = await collection.findOne<UserProps>(
    {
      tradeId: tradeId,
    }
  );
  if (result) {
    return result;
  } else {
    return null;
  }
}







// getOneBuyOrderByNicknameAndStorecode
// status is "ordered" or "accepted" or "paymentRequested"
export async function getOneBuyOrderByNicknameAndStorecode(
  {
    nickname,
    storecode,
  }: {
    nickname: string;
    storecode: string;
  }
): Promise<UserProps | null> {
  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');
  const result = await collection.findOne<UserProps>(
    {
      nickname: nickname,
      storecode: storecode,
      status: { $in: ['ordered', 'accepted', 'paymentRequested'] },
    }
  );
  if (result) {
    return result;
  } else {
    return null;
  }
}




// updateBuyOrderByQueueId
export async function updateBuyOrderByQueueId(data: any) {

  console.log('updateBuyOrderByQueueId data: ' + JSON.stringify(data));

  if (!data.queueId || !data.transactionHash || !data.minedAt) {
    return null;
  }

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');

  const result = await collection.updateOne(
    { queueId: data.queueId },
    { $set: {
      transactionHash: data.transactionHash,
      minedAt: data.minedAt,
    } }
  );

  if (result) {
    return true;
  } else {
    return false;
  }

}





// getAllBuyOrdersBySeller
// sum of krwAmount
export async function getAllBuyOrdersBySeller(

  {
    limit,
    page,
    startDate, // 2025-04-01
    endDate,   // 2025-04-30
    walletAddress,
  }: {
    limit: number;
    page: number;
    startDate: string;
    endDate: string;
    walletAddress: string;
  }

): Promise<any> {

  //console.log('getAllBuyOrdersBySeller limit: ' + limit);
  //console.log('getAllBuyOrdersBySeller page: ' + page);
  //console.log('getAllBuyOrdersBySeller startDate: ' + startDate);
  //console.log('getAllBuyOrdersBySeller endDate: ' + endDate);
  //console.log('getAllBuyOrdersBySeller walletAddress: ' + walletAddress);


  // convert 2025-04-01 to 2025-04-30T07:55:42.346Z

  const startDateTime = new Date(startDate).toISOString();
  const endDateTime = new Date(endDate).toISOString();



  //console.log('getAllBuyOrdersBySeller startDateTime: ' + startDateTime);
  //console.log('getAllBuyOrdersBySeller endDateTime: ' + endDateTime);

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');


  const results = await collection.find<UserProps>(

    //{ walletAddress: walletAddress, status: status },

    {

      privateSale: { $ne: true },

      'seller.walletAddress': walletAddress,

      status: 'paymentConfirmed',

      ////paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      
      //paymentConfirmedAt: { $gte: startDateTime, $lt: endDateTime },

      



    },


  )
  .sort({ paymentConfirmedAt: -1 })
  .limit(limit).skip((page - 1) * limit).toArray();

  // get total count of orders
  const totalCount = await collection.countDocuments(
    {

      privateSale: { $ne: true },

      'seller.walletAddress': walletAddress,
      status: 'paymentConfirmed',

      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

    }
  );

  console.log('getAllBuyOrdersBySeller totalCount: ' + totalCount);

  // sum of krwAmount
  // TypeError: Cannot read properties of undefined (reading 'totalKrwAmount')

  const totalKrwAmount = await collection.aggregate([
    {
      $match: {

        privateSale: { $ne: true },

        'seller.walletAddress': walletAddress,
        status: 'paymentConfirmed',

        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

      }
    },
    {
      $group: {
        _id: null,
        totalKrwAmount: { $sum: '$krwAmount' },
      }
    }
  ]).toArray();

  const totalUsdtAmount = await collection.aggregate([
    {
      $match: {

        privateSale: { $ne: true },

        'seller.walletAddress': walletAddress,
        status: 'paymentConfirmed',
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        totalUsdtAmount: { $sum: '$usdtAmount' },
      }
    }
  ]).toArray();


  return {
    totalCount: totalCount,
    totalKrwAmount: totalKrwAmount ? totalKrwAmount[0]?.totalKrwAmount : 0,
    totalUsdtAmount: totalUsdtAmount ? totalUsdtAmount[0]?.totalUsdtAmount : 0,
    orders: results,
  };

}








// getDailyBuyOrder
export async function getDailyBuyOrder(
  
  {
    startDate,
    endDate,
  }: {
    startDate: string;
    endDate: string;
  }

): Promise<any> {

  //console.log('getDailyBuyOrder startDate: ' + startDate);
  //console.log('getDailyBuyOrder endDate: ' + endDate);
  /*
  getDailyBuyOrder startDate: 2025-03-01
  getDailyBuyOrder endDate: 2025-03-13

  
  */

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');




  // distinct count of walletAddress by day
  // sum of krwAmount by day
  // sum of usdtAmount by day
  // count of trades by day


  const results = await collection.aggregate([

    {
      $match: {
        status: 'paymentConfirmed',

        ///paymentConfirmedAt: { $gte: startDate, $lt: endDate },


      }
    },
    {
      $group: {
        
        //_id: { $dateToString: { format: '%Y-%m-%d', date: { $toDate: '$paymentConfirmedAt' } } },

        // convert date to korea time
        // +9 hours

        _id: { $dateToString: { format: '%Y-%m-%d', date: { $add: [ { $toDate: '$paymentConfirmedAt' }, 9 * 60 * 60 * 1000 ] } } },
     
        
        totalKrwAmount: { $sum: '$krwAmount' },
        totalUsdtAmount: { $sum: '$usdtAmount' },
        trades: { $sum: 1 },

      }
    },



    // order by date desc
    { $sort: { _id: -1 } },
  ]).toArray();



  return results;

}



// getDailyKrwAmountBySeller
export async function getDailyBuyOrderBySeller(
  
  {
    startDate,
    endDate,
    walletAddress,
  }: {
    startDate: string;
    endDate: string;
    walletAddress: string;
  }

): Promise<any> {

  console.log('getDailyKrwAmountBySeller startDate: ' + startDate);
  console.log('getDailyKrwAmountBySeller endDate: ' + endDate);
  /*
  getDailyKrwAmountBySeller startDate: 2025-03-01
  getDailyKrwAmountBySeller endDate: 2025-03-13
  */

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');

  // sum of krwAmount by day
  /*
  const results = await collection.aggregate([
    {
      $match: {
        'seller.walletAddress': walletAddress,
        status: 'paymentConfirmed',
        paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentConfirmedAt' } },
        totalKrwAmount: { $sum: '$krwAmount' },
      }
    }
  ]).toArray();
  */
  /*
      errmsg: "PlanExecutor error during aggregation :: caused by :: $dateToString parameter 'date' must be coercible to date",
    code: 4997901,
    */

  // count of distinct walletAddress by day

  const results = await collection.aggregate([
    {
      $match: {
        'seller.walletAddress': walletAddress,
        status: 'paymentConfirmed',
        paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: { $toDate: '$paymentConfirmedAt' } } },
        totalKrwAmount: { $sum: '$krwAmount' },
        totalUsdtAmount: { $sum: '$usdtAmount' },
        trades: { $sum: 1 },
      }
    },
    // order by date desc
    { $sort: { _id: -1 } },
  ]).toArray();



  return results;

}



// getAllBuyOrdersByStorecode
export async function getAllBuyOrdersByStorecode(
  {
    limit,
    page,
    startDate,
    endDate,
    storecode,
  }: {
    limit: number;
    page: number;
    startDate: string;
    endDate: string;
    storecode: string;
  }
): Promise<any> {

  if (!startDate) {
    startDate = new Date(0).toISOString();
  }
  if (!endDate) {
    endDate = new Date().toISOString();
  }


  //console.log('getAllBuyOrdersByStorecode startDate: ' + startDate);
  //console.log('getAllBuyOrdersByStorecode endDate: ' + endDate);



  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');
  const results = await collection.find<UserProps>(
    {
      storecode: storecode,
      //status: 'paymentConfirmed',
      status: { $in: ['ordered', 'accepted', 'paymentRequested', ] },
      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

      privateSale: { $ne: true }, // exclude private sale
    },
  )
    .sort({ paymentConfirmedAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();


  //console.log('getAllBuyOrdersByStorecode results: ' + JSON.stringify(results));

  // get total count of orders
  const totalCount = await collection.countDocuments(
    {
      storecode: storecode,
      status: { $in: ['ordered', 'accepted', 'paymentRequested', ] },
      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

      privateSale: { $ne: true }, // exclude private sale
    }
  );
  //console.log('getAllBuyOrdersByStorecode totalCount: ' + totalCount);

  // sum of krwAmount
  const totalKrwAmount = await collection.aggregate([
    {
      $match: {
        storecode: storecode,
        status: { $in: ['ordered', 'accepted', 'paymentRequested', ] },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

        privateSale: { $ne: true }, // exclude private sale
      }
    },
    {
      $group: {
        _id: null,
        totalKrwAmount: { $sum: '$krwAmount' },
      }
    }
  ]).toArray();

  // sum of usdtAmount
  const totalUsdtAmount = await collection.aggregate([
    {
      $match: {
        storecode: storecode,
        status: { $in: ['ordered', 'accepted', 'paymentRequested', ] },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

        privateSale: { $ne: true }, // exclude private sale
      }
    },
    {
      $group: {
        _id: null,
        totalUsdtAmount: { $sum: '$usdtAmount' },
      }
    }
  ]).toArray();


  return {
    totalCount: totalCount,
    totalKrwAmount: totalKrwAmount ? totalKrwAmount[0]?.totalKrwAmount : 0,
    totalUsdtAmount: totalUsdtAmount ? totalUsdtAmount[0]?.totalUsdtAmount : 0,
    orders: results,
  };
}







// getAllTradesByAdmin
// sum of krwAmount
export async function getAllTradesByAdmin(

  {
    limit,
    page,
    
    //startDate,
    //endDate,
    
    agentcode,
    searchNickname,
    walletAddress,
    storecode,
    searchOrderStatusCompleted,
    searchBuyer,
    searchDepositName,
    searchStoreBankAccountNumber,
    privateSale,

    fromDate, // 2025-04-01
    toDate,   // 2025-04-30
  }: {
    limit: number;
    page: number;

    //startDate: string;
    //endDate: string;

    agentcode: string,
    searchNickname: string,
    walletAddress: string;
    storecode: string;
    searchOrderStatusCompleted: boolean;
    searchBuyer: string;
    searchDepositName: string;
    searchStoreBankAccountNumber: string;
    privateSale: boolean;

    fromDate?: string; // 2025-04-01
    toDate?: string;   // 2025-04-30

  }

): Promise<any> {

  //const fromDateValue = fromDate ? fromDate + 'T00:00:00.000Z' : new Date(0).toISOString();

  const fromDateValue = fromDate ? new Date(fromDate + 'T00:00:00+09:00').toISOString() : '1970-01-01T00:00:00Z';

  //const toDateValue = toDate ? toDate + 'T23:59:59.999Z' : new Date().toISOString();
  const toDateValue = toDate ? new Date(toDate + 'T23:59:59+09:00').toISOString() : new Date().toISOString();


  console.log('getAllTradesByAdmin fromDateValue: ' + fromDateValue);
  console.log('getAllTradesByAdmin toDateValue: ' + toDateValue);
  

  console.log('privateSale: ' + privateSale);



  //console.log('getAllTradesByAdmin startDate: ' + startDate);
  //console.log('getAllTradesByAdmin endDate: ' + endDate);

  /*
  if (!startDate) {
    startDate = new Date(0).toISOString();
  }
  if (!endDate) {
    endDate = new Date().toISOString();
  }
  */


  /*
  console.log('getAllTradesByAdmin startDate: ' + startDate);
  console.log('getAllTradesByAdmin endDate: ' + endDate);
  console.log('getAllTradesByAdmin searchNickname: ' + searchNickname);
  console.log('getAllTradesByAdmin walletAddress: ' + walletAddress);

  console.log('getAllTradesByAdmin storecode: ' + storecode);
  console.log('getAllTradesByAdmin searchOrderStatusCompleted: ' + searchOrderStatusCompleted);
  console.log('getAllTradesByAdmin searchBuyer: ' + searchBuyer);
  console.log('getAllTradesByAdmin searchDepositName: ' + searchDepositName);
  */

  ///console.log('getAllTradesByAdmin agentcode: ' + agentcode);


  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');





  const results = await collection.find<UserProps>(

    //{ walletAddress: walletAddress, status: status },

    {
      ///'seller.walletAddress': walletAddress,

      //nickname: { $regex: searchNickname, $options: 'i' },


      status: 'paymentConfirmed',

      //privateSale: { $ne: true },
      privateSale: privateSale,


      agentcode: { $regex: agentcode, $options: 'i' },
      //storecode: storecode,
      storecode: { $regex: storecode, $options: 'i' },

      nickname: { $regex: searchBuyer, $options: 'i' },

      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },


      createdAt: { $gte: fromDateValue, $lt: toDateValue },


    },

  )
  .sort({ paymentConfirmedAt: -1 })
  .limit(limit).skip((page - 1) * limit).toArray();


  
  /*
  // get total count of orders
  const totalCount = await collection.countDocuments(
    {
      
      ////'seller.walletAddress': walletAddress,

      // search include searchNickname
      //nickname: { $regex: searchNickname, $options: 'i' },

      status: 'paymentConfirmed',

      //privateSale: { $ne: true },
      privateSale: privateSale,

      agentcode: { $regex: agentcode, $options: 'i' },
      //storecode: storecode,
      storecode: { $regex: storecode, $options: 'i' },

      nickname: { $regex: searchBuyer, $options: 'i' },
      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },


      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

      createdAt: { $gte: fromDateValue, $lt: toDateValue },

 
    }
  );
  */



  //console.log('getAllTradesByAdmin totalCount: ' + totalCount);

  // sum of krwAmount
  // TypeError: Cannot read properties of undefined (reading 'totalKrwAmount')

  const totalResult = await collection.aggregate([
    {
      $match: {
        
        //'seller.walletAddress': walletAddress,

        //nickname: { $regex: searchNickname, $options: 'i' },


        status: 'paymentConfirmed',

        ///privateSale: { $ne: true },
        privateSale: privateSale,


        agentcode: { $regex: agentcode, $options: 'i' },
        //storecode: storecode,
        storecode: { $regex: storecode, $options: 'i' },

        nickname: { $regex: searchBuyer, $options: 'i' },

        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

        createdAt: { $gte: fromDateValue, $lt: toDateValue },
      }
    },
    {
      $group: {
        _id: null,
        

        totalCount: { $sum: 1 },
        totalKrwAmount: { $sum: '$krwAmount' },
        totalUsdtAmount: { $sum: '$usdtAmount' },

        totalSettlementCount: { $sum: 1 },
        totalSettlementAmount: { $sum: { $toDouble: '$settlement.settlementAmount' } },
        totalSettlementAmountKRW: { $sum: { $toDouble: '$settlement.settlementAmountKRW' } },

        totalFeeAmount: { $sum: { $toDouble: '$settlement.feeAmount' } },
        totalFeeAmountKRW: { $sum: { $toDouble: '$settlement.feeAmountKRW' } },

        totalAgentFeeAmount: { $sum: '$settlement.agentFeeAmount' },
        totalAgentFeeAmountKRW: { $sum: { $toDouble: '$settlement.agentFeeAmountKRW' } },

      }
    }
  ]).toArray();

  /////console.log('getAllTradesByAdmin totalKrwAmount: ' + JSON.stringify(totalKrwAmount));


  /*
  // totalUsdtAmount
  const totalUsdtAmount = await collection.aggregate([
    {
      $match: {
        //'seller.walletAddress': walletAddress,

        //nickname: { $regex: searchNickname, $options: 'i' },
        status: 'paymentConfirmed',

        //privateSale: { $ne: true },
        privateSale: privateSale,

        agentcode: { $regex: agentcode, $options: 'i' },
        //storecode: storecode,
        storecode: { $regex: storecode, $options: 'i' },

        nickname: { $regex: searchBuyer, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

        createdAt: { $gte: fromDateValue, $lt: toDateValue },
      }
    },
    {
      $group: {
        _id: null,
        totalUsdtAmount: { $sum: '$usdtAmount' },
      }
    }
  ]).toArray();
  */





  /*
  // totalSettlementCount
  const totalSettlementCount = await collection.aggregate([
    {
      $match: {
        //nickname: { $regex: searchNickname, $options: 'i' },
        status: 'paymentConfirmed',
        // settlement is not null
        settlement: { $exists: true, $ne: null },



        //privateSale: { $ne: true },
        privateSale: privateSale,


        agentcode: { $regex: agentcode, $options: 'i' },
        //storecode: storecode,
        storecode: { $regex: storecode, $options: 'i' },

        nickname: { $regex: searchBuyer, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

        createdAt: { $gte: fromDateValue, $lt: toDateValue },
      }
    },
    {
      $group: {
        _id: null,
        totalSettlementCount: { $sum: 1 },
      }
    }
  ]).toArray();
  */


  /*
  // totalSettlementAmount
  // settlement.settlementAmount
  const totalSettlementAmount = await collection.aggregate([
    {
      $match: {
        //nickname: { $regex: searchNickname, $options: 'i' },
        status: 'paymentConfirmed',
        settlement: { $exists: true, $ne: null },

        ///privateSale: { $ne: true },
        privateSale: privateSale,


        agentcode: { $regex: agentcode, $options: 'i' },
        //storecode: storecode,
        storecode: { $regex: storecode, $options: 'i' },

        nickname: { $regex: searchBuyer, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },



        createdAt: { $gte: fromDateValue, $lt: toDateValue },
      }
    },
    {
      $group: {
        _id: null,
        totalSettlementAmount: { $sum: '$settlement.settlementAmount' },
      }
    }
  ]).toArray();
  */

  /*
  // totalSettlementAmountKRW
  const totalSettlementAmountKRW = await collection.aggregate([
    {
      $match: {
        //nickname: { $regex: searchNickname, $options: 'i' },
        status: 'paymentConfirmed',
        settlement: { $exists: true, $ne: null },

        //privateSale: { $ne: true },
        privateSale: privateSale,


        agentcode: { $regex: agentcode, $options: 'i' },
        //storecode: storecode,
        storecode: { $regex: storecode, $options: 'i' },

        nickname: { $regex: searchBuyer, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

        createdAt: { $gte: fromDateValue, $lt: toDateValue },
      }
    },
    // $settlement.settlementAmountKRW is string

    {
      $group: {
        _id: null,
        ///totalSettlementAmountKRW: { $sum: '$settlement.settlementAmountKRW' },
        totalSettlementAmountKRW: { $sum: { $toDouble: '$settlement.settlementAmountKRW' } },
      }
    }
  ]).toArray();
  */
  

  /*
  // total feeAmount
  const totalFeeAmount = await collection.aggregate([
    {
      $match: {
        //nickname: { $regex: searchNickname, $options: 'i' },
        status: 'paymentConfirmed',
        settlement: { $exists: true, $ne: null },

        
        //privateSale: { $ne: true },
        privateSale: privateSale,


        agentcode: { $regex: agentcode, $options: 'i' },
        //storecode: storecode,
        storecode: { $regex: storecode, $options: 'i' },

        nickname: { $regex: searchBuyer, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },


        createdAt: { $gte: fromDateValue, $lt: toDateValue },
      }
    },
    {
      $group: {
        _id: null,
        totalFeeAmount: { $sum: '$settlement.feeAmount' },
      }
    }
  ]).toArray();
  */

  /*
  // total feeAmountKRW
  const totalFeeAmountKRW = await collection.aggregate([
    {
      $match: {
        //nickname: { $regex: searchNickname, $options: 'i' },
        status: 'paymentConfirmed',
        settlement: { $exists: true, $ne: null },

        //privateSale: { $ne: true },
        privateSale: privateSale,
        

        agentcode: { $regex: agentcode, $options: 'i' },
        //storecode: storecode,
        storecode: { $regex: storecode, $options: 'i' },

        nickname: { $regex: searchBuyer, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },


        createdAt: { $gte: fromDateValue, $lt: toDateValue },
      }
    },
    {
      $group: {
        _id: null,
        ///totalFeeAmountKRW: { $sum: '$settlement.feeAmountKRW' },
        totalFeeAmountKRW: { $sum: { $toDouble: '$settlement.feeAmountKRW' } },
      }
    }
  ]).toArray();
  */



  /*
  // total agentFeeAmount, agentFeeAmountKRW
  const totalResult = await collection.aggregate([
    {
      $match: {
        //nickname: { $regex: searchNickname, $options: 'i' },
        status: 'paymentConfirmed',
        settlement: { $exists: true, $ne: null },
        //privateSale: { $ne: true },
        privateSale: privateSale,
        agentcode: { $regex: agentcode, $options: 'i' },
        //storecode: storecode,
        storecode: { $regex: storecode, $options: 'i' },
        nickname: { $regex: searchBuyer, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        createdAt: { $gte: fromDateValue, $lt: toDateValue },
      }
    },
    {
      $group: {
        _id: null,
        totalAgentFeeAmount: { $sum: '$settlement.agentFeeAmount' },
        totalAgentFeeAmountKRW: { $sum: { $toDouble: '$settlement.agentFeeAmountKRW' } },
      }
    }
  ]).toArray();
  */






  //console.log('getAllTradesByAdmin totalCount: ' + totalCount);
  //console.log('getAllTradesByAdmin totalSettlementCount: ' + totalSettlementCount[0]?.totalSettlementCount);


  /*
  return {
    totalCount: totalCount,
    totalKrwAmount: totalKrwAmount ? totalKrwAmount[0]?.totalKrwAmount : 0,
    totalUsdtAmount: totalUsdtAmount ? totalUsdtAmount[0]?.totalUsdtAmount : 0,
    totalSettlementCount: totalSettlementCount ? totalSettlementCount[0]?.totalSettlementCount : 0,
    totalSettlementAmount: totalSettlementAmount ? totalSettlementAmount[0]?.totalSettlementAmount : 0,
    totalSettlementAmountKRW: totalSettlementAmountKRW ? totalSettlementAmountKRW[0]?.totalSettlementAmountKRW : 0,
    totalFeeAmount: totalFeeAmount ? totalFeeAmount[0]?.totalFeeAmount : 0,
    totalFeeAmountKRW: totalFeeAmountKRW ? totalFeeAmountKRW[0]?.totalFeeAmountKRW : 0,

    totalAgentFeeAmount: totalResult ? totalResult[0]?.totalAgentFeeAmount : 0,
    totalAgentFeeAmountKRW: totalResult ? totalResult[0]?.totalAgentFeeAmountKRW : 0,

    orders: results,
  };
  */
  return {
    totalCount: totalResult ? totalResult[0]?.totalCount : 0,
    totalKrwAmount: totalResult ? totalResult[0]?.totalKrwAmount : 0,
    totalUsdtAmount: totalResult ? totalResult[0]?.totalUsdtAmount : 0,
    totalSettlementCount: totalResult ? totalResult[0]?.totalSettlementCount : 0,
    totalSettlementAmount: totalResult ? totalResult[0]?.totalSettlementAmount : 0,
    totalSettlementAmountKRW: totalResult ? totalResult[0]?.totalSettlementAmountKRW : 0,
    totalFeeAmount: totalResult ? totalResult[0]?.totalFeeAmount : 0,
    totalFeeAmountKRW: totalResult ? totalResult[0]?.totalFeeAmountKRW : 0,
    totalAgentFeeAmount: totalResult ? totalResult[0]?.totalAgentFeeAmount : 0,
    totalAgentFeeAmountKRW: totalResult ? totalResult[0]?.totalAgentFeeAmountKRW : 0,
    orders: results,
  };

}











 // getAllClearancesByAdmin
  // all orders with status 'paymentConfirmed' and privateSale is true
 export async function getAllClearancesByAdmin(

  {
    limit,
    page,
    
    //startDate,
    //endDate,


    agentcode,
    searchNickname,
    walletAddress,
    storecode,
    searchOrderStatusCompleted,
    searchBuyer,
    searchDepositName,
    searchStoreBankAccountNumber,
    //privateSale,

    fromDate,
    toDate,
  }: {
    limit: number;
    page: number;

    //startDate: string;
    //endDate: string;

    agentcode: string,
    searchNickname: string,
    walletAddress: string;
    storecode: string;
    searchOrderStatusCompleted: boolean;
    searchBuyer: string;
    searchDepositName: string;
    searchStoreBankAccountNumber: string;
    //privateSale: boolean;

    fromDate: string,
    toDate: string,
  }

): Promise<any> {

  //const fromDateValue = fromDate ? fromDate + 'T00:00:00.000Z' : new Date(0).toISOString();
  const fromDateValue = fromDate ? new Date(fromDate + 'T00:00:00+09:00').toISOString() : '1970-01-01T00:00:00Z';


  //const toDateValue = toDate ? toDate + 'T23:59:59.999Z' : new Date().toISOString();
  const toDateValue = toDate ? new Date(toDate + 'T23:59:59+09:00').toISOString() : new Date().toISOString();


  /*
  console.log('getAllClearancesByAdmin startDate: ' + startDate);
  console.log('getAllClearancesByAdmin endDate: ' + endDate);
  console.log('getAllClearancesByAdmin searchNickname: ' + searchNickname);
  console.log('getAllClearancesByAdmin walletAddress: ' + walletAddress);
  console.log('getAllClearancesByAdmin storecode: ' + storecode);
  console.log('getAllClearancesByAdmin searchOrderStatusCompleted: ' + searchOrderStatusCompleted);
  console.log('getAllClearancesByAdmin searchBuyer: ' + searchBuyer);
  console.log('getAllClearancesByAdmin searchDepositName: ' + searchDepositName);
  console.log('getAllClearancesByAdmin searchStoreBankAccountNumber: ' + searchStoreBankAccountNumber);
  */
  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');
  const results = await collection.find<UserProps>(
    {
      // 'seller.walletAddress': walletAddress,
      //status: 'paymentConfirmed', or 'paymentRequested'

      status : { $in: ['paymentConfirmed', 'paymentRequested'] },

      privateSale: true, // only private sale orders
      agentcode: { $regex: agentcode, $options: 'i' },
      storecode: { $regex: storecode, $options: 'i' },
      nickname: { $regex: searchBuyer, $options: 'i' },
      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

      createdAt: { $gte: fromDateValue, $lt: toDateValue },
    },
  )
    .sort({ createdAt: -1 })
    // .sort({ paymentConfirmedAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();


  // get total count of orders
  const totalCount = await collection.countDocuments(
    {
      // 'seller.walletAddress': walletAddress,
      //status: 'paymentConfirmed',
      status : { $in: ['paymentConfirmed', 'paymentRequested'] },


      privateSale: true, // only private sale orders
      agentcode: { $regex: agentcode, $options: 'i' },
      storecode: { $regex: storecode, $options: 'i' },
      nickname: { $regex: searchBuyer, $options: 'i' },
      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

      createdAt: { $gte: fromDateValue, $lt: toDateValue },
    }
  );



  //console.log('getAllClearancesByAdmin totalCount: ' + totalCount);
  // sum of krwAmount
  const totalKrwAmount = await collection.aggregate([
    {
      $match: {
        // 'seller.walletAddress': walletAddress,
        status: 'paymentConfirmed',
        privateSale: true, // only private sale orders
        agentcode: { $regex: agentcode, $options: 'i' },
        storecode: { $regex: storecode, $options: 'i' },
        nickname: { $regex: searchBuyer, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

        createdAt: { $gte: fromDateValue, $lt: toDateValue },
      }
    },
    {
      $group: {
        _id: null,
        totalKrwAmount: { $sum: '$krwAmount' },
      }
    }
  ]).toArray();
  // sum of usdtAmount
  const totalUsdtAmount = await collection.aggregate([
    {
      $match: {
        // 'seller.walletAddress': walletAddress,
        status: 'paymentConfirmed',
        privateSale: true, // only private sale orders
        agentcode: { $regex: agentcode, $options: 'i' },
        storecode: { $regex: storecode, $options: 'i' },
        nickname: { $regex: searchBuyer, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

        createdAt: { $gte: fromDateValue, $lt: toDateValue },
      }
    },
    {
      $group: {
        _id: null,
        totalUsdtAmount: { $sum: '$usdtAmount' },
      }
    }
  ]).toArray();
  // totalSettlementCount
  const totalSettlementCount = await collection.aggregate([
    {
      $match: {
        // 'seller.walletAddress': walletAddress,
        status: 'paymentConfirmed',
        privateSale: true, // only private sale orders
        agentcode: { $regex: agentcode, $options: 'i' },
        storecode: { $regex: storecode, $options: 'i' },
        nickname: { $regex: searchBuyer, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        settlement: { $exists: true, $ne: null },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

        createdAt: { $gte: fromDateValue, $lt: toDateValue },
      }
    },
    {
      $group: {
        _id: null,
        totalSettlementCount: { $sum: 1 },
      }
    }
  ]).toArray();
  // totalSettlementAmount
  const totalSettlementAmount = await collection.aggregate([
    {
      $match: {
        // 'seller.walletAddress': walletAddress,
        status: 'paymentConfirmed',
        privateSale: true, // only private sale orders
        agentcode: { $regex: agentcode, $options: 'i' },
        storecode: { $regex: storecode, $options: 'i' },
        nickname: { $regex: searchBuyer, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        settlement: { $exists: true, $ne: null },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

        createdAt: { $gte: fromDateValue, $lt: toDateValue },
      }
    },
    {
      $group: {
        _id: null,
        totalSettlementAmount: { $sum: '$settlement.settlementAmount' },
      }
    }
  ]).toArray();
  // totalSettlementAmountKRW
  const totalSettlementAmountKRW = await collection.aggregate([
    {
      $match: {
        // 'seller.walletAddress': walletAddress,
        status: 'paymentConfirmed',
        privateSale: true, // only private sale orders
        agentcode: { $regex: agentcode, $options: 'i' },
        storecode: { $regex: storecode, $options: 'i' },
        nickname: { $regex: searchBuyer, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        settlement: { $exists: true, $ne: null },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

        createdAt: { $gte: fromDateValue, $lt: toDateValue },
      }
    },
    // $settlement.settlementAmountKRW is string
    {
      $group: {
        _id: null,
        //totalSettlementAmountKRW: { $sum: '$settlement.settlementAmountKRW' },
        totalSettlementAmountKRW: { $sum: { $toDouble: '$settlement.settlementAmountKRW' } },
      }
    }
  ]).toArray();
  // total feeAmount
  const totalFeeAmount = await collection.aggregate([
    {
      $match: {
        // 'seller.walletAddress': walletAddress,
        status: 'paymentConfirmed',
        privateSale: true, // only private sale orders
        agentcode: { $regex: agentcode, $options: 'i' },
        storecode: { $regex: storecode, $options: 'i' },
        nickname: { $regex: searchBuyer, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        settlement: { $exists: true, $ne: null },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

        createdAt: { $gte: fromDateValue, $lt: toDateValue },
      }
    },
    {
      $group: {
        _id: null,
        totalFeeAmount: { $sum: '$settlement.feeAmount' },
      }
    }
  ]).toArray();
  // total feeAmountKRW
  const totalFeeAmountKRW = await collection.aggregate([
    {
      $match: {
        // 'seller.walletAddress': walletAddress,
        status: 'paymentConfirmed',
        privateSale: true, // only private sale orders
        agentcode: { $regex: agentcode, $options: 'i' },
        storecode: { $regex: storecode, $options: 'i' },
        nickname: { $regex: searchBuyer, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        settlement: { $exists: true, $ne: null },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

        createdAt: { $gte: fromDateValue, $lt: toDateValue },
      }
    },
    {
      $group: {
        _id: null,
        //totalFeeAmountKRW: { $sum: '$settlement.feeAmountKRW' },
        totalFeeAmountKRW: { $sum: { $toDouble: '$settlement.feeAmountKRW' } },
      }
    }
  ]).toArray();
  //console.log('getAllClearancesByAdmin totalCount: ' + totalCount);
  //console.log('getAllClearancesByAdmin totalSettlementCount: ' + totalSettlementCount[0]?.totalSettlementCount);
  return {
    totalCount: totalCount,
    totalKrwAmount: totalKrwAmount ? totalKrwAmount[0]?.totalKrwAmount : 0,
    totalUsdtAmount: totalUsdtAmount ? totalUsdtAmount[0]?.totalUsdtAmount : 0,
    totalSettlementCount: totalSettlementCount ? totalSettlementCount[0]?.totalSettlementCount : 0,
    totalSettlementAmount: totalSettlementAmount ? totalSettlementAmount[0]?.totalSettlementAmount : 0,
    totalSettlementAmountKRW: totalSettlementAmountKRW ? totalSettlementAmountKRW[0]?.totalSettlementAmountKRW : 0,
    totalFeeAmount: totalFeeAmount ? totalFeeAmount[0]?.totalFeeAmount : 0,
    totalFeeAmountKRW: totalFeeAmountKRW ? totalFeeAmountKRW[0]?.totalFeeAmountKRW : 0,
    orders: results,
  };
}
























// getAllTradesForAgent agentcode
export async function getAllTradesForAgent(
  {
    limit,
    page,
    startDate,
    endDate,
    searchNickname,
    walletAddress,
    agentcode,
    searchOrderStatusCompleted,
    searchBuyer,
    searchDepositName,
    searchStoreBankAccountNumber,
  }: {
    limit: number;
    page: number;
    startDate: string;
    endDate: string;
    searchNickname: string,
    walletAddress: string;
    agentcode: string;
    searchOrderStatusCompleted: boolean;
    searchBuyer: string;
    searchDepositName: string;
    searchStoreBankAccountNumber: string;
  }
): Promise<any> {
  if (!startDate) {
    startDate = new Date(0).toISOString();
  }
  if (!endDate) {
    endDate = new Date().toISOString();
  }
  //console.log('getAllTradesForAgent startDate: ' + startDate);
  //console.log('getAllTradesForAgent endDate: ' + endDate);
  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');
  const results = await collection.find<UserProps>(
    {
      privateSale: { $ne: true },
      agentcode: { $regex: agentcode, $options: 'i' },
      status: 'paymentConfirmed',
      nickname: { $regex: searchNickname, $options: 'i' },
      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
    },
  )
    .sort({ paymentConfirmedAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();
  // get total count of orders
  const totalCount = await collection.countDocuments(
    {
      privateSale: { $ne: true },
      agentcode: { $regex: agentcode, $options: 'i' },
      status: 'paymentConfirmed',
      nickname: { $regex: searchNickname, $options: 'i' },
      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
    }
  );
  //console.log('getAllTradesForAgent totalCount: ' + totalCount);
  // sum of krwAmount
  const totalKrwAmount = await collection.aggregate([
    {
      $match: {
        privateSale: { $ne: true },
        agentcode: { $regex: agentcode, $options: 'i' },
        status: 'paymentConfirmed',
        nickname: { $regex: searchNickname, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        totalKrwAmount: { $sum: '$krwAmount' },
      }
    }
  ]).toArray();
  // sum of usdtAmount
  const totalUsdtAmount = await collection.aggregate([
    {
      $match: {
        privateSale: { $ne: true },
        agentcode: { $regex: agentcode, $options: 'i' },
        status: 'paymentConfirmed',
        nickname: { $regex: searchNickname, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        totalUsdtAmount: { $sum: '$usdtAmount' },
      }
    }
  ]).toArray();
  const totalSettlementCount = await collection.aggregate([
    {
      $match: {
        privateSale: { $ne: true },
        agentcode: { $regex: agentcode, $options: 'i' },
        status: 'paymentConfirmed',
        nickname: { $regex: searchNickname, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        settlement: { $exists: true, $ne: null },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        totalSettlementCount: { $sum: 1 },
      }
    }
  ]).toArray();
  // totalSettlementAmount
  const totalSettlementAmount = await collection.aggregate([
    {
      $match: {
        privateSale: { $ne: true },
        agentcode: { $regex: agentcode, $options: 'i' },
        status: 'paymentConfirmed',
        nickname: { $regex: searchNickname, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        settlement: { $exists: true, $ne: null },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        totalSettlementAmount: { $sum: '$settlement.settlementAmount' },
      }
    }
  ]).toArray();
  // totalSettlementAmountKRW
  const totalSettlementAmountKRW = await collection.aggregate([
    {
      $match: {
        privateSale: { $ne: true },
        agentcode: { $regex: agentcode, $options: 'i' },
        status: 'paymentConfirmed',
        nickname: { $regex: searchNickname, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        settlement: { $exists: true, $ne: null },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        totalSettlementAmountKRW: { $sum: { $toDouble: '$settlement.settlementAmountKRW' } },
      }
    }
  ]).toArray();
  // total feeAmount
  const totalFeeAmount = await collection.aggregate([
    {
      $match: {
        privateSale: { $ne: true },
        agentcode: { $regex: agentcode, $options: 'i' },
        status: 'paymentConfirmed',
        nickname: { $regex: searchNickname, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        settlement: { $exists: true, $ne: null },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        //totalFeeAmount: { $sum: '$settlement.feeAmount' },
        totalAgentFeeAmount: { $sum: '$settlement.agentFeeAmount' },
      }
    }
  ]).toArray();
  // total feeAmountKRW
  const totalFeeAmountKRW = await collection.aggregate([
    {
      $match: {
        privateSale: { $ne: true },
        agentcode: { $regex: agentcode, $options: 'i' },
        status: 'paymentConfirmed',
        nickname: { $regex: searchNickname, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        settlement: { $exists: true, $ne: null },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        //totalFeeAmountKRW: { $sum: { $toDouble: '$settlement.feeAmountKRW' } },
        totalAgentFeeAmountKRW: { $sum: { $toDouble: '$settlement.agentFeeAmountKRW' } },
      }
    }
  ]).toArray();
  //console.log('getAllTradesForAgent totalCount: ' + totalCount);
  return {
    totalCount: totalCount,
    totalKrwAmount: totalKrwAmount ? totalKrwAmount[0]?.totalKrwAmount : 0,
    totalUsdtAmount: totalUsdtAmount ? totalUsdtAmount[0]?.totalUsdtAmount : 0,
    totalSettlementCount: totalSettlementCount ? totalSettlementCount[0]?.totalSettlementCount : 0,
    totalSettlementAmount: totalSettlementAmount ? totalSettlementAmount[0]?.totalSettlementAmount : 0,
    totalSettlementAmountKRW: totalSettlementAmountKRW ? totalSettlementAmountKRW[0]?.totalSettlementAmountKRW : 0,
    totalFeeAmount: totalFeeAmount ? totalFeeAmount[0]?.totalFeeAmount : 0,
    totalFeeAmountKRW: totalFeeAmountKRW ? totalFeeAmountKRW[0]?.totalFeeAmountKRW : 0,
    orders: results,
  };
}


/*
   limit: 5,
    page: 1,
    startDate: "",
    endDate: "",
    searchNickname: "",
    walletAddress: "",
    agentcode: agentcode,
  });
  */
// getAllBuyOrdersForAgent agentcode
export async function getAllBuyOrdersForAgent(
  {
    limit,
    page,
    startDate,
    endDate,

    searchNickname,
    walletAddress,
    agentcode,
  }: {
    limit: number;
    page: number;
    startDate: string;
    endDate: string;
    searchNickname: string,
    walletAddress: string;
    agentcode: string;
  }
): Promise<any> {
  if (!startDate) {
    startDate = new Date(0).toISOString();
  }
  if (!endDate) {
    endDate = new Date().toISOString();
  }
  //console.log('getAllBuyOrdersForAgent startDate: ' + startDate);
  //console.log('getAllBuyOrdersForAgent endDate: ' + endDate);



  console.log('getAllBuyOrdersForAgent agentcode: ' + agentcode);



  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');
  const results = await collection.find<UserProps>(
    {
      agentcode: { $regex: agentcode, $options: 'i' },

      //status: 'paymentConfirmed',
      status: { $in: ['ordered', 'accepted', 'paymentRequested', ] },
      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      nickname: { $regex: searchNickname, $options: 'i' },

      'buyer.walletAddress': { $regex: walletAddress, $options: 'i' },

      'store.bankInfo.accountNumber': { $regex: '', $options: 'i' }, // no search for bank account number

      'buyer.depositName': { $regex: '', $options: 'i' }, // no search for deposit name

    },
  )
    .sort({ paymentConfirmedAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();
  
  
  //console.log('getAllBuyOrdersForAgent results: ' + JSON.stringify(results));




  // get total count of orders
  const totalCount = await collection.countDocuments(
    {
      agentcode: { $regex: agentcode, $options: 'i' },
      //status: 'paymentConfirmed',
      status: { $in: ['ordered', 'accepted', 'paymentRequested', ] },
      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      nickname: { $regex: searchNickname, $options: 'i' },
      'buyer.walletAddress': { $regex: walletAddress, $options: 'i' },
      'store.bankInfo.accountNumber': { $regex: '', $options: 'i' }, // no search for bank account number
      'buyer.depositName': { $regex: '', $options: 'i' }, // no search for deposit name
    }
  );
  //console.log('getAllBuyOrdersForAgent totalCount: ' + totalCount);
  // sum of krwAmount
  const totalKrwAmount = await collection.aggregate([
    {
      $match: {
        agentcode: { $regex: agentcode, $options: 'i' },
        //status: 'paymentConfirmed',
        status: { $in: ['ordered', 'accepted', 'paymentRequested', ] },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
        nickname: { $regex: searchNickname, $options: 'i' },
        'buyer.walletAddress': { $regex: walletAddress, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: '', $options: 'i' }, // no search for bank account number
        'buyer.depositName': { $regex: '', $options: 'i' }, // no search for deposit name
      }
    },
    {
      $group: {
        _id: null,
        totalKrwAmount: { $sum: '$krwAmount' },
      }
    }
  ]).toArray();
  // sum of usdtAmount
  const totalUsdtAmount = await collection.aggregate([
    {
      $match: {
        agentcode: { $regex: agentcode, $options: 'i' },
        //status: 'paymentConfirmed',
        status: { $in: ['ordered', 'accepted', 'paymentRequested', ] },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
        nickname: { $regex: searchNickname, $options: 'i' },
        'buyer.walletAddress': { $regex: walletAddress, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: '', $options: 'i' }, // no search for bank account number
        'buyer.depositName': { $regex: '', $options: 'i' }, // no search for deposit name
      }
    },
    {
      $group: {
        _id: null,
        totalUsdtAmount: { $sum: '$usdtAmount' },
      }
    }
  ]).toArray();
  return {
    totalCount: totalCount,
    totalKrwAmount: totalKrwAmount ? totalKrwAmount[0]?.totalKrwAmount : 0,
    totalUsdtAmount: totalUsdtAmount ? totalUsdtAmount[0]?.totalUsdtAmount : 0,
    orders: results,
  };
}





// getAllTradesByStorecode
export async function getAllTradesByStorecode(
  {
    limit,
    page,
    startDate,
    endDate,
    storecode,
    searchBuyer,
    searchDepositName,
    searchStoreBankAccountNumber,

  }: {
    limit: number;
    page: number;
    startDate: string;
    endDate: string;
    storecode: string;
    searchBuyer: string;
    searchDepositName: string;
    searchStoreBankAccountNumber: string;
  }
): Promise<any> {
  if (!startDate) {
    startDate = new Date(0).toISOString();
  }
  if (!endDate) {
    endDate = new Date().toISOString();
  }
  //console.log('getAllTradesByStorecode startDate: ' + startDate);
  //console.log('getAllTradesByStorecode endDate: ' + endDate);
  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');






    /*
        status: 'paymentConfirmed',

      privateSale: { $ne: true },

      //storecode: storecode,
      storecode: { $regex: storecode, $options: 'i' },

      nickname: { $regex: searchBuyer, $options: 'i' },

      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

      */


  const results = await collection.find<UserProps>(
    {

      privateSale: { $ne: true },

      //storecode: storecode,
      storecode: { $regex: storecode, $options: 'i' },



      status: 'paymentConfirmed',



      nickname: { $regex: searchBuyer, $options: 'i' },

      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

    



      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
    },
  )
    .sort({ paymentConfirmedAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();


  // get total count of orders
  const totalCount = await collection.countDocuments(
    {

      privateSale: { $ne: true },

      //storecode: storecode,

      storecode: { $regex: storecode, $options: 'i' },


      status: 'paymentConfirmed',

      nickname: { $regex: searchBuyer, $options: 'i' },

      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

    


      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
    }
  );
  //console.log('getAllTradesByStorecode totalCount: ' + totalCount);
  // sum of krwAmount
  const totalKrwAmount = await collection.aggregate([
    {
      $match: {

        privateSale: { $ne: true },


        //storecode: storecode,

        storecode: { $regex: storecode, $options: 'i' },


        status: 'paymentConfirmed',

        nickname: { $regex: searchBuyer, $options: 'i' },

        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

    


        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        totalKrwAmount: { $sum: '$krwAmount' },
      }
    }
  ]).toArray();
  
  // sum of usdtAmount
  const totalUsdtAmount = await collection.aggregate([
    {
      $match: {

        privateSale: { $ne: true },

        //storecode: storecode,

        storecode: { $regex: storecode, $options: 'i' },


        status: 'paymentConfirmed',

      nickname: { $regex: searchBuyer, $options: 'i' },

      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

    


        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        totalUsdtAmount: { $sum: '$usdtAmount' },
      }
    }
  ]).toArray();

  const totalSettlementCount = await collection.aggregate([
    {
      $match: {

        privateSale: { $ne: true },

        //storecode: storecode,

        storecode: { $regex: storecode, $options: 'i' },


        status: 'paymentConfirmed',

      nickname: { $regex: searchBuyer, $options: 'i' },

      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

    


        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        totalSettlementCount: { $sum: 1 },
      }
    }
  ]).toArray();

  // totalSettlementAmount
  const totalSettlementAmount = await collection.aggregate([
    {
      $match: {

        privateSale: { $ne: true },

        //storecode: storecode,

        storecode: { $regex: storecode, $options: 'i' },


        status: 'paymentConfirmed',


        nickname: { $regex: searchBuyer, $options: 'i' },

      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },



        //settlement.settlementAmount: { $exists: true },
        'settlement.settlementAmount': { $exists: true, $ne: null },



    


      }
    },
    {
      $group: {
        _id: null,
        totalSettlementAmount: { $sum: '$settlement.settlementAmount' },
      }
    }
  ]).toArray();
  // totalSettlementAmountKRW
  const totalSettlementAmountKRW = await collection.aggregate([
    {
      $match: {

        privateSale: { $ne: true },

        //storecode: storecode,

        storecode: { $regex: storecode, $options: 'i' },


        status: 'paymentConfirmed',


        nickname: { $regex: searchBuyer, $options: 'i' },

      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },



        //settlement.settlementAmountKRW: { $exists: true },
        'settlement.settlementAmountKRW': { $exists: true, $ne: null },
      }
    },
    // $settlement.settlementAmountKRW is string
    {
      $group: {
        _id: null,
        ///totalSettlementAmountKRW: { $sum: '$settlement.settlementAmountKRW' },
        totalSettlementAmountKRW: { $sum: { $toDouble: '$settlement.settlementAmountKRW' } },
      }
    }
  ]).toArray();
  return {
    totalCount: totalCount,
    totalKrwAmount: totalKrwAmount ? totalKrwAmount[0]?.totalKrwAmount : 0,
    totalUsdtAmount: totalUsdtAmount ? totalUsdtAmount[0]?.totalUsdtAmount : 0,
    totalSettlementCount: totalSettlementCount ? totalSettlementCount[0]?.totalSettlementCount : 0,
    totalSettlementAmount: totalSettlementAmount ? totalSettlementAmount[0]?.totalSettlementAmount : 0,
    totalSettlementAmountKRW: totalSettlementAmountKRW ? totalSettlementAmountKRW[0]?.totalSettlementAmountKRW : 0,
    trades: results,
  };
}











// getAllBuyOrdersByAdmin
// status is "ordered" or "accepted" or "paymentAccepted"
export async function getAllBuyOrdersByAdmin(
  {
    limit,
    page,
    startDate,
    endDate,
    agentcode,
    searchNickname,
    walletAddress,
  }: {
    limit: number;
    page: number;
    startDate: string;
    endDate: string;
    agentcode: string;
    searchNickname: string;
    walletAddress: string;
  }

): Promise<any> {

  //console.log('getAllBuyOrdersByAdmin startDate: ' + startDate);
  //console.log('getAllBuyOrdersByAdmin endDate: ' + endDate);

  if (!startDate) {
    startDate = new Date(0).toISOString();
  }
  if (!endDate) {
    endDate = new Date().toISOString();
  }
  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');
  const results = await collection.find<UserProps>(
    {

      privateSale: { $ne: true },


      //status: 'ordered',
      //status: 'accepted',
      //status: { $in: ['ordered', 'accepted'] },
      status: { $in: ['ordered', 'accepted', 'paymentRequested'] },
      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      //walletAddress: walletAddress,
      //nickname: { $regex: searchNickname, $options: 'i' },


      agentcode: { $regex: agentcode, $options: 'i' },

      // storecode is exist
      storecode: {
        $ne: null,
      },


    },
  )
    .sort({ createdAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();

  // get total count of orders
  const totalCount = await collection.countDocuments(
    {

      privateSale: { $ne: true },

      //status: 'ordered',
      //status: 'accepted',
      status: { $in: ['ordered', 'accepted', 'paymentRequested'] },
      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      //walletAddress: walletAddress,
      //nickname: { $regex: searchNickname, $options: 'i' },

      agentcode: { $regex: agentcode, $options: 'i' },
      // storecode is not null
      storecode: { $ne: null },
    }
  );
  //console.log('getAllBuyOrdersByAdmin totalCount: ' + totalCount);
  // sum of krwAmount
  // TypeError: Cannot read properties of undefined (reading 'totalKrwAmount')
  const totalKrwAmount = await collection.aggregate([
    {
      $match: {

        privateSale: { $ne: true },


        //status: 'ordered',
        //status: 'accepted',
        status: { $in: ['ordered', 'accepted', 'paymentRequested'] },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
        //walletAddress: walletAddress,
        //nickname: { $regex: searchNickname, $options: 'i' },

        agentcode: { $regex: agentcode, $options: 'i' },

        // storecode is not null
        storecode: { $ne: null },
      }
    },
    {
      $group: {
        _id: null,
        totalKrwAmount: { $sum: '$krwAmount' },
      }
    }
  ]).toArray();
  // totalUsdtAmount
  const totalUsdtAmount = await collection.aggregate([
    {
      $match: {

        privateSale: { $ne: true },

        
        //status: 'ordered',
        //status: 'accepted',
        status: { $in: ['ordered', 'accepted', 'paymentRequested'] },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
        //walletAddress: walletAddress,
        //nickname: { $regex: searchNickname, $options: 'i' },

        agentcode: { $regex: agentcode, $options: 'i' },

        // storecode is not null
        storecode: { $ne: null },
      }
    },
    {
      $group: {
        _id: null,
        totalUsdtAmount: { $sum: '$usdtAmount' },
      }
    }
  ]).toArray();


  return {
    totalCount: totalCount,
    totalKrwAmount: totalKrwAmount ? totalKrwAmount[0]?.totalKrwAmount : 0,
    totalUsdtAmount: totalUsdtAmount ? totalUsdtAmount[0]?.totalUsdtAmount : 0,
    orders: results,
  };
}

// getAllBuyOrdersByAdmin




















// getAllBuyOrdersForMatching
export async function getAllBuyOrdersForMatching(
  {
    limit,
    page,
    startDate,
    endDate,
  }: {
    limit: number;
    page: number;
    startDate: string;
    endDate: string;
  }
): Promise<any> {
  if (!startDate) {
    startDate = new Date(0).toISOString();
  }
  if (!endDate) {
    endDate = new Date().toISOString();
  }
  //console.log('getAllBuyOrdersForMatching startDate: ' + startDate);
  //console.log('getAllBuyOrdersForMatching endDate: ' + endDate);


  //console.log('getAllBuyOrdersForMatching limit: ' + limit);
  //console.log('getAllBuyOrdersForMatching page: ' + page);


  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');
  const results = await collection.find<UserProps>(
    {
      
      storecode: { $ne: "admin" },




      settlement: null,

      status: { $in: ['ordered'] },
      
      
      'store.sellerWalletAddress': { $exists: true, $ne: null },

            // 이것때문에 확인해야함 / 2025.05.28 // nevertry




    }
  )
    .sort({ createdAt: -1 })
    ///.limit(limit).skip((page - 1) * limit)
    .toArray();



  ///console.log('getAllBuyOrdersForMatching results: ' + JSON.stringify(results));


  // get total count of orders
  const totalCount = await collection.countDocuments(
    {
      storecode: { $ne: "admin" },
      settlement: null,
      status: { $in: ['ordered'] },


      'store.sellerWalletAddress': { $exists: true, $ne: null },



    }
  );


  return {
    totalCount: totalCount,
    orders: results,
  };
}



// insertStore
export async function insertStore(data: any) {
  //console.log('insertStore data: ' + JSON.stringify(data));
  /*
  insertStore data: {"storecode":"teststorecode","storeName":"테스트상점","storeType":"test","storeUrl":"https://test.com","storeDescription":"설명입니다.","storeLogo":"https://test.com/logo.png","storeBanner":"https://test.com/banner.png"}
  */
  if (!data.storecode || !data.storeName) {
    
    
    console.log('insertStore data is invalid');
    console.log('insertStore data: ' + JSON.stringify(data));



    return null;
  }
  const client = await clientPromise;
  const collection = client.db('ultraman').collection('stores');
  // check storecode is unique
  const stores = await collection.findOne<UserProps>(
    {
      //storecode: data.storecode or storeName: data.storeName
      $or: [
        { storecode: data.storecode },
        { storeName: data.storeName },
      ],

    }
  );

  console.log('insertStore stores: ' + JSON.stringify(stores));

  if (stores) {
    console.log('storecode or storeName is already exist');
    return null;
  }



  // insert storecode
  const result = await collection.insertOne(
    {
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
  //console.log('insertStore result: ' + JSON.stringify(result));
  if (result) {
    const updated = await collection.findOne<UserProps>(
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







// deleteStoreCode
export async function deleteStoreCode(
  {
    storecode,
  }: {
    storecode: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db('ultraman').collection('stores');

  // delete storecode
  const result = await collection.deleteOne(
    { storecode: storecode }
  );
  if (result.deletedCount === 1) {
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
  }: {
    limit: number;
    page: number;
    search: string;
  }

): Promise<any> {

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('stores');

  // search storeCone, storeName, storeDescription

  const results = await collection.find<any>(
    {
      $or: [
        { storecode: { $regex: search, $options: 'i' } },
        { storeName: { $regex: search, $options: 'i' } },
        { storeDescription: { $regex: search, $options: 'i' } },
      ],

    },
  ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();



  

 
  const totalCount = await collection.countDocuments(
    {}
  );

  const searchCount = await collection.countDocuments(
    {
      $or: [
        { storecode: { $regex: search, $options: 'i' } },
        { storeName: { $regex: search, $options: 'i' } },
        { storeDescription: { $regex: search, $options: 'i' } },
      ],
    }
  );






  return {
    totalCount: totalCount,
    searchCount: searchCount,
    //totalKrwAmount: totalKrwAmount ? totalKrwAmount[0]?.totalKrwAmount : 0,
    //totalUsdtAmount: totalUsdtAmount ? totalUsdtAmount[0]?.totalUsdtAmount : 0,
    stores: results,
  };

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
  const collection = client.db('ultraman').collection('stores');

  const result = await collection.findOne<any>(
    { storecode: storecode }
  );

  //console.log('getStoreByStorecode result: ' + JSON.stringify(result));

  if (result) {
    return result;
  } else {
    return null;
  }

}




// getRandomStore
export async function getRandomStore(): Promise<any> {
  const client = await clientPromise;
  const collection = client.db('ultraman').collection('stores');

  const result = await collection.aggregate<any>([
    { $sample: { size: 1 } }
  ]).toArray();

  if (result) {
    return result[0];
  } else {
    return null;
  }

}
















export async function getCollectOrdersForSeller(

  {
    storecode,
    limit,
    page,
    walletAddress,
    searchMyOrders,

    fromDate,
    toDate,
  }: {
    storecode: string;
    limit: number;
    page: number;
    walletAddress: string;
    searchMyOrders: boolean;

    fromDate?: string;
    toDate?: string;
  }

): Promise<ResultProps> {

  console.log('getCollectOrdersForSeller fromDate: ' + fromDate);
  console.log('getCollectOrdersForSeller toDate: ' + toDate);

  //const fromDateValue = fromDate ? fromDate + 'T00:00:00Z' : '1970-01-01T00:00:00Z';
  const fromDateValue = fromDate ? new Date(fromDate + 'T00:00:00+09:00').toISOString() : '1970-01-01T00:00:00Z';

  //const toDateValue = toDate ? toDate + 'T23:59:59Z' : new Date().toISOString();
  const toDateValue = toDate ? new Date(toDate + 'T23:59:59+09:00').toISOString() : new Date().toISOString();
  

  const client = await clientPromise;

  const collection = client.db('ultraman').collection('buyorders');


  // status is not 'paymentConfirmed'


  // if searchMyOrders is true, get orders by buyer wallet address is walletAddress
  // else get all orders except paymentConfirmed

  // if storecode is empty, get all orders by wallet address

  // if storecode is not empty, get orders by storecode and wallet address




    const results = await collection.find<UserProps>(
      {
        // walletAddress is not equal to walletAddress
        //walletAddress: { $ne: walletAddress },


        //status: 'ordered',
  
        //status: { $ne: 'paymentConfirmed' },
  
        storecode: storecode,

        privateSale: true,

        createdAt: { $gte: fromDateValue, $lt: toDateValue },

      },
      
      //{ projection: { _id: 0, emailVerified: 0 } }
  
    ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();
  

    const totalCount = await collection.countDocuments(
      {
        //walletAddress: { $ne: walletAddress },


        storecode: storecode,
        privateSale: true,

        createdAt: { $gte: fromDateValue, $lt: toDateValue },
      }
    );

    return {
      totalCount: totalCount,
      orders: results,
    };




}










export async function getCollectOrdersForUser(

  {
    storecode,
    limit,
    page,
    walletAddress,
    searchMyOrders,

    fromDate,
    toDate,
  }: {
    storecode: string;
    limit: number;
    page: number;
    walletAddress: string;
    searchMyOrders: boolean;

    fromDate?: string;
    toDate?: string;
  }

): Promise<ResultProps> {

  console.log('getCollectOrdersForUser fromDate: ' + fromDate);
  console.log('getCollectOrdersForUser toDate: ' + toDate);

  //const fromDateValue = fromDate ? fromDate + 'T00:00:00Z' : '1970-01-01T00:00:00Z';
  // fromDate is korean date
  // then convert to UTC date
  const fromDateValue = fromDate ? new Date(fromDate + 'T00:00:00+09:00').toISOString() : '1970-01-01T00:00:00Z';

  // toDate is korean date
  //const toDateValue = toDate ? toDate + 'T23:59:59Z' : new Date().toISOString();
  const toDateValue = toDate ? new Date(toDate + 'T23:59:59+09:00').toISOString() : new Date().toISOString();
  

  const client = await clientPromise;

  const collection = client.db('ultraman').collection('buyorders');


  // status is not 'paymentConfirmed'


  // if searchMyOrders is true, get orders by buyer wallet address is walletAddress
  // else get all orders except paymentConfirmed

  // if storecode is empty, get all orders by wallet address

  // if storecode is not empty, get orders by storecode and wallet address


    const results = await collection.find<UserProps>(
      {
        //walletAddress: walletAddress,


        //status: 'ordered',
  
        //status: { $ne: 'paymentConfirmed' },
  
        storecode: storecode,

        privateSale: true,

        createdAt: { $gte: fromDateValue, $lt: toDateValue },

      },
      
      //{ projection: { _id: 0, emailVerified: 0 } }
  
    ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();
  

    const totalCount = await collection.countDocuments(
      {
        //walletAddress: walletAddress,

        storecode: storecode,
        privateSale: true,

        createdAt: { $gte: fromDateValue, $lt: toDateValue },
      }
    );

    return {
      totalCount: totalCount,
      orders: results,
    };




}






// getAllBuyOrdersForRequestPayment
export async function getAllBuyOrdersForRequestPayment(
  {
    limit,
    page,
  }: {
    limit: number;
    page: number;
  }

): Promise<any> {

  const client = await clientPromise;

  const collection = client.db('ultraman').collection('buyorders');

  const results = await collection.find<UserProps>(
    {


      //payactionResult.status is not 'error'

      "payactionResult.status": { $ne: 'error' },  // ==================> 중요한부분



      // storecode is exist
      //storecode: { exists: true, $ne: null },
      //"buyer.depositName": { exists: true, $ne: null },

      storecode: { $ne: null },
      // "buyer.depositName" is exist
      "buyer.depositName": { $ne: null },


      status: 'accepted',
    }
  ).sort({ createdAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();


  // get total count of orders
  const totalCount = await collection.countDocuments(
    {
      storecode: { $ne: null },
      "buyer.depositName": { $ne: null },
      status: 'accepted',
    }
  );


  return {
    totalCount: totalCount,
    orders: results,
  };
}







// updateBuyOrderPayactionResult
export async function updateBuyOrderPayactionResult(
  {
    orderId,
    api,
    payactionResult,
  }: {
    orderId: string;
    api: string;
    payactionResult: any;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');
  // update buyorder
  const result = await collection.updateOne(
    { _id: new ObjectId(orderId) },
    { $set: {
      api: api,
      payactionResult: payactionResult,
    } }
  );
  if (result.modifiedCount === 1) {
    return true;
  } else {
    return false;
  }
}




// getTradeId
export async function getTradeId(
  {
    orderId,
  }: {
    orderId: string;
  }
): Promise<string | null> {
  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');
  // get tradeId
  const result = await collection.findOne<any>(
    { _id: new ObjectId(orderId) },
    { projection: { tradeId: 1 } }
  );


  console.log('getTradeId result: ' + JSON.stringify(result));

  

  if (result && result.tradeId) {
    return result.tradeId;
  } else {
    return null;
  }
}




// updateBuyOrderSettlement
export async function updateBuyOrderSettlement(
  {
    orderId,
    settlement,
    storecode,
  }: {
    orderId: string;
    settlement: any;
    storecode: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');
  // update buyorder
  const result = await collection.updateOne(
    { _id: new ObjectId(orderId) },
    { $set: {
      settlement: settlement,
    } }
  );
  if (result.modifiedCount === 1) {





    const collectionBuyorders = client.db('ultraman').collection('buyorders');
    const collectionStore = client.db('ultraman').collection('stores');


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






    return true;
  } else {
    return false;
  }
}




// getTotalNumberOfBuyOrders
export async function getTotalNumberOfBuyOrders(): Promise<{ totalCount: number }> {
  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');
  // get total number of buy orders
  const totalCount = await collection.countDocuments(
    {
      privateSale: { $ne: true },
      //status: 'paymentConfirmed',
      status: { $in: ['ordered', 'accepted', 'paymentRequested'] },
    }
  );

  return {
    totalCount: totalCount,
  }
}


// buyOrderWebhook
export async function buyOrderWebhook(
  {
    orderId,
    webhookData,
  }: {
    orderId: string;
    webhookData: any;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db('ultraman').collection('buyorders');
  // update buyorder
  const result = await collection.updateOne(
    { _id: new ObjectId(orderId) },
    { $set: {
      webhookData: webhookData,
    } }
  );
  if (result.modifiedCount === 1) {
    return true;
  } else {
    return false;
  }
}