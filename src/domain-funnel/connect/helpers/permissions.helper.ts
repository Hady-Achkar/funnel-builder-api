import { $Enums } from "../../../generated/prisma-client";
import { validateWorkspaceAccess } from "../../../domain/shared/helpers";

export const validateConnectFunnelDomainAccess = async (
  userId: number,
  workspaceId: number
) => {
  return await validateWorkspaceAccess(userId, workspaceId, [
    $Enums.WorkspacePermission.CONNECT_DOMAINS,
  ]);
};