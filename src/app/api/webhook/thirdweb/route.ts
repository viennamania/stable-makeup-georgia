import { NextResponse, type NextRequest } from "next/server";

import {
  OrderProps,
	acceptBuyOrder,
  updateBuyOrderByQueueId,

  getBuyOrderByEscrowWalletAddress,

  updateBuyOrderEscrowBalance,

} from '@lib/api/order';


import {
  insertOne,
} from '@lib/api/transfer';


import {
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,

  bscContractAddressMKRW,
} from "../../../config/contractAddresses";


export async function POST(request: NextRequest) {

  const body = await request.json();


  /*
  const {
    queueId,
    status,
    chainId,
    fromAddress,
    toAddress,
    data,
    value,
    nonce,
    deployedContractAddress,
    deployedContractType,
    functionName,
    functionArgs,
    extension,
    gasLimit,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
    transactionType,
    transactionHash,
    queuedAt,
    sentAt,
    minedAt,
    cancelledAt,
    errorMessage,
    sentAtBlockNumber,
    blockNumber,
    retryCount,
    onChainTxStatus,
    onchainStatus,
    effectiveGasPrice,
    cumulativeGasUsed,
    signerAddress,
    accountAddress,
    target,
    sender,
    initCode,
    callData,
    callGasLimit,
    verificationGasLimit,
    preVerificationGas,
    paymasterAndData,
    userOpHash,
    retryGasValues,
    retryMaxFeePerGas,
    retryMaxPriorityFeePerGas,
  } = body;
  */

  /*
  if (status === "mined") {


    const result = await updateBuyOrderByQueueId({
      queueId,
      transactionHash,
      minedAt,
    });

    console.log("updateBuyOrderByQueueId", result);

    if (result) {
      return NextResponse.json({
        result: "ok",
      });
    } else {
      return NextResponse.json({
        result: "error",
      });
    }


  }
  */

  const {
    data,
  } = body;

  console.log("data", data);

  /*
  data {
  chainId: 56,
  contractAddress: '0xeb0a5ea0001aa9f419bbaf8cedad265a60f0b10f',
  blockNumber: 56265858,
  transactionHash: '0x6f1c65f76b642bc63d889ca1229e2d564ce29fac7b472287274021dda36eac09',
  topics: [
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    '0x000000000000000000000000dee1e6e4f4b6ee8b9b11458d100db990082ac787',
    '0x000000000000000000000000dba19f3126eb135a0cea5766938a2d77ccf1db96'
  ],
  data: '0x0000000000000000000000000000000000000000000000000a0fb7a8a6288000',
  eventName: 'Transfer',
  decodedLog: {
    to: {
      type: 'address',
      value: '0xdBa19f3126eb135a0cEA5766938a2D77cCf1DB96'
    },
    from: {
      type: 'address',
      value: '0xDEe1E6E4F4b6eE8b9b11458D100DB990082ac787'
    },
    value: { type: 'uint256', value: '725000000000000000' }
  },
  timestamp: 1754197425000,
  transactionIndex: 96,
  logIndex: 723
}
  */




  const {
    chainId,
    contractAddress,
    blockNumber,
    transactionHash,
    topics,
    eventName,
    decodedLog,
    timestamp,
    transactionIndex,
    logIndex,
  } = data;


  



  const toAddress = decodedLog.to.value;
  const fromAddress = decodedLog.from.value;
  const value = decodedLog.value.value;

  const amount = value / 1e18; // Convert from wei to ether (assuming 18 decimals)



  if (contractAddress.toLowerCase() === bscContractAddressMKRW.toLowerCase()) {


    console.log("toAddress", toAddress);
    console.log("fromAddress", fromAddress);
    console.log("amount", amount);

    // get buy order by escrow wallet address
    const buyOrder = await getBuyOrderByEscrowWalletAddress({
      escrowWalletAddress: toAddress,
    });
    if (buyOrder) {
      //console.log("buyOrder", buyOrder);

      // update buy order escrow balance
      const result = await updateBuyOrderEscrowBalance({
        orderId: buyOrder._id,
        escrowBalance: amount,
        transactionHash: transactionHash,
      });

      console.log("updateBuyOrderEscrowBalance result", result);

      /*
      if (result) {
        return NextResponse.json({
          result: "ok",
        });
      } else {
        return NextResponse.json({
          result: "error",
        });
      }
      */

    } else {
      console.log("No buy order found for escrow wallet address", toAddress);
    }

  }

  /*
  const result = insertOne({
    transactionHash,
    transactionIndex,
    fromAddress,
    toAddress,
    value,
    timestamp,
  });

  console.log("insertOne", result);
  */
  

  return NextResponse.json({
    result: "ok",
  });









  return NextResponse.json({
    result: "ok",
  });

  

  /*
  Content-Type: application/json
  X-Engine-Signature: <payload signature>
  X-Engine-Timestamp: <Unix timestamp in seconds>
  */

  /*
body {
  queueId: '0215d127-7d9c-48ba-b5d6-c78f0bbecbeb',
  status: 'mined',
  chainId: '137',
  fromAddress: '0x865D4529EF3a262a7C63145C8906AeD9a1b522bD',
  toAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  data: '0xa9059cbb0000000000000000000000005202a5853c338a38485fa11eda67ca95cb9fce99000000000000000000000000000000000000000000000000000000000015d1f0',
  value: '0',
  nonce: 34,
  deployedContractAddress: null,
  deployedContractType: null,
  functionName: 'transfer',
  functionArgs: '["0x5202a5853c338A38485Fa11eda67ca95cb9fce99","1.43","0xc2132d05d31c914a87c6611c10748aeb04b58e8f"]',
  extension: 'erc20',
  gasLimit: '530000',
  gasPrice: null,
  maxFeePerGas: '61908001546',
  maxPriorityFeePerGas: '61908001454',
  transactionType: 2,
  transactionHash: '0xec8fb837702f845c64bfe2e69d28095f450457b4ac31491122729bb8113f1783',
  queuedAt: '2024-09-08T03:52:17.828Z',
  sentAt: '2024-09-08T03:52:52.212Z',
  minedAt: '2024-09-08T03:53:23.705Z',
  cancelledAt: null,
  errorMessage: null,
  sentAtBlockNumber: 61559147,
  blockNumber: 61559150,
  retryCount: 0,
  onChainTxStatus: 1,
  onchainStatus: 'success',
  effectiveGasPrice: '61908001478',
  cumulativeGasUsed: '2178297',
  signerAddress: '0x865D4529EF3a262a7C63145C8906AeD9a1b522bD',
  accountAddress: null,
  target: null,
  sender: null,
  initCode: null,
  callData: null,
  callGasLimit: null,
  verificationGasLimit: null,
  preVerificationGas: null,
  paymasterAndData: null,
  userOpHash: null,
  retryGasValues: null,
  retryMaxFeePerGas: null,
  retryMaxPriorityFeePerGas: null
}

  */


  ///console.log("body", body);


  
}
