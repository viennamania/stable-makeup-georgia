"use client";

import {
  useAdminActiveAccount } from "@/lib/client/use-admin-active-account";
import {
  useEffect,
  useMemo,
  useState } from "react";
import { toast } from "react-hot-toast";
import { useParams,
  useRouter } from "next/navigation";
import { postAdminSignedJson } from "@/lib/client/admin-signed-action";
import {
  postAdminPasswordAccountList,
  postAdminPasswordStoreAdminUpsert,
} from "@/lib/client/admin-password-account-admin";

type AdminUser = {
  _id?: string;
  id?: string;
  createdAt?: string;
  nickname?: string;
  walletAddress?: string;
  storecode?: string;
  role?: string;
  userType?: string;
};

type AdminPasswordAccount = {
  loginId: string;
  displayName: string | null;
  role: string;
  storecodes: string[];
  status: string;
  lastLoginAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

const formatDateTime = (value: unknown) => {
  const text = String(value || "").trim();
  if (!text) return "-";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
};

const formatRelative = (value: unknown) => {
  const text = String(value || "").trim();
  if (!text) return "-";

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "-";

  const diffMs = Date.now() - date.getTime();
  const isFuture = diffMs < 0;
  const diff = Math.abs(diffMs);
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);
  const suffix = isFuture ? "후" : "전";

  if (sec < 60) return `${sec}초 ${suffix}`;
  if (min < 60) return `${min}분 ${suffix}`;
  if (hour < 24) return `${hour}시간 ${suffix}`;
  return `${day}일 ${suffix}`;
};

export default function AdminManagementPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const activeAccount = useAdminActiveAccount();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [passwordAccounts, setPasswordAccounts] = useState<AdminPasswordAccount[]>([]);
  const [passwordAccountsLoading, setPasswordAccountsLoading] = useState(false);
  const [savingStoreAdmin, setSavingStoreAdmin] = useState(false);
  const [storeAdminLoginId, setStoreAdminLoginId] = useState("");
  const [storeAdminPassword, setStoreAdminPassword] = useState("");
  const [storeAdminDisplayName, setStoreAdminDisplayName] = useState("");
  const [storeAdminStorecodes, setStoreAdminStorecodes] = useState("");

  const GET_ALL_ADMINS_SIGNING_PREFIX = "stable-georgia:get-all-admins:v1";

  const fetchAdmins = async () => {
    if (loading) return;
    if (!activeAccount) {
      setAdmins([]);
      return;
    }
    setLoading(true);

    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: "/api/user/getAllAdmins",
        signingPrefix: GET_ALL_ADMINS_SIGNING_PREFIX,
        body: {
          limit: 1000,
          page: 1,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "관리자 목록 조회에 실패했습니다.");
      }

      const users: AdminUser[] = data?.result?.users || [];
      setAdmins(users);
      setFetchedAt(new Date());
    } catch (error: any) {
      toast.error(error?.message || "관리자 목록 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPasswordAccounts = async () => {
    if (passwordAccountsLoading) return;
    if (!activeAccount) {
      setPasswordAccounts([]);
      return;
    }
    setPasswordAccountsLoading(true);

    try {
      const response = await postAdminPasswordAccountList(activeAccount);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "관리자 로그인 계정 조회에 실패했습니다.");
      }

      setPasswordAccounts(data?.result?.accounts || []);
    } catch (error: any) {
      toast.error(error?.message || "관리자 로그인 계정 조회에 실패했습니다.");
    } finally {
      setPasswordAccountsLoading(false);
    }
  };

  const saveStoreAdminAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeAccount) {
      toast.error("관리자 인증이 필요합니다.");
      return;
    }

    const loginId = storeAdminLoginId.trim().toLowerCase();
    const password = storeAdminPassword;
    const storecodes = storeAdminStorecodes
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (!loginId) {
      toast.error("로그인 ID를 입력해주세요.");
      return;
    }
    if (password.length < 8) {
      toast.error("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (storecodes.length === 0) {
      toast.error("가맹점 storecode를 입력해주세요.");
      return;
    }

    setSavingStoreAdmin(true);
    try {
      const response = await postAdminPasswordStoreAdminUpsert({
        account: activeAccount,
        loginId,
        password,
        displayName: storeAdminDisplayName,
        storecodes,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "가맹점 관리자 계정 저장에 실패했습니다.");
      }

      toast.success(data?.result?.created ? "가맹점 관리자 계정이 생성되었습니다." : "가맹점 관리자 비밀번호가 초기화되었습니다.");
      setStoreAdminPassword("");
      await fetchPasswordAccounts();
    } catch (error: any) {
      toast.error(error?.message || "가맹점 관리자 계정 저장에 실패했습니다.");
    } finally {
      setSavingStoreAdmin(false);
    }
  };

  useEffect(() => {
    if (!activeAccount) return;
    fetchAdmins();
    fetchPasswordAccounts();
    const timer = setInterval(() => {
      fetchAdmins();
      fetchPasswordAccounts();
    }, 20_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccount]);

  const filteredAdmins = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return admins;

    return admins.filter((item) => {
      const target = [
        item.nickname,
        item.walletAddress,
        item.storecode,
        item.role,
        item.userType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return target.includes(query);
    });
  }, [admins, search]);

  const filteredPasswordAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return passwordAccounts;

    return passwordAccounts.filter((item) => {
      const target = [
        item.loginId,
        item.displayName,
        item.role,
        item.status,
        ...(item.storecodes || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return target.includes(query);
    });
  }, [passwordAccounts, search]);

  return (
    <main className="w-full px-3 sm:px-4 md:px-6 lg:px-10 pb-10">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-gradient-to-r from-zinc-900 via-slate-800 to-zinc-900 text-white rounded-2xl p-4 shadow-lg shadow-zinc-900/40">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-cyan-200">Admin Users</div>
            <div className="text-xl font-bold">관리자 관리</div>
            <div className="text-xs text-slate-300 mt-1">조건: storecode=admin, role=admin</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/${params?.lang || "en"}/admin`)}
              className="px-3 py-2 rounded-lg text-sm font-semibold border border-white/20 bg-white/10 hover:bg-white/20"
            >
              대시보드
            </button>
            <button
              type="button"
              onClick={fetchAdmins}
              disabled={loading}
              className="px-3 py-2 rounded-lg text-sm font-semibold bg-white text-zinc-900 hover:bg-zinc-100 disabled:opacity-70"
            >
              {loading ? "조회중..." : "새로고침"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-zinc-200 p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-zinc-500">표시</span>
            <span className="text-2xl font-black text-zinc-900">
              {filteredAdmins.length.toLocaleString("ko-KR")}명
            </span>
            <span className="text-xs text-zinc-400">/ 전체 {admins.length.toLocaleString("ko-KR")}명</span>
            <span className="text-xs text-zinc-400">
              {fetchedAt ? `업데이트: ${formatDateTime(fetchedAt)}` : "업데이트 대기중..."}
            </span>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="닉네임, 지갑주소, role 검색"
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white"
          />
        </div>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <form
            onSubmit={saveStoreAdminAccount}
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-4">
              <div className="text-sm font-bold text-zinc-950">가맹점 관리자 로그인 발급</div>
              <div className="mt-1 text-xs text-zinc-500">
                전체 관리자가 가맹점별 아이디와 비밀번호를 생성하거나 비밀번호를 초기화합니다.
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-700">
                로그인 ID
                <input
                  value={storeAdminLoginId}
                  onChange={(event) => setStoreAdminLoginId(event.target.value)}
                  placeholder="store-admin-01"
                  className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 outline-none focus:border-blue-400"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-700">
                표시 이름
                <input
                  value={storeAdminDisplayName}
                  onChange={(event) => setStoreAdminDisplayName(event.target.value)}
                  placeholder="가맹점명 관리자"
                  className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 outline-none focus:border-blue-400"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-700">
                임시 비밀번호
                <input
                  value={storeAdminPassword}
                  onChange={(event) => setStoreAdminPassword(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  placeholder="8자 이상"
                  className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 outline-none focus:border-blue-400"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-700">
                허용 storecode
                <input
                  value={storeAdminStorecodes}
                  onChange={(event) => setStoreAdminStorecodes(event.target.value)}
                  placeholder="storecode1"
                  className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 outline-none focus:border-blue-400"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={savingStoreAdmin || !activeAccount}
                className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingStoreAdmin ? "저장중..." : "계정 생성 / 비밀번호 초기화"}
              </button>
              <button
                type="button"
                onClick={fetchPasswordAccounts}
                disabled={passwordAccountsLoading || !activeAccount}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordAccountsLoading ? "조회중..." : "계정 목록 새로고침"}
              </button>
            </div>
          </form>

          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-zinc-100 text-xs text-zinc-700">
                <tr>
                  <th className="px-3 py-2 text-left">로그인 ID</th>
                  <th className="px-3 py-2 text-left">표시 이름</th>
                  <th className="px-3 py-2 text-left">role</th>
                  <th className="px-3 py-2 text-left">storecode</th>
                  <th className="px-3 py-2 text-left">상태</th>
                  <th className="px-3 py-2 text-left">최근 로그인</th>
                </tr>
              </thead>
              <tbody>
                {filteredPasswordAccounts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-zinc-500">
                      발급된 관리자 로그인 계정이 없습니다.
                    </td>
                  </tr>
                )}
                {filteredPasswordAccounts.map((item) => (
                  <tr key={item.loginId} className="border-t border-zinc-100 align-top">
                    <td className="px-3 py-2 font-mono text-xs font-semibold text-zinc-950">{item.loginId}</td>
                    <td className="px-3 py-2 text-zinc-800">{item.displayName || "-"}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                        {item.role}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-700">{item.storecodes?.join(", ") || "-"}</td>
                    <td className="px-3 py-2 text-zinc-700">{item.status}</td>
                    <td className="px-3 py-2 text-zinc-700">
                      <div>{formatDateTime(item.lastLoginAt)}</div>
                      <div className="text-xs text-zinc-400">{formatRelative(item.lastLoginAt)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="overflow-x-auto bg-white rounded-2xl border border-zinc-200 shadow">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-zinc-100 text-zinc-700 text-xs">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">닉네임</th>
                <th className="px-3 py-2 text-left">지갑주소</th>
                <th className="px-3 py-2 text-left">storecode</th>
                <th className="px-3 py-2 text-left">role</th>
                <th className="px-3 py-2 text-left">유형</th>
                <th className="px-3 py-2 text-left">등록일시</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-zinc-500">
                    조회된 관리자가 없습니다.
                  </td>
                </tr>
              )}
              {filteredAdmins.map((item, index) => (
                <tr key={String(item._id || item.id || index)} className="border-t border-zinc-100 align-top">
                  <td className="px-3 py-2 text-zinc-500">{index + 1}</td>
                  <td className="px-3 py-2 text-zinc-900 font-semibold">{item.nickname || "-"}</td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-700">
                    <button
                      type="button"
                      onClick={() => {
                        if (!item.walletAddress) return;
                        navigator.clipboard.writeText(item.walletAddress);
                        toast.success("지갑주소가 복사되었습니다.");
                      }}
                      className="underline underline-offset-2 hover:text-blue-600"
                    >
                      {item.walletAddress || "-"}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-zinc-700">{item.storecode || "-"}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex px-2 py-1 rounded-md text-xs font-semibold border bg-blue-100 text-blue-800 border-blue-200">
                      {item.role || "admin"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-zinc-700">{item.userType || "-"}</td>
                  <td className="px-3 py-2 text-zinc-700">
                    <div>{formatDateTime(item.createdAt)}</div>
                    <div className="text-xs text-zinc-400">{formatRelative(item.createdAt)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
