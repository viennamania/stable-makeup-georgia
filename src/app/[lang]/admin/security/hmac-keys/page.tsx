"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useActiveAccount } from "thirdweb/react";

import { postAdminSignedJson } from "@/lib/client/admin-signed-action";

type HmacKeyItem = {
  keyId: string;
  secretPreview?: string;
  allowedRoutes?: string[];
  allowedStorecodes?: string[];
  description?: string | null;
  status?: "active" | "disabled" | "revoked";
  usageCount?: number;
  lastUsedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type DraftState = {
  status: "active" | "disabled" | "revoked";
  description: string;
  allowedStorecodesText: string;
  allowedRoutesText: string;
};

const ROUTE_GET_LIST = "/api/security/hmac-keys/getList";
const ROUTE_CREATE = "/api/security/hmac-keys/create";
const ROUTE_UPDATE = "/api/security/hmac-keys/update";
const ROUTE_ROTATE = "/api/security/hmac-keys/rotate";

const SIGNING_GET_LIST = "stable-georgia:hmac-keys:get-list:v1";
const SIGNING_CREATE = "stable-georgia:hmac-keys:create:v1";
const SIGNING_UPDATE = "stable-georgia:hmac-keys:update:v1";
const SIGNING_ROTATE = "stable-georgia:hmac-keys:rotate:v1";

const DEFAULT_ALLOWED_ROUTE = "/api/order/buyOrderSettlement";

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const parseCommaSeparated = (value: string) => {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const formatDateTime = (value: unknown) => {
  const text = normalizeString(value);
  if (!text) return "-";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
};

export default function HmacKeyManagementPage() {
  const activeAccount = useActiveAccount();

  const [keys, setKeys] = useState<HmacKeyItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [loading, setLoading] = useState(false);
  const [savingKeyId, setSavingKeyId] = useState("");
  const [rotatingKeyId, setRotatingKeyId] = useState("");
  const [creating, setCreating] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

  const [newKeyId, setNewKeyId] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAllowedStorecodesText, setNewAllowedStorecodesText] = useState("");
  const [newAllowedRoutesText, setNewAllowedRoutesText] = useState(DEFAULT_ALLOWED_ROUTE);

  const [revealedSecret, setRevealedSecret] = useState<{
    keyId: string;
    secret: string;
  } | null>(null);

  const syncDrafts = (items: HmacKeyItem[]) => {
    setDrafts((previous) => {
      const next = { ...previous };
      const seen = new Set<string>();

      for (const item of items) {
        const keyId = normalizeString(item.keyId);
        if (!keyId) continue;
        seen.add(keyId);

        if (!next[keyId]) {
          next[keyId] = {
            status: (item.status || "active") as DraftState["status"],
            description: normalizeString(item.description || ""),
            allowedStorecodesText: (item.allowedStorecodes || []).join(", "),
            allowedRoutesText: (item.allowedRoutes || []).join(", "),
          };
        }
      }

      for (const keyId of Object.keys(next)) {
        if (!seen.has(keyId)) {
          delete next[keyId];
        }
      }

      return next;
    });
  };

  const fetchKeys = async () => {
    if (!activeAccount || loading) return;
    setLoading(true);
    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: ROUTE_GET_LIST,
        signingPrefix: SIGNING_GET_LIST,
        body: {
          routeFilter: DEFAULT_ALLOWED_ROUTE,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "HMAC 키 목록 조회 실패");
      }

      const items = (data?.result?.keys || []) as HmacKeyItem[];
      setKeys(items);
      syncDrafts(items);
      setFetchedAt(new Date());
    } catch (error) {
      console.error(error);
      toast.error("HMAC 키 목록 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    if (!activeAccount || creating) return;
    setCreating(true);
    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: ROUTE_CREATE,
        signingPrefix: SIGNING_CREATE,
        body: {
          keyId: normalizeString(newKeyId) || undefined,
          description: normalizeString(newDescription) || undefined,
          allowedStorecodes: parseCommaSeparated(newAllowedStorecodesText),
          allowedRoutes: parseCommaSeparated(newAllowedRoutesText || DEFAULT_ALLOWED_ROUTE),
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "HMAC 키 생성 실패");
      }

      const keyId = normalizeString(data?.result?.keyId);
      const secret = normalizeString(data?.result?.secret);
      if (keyId && secret) {
        setRevealedSecret({ keyId, secret });
      }

      setNewKeyId("");
      setNewDescription("");
      setNewAllowedStorecodesText("");
      setNewAllowedRoutesText(DEFAULT_ALLOWED_ROUTE);
      toast.success("HMAC 키를 생성했습니다.");
      await fetchKeys();
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "HMAC 키 생성 실패";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const saveKey = async (keyId: string) => {
    if (!activeAccount || !keyId || savingKeyId) return;
    const draft = drafts[keyId];
    if (!draft) return;

    setSavingKeyId(keyId);
    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: ROUTE_UPDATE,
        signingPrefix: SIGNING_UPDATE,
        body: {
          keyId,
          status: draft.status,
          description: normalizeString(draft.description),
          allowedStorecodes: parseCommaSeparated(draft.allowedStorecodesText),
          allowedRoutes: parseCommaSeparated(draft.allowedRoutesText || DEFAULT_ALLOWED_ROUTE),
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "HMAC 키 저장 실패");
      }

      toast.success(`${keyId} 저장 완료`);
      await fetchKeys();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "HMAC 키 저장 실패");
    } finally {
      setSavingKeyId("");
    }
  };

  const rotateKey = async (keyId: string) => {
    if (!activeAccount || !keyId || rotatingKeyId) return;
    if (!confirm(`${keyId} 키를 회전하시겠습니까? 기존 시크릿은 즉시 무효화됩니다.`)) return;

    setRotatingKeyId(keyId);
    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: ROUTE_ROTATE,
        signingPrefix: SIGNING_ROTATE,
        body: {
          keyId,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "HMAC 키 회전 실패");
      }

      const newSecret = normalizeString(data?.result?.secret);
      if (newSecret) {
        setRevealedSecret({
          keyId,
          secret: newSecret,
        });
      }

      toast.success(`${keyId} 키 회전 완료`);
      await fetchKeys();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "HMAC 키 회전 실패");
    } finally {
      setRotatingKeyId("");
    }
  };

  const revokeKey = async (keyId: string) => {
    if (!activeAccount || !keyId || savingKeyId) return;
    if (!confirm(`${keyId} 키를 revoke 처리하시겠습니까?`)) return;

    setSavingKeyId(keyId);
    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: ROUTE_UPDATE,
        signingPrefix: SIGNING_UPDATE,
        body: {
          keyId,
          status: "revoked",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "HMAC 키 revoke 실패");
      }
      toast.success(`${keyId} revoke 완료`);
      await fetchKeys();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "HMAC 키 revoke 실패");
    } finally {
      setSavingKeyId("");
    }
  };

  useEffect(() => {
    if (!activeAccount) return;
    fetchKeys();
    const timer = setInterval(fetchKeys, 20_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccount]);

  const activeCount = useMemo(() => {
    return keys.filter((item) => item.status === "active").length;
  }, [keys]);

  return (
    <main className="w-full px-3 sm:px-4 md:px-6 lg:px-10 pb-10">
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl p-4 text-white bg-gradient-to-r from-zinc-900 via-slate-800 to-zinc-900 shadow-lg shadow-zinc-900/40">
          <div className="text-xs uppercase tracking-[0.14em] text-cyan-200">Security Keys</div>
          <div className="text-xl font-bold">HMAC API 키 관리</div>
          <div className="text-xs text-slate-300 mt-1">
            대상 라우트: <span className="font-mono">{DEFAULT_ALLOWED_ROUTE}</span>
          </div>
          <div className="mt-2 text-xs text-slate-300">
            전체 {keys.length}개 / 활성 {activeCount}개 / 업데이트 {fetchedAt ? formatDateTime(fetchedAt) : "-"}
          </div>
        </div>

        {!activeAccount ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            관리자 지갑 연결 후 HMAC 키를 관리할 수 있습니다.
          </div>
        ) : (
          <>
            {revealedSecret && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
                <div className="text-sm font-bold text-emerald-800">
                  생성/회전된 키 (한 번만 노출): {revealedSecret.keyId}
                </div>
                <div className="mt-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 font-mono text-sm break-all">
                  {revealedSecret.secret}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(revealedSecret.secret);
                        toast.success("시크릿 복사 완료");
                      } catch {
                        toast.error("복사 실패");
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-600"
                  >
                    복사
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevealedSecret(null)}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-zinc-200 text-zinc-800 hover:bg-zinc-300"
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-bold text-zinc-800">새 HMAC 키 생성</div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={newKeyId}
                  onChange={(event) => setNewKeyId(event.target.value)}
                  placeholder="keyId (비우면 자동 생성)"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  value={newDescription}
                  onChange={(event) => setNewDescription(event.target.value)}
                  placeholder="설명"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  value={newAllowedStorecodesText}
                  onChange={(event) => setNewAllowedStorecodesText(event.target.value)}
                  placeholder="허용 storecode 목록 (쉼표구분, 비우면 전체)"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  value={newAllowedRoutesText}
                  onChange={(event) => setNewAllowedRoutesText(event.target.value)}
                  placeholder="허용 route 목록 (쉼표구분)"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  disabled={creating}
                  onClick={createKey}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {creating ? "생성중..." : "키 생성"}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm overflow-x-auto">
              <div className="text-sm font-bold text-zinc-800 mb-3">키 목록</div>
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-700">
                  <tr>
                    <th className="px-2 py-2 text-left">keyId</th>
                    <th className="px-2 py-2 text-left">status</th>
                    <th className="px-2 py-2 text-left">secret</th>
                    <th className="px-2 py-2 text-left">allowed storecodes</th>
                    <th className="px-2 py-2 text-left">allowed routes</th>
                    <th className="px-2 py-2 text-left">description</th>
                    <th className="px-2 py-2 text-left">usage</th>
                    <th className="px-2 py-2 text-left">actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((item) => {
                    const keyId = normalizeString(item.keyId);
                    const draft = drafts[keyId];
                    return (
                      <tr key={keyId} className="border-t border-zinc-100 align-top">
                        <td className="px-2 py-2 font-mono text-xs">{keyId}</td>
                        <td className="px-2 py-2">
                          <select
                            value={draft?.status || "active"}
                            onChange={(event) =>
                              setDrafts((previous) => ({
                                ...previous,
                                [keyId]: {
                                  ...(previous[keyId] || {
                                    status: "active",
                                    description: "",
                                    allowedStorecodesText: "",
                                    allowedRoutesText: DEFAULT_ALLOWED_ROUTE,
                                  }),
                                  status: event.target.value as DraftState["status"],
                                },
                              }))
                            }
                            className="rounded border border-zinc-300 px-2 py-1 text-xs"
                          >
                            <option value="active">active</option>
                            <option value="disabled">disabled</option>
                            <option value="revoked">revoked</option>
                          </select>
                        </td>
                        <td className="px-2 py-2 font-mono text-xs text-zinc-600">{item.secretPreview || "-"}</td>
                        <td className="px-2 py-2">
                          <input
                            value={draft?.allowedStorecodesText || ""}
                            onChange={(event) =>
                              setDrafts((previous) => ({
                                ...previous,
                                [keyId]: {
                                  ...(previous[keyId] || {
                                    status: "active",
                                    description: "",
                                    allowedStorecodesText: "",
                                    allowedRoutesText: DEFAULT_ALLOWED_ROUTE,
                                  }),
                                  allowedStorecodesText: event.target.value,
                                },
                              }))
                            }
                            placeholder="전체 허용이면 비우기"
                            className="w-56 rounded border border-zinc-300 px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={draft?.allowedRoutesText || DEFAULT_ALLOWED_ROUTE}
                            onChange={(event) =>
                              setDrafts((previous) => ({
                                ...previous,
                                [keyId]: {
                                  ...(previous[keyId] || {
                                    status: "active",
                                    description: "",
                                    allowedStorecodesText: "",
                                    allowedRoutesText: DEFAULT_ALLOWED_ROUTE,
                                  }),
                                  allowedRoutesText: event.target.value,
                                },
                              }))
                            }
                            className="w-64 rounded border border-zinc-300 px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={draft?.description || ""}
                            onChange={(event) =>
                              setDrafts((previous) => ({
                                ...previous,
                                [keyId]: {
                                  ...(previous[keyId] || {
                                    status: "active",
                                    description: "",
                                    allowedStorecodesText: "",
                                    allowedRoutesText: DEFAULT_ALLOWED_ROUTE,
                                  }),
                                  description: event.target.value,
                                },
                              }))
                            }
                            className="w-56 rounded border border-zinc-300 px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-2 py-2 text-xs text-zinc-600">
                          <div>count: {Number(item.usageCount || 0).toLocaleString("ko-KR")}</div>
                          <div>last: {formatDateTime(item.lastUsedAt)}</div>
                          <div>updated: {formatDateTime(item.updatedAt)}</div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              disabled={Boolean(savingKeyId) || Boolean(rotatingKeyId)}
                              onClick={() => saveKey(keyId)}
                              className="rounded px-2 py-1 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
                            >
                              {savingKeyId === keyId ? "저장중..." : "저장"}
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(savingKeyId) || Boolean(rotatingKeyId)}
                              onClick={() => rotateKey(keyId)}
                              className="rounded px-2 py-1 text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-600 disabled:opacity-60"
                            >
                              {rotatingKeyId === keyId ? "회전중..." : "시크릿 회전"}
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(savingKeyId) || Boolean(rotatingKeyId)}
                              onClick={() => revokeKey(keyId)}
                              className="rounded px-2 py-1 text-xs font-semibold bg-rose-700 text-white hover:bg-rose-600 disabled:opacity-60"
                            >
                              revoke
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {keys.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-2 py-6 text-center text-sm text-zinc-500">
                        등록된 HMAC 키가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

