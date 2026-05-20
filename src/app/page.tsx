import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";

export default function Page() {
  const preferredLocale = resolveLocale(
    cookies().get(LOCALE_COOKIE_NAME)?.value,
    DEFAULT_LOCALE,
  );

  redirect(`/${preferredLocale}/homepage`);
}
