import clientPromise from '../mongodb';





// getOne by vactId
export async function getOne(vactId: string) {
  const client = await clientPromise;
  const collection = client.db('ultraman').collection('bankTransfers');
  return collection.findOne({ vactId: vactId });
}


// Create a new bank transfer

export async function insertOne(data: any) {

  console.log('insertOne data: ' + JSON.stringify(data));




  const client = await clientPromise;

  const collection = client.db('ultraman').collection('bankTransfers');

  // check duplicate vactId

  const vactId = data.vactId;

  const isExist = await collection.findOne({ vactId: vactId });

  if (isExist) {
    console.log('vactId already exists');
    return null;
  }


  const result = await collection.insertOne(

    {
      amount: data.amount,
      sender: data.sender,
      custAccnt: data.custAccnt,
      vactId: data.vactId,
      regDate: data.regDate,
      distName: data.distName,
      mchtId: data.mchtId,
      trxType: data.trxType,
      bankName: data.bankName,
      custBankName: data.custBankName,
      account: data.account,
    }
  );

  if (result) {
    return {
      amount: data.amount,
      sender: data.sender,
      custAccnt: data.custAccnt,
      vactId: data.vactId,
      regDate: data.regDate,
      distName: data.distName,
      mchtId: data.mchtId,
      trxType: data.trxType,
      bankName: data.bankName,
      custBankName: data.custBankName,
      account: data.account,
    };
  } else {
    return null;
  }

}



// Get all bank transfers
export async function findAll() {
  const client = await clientPromise;
  const collection = client.db('ultraman').collection('bankTransfers');
  return collection.find({}).toArray();
}


// Get all bank transfers by account
/*
array of objects
{
  "_id": {
    "$oid": "67a1b6794e2131d430f1aea1"
  },
  "amount": 15000,
  "sender": "이철호",
  "custAccnt": "3522246464283",
  "vactId": "V250204350140",
  "regDate": "2025-02-04 15:32:35",
  "distName": "스타디움엑스(가상)",
  "mchtId": "w63791online",
  "trxType": "입금",
  "bankName": "제주은행",
  "custBankName": "단위농협",
  "account": "50902006486789"
}
*/
export async function findByAccount(virtualAccount: string) {

  console.log('findByAccount virtualAccount: ' + virtualAccount);

  const client = await clientPromise;
  const collection = client.db('ultraman').collection('bankTransfers');
  return collection.find({ account: virtualAccount }).toArray();
}






