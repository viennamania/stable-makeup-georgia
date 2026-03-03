import AdminUserActionPanel from "../_components/admin-user-action-panel";

export default function AdminUserRegisterPage({ params }: { params: { lang: string } }) {
  return <AdminUserActionPanel lang={params.lang} mode="register" />;
}
