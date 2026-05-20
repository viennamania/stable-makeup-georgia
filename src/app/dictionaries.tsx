import { DEFAULT_LOCALE, resolveLocale, type SupportedLocale } from "@/lib/i18n";

const dictionaries: Record<SupportedLocale, () => Promise<any>> = {
    ko: () => import("./dictionaries/ko.json").then((module) => module.default),
    en: () => import("./dictionaries/en.json").then((module) => module.default),
};

export const getDictionary = async (locale: unknown = DEFAULT_LOCALE) =>
    dictionaries[resolveLocale(locale)]();
