"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { logoutAdminPassword } from "@/lib/client/admin-password-auth";
import { useAdminPasswordSessionState } from "@/lib/client/use-admin-active-account";

export default function AdminPasswordSessionStatus() {
  const router = useRouter();
  const session = useAdminPasswordSessionState();
  const [submitting, setSubmitting] = useState(false);

  if (!session.authenticated) {
    return null;
  }

  const accountLabel = session.account?.displayName || session.account?.loginId || "admin";
  const storeLabel = session.account?.storecodes?.join(", ") || session.requesterStorecode || "admin";

  const logout = async () => {
    if (!confirm("관리자 아이디 세션에서 로그아웃 하시겠습니까?")) {
      return;
    }

    setSubmitting(true);
    try {
      await logoutAdminPassword();
      await session.refresh();
      toast.success("로그아웃 되었습니다");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "로그아웃에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-3 flex w-full justify-end px-3 sm:px-6">
      <div className="flex max-w-full flex-wrap items-center justify-end gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
        <span className="max-w-[16rem] truncate font-semibold text-slate-950">
          {accountLabel}
        </span>
        <span className="text-xs text-slate-500">
          {session.account?.role || "admin"} / {storeLabel}
        </span>
        <button
          type="button"
          onClick={logout}
          disabled={submitting}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Image
            src="/icon-logout.webp"
            alt=""
            width={14}
            height={14}
            className="h-3.5 w-3.5"
          />
          로그아웃
        </button>
      </div>
    </div>
  );
}
