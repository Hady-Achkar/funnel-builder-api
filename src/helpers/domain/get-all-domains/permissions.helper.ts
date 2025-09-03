import { $Enums } from "../../../generated/prisma-client";
import { validateWorkspaceAccess } from "../shared";

export const validateGetAllDomainsAccess = async (
  userId: number,
  workspaceId: number
) => {
  return await validateWorkspaceAccess(userId, workspaceId, [
    $Enums.WorkspacePermission.MANAGE_DOMAINS,
    $Enums.WorkspacePermission.CONNECT_DOMAINS,
    $Enums.WorkspacePermission.DELETE_DOMAINS,
  ]);
};