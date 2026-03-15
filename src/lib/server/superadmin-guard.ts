import { type VerifyAdminSignedActionParams, verifyAdminSignedAction } from "@/lib/server/admin-action-security";

export const SUPERADMIN_ROLE = "superadmin";

export const normalizeUserRole = (user: any): string => {
  return String(user?.role || user?.rold || "").trim().toLowerCase();
};

export const isSuperadminUser = (user: any): boolean => {
  return normalizeUserRole(user) === SUPERADMIN_ROLE;
};

type VerifySuperadminSignedActionParams = Omit<
  VerifyAdminSignedActionParams,
  "allowedRoles" | "requireAdminStorecode"
>;

export const verifySuperadminSignedAction = async (
  params: VerifySuperadminSignedActionParams,
) => {
  return verifyAdminSignedAction({
    ...params,
    allowedRoles: [SUPERADMIN_ROLE],
    requireAdminStorecode: false,
  });
};
