'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";

const ClearancePage = dynamic(
  () => import("../[storecode]/clearance/page"),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 text-sm text-slate-500">
        청산관리 화면을 불러오는 중입니다...
      </div>
    ),
  }
);

interface StoreSummary {
  storecode: string;
  storeName: string;
  storeLogo?: string;
  favoriteOnAndOff?: boolean;
  clearanceSortOrder?: number;
  agentcode?: string;
  totalSettlementCount?: number;
  totalSettlementAmountKRW?: number;
  totalUsdtAmountClearance?: number;
}

const STORECODE_QUERY_KEY = "storecode";

const getKstToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
  }).format(new Date());

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

const getSortOrder = (store: StoreSummary) => {
  const value = Number(store.clearanceSortOrder);
  if (Number.isFinite(value) && value > 0) {
    return value;
  }
  return Number.MAX_SAFE_INTEGER;
};

const compareStoresForSidebar = (a: StoreSummary, b: StoreSummary) => {
  const orderDiff = getSortOrder(a) - getSortOrder(b);
  if (orderDiff !== 0) {
    return orderDiff;
  }

  const favoriteDiff =
    Number(Boolean(b.favoriteOnAndOff)) - Number(Boolean(a.favoriteOnAndOff));
  if (favoriteDiff !== 0) {
    return favoriteDiff;
  }

  const aName = (a.storeName || a.storecode || "").trim();
  const bName = (b.storeName || b.storecode || "").trim();
  return aName.localeCompare(bName, "ko-KR", { sensitivity: "base" });
};

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
  const [updatingOrderStorecode, setUpdatingOrderStorecode] = useState("");
  const [orderSaveError, setOrderSaveError] = useState("");
  const fetchingStoresRef = useRef(false);

  const fetchStores = useCallback(async () => {
    if (fetchingStoresRef.current) {
      return;
    }

    fetchingStoresRef.current = true;
    setFetchingStores(true);
    setFetchError("");
    setOrderSaveError("");

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
      const nextStores: StoreSummary[] = (data?.result?.stores || [])
        .map((store: StoreSummary) => ({
          ...store,
          storecode: String(store?.storecode || "").trim(),
        }))
        .filter((store: StoreSummary) => Boolean(store.storecode));

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
      return "";
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
    const todayDate = getKstToday();
    nextParams.set(STORECODE_QUERY_KEY, selectedStorecode);
    nextParams.set("page", "1");
    nextParams.set("searchMyOrders", "false");
    if (!nextParams.get("fromDate")) {
      nextParams.set("fromDate", todayDate);
    }
    if (!nextParams.get("toDate")) {
      nextParams.set("toDate", todayDate);
    }
    router.replace(`/${params.lang}/admin/store/clearance-management?${nextParams.toString()}`);
  }, [selectedStorecode, selectedStorecodeFromQuery, searchParamsString, router, params.lang]);

  const sortedStores = useMemo(() => {
    return [...stores].sort(compareStoresForSidebar);
  }, [stores]);

  const filteredStores = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return sortedStores;
    }

    return sortedStores.filter((store) => {
      const searchable = `${store.storeName} ${store.storecode}`.toLowerCase();
      return searchable.includes(normalizedKeyword);
    });
  }, [sortedStores, searchKeyword]);

  const persistStoreOrder = useCallback(async (orderedStores: StoreSummary[]) => {
    const orders = orderedStores
      .map((store, index) => ({
        storecode: String(store.storecode || "").trim(),
        clearanceSortOrder: index + 1,
      }))
      .filter((order) => order.storecode);

    if (!orders.length) {
      throw new Error("유효한 가맹점 순서 정보가 없습니다.");
    }

    const response = await fetch("/api/store/updateClearanceSortOrders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orders,
      }),
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch (error) {}

    if (!response.ok || !data?.result) {
      throw new Error(
        data?.error || "가맹점 순서 저장에 실패했습니다. 다시 시도해주세요."
      );
    }
  }, []);

  const moveStoreOrder = useCallback(async (storecode: string, offset: -1 | 1) => {
    if (updatingOrderStorecode || searchKeyword.trim()) {
      return;
    }

    const currentOrder = [...sortedStores];
    const currentIndex = currentOrder.findIndex((store) => store.storecode === storecode);
    if (currentIndex < 0) {
      return;
    }

    const targetIndex = currentIndex + offset;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) {
      return;
    }

    const reordered = [...currentOrder];
    [reordered[currentIndex], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[currentIndex],
    ];

    const reorderedWithOrder = reordered.map((store, index) => ({
      ...store,
      clearanceSortOrder: index + 1,
    }));

    const orderMap = new Map(
      reorderedWithOrder.map((store) => [store.storecode, store.clearanceSortOrder])
    );
    const previousStores = stores;

    setOrderSaveError("");
    setUpdatingOrderStorecode(storecode);
    setStores((prev) =>
      prev.map((store) => ({
        ...store,
        clearanceSortOrder: orderMap.get(store.storecode),
      }))
    );

    try {
      await persistStoreOrder(reorderedWithOrder);
    } catch (error) {
      console.error("move store order failed", error);
      setStores(previousStores);
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : "가맹점 순서 저장에 실패했습니다. 다시 시도해주세요.";
      setOrderSaveError(errorMessage);
    } finally {
      setUpdatingOrderStorecode("");
    }
  }, [updatingOrderStorecode, searchKeyword, sortedStores, stores, persistStoreOrder]);

  const storePositionMap = useMemo(() => {
    const map = new Map<string, number>();
    sortedStores.forEach((store, index) => {
      map.set(store.storecode, index);
    });
    return map;
  }, [sortedStores]);

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
    <main className="min-h-screen overflow-x-auto bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 lg:p-6">
      <div className="mx-auto grid w-full lg:w-[1520px] lg:min-w-[1520px] lg:max-w-[1520px] grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <aside className="w-full self-start rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h1 className="text-lg font-semibold text-slate-900">
              청산관리
            </h1>
          </div>

          <div className="border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="가맹점명 또는 코드 검색"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:bg-white"
              />
              <button
                onClick={fetchStores}
                className="whitespace-nowrap rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                새로고침
              </button>
            </div>

            {searchKeyword.trim() && (
              <p className="mt-1 text-xs text-amber-600">
                검색 중에는 순서 변경이 비활성화됩니다.
              </p>
            )}
          </div>

          <div className="max-h-[52vh] overflow-y-auto p-2 lg:max-h-[calc(100vh-12rem)]">
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

            {!fetchingStores && !fetchError && orderSaveError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                {orderSaveError}
              </div>
            )}

            {!fetchingStores && !fetchError && filteredStores.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                검색 결과가 없습니다.
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              {filteredStores.map((store) => {
                const isSelected = store.storecode === selectedStorecode;
                const storeIndex = storePositionMap.get(store.storecode) ?? -1;
                const canMoveUp =
                  !searchKeyword.trim() && storeIndex > 0 && !updatingOrderStorecode;
                const canMoveDown =
                  !searchKeyword.trim() &&
                  storeIndex >= 0 &&
                  storeIndex < sortedStores.length - 1 &&
                  !updatingOrderStorecode;

                return (
                  <div
                    key={store.storecode}
                    className={`
                      w-full rounded-lg border transition-all duration-200
                      ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-300/40"
                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                      }
                    `}
                  >
                    <div className="flex items-center gap-1 px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedStorecode(store.storecode)}
                        className="min-w-0 flex flex-1 items-center gap-1.5 text-left"
                      >
                        <div
                          className={`
                            relative h-8 w-8 overflow-hidden rounded-full border
                            ${isSelected ? "border-slate-700" : "border-slate-200"}
                          `}
                        >
                          <Image
                            src={store.storeLogo || "/logo.png"}
                            alt={store.storeName || store.storecode}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-semibold leading-tight">
                            {store.storeName || "이름 없음"}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveStoreOrder(store.storecode, -1)}
                          disabled={!canMoveUp}
                          className={`
                            inline-flex h-6 w-6 items-center justify-center rounded-md border text-[11px] leading-none transition
                            ${
                              isSelected
                                ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                                : "border-slate-300 bg-white text-slate-500 hover:bg-slate-100"
                            }
                            ${canMoveUp ? "cursor-pointer" : "cursor-not-allowed opacity-40"}
                          `}
                          aria-label={`${store.storeName || store.storecode} 위로 이동`}
                          title="위로 이동"
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          onClick={() => moveStoreOrder(store.storecode, 1)}
                          disabled={!canMoveDown}
                          className={`
                            inline-flex h-6 w-6 items-center justify-center rounded-md border text-[11px] leading-none transition
                            ${
                              isSelected
                                ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                                : "border-slate-300 bg-white text-slate-500 hover:bg-slate-100"
                            }
                            ${canMoveDown ? "cursor-pointer" : "cursor-not-allowed opacity-40"}
                          `}
                          aria-label={`${store.storeName || store.storecode} 아래로 이동`}
                          title="아래로 이동"
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleFavorite(store)}
                          disabled={updatingFavoriteStorecode === store.storecode}
                          className={`
                            inline-flex h-6 w-6 items-center justify-center rounded-md border text-sm leading-none transition
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
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="flex min-h-[72vh] min-w-0 w-full flex-col gap-4">
          {!selectedStore && (
            <div className="flex min-h-[72vh] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="mb-3 inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                <Image
                  src="/icon-collect.png"
                  alt="Store"
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                가맹점을 선택하세요
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                좌측 목록에서 가맹점을 선택하면 해당 가맹점의 청산관리 화면이 표시됩니다.
              </p>

              {filteredStores.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  {filteredStores.slice(0, 4).map((store) => (
                    <button
                      key={`guide-select-${store.storecode}`}
                      type="button"
                      onClick={() => setSelectedStorecode(store.storecode)}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                    >
                      {store.storeName || store.storecode}
                    </button>
                  ))}
                </div>
              )}
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
                  key={String(selectedStore.storecode || "").trim()}
                  params={{
                    ...params,
                    storecode: String(selectedStore.storecode || "").trim(),
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
