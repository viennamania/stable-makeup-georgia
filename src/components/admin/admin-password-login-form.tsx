"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  loginAdminPassword,
  logoutAdminPassword,
} from "@/lib/client/admin-password-auth";
import { useAdminPasswordSessionState } from "@/lib/client/use-admin-active-account";

type AdminPasswordLoginFormProps = {
  lang: string;
  redirectTo?: string;
  compact?: boolean;
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export default function AdminPasswordLoginForm({
  lang,
  redirectTo,
  compact = false,
}: AdminPasswordLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useAdminPasswordSessionState();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const nextPath = normalizeString(redirectTo)
    || normalizeString(searchParams?.get("next"))
    || `/${lang}/admin`;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await loginAdminPassword({
        loginId,
        password,
      });
      await session.refresh();
      router.replace(nextPath);
      router.refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    setSubmitting(true);
    setError("");
    try {
      await logoutAdminPassword();
      await session.refresh();
      router.refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "로그아웃에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (session.authenticated) {
    return (
      <div className={compact ? "space-y-3" : "mx-auto max-w-md space-y-4"}>
        <div className="rounded-lg border border-emerald-200/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">
          <div className="font-semibold">{session.account?.displayName || session.account?.loginId}</div>
          <div className="mt-1 text-xs text-emerald-100/80">
            {session.account?.role} · {session.account?.storecodes?.join(", ") || session.requesterStorecode}
          </div>
        </div>
        {error ? (
          <div className="rounded-lg border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              router.replace(nextPath);
              router.refresh();
            }}
            className="rounded-lg bg-sky-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
          >
            관리자 화면
          </button>
          <button
            type="button"
            onClick={logout}
            disabled={submitting}
            className="rounded-lg border border-white/10 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-60"
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={compact ? "space-y-3" : "mx-auto max-w-md space-y-4"}>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">
          ID
        </label>
        <input
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
          autoComplete="username"
          className="h-12 w-full rounded-lg border border-white/10 bg-white px-4 text-sm font-medium text-slate-950 outline-none ring-0 transition focus:border-sky-300"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">
          Password
        </label>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete="current-password"
          className="h-12 w-full rounded-lg border border-white/10 bg-white px-4 text-sm font-medium text-slate-950 outline-none ring-0 transition focus:border-sky-300"
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting || !loginId.trim() || !password}
        className="h-12 w-full rounded-lg bg-sky-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
