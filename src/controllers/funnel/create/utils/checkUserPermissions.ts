import {
  User,
  WorkspaceRole,
  WorkspacePermission,
  Workspace,
  $Enums,
} from "../../../../generated/prisma-client";
import { getPrisma } from "../../../../lib/prisma";

export const checkUserCanCreateFunnel = async (
  userId: Pick<User, "id">["id"],
  workspaceSlug: Pick<Workspace, "slug">["slug"]
): Promise<boolean> => {
  const prisma = getPrisma();

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: {
        where: { userId },
      },
    },
  });

  if (!workspace) {
    return false;
  }

  const member = workspace.members[0];
  if (!member) {
    return false;
  }

  const role: $Enums.WorkspaceRole = member.role;
  const isOwner = role === WorkspaceRole.OWNER;
  const isAdmin = role === WorkspaceRole.ADMIN;
  const hasCreatePermission = member.permissions.includes(
    WorkspacePermission.CREATE_FUNNELS
  );

  return isOwner || isAdmin || hasCreatePermission;
};
