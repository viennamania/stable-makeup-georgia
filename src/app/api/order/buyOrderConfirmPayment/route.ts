import { NextResponse, type NextRequest } from "next/server";

import {
  UserProps,
	buyOrderConfirmPayment,
  buyOrderGetOrderById,
} from '@lib/api/order';


import {
  getOneByWalletAddress 
} from '@lib/api/user';

// Download the helper library from https://www.twilio.com/docs/node/install
import twilio from "twilio";




import {
  createThirdwebClient,
  eth_getTransactionByHash,
  getContract,
  sendAndConfirmTransaction,
  
  sendTransaction,
  sendBatchTransaction,
  eth_maxPriorityFeePerGas,


} from "thirdweb";

//import { polygonAmoy } from "thirdweb/chains";
import {
  polygon,
  arbitrum,
 } from "thirdweb/chains";

import {
  privateKeyToAccount,
  smartWallet,
  getWalletBalance,
  
 } from "thirdweb/wallets";


import {
  mintTo,
  totalSupply,
  transfer,
  
  getBalance,

  balanceOf,

} from "thirdweb/extensions/erc20";




// USDT Token (USDT)
const tokenContractAddressUSDT = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

const contractAddressArbitrum = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"; // USDT on Arbitrum






export async function POST(request: NextRequest) {

  console.log("buyOrderConfirmPayment==================");


  const body = await request.json();

  const { lang, storecode, orderId, paymentAmount, isSmartAccount } = body;

  console.log("lang", lang);
  console.log("storecode", storecode);

  console.log("orderId", orderId);

  console.log("paymentAmount", paymentAmount);






  
  try {



    // get buyer wallet address


    const order = await buyOrderGetOrderById( orderId );

    if (!order) {
      return NextResponse.json({
        result: null,
      });
    }
    

    const {
      seller: seller,
      walletAddress: walletAddress,
      usdtAmount: usdtAmount,
      buyer: buyer,
    } = order as UserProps;



    const sellerWalletAddress = seller.walletAddress;

    if (!sellerWalletAddress) {
      return NextResponse.json({
        result: null,
      });
    }

    const user = await getOneByWalletAddress(
      storecode,
      sellerWalletAddress
    );

    ///console.log("user", user);

    if (!user) {
      return NextResponse.json({
        result: null,
      });
    }


    const escrowWalletAddress = user.escrowWalletAddress;


    const toAddressStore = walletAddress;
  

    //console.log("toAddressStore", toAddressStore);

    const sendAmountToStore = usdtAmount;

    //console.log("sendAmountToStore", sendAmountToStore);




    let transactionHashResult = "";
    let queueId = null;



    if (isSmartAccount) {

      const escrowWalletPrivateKey = user.escrowWalletPrivateKey;

      if (!escrowWalletPrivateKey) {
        return NextResponse.json({
          result: null,
        });
      }


      const client = createThirdwebClient({
        secretKey: process.env.THIRDWEB_SECRET_KEY || "",
      });

      if (!client) {
        return NextResponse.json({
          result: null,
        });
      }


      const personalAccount = privateKeyToAccount({
        client,
        privateKey: escrowWalletPrivateKey,
      });
    
      if (!personalAccount) {
        return NextResponse.json({
          result: null,
        });
      }


      const wallet = smartWallet({

        chain: arbitrum,

        ///factoryAddress: "0x655934C0B4bD79f52A2f7e6E60714175D5dd319b", // your own deployed account factory address
        sponsorGas: true,
      });

      // Connect the smart wallet
      const account = await wallet.connect({
        client: client,
        personalAccount: personalAccount,
      });

      if (!account) {
        return NextResponse.json({
          result: null,
        });
      }


      //const escrowWalletAddress = account.address;



      const contract = getContract({
        client,
        chain: arbitrum,
        address: tokenContractAddressUSDT, // erc20 contract from thirdweb.com/explore
      });

      const transactionSendToStore = transfer({
        contract,
        to: toAddressStore,
        amount: sendAmountToStore,
      });


      const { transactionHash } = await sendTransaction({
        account: account,
        transaction: transactionSendToStore,
      });

      //console.log("transactionHash", transactionHash);

      transactionHashResult = transactionHash;


    
    } else {

      console.log("isSmartAccount is false, toAddressStore", toAddressStore);




      transactionHashResult = "0x";


    }








    
    console.log("Sent successfully!");

    //console.log(`Transaction hash: ${sendDataStore.transactionHash}`);
  

    const result = await buyOrderConfirmPayment({
      lang: lang,
      storecode: storecode,
      orderId: orderId,
      paymentAmount: paymentAmount,
      
      queueId: queueId,

      transactionHash: transactionHashResult,

    });
  
  
    //console.log("result", JSON.stringify(result));
  
    /*
    const {
      nickname: nickname,
      tradeId: tradeId,
    } = result as UserProps;
  
  
  
  
    const amount = usdtAmount;
    */
  
  
      // send sms
    /*

    if (!buyer?.mobile) {
      return NextResponse.json({
        result,
      });
    }


    // check buyer.mobile is prefixed with +
    if (!buyer?.mobile.startsWith("+")) {
      return NextResponse.json({
        result,
      });
    }



    const to = buyer.mobile;


    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);



    let message = null;


    try {

      const msgBody = `[GTETHER] TID[${tradeId}] You received ${amount} USDT from ${nickname}! https://gold.goodtether.com/${lang}/${chain}/sell-usdt/${orderId}`;
  
      message = await client.messages.create({
        ///body: "This is the ship that made the Kessel Run in fourteen parsecs?",
        body: msgBody,
        from: "+17622254217",
        to: to,
      });
  
      console.log(message.sid);

    } catch (error) {
        
      console.log("error", error);
  
    }

    */
  
  
  
    
    return NextResponse.json({
  
      result,
      
    });









  } catch (error) {
      
    console.log(" error=====>" + error);



  }

  


 
  return NextResponse.json({

    result: null,
    
  });
  
}
