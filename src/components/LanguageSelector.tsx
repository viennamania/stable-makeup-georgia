'use client';

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  buildLocalizedPathname,
  DEFAULT_LOCALE,
  getLocaleFromPathname,
  isSupportedLocale,
  LOCALE_COOKIE_NAME,
  type SupportedLocale,
} from "@/lib/i18n";
import { langs } from "@/utils/langs";

type LanguageSelectorProps = {
  className?: string;
  variant?: "floating" | "inline";
};

const getCookieLocale = () => {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${LOCALE_COOKIE_NAME}=`));
  const value = match?.split("=")[1];

  return isSupportedLocale(value) ? value : null;
};

const setCookieLocale = (locale: SupportedLocale) => {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
};

const setGoogleTranslateLocale = (locale: SupportedLocale) => {
  if (typeof document === "undefined") {
    return;
  }

  if (locale === "en") {
    document.cookie = "googtrans=/ko/en; path=/; max-age=31536000; SameSite=Lax";
    return;
  }

  document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
};

const LanguageSelector = ({
  className = "",
  variant = "floating",
}: LanguageSelectorProps) => {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const pathLocale = getLocaleFromPathname(pathname);
  const initialLocale = pathLocale || DEFAULT_LOCALE;
  const [selectedLocale, setSelectedLocale] =
    React.useState<SupportedLocale>(initialLocale);

  React.useEffect(() => {
    const nextLocale =
      pathLocale ||
      getCookieLocale() ||
      DEFAULT_LOCALE;
    setSelectedLocale(nextLocale);
  }, [pathLocale, pathname]);

  const handleLangChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value;
    if (!isSupportedLocale(nextLocale)) {
      return;
    }

    setCookieLocale(nextLocale);
    setGoogleTranslateLocale(nextLocale);
    setSelectedLocale(nextLocale);

    const nextPathname = buildLocalizedPathname(pathname, nextLocale);
    const nextSearchParams = new URLSearchParams(
      typeof window === "undefined" ? "" : window.location.search,
    );

    if (getLocaleFromPathname(nextPathname)) {
      nextSearchParams.delete("lang");
    } else {
      nextSearchParams.set("lang", nextLocale);
    }

    const queryString = nextSearchParams.toString();
    const nextUrl = `${nextPathname}${queryString ? `?${queryString}` : ""}`;

    if (typeof window !== "undefined") {
      window.location.assign(nextUrl);
      return;
    }

    router.push(nextUrl);
  };

  const wrapperClassName =
    variant === "floating"
      ? "fixed bottom-4 right-4 z-[9999] flex items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur"
      : "flex items-center gap-2";

  return (
    <div className={`${wrapperClassName} notranslate ${className}`} translate="no">
      <span className="text-xs font-semibold text-slate-600">
        {selectedLocale === "ko" ? "언어" : "Language"}
      </span>
      <select
        aria-label="Change language"
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        value={selectedLocale}
        onChange={handleLangChange}
      >
        {langs.map((lang) => (
          <option key={lang.lang} value={lang.lang}>
            {lang.fullName}
          </option>
        ))}
      </select>
    </div>
  );
};

LanguageSelector.displayName = "LanguageSelector";

export default LanguageSelector;
