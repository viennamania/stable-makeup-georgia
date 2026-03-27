import clientPromise, { dbName } from "../mongodb";

import type { ClientExchangeRateMap } from "@/lib/client-settings";

const getClientCollection = async () => {
  const client = await clientPromise;
  return client.db(dbName).collection("clients");
};

const updateClientFields = async (
  clientId: string,
  fields: Record<string, unknown>,
  upsert = false,
) => {
  const collection = await getClientCollection();

  return collection.updateOne(
    { clientId },
    { $set: fields },
    { upsert },
  );
};

export async function getOne(clientId: string) {
  const collection = await getClientCollection();
  return collection.findOne({ clientId });
}

export async function updateClientProfile(
  clientId: string,
  data: {
    name: string;
    description: string;
  },
) {
  return updateClientFields(
    clientId,
    {
      name: data.name,
      description: data.description,
    },
    true,
  );
}

export async function updateClientExchangeRateBuy(
  clientId: string,
  exchangeRateUSDT: ClientExchangeRateMap,
) {
  return updateClientFields(
    clientId,
    {
      exchangeRateUSDT,
    },
    true,
  );
}

export async function updateClientExchangeRateSell(
  clientId: string,
  exchangeRateUSDTSell: ClientExchangeRateMap,
) {
  return updateClientFields(
    clientId,
    {
      exchangeRateUSDTSell,
    },
    true,
  );
}

export async function updateAvatar(clientId: string, avatar: string) {
  return updateClientFields(
    clientId,
    {
      avatar,
    },
    false,
  );
}

export async function updatePayactionViewOn(clientId: string, payactionViewOn: boolean) {
  return updateClientFields(
    clientId,
    {
      payactionViewOn,
    },
    false,
  );
}
