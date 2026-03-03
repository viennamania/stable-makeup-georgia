"use client";

import Link from "next/link";
import { useActiveAccount } from "thirdweb/react";

type AdminUserActionPanelMode = "register" | "settings";

type AdminUserActionPanelProps = {
  lang: string;
  mode: AdminUserActionPanelMode;
};

const formatWalletAddress = (value: string): string => {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "-";
  }
  if (normalized.length <= 18) {
    return normalized;
  }
  return `${normalized.slice(0, 8)}...${normalized.slice(-8)}`;
};

export default function AdminUserActionPanel({ lang, mode }: AdminUserActionPanelProps) {
  const activeAccount = useActiveAccount();
  const walletAddress = String(activeAccount?.address || "").trim();

  const isRegisterMode = mode === "register";

  const title = isRegisterMode ? "회원가입" : "회원정보";
  const description = isRegisterMode
    ? "관리자 콘솔 접근을 위해 admin 회원정보를 등록하세요."
    : "등록된 admin 회원정보를 확인하고 수정하세요.";
  const primaryLabel = isRegisterMode ? "회원가입 진행하기" : "회원정보 보기";
  const primaryHref = isRegisterMode
    ? `/${lang}/promotion/user-register`
    : `/${lang}/admin/profile-settings`;
  const secondaryLabel = isRegisterMode ? "회원정보 페이지로" : "회원가입 페이지로";
  const secondaryHref = isRegisterMode
    ? `/${lang}/admin/user/user-settings`
    : `/${lang}/admin/user/user-register`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-600">{description}</p>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">연결 지갑주소</p>
          <p className="mt-1 font-mono text-sm text-slate-800">{formatWalletAddress(walletAddress)}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={primaryHref}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {primaryLabel}
          </Link>
          <Link
            href={secondaryHref}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {secondaryLabel}
          </Link>
          <Link
            href={`/${lang}/admin`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            관리자 홈으로
          </Link>
        </div>
      </section>
    </div>
  );
}
