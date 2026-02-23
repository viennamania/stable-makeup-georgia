import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { createThirdwebClient, Engine, getContract } from "thirdweb";
import { transfer } from "thirdweb/extensions/erc20";
import { ethereum, polygon, arbitrum, bsc } from "thirdweb/chains";
import clientPromise from "@/lib/mongodb";
import { dbName } from "@/lib/mongodb";
import {
  chain as configuredChain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,
} from "@/app/config/contractAddresses";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

type QueueCheckStatus =
  | "updated"
  | "requeued"
  | "already-has-hash"
  | "pending"
  | "failed"
  | "not-found"
  | "invalid";

type QueueCheckResultItem = {
  orderId: string;
  tradeId?: string;
  storecode?: string;
  queueId?: string;
  retryTransactionId?: string;
  status: QueueCheckStatus;
  success: boolean;
  updated: boolean;
  transactionHash?: string;
  engineStatus?: string;
  onchainStatus?: string;
  message: string;
};

const isValidTransactionHash = (value: unknown) => {
  if (typeof value !== "string") {
    return false;
  }
  const normalized = value.trim();
  return normalized.startsWith("0x") && normalized.length > 2;
};

const normalizeOrderIds = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as string[];
  }
  const unique = new Set<string>();
  for (const raw of value) {
    const normalized = String(raw || "").trim();
    if (!normalized) {
      continue;
    }
    unique.add(normalized);
  }
  return Array.from(unique);
};

const normalizeBoolean = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return false;
};

const isValidWalletAddress = (value: unknown) => {
  if (typeof value !== "string") {
    return false;
  }
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
};

const getRuntimeChainConfig = () => {
  const chain = String(configuredChain || "arbitrum")
    .trim()
    .toLowerCase();

  if (chain === "ethereum") {
    return {
      chain,
      thirdwebChain: ethereum,
      usdtAddress: ethereumContractAddressUSDT,
    };
  }
  if (chain === "polygon") {
    return {
      chain,
      thirdwebChain: polygon,
      usdtAddress: polygonContractAddressUSDT,
    };
  }
  if (chain === "bsc") {
    return {
      chain,
      thirdwebChain: bsc,
      usdtAddress: bscContractAddressUSDT,
    };
  }
  return {
    chain: "arbitrum",
    thirdwebChain: arbitrum,
    usdtAddress: arbitrumContractAddressUSDT,
  };
};

const createRetryWallet = ({
  thirdwebClient,
  vaultAccessToken,
  fromWalletAddress,
  serverWalletAccounts,
  chainConfig,
}: {
  thirdwebClient: ReturnType<typeof createThirdwebClient>;
  vaultAccessToken: string;
  fromWalletAddress: string;
  serverWalletAccounts: Array<{
    address?: string;
    smartAccountAddress?: string;
  }>;
  chainConfig: ReturnType<typeof getRuntimeChainConfig>;
}) => {
  const normalizedFrom = fromWalletAddress.toLowerCase();

  const matchedWallet = serverWalletAccounts.find((account) => {
    const eoa = String(account?.address || "")
      .trim()
      .toLowerCase();
    const smart = String(account?.smartAccountAddress || "")
      .trim()
      .toLowerCase();
    return normalizedFrom === eoa || normalizedFrom === smart;
  });

  if (!matchedWallet || !matchedWallet.address) {
    return {
      wallet: null,
      message: "sender wallet is not registered in Thirdweb Vault",
    };
  }

  const signerAddress = String(matchedWallet.address || "").trim();
  const smartAccountAddress = String(matchedWallet.smartAccountAddress || "").trim();
  const normalizedSignerAddress = signerAddress.toLowerCase();

  if (smartAccountAddress && normalizedFrom === smartAccountAddress.toLowerCase()) {
    return {
      wallet: Engine.serverWallet({
        client: thirdwebClient,
        vaultAccessToken,
        address: smartAccountAddress,
        chain: chainConfig.thirdwebChain,
        executionOptions: {
          type: "ERC4337",
          signerAddress,
          smartAccountAddress,
          entrypointVersion: "0.7",
        },
      }),
      message: "",
    };
  }

  if (normalizedFrom === normalizedSignerAddress) {
    return {
      wallet: Engine.serverWallet({
        client: thirdwebClient,
        vaultAccessToken,
        address: signerAddress,
        chain: chainConfig.thirdwebChain,
      }),
      message: "",
    };
  }

  if (smartAccountAddress) {
    return {
      wallet: Engine.serverWallet({
        client: thirdwebClient,
        vaultAccessToken,
        address: smartAccountAddress,
        chain: chainConfig.thirdwebChain,
        executionOptions: {
          type: "ERC4337",
          signerAddress,
          smartAccountAddress,
          entrypointVersion: "0.7",
        },
      }),
      message: "",
    };
  }

  return {
    wallet: null,
    message: "smart wallet address is missing in Thirdweb Vault",
  };
};

const tryRequeueFailedOrder = async ({
  collection,
  target,
  previousQueueId,
  thirdwebClient,
  serverWalletAccounts,
  vaultAccessToken,
  chainConfig,
}: {
  collection: any;
  target: any;
  previousQueueId: string;
  thirdwebClient: ReturnType<typeof createThirdwebClient>;
  serverWalletAccounts: Array<{
    address?: string;
    smartAccountAddress?: string;
  }>;
  vaultAccessToken: string;
  chainConfig: ReturnType<typeof getRuntimeChainConfig>;
}) => {
  const senderWalletAddress = String(target?.seller?.walletAddress || "").trim();
  const receiverWalletAddress = String(
    target?.walletAddress || target?.buyer?.walletAddress || ""
  ).trim();
  const usdtAmount = Number(target?.usdtAmount || 0);

  if (!isValidWalletAddress(senderWalletAddress)) {
    return {
      success: false,
      message: "invalid seller walletAddress for retry",
    };
  }

  if (!isValidWalletAddress(receiverWalletAddress)) {
    return {
      success: false,
      message: "invalid receiver walletAddress for retry",
    };
  }

  if (!Number.isFinite(usdtAmount) || usdtAmount <= 0) {
    return {
      success: false,
      message: "invalid usdtAmount for retry",
    };
  }

  const retryWalletResult = createRetryWallet({
    thirdwebClient,
    vaultAccessToken,
    fromWalletAddress: senderWalletAddress,
    serverWalletAccounts,
    chainConfig,
  });

  if (!retryWalletResult.wallet) {
    return {
      success: false,
      message: retryWalletResult.message || "failed to create retry wallet",
    };
  }

  const usdtContract = getContract({
    client: thirdwebClient,
    chain: chainConfig.thirdwebChain,
    address: chainConfig.usdtAddress,
  });

  const transferTx = transfer({
    contract: usdtContract,
    to: receiverWalletAddress,
    amount: String(usdtAmount),
  });

  const enqueueResult = await retryWalletResult.wallet.enqueueTransaction({
    transaction: transferTx,
  });
  const nextQueueId = String(enqueueResult?.transactionId || "").trim();

  if (!nextQueueId) {
    return {
      success: false,
      message: "requeue failed: transactionId was not returned",
    };
  }

  const nowIso = new Date().toISOString();
  const updateResult = await collection.updateOne(
    {
      _id: target._id,
      transactionHash: "0x",
    },
    {
      $set: {
        queueId: nextQueueId,
        queueUpdatedAt: nowIso,
        queueCheckedAt: nowIso,
        queueRetriedAt: nowIso,
        previousQueueId,
      },
      $inc: {
        queueRetryCount: 1,
      },
    }
  );

  return {
    success: updateResult.modifiedCount > 0,
    updated: updateResult.modifiedCount > 0,
    queueId: nextQueueId,
    message:
      updateResult.modifiedCount > 0
        ? "failed queue was re-submitted"
        : "queue re-submitted but order was not updated",
  };
};

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch (error) {
    body = {};
  }

  const orderIds = normalizeOrderIds(body?.orderIds).slice(0, 200);
  const storecode = String(body?.storecode || "").trim();
  const retryFailed = normalizeBoolean(body?.retryFailed);

  if (orderIds.length === 0 && !storecode) {
    return NextResponse.json(
      {
        error: "orderIds or storecode is required",
      },
      {
        status: 400,
      }
    );
  }

  const secretKey = String(process.env.THIRDWEB_SECRET_KEY || "").trim();
  if (!secretKey) {
    return NextResponse.json(
      {
        error: "THIRDWEB_SECRET_KEY is missing",
      },
      {
        status: 500,
      }
    );
  }

  try {
    const objectIds = orderIds
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    if (orderIds.length > 0 && objectIds.length === 0) {
      return NextResponse.json(
        {
          error: "No valid orderIds",
        },
        {
          status: 400,
        }
      );
    }

    const client = await clientPromise;
    const collection = client.db(dbName).collection("buyorders");

    const matchQuery: Record<string, any> = {
      transactionHash: "0x",
      queueId: { $exists: true, $nin: [null, ""] },
    };

    if (objectIds.length > 0) {
      matchQuery._id = { $in: objectIds };
    }

    if (storecode) {
      matchQuery.storecode = storecode;
    }

    const targets = await collection
      .find(matchQuery, {
        projection: {
          _id: 1,
          tradeId: 1,
          storecode: 1,
          queueId: 1,
          transactionHash: 1,
          walletAddress: 1,
          usdtAmount: 1,
          seller: 1,
          buyer: 1,
        },
      })
      .toArray();

    const thirdwebClient = createThirdwebClient({
      secretKey,
    });
    const chainConfig = getRuntimeChainConfig();
    const vaultAccessToken = String(process.env.THIRDWEB_VAULT_ACCESS_TOKEN || "").trim();
    let serverWalletAccounts: Array<{ address?: string; smartAccountAddress?: string }> = [];
    let hasLoadedServerWallets = false;
    let retryPrepareError = "";

    const ensureServerWalletAccounts = async () => {
      if (!retryFailed || hasLoadedServerWallets || retryPrepareError) {
        return;
      }
      hasLoadedServerWallets = true;
      if (!vaultAccessToken) {
        retryPrepareError = "retry skipped: THIRDWEB_VAULT_ACCESS_TOKEN is missing";
        return;
      }
      try {
        const serverWalletResult = await Engine.getServerWallets({
          client: thirdwebClient,
          limit: 500,
          page: 1,
        });
        serverWalletAccounts = Array.isArray(serverWalletResult?.accounts)
          ? serverWalletResult.accounts
          : [];
      } catch (error) {
        retryPrepareError =
          error instanceof Error && error.message
            ? `retry skipped: ${error.message}`
            : "retry skipped: failed to load server wallet list";
      }
    };

    const results: QueueCheckResultItem[] = [];

    for (const target of targets) {
      const orderId = String(target._id);
      const queueId = String(target.queueId || "").trim();
      const tradeId = String(target.tradeId || "");
      const orderStorecode = String(target.storecode || "");

      if (!queueId) {
        results.push({
          orderId,
          tradeId,
          storecode: orderStorecode,
          status: "invalid",
          success: false,
          updated: false,
          message: "queueId is missing",
        });
        continue;
      }

      try {
        const txStatus = await Engine.getTransactionStatus({
          client: thirdwebClient,
          transactionId: queueId,
        });

        const engineStatus = String(txStatus?.status || "");
        const onchainStatus =
          "onchainStatus" in txStatus && txStatus.onchainStatus
            ? String(txStatus.onchainStatus)
            : "";
        const transactionHash =
          "transactionHash" in txStatus && txStatus.transactionHash
            ? String(txStatus.transactionHash)
            : "";

        if (engineStatus === "CONFIRMED" && onchainStatus !== "REVERTED") {
          if (isValidTransactionHash(transactionHash)) {
            const updateResult = await collection.updateOne(
              {
                _id: target._id,
                queueId,
              },
              {
                $set: {
                  transactionHash,
                  minedAt: txStatus.confirmedAt || new Date().toISOString(),
                  queueCheckedAt: new Date().toISOString(),
                },
              }
            );

            results.push({
              orderId,
              tradeId,
              storecode: orderStorecode,
              queueId,
              status: "updated",
              success: true,
              updated: updateResult.modifiedCount > 0,
              transactionHash,
              engineStatus,
              onchainStatus,
              message:
                updateResult.modifiedCount > 0
                  ? "transactionHash updated"
                  : "transactionHash already synchronized",
            });
          } else {
            results.push({
              orderId,
              tradeId,
              storecode: orderStorecode,
              queueId,
              status: "pending",
              success: false,
              updated: false,
              engineStatus,
              onchainStatus,
              message: "confirmed but transactionHash is not available yet",
            });
          }

          continue;
        }

        if (engineStatus === "FAILED" || onchainStatus === "REVERTED") {
          const failedReason =
            "error" in txStatus && txStatus.error
              ? String(txStatus.error)
              : "transaction execution failed";

          await ensureServerWalletAccounts();

          if (retryFailed && !retryPrepareError) {
            try {
              const retryResult = await tryRequeueFailedOrder({
                collection,
                target,
                previousQueueId: queueId,
                thirdwebClient,
                serverWalletAccounts,
                vaultAccessToken,
                chainConfig,
              });

              if (retryResult.success) {
                results.push({
                  orderId,
                  tradeId,
                  storecode: orderStorecode,
                  queueId: retryResult.queueId || queueId,
                  retryTransactionId: retryResult.queueId,
                  status: "requeued",
                  success: true,
                  updated: Boolean(retryResult.updated),
                  engineStatus,
                  onchainStatus,
                  message:
                    retryResult.message ||
                    "failed queue was re-submitted to Thirdweb",
                });
                continue;
              }

              results.push({
                orderId,
                tradeId,
                storecode: orderStorecode,
                queueId,
                status: "failed",
                success: false,
                updated: false,
                engineStatus,
                onchainStatus,
                message: `${failedReason} / retry failed: ${retryResult.message || "unknown error"}`,
              });
              continue;
            } catch (error) {
              const retryError =
                error instanceof Error ? error.message : String(error);
              results.push({
                orderId,
                tradeId,
                storecode: orderStorecode,
                queueId,
                status: "failed",
                success: false,
                updated: false,
                engineStatus,
                onchainStatus,
                message: `${failedReason} / retry failed: ${retryError}`,
              });
              continue;
            }
          }

          results.push({
            orderId,
            tradeId,
            storecode: orderStorecode,
            queueId,
            status: "failed",
            success: false,
            updated: false,
            engineStatus,
            onchainStatus,
            message: retryPrepareError
              ? `${failedReason} / ${retryPrepareError}`
              : failedReason,
          });
          continue;
        }

        results.push({
          orderId,
          tradeId,
          storecode: orderStorecode,
          queueId,
          status: "pending",
          success: false,
          updated: false,
          engineStatus,
          onchainStatus,
          message: `transaction is ${engineStatus || "PENDING"}`,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const notFound = errorMessage.toLowerCase().includes("not found");

        results.push({
          orderId,
          tradeId,
          storecode: orderStorecode,
          queueId,
          status: notFound ? "not-found" : "failed",
          success: false,
          updated: false,
          message: errorMessage,
        });
      }
    }

    const updatedCount = results.filter((item) => item.status === "updated" && item.updated).length;
    const requeuedCount = results.filter((item) => item.status === "requeued" && item.updated).length;
    const successCount = results.filter((item) => item.success).length;
    const failedCount = results.filter(
      (item) => item.status === "failed" || item.status === "not-found" || item.status === "invalid"
    ).length;
    const pendingCount = results.filter((item) => item.status === "pending").length;

    return NextResponse.json({
      result: {
        summary: {
          requestedOrderCount: orderIds.length || undefined,
          matchedOrderCount: targets.length,
          checkedCount: results.length,
          successCount,
          updatedCount,
          requeuedCount,
          failedCount,
          pendingCount,
          checkedAt: new Date().toISOString(),
        },
        results,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to check queue transaction status",
        message: errorMessage,
      },
      {
        status: 500,
      }
    );
  }
}
