import { redirect } from "next/navigation";

import { resolveLocale } from "@/lib/i18n";

export default function LangPage({ params }: { params: { lang: string } }) {
  const lang = resolveLocale(params.lang);

  redirect(`/${lang}/homepage`);
}
