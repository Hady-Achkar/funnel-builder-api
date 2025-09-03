import { WorkspaceRole, WorkspacePermission } from "../../../generated/prisma-client";

export const hasPermissionToEditFunnelSettings = (
  role: WorkspaceRole,
  permissions: WorkspacePermission[]
): boolean => {
  if (role === "OWNER" || role === "ADMIN") {
    return true;
  }

  if (role === "EDITOR" || role === "VIEWER") {
    return permissions.includes("EDIT_FUNNELS");
  }

  return false;
};