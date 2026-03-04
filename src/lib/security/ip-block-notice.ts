export type IpBlockNoticeLang = "ko" | "en" | "ja" | "zh";

type IpBlockNoticeContent = {
  title: string;
  subtitle: string;
  legalNotice: string;
  detail: string;
  contact: string;
};

export const IP_BLOCK_NOTICE_BY_LANG: Record<
  IpBlockNoticeLang,
  IpBlockNoticeContent
> = {
  ko: {
    title: "접근이 차단되었습니다",
    subtitle: "보안 정책에 의해 이 IP 주소의 접근이 제한되었습니다.",
    legalNotice: "해당 IP 주소는 형사처벌 대상 신고 완료 상태입니다.",
    detail: "동일 IP에서 비정상 호출이 감지되어 전체 페이지 접근이 차단되었습니다.",
    contact: "정상 사용자라면 운영팀에 즉시 문의해 주세요.",
  },
  en: {
    title: "Access Blocked",
    subtitle: "Access from this IP address is restricted by security policy.",
    legalNotice: "This IP address has been reported for criminal prosecution.",
    detail:
      "Abnormal requests were detected from this IP and all page access has been blocked.",
    contact: "If you are a legitimate user, contact the operations team immediately.",
  },
  ja: {
    title: "アクセスがブロックされました",
    subtitle: "セキュリティポリシーにより、このIPアドレスからのアクセスは制限されています。",
    legalNotice: "このIPアドレスは刑事処罰対象として通報済みです。",
    detail:
      "このIPから異常なリクエストが検知されたため、全ページへのアクセスが遮断されました。",
    contact: "正当な利用者の場合は、運営チームへ直ちにお問い合わせください。",
  },
  zh: {
    title: "访问已被拦截",
    subtitle: "根据安全策略，此IP地址的访问已被限制。",
    legalNotice: "该IP地址已被举报并进入刑事处罚处理流程。",
    detail: "系统检测到该IP存在异常请求，已阻断其对全部页面的访问。",
    contact: "如为正常用户，请立即联系运营团队。",
  },
};

const normalizeLangText = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase();
};

const mapAnyLangToNoticeLang = (langText: string): IpBlockNoticeLang | null => {
  if (!langText) {
    return null;
  }

  if (langText.startsWith("ko")) {
    return "ko";
  }
  if (langText.startsWith("ja") || langText.startsWith("jp")) {
    return "ja";
  }
  if (langText.startsWith("zh")) {
    return "zh";
  }
  if (langText.startsWith("en")) {
    return "en";
  }

  return null;
};

export const resolveIpBlockNoticeLang = (
  inputLang: unknown,
  fallback: IpBlockNoticeLang = "en",
): IpBlockNoticeLang => {
  const normalized = normalizeLangText(inputLang);
  const mapped = mapAnyLangToNoticeLang(normalized);
  return mapped || fallback;
};

export const detectIpBlockNoticeLangFromAcceptLanguage = (
  acceptLanguageHeader: unknown,
  fallback: IpBlockNoticeLang = "en",
): IpBlockNoticeLang => {
  const header = normalizeLangText(acceptLanguageHeader);
  if (!header) {
    return fallback;
  }

  const tokens = header.split(",").map((segment) => {
    const [langPart] = segment.split(";");
    return normalizeLangText(langPart);
  });

  for (const token of tokens) {
    const mapped = mapAnyLangToNoticeLang(token);
    if (mapped) {
      return mapped;
    }
  }

  return fallback;
};
