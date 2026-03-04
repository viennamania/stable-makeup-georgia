import {
  IP_BLOCK_NOTICE_BY_LANG,
  resolveIpBlockNoticeLang,
} from "@/lib/security/ip-block-notice";

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export default function IpBlockedPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const langRaw = Array.isArray(searchParams?.lang)
    ? searchParams?.lang[0]
    : searchParams?.lang;
  const ipRaw = Array.isArray(searchParams?.ip)
    ? searchParams?.ip[0]
    : searchParams?.ip;

  const lang = resolveIpBlockNoticeLang(langRaw, "en");
  const content = IP_BLOCK_NOTICE_BY_LANG[lang];
  const ip = normalizeString(ipRaw);

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-zinc-100 to-zinc-200 px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-3xl rounded-2xl border border-rose-300 bg-white p-6 shadow-xl sm:p-8">
        <div className="inline-flex items-center rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-bold tracking-wide text-rose-700">
          SECURITY BLOCK
        </div>

        <h1 className="mt-4 text-2xl font-black text-zinc-900 sm:text-3xl">{content.title}</h1>
        <p className="mt-2 text-sm text-zinc-700 sm:text-base">{content.subtitle}</p>

        <div className="mt-5 rounded-xl border border-rose-300 bg-rose-50 p-4">
          <p className="text-base font-bold text-rose-700 sm:text-lg">{content.legalNotice}</p>
          <p className="mt-2 text-sm text-rose-700">{content.detail}</p>
        </div>

        {ip ? (
          <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
            Public IP: <span className="font-mono">{ip}</span>
          </div>
        ) : null}

        <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          {content.contact}
        </div>

        <div className="mt-6 text-xs text-zinc-400">
          Lang: {lang.toUpperCase()} / Report Type: IP Security Enforcement
        </div>
      </section>
    </main>
  );
}
