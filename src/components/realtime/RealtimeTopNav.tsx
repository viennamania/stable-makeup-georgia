"use client";

import Link from "next/link";

type RealtimeTopNavTab = "home" | "banktransfer" | "settlement" | "buyorder";

type RealtimeTopNavProps = {
  lang: string;
  current: RealtimeTopNavTab;
};

const MENU_ITEMS: Array<{ key: RealtimeTopNavTab; label: string; getHref: (lang: string) => string }> = [
  {
    key: "home",
    label: "Home",
    getHref: (lang: string) => `/${lang}/promotion`,
  },
  {
    key: "banktransfer",
    label: "Banktransfer",
    getHref: (lang: string) => `/${lang}/realtime-banktransfer`,
  },
  {
    key: "buyorder",
    label: "BuyOrder",
    getHref: (lang: string) => `/${lang}/realtime-buyorder`,
  },
  {
    key: "settlement",
    label: "Settlement",
    getHref: (lang: string) => `/${lang}/realtime-settlement`,
  },
];

export default function RealtimeTopNav({ lang, current }: RealtimeTopNavProps) {
  return (
    <div className="fixed inset-x-0 top-0 z-[170] px-2 sm:px-4">
      <div className="mx-auto flex w-full max-w-[1880px] justify-center">
        <nav className="mt-2 flex w-full max-w-[760px] items-center gap-1.5 overflow-x-auto whitespace-nowrap rounded-2xl border border-slate-700/80 bg-slate-950/85 p-1.5 shadow-[0_16px_30px_-20px_rgba(2,6,23,0.95)] backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MENU_ITEMS.map((item) => {
            const isActive = item.key === current;

            return (
              <Link
                key={item.key}
                href={item.getHref(lang)}
                aria-current={isActive ? "page" : undefined}
                className={`shrink-0 rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "pointer-events-none border-cyan-300/85 bg-gradient-to-br from-cyan-300/26 via-sky-300/22 to-cyan-400/20 text-cyan-50 shadow-[0_0_0_1px_rgba(125,211,252,0.35),0_0_24px_rgba(34,211,238,0.22)]"
                    : "border-slate-600/75 bg-slate-800/70 text-slate-300 hover:border-cyan-300/55 hover:text-cyan-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
