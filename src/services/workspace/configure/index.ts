import { getPrisma } from "../../../lib/prisma";
import { $Enums } from "../../../generated/prisma-client";
import { ZodError } from "zod";
import { configureWorkspaceRequest } from "../../../types/workspace/configure";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager";
import { RoleChangeContext } from "../../../utils/workspace-utils/workspace-permission-manager/types";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../errors/http-errors";

export const configureWorkspace = async (
  requesterId: number,
  data: any
): Promise<{ message: string }> => {
  try {
    if (!requesterId) throw new BadRequestError("Requester ID is required");

    const validatedData = configureWorkspaceRequest.parse(data);
    const {
      workspaceSlug,
      memberId,
      newRole,
      addPermissions,
      removePermissions,
    } = validatedData;

    const prisma = getPrisma();

    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
      select: {
        id: true,
        name: true,
        ownerId: true,
      },
    });

    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    const isOwner = workspace.ownerId === requesterId;
    let requesterRole: $Enums.WorkspaceRole;
    let requesterPermissions: $Enums.WorkspacePermission[] = [];

    if (isOwner) {
      requesterRole = $Enums.WorkspaceRole.OWNER;
    } else {
      const requesterMember = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: requesterId,
            workspaceId: workspace.id,
          },
        },
        select: {
          role: true,
          permissions: true,
        },
      });

      if (!requesterMember) {
        throw new ForbiddenError("You don't have access to this workspace");
      }

      requesterRole = requesterMember.role;
      requesterPermissions = requesterMember.permissions;
    }

    // Get target member (only if memberId is provided)
    let targetMember = null;
    if (memberId) {
      targetMember = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: memberId,
            workspaceId: workspace.id,
          },
        },
        select: {
          id: true,
          userId: true,
          role: true,
          permissions: true,
          joinedAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!targetMember) {
        throw new NotFoundError("Target member not found in workspace");
      }
    }

    let updatedMember = { ...targetMember };
    const changes = {
      roleChanged: false,
      permissionsAdded: [] as $Enums.WorkspacePermission[],
      permissionsRemoved: [] as $Enums.WorkspacePermission[],
    };

    // Handle role change (only if targetMember exists)
    if (targetMember && newRole && newRole !== targetMember.role) {
      const roleChangeContext: RoleChangeContext = {
        requesterId,
        requesterRole,
        requesterPermissions,
        targetMemberId: memberId,
        targetRole: targetMember.role,
        newRole,
        isOwner,
      };

      // Validate role change using PermissionManager
      const validation = PermissionManager.validateRoleChange(roleChangeContext);

      if (!validation.valid) {
        throw new ForbiddenError(
          validation.reason || "You don't have permission to modify this member's role"
        );
      }

      // Update role
      await prisma.workspaceMember.update({
        where: { id: targetMember.id },
        data: { role: newRole },
      });

      updatedMember.role = newRole;
      changes.roleChanged = true;
    }

    // Handle permission changes (only if targetMember exists)
    if (targetMember && (addPermissions?.length || removePermissions?.length)) {
      const permissionChangeContext = {
        requesterId,
        requesterRole,
        requesterPermissions,
        targetMemberId: memberId,
        targetRole: updatedMember.role, // Use updated role if it was changed
        permissionsToAdd: addPermissions || [],
        permissionsToRemove: removePermissions || [],
        isOwner,
      };

      // Validate permission change using PermissionManager
      const validation = PermissionManager.validatePermissionChange(permissionChangeContext);

      if (!validation.valid) {
        throw new ForbiddenError(
          validation.reason || "You don't have permission to modify member permissions"
        );
      }

      // Calculate new permissions
      let newPermissions = [...updatedMember.permissions];

      if (addPermissions?.length) {
        addPermissions.forEach((permission) => {
          if (!newPermissions.includes(permission)) {
            newPermissions.push(permission);
            changes.permissionsAdded.push(permission);
          }
        });
      }

      if (removePermissions?.length) {
        removePermissions.forEach((permission) => {
          const index = newPermissions.indexOf(permission);
          if (index > -1) {
            newPermissions.splice(index, 1);
            changes.permissionsRemoved.push(permission);
          }
        });
      }

      // Update permissions
      if (
        changes.permissionsAdded.length ||
        changes.permissionsRemoved.length
      ) {
        await prisma.workspaceMember.update({
          where: { id: targetMember.id },
          data: { permissions: newPermissions },
        });

        updatedMember.permissions = newPermissions;
      }
    }

    const response = {
      message: "Workspace configuration updated successfully",
    };

    return response;
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
