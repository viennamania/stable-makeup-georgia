'use client';

import StoreClearanceManagementPage from "../store/clearance-management/page";

export default function AdminClearanceManagementPage({ params }: any) {
  return (
    <StoreClearanceManagementPage
      params={{
        ...params,
        historyOnly: true,
      }}
    />
  );
}
