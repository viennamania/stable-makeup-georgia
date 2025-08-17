import { transfer } from 'thirdweb/extensions/erc20';
import clientPromise from '../mongodb';

import { dbName } from '../mongodb';

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


    const collectionUsers = client.db(dbName).collection('users');

    const collectionUserTransfers = client.db(dbName).collection('userTransfers');

    const collection = client.db(dbName).collection('transfers');


    

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

                const collectionTelegramMessages = client.db(dbName).collection('telegramMessages');

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


    /*
    {
        "_id": {
            "$oid": "689233b8f707d87be96596a5"
        },
        "user": {
            "walletAddress": "0xDEe1E6E4F4b6eE8b9b11458D100DB990082ac787"
        },
        "sendOrReceive": "send",
        "toUser": {
            "user_id": "0xec6530e3cd76211F4b5114231F3f98AEA3F98Fe6",
            "nickname": "hithere",
            "profile_url": "/icon-default-avatar.png",
            "require_auth_for_profile_image": false,
            "metadata": {
            "font_color": "black",
            "font_preference": "times new roman"
            },
            "access_token": "9628432993e7c8278d54d28b7cafffb037f66010",
            "created_at": 1752825794,
            "discovery_keys": [],
            "is_hide_me_from_friends": false,
            "is_shadow_blocked": false,
            "session_tokens": [],
            "is_online": false,
            "last_seen_at": -1,
            "is_active": true,
            "has_ever_logged_in": false,
            "preferred_languages": [],
            "locale": "",
            "unread_channel_count": 0,
            "unread_message_count": 0
        },
        "transferData": {
            "transactionHash": "0x4660caf732c097fc933a6373ad86ff4bc9229226232b50b87768eea60df3deb7",
            "transactionIndex": 57,
            "fromAddress": "0xDEe1E6E4F4b6eE8b9b11458D100DB990082ac787",
            "toAddress": "0xec6530e3cd76211F4b5114231F3f98AEA3F98Fe6",
            "value": "1200000000000000000000",
            "timestamp": 1754411957000
        }
        }
    */

    const collectionUserTransfers = client.db('damoa').collection('userTransfers');

    const userTransfers = await collectionUserTransfers
    .find({ "user.walletAddress": data.walletAddress })
    .sort({ "transferData.timestamp": -1 })
    .toArray();

    // totalTransfers
    const totalCount = await collectionUserTransfers.countDocuments({ "user.walletAddress": data.walletAddress });


    return {
        transfers: userTransfers,
        totalCount: totalCount,
    }

}




