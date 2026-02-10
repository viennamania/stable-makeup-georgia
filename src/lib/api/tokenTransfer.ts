import clientPromise from '../mongodb';

import { dbName } from '../mongodb';


export interface TransactionHashLog {
  chain?: string;
  transactionHash: string;
  from?: string;
  to?: string;
  amount?: number;
  createdAt?: string | Date;
}


// fetch latest transaction hash logs
export async function getLatestTransactionHashLogs(limit = 10): Promise<TransactionHashLog[]> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('transactionHashLogs');


  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 100));


  const logs = await collection
    .find<TransactionHashLog>({})
    .sort({ createdAt: -1, _id: -1 })
    .limit(safeLimit)
    .toArray();


  return logs;

}

