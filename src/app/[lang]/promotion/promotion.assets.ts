export type PromotionLocale = "ko" | "en";

export type PromotionCopy = {
  locale: PromotionLocale;
  numberLocale: string;
  connectButtonLocale: "ko_KR" | "en_US";
  units: {
    count: string;
  };
  common: {
    live: string;
    unknownStore: string;
    running: string;
    idle: string;
  };
  errors: {
    walletTransferFetchFailed: string;
    resyncFailed: string;
  };
  transactionTypes: {
    deposited: string;
    withdrawn: string;
  };
  buyStatuses: {
    ordered: string;
    accepted: string;
    paymentRequested: string;
    paymentConfirmed: string;
    paymentSettled: string;
    cancelled: string;
  };
  wallet: {
    title: string;
    subtitle: string;
    copyShort: string;
    copied: string;
    collapse: string;
    expand: string;
    connectLabel: string;
    disconnectedHelp: string;
    connectedWallet: string;
    copyAddress: string;
    disconnect: string;
    tabs: {
      deposit: string;
      withdraw: string;
      history: string;
    };
    depositAddress: string;
    walletAddress: string;
    depositHelp: string;
    withdrawTitle: string;
    withdrawHelp: string;
    openWithdraw: string;
    transferHistory: string;
    refresh: string;
    loadingHistory: string;
    emptyHistory: string;
    counterparty: string;
  };
  hero: {
    liveCaption: string;
    vaspBadge: string;
    titleLead: string;
    titleRest: string;
    description: string;
    badges: string[];
    ctas: {
      settlement: string;
      buyOrder: string;
      banktransfer: string;
    };
    member: {
      registeredLabel: string;
      signupLabel: string;
      loading: string;
      registeredFallbackName: string;
      registeredMessage: (nickname: string) => string;
      signupMessage: string;
      editButton: string;
      signupButton: string;
    };
    status: {
      connection: string;
      sync: string;
      lastUpdate: string;
    };
  };
  kpi: {
    settlementUsdtTitle: string;
    settlementCompletedPrefix: string;
    settlementUsdtRatioPrefix: string;
    platformUsdtTitle: string;
    platformUsdtDescription: string;
    settlementEventRatioTitle: string;
    settlementEventRatioDescription: string;
  };
  scan: {
    badges: string[];
    title: string;
    description: string;
    cards: Array<{
      id: string;
      title: string;
      description: string;
    }>;
    destination: string;
    whatYouGet: string;
    benefits: string[];
    openExplorer: string;
    openIntegrations: string;
  };
  settlement: {
    tag: string;
    eyebrow: string;
    title: string;
    description: string;
    eventPrefix: string;
    ratioPrefix: string;
    realtimeLog: string;
    latestTitle: string;
    latestPrefix: (relativeLabel: string) => string;
    latestWaiting: string;
    countLabel: string;
    usdtLabel: string;
    dashboardCta: string;
    empty: string;
  };
  liveSections: {
    bankEyebrow: string;
    bankTitle: string;
    bankEmpty: string;
    buyEyebrow: string;
    buyTitle: string;
    buyEmpty: string;
    buyer: string;
    wallet: string;
  };
  ticker: {
    title: string;
    description: string;
    waiting: string;
    bankPrefix: string;
    buyOrderPrefix: string;
    settlementPrefix: string;
  };
};

export const promotionCopies: Record<PromotionLocale, PromotionCopy> = {
  ko: {
    locale: "ko",
    numberLocale: "ko-KR",
    connectButtonLocale: "ko_KR",
    units: {
      count: "건",
    },
    common: {
      live: "LIVE",
      unknownStore: "Unknown Store",
      running: "running",
      idle: "idle",
    },
    errors: {
      walletTransferFetchFailed: "전송내역 조회에 실패했습니다.",
      resyncFailed: "재동기화에 실패했습니다.",
    },
    transactionTypes: {
      deposited: "입금",
      withdrawn: "출금",
    },
    buyStatuses: {
      ordered: "주문접수",
      accepted: "매칭완료",
      paymentRequested: "결제요청",
      paymentConfirmed: "결제완료",
      paymentSettled: "정산완료",
      cancelled: "취소",
    },
    wallet: {
      title: "My Wallet",
      subtitle: "고정 지갑 패널",
      copyShort: "주소복사",
      copied: "복사됨",
      collapse: "접기",
      expand: "열기",
      connectLabel: "지갑연결하기",
      disconnectedHelp: "로그인하면 입금(주소/QR), 출금, 전송내역을 이 패널에서 바로 확인할 수 있습니다.",
      connectedWallet: "Connected Wallet",
      copyAddress: "주소 복사",
      disconnect: "연결해제",
      tabs: {
        deposit: "입금",
        withdraw: "출금",
        history: "전송내역",
      },
      depositAddress: "Deposit Address",
      walletAddress: "Wallet Address",
      depositHelp: "위 주소와 QR 코드로 입금하면 됩니다.",
      withdrawTitle: "Withdraw",
      withdrawHelp: "출금은 전용 화면에서 진행합니다. 연결된 지갑 주소 기준으로 진행하세요.",
      openWithdraw: "출금 화면 열기",
      transferHistory: "Transfer History",
      refresh: "새로고침",
      loadingHistory: "전송내역을 불러오는 중입니다.",
      emptyHistory: "표시할 전송내역이 없습니다.",
      counterparty: "상대",
    },
    hero: {
      liveCaption: "VASP Operated Realtime Hub",
      vaspBadge: "VASP 운영",
      titleLead: "VASP 운영",
      titleRest: "기반 USDT 정산 플랫폼",
      description:
        "입출금, 주문, 정산 상태를 한 화면에서 확인하는 실시간 USDT 운영 홈입니다. 핵심 지표와 최근 이벤트를 컴팩트하게 제공합니다.",
      badges: ["VASP 운영 모니터링", "USDT 온체인 정산 추적"],
      ctas: {
        settlement: "정산 라이브 보기",
        buyOrder: "BuyOrder 라이브 보기",
        banktransfer: "입출금 라이브 보기",
      },
      member: {
        registeredLabel: "Member Registered",
        signupLabel: "Member Signup",
        loading: "회원 상태를 확인하는 중입니다.",
        registeredFallbackName: "회원",
        registeredMessage: (nickname) =>
          `${nickname}님, 가입이 완료되었습니다. 회원정보를 수정하려면 이동하세요.`,
        signupMessage: "지갑 연결 완료. 회원가입에서 닉네임/아바타/연락처를 등록하세요.",
        editButton: "회원정보 수정",
        signupButton: "회원가입",
      },
      status: {
        connection: "Connection",
        sync: "Sync",
        lastUpdate: "Last Update",
      },
    },
    kpi: {
      settlementUsdtTitle: "핵심 지표 | Settlement USDT",
      settlementCompletedPrefix: "정산완료",
      settlementUsdtRatioPrefix: "USDT 기준 비중",
      platformUsdtTitle: "플랫폼 USDT",
      platformUsdtDescription: "BuyOrder 누적 유동량",
      settlementEventRatioTitle: "정산 이벤트 비중",
      settlementEventRatioDescription: "BuyOrder 이벤트 대비",
    },
    scan: {
      badges: ["Scan Explorer", "Realtime Transfer Trace"],
      title: "프로모션 흐름을 확인했다면 실시간 전송내역으로 바로 이어서 보세요",
      description:
        "프로모션 참여, 출금, 지갑 연결 이후에는 Scan Explorer에서 실제 USDT 이동 내역과 지갑 흐름을 바로 확인할 수 있습니다. 참여 흐름과 온체인 추적을 한 화면 흐름처럼 연결합니다.",
      cards: [
        {
          id: "scan-route-live",
          title: "실시간 전송내역",
          description: "최신 전송 흐름과 감시 지갑 활동을 확인합니다.",
        },
        {
          id: "scan-route-address",
          title: "지갑 상세 추적",
          description: "주소별 이동 이력과 배치 전송을 개별로 추적합니다.",
        },
        {
          id: "scan-route-proof",
          title: "온체인 검증",
          description: "BscScan 기반 트랜잭션 링크로 실제 체인 상태를 연결합니다.",
        },
      ],
      destination: "Destination",
      whatYouGet: "What you get",
      benefits: ["실시간 USDT 전송내역 확인", "주소별 전송 히스토리 이동", "트랜잭션 상세와 BscScan 연결"],
      openExplorer: "Scan Explorer 열기",
      openIntegrations: "연동 구조 보기",
    },
    settlement: {
      tag: "SETTLEMENT",
      eyebrow: "Settlement Spotlight",
      title: "정산 상태를 우선 노출하는 실시간 공시 카드",
      description: "최근 정산 건수, 금액, 처리 시점을 핵심만 요약해 제공합니다.",
      eventPrefix: "정산 이벤트",
      ratioPrefix: "정산 비중",
      realtimeLog: "Realtime Settlement Log",
      latestTitle: "최신 정산 이벤트 즉시 확인",
      latestPrefix: (relativeLabel) => `최근 정산 이벤트 ${relativeLabel}`,
      latestWaiting: "최근 정산 이벤트 대기 중",
      countLabel: "Settlement Count",
      usdtLabel: "Settlement USDT",
      dashboardCta: "정산 대시보드 바로가기",
      empty: "수신된 정산 이벤트가 없습니다.",
    },
    liveSections: {
      bankEyebrow: "Banktransfer Live",
      bankTitle: "입출금 실시간 하이라이트",
      bankEmpty: "아직 수신된 입출금 이벤트가 없습니다.",
      buyEyebrow: "BuyOrder USDT Live",
      buyTitle: "USDT 주문 상태 하이라이트",
      buyEmpty: "아직 수신된 BuyOrder 이벤트가 없습니다.",
      buyer: "Buyer",
      wallet: "Wallet",
    },
    ticker: {
      title: "실시간 이벤트 티커",
      description: "입출금/주문/정산 이벤트를 순환 표시합니다.",
      waiting: "실시간 이벤트 대기 중입니다. 잠시 후 자동으로 갱신됩니다.",
      bankPrefix: "Bank",
      buyOrderPrefix: "BuyOrder",
      settlementPrefix: "Settlement",
    },
  },
  en: {
    locale: "en",
    numberLocale: "en-US",
    connectButtonLocale: "en_US",
    units: {
      count: " cases",
    },
    common: {
      live: "LIVE",
      unknownStore: "Unknown Store",
      running: "running",
      idle: "idle",
    },
    errors: {
      walletTransferFetchFailed: "Failed to load transfer history.",
      resyncFailed: "Failed to resync events.",
    },
    transactionTypes: {
      deposited: "Deposit",
      withdrawn: "Withdraw",
    },
    buyStatuses: {
      ordered: "Ordered",
      accepted: "Matched",
      paymentRequested: "Payment Requested",
      paymentConfirmed: "Payment Confirmed",
      paymentSettled: "Settled",
      cancelled: "Cancelled",
    },
    wallet: {
      title: "My Wallet",
      subtitle: "Pinned wallet panel",
      copyShort: "Copy",
      copied: "Copied",
      collapse: "Collapse",
      expand: "Open",
      connectLabel: "Connect Wallet",
      disconnectedHelp: "After login, deposits, withdrawals, and transfer history are available in this panel.",
      connectedWallet: "Connected Wallet",
      copyAddress: "Copy Address",
      disconnect: "Disconnect",
      tabs: {
        deposit: "Deposit",
        withdraw: "Withdraw",
        history: "History",
      },
      depositAddress: "Deposit Address",
      walletAddress: "Wallet Address",
      depositHelp: "Deposit to the address above or scan the QR code.",
      withdrawTitle: "Withdraw",
      withdrawHelp: "Withdrawals are handled on the dedicated screen using the connected wallet address.",
      openWithdraw: "Open Withdraw",
      transferHistory: "Transfer History",
      refresh: "Refresh",
      loadingHistory: "Loading transfer history.",
      emptyHistory: "No transfers to display.",
      counterparty: "Counterparty",
    },
    hero: {
      liveCaption: "VASP Operated Realtime Hub",
      vaspBadge: "VASP Operated",
      titleLead: "VASP-operated",
      titleRest: "USDT Settlement Platform",
      description:
        "A realtime USDT operations home for deposits, orders, and settlement status in one screen. Core metrics and recent events stay compact and easy to scan.",
      badges: ["VASP Operations Monitoring", "USDT On-chain Settlement Tracking"],
      ctas: {
        settlement: "View Settlement Live",
        buyOrder: "View BuyOrder Live",
        banktransfer: "View Banktransfer Live",
      },
      member: {
        registeredLabel: "Member Registered",
        signupLabel: "Member Signup",
        loading: "Checking member status.",
        registeredFallbackName: "Member",
        registeredMessage: (nickname) =>
          `${nickname}, your signup is complete. Open member settings to edit your profile.`,
        signupMessage: "Wallet connected. Register nickname, avatar, and contact details in member signup.",
        editButton: "Edit Member Info",
        signupButton: "Sign Up",
      },
      status: {
        connection: "Connection",
        sync: "Sync",
        lastUpdate: "Last Update",
      },
    },
    kpi: {
      settlementUsdtTitle: "Core Metric | Settlement USDT",
      settlementCompletedPrefix: "Settled",
      settlementUsdtRatioPrefix: "USDT share",
      platformUsdtTitle: "Platform USDT",
      platformUsdtDescription: "Cumulative BuyOrder liquidity",
      settlementEventRatioTitle: "Settlement Event Ratio",
      settlementEventRatioDescription: "Compared with BuyOrder events",
    },
    scan: {
      badges: ["Scan Explorer", "Realtime Transfer Trace"],
      title: "After checking promotion activity, continue directly to realtime transfer history",
      description:
        "After promotion signup, withdrawals, or wallet connection, Scan Explorer lets you inspect actual USDT movements and wallet flows. Participation and on-chain tracking stay connected in one flow.",
      cards: [
        {
          id: "scan-route-live",
          title: "Realtime Transfers",
          description: "Check the latest transfer flow and monitored wallet activity.",
        },
        {
          id: "scan-route-address",
          title: "Wallet Detail Tracking",
          description: "Trace address-level movement history and batch transfers individually.",
        },
        {
          id: "scan-route-proof",
          title: "On-chain Verification",
          description: "Open BscScan transaction links to verify the actual chain status.",
        },
      ],
      destination: "Destination",
      whatYouGet: "What you get",
      benefits: ["Realtime USDT transfer history", "Address-level transfer history", "Transaction details with BscScan links"],
      openExplorer: "Open Scan Explorer",
      openIntegrations: "View Integration Structure",
    },
    settlement: {
      tag: "SETTLEMENT",
      eyebrow: "Settlement Spotlight",
      title: "Realtime disclosure card prioritizing settlement status",
      description: "Recent settlement counts, amounts, and processing time are summarized at a glance.",
      eventPrefix: "Settlement events",
      ratioPrefix: "Settlement ratio",
      realtimeLog: "Realtime Settlement Log",
      latestTitle: "Check the latest settlement event immediately",
      latestPrefix: (relativeLabel) => `Latest settlement event ${relativeLabel}`,
      latestWaiting: "Waiting for settlement events",
      countLabel: "Settlement Count",
      usdtLabel: "Settlement USDT",
      dashboardCta: "Open Settlement Dashboard",
      empty: "No settlement events received.",
    },
    liveSections: {
      bankEyebrow: "Banktransfer Live",
      bankTitle: "Realtime Banktransfer Highlights",
      bankEmpty: "No banktransfer events received yet.",
      buyEyebrow: "BuyOrder USDT Live",
      buyTitle: "USDT Order Status Highlights",
      buyEmpty: "No BuyOrder events received yet.",
      buyer: "Buyer",
      wallet: "Wallet",
    },
    ticker: {
      title: "Realtime Event Ticker",
      description: "Banktransfer, order, and settlement events rotate here.",
      waiting: "Waiting for realtime events. This updates automatically shortly.",
      bankPrefix: "Bank",
      buyOrderPrefix: "BuyOrder",
      settlementPrefix: "Settlement",
    },
  },
};

export function getPromotionCopy(lang: string | null | undefined): PromotionCopy {
  return lang === "en" ? promotionCopies.en : promotionCopies.ko;
}
