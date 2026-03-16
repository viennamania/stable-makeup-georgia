export default function ScanLoadingPage() {
  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#1f2937]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[26px] border border-[#2a3140] bg-[#111827] text-white shadow-[0_30px_80px_-52px_rgba(15,23,42,0.9)]">
          <div className="grid gap-3 px-5 py-3 sm:px-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`scan-loading-metric-${index}`}
                className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="h-3 w-20 animate-pulse rounded-full bg-white/15" />
                <div className="mt-3 h-4 w-28 animate-pulse rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-[#e9e2d2] bg-white shadow-[0_28px_72px_-54px_rgba(15,23,42,0.28)]">
          <div className="border-b border-[#efe6d4] bg-[linear-gradient(180deg,_#fffdf7_0%,_#fbf7eb_100%)] px-5 py-8 sm:px-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-2xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#9a7610]">
                  BNB Smart Chain Explorer
                </div>
                <h1 className="mt-3 text-[2rem] font-semibold tracking-tight text-[#202939] sm:text-[2.6rem]">
                  Initializing monitored transfers
                </h1>
                <p className="mt-3 text-sm leading-6 text-[#5f6675]">
                  Initial snapshot and realtime channel are loading. First render can take a few seconds when the
                  explorer rebuilds its latest transfer feed.
                </p>
              </div>

              <div className="inline-flex items-center gap-3 rounded-full border border-[#eadcb6] bg-[#fff7df] px-4 py-2.5 text-sm font-semibold text-[#946400]">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-current" />
                Loading latest transfers...
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-5 py-5 sm:px-7 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`scan-loading-card-${index}`}
                className="rounded-[22px] border border-[#ece4d2] bg-[#fffdfa] px-5 py-4 shadow-sm"
              >
                <div className="h-3 w-24 animate-pulse rounded-full bg-[#ece4d2]" />
                <div className="mt-3 h-8 w-20 animate-pulse rounded-full bg-[#f2ead9]" />
                <div className="mt-3 h-3 w-32 animate-pulse rounded-full bg-[#f5efe2]" />
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-[#e4e4e7] bg-white shadow-[0_22px_70px_-56px_rgba(0,0,0,0.18)]">
          <div className="border-b border-[#e4e4e7] px-5 py-5 sm:px-7">
            <div className="h-3 w-40 animate-pulse rounded-full bg-[#ececec]" />
            <div className="mt-3 h-6 w-72 animate-pulse rounded-full bg-[#f2f2f2]" />
          </div>

          <div className="divide-y divide-[#efefef]">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={`scan-loading-row-${index}`} className="px-5 py-4 sm:px-7">
                <div className="grid gap-3 md:grid-cols-[1.55fr,0.92fr,0.92fr,1.1fr,1.1fr,0.92fr]">
                  {Array.from({ length: 6 }).map((__, cellIndex) => (
                    <div key={`scan-loading-cell-${index}-${cellIndex}`} className="space-y-2">
                      <div className="h-3 w-16 animate-pulse rounded-full bg-[#eeeeee] md:hidden" />
                      <div className="h-4 w-full animate-pulse rounded-full bg-[#f4f4f5]" />
                      <div className="h-3 w-2/3 animate-pulse rounded-full bg-[#f7f7f8]" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
