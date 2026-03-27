"use client";

import Image from "next/image";

type AdminAccessLogoutButtonProps = {
  onClick: () => void;
};

export default function AdminAccessLogoutButton({
  onClick,
}: AdminAccessLogoutButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
    >
      <Image
        src="/icon-logout.webp"
        alt="Logout"
        width={18}
        height={18}
        className="h-[18px] w-[18px] rounded"
      />
      <span>로그아웃</span>
    </button>
  );
}
