'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import ClearancePage from "../[storecode]/clearance/page";

interface StoreSummary {
  storecode: string;
  storeName: string;
  storeLogo?: string;
  favoriteOnAndOff?: boolean;
  agentcode?: string;
  totalSettlementCount?: number;
  totalSettlementAmountKRW?: number;
  totalUsdtAmountClearance?: number;
}

const STORECODE_QUERY_KEY = "storecode";

const formatCount = (value?: number) =>
  Number(value || 0).toLocaleString("ko-KR");

const formatKRW = (value?: number) =>
  Number(value || 0).toLocaleString("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  });

const formatUsdt = (value?: number) =>
  Number(value || 0).toLocaleString("ko-KR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

export default function ClearanceManagementPage({ params }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchParamsString = searchParams?.toString() || "";
  const selectedStorecodeFromQuery =
    searchParams?.get(STORECODE_QUERY_KEY) || "";

  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [fetchingStores, setFetchingStores] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedStorecode, setSelectedStorecode] = useState("");
  const [updatingFavoriteStorecode, setUpdatingFavoriteStorecode] = useState("");
  const fetchingStoresRef = useRef(false);

  const fetchStores = useCallback(async () => {
    if (fetchingStoresRef.current) {
      return;
    }

    fetchingStoresRef.current = true;
    setFetchingStores(true);
    setFetchError("");

    try {
      const response = await fetch("/api/store/getAllStores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 500,
          page: 1,
          searchStore: "",
          sortBy: "storeNameDesc",
        }),
      });

      if (!response.ok) {
        throw new Error("failed to fetch stores");
      }

      const data = await response.json();
      const nextStores: StoreSummary[] = data?.result?.stores || [];

      setStores(nextStores);
    } catch (error) {
      console.error("clearance-management store fetch error", error);
      setFetchError("가맹점 목록을 불러오지 못했습니다.");
      setStores([]);
    } finally {
      fetchingStoresRef.current = false;
      setFetchingStores(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    if (!stores.length) {
      setSelectedStorecode("");
      return;
    }

    const hasQueryStore = stores.some(
      (store) => store.storecode === selectedStorecodeFromQuery
    );

    if (hasQueryStore) {
      setSelectedStorecode(selectedStorecodeFromQuery);
      return;
    }

    setSelectedStorecode((prev) => {
      if (prev && stores.some((store) => store.storecode === prev)) {
        return prev;
      }
      return stores[0].storecode;
    });
  }, [stores, selectedStorecodeFromQuery]);

  useEffect(() => {
    if (!selectedStorecode) {
      return;
    }

    if (selectedStorecodeFromQuery === selectedStorecode) {
      return;
    }

    const nextParams = new URLSearchParams(searchParamsString);
    nextParams.set(STORECODE_QUERY_KEY, selectedStorecode);
    nextParams.set("page", "1");
    nextParams.set("searchMyOrders", "false");
    router.replace(`/${params.lang}/admin/store/clearance-management?${nextParams.toString()}`);
  }, [selectedStorecode, selectedStorecodeFromQuery, searchParamsString, router, params.lang]);

  const filteredStores = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();
    const sortedStores = [...stores].sort((a, b) => {
      const favoriteDiff =
        Number(Boolean(b.favoriteOnAndOff)) - Number(Boolean(a.favoriteOnAndOff));
      if (favoriteDiff !== 0) {
        return favoriteDiff;
      }

      const aName = (a.storeName || a.storecode || "").trim();
      const bName = (b.storeName || b.storecode || "").trim();
      return aName.localeCompare(bName, "ko-KR", { sensitivity: "base" });
    });

    if (!normalizedKeyword) {
      return sortedStores;
    }

    return sortedStores.filter((store) => {
      const searchable = `${store.storeName} ${store.storecode}`.toLowerCase();
      return searchable.includes(normalizedKeyword);
    });
  }, [stores, searchKeyword]);

  const selectedStore = useMemo(() => {
    if (!selectedStorecode) {
      return null;
    }
    return stores.find((store) => store.storecode === selectedStorecode) || null;
  }, [stores, selectedStorecode]);

  const toggleFavorite = useCallback(async (store: StoreSummary) => {
    if (updatingFavoriteStorecode) {
      return;
    }

    const nextFavoriteOnAndOff = !Boolean(store.favoriteOnAndOff);
    setUpdatingFavoriteStorecode(store.storecode);

    setStores((prev) =>
      prev.map((item) =>
        item.storecode === store.storecode
          ? { ...item, favoriteOnAndOff: nextFavoriteOnAndOff }
          : item
      )
    );

    try {
      const response = await fetch("/api/store/toggleFavorite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storecode: store.storecode,
          favoriteOnAndOff: nextFavoriteOnAndOff,
        }),
      });

      if (!response.ok) {
        throw new Error("failed to update favorite");
      }

      const data = await response.json();
      if (!data?.result) {
        throw new Error("favorite update rejected");
      }
    } catch (error) {
      console.error("toggle favorite failed", error);
      setStores((prev) =>
        prev.map((item) =>
          item.storecode === store.storecode
            ? { ...item, favoriteOnAndOff: Boolean(store.favoriteOnAndOff) }
            : item
        )
      );
    } finally {
      setUpdatingFavoriteStorecode("");
    }
  }, [updatingFavoriteStorecode]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 lg:p-6">
      <div className="mx-auto grid w-full max-w-[1520px] grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <aside className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold text-slate-900">
                  청산관리
                </h1>
                <p className="text-sm text-slate-500">
                  가맹점을 선택해 청산 업무를 진행하세요.
                </p>
              </div>

              <button
                onClick={fetchStores}
                className="whitespace-nowrap rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                새로고침
              </button>
            </div>

            <div className="mt-3">
              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="가맹점명 또는 코드 검색"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="h-[52vh] overflow-y-auto p-3 lg:h-[calc(100vh-11rem)]">
            {fetchingStores && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                가맹점 목록을 불러오는 중입니다...
              </div>
            )}

            {!fetchingStores && fetchError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                {fetchError}
              </div>
            )}

            {!fetchingStores && !fetchError && filteredStores.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                검색 결과가 없습니다.
              </div>
            )}

            <div className="flex flex-col gap-2">
              {filteredStores.map((store) => {
                const isSelected = store.storecode === selectedStorecode;

                return (
                  <div
                    key={store.storecode}
                    className={`
                      w-full rounded-xl border transition-all duration-200
                      ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-300/60"
                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedStorecode(store.storecode)}
                        className="min-w-0 flex flex-1 items-center gap-3 text-left"
                      >
                        <div
                          className={`
                            relative h-11 w-11 overflow-hidden rounded-full border
                            ${isSelected ? "border-slate-700" : "border-slate-200"}
                          `}
                        >
                          <Image
                            src={store.storeLogo || "/logo.png"}
                            alt={store.storeName || store.storecode}
                            fill
                            className="object-cover"
                            sizes="44px"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {store.storeName || "이름 없음"}
                          </p>
                          <p
                            className={`
                              truncate text-xs
                              ${isSelected ? "text-slate-300" : "text-slate-500"}
                            `}
                          >
                            {store.storecode}
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleFavorite(store)}
                        disabled={updatingFavoriteStorecode === store.storecode}
                        className={`
                          inline-flex h-8 w-8 items-center justify-center rounded-lg border text-lg leading-none transition
                          ${
                            isSelected
                              ? "border-slate-700 bg-slate-800 hover:bg-slate-700"
                              : "border-slate-300 bg-white hover:bg-slate-100"
                          }
                          ${
                            store.favoriteOnAndOff
                              ? "text-amber-500"
                              : (isSelected ? "text-slate-300" : "text-slate-400")
                          }
                          ${
                            updatingFavoriteStorecode === store.storecode
                              ? "cursor-not-allowed opacity-60"
                              : "cursor-pointer"
                          }
                        `}
                        aria-label={`${store.storeName || store.storecode} 즐겨찾기`}
                        title={store.favoriteOnAndOff ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                      >
                        {store.favoriteOnAndOff ? "★" : "☆"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="flex min-h-[72vh] min-w-0 w-full flex-col gap-4">
          {!selectedStore && (
            <div className="flex min-h-[72vh] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500 shadow-sm">
              선택된 가맹점이 없습니다.
            </div>
          )}

          {selectedStore && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-slate-200">
                      <Image
                        src={selectedStore.storeLogo || "/logo.png"}
                        alt={selectedStore.storeName || selectedStore.storecode}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>

                    <div className="flex flex-col">
                      <h2 className="text-xl font-semibold text-slate-900">
                        {selectedStore.storeName || "이름 없음"}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          {selectedStore.storecode}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <ClearancePage
                  key={selectedStore.storecode}
                  params={{
                    ...params,
                    storecode: selectedStore.storecode,
                    embedded: true,
                  }}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
