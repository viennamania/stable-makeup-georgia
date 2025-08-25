import clientPromise from '../mongodb';

import { dbName } from '../mongodb';

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
  walletPrivateKey: string,
  storecode: string,
  seller: any,
  buyer: any,

  role: string,

  buyOrderStatus: string,

}

export interface ResultProps {
  totalCount: number;
  totalResult: number;
  users: UserProps[];
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

  let depositBankAccountNumber = data.buyer.depositBankAccountNumber;


  if (data.buyer.depositBankAccountNumber) {
    depositBankAccountNumber = data.buyer.depositBankAccountNumber.replace(/[^0-9]/g, '');
  } else {
    return {
      result: null,
      error: 'depositBankAccountNumber is required',
    }
  }

  

  console.log('depositBankAccountNumber: ' + depositBankAccountNumber);

  const depositBankName = data.buyer.depositBankName;
  const depositName = data.buyer.depositName;





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
      }
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


  // update and return updated user

  const checkUser = await collection.findOne<UserProps>(
    
    {
      storecode: data.storecode,
      nickname: data.nickname,
    }
    
  )
      


  if (checkUser) {

    console.log('updateOne exists: ' + JSON.stringify(checkUser));

    return null;
  }





  const result = await collection.updateOne(
    {
      walletAddress: data.walletAddress,
      storecode: data.storecode,
    },
    { $set: { nickname: data.nickname } }
  );

  if (result) {
    const updated = await collection.findOne<UserProps>(
      {
        storecode: data.storecode,
        walletAddress: data.walletAddress
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

  return await collection.updateOne(
    {
      storecode: storecode,
      walletAddress: walletAddress
    },
    {
      $set: {
        buyer,
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

  const results = await collection.findOne<UserProps>(
    {
      storecode: storecode,
      walletAddress: walletAddress
    },
  );


  //console.log('getOneByWalletAddress results: ' + results);

  return results;

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





// getAllBuyers
// search by storecode
export async function getAllBuyers(
  {
    agentcode,
    storecode,
    search,
    depositName,
    limit,
    page,
  }: {
    agentcode: string;
    storecode: string;
    search: string;
    depositName: string;
    limit: number;
    page: number;
  }
): Promise<any> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');
  // walletAddress is not empty and not null
  // order by nickname asc
  // if storecode is empty, return all users

  
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

        }
      }
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .toArray();

  const totalCount = await collection.countDocuments(
    {

      storecode: { $regex: String(storecode), $options: 'i' },
      nickname: { $regex: String(search), $options: 'i' },
      "buyer.depositName": { $regex: String(depositName), $options: 'i' },
      walletAddress: { $exists: true, $ne: null },
      $or: [
        { verified: { $exists: false } },
        { verified: false },


      ]
    }
  );



  return {
    totalCount: totalCount,
    totalResult: totalCount,
    users,
  };
}





// getAllBuyersForAgent
export async function getAllBuyersForAgent(
  {
    storecode,
    agentcode,
    limit,
    page,
  }: {
    storecode: string;
    agentcode: string;
    limit: number;
    page: number;
  }
): Promise<ResultProps> {

  console.log('getAllBuyersForAgent agentcode: ' + agentcode);
  console.log('getAllBuyersForAgent limit: ' + limit);
  console.log('getAllBuyersForAgent page: ' + page);
  
 
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
      




  console.log('getAllBuyersForAgent users: ' + users.length);
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
  }: {
    storecode: string;
    role: string;
    limit: number;
    page: number;
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



  } else {

    const users = await collection
      .find<UserProps>(
        {
          storecode: storecode,
          walletAddress: { $exists: true, $ne: null },

          role: { $regex: String(role || ''), $options: 'i' },
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

        //role: {  $regex: role, $options: 'i' },
        role: { $regex: String(role || ''), $options: 'i' },

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
      storecode: { $regex: storecode, $options: 'i' },
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




