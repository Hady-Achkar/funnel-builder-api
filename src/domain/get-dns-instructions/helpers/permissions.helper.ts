import { $Enums } from "../../../generated/prisma-client";
import { validateWorkspaceAccess } from "../../create-custom-domain/helpers/workspace-access.helper";

export const validateDNSInstructionsAccess = async (
  userId: number,
  workspaceId: number
) => {
  return await validateWorkspaceAccess(userId, workspaceId, [
    $Enums.WorkspacePermission.CREATE_DOMAINS,
    $Enums.WorkspacePermission.MANAGE_DOMAINS,
  ]);
};