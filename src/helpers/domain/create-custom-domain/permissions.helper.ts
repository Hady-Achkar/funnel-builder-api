import { $Enums } from "../../../generated/prisma-client";

export const hasPermissionToCreateDomain = (
  role: $Enums.WorkspaceRole,
  permissions: $Enums.WorkspacePermission[]
): boolean => {
  if (
    role === $Enums.WorkspaceRole.OWNER ||
    role === $Enums.WorkspaceRole.ADMIN
  ) {
    return true;
  }

  if (
    role === $Enums.WorkspaceRole.EDITOR ||
    role === $Enums.WorkspaceRole.VIEWER
  ) {
    return permissions.includes($Enums.WorkspacePermission.CREATE_DOMAINS);
  }

  return false;
};
