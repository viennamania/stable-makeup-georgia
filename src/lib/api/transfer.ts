import { transfer } from 'thirdweb/extensions/erc20';
import clientPromise from '../mongodb';

/*
  console.log("transactionHash", transactionHash, "transactionIndex", transactionIndex,
    "fromAddress", fromAddress, "toAddress", toAddress, "value", value,
    "timestamp", timestamp);
  
*/

export interface TransferProps {
    transactionHash: string;
    transactionIndex: string;
    fromAddress: string;
    toAddress: string;
    value: string;
    timestamp: string;
}

export async function insertOne(data: any) {

    if (!data.transactionHash || !data.transactionIndex || !data.fromAddress || !data.toAddress || !data.value || !data.timestamp) {
        return null;
    }

    const transferData = {
        transactionHash: data.transactionHash,
        transactionIndex: data.transactionIndex,
        fromAddress: data.fromAddress,
        toAddress: data.toAddress,
        value: data.value,
        timestamp: data.timestamp,
    };


    const client = await clientPromise;

    // if fromAddress is user wallet address, then insert into userTransfers collection
    // if toAddress is user wallet address, then insert into userTransfers collection


    const collectionUsers = client.db('ultraman').collection('users');

    const collectionUserTransfers = client.db('ultraman').collection('userTransfers');

    const collection = client.db('ultraman').collection('transfers');


    

    const user = await collectionUsers.findOne(
        { $or: [ { walletAddress: data.fromAddress }, { walletAddress: data.toAddress } ] },
        { projection: { walletAddress: 1 } }
    );

    if (!user) {
        return null;
    }
    

    const result = await collection.insertOne(transferData);

    // if error, then return
    if (!result) {
        return null;
    }


    ////const userFromAddress = await collectionUsers.findOne({ walletAddress: data.fromAddress });
    /*
    const userFromAddress = collectionUsers
    .aggregate([
        { $match: { walletAddress: data.fromAddress } },
        { $project: { _id: 1, telegramId: 1, walletAddress: 1 } }
    ])
    */
    const userFromAddress = await collectionUsers.findOne(
        { walletAddress: data.fromAddress },
        { projection: { telegramId: 1, walletAddress: 1 } }
    )

    if (userFromAddress && userFromAddress.walletAddress) {
        
        await collectionUserTransfers.insertOne(
        {
            user: userFromAddress,
            sendOrReceive: "send",
            transferData: transferData,
        }
        );


    }



    const userToAddress = await collectionUsers.findOne(
        { walletAddress: data.toAddress },
        { projection: { telegramId: 1, walletAddress: 1, center: 1 } }
    )

    if (userToAddress && userToAddress.walletAddress) {

        const response = await collectionUserTransfers.insertOne(
        {
            user: userToAddress,
            sendOrReceive: "receive",
            transferData: transferData,
        }
        );


        /*
        if (response) {

            const telegramId = userToAddress.telegramId;
            const center = userToAddress.center;

            if (telegramId) {

                const amount = parseFloat(data.value) / 1000000.0;

                ///const message = "You have received " + Number(amount).toFixed(6) + " USDT";
                const message = Number(amount).toFixed(6) + " USDT 를 받았습니다";

                const collectionTelegramMessages = client.db('ultraman').collection('telegramMessages');

                await collectionTelegramMessages.insertOne(
                {
                    center: center,
                    category: "wallet",
                    telegramId: telegramId,
                    message: message,
                    timestamp: data.timestamp,
                }
                );

            }

        }
        */

        
    }




    return {
        result: "success",
    };


}




// getTransferByWalletAddress
export async function getTransferByWalletAddress(data: any) {

    if (!data.walletAddress) {
        return null;
    }


    const client = await clientPromise;

    const collectionUsers = client.db('ultraman').collection('users');

    
    const user = await collectionUsers.findOne(
        { walletAddress: data.walletAddress },
        { projection: { walletAddress: 1 } }
    );


    if (!user) {
        return null;
    }

    // transferData: { transactionHash: string, transactionIndex: string, fromAddress: string, toAddress: string, value: string, timestamp: string }
    // timestamp desc
    

    const collectionUserTransfers = client.db('ultraman').collection('userTransfers');

    const userTransfers = await collectionUserTransfers
    .find({ "user.walletAddress": data.walletAddress })
    .sort({ "transferData.timestamp": -1 })
    .limit(5)
    .toArray();

    // totalTransfers
    const totalTransfers = await collectionUserTransfers
    .find({ "user.walletAddress": data.walletAddress })
    .count();



    return {
        transfers: userTransfers,
        totalTransfers: totalTransfers,
    }

}

