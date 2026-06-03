"use client";

import { useParams } from "next/navigation";

import AdminPasswordLoginForm from "@/components/admin/admin-password-login-form";

export default function AdminPasswordLoginPage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "ko";

  return (
    <main className="min-h-[calc(100vh-12rem)] w-full px-4 py-8">
      <section className="mx-auto grid w-full max-w-5xl gap-6 rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_42px_120px_-64px_rgba(15,23,42,0.9)] lg:grid-cols-[minmax(0,1fr)_420px] lg:p-7">
        <div className="flex min-h-[360px] flex-col justify-between rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.18),rgba(15,23,42,0.94)_48%,rgba(16,185,129,0.12))] p-6">
          <div>
            <div className="text-[11px] font-semibold text-sky-200">
              Stable Georgia
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              관리자 로그인
            </h1>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/8 px-4 py-3">
              <div className="text-[10px] text-slate-400">Role</div>
              <div className="mt-2 text-sm font-semibold text-slate-100">admin</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/8 px-4 py-3">
              <div className="text-[10px] text-slate-400">Store</div>
              <div className="mt-2 text-sm font-semibold text-slate-100">store_admin</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/8 px-4 py-3">
              <div className="text-[10px] text-slate-400">Token</div>
              <div className="mt-2 text-sm font-semibold text-slate-100">session</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/6 p-5">
          <AdminPasswordLoginForm lang={lang} />
        </div>
      </section>
    </main>
  );
}
