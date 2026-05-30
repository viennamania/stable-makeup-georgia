import type { RelativeTimeLocale } from "@lib/realtime/timeAgo";

export type RealtimeLocale = RelativeTimeLocale;

export type RealtimeTopNavTab = "home" | "banktransfer" | "settlement" | "buyorder";

export type BuyOrderStatusKey =
  | "ordered"
  | "accepted"
  | "paymentRequested"
  | "paymentConfirmed"
  | "paymentSettled"
  | "cancelled";

export type RealtimeCopy = {
  locale: RealtimeLocale;
  numberLocale: string;
  topNav: Record<RealtimeTopNavTab, string>;
  common: {
    live: string;
    new: string;
    countdown: string;
    connection: string;
    sync: string;
    cursor: string;
    running: string;
    idle: string;
    latestStore: string;
    latestStatus: string;
    updated: string;
    initial: string;
    unknownStore: string;
    previous: string;
    next: string;
    page: string;
    allStores: string;
    search: string;
    reset: string;
    copyTradeId: string;
  };
  statusLabels: Record<BuyOrderStatusKey, string>;
  banktransfer: {
    title: string;
    description: string;
    resync: string;
    resyncing: string;
    todayDateKst: string;
    remainingToday: string;
    todayDepositedKst: string;
    todayWithdrawnKst: string;
    accumulated: (count: string) => string;
    matchedEvents: string;
    todaySummaryErrorPrefix: string;
    metricTitle: string;
    depositedCount: string;
    withdrawnCount: string;
    matchedSuccess: string;
    errorEvents: string;
    logTitle: string;
    unmatchedTitle: string;
    unmatchedCount: (count: string) => string;
    unmatchedTotal: (amount: string) => string;
    unmatchedEmpty: string;
    sender: string;
    receiver: string;
    waitingEmpty: string;
    errors: {
      resyncFailed: string;
      todaySummaryFailed: string;
    };
    transactionTypes: {
      deposited: string;
      withdrawn: string;
    };
  };
  settlement: {
    title: string;
    description: string;
    resync: string;
    totalEventsTitle: string;
    totalEventsSub: string;
    totalUsdtTitle: string;
    totalUsdtSub: string;
    totalKrwTitle: string;
    totalKrwSub: string;
    hashCoverageTitle: string;
    monitorTitle: string;
    monitorNote: string;
    eventListTitle: string;
    eventListSubtitle: string;
    empty: string;
    settled: string;
    referenceReady: string;
    referencePending: string;
    buyer: string;
    store: string;
    table: {
      time: string;
      status: string;
      amount: string;
      buyer: string;
      store: string;
      trace: string;
    };
    previousStatus: string;
    errors: {
      resyncFailed: string;
    };
    count: (count: string) => string;
  };
  buyorder: {
    title: string;
    resync: string;
    resyncing: string;
    todayDateKst: string;
    remainingToday: string;
    todayConfirmedCountKst: string;
    todayConfirmedAmountKst: string;
    todayPgFeeKst: string;
    sellerWalletTitle: string;
    sellerWalletEmpty: string;
    count: (count: string) => string;
    errors: {
      resyncFailed: string;
      todaySummaryFailed: string;
      pendingFailed: string;
      listFailed: string;
      sellerWalletFailed: string;
    };
    errorPrefixes: {
      todaySummary: string;
      pending: string;
      list: string;
      sellerWallet: string;
    };
    pending: {
      eyebrow: string;
      title: string;
      statusesLine: string;
      empty: string;
      actionDockEyebrow: string;
      adminLockTitle: string;
      adminDisabledHelp: string;
      passwordPlaceholder: string;
      checking: string;
      unlock: string;
      enabled: string;
      sessionExpires: string;
      logout: string;
      manualDepositButton: string;
      manualChecking: string;
    };
    list: {
      title: string;
      total: (count: string) => string;
      allStatus: string;
      searchPlaceholder: string;
      loading: string;
      empty: string;
    };
    log: {
      title: string;
      empty: string;
    };
    manual: {
      ariaClose: string;
      eyebrow: string;
      title: string;
      description: string;
      refresh: string;
      close: string;
      loadingCandidates: string;
      buyer: string;
      depositAccount: string;
      paymentMethod: string;
      orderAmount: string;
      transferScheduled: string;
      paymentRequestedAt: string;
      sellerBankAccount: string;
      depositBank: string;
      accountNumber: string;
      accountHolder: string;
      recommendedDate: string;
      noSelectionHelp: string;
      depositCandidates: string;
      depositCandidatesHelp: string;
      clearSelection: string;
      emptyDeposits: string;
      amountMatched: string;
      nameMatched: string;
      balancePrefix: string;
      memoPrefix: string;
      selectedDepositTotal: string;
      amountMatchStatus: string;
      noSelection: string;
      matched: string;
      mismatched: string;
      submitting: string;
      submit: string;
      adminSessionFetchFailed: string;
      passwordRequired: string;
      unlocked: string;
      unlockFailed: string;
      lockedOut: string;
      logoutFailed: string;
      disabled: string;
      unlockFirst: string;
      candidateFetchFailed: string;
      amountMismatch: string;
      submitFailed: string;
      partialSuccess: (matchedCount: number, unmatchedCount: number) => string;
      matchedSuccess: (matchedCount: number) => string;
      manualSuccess: string;
    };
  };
};

const realtimeCopies: Record<RealtimeLocale, RealtimeCopy> = {
  ko: {
    locale: "ko",
    numberLocale: "ko-KR",
    topNav: {
      home: "홈",
      banktransfer: "입출금",
      buyorder: "구매주문",
      settlement: "정산",
    },
    common: {
      live: "LIVE",
      new: "NEW",
      countdown: "COUNTDOWN",
      connection: "Connection",
      sync: "Sync",
      cursor: "Cursor",
      running: "running",
      idle: "idle",
      latestStore: "Latest Store",
      latestStatus: "Last Status",
      updated: "updated",
      initial: "초기",
      unknownStore: "Unknown Store",
      previous: "이전",
      next: "다음",
      page: "page",
      allStores: "전체 가맹점",
      search: "검색",
      reset: "초기화",
      copyTradeId: "tradeId 복사",
    },
    statusLabels: {
      ordered: "주문접수",
      accepted: "매칭완료",
      paymentRequested: "결제요청",
      paymentConfirmed: "결제완료",
      paymentSettled: "정산완료",
      cancelled: "취소",
    },
    banktransfer: {
      title: "Banktransfer Realtime Dashboard",
      description: "공개 대시보드입니다. 입금자 이름/계좌번호는 마스킹되어 표시됩니다.",
      resync: "재동기화",
      resyncing: "재동기화 중...",
      todayDateKst: "오늘 날짜 (KST)",
      remainingToday: "오늘 남은 시간",
      todayDepositedKst: "오늘 입금 (KST)",
      todayWithdrawnKst: "오늘 출금 (KST)",
      accumulated: (count) => `누적 ${count}건`,
      matchedEvents: "매칭된 이벤트",
      todaySummaryErrorPrefix: "오늘 누적 집계 조회 실패:",
      metricTitle: "거래 지표 (오늘 · KST)",
      depositedCount: "입금 건수",
      withdrawnCount: "출금 건수",
      matchedSuccess: "매칭 성공",
      errorEvents: "오류 이벤트",
      logTitle: "실시간 입출금 시스템 로그",
      unmatchedTitle: "오늘 미신청입금 목록 (KST)",
      unmatchedCount: (count) => `건수 ${count}`,
      unmatchedTotal: (amount) => `합계 ${amount} KRW`,
      unmatchedEmpty: "오늘 미신청입금 이벤트가 없습니다.",
      sender: "입금자",
      receiver: "수취",
      waitingEmpty: "[WAITING] 아직 수신된 이벤트가 없습니다.",
      errors: {
        resyncFailed: "재동기화에 실패했습니다.",
        todaySummaryFailed: "오늘 누적 집계 조회 실패",
      },
      transactionTypes: {
        deposited: "입금",
        withdrawn: "출금",
      },
    },
    settlement: {
      title: "Settlement Realtime Dashboard",
      description: "BuyOrder 중 paymentSettled 완료 및 정산 참조값이 있는 이벤트만 실시간으로 표시합니다.",
      resync: "재동기화",
      totalEventsTitle: "정산 이벤트",
      totalEventsSub: "Settlement 관련 수신",
      totalUsdtTitle: "총 정산 USDT",
      totalUsdtSub: "온체인 정산 규모",
      totalKrwTitle: "총 정산 KRW",
      totalKrwSub: "원화 환산 합계",
      hashCoverageTitle: "해시 추적률",
      monitorTitle: "정산 모니터링",
      monitorNote: "정산 완료 + 정산 참조 정보가 확인된 이벤트만 추적합니다.",
      eventListTitle: "실시간 정산 이벤트",
      eventListSubtitle: "최신 이벤트 순",
      empty: "아직 수신된 정산 이벤트가 없습니다.",
      settled: "정산완료",
      referenceReady: "참조확인",
      referencePending: "참조대기",
      buyer: "구매자",
      store: "스토어",
      table: {
        time: "시간",
        status: "정산 상태",
        amount: "정산 금액",
        buyer: "구매자",
        store: "스토어",
        trace: "정산 추적",
      },
      previousStatus: "이전 상태:",
      errors: {
        resyncFailed: "재동기화에 실패했습니다.",
      },
      count: (count) => `${count}건`,
    },
    buyorder: {
      title: "BuyOrder Realtime Dashboard",
      resync: "재동기화",
      resyncing: "재동기화 중...",
      todayDateKst: "오늘 날짜 (KST)",
      remainingToday: "오늘 남은 시간",
      todayConfirmedCountKst: "오늘 결제완료 거래건수 (KST)",
      todayConfirmedAmountKst: "오늘 결제완료 거래금액 (KST)",
      todayPgFeeKst: "오늘 PG 수수료 (KST)",
      sellerWalletTitle: "판매자 지갑 USDT 잔고 (LIVE)",
      sellerWalletEmpty: "seller.walletAddress 데이터가 없습니다.",
      count: (count) => `${count}건`,
      errors: {
        resyncFailed: "재동기화에 실패했습니다.",
        todaySummaryFailed: "오늘 누적 집계 조회 실패",
        pendingFailed: "진행중 주문 조회 실패",
        listFailed: "구매주문 목록 조회 실패",
        sellerWalletFailed: "판매자 지갑 잔고 조회 실패",
      },
      errorPrefixes: {
        todaySummary: "오늘 결제완료 집계 조회 실패:",
        pending: "진행중 구매주문 목록 조회 실패:",
        list: "구매주문 목록 조회 실패:",
        sellerWallet: "판매자 지갑 잔고 조회 실패:",
      },
      pending: {
        eyebrow: "Live Pending",
        title: "진행중 구매주문 목록",
        statusesLine: "ordered / accepted / paymentRequested",
        empty: "[IDLE] 슬롯에 올라온 진행중 주문이 없습니다.",
        actionDockEyebrow: "Action Dock",
        adminLockTitle: "수동입금확인 관리자 잠금",
        adminDisabledHelp:
          "`REALTIME_BUYORDER_ADMIN_PASSWORD` 환경변수를 설정하면 이 화면에서도 지갑 연결 없이 수동입금확인이 가능합니다.",
        passwordPlaceholder: "관리자 비밀번호",
        checking: "확인중...",
        unlock: "잠금해제",
        enabled: "수동입금확인 활성화됨",
        sessionExpires: "session expires",
        logout: "잠금종료",
        manualDepositButton: "수동입금",
        manualChecking: "확인중...",
      },
      list: {
        title: "구매주문 목록",
        total: (count) => `총 ${count}건`,
        allStatus: "전체 상태",
        searchPlaceholder: "tradeId/입금자 검색",
        loading: "[LOADING] 목록을 불러오는 중...",
        empty: "[EMPTY] 조건에 맞는 주문이 없습니다.",
      },
      log: {
        title: "실시간 BuyOrder 시스템 로그",
        empty: "[WAITING] 아직 수신된 이벤트가 없습니다.",
      },
      manual: {
        ariaClose: "수동입금확인 모달 닫기",
        eyebrow: "Manual Confirm",
        title: "수동입금확인",
        description:
          "지갑 연결 없이 `paymentRequested` 주문을 결제완료로 처리하고, 필요한 경우 입금내역을 수동 매칭합니다.",
        refresh: "새로고침",
        close: "닫기",
        loadingCandidates: "입금 후보를 불러오는 중입니다.",
        buyer: "구매자",
        depositAccount: "입금계좌",
        paymentMethod: "결제수단",
        orderAmount: "주문금액",
        transferScheduled: "전송예정",
        paymentRequestedAt: "결제요청시각",
        sellerBankAccount: "판매자 입금통장",
        depositBank: "입금은행",
        accountNumber: "계좌번호",
        accountHolder: "예금주",
        recommendedDate: "추천 조회일:",
        noSelectionHelp: "선택하지 않고 완료하면 입금내역 매칭 없이 주문만 결제완료 처리합니다.",
        depositCandidates: "입금 후보 목록",
        depositCandidatesHelp: "amount/name match를 우선 정렬했습니다. 다중 선택 가능, 합계가 주문금액과 같아야 매칭됩니다.",
        clearSelection: "선택해제",
        emptyDeposits: "추천 조건으로 조회된 미매칭 입금내역이 없습니다. 필요하면 선택 없이 완료할 수 있습니다.",
        amountMatched: "금액일치",
        nameMatched: "입금자일치",
        balancePrefix: "bal",
        memoPrefix: "memo",
        selectedDepositTotal: "선택 입금 합계",
        amountMatchStatus: "주문금액 일치 여부",
        noSelection: "선택 없음",
        matched: "일치",
        mismatched: "불일치",
        submitting: "처리중...",
        submit: "결제완료 처리",
        adminSessionFetchFailed: "수동입금확인 관리자 상태를 불러오지 못했습니다.",
        passwordRequired: "관리자 비밀번호를 입력해주세요.",
        unlocked: "수동입금확인 잠금이 해제되었습니다.",
        unlockFailed: "수동입금확인 잠금 해제에 실패했습니다.",
        lockedOut: "수동입금확인 잠금을 종료했습니다.",
        logoutFailed: "로그아웃 처리에 실패했습니다.",
        disabled: "REALTIME_BUYORDER_ADMIN_PASSWORD 설정이 없어 수동입금확인이 비활성화되어 있습니다.",
        unlockFirst: "Action Dock에서 관리자 잠금을 먼저 해제해주세요.",
        candidateFetchFailed: "입금 후보를 불러오지 못했습니다.",
        amountMismatch: "선택한 입금 합계와 주문 금액이 일치해야 완료할 수 있습니다.",
        submitFailed: "수동입금확인 처리에 실패했습니다.",
        partialSuccess: (matchedCount, unmatchedCount) =>
          `주문을 완료했고 입금 ${matchedCount}건만 매칭되었습니다. 미매칭 ${unmatchedCount}건은 별도 확인이 필요합니다.`,
        matchedSuccess: (matchedCount) => `주문을 완료하고 입금 ${matchedCount}건을 매칭했습니다.`,
        manualSuccess: "주문을 수동으로 결제완료 처리했습니다.",
      },
    },
  },
  en: {
    locale: "en",
    numberLocale: "en-US",
    topNav: {
      home: "Home",
      banktransfer: "Banktransfer",
      buyorder: "BuyOrder",
      settlement: "Settlement",
    },
    common: {
      live: "LIVE",
      new: "NEW",
      countdown: "COUNTDOWN",
      connection: "Connection",
      sync: "Sync",
      cursor: "Cursor",
      running: "running",
      idle: "idle",
      latestStore: "Latest Store",
      latestStatus: "Last Status",
      updated: "updated",
      initial: "Initial",
      unknownStore: "Unknown Store",
      previous: "Previous",
      next: "Next",
      page: "page",
      allStores: "All stores",
      search: "Search",
      reset: "Reset",
      copyTradeId: "Copy tradeId",
    },
    statusLabels: {
      ordered: "Ordered",
      accepted: "Accepted",
      paymentRequested: "Payment Requested",
      paymentConfirmed: "Payment Confirmed",
      paymentSettled: "Payment Settled",
      cancelled: "Cancelled",
    },
    banktransfer: {
      title: "Banktransfer Realtime Dashboard",
      description: "Public dashboard. Sender names and account numbers are masked.",
      resync: "Resync",
      resyncing: "Resyncing...",
      todayDateKst: "Today's Date (KST)",
      remainingToday: "Time Remaining Today",
      todayDepositedKst: "Today's Deposits (KST)",
      todayWithdrawnKst: "Today's Withdrawals (KST)",
      accumulated: (count) => `Total ${count}`,
      matchedEvents: "Matched Events",
      todaySummaryErrorPrefix: "Today's aggregate lookup failed:",
      metricTitle: "Transaction Metrics (Today · KST)",
      depositedCount: "Deposit Count",
      withdrawnCount: "Withdrawal Count",
      matchedSuccess: "Matched Success",
      errorEvents: "Error Events",
      logTitle: "Realtime Banktransfer System Log",
      unmatchedTitle: "Today's Unmatched Deposits (KST)",
      unmatchedCount: (count) => `Count ${count}`,
      unmatchedTotal: (amount) => `Total ${amount} KRW`,
      unmatchedEmpty: "No unmatched deposit events today.",
      sender: "Sender",
      receiver: "Receiver",
      waitingEmpty: "[WAITING] No events received yet.",
      errors: {
        resyncFailed: "Resync failed.",
        todaySummaryFailed: "Today's aggregate lookup failed",
      },
      transactionTypes: {
        deposited: "Deposit",
        withdrawn: "Withdrawal",
      },
    },
    settlement: {
      title: "Settlement Realtime Dashboard",
      description: "Shows only BuyOrder events completed as paymentSettled with settlement reference data.",
      resync: "Resync",
      totalEventsTitle: "Settlement Events",
      totalEventsSub: "Settlement-related received",
      totalUsdtTitle: "Total Settlement USDT",
      totalUsdtSub: "On-chain settlement volume",
      totalKrwTitle: "Total Settlement KRW",
      totalKrwSub: "KRW converted total",
      hashCoverageTitle: "Hash Coverage",
      monitorTitle: "Settlement Monitoring",
      monitorNote: "Tracks only completed settlement events with settlement reference information.",
      eventListTitle: "Realtime Settlement Events",
      eventListSubtitle: "Newest first",
      empty: "No settlement events received yet.",
      settled: "Settled",
      referenceReady: "Reference Ready",
      referencePending: "Reference Pending",
      buyer: "Buyer",
      store: "Store",
      table: {
        time: "Time",
        status: "Settlement Status",
        amount: "Settlement Amount",
        buyer: "Buyer",
        store: "Store",
        trace: "Settlement Trace",
      },
      previousStatus: "Previous status:",
      errors: {
        resyncFailed: "Resync failed.",
      },
      count: (count) => count,
    },
    buyorder: {
      title: "BuyOrder Realtime Dashboard",
      resync: "Resync",
      resyncing: "Resyncing...",
      todayDateKst: "Today's Date (KST)",
      remainingToday: "Time Remaining Today",
      todayConfirmedCountKst: "Today's Payment Confirmed Count (KST)",
      todayConfirmedAmountKst: "Today's Payment Confirmed Amount (KST)",
      todayPgFeeKst: "Today's PG Fee (KST)",
      sellerWalletTitle: "Seller Wallet USDT Balance (LIVE)",
      sellerWalletEmpty: "No seller.walletAddress data.",
      count: (count) => count,
      errors: {
        resyncFailed: "Resync failed.",
        todaySummaryFailed: "Today's aggregate lookup failed",
        pendingFailed: "Pending order lookup failed",
        listFailed: "Buy order list lookup failed",
        sellerWalletFailed: "Seller wallet balance lookup failed",
      },
      errorPrefixes: {
        todaySummary: "Payment-confirmed aggregate lookup failed:",
        pending: "Pending buy order list lookup failed:",
        list: "Buy order list lookup failed:",
        sellerWallet: "Seller wallet balance lookup failed:",
      },
      pending: {
        eyebrow: "Live Pending",
        title: "Pending Buy Orders",
        statusesLine: "ordered / accepted / paymentRequested",
        empty: "[IDLE] No pending orders in the reel.",
        actionDockEyebrow: "Action Dock",
        adminLockTitle: "Manual Deposit Admin Lock",
        adminDisabledHelp:
          "Set the `REALTIME_BUYORDER_ADMIN_PASSWORD` environment variable to enable manual deposit confirmation without a wallet connection on this screen.",
        passwordPlaceholder: "Admin password",
        checking: "Checking...",
        unlock: "Unlock",
        enabled: "Manual deposit confirmation enabled",
        sessionExpires: "session expires",
        logout: "Lock",
        manualDepositButton: "Manual Deposit",
        manualChecking: "Checking...",
      },
      list: {
        title: "Buy Orders",
        total: (count) => `Total ${count}`,
        allStatus: "All statuses",
        searchPlaceholder: "Search tradeId/sender",
        loading: "[LOADING] Loading orders...",
        empty: "[EMPTY] No orders match the filters.",
      },
      log: {
        title: "Realtime BuyOrder System Log",
        empty: "[WAITING] No events received yet.",
      },
      manual: {
        ariaClose: "Close manual confirm modal",
        eyebrow: "Manual Confirm",
        title: "Manual Deposit Confirmation",
        description:
          "Mark a `paymentRequested` order as payment-confirmed without a wallet connection, and manually match deposits when needed.",
        refresh: "Refresh",
        close: "Close",
        loadingCandidates: "Loading deposit candidates.",
        buyer: "Buyer",
        depositAccount: "Deposit Account",
        paymentMethod: "Payment Method",
        orderAmount: "Order Amount",
        transferScheduled: "Scheduled Transfer",
        paymentRequestedAt: "Payment Requested At",
        sellerBankAccount: "Seller Deposit Account",
        depositBank: "Deposit Bank",
        accountNumber: "Account Number",
        accountHolder: "Account Holder",
        recommendedDate: "Recommended lookup date:",
        noSelectionHelp: "If completed without selection, only the order is marked payment-confirmed without matching deposits.",
        depositCandidates: "Deposit Candidates",
        depositCandidatesHelp: "Amount/name matches are sorted first. Multiple selections are allowed, and the total must match the order amount.",
        clearSelection: "Clear",
        emptyDeposits: "No unmatched deposits found for the recommended criteria. You can complete without selecting one.",
        amountMatched: "Amount Match",
        nameMatched: "Sender Match",
        balancePrefix: "bal",
        memoPrefix: "memo",
        selectedDepositTotal: "Selected Deposit Total",
        amountMatchStatus: "Order Amount Match",
        noSelection: "No selection",
        matched: "Matched",
        mismatched: "Mismatched",
        submitting: "Processing...",
        submit: "Mark Payment Confirmed",
        adminSessionFetchFailed: "Could not load manual deposit admin status.",
        passwordRequired: "Enter the admin password.",
        unlocked: "Manual deposit confirmation is unlocked.",
        unlockFailed: "Failed to unlock manual deposit confirmation.",
        lockedOut: "Manual deposit confirmation is locked.",
        logoutFailed: "Failed to log out.",
        disabled: "Manual deposit confirmation is disabled because REALTIME_BUYORDER_ADMIN_PASSWORD is not configured.",
        unlockFirst: "Unlock admin access in Action Dock first.",
        candidateFetchFailed: "Could not load deposit candidates.",
        amountMismatch: "The selected deposit total must match the order amount before completion.",
        submitFailed: "Manual deposit confirmation failed.",
        partialSuccess: (matchedCount, unmatchedCount) =>
          `Order completed. Only ${matchedCount} deposit(s) were matched; ${unmatchedCount} unmatched deposit(s) need separate review.`,
        matchedSuccess: (matchedCount) => `Order completed and ${matchedCount} deposit(s) were matched.`,
        manualSuccess: "Order was manually marked as payment-confirmed.",
      },
    },
  },
};

export function getRealtimeCopy(lang: string | null | undefined): RealtimeCopy {
  return lang === "en" ? realtimeCopies.en : realtimeCopies.ko;
}
