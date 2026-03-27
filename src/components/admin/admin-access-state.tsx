"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type AdminAccessStateProps = {
  variant: "login" | "checking" | "denied";
  title: string;
  description: string;
  address?: string | null;
  actions?: ReactNode;
  note?: string;
};

const formatWalletAddress = (value?: string | null) => {
  const safe = String(value || "").trim();
  if (!safe) {
    return "Wallet not connected";
  }

  if (safe.length <= 14) {
    return safe;
  }

  return `${safe.slice(0, 6)}...${safe.slice(-4)}`;
};

const getVariantMeta = (variant: AdminAccessStateProps["variant"]) => {
  if (variant === "login") {
    return {
      eyebrow: "Identity Required",
      badge: "Wallet Sign-In",
      accent:
        "from-sky-500/18 via-cyan-400/10 to-emerald-400/14 border-sky-200/35 text-sky-50",
      panel:
        "border-sky-200/14 bg-[linear-gradient(180deg,rgba(7,89,133,0.28),rgba(15,23,42,0.64))]",
      badgeClass: "border-sky-200/28 bg-sky-400/12 text-sky-100",
      lineClass: "bg-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.55)]",
      toneClass: "text-sky-100",
    };
  }

  if (variant === "checking") {
    return {
      eyebrow: "Privilege Check",
      badge: "Admin Verification",
      accent:
        "from-amber-500/18 via-orange-400/10 to-slate-400/14 border-amber-200/35 text-amber-50",
      panel:
        "border-amber-200/14 bg-[linear-gradient(180deg,rgba(120,53,15,0.24),rgba(15,23,42,0.64))]",
      badgeClass: "border-amber-200/28 bg-amber-400/12 text-amber-100",
      lineClass: "bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.45)]",
      toneClass: "text-amber-100",
    };
  }

  return {
    eyebrow: "Restricted Surface",
    badge: "Access Denied",
    accent:
      "from-rose-500/20 via-red-400/12 to-slate-400/14 border-rose-200/35 text-rose-50",
    panel:
      "border-rose-200/14 bg-[linear-gradient(180deg,rgba(127,29,29,0.24),rgba(15,23,42,0.66))]",
    badgeClass: "border-rose-200/28 bg-rose-400/12 text-rose-100",
    lineClass: "bg-rose-300 shadow-[0_0_18px_rgba(253,164,175,0.45)]",
    toneClass: "text-rose-100",
  };
};

export default function AdminAccessState({
  variant,
  title,
  description,
  address,
  actions,
  note,
}: AdminAccessStateProps) {
  const pathname = usePathname();
  const meta = getVariantMeta(variant);
  const normalizedPath = pathname || "/admin";

  return (
    <main className="min-h-[100vh] bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.1),_transparent_20%),linear-gradient(180deg,_#edf4fb_0%,_#f7fbff_42%,_#edf2f8_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-[linear-gradient(135deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.96)_48%,_rgba(30,41,59,0.98))] px-6 py-7 text-white shadow-[0_42px_120px_-62px_rgba(15,23,42,0.82)] sm:px-8 sm:py-8">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),radial-gradient(circle_at_14%_18%,rgba(56,189,248,0.16),transparent_22%),radial-gradient(circle_at_82%_0%,rgba(16,185,129,0.12),transparent_20%)] bg-[size:34px_34px,34px_34px,auto,auto]" />
          <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_360px]">
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {meta.eyebrow}
                </div>
                <h1 className="text-3xl font-semibold tracking-[-0.06em] text-white sm:text-[2.35rem]">
                  {title}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  {description}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className={`rounded-[24px] border px-4 py-4 ${meta.panel}`}>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    Requested Surface
                  </div>
                  <div className="mt-3 break-all text-lg font-semibold tracking-[-0.04em] text-white">
                    {normalizedPath}
                  </div>
                  <div className="mt-2 text-sm text-slate-300">
                    보호된 운영 영역입니다.
                  </div>
                </div>

                <div className={`rounded-[24px] border px-4 py-4 ${meta.panel}`}>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    Access Policy
                  </div>
                  <div className={`mt-3 text-lg font-semibold tracking-[-0.04em] ${meta.toneClass}`}>
                    admin role gate
                  </div>
                  <div className="mt-2 text-sm text-slate-300">
                    <code className="rounded bg-white/8 px-1.5 py-0.5 text-xs text-slate-100">storecode=admin</code>
                    {" / "}
                    <code className="rounded bg-white/8 px-1.5 py-0.5 text-xs text-slate-100">role=admin</code>
                  </div>
                </div>

                <div className={`rounded-[24px] border px-4 py-4 ${meta.panel}`}>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    Requester Wallet
                  </div>
                  <div className="mt-3 text-lg font-semibold tracking-[-0.04em] text-white">
                    {formatWalletAddress(address)}
                  </div>
                  <div className="mt-2 text-sm text-slate-300">
                    연결된 지갑 기준으로 권한을 확인합니다.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4 rounded-[30px] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <div>
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${meta.badgeClass}`}>
                  <span className={`h-2 w-2 rounded-full ${meta.lineClass}`} aria-hidden="true" />
                  {meta.badge}
                </div>
                <div className="mt-5 text-[2.1rem] font-semibold tracking-[-0.07em] text-white">
                  운영 권한 보호 구역
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-300">
                  금융 운영 화면은 민감한 상태 변경이 연결되므로 인증된 관리자 지갑에서만 열립니다.
                </div>
              </div>

              <div className="space-y-3">
                {note ? (
                  <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4 text-sm leading-6 text-slate-200">
                    {note}
                  </div>
                ) : null}
                {actions ? (
                  <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">{actions}</div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
