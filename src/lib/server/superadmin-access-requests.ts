import { ObjectId } from "mongodb";

import clientPromise, { dbName } from "@/lib/mongodb";
import { sanitizeUserForResponse } from "@/lib/server/user-read-security";

const SUPERADMIN_ACCESS_REQUEST_COLLECTION = "superadminAccessRequests";
const SUPERADMIN_ACCESS_REQUEST_PENDING_UNIQ_INDEX =
  "uniq_superadmin_access_request_pending_wallet";
const SUPERADMIN_ACCESS_REQUEST_STATUS_CREATED_INDEX =
  "idx_superadmin_access_request_status_created_at";
const SUPERADMIN_ACCESS_REQUEST_CREATED_INDEX =
  "idx_superadmin_access_request_created_at";

const globalSuperadminAccessRequests = globalThis as typeof globalThis & {
  __superadminAccessRequestIndexesReady?: boolean;
};

type CreateSuperadminAccessRequestParams = {
  requesterUser: any;
  requesterWalletAddress: string;
  note?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  requestRoute?: string | null;
};

type ApproveSuperadminAccessRequestParams = {
  requestId: string;
  approverUser: any;
  approverWalletAddress: string;
};

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeWalletLower = (value: unknown) => normalizeString(value).toLowerCase();

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildWalletRegex = (walletAddress: string) => {
  return new RegExp(`^${escapeRegex(normalizeString(walletAddress))}$`, "i");
};

const toRequestId = (value: unknown) => {
  const text = normalizeString(value);
  if (!ObjectId.isValid(text)) {
    return null;
  }
  return new ObjectId(text);
};

const mapAccessRequestForResponse = (value: any) => ({
  id: String(value?._id || ""),
  status: normalizeString(value?.status) || "pending",
  requestedRole: normalizeString(value?.requestedRole) || "superadmin",
  requesterWalletAddress: normalizeString(value?.requesterWalletAddress).toLowerCase(),
  requesterUserId: value?.requesterUserId ? String(value.requesterUserId) : null,
  requesterStorecode: normalizeString(value?.requesterStorecode) || null,
  requesterNickname: normalizeString(value?.requesterNickname) || null,
  requesterEmail: normalizeString(value?.requesterEmail) || null,
  note: normalizeString(value?.note) || "",
  requestRoute: normalizeString(value?.requestRoute) || null,
  requestIp: normalizeString(value?.requestIp) || null,
  createdAt: normalizeString(value?.createdAt) || null,
  updatedAt: normalizeString(value?.updatedAt) || null,
  approvedAt: normalizeString(value?.approvedAt) || null,
  approvedByWalletAddress: normalizeString(value?.approvedByWalletAddress).toLowerCase() || null,
  approvedByNickname: normalizeString(value?.approvedByNickname) || null,
  approvedByStorecode: normalizeString(value?.approvedByStorecode) || null,
  approvedRoleScope: normalizeString(value?.approvedRoleScope) || null,
  requesterUser: value?.requesterUser ? sanitizeUserForResponse(value.requesterUser) : null,
});

const ensureSuperadminAccessRequestIndexes = async () => {
  if (globalSuperadminAccessRequests.__superadminAccessRequestIndexesReady) {
    return;
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection(SUPERADMIN_ACCESS_REQUEST_COLLECTION);

  await collection.createIndex(
    { requesterWalletAddressLower: 1, status: 1 },
    {
      unique: true,
      name: SUPERADMIN_ACCESS_REQUEST_PENDING_UNIQ_INDEX,
      partialFilterExpression: { status: "pending" },
    },
  );
  await collection.createIndex(
    { status: 1, createdAt: -1 },
    { name: SUPERADMIN_ACCESS_REQUEST_STATUS_CREATED_INDEX },
  );
  await collection.createIndex(
    { createdAt: -1 },
    { name: SUPERADMIN_ACCESS_REQUEST_CREATED_INDEX },
  );

  globalSuperadminAccessRequests.__superadminAccessRequestIndexesReady = true;
};

export const createSuperadminAccessRequest = async ({
  requesterUser,
  requesterWalletAddress,
  note,
  ip,
  userAgent,
  requestRoute,
}: CreateSuperadminAccessRequestParams) => {
  const normalizedWalletAddress = normalizeString(requesterWalletAddress);
  const normalizedWalletLower = normalizeWalletLower(normalizedWalletAddress);
  if (!normalizedWalletLower) {
    throw new Error("요청 지갑 주소를 확인할 수 없습니다.");
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection(SUPERADMIN_ACCESS_REQUEST_COLLECTION);
  await ensureSuperadminAccessRequestIndexes();

  const existing = await collection.findOne({
    requesterWalletAddressLower: normalizedWalletLower,
    status: "pending",
  });

  if (existing) {
    return {
      duplicate: true,
      request: mapAccessRequestForResponse(existing),
    };
  }

  const nowIso = new Date().toISOString();
  const document = {
    requestedRole: "superadmin",
    status: "pending",
    requesterWalletAddress: normalizedWalletAddress,
    requesterWalletAddressLower: normalizedWalletLower,
    requesterUserId: requesterUser?._id || null,
    requesterStorecode: normalizeString(requesterUser?.storecode) || null,
    requesterNickname: normalizeString(requesterUser?.nickname) || null,
    requesterEmail: normalizeString(requesterUser?.email) || null,
    requesterUser: requesterUser || null,
    note: normalizeString(note) || "",
    requestRoute: normalizeString(requestRoute) || null,
    requestIp: normalizeString(ip) || null,
    requestUserAgent: normalizeString(userAgent) || null,
    createdAt: nowIso,
    updatedAt: nowIso,
    approvedAt: null,
    approvedByWalletAddress: null,
    approvedByNickname: null,
    approvedByStorecode: null,
    approvedRoleScope: null,
  };

  const result = await collection.insertOne(document);
  const inserted = await collection.findOne({ _id: result.insertedId });

  return {
    duplicate: false,
    request: mapAccessRequestForResponse(inserted || { ...document, _id: result.insertedId }),
  };
};

export const getSuperadminAccessRequestOverview = async () => {
  const client = await clientPromise;
  const collection = client.db(dbName).collection(SUPERADMIN_ACCESS_REQUEST_COLLECTION);
  await ensureSuperadminAccessRequestIndexes();

  const [pending, recent] = await Promise.all([
    collection
      .find({ status: "pending" })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray(),
    collection
      .find({ status: { $ne: "pending" } })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(40)
      .toArray(),
  ]);

  return {
    pending: pending.map(mapAccessRequestForResponse),
    recent: recent.map(mapAccessRequestForResponse),
    generatedAt: new Date().toISOString(),
  };
};

export const approveSuperadminAccessRequest = async ({
  requestId,
  approverUser,
  approverWalletAddress,
}: ApproveSuperadminAccessRequestParams) => {
  const objectId = toRequestId(requestId);
  if (!objectId) {
    throw new Error("권한 요청 ID가 올바르지 않습니다.");
  }

  const client = await clientPromise;
  const database = client.db(dbName);
  const requestCollection = database.collection(SUPERADMIN_ACCESS_REQUEST_COLLECTION);
  const usersCollection = database.collection("users");
  await ensureSuperadminAccessRequestIndexes();

  const request = await requestCollection.findOne({
    _id: objectId,
    status: "pending",
  });

  if (!request) {
    throw new Error("승인 대기 중인 권한 요청을 찾지 못했습니다.");
  }

  const requesterWalletAddress = normalizeString(request?.requesterWalletAddress);
  const walletRegex = buildWalletRegex(requesterWalletAddress);
  const nowIso = new Date().toISOString();

  let roleScope = "admin";
  let updateResult = await usersCollection.updateMany(
    {
      walletAddress: walletRegex,
      storecode: /^admin$/i,
    },
    {
      $set: {
        role: "superadmin",
        updatedAt: nowIso,
      },
    },
  );

  if (!updateResult.matchedCount) {
    roleScope = "wallet";
    updateResult = await usersCollection.updateMany(
      {
        walletAddress: walletRegex,
      },
      {
        $set: {
          role: "superadmin",
          updatedAt: nowIso,
        },
      },
    );
  }

  if (!updateResult.matchedCount) {
    throw new Error("요청 지갑에 연결된 회원 정보를 찾지 못했습니다.");
  }

  await requestCollection.updateOne(
    { _id: objectId },
    {
      $set: {
        status: "approved",
        updatedAt: nowIso,
        approvedAt: nowIso,
        approvedByWalletAddress: normalizeWalletLower(approverWalletAddress),
        approvedByNickname: normalizeString(approverUser?.nickname) || null,
        approvedByStorecode: normalizeString(approverUser?.storecode) || null,
        approvedRoleScope: roleScope,
      },
    },
  );

  const updated = await requestCollection.findOne({ _id: objectId });

  return {
    request: mapAccessRequestForResponse(updated || request),
  };
};
