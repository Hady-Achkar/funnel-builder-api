import { $Enums } from "../../../generated/prisma-client";
import { validateWorkspaceAccess } from "../shared";

export const validateVerifyAccess = async (
  userId: number,
  workspaceId: number
) => {
  return await validateWorkspaceAccess(userId, workspaceId, [
    $Enums.WorkspacePermission.CREATE_DOMAINS,
    $Enums.WorkspacePermission.MANAGE_DOMAINS,
  ]);
};