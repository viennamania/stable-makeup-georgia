import AdminUserActionPanel from "../_components/admin-user-action-panel";

export default function AdminUserSettingsPage({ params }: { params: { lang: string } }) {
  return <AdminUserActionPanel lang={params.lang} mode="settings" />;
}
