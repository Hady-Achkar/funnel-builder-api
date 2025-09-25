import { getPrisma } from "../../../lib/prisma";
import { WorkspacePermissions } from "../../workspace-permissions";
import { AllocationService } from "../../../utils/allocations";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../errors";

export interface WorkspaceWithMembers {
  id: number;
  name: string;
  slug: string;
  ownerId: number;
  members: Array<{
    userId: number;
    role: string;
    permissions: string[];
    user: {
      id: number;
      email: string;
    };
  }>;
  owner: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export async function validateWorkspaceExists(workspaceSlug: string): Promise<WorkspaceWithMembers> {
  const prisma = getPrisma();

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      },
      owner: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (!workspace) {
    throw new NotFoundError("Workspace not found");
  }

  return workspace as WorkspaceWithMembers;
}

export function validateInviterPermissions(
  workspace: WorkspaceWithMembers,
  inviterUserId: number
): void {
  // Check if inviter is owner
  const isOwner = workspace.ownerId === inviterUserId;

  if (isOwner) {
    return; // Owner can always invite
  }

  // Find inviter's membership
  const inviterMember = workspace.members.find(
    (member) => member.userId === inviterUserId
  );

  if (!inviterMember) {
    throw new ForbiddenError("You are not a member of this workspace");
  }

  // Check if member has permission to invite
  if (
    !WorkspacePermissions.canInviteMembers({
      role: inviterMember.role as any,
      permissions: inviterMember.permissions as any,
    })
  ) {
    throw new ForbiddenError("You don't have permission to invite members");
  }
}

export async function validateMemberAllocationLimit(
  workspaceOwnerId: number,
  workspaceId: number
): Promise<void> {
  const canAddMember = await AllocationService.canAddMember(
    workspaceOwnerId,
    workspaceId
  );

  if (!canAddMember) {
    throw new BadRequestError(
      "Cannot add more members. Workspace member limit reached."
    );
  }
}

export function validateInvitationRequest(
  userToInvite: { id: number } | null,
  workspaceOwnerId: number
): void {
  if (userToInvite && userToInvite.id === workspaceOwnerId) {
    throw new BadRequestError(
      "Cannot invite the workspace owner as a member"
    );
  }
}

export async function checkExistingMembership(
  userId: number,
  workspaceId: number
): Promise<void> {
  const prisma = getPrisma();

  const existingMember = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (existingMember) {
    throw new BadRequestError("User is already a member of this workspace");
  }
}