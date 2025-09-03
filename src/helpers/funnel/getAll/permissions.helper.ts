import { $Enums } from "../../../generated/prisma-client";

export const hasPermissionToViewFunnels = (
  role: $Enums.WorkspaceRole
): boolean => {
  if (
    role === $Enums.WorkspaceRole.OWNER ||
    role === $Enums.WorkspaceRole.ADMIN ||
    role === $Enums.WorkspaceRole.EDITOR ||
    role === $Enums.WorkspaceRole.VIEWER
  ) {
    return true;
  }
  return false;
};