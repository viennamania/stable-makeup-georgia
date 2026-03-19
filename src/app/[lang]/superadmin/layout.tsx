import type { ReactNode } from "react";
import Link from "next/link";

export default function SuperadminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { lang: string };
}) {
  const lang = params?.lang || "ko";

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_26%),radial-gradient(circle_at_80%_10%,_rgba(251,191,36,0.12),_transparent_18%),linear-gradient(180deg,_#0a0f1d_0%,_#070a12_46%,_#05070d_100%)]">
        <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-5 py-4 shadow-[0_35px_120px_-60px_rgba(15,23,42,0.95)] backdrop-blur">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-300/90">
                  Superadmin Control
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[30px]">
                  Darknight Operations Deck
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-300/80">
                  슈퍼어드민 전용 관리 기능만 분리한 보안 운영 영역입니다.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/${lang}/superadmin`}
                  className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300/50 hover:bg-cyan-400/15"
                >
                  Control Deck
                </Link>
                <Link
                  href={`/${lang}/superadmin/store-payment-wallets`}
                  className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:border-amber-300/50 hover:bg-amber-400/15"
                >
                  Payment Wallets
                </Link>
                <Link
                  href={`/${lang}/superadmin/buyorder-watch`}
                  className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:border-emerald-300/50 hover:bg-emerald-400/15"
                >
                  Buyorder Watch
                </Link>
                <Link
                  href={`/${lang}/superadmin/access-requests`}
                  className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1.5 text-xs font-semibold text-fuchsia-100 transition hover:border-fuchsia-300/50 hover:bg-fuchsia-400/15"
                >
                  Access Requests
                </Link>
              </div>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
