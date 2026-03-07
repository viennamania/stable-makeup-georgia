"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { postAdminSignedJson } from "@/lib/client/admin-signed-action";

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
  const activeAccount = useActiveAccount();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

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

  useEffect(() => {
    if (!activeAccount) return;
    fetchAdmins();
    const timer = setInterval(fetchAdmins, 20_000);
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
