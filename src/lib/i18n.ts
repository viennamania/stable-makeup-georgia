export const SUPPORTED_LOCALES = ["ko", "en"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "ko";
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

const KNOWN_LOCALE_SEGMENTS = new Set([
  ...SUPPORTED_LOCALES,
  "ar",
  "de",
  "es",
  "fr",
  "ja",
  "zh",
]);

export const isSupportedLocale = (value: unknown): value is SupportedLocale => {
  return (
    typeof value === "string" &&
    SUPPORTED_LOCALES.includes(value as SupportedLocale)
  );
};

export const resolveLocale = (
  value: unknown,
  fallback: SupportedLocale = DEFAULT_LOCALE,
): SupportedLocale => {
  const normalized = typeof value === "string" ? value.toLowerCase() : value;
  return isSupportedLocale(normalized) ? normalized : fallback;
};

export const getLocaleFromPathname = (pathname?: string | null): SupportedLocale | null => {
  const firstSegment = pathname?.split("/").filter(Boolean)[0]?.toLowerCase();
  return isSupportedLocale(firstSegment) ? firstSegment : null;
};

export const buildLocalizedPathname = (
  pathname: string | null | undefined,
  locale: SupportedLocale,
) => {
  const normalizedPathname = pathname && pathname.startsWith("/") ? pathname : "/";
  const segments = normalizedPathname.split("/");
  const firstSegment = segments[1]?.toLowerCase();

  if (firstSegment && KNOWN_LOCALE_SEGMENTS.has(firstSegment)) {
    segments[1] = locale;
    return segments.join("/") || `/${locale}/homepage`;
  }

  if (normalizedPathname === "/") {
    return `/${locale}/homepage`;
  }

  return normalizedPathname;
};
