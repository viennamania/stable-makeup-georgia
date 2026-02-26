import { redirect } from "next/navigation";

export default function AdminRealtimeBanktransferPageRedirect({
  params,
}: {
  params: { lang: string };
}) {
  redirect(`/${params.lang}/realtime-banktransfer`);
}
