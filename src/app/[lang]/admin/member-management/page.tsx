import { redirect } from "next/navigation";

const buildQueryString = (searchParams: Record<string, string | string[] | undefined>) => {
  const query = new URLSearchParams();

  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item != null) {
          query.append(key, item);
        }
      });
      return;
    }

    if (value != null) {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

export default function MemberManagementPage({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  redirect(`/${params.lang}/admin/member${buildQueryString(searchParams)}`);
}
