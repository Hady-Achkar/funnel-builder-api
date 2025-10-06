import { getPrisma } from "../../lib/prisma";
import { WorkspacePermissions } from "../../helpers/workspace-permissions";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../errors";

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

/**
 * Validates that a workspace exists by its slug and returns the workspace with members and owner.
 *
 * @param workspaceSlug - The unique slug identifier of the workspace to validate
 * @returns A promise that resolves to the workspace with members and owner information
 * @throws {NotFoundError} When no workspace is found with the provided slug
 * @example
 * const workspace = await validateWorkspaceExists("my-workspace-slug");
 * console.log(workspace.name); // "My Workspace"
 */
export async function validateWorkspaceExists(
  workspaceSlug: string
): Promise<WorkspaceWithMembers> {
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

/**
 * Validates that a user has permission to invite members to a workspace.
 * Workspace owners always have permission. Other members must have the INVITE_MEMBERS permission.
 *
 * @param workspace - The workspace with members and owner information
 * @param inviterUserId - The ID of the user attempting to invite members
 * @returns void
 * @throws {ForbiddenError} When the user is not a member of the workspace
 * @throws {ForbiddenError} When the user doesn't have permission to invite members
 * @example
 * validateInviterPermissions(workspace, 123);
 * // Throws error if user 123 cannot invite members
 */
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

/**
 * Validates that an invitation request is valid by ensuring the workspace owner
 * cannot be invited as a member of their own workspace.
 *
 * @param userToInvite - The user to be invited, or null if the user doesn't exist yet
 * @param workspaceOwnerId - The ID of the workspace owner
 * @returns void
 * @throws {BadRequestError} When attempting to invite the workspace owner as a member
 * @example
 * validateInvitationRequest({ id: 456 }, 123);
 * // No error - different user
 *
 * validateInvitationRequest({ id: 123 }, 123);
 * // Throws BadRequestError - cannot invite owner
 */
export function validateInvitationRequest(
  userToInvite: { id: number } | null,
  workspaceOwnerId: number
): void {
  if (userToInvite && userToInvite.id === workspaceOwnerId) {
    throw new BadRequestError("Cannot invite the workspace owner as a member");
  }
}
