'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";

import { version } from "@/app/config/version";

type CenterTopMenuKey =
  | "member"
  | "buyorder"
  | "trade-history"
  | "clearance-history"
  | "daily-close";

type CenterTopMenuProps = {
  lang: string;
  center: string;
  activeKey?: CenterTopMenuKey;
};

const menuItems: Array<{
  key: CenterTopMenuKey;
  label: string;
  icon: string;
  href: (lang: string, center: string) => string;
  hideInBangbang?: boolean;
}> = [
  {
    key: "member",
    label: "회원관리",
    icon: "/icon-user.png",
    href: (lang, center) => `/${lang}/${center}/member`,
  },
  {
    key: "buyorder",
    label: "구매주문관리",
    icon: "/icon-buyorder.png",
    href: (lang, center) => `/${lang}/${center}/buyorder`,
  },
  {
    key: "trade-history",
    label: "P2P 거래내역",
    icon: "/icon-trade.png",
    href: (lang, center) => `/${lang}/${center}/trade-history`,
  },
  {
    key: "clearance-history",
    label: "판매(거래소)",
    icon: "/icon-clearance.png",
    href: (lang, center) => `/${lang}/${center}/clearance-history`,
    hideInBangbang: true,
  },
  {
    key: "daily-close",
    label: "통계(일별)",
    icon: "/icon-statistics.png",
    href: (lang, center) => `/${lang}/${center}/daily-close`,
  },
];

export default function CenterTopMenu({
  lang,
  center,
  activeKey,
}: CenterTopMenuProps) {
  const router = useRouter();
  const items = menuItems.filter((item) => !(item.hideInBangbang && version === "bangbang"));

  return (
    <div className="mb-4 w-full overflow-x-auto pb-1">
      <div className="min-w-max flex flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm">
        {items.map((item) => {
          const isActive = item.key === activeKey;

          return (
            <button
              key={item.key}
              onClick={() => router.push(item.href(lang, center))}
              className={`flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition ${
                isActive
                  ? "border border-slate-900 bg-slate-900 text-white shadow-[0_10px_20px_-12px_rgba(15,23,42,0.8)]"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Image
                src={item.icon}
                alt={item.label}
                width={16}
                height={16}
                className="h-4 w-4"
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
