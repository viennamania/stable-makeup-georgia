import { use } from 'react';
import clientPromise from '../mongodb';

import { dbName } from '../mongodb';
import { id } from 'ethers/lib/utils';
import { ObjectId } from 'mongodb';
import { access } from 'fs';

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

  escrowWalletAddress: string,
  escrowWalletPrivateKey: string,

  walletAddress: string,
  signerAddress: string,
  walletPrivateKey: string,
  storecode: string,
  seller: any,
  buyer: any,

  role: string,

  buyOrderStatus: string,

  userType: string,

  buyOrderAudioOn: boolean,

  liveOnAndOff: boolean;

  isBlack: boolean;


  totalPaymentConfirmedCount: number;
  totalPaymentConfirmedKrwAmount: number;
  totalPaymentConfirmedUsdtAmount: number;

}

export interface ResultProps {
  totalCount: number;
  totalResult: number;
  users: UserProps[];
}

const escapeRegexText = (value: string) => {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const BUYORDER_STATUS_OVERVIEW_STATUSES = [
  "ordered",
  "accepted",
  "paymentRequested",
  "paymentConfirmed",
  "cancelled",
  "completed",
] as const;

const getUserBuyOrderStatusKey = (
  storecode: unknown,
  walletAddress: unknown,
) => {
  const normalizedStorecode = String(storecode || "").trim().toLowerCase();
  const normalizedWalletAddress = String(walletAddress || "").trim().toLowerCase();

  if (!normalizedStorecode || !normalizedWalletAddress) {
    return "";
  }

  return `${normalizedStorecode}::${normalizedWalletAddress}`;
};

type LatestUserBuyOrderStatus = {
  _id: {
    storecode: string;
    walletAddress: string;
  };
  buyOrderStatus?: string;
  latestBuyOrderId?: unknown;
  latestBuyOrderTradeId?: string;
  latestBuyOrderCreatedAt?: string;
};

async function hydrateUsersWithLatestBuyOrderStatus({
  client,
  users,
}: {
  client: any;
  users: any[];
}) {
  if (!Array.isArray(users) || users.length === 0) {
    return users;
  }

  const keys = new Map<
    string,
    { normalizedStorecode: string; normalizedWalletAddress: string; storecodeCandidates: string[] }
  >();

  for (const user of users) {
    const rawStorecode = String(user?.storecode || "").trim();
    const normalizedStorecode = rawStorecode.toLowerCase();
    const normalizedWalletAddress = String(user?.walletAddress || "").trim().toLowerCase();
    const key = getUserBuyOrderStatusKey(rawStorecode, normalizedWalletAddress);

    if (!key) {
      continue;
    }

    keys.set(key, {
      normalizedStorecode,
      normalizedWalletAddress,
      storecodeCandidates: Array.from(
        new Set([rawStorecode, normalizedStorecode].filter(Boolean)),
      ),
    });
  }

  if (keys.size === 0) {
    return users;
  }

  const buyOrderCollection = client.db(dbName).collection("buyorders");
  const matchPairs = Array.from(keys.values()).map(
    ({ normalizedStorecode, normalizedWalletAddress }) => ({
      _normalizedStorecode: normalizedStorecode,
      _normalizedWalletAddress: normalizedWalletAddress,
    }),
  );
  const storecodeCandidates = Array.from(
    new Set(
      Array.from(keys.values()).flatMap(({ storecodeCandidates }) => storecodeCandidates),
    ),
  );

  const latestOrders = (await buyOrderCollection.aggregate([
    {
      $match: {
        storecode: { $in: storecodeCandidates },
        walletAddress: { $type: "string", $ne: "" },
        status: { $in: [...BUYORDER_STATUS_OVERVIEW_STATUSES] },
      },
    },
    {
      $addFields: {
        _normalizedStorecode: {
          $toLower: {
            $trim: {
              input: { $ifNull: ["$storecode", ""] },
            },
          },
        },
        _normalizedWalletAddress: {
          $toLower: {
            $trim: {
              input: { $ifNull: ["$walletAddress", ""] },
            },
          },
        },
      },
    },
    {
      $match: {
        $or: matchPairs,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $group: {
        _id: {
          storecode: "$_normalizedStorecode",
          walletAddress: "$_normalizedWalletAddress",
        },
        buyOrderStatus: { $first: "$status" },
        latestBuyOrderId: { $first: "$_id" },
        latestBuyOrderTradeId: { $first: "$tradeId" },
        latestBuyOrderCreatedAt: { $first: "$createdAt" },
      },
    },
  ]).toArray()) as LatestUserBuyOrderStatus[];

  const latestOrderMap = new Map<string, LatestUserBuyOrderStatus>(
    latestOrders.map((order) => [
      `${String(order?._id?.storecode || "")}::${String(order?._id?.walletAddress || "")}`,
      order,
    ]),
  );

  return users.map((user) => {
    const key = getUserBuyOrderStatusKey(user?.storecode, user?.walletAddress);
    const latestOrder = key ? latestOrderMap.get(key) : null;

    return {
      ...user,
      buyOrderStatus: latestOrder?.buyOrderStatus
        ? String(latestOrder.buyOrderStatus)
        : "",
      latestBuyOrderId: latestOrder?.latestBuyOrderId
        ? String(latestOrder.latestBuyOrderId)
        : "",
      latestBuyOrderTradeId: latestOrder?.latestBuyOrderTradeId
        ? String(latestOrder.latestBuyOrderTradeId)
        : "",
      latestBuyOrderCreatedAt: latestOrder?.latestBuyOrderCreatedAt || "",
    };
  });
}




export async function insertOne(data: any) {

  ///console.log('insertOne data: ' + JSON.stringify(data));



  if (!data.storecode || !data.walletAddress || !data.nickname) {
    return null;
  }

  const password = data.password;


  // check data.depositBankAccountNumber 
  // data.depositBankAccountNumber is only number
  /// if data.depositBankAccountNumber has special character, extract only number

  const buyer = data?.buyer || {};

  let depositBankAccountNumber = buyer.depositBankAccountNumber;


  if (buyer.depositBankAccountNumber) {
    depositBankAccountNumber = buyer.depositBankAccountNumber.replace(/[^0-9]/g, '');
  } else {
    return {
      result: null,
      error: 'depositBankAccountNumber is required',
    }
  }

  

  console.log('depositBankAccountNumber: ' + depositBankAccountNumber);

  const depositBankName = buyer.depositBankName;
  const depositName = buyer.depositName;
  const createdByApi = typeof data.createdByApi === 'string' && data.createdByApi.trim()
    ? data.createdByApi.trim()
    : null;
  const creationAudit = data?.creationAudit && typeof data.creationAudit === 'object'
    ? {
        route: typeof data.creationAudit.route === 'string' ? data.creationAudit.route.trim() || null : null,
        method: typeof data.creationAudit.method === 'string' ? data.creationAudit.method.trim() || null : null,
        publicIp: typeof data.creationAudit.publicIp === 'string' ? data.creationAudit.publicIp.trim() || null : null,
        publicCountry: typeof data.creationAudit.publicCountry === 'string' ? data.creationAudit.publicCountry.trim() || null : null,
        userAgent: typeof data.creationAudit.userAgent === 'string' ? data.creationAudit.userAgent.trim().slice(0, 1000) || null : null,
        referer: typeof data.creationAudit.referer === 'string' ? data.creationAudit.referer.trim().slice(0, 1000) || null : null,
        origin: typeof data.creationAudit.origin === 'string' ? data.creationAudit.origin.trim().slice(0, 1000) || null : null,
        requestedAt: typeof data.creationAudit.requestedAt === 'string' ? data.creationAudit.requestedAt : new Date().toISOString(),
      }
    : null;





  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');

  // check same walletAddress or smae nickname

  const checkUser = await collection.findOne<UserProps>(
    {

      storecode: data.storecode,

      $or: [
        { walletAddress: data.walletAddress },
        { nickname: data.nickname },

      ]
    },
    { projection: { _id: 0, emailVerified: 0 } }
  );

  ///console.log('checkUser: ' + checkUser);


  if (checkUser) {

    console.log('insertOne user already exists: ' + JSON.stringify(checkUser));

    return {
      error: 'user already exists',
    }
  }



  




  // check storecode from stores collection
  const storeCollection = client.db(dbName).collection('stores');
  const store = await storeCollection.findOne(
    { storecode: data.storecode }
  );
  if (!store) {
    console.log('store not found: ' + data.storecode);
    return null;
  }



  ///console.log('insertOne buyer: ' + JSON.stringify(data.buyer));


  // generate id 100000 ~ 999999

  const id = Math.floor(Math.random() * 9000000) + 100000;


  const result = await collection.insertOne(

    {
      id: id,
      email: data.email,
      nickname: data.nickname,
      mobile: data.mobile,

      storecode: data.storecode,
      store: store,
      
      walletAddress: data.walletAddress,
      walletPrivateKey: data.walletPrivateKey,



      createdAt: new Date().toISOString(),

      settlementAmountOfFee: "0",

      password: password,

      buyer: {
        depositBankAccountNumber: depositBankAccountNumber,
        depositBankName: depositBankName,
        depositName: depositName,
      },

      userType: data.userType,
      createdByApi: createdByApi,
      creationAudit: creationAudit,
    }
  );


  if (result) {


    // check buyer.depositBankAccountNumber is exist bankusers collection
    // if exist, skip insert
    const bankUsersCollection = client.db(dbName).collection('bankusers');
    const checkBankUser = await bankUsersCollection.findOne(
      {
        bankAccountNumber: depositBankAccountNumber,
      }
    );

    if (!checkBankUser) {
      await bankUsersCollection.insertOne(
        {
          bankAccountNumber: depositBankAccountNumber,
          bankName: depositBankName,
          accountHolder: depositName,
        }
      );
    }
    



    // update store collection
    // get total buyer member count from users collection
    // buyer member is buyer is exist and buyer is not null
    // and storecode is same

    const totalMemberCount = await collection.countDocuments(
      {
        storecode: data.storecode,
        walletAddress: { $exists: true, $ne: null },
        buyer: { $exists: true, $ne: null },
      }
    );
    // update store collection
    const storeCollection = client.db(dbName).collection('stores');
    const store = await storeCollection.updateOne(
      { storecode: data.storecode },
      { $set: { totalBuyerCount: totalMemberCount } }
    );




    return {
      id: id,
      email: data.email,
      nickname: data.nickname,
      storecode: data.storecode,
      walletAddress: data.walletAddress,
      mobile: data.mobile,
    };
  } else {
    return null;
  }
  

}





export async function insertOneVerified(data: any) {

  //console.log('insertOne data: ' + JSON.stringify(data));


  if (!data.storecode || !data.walletAddress || !data.nickname ) {

    console.log('insertOneVerified data: ' + JSON.stringify(data));

    return null;
  }

  //console.log('insertOne data: ' + JSON.stringify(data));



  const client = await clientPromise;


  // check storecode from stores collection
  const storeCollection = client.db(dbName).collection('stores');
  const store = await storeCollection.findOne(
    { storecode: data.storecode }
  );
  if (!store) {
    console.log('store not found: ' + data.storecode);
    return null;
  }


  const collection = client.db(dbName).collection('users');

  
  // check same nickname and storecode
  const checkNickname = await collection.findOne<UserProps>(
    {
      storecode: data.storecode,
      nickname: data.nickname,
    },
    { projection: { _id: 0, emailVerified: 0 } }
  );
  if (checkNickname) {
    ////console.log('insertOneVerified nickname exists: ' + JSON.stringify(checkNickname));
    return null;
  }

  // check same walletAddress and storecode  
  const checkUser = await collection.findOne<UserProps>(
    {
      storecode: data.storecode,
      walletAddress: data.walletAddress,
    },
    { projection: { _id: 0, emailVerified: 0 } }
  );

  if (checkUser) {

    ///console.log('insertOneVerified exists: ' + JSON.stringify(checkUser));
    
    return null;
  }


  // generate id 1000000 ~ 9999999

  const id = Math.floor(Math.random() * 9000000) + 1000000;

  console.log('id: ' + id);



  const result = await collection.insertOne(

    {
      id: id,
      email: data.email,
      nickname: data.nickname,
      mobile: data.mobile,

      storecode: data.storecode,
      store: store,
      walletAddress: data.walletAddress,


      createdAt: new Date().toISOString(),

      settlementAmountOfFee: "0",

      verified: true,
    }
  );


  if (result) {
    return {
      id: id,
      email: data.email,
      nickname: data.nickname,
      storecode: data.storecode,
      walletAddress: data.walletAddress,
      mobile: data.mobile,
    };
  } else {
    return null;
  }
  

}



export async function updateOne(data: any) {





  if (
    !data.storecode ||
    !data.walletAddress || !data.nickname || !data.storecode) {

    console.log('updateOne data: ' + JSON.stringify(data));

    return null;
  }


  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');

  const walletAddressRaw = String(data.walletAddress || '').trim();
  const escapedWalletAddress = walletAddressRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const walletAddressRegex = new RegExp(`^${escapedWalletAddress}$`, 'i');

  const existingUser = await collection.findOne<UserProps>(
    {
      storecode: data.storecode,
      walletAddress: walletAddressRegex,
    }
  );

  if (!existingUser) {
    return null;
  }

  // nickname duplicated by another wallet in same store
  const duplicatedNickname = await collection.findOne<UserProps>(
    {
      storecode: data.storecode,
      nickname: data.nickname,
      walletAddress: { $ne: existingUser.walletAddress },
    }
  );

  if (duplicatedNickname) {

    console.log('updateOne duplicated nickname: ' + JSON.stringify(duplicatedNickname));

    return null;
  }

  const updatePayload: any = {
    nickname: data.nickname,
    updatedAt: new Date().toISOString(),
  };

  if (typeof data.mobile === 'string' && data.mobile.trim()) {
    updatePayload.mobile = data.mobile.trim();
  }

  if (typeof data.email === 'string' && data.email.trim()) {
    updatePayload.email = data.email.trim();
  }

  const result = await collection.updateOne(
    {
      walletAddress: existingUser.walletAddress,
      storecode: data.storecode,
    },
    { $set: updatePayload }
  );

  if (result) {
    const updated = await collection.findOne<UserProps>(
      {
        storecode: data.storecode,
        walletAddress: existingUser.walletAddress
      },
    );

    return updated;
  } else {
    return null;
  }

}


export async function updateAvatar(data: any) {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');


  // update and return updated user

  if (
    !data.storecode ||
    !data.walletAddress || !data.avatar) {
    return null;
  }


  const result = await collection.updateOne(
    {
      storecode: data.storecode,
      walletAddress: data.walletAddress
    },
    { $set: { avatar: data.avatar } }
  );

  if (result) {
    const updated = await collection.findOne<UserProps>(
      {
        storecode: data.storecode,
        walletAddress: data.walletAddress
      },
      { projection: { _id: 0, emailVerified: 0 } }
    );

    return updated;
  } else {
    return null;
  }

}


export async function updateSellerStatus(data: any) {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');


  // update and return updated user

  if (!data.storecode || !data.walletAddress || !data.sellerStatus || !data.bankName || !data.accountNumber || !data.accountHolder) {
    return null;
  }


  
  // check data.accountNumber is exist from bankusers collection
  const bankUsersCollection = client.db(dbName).collection('bankusers');
  const checkBankUser = await bankUsersCollection.findOne(
    {
      bankAccountNumber: data.accountNumber,
    }
  );
  if (checkBankUser) {
    console.log('bank user already exists: ' + data.accountNumber);
  }
  


  const seller = {
    status: data.sellerStatus,
    bankInfo: {
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountHolder: data.accountHolder,
    }
  };
  



  const result = await collection.updateOne(
    {
      storecode: data.storecode,
      walletAddress: data.walletAddress
    },
    { $set: { seller: seller } }
  );



  if (result) {


    /*
    // insert bank user to bankusers collection
    await bankUsersCollection.insertOne(
      {
        bankAccountNumber: data.accountNumber,
        bankName: data.bankName,
        accountHolder: data.accountHolder,
      }
    );
    */



    const updated = await collection.findOne<UserProps>(
      {
        storecode: data.storecode,
        walletAddress: data.walletAddress
      },
      { projection: { _id: 0, emailVerified: 0 } }
    );

    return updated;
  } else {
    return null;
  }


}








export async function updateSellerStatusForClearance(data: any) {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');


  // update and return updated user

  if (!data.storecode || !data.walletAddress || !data.sellerStatus || !data.bankName || !data.accountNumber || !data.accountHolder) {
    return null;
  }



  // check data.accountNumber is exist from bankusers collection
  const bankUsersCollection = client.db(dbName).collection('bankusers');
  const checkBankUser = await bankUsersCollection.findOne(
    {
      bankAccountNumber: data.accountNumber,
    }
  );
  if (checkBankUser) {
    console.log('bank user already exists: ' + data.accountNumber);
  }



  const sellerForClearance = {
    status: data.sellerStatus,
    bankInfo: {
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountHolder: data.accountHolder,
    }
  };
  



  const result = await collection.updateOne(
    {
      storecode: data.storecode,
      walletAddress: data.walletAddress
    },
    { $set: { sellerForClearance: sellerForClearance } }
  );



  if (result) {


    // insert bank user to bankusers collection
    await bankUsersCollection.insertOne(
      {
        bankAccountNumber: data.accountNumber,
        bankName: data.bankName,
        accountHolder: data.accountHolder,
      }
    );



    const updated = await collection.findOne<UserProps>(
      {
        storecode: data.storecode,
        walletAddress: data.walletAddress
      },
      { projection: { _id: 0, emailVerified: 0 } }
    );

    return updated;
  } else {
    return null;
  }


}












export async function updateBuyer({
  storecode,
  walletAddress,
  buyer,
}: {
  storecode: string;
  walletAddress: string;
  buyer: any;
}) {

  //console.log('updateSeller walletAddress: ' + walletAddress + ' seller: ' + JSON.stringify(buyer));

  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');
  const walletAddressRaw = String(walletAddress || '').trim();
  const escapedWalletAddress = walletAddressRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const walletAddressRegex = new RegExp(`^${escapedWalletAddress}$`, 'i');

  return await collection.updateOne(
    {
      storecode: storecode,
      walletAddress: walletAddressRegex
    },
    {
      $set: {
        buyer,
      }
    }
  );
  
}



// updateUserType
export async function updateUserType({
  storecode,
  walletAddress,
  userType,
}: {
  storecode: string;
  walletAddress: string;
  userType: string | null;
}) {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');
  const walletAddressRaw = String(walletAddress || '').trim();
  const escapedWalletAddress = walletAddressRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const walletAddressRegex = new RegExp(`^${escapedWalletAddress}$`, 'i');

  return await collection.updateOne(
    {
      storecode: storecode,
      walletAddress: walletAddressRegex
    },
    {
      $set: {
        userType,
      }
    }
  );

}





// getOneByVirtualAccount
export async function getOneByVirtualAccount(
  virtualAccount: string,
): Promise<UserProps | null> {

  //console.log('getOneByVirtualAccount virtualAccount: ' + virtualAccount);

  const client = await clientPromise;

  const collection = client.db(dbName).collection('users');

  // id is number

  const results = await collection.findOne<UserProps>(
    { buyer: { $exists: true, $ne: null }, 'buyer.bankInfo.virtualAccount': virtualAccount },
  );

  //console.log('getOneByVirtualAccount results: ' + results);

  return results;

}



export async function getOneByWalletAddress(
  storecode: string,
  walletAddress: string,
): Promise<UserProps | null> {

  //console.log('getOneByWalletAddress walletAddress: ' + walletAddress);

  const client = await clientPromise;

  const collection = client.db(dbName).collection('users');




  // id is number

  const walletAddressRaw = String(walletAddress || '').trim();
  if (!walletAddressRaw) {
    return null;
  }

  const walletAddressCandidates = Array.from(
    new Set([walletAddressRaw, walletAddressRaw.toLowerCase(), walletAddressRaw.toUpperCase()]),
  );

  const results = await collection.findOne<UserProps>({
    storecode: storecode,
    walletAddress: { $in: walletAddressCandidates },
  });

  if (results) {
    return results;
  }

  const escapedWalletAddress = walletAddressRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const walletAddressRegex = new RegExp(`^${escapedWalletAddress}$`, 'i');
  return await collection.findOne<UserProps>({
    storecode: storecode,
    walletAddress: walletAddressRegex,
  });
}





export async function getOneByWalletAddressAcrossStores(
  walletAddress: string,
): Promise<UserProps | null> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');

  const walletAddressRaw = String(walletAddress || '').trim();
  if (!walletAddressRaw) {
    return null;
  }

  const walletAddressCandidates = Array.from(
    new Set([walletAddressRaw, walletAddressRaw.toLowerCase(), walletAddressRaw.toUpperCase()]),
  );

  const results = await collection.findOne<UserProps>({
    walletAddress: { $in: walletAddressCandidates },
  });

  if (results) {
    return results;
  }

  const escapedWalletAddress = walletAddressRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const walletAddressRegex = new RegExp(`^${escapedWalletAddress}$`, 'i');

  return await collection.findOne<UserProps>({
    walletAddress: walletAddressRegex,
  });

}



export async function checkSellerByWalletAddress(
  storecode: string,
  walletAddress: string,
): Promise<UserProps | null> {

  const client = await clientPromise;

  const collection = client.db(dbName).collection('users');

  // id is number

  const results = await collection.findOne<UserProps>(
    {
      storecode: storecode,
      walletAddress: walletAddress
    },
    { projection: { id: 1, nickname: 1 } }
  );


  return results;

}







// getOneByStorecodeAndWalletAddress
export async function getOneByStorecodeAndWalletAddress(
  storecode: string,
  walletAddress: string,
): Promise<UserProps | null> {

  const client = await clientPromise;

  const collection = client.db(dbName).collection('users');

  const walletAddressRaw = String(walletAddress || '').trim();
  if (!walletAddressRaw) {
    return null;
  }

  const projection = {
    nickname: 1,
    email: 1,
    walletAddress: 1,
    buyer: 1,
    createdAt: 1,
    updatedAt: 1,
    userType: 1,

    // liveOnAndOff
    // if liveOnAndOff is not exist, set it to true
    liveOnAndOff: { $ifNull: ['$liveOnAndOff', true] },
  };

  const walletAddressCandidates = Array.from(
    new Set([walletAddressRaw, walletAddressRaw.toLowerCase(), walletAddressRaw.toUpperCase()]),
  );

  const results = await collection.findOne<UserProps>(
    {
      storecode: storecode,
      walletAddress: { $in: walletAddressCandidates },
    },
    { projection },
  );

  if (results) {
    return results;
  }

  const escapedWalletAddress = walletAddressRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const walletAddressRegex = new RegExp(`^${escapedWalletAddress}$`, 'i');

  return await collection.findOne<UserProps>(
    {
      storecode: storecode,
      walletAddress: walletAddressRegex,
    },
    { projection },
  );

}







export async function getPayUserByWalletAddress(
  walletAddress: string,
): Promise<UserProps | null> {


  const client = await clientPromise;

  const collection = client.db(dbName).collection('users');


  // walletPrivateKey is not null
  const results = await collection.findOne<UserProps>(
    {
      walletAddress: walletAddress,
      ///walletPrivateKey: { $exists: true, $ne: null },
      $or: [
        { verified: { $exists: false } },
        { verified: false },
      ],
    },
  );


  //console.log('getOneByWalletAddress results: ' + results);

  return results;

}






// getOneByTelegramId
export async function getOneByTelegramId(
  telegramId: string,
): Promise<UserProps | null> {

  //console.log('getOneByTelegramId telegramId: ' + telegramId);

  const client = await clientPromise;

  const collection = client.db(dbName).collection('users');

  // id is number

  const results = await collection.findOne<UserProps>(
    { telegramId: telegramId },
  );

  //console.log('getOneByTelegramId results: ' + results);

  return results;

}




// getOneByNickname
export async function getOneByNickname(
  storecode: string,
  nickname: string,
): Promise<UserProps | null> {

  //console.log('getOneByNickname nickname: ' + nickname);

  const client = await clientPromise;

  const collection = client.db(dbName).collection('users');

  const results = await collection.findOne<UserProps>(
    {
      storecode: storecode,
      nickname: nickname
    },
  );

  return results;

}





export async function getAllUsers(
  {
    storecode,
    limit,
    page,
  }: {
    storecode: string;
    limit: number;
    page: number;
  }
): Promise<ResultProps> {


  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');


  console.log('limit: ' + limit);
  console.log('page: ' + page);

  // walletAddress is not empty and not null
  // order by nickname asc

  const users = await collection
    .find<UserProps>(
      {

        storecode: { $regex: String(storecode), $options: 'i' },
        walletAddress: { $exists: true, $ne: null},
        verified: true,
        

      },
      {
        limit: limit,
        skip: (page - 1) * limit,
      },
      
    )
    .sort({ nickname: 1 })
    .toArray();


  const totalCount = await collection.countDocuments(
    {
      storecode: { $regex: String(storecode), $options: 'i' },
      walletAddress: { $exists: true, $ne: null },
    }
  );

  const totalResult = await collection.countDocuments(
    {
      storecode: { $regex: String(storecode), $options: 'i' },
      walletAddress: { $exists: true, $ne: null },
      verified: true,
    },

  );



  return {
    totalCount: totalCount,
    totalResult: totalResult,
    users,
  };

  
}


export async function getAllServerWalletUsersWithStoreInfo(
  {
    keyword,
    limit,
    page,
  }: {
    keyword?: string;
    limit: number;
    page: number;
  }
): Promise<{
  totalCount: number;
  totalResult: number;
  users: any[];
}> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');

  const safeKeyword = String(keyword || "").trim();
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.trunc(limit) : 20;
  const safePage = Number.isFinite(page) && page > 0 ? Math.trunc(page) : 1;
  const safeSkip = (safePage - 1) * safeLimit;
  const keywordRegex = safeKeyword
    ? new RegExp(escapeRegexText(safeKeyword), 'i')
    : null;

  const pipeline: any[] = [
    {
      $match: {
        walletAddress: { $type: 'string', $ne: '' },
        signerAddress: { $type: 'string', $ne: '' },
        storecode: { $type: 'string', $ne: '' },
        verified: true,
      },
    },
    {
      $lookup: {
        from: 'stores',
        let: { userStorecode: '$storecode' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  { $toLower: '$storecode' },
                  { $toLower: '$$userStorecode' },
                ],
              },
            },
          },
          {
            $project: {
              _id: 1,
              storecode: 1,
              storeName: 1,
              storeLogo: 1,
            },
          },
        ],
        as: 'store',
      },
    },
    {
      $unwind: '$store',
    },
  ];

  if (keywordRegex) {
    pipeline.push({
      $match: {
        $or: [
          { nickname: keywordRegex },
          { walletAddress: keywordRegex },
          { storecode: keywordRegex },
          { 'store.storeName': keywordRegex },
        ],
      },
    });
  }

  pipeline.push(
    {
      $sort: {
        'store.storeName': 1,
        nickname: 1,
        _id: -1,
      },
    },
    {
      $facet: {
        users: [
          { $skip: safeSkip },
          { $limit: safeLimit },
          {
            $project: {
              _id: 1,
              id: 1,
              email: 1,
              avatar: 1,
              nickname: 1,
              mobile: 1,
              walletAddress: 1,
              signerAddress: 1,
              storecode: 1,
              createdAt: 1,
              store: 1,
            },
          },
        ],
        meta: [
          { $count: 'totalCount' },
        ],
      },
    },
  );

  const [result] = await collection.aggregate(pipeline).toArray();
  const users = Array.isArray(result?.users) ? result.users : [];
  const totalCount = Number(result?.meta?.[0]?.totalCount || 0);

  return {
    totalCount,
    totalResult: totalCount,
    users,
  };
}


// getAllAdmins (role is admin)
export async function getAllAdmins(
  {
    limit,
    page,
  }: {
    limit: number;
    page: number;
  }
): Promise<ResultProps> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');
  // walletAddress is not empty and not null
  // order by nickname asc
  // if storecode is empty, return all users

  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 100;
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;

  const users = await collection
    .find<UserProps>(
      {
        storecode: 'admin',
        role: 'admin',
        walletAddress: { $exists: true, $ne: null },
      },
      {
        projection:
        {
          id: 1,
          createdAt: 1,
          nickname: 1,
          walletAddress: 1,
          storecode: 1,
          role: 1,
          store: 1,
          buyer: 1,
          userType: 1,
        }
      }
    )
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * safeLimit)
    .limit(safeLimit)
    .toArray();

  const totalCount = await collection.countDocuments(
    {
      storecode: 'admin',
      role: 'admin',
      walletAddress: { $exists: true, $ne: null },
    }
  );

  return {
    totalCount: totalCount,
    totalResult: totalCount,
    users,
  };
}



// getAllBuyers
// search by storecode
export async function getAllBuyers(
  {
    agentcode,
    storecode,
    search,
    depositName,
    userType = 'all',
    limit,
    page,
  }: {
    agentcode: string;
    storecode: string;
    search: string;
    depositName: string;
    userType?: string;
    limit: number;
    page: number;
  }
): Promise<any> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');
  // walletAddress is not empty and not null
  // order by nickname asc
  // if storecode is empty, return all users

  
  const normalizedAgentcode = String(agentcode || '').trim();
  const normalizedUserType = String(userType || 'all').trim();
  const normalizedUserTypeUpper = normalizedUserType.toUpperCase();
  const gradeUserTypes = ['AAA', 'BBB', 'CCC', 'DDD'];
  const userTypeFilter =
    normalizedUserType === 'normal'
      ? { $nin: gradeUserTypes }
      : gradeUserTypes.includes(normalizedUserTypeUpper)
        ? normalizedUserTypeUpper
        : normalizedUserType !== '' && normalizedUserType !== 'all'
          ? normalizedUserType
          : null;
  const baseUserMatch = {
    nickname: { $regex: String(search), $options: 'i' },
    'buyer.depositName': { $regex: String(depositName), $options: 'i' },
    'storecode': { $regex: String(storecode), $options: 'i' },
    ...(userTypeFilter ? { userType: userTypeFilter } : {}),
    walletAddress: { $exists: true, $ne: null },
    $or: [
      { verified: { $exists: false } },
      { verified: false },
    ],
  };
  const aggregateMatch = {
    ...baseUserMatch,
    ...(normalizedAgentcode !== ''
      ? { 'storeInfo.agentcode': { $regex: normalizedAgentcode, $options: 'i' } }
      : {}),
  };


  // user.storecode joine stores collection to get store.accessToken

  const users = await collection.aggregate<UserProps>([
    {
      $lookup: {
        from: 'stores',
        localField: 'storecode',
        foreignField: 'storecode',
        as: 'storeInfo',
      },
    },
    {
      $unwind: { path: '$storeInfo', preserveNullAndEmptyArrays: true }
    },
    {
      $match: aggregateMatch
    },
    {
      $addFields: {
        userTypeSortOrder: {
          $switch: {
            branches: [
              { case: { $eq: ['$userType', 'AAA'] }, then: 1 },
              { case: { $eq: ['$userType', 'BBB'] }, then: 2 },
              { case: { $eq: ['$userType', 'CCC'] }, then: 3 },
              { case: { $eq: ['$userType', 'DDD'] }, then: 4 },
            ],
            default: 0,
          },
        },
      }
    },
    {
      $sort: {
        userTypeSortOrder: 1,
        createdAt: -1,
      }
    },
    {
      $project: {
        id: 1,
        createdAt: 1,
        nickname: 1,
        walletAddress: 1,
        storecode: 1,
        store: 1,
        buyer: 1,
        buyOrderStatus: 1,
        totalPaymentConfirmedCount: 1,
        totalPaymentConfirmedKrwAmount: 1,
        totalPaymentConfirmedUsdtAmount: 1,

        userType: 1,
        liveOnAndOff: 1,

      }
    },
    {
      $skip: (page - 1) * limit
    },
    {
      $limit: limit
    }
  ]).toArray();

  /*
  const users = await collection
    .find<UserProps>(
      {
        storecode: { $regex: String(storecode), $options: 'i' },
        nickname: { $regex: String(search), $options: 'i' },
        "buyer.depositName": { $regex: String(depositName), $options: 'i' },
        walletAddress: { $exists: true, $ne: null },
        $or: [
          { verified: { $exists: false } },
          { verified: false },

        
        ],
      },

      {
        projection:
        {
          id: 1,
          createdAt: 1,
          nickname: 1,
          walletAddress: 1,
          storecode: 1,
          store: 1,
          buyer: 1,
          buyOrderStatus: 1,
          totalPaymentConfirmedCount: 1,
          totalPaymentConfirmedKrwAmount: 1,
          totalPaymentConfirmedUsdtAmount: 1,

          userType: 1,
          liveOnAndOff: 1,
        }
      }
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .toArray();
    */

  let totalCount = 0;
  if (normalizedAgentcode !== '') {
    const totalCountResult = await collection.aggregate<{ totalCount: number }>([
      {
        $lookup: {
          from: 'stores',
          localField: 'storecode',
          foreignField: 'storecode',
          as: 'storeInfo',
        },
      },
      {
        $unwind: { path: '$storeInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $match: aggregateMatch
      },
      {
        $count: 'totalCount'
      },
    ]).toArray();
    totalCount = totalCountResult[0]?.totalCount || 0;
  } else {
    totalCount = await collection.countDocuments(baseUserMatch);
  }

  const usersWithLatestBuyOrderStatus = await hydrateUsersWithLatestBuyOrderStatus({
    client,
    users,
  });

  return {
    totalCount: totalCount,
    totalResult: totalCount,
    users: usersWithLatestBuyOrderStatus,
  };
}





// getAllBuyersForAgent
export async function getAllBuyersForAgent(
  {
    storecode,
    agentcode,
    search,
    depositName,
    limit,
    page,
  }: {
    storecode: string;
    agentcode: string;
    search: string;
    depositName: string;
    limit: number;
    page: number;
  }
): Promise<ResultProps> {


  
 
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');


  const users = await collection.aggregate<UserProps>([
    {
      $lookup: {
        from: 'stores',
        localField: 'storecode',
        foreignField: 'storecode',
        as: 'storeInfo',
      },
    },
    {
      $unwind: { path: '$storeInfo', preserveNullAndEmptyArrays: true }
    },
    {
      $match: {
        nickname: { $regex: String(search), $options: 'i' },
        'buyer.depositName': { $regex: String(depositName), $options: 'i' },
        'storecode': { $regex: String(storecode), $options: 'i' },
        'storeInfo.agentcode': { $regex: String(agentcode), $options: 'i' },
        walletAddress: { $exists: true, $ne: null },
        $or: [
          { verified: { $exists: false } },
          { verified: false },
        ]
      }
    },
    {
      $project: {
        id: 1,
        createdAt: 1,
        nickname: 1,
        walletAddress: 1,
        storecode: 1,
        store: 1,
        buyer: 1,
        totalPaymentConfirmedCount: 1,
        totalPaymentConfirmedKrwAmount: 1,
        totalPaymentConfirmedUsdtAmount: 1,

      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $skip: (page - 1) * limit
    },
    {
      $limit: limit
    }
  ]).toArray();
      

  const totalCount = users.length;

  return {
    totalCount,
    totalResult: totalCount,
    users,
  };
}






// getAllBuyersByStorecode
// verified is empty or verified is false

export async function getAllBuyersByStorecode(
  {
    storecode,
    limit,
    page,
  }: {
    storecode: string;
    limit: number;
    page: number;
  }
): Promise<ResultProps> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');
  // walletAddress is not empty and not null
  // order by nickname asc
  // if storecode is empty, return all users

  const users = await collection
    .find<UserProps>(
      {

        storecode: { $regex: String(storecode), $options: 'i' },
        walletAddress: { $exists: true, $ne: null },
        
        $or: [
          { verified: { $exists: false } },
          { verified: false },
        ]

      },
      {
        limit: limit,
        skip: (page - 1) * limit,
      },
    )
    .sort({ createdAt: -1 })
    .toArray();



  const totalCount = await collection.countDocuments(
    {
      storecode: { $regex: storecode, $options: 'i' },
      walletAddress: { $exists: true, $ne: null },
      $or: [
        { verified: { $exists: false } },
        { verified: false },
      ]
    }
  );
  return {
    totalCount,
    totalResult: totalCount,
    users,
  };
}



// getAllSellersByStorecode
export async function getAllSellersByStorecode(
  {
    storecode,
    role,
    limit,
    page,
    excludeSignerAddress = false,
  }: {
    storecode: string;
    role: string;
    limit: number;
    page: number;
    excludeSignerAddress?: boolean;
  }
): Promise<ResultProps> {


  console.log('getAllSellersByStorecode storecode: ' + storecode);
  console.log('getAllSellersByStorecode role: ' + role);


  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');
  // walletAddress is not empty and not null
  // order by nickname asc
  // if storecode is empty, return all users


  if (role === '' || role === undefined) {

    const users = await collection
      .find<UserProps>(
        {
          storecode: storecode,
          walletAddress: { $exists: true, $ne: null },
          verified: true,
          ...(excludeSignerAddress ? {
            $or: [
              { signerAddress: { $exists: false } },
              { signerAddress: null },
              { signerAddress: "" },
            ],
          } : {}),
        },
        {
          limit: limit,
          skip: (page - 1) * limit,
        },
      )
      .sort({ nickname: 1 })
      .toArray();

    const totalCount = await collection.countDocuments(
      {
        storecode: storecode,
        walletAddress: { $exists: true, $ne: null },
        verified: true,
        ...(excludeSignerAddress ? {
          $or: [
            { signerAddress: { $exists: false } },
            { signerAddress: null },
            { signerAddress: "" },
          ],
        } : {}),
      }

    );

    return {
      totalCount,
      totalResult: totalCount,
      users,
    };



  } else {

    const users = await collection
      .find<UserProps>(
        {
          storecode: storecode,
          walletAddress: { $exists: true, $ne: null },

          role: { $regex: String(role || ''), $options: 'i' },
          verified: true,
          ...(excludeSignerAddress ? {
            $or: [
              { signerAddress: { $exists: false } },
              { signerAddress: null },
              { signerAddress: "" },
            ],
          } : {}),
        },
        {
          limit: limit,
          skip: (page - 1) * limit,
        },
      )
      .sort({ nickname: 1 })
      .toArray();


    const totalCount = await collection.countDocuments(
      {
        storecode: storecode,

        //role: {  $regex: role, $options: 'i' },
        role: { $regex: String(role || ''), $options: 'i' },

        walletAddress: { $exists: true, $ne: null },

        verified: true,
        ...(excludeSignerAddress ? {
          $or: [
            { signerAddress: { $exists: false } },
            { signerAddress: null },
            { signerAddress: "" },
          ],
        } : {}),
        
      }
    );


    return {
      totalCount,
      totalResult: totalCount,
      users,
    };

  }


}

export async function getOneVerifiedNonServerWalletByStorecodeAndWalletAddress(
  storecode: string,
  walletAddress: string,
): Promise<UserProps | null> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');

  const safeStorecode = String(storecode || "").trim();
  const walletAddressRaw = String(walletAddress || '').trim();
  if (!safeStorecode || !walletAddressRaw) {
    return null;
  }

  const storecodeCandidates = Array.from(
    new Set([safeStorecode, safeStorecode.toLowerCase()].filter(Boolean)),
  );
  const walletAddressCandidates = Array.from(
    new Set([walletAddressRaw, walletAddressRaw.toLowerCase(), walletAddressRaw.toUpperCase()]),
  );

  const baseQuery = {
    storecode: storecodeCandidates.length === 1
      ? storecodeCandidates[0]
      : { $in: storecodeCandidates },
    verified: true,
    walletAddress: { $type: "string", $ne: "" },
    $or: [
      { signerAddress: { $exists: false } },
      { signerAddress: null },
      { signerAddress: "" },
    ],
  };

  const found = await collection.findOne<UserProps>({
    ...baseQuery,
    walletAddress: { $in: walletAddressCandidates },
  });

  if (found) {
    return found;
  }

  const escapedWalletAddress = walletAddressRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const walletAddressRegex = new RegExp(`^${escapedWalletAddress}$`, 'i');

  return await collection.findOne<UserProps>({
    ...baseQuery,
    walletAddress: walletAddressRegex,
  });
}


// getAllSellersForBalanceInquiry
export async function getAllSellersForBalanceInquiry(
  {
    limit,
    page,
  }: {
    limit: number;
    page: number;
  }
): Promise<any> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');
  // walletAddress is not empty and not null
  // seller is not empty and status is 'confirmed'
  // order by nickname asc
  // if storecode is empty, return all users
  // projection: id, nickname, walletAddress

  const users = await collection
    .find<UserProps>(
      {
        storecode: 'admin',
        walletAddress: { $exists: true, $ne: null },
        seller: { $exists: true  , $ne: null},
        'seller.status': 'confirmed',
      },
      {
        projection: {
          id: 1,
          nickname: 1,
          walletAddress: 1,
        },
      }
    )
    .sort({ nickname: 1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .toArray();

  const totalCount = await collection.countDocuments(
    {
      storecode: 'admin',
      walletAddress: { $exists: true, $ne: null },
      seller: { $exists: true  , $ne: null},
      'seller.status': 'confirmed',
    }
  );


  return {
    totalCount,
    users ,
  };
}


// getAllStoreSellersForBalanceInquiry
export async function getAllStoreSellersForBalanceInquiry(
  {
    storecode,
    limit,
    page,
  }: {
    storecode: string;
    limit: number;
    page: number;
  }
): Promise<any> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');
  // walletAddress is not empty and not null
  // seller is not empty and status is 'confirmed'
  // order by nickname asc
  // if storecode is empty, return all users
  // projection: id, nickname, walletAddress

  const users = await collection
    .find<UserProps>(
      {
        storecode: storecode,
        walletAddress: { $exists: true, $ne: null },
        seller: { $exists: true  , $ne: null},
        'seller.status': 'confirmed',
      },
      {
        projection: {
          id: 1,
          nickname: 1,
          walletAddress: 1,
        },
      }
    )
    .sort({ nickname: 1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .toArray();
  const totalCount = await collection.countDocuments(
    {
      storecode: storecode,
      walletAddress: { $exists: true, $ne: null },
      seller: { $exists: true  , $ne: null},
      'seller.status': 'confirmed',
    }
  );

  return {
    totalCount,
    users ,
  };
}





// getAllUsersByStorecode
export async function getAllUsersByStorecode(
  {
    storecode,
    limit,
    page,
  }: {
    storecode: string;
    limit: number;
    page: number;
  }
): Promise<ResultProps> {

  

  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');

  // walletAddress is not empty and not null
  // order by nickname asc

  // if storecode is empty, return all users

  const users = await collection
    .find<UserProps>(
      {
        storecode: { $regex: storecode, $options: 'i' },
        walletAddress: { $exists: true, $ne: null },
        verified: true,
      },
      {
        limit: limit,
        skip: (page - 1) * limit,
      },
    )
    
    .sort({ nickname: 1 })


    .toArray();
  const totalCount = await collection.countDocuments(
    {
      storecode: storecode,
      walletAddress: { $exists: true, $ne: null },
      verified: true,
    }
  );
  return {
    totalCount,
    totalResult: totalCount,
    users,
  };
}




// get all users by storecode and verified
export async function getAllUsersByStorecodeFiltered(
  {
    storecode,
    limit,
    page,
    verifiedOnly = true,
    requireSignerAddress = false,
  }: {
    storecode: string;
    limit: number;
    page: number;
    verifiedOnly?: boolean;
    requireSignerAddress?: boolean;
  }
): Promise<ResultProps> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');
  const queryMaxTimeMs = Math.max(
    Number.parseInt(process.env.GET_ALL_USERS_BY_STORECODE_QUERY_MAX_TIME_MS || "", 10) || 8000,
    1000,
  );

  // walletAddress is not empty and not null
  // order by nickname asc
  // if storecode is empty, return all users
  const safeStorecode = String(storecode || "").trim();
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.trunc(limit) : 60;
  const safePage = Number.isFinite(page) && page > 0 ? Math.trunc(page) : 1;

  if (!safeStorecode) {
    return {
      totalCount: 0,
      totalResult: 0,
      users: [],
    };
  }

  const storecodeCandidates = Array.from(
    new Set([safeStorecode, safeStorecode.toLowerCase()].filter(Boolean)),
  );
  const userQuery = {
    storecode: storecodeCandidates.length === 1
      ? storecodeCandidates[0]
      : { $in: storecodeCandidates },
    walletAddress: { $type: "string", $ne: "" },
    ...(verifiedOnly ? { verified: true } : {}),
    ...(requireSignerAddress ? { signerAddress: { $type: "string", $ne: "" } } : {}),
  };

  const [users, totalCount] = await Promise.all([
    collection
      .find<UserProps>(
        userQuery,
        {
          limit: safeLimit,
          skip: (safePage - 1) * safeLimit,
          maxTimeMS: queryMaxTimeMs,
        },
      )
      .sort({ nickname: 1, _id: -1 })
      .toArray(),
    collection.countDocuments(userQuery, { maxTimeMS: queryMaxTimeMs }),
  ]);
  return {
    totalCount,
    totalResult: totalCount,
    users,
  };
}

// get all users by storecode and verified
export async function getAllUsersByStorecodeAndVerified(
  {
    storecode,
    limit,
    page,
  }: {
    storecode: string;
    limit: number;
    page: number;
  }
): Promise<ResultProps> {
  return await getAllUsersByStorecodeFiltered({
    storecode,
    limit,
    page,
    verifiedOnly: true,
  });
}

export async function getOneServerWalletByStorecodeAndWalletAddress(
  storecode: string,
  walletAddress: string,
): Promise<UserProps | null> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');

  const safeStorecode = String(storecode || "").trim();
  const walletAddressRaw = String(walletAddress || '').trim();
  if (!safeStorecode || !walletAddressRaw) {
    return null;
  }

  const storecodeCandidates = Array.from(
    new Set([safeStorecode, safeStorecode.toLowerCase()].filter(Boolean)),
  );
  const walletAddressCandidates = Array.from(
    new Set([walletAddressRaw, walletAddressRaw.toLowerCase(), walletAddressRaw.toUpperCase()]),
  );

  const baseQuery = {
    storecode: storecodeCandidates.length === 1
      ? storecodeCandidates[0]
      : { $in: storecodeCandidates },
    signerAddress: { $type: "string", $ne: "" },
  };

  const found = await collection.findOne<UserProps>({
    ...baseQuery,
    walletAddress: { $in: walletAddressCandidates },
  });

  if (found) {
    return found;
  }

  const escapedWalletAddress = walletAddressRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const walletAddressRegex = new RegExp(`^${escapedWalletAddress}$`, 'i');

  return await collection.findOne<UserProps>({
    ...baseQuery,
    walletAddress: walletAddressRegex,
  });
}

export async function getOneVerifiedAdminWalletUserByWalletAddress(
  walletAddress: string,
): Promise<UserProps | null> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');

  const walletAddressRaw = String(walletAddress || '').trim();
  if (!walletAddressRaw) {
    return null;
  }

  const walletAddressCandidates = Array.from(
    new Set([walletAddressRaw, walletAddressRaw.toLowerCase(), walletAddressRaw.toUpperCase()]),
  );

  const baseQuery = {
    storecode: { $in: ['admin', 'ADMIN'] },
    role: { $regex: '^admin$', $options: 'i' },
    verified: true,
    walletAddress: { $type: "string", $ne: "" },
  };

  const found = await collection.findOne<UserProps>({
    ...baseQuery,
    walletAddress: { $in: walletAddressCandidates },
  });

  if (found) {
    return found;
  }

  const escapedWalletAddress = walletAddressRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const walletAddressRegex = new RegExp(`^${escapedWalletAddress}$`, 'i');

  return await collection.findOne<UserProps>({
    ...baseQuery,
    walletAddress: walletAddressRegex,
  });
}

export async function upsertStoreServerWalletUser(
  {
    storecode,
    walletAddress,
    signerAddress,
    nicknameBase,
  }: {
    storecode: string;
    walletAddress: string;
    signerAddress: string;
    nicknameBase?: string;
  }
): Promise<UserProps | null> {
  const safeStorecode = String(storecode || "").trim();
  const safeWalletAddress = String(walletAddress || "").trim();
  const safeSignerAddress = String(signerAddress || "").trim();

  if (!safeStorecode || !safeWalletAddress || !safeSignerAddress) {
    return null;
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');
  const storeCollection = client.db(dbName).collection('stores');
  const store = await storeCollection.findOne(
    { storecode: safeStorecode }
  );

  if (!store) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const requestedNicknameBase = String(nicknameBase || "").trim();
  const baseNickname = requestedNicknameBase || `${safeStorecode} 자동결제`;

  const buildUniqueNickname = async () => {
    let nickname = baseNickname;
    let suffix = 2;
    while (await collection.findOne({ storecode: safeStorecode, nickname })) {
      nickname = `${baseNickname} ${suffix}`;
      suffix += 1;
    }
    return nickname;
  };

  const existingUser = await getOneByWalletAddress(safeStorecode, safeWalletAddress);
  if (existingUser) {
    const existingNickname = String(existingUser.nickname || "").trim();
    const escapedWalletAddress = safeWalletAddress.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const walletAddressRegex = new RegExp(`^${escapedWalletAddress}$`, 'i');

    await collection.updateOne(
      {
        storecode: safeStorecode,
        walletAddress: walletAddressRegex,
      },
      {
        $set: {
          walletAddress: safeWalletAddress,
          signerAddress: safeSignerAddress,
          verified: true,
          updatedAt: nowIso,
          store,
          ...(existingNickname ? {} : { nickname: await buildUniqueNickname() }),
        },
      }
    );

    return await getOneByWalletAddress(safeStorecode, safeWalletAddress);
  }

  const nickname = await buildUniqueNickname();
  const id = Math.floor(Math.random() * 9000000) + 1000000;

  const insertResult = await collection.insertOne(
    {
      id,
      email: "",
      nickname,
      mobile: "",
      storecode: safeStorecode,
      store,
      walletAddress: safeWalletAddress,
      signerAddress: safeSignerAddress,
      createdAt: nowIso,
      updatedAt: nowIso,
      settlementAmountOfFee: "0",
      verified: true,
      userType: "server-wallet",
      liveOnAndOff: true,
    } as any
  );

  if (!insertResult?.acknowledged) {
    return null;
  }

  return await getOneByWalletAddress(safeStorecode, safeWalletAddress);
}







export async function getBestSellers(
  {
    limit,
    page,
  }: {
    limit: number;
    page: number;
  }
): Promise<ResultProps> {


  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');


  console.log('limit: ' + limit);
  console.log('page: ' + page);

  // walletAddress is not empty and not null

  const users = await collection
    .find<UserProps>(
      {


        // seller is exist and seller status is 'confirmed'

        seller: { $exists: true },
        

      },
      {
        limit: limit,
        skip: (page - 1) * limit,
      },
      
    )
    .sort({ _id: -1 })
    .toArray();


  const totalCount = await collection.countDocuments(
    {
      seller: { $exists: true },
    }
  );

  return {
    totalCount,
    totalResult: totalCount,
    users,
  };

  
}










export async function getUserWalletPrivateKeyByWalletAddress(
  walletAddress: string,
): Promise<string | null> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');

  const results = await collection.findOne<UserProps>(
    { walletAddress },
    { projection: { _id: 0, emailVerified: 0 } }
  ) as any;

  console.log('getUserWalletPrivateKeyByWalletAddress results: ' + results);

  if (results) {
    return results.walletPrivateKey;
  } else {
    return null;
  }

}


export async function getUserByEmail(
  email: string,
): Promise<UserProps | null> {

  console.log('getUser email: ' + email);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');


  return await collection.findOne<UserProps>(
    { email },
    { projection: { _id: 0, emailVerified: 0 } }
  );

}






// getUserByNickname
/*
{
  "_id": {
    "$oid": "68ca596ed46688da89e9c667"
  },
  "id": 4792508,
  "email": null,
  "nickname": "test",
  "mobile": "+821012345678",
  "storecode": "ablwgfnp",
  "store": {

  },
  "walletAddress": "0x153E986cb68741514317FFB09A4419163F5528c8",
  
  "createdAt": "2025-09-17T06:47:10.012Z",
  "settlementAmountOfFee": "0",
  "buyer": {

  },
  "buyOrderStatus": "paymentConfirmed",
  "latestBuyOrder": {

  },
  "totalPaymentConfirmedCount": 1,
  "totalPaymentConfirmedKrwAmount": 5000,
  "totalPaymentConfirmedUsdtAmount": 3.62
}
*/
export async function getUserByNickname(
  storecode: string,
  nickname: string,
): Promise<UserProps | null> {

  console.log('getUser nickname: ' + nickname);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');

  return await collection.findOne<UserProps>(
    {
      storecode: storecode,
      nickname: nickname,
    },
    { projection: {
      _id: 0,
      id: 1,
      email: 1,
      nickname: 1,
      mobile: 1,
      storecode: 1,
      walletAddress: 1,
      createdAt: 1,
      settlementAmountOfFee: 1,
      buyer: 1,
      buyOrderStatus: 1,
      latestBuyOrder: 1,
      totalPaymentConfirmedCount: 1,
      totalPaymentConfirmedKrwAmount: 1,
      totalPaymentConfirmedUsdtAmount: 1,
      userType: 1,

      liveOnAndOff: { $ifNull: ['$liveOnAndOff', true] },

      isBlack: { $ifNull: ['$isBlack', false] }
    } }
  )
}







export async function checkUserByEmail(
  email: string,
  password: string,
): Promise<UserProps | null> {

  console.log('getUser email: ' + email);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');


  const results = await collection.findOne<UserProps>(
    {
      email,
      password,
    },
    { projection: { _id: 0, emailVerified: 0 } }
  );

  ///console.log('getUser results: ' + results);

  if (results) {
    return {
      ...results,
      ///bioMdx: await getMdxSource(results.bio || placeholderBio)
    };
  } else {
    return null;
  }

}


export async function loginUserByEmail(
  email: string,
  password: string,
): Promise<UserProps | null> {

  console.log('getUser email: ' + email);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');


  const results = await collection.findOne<UserProps>(
    {
      email,
      password,
    },
    { projection: { _id: 0, emailVerified: 0 } }
  );

  if (results) {
    
    // user_login_sesson
    const sessionCollection = client.db(dbName).collection('user_login_sessions');
    const sessionResults = await sessionCollection.insertOne({
      id: results.id,
      email: results.email,
      loginedAt: new Date().toISOString(),
    });

    console.log('sessionResults: ' + sessionResults);

    return {
      ...results,
      ...sessionResults,
      ///bioMdx: await getMdxSource(results.bio || placeholderBio)
    }

  } else {
    return null;
  }


}









export async function searchUser(query: string): Promise<UserProps[]> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');

  
  return await collection
    .aggregate<UserProps>([
      {
        $search: {
          index: 'name-index',
          /* 
          name-index is a search index as follows:

          {
            "mappings": {
              "fields": {
                "followers": {
                  "type": "number"
                },
                "name": {
                  "analyzer": "lucene.whitespace",
                  "searchAnalyzer": "lucene.whitespace",
                  "type": "string"
                },
                "username": {
                  "type": "string"
                }
              }
            }
          }

          */
          text: {
            query: query,
            path: {
              wildcard: '*' // match on both name and username
            },
            fuzzy: {},
            score: {
              // search ranking algorithm: multiply relevance score by the log1p of follower count
              function: {
                multiply: [
                  {
                    score: 'relevance'
                  },
                  {
                    log1p: {
                      path: {
                        value: 'followers'
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      {
        // filter out users that are not verified
        $match: {
          verified: true
        }
      },
      // limit to 10 results
      {
        $limit: 10
      },
      {
        $project: {
          _id: 0,
          emailVerified: 0,
          score: {
            $meta: 'searchScore'
          }
        }
      }
    ])
    .toArray();
}

export async function getUserCount(): Promise<number> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');
  return await collection.countDocuments();
}



export async function updateUser(username: string, bio: string) {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');


  // check dupplicated nickname




  return await collection.updateOne({ username }, { $set: { bio } });
}




export async function checkUser(id: string, password: string): Promise<UserProps | null> {
  

  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');
  const results = await collection.findOne<UserProps>(
    {
      id,
      password,
    },
    { projection: { _id: 0, emailVerified: 0 } }
  );
  if (results) {
    return {
      ...results,
      //bioMdx: await getMdxSource(results.bio || placeholderBio)
    };
  } else {
    return null;
  }
}



// get user 



export async function getAllUsersForSettlement(
  limit: number,
  page: number,
): Promise<ResultProps> {


  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');


  console.log('limit: ' + limit);
  console.log('page: ' + page);

  // walletAddress is not empty and not null

  const users = await collection
    .find<UserProps>(
      {
        walletAddress: { $exists: true, $ne: null },
        walletPrivateKey: { $exists: true, $ne: null },

      },
      {
        limit: limit,
        skip: (page - 1) * limit,
      },
      
    )
    .sort({ _id: -1 })
    .toArray();


  const totalCount = await collection.countDocuments(
    {
      walletAddress: { $exists: true, $ne: null },
      walletPrivateKey: { $exists: true, $ne: null },
    }
  );

  return {
    totalCount,
    totalResult: totalCount,
    users,
  };

}




export async function getAllUsersForSettlementOfStore(
  limit: number,
  page: number,
): Promise<ResultProps> {


  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');


  console.log('limit: ' + limit);
  console.log('page: ' + page);

  // walletAddress is not empty and not null

  const users = await collection
    .find<UserProps>(
      {


        walletAddress: { $exists: true, $ne: null },
        walletPrivateKey: { $exists: true, $ne: null },

        // when settlementAmountOfFee is exist, check settlementAmountOfFee is 0

        settlementAmountOfFee: {
          $exists: true,
          $eq: "0"
        }, 

      },
      {
        limit: limit,
        skip: (page - 1) * limit,
      },
      
    )
    .sort({ _id: -1 })
    .toArray();


  const totalCount = await collection.countDocuments(
    {
      walletAddress: { $exists: true, $ne: null },
      walletPrivateKey: { $exists: true, $ne: null },
    }
  );

  return {
    totalCount,
    totalResult: totalCount,
    users,
  };

}




// update settlementAmountOfFee for User collection
export async function updateSettlementAmountOfFee(
  walletAddress: string,
  settlementAmountOfFee: string,
) {

  console.log('updateSettlementAmountOfFee walletAddress: ' + walletAddress + ' settlementAmountOfFee: ' + settlementAmountOfFee);
  
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');

  return await collection.updateOne(
    { walletAddress },
    {
      $set: {
        settlementAmountOfFee,
      }
    }
  );
  
  }

// getAllUsersForSettlementOfFee

export async function getAllUsersForSettlementOfFee(
  limit: number,
  page: number,
): Promise<ResultProps> {


  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');


  console.log('limit: ' + limit);
  console.log('page: ' + page);

  // walletAddress is not empty and not null

  const users = await collection
    .find<UserProps>(
      {


        walletAddress: { $exists: true, $ne: null },
        walletPrivateKey: { $exists: true, $ne: null },

        // when settlementAmountOfFee is exist, check convert settlementAmountOfFee to float number and check settlementAmountOfFee is greater than 0

        settlementAmountOfFee: {
          $exists: true,
          $ne: "0"
        }, 

      },
      {
        limit: limit,
        skip: (page - 1) * limit,
      },
      
    )
    .sort({ _id: -1 })
    .toArray();


  const totalCount = await collection.countDocuments(
    {
      walletAddress: { $exists: true, $ne: null },
      walletPrivateKey: { $exists: true, $ne: null },
    }
  );

  return {
    totalCount,
    totalResult: totalCount,
    users,
  };

}


// setEscrowWalletAddressByWalletAddress
export async function setEscrowWalletAddressByWalletAddress(
  storecode: string,
  walletAddress: string,
  escrowWalletAddress: string,
  escrowWalletPrivateKey: string,
) {



  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');

  return await collection.updateOne(
    {
      storecode: storecode,
      walletAddress: walletAddress
    },
    {
      $set: {
        escrowWalletAddress,
        escrowWalletPrivateKey,
      }
    }
  );
  
}



// getAllAdmin
export async function getAllAdmin(
  {
    limit,
    page,
  }: {
    limit: number;
    page: number;
  }
): Promise<ResultProps> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');
  // walletAddress is not empty and not null
  // order by nickname asc
  // if storecode is empty, return all users
  const users = await collection
    .find<UserProps>(
      {
        storecode: { $regex: 'admin', $options: 'i' },
        walletAddress: { $exists: true, $ne: null },
      },
      {
        limit: limit,
        skip: (page - 1) * limit,
      },
    )
    .sort({ nickname: 1 })
    .toArray();


  const totalCount = await collection.countDocuments(
    {
      storecode: { $regex: 'admin', $options: 'i' },
      walletAddress: { $exists: true, $ne: null },
    }
  );
  return {
    totalCount,
    totalResult: totalCount,
    users,
  };
}




// updateBuyOrderAudioNotification
export async function updateBuyOrderAudioNotification(data: any) {

  if (!data.walletAddress || !data.storecode || data.audioOn === undefined) {
    return null;
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');

  const result = await collection.updateOne(
    { walletAddress: data.walletAddress, storecode: data.storecode },
    { $set: { buyOrderAudioOn: data.audioOn } }
  );
  
  if (result.modifiedCount === 1) {
    return true;
  } else {
    return false;
  }

}




// updateLiveOnAndOff
export async function updateLiveOnAndOff(
  {
    walletAddress,
    liveOnAndOff,
  }: {
    walletAddress: string;
    liveOnAndOff: boolean;
  }
): Promise<boolean> {

  console.log('updateLiveOnAndOff', walletAddress, liveOnAndOff);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');

  // update walletAddress
  const result = await collection.updateOne(
    { walletAddress: walletAddress },
    { $set: { liveOnAndOff: liveOnAndOff } }
  );
  if (result) {
    return true;
  } else {
    return false;
  }
}



/*
{
  "_id": {
    "$oid": "68648caa5dfc5e1671094d43"
  },
  "bankAccountNumber": "92374923",
  "bankName": "경북은행",
  "accountHolder": "테스트"
}
*/
// bankusers collection
// upsert bank user
export async function upsertBankUserAndBalance(
  {
    bankAccountNumber,
    //bankName,
    latestDepositName,
    latestBalance,
  }: {
    bankAccountNumber: string;
    //bankName: string;
    latestDepositName: string;
    latestBalance: number;
  }
): Promise<any> {

  console.log('upsertBankUser bankAccountNumber: ' + bankAccountNumber);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('bankusers');

  const result = await collection.updateOne(
    { bankAccountNumber: bankAccountNumber },
    {
      $set: {
        bankAccountNumber: bankAccountNumber,
        updatedAt: new Date().toISOString(),
        //bankName: bankName,
        //accountHolder: accountHolder,
        lastestDepositName: latestDepositName,
        latestBalance: latestBalance,
      }
    },
    { upsert: true }
  );

  return result;
}


// getUserWalletAddressByStorecodeAndNickname
export async function getUserWalletAddressByStorecodeAndNickname(
  storecode: string,
  nickname: string,
): Promise<any> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');

  const results = await collection.findOne<UserProps>(
    {
      storecode: storecode,
      nickname: nickname,
    },
    { projection: {
      _id: 0,
      walletAddress: 1,
      buyer: 1
    } }
  ) as any;


  if (results) {
    return results;
  } else {
    return null;
  }

}
