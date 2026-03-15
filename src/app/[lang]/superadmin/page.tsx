"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";

import { useSuperadminSession } from "@/lib/client/use-superadmin-session";

const truncateWallet = (value: unknown) => {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    return "-";
  }
  if (text.length <= 18) {
    return text;
  }
  return `${text.slice(0, 8)}...${text.slice(-6)}`;
};

export default function SuperadminHomePage() {
  const params = useParams<{ lang: string }>();
  const activeAccount = useActiveAccount();
  const { user, role, isSuperadmin, loading, error } = useSuperadminSession(activeAccount);
  const lang = params?.lang || "ko";

  const statusText = !activeAccount
    ? "지갑 연결 필요"
    : loading
      ? "권한 확인중"
      : isSuperadmin
        ? "권한 확인 완료"
        : "권한 없음";
  const showControlModules = Boolean(activeAccount && !loading && isSuperadmin);

  return (
    <main className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,31,0.94),rgba(6,10,19,0.96))] shadow-[0_45px_140px_-72px_rgba(8,145,178,0.45)]">
        <div className="grid gap-5 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1.35fr)_360px]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-300/85">
              Superadmin Index
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[36px]">
              루트 권한 운영 기능을 분리합니다.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300/82">
              일반 관리자와 분리된 superadmin 영역입니다. 먼저 가맹점 결제용 지갑주소
              생성·변경 기능을 모듈형으로 추가하고, 이후 민감한 운영 작업을 같은 구조로 확장할 수
              있게 설계합니다.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200">
                Darknight Tone
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-200">
                Thirdweb Server Wallet
              </span>
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100">
                Smart Account Controls
              </span>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">
              Access Status
            </div>
            <div className="mt-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200">
              {statusText}
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-300/82">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Wallet</div>
                <div className="mt-1 font-semibold text-white">
                  {truncateWallet(activeAccount?.address)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Role</div>
                <div className="mt-1 font-semibold text-white">{role || "-"}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Operator</div>
                <div className="mt-1 font-semibold text-white">
                  {String(user?.nickname || user?.name || "-")}
                </div>
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {!activeAccount ? (
        <section className="rounded-[26px] border border-amber-400/20 bg-amber-500/10 px-5 py-5 text-sm text-amber-100">
          슈퍼어드민 콘솔을 사용하려면 먼저 지갑을 연결해야 합니다.
        </section>
      ) : null}

      {activeAccount && loading ? (
        <section className="rounded-[26px] border border-cyan-400/20 bg-cyan-500/10 px-5 py-5 text-sm text-cyan-100">
          현재 지갑의 superadmin 권한을 확인하고 있습니다.
        </section>
      ) : null}

      {activeAccount && !loading && !isSuperadmin ? (
        <section className="rounded-[26px] border border-rose-400/20 bg-rose-500/10 px-5 py-5 text-sm text-rose-100">
          현재 지갑에는 `role` 또는 `rold` 기준 `superadmin` 권한이 없습니다.
        </section>
      ) : null}

      {showControlModules ? (
        <section className="grid gap-4 xl:grid-cols-2">
        <article className="group overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,17,30,0.95),rgba(8,11,21,0.98))] p-5 shadow-[0_38px_120px_-70px_rgba(251,191,36,0.35)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-200/85">
                Module 01
              </div>
              <h3 className="mt-3 text-xl font-semibold text-white">
                가맹점 결제용 지갑주소
              </h3>
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100">
              Live
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-300/82">
            thirdweb server wallet 기반 smart account를 생성하고, 현재 settlement wallet을
            검증된 후보 주소로 교체하는 전용 운영 페이지입니다.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200">
              Create
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200">
              Reassign
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200">
              Webhook Sync
            </span>
          </div>

          <div className="mt-6">
            <Link
              href={`/${lang}/superadmin/store-payment-wallets`}
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                isSuperadmin
                  ? "bg-white text-slate-950 hover:bg-slate-100"
                  : "cursor-not-allowed border border-white/10 bg-white/[0.04] text-slate-500"
              }`}
            >
              모듈 열기
            </Link>
          </div>
        </article>

        <article className="overflow-hidden rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
            Reserved
          </div>
          <h3 className="mt-3 text-xl font-semibold text-white/90">다음 운영 모듈 자리</h3>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            추가 superadmin 기능은 같은 권한·감사 로그 구조로 여기에 확장할 수 있게 비워둔 슬롯입니다.
          </p>
        </article>
        </section>
      ) : null}
    </main>
  );
}
