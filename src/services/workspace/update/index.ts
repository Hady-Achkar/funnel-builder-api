import { getPrisma } from "../../../lib/prisma";
import { $Enums } from "../../../generated/prisma-client";
import { ZodError } from "zod";
import {
  updateWorkspaceRequest,
  UpdateWorkspaceRequest,
  UpdateWorkspaceResponse,
  rolePermissionPresets,
} from "../../../types/workspace/update";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "../../../errors/http-errors";
import { cacheService } from "../../cache/cache.service";

export class UpdateWorkspaceService {
  static async update(
    requesterId: number,
    data: any
  ): Promise<UpdateWorkspaceResponse> {
    try {
      if (!requesterId) throw new BadRequestError("Requester ID is required");

      const validatedData = updateWorkspaceRequest.parse(data);
      const { workspaceSlug, general, members, rolePermissions, limits } =
        validatedData;

      const prisma = getPrisma();

      // Get workspace with full details
      const workspace = await prisma.workspace.findUnique({
        where: { slug: workspaceSlug },
        include: {
          owner: true,
          members: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      // Check permissions
      const isOwner = workspace.ownerId === requesterId;
      let requesterMember = null;
      let canManageWorkspace = isOwner;
      let canManageMembers = isOwner;

      if (!isOwner) {
        requesterMember = workspace.members.find(
          (m) => m.userId === requesterId
        );

        if (!requesterMember) {
          throw new ForbiddenError("You don't have access to this workspace");
        }

        // Check if requester has necessary permissions
        canManageWorkspace =
          requesterMember.role === "ADMIN" ||
          requesterMember.permissions.includes("MANAGE_WORKSPACE");
        canManageMembers =
          requesterMember.role === "ADMIN" ||
          requesterMember.permissions.includes("MANAGE_MEMBERS");
      }

      const changes = {
        general: { updated: false, fields: [] as string[] },
        members: {
          added: [] as string[],
          updated: [] as string[],
          removed: [] as string[],
        },
        permissions: {
          updated: false,
          affectedMembers: [] as number[],
        },
      };

      // Start transaction for atomic updates
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update general settings
        if (general) {
          if (!canManageWorkspace) {
            throw new ForbiddenError(
              "You don't have permission to update workspace settings"
            );
          }

          const updateData: any = {};
          if (general.name !== undefined) {
            // Check if name is already taken
            const existingWorkspace = await tx.workspace.findFirst({
              where: {
                name: general.name,
                id: { not: workspace.id },
              },
            });

            if (existingWorkspace) {
              throw new ConflictError("Workspace name is already taken");
            }

            updateData.name = general.name;
            changes.general.fields.push("name");
          }

          if (general.description !== undefined) {
            updateData.description = general.description;
            changes.general.fields.push("description");
          }

          if (general.image !== undefined) {
            updateData.image = general.image;
            changes.general.fields.push("image");
          }

          if (Object.keys(updateData).length > 0) {
            await tx.workspace.update({
              where: { id: workspace.id },
              data: updateData,
            });
            changes.general.updated = true;
          }
        }

        // 2. Handle member operations
        if (members) {
          if (!canManageMembers) {
            throw new ForbiddenError(
              "You don't have permission to manage members"
            );
          }

          // Add new members
          if (members.add && members.add.length > 0) {
            for (const newMember of members.add) {
              // Find user by email
              const user = await tx.user.findUnique({
                where: { email: newMember.email },
              });

              if (!user) {
                throw new NotFoundError(`User ${newMember.email} not found`);
              }

              // Check if already a member
              const existingMember = await tx.workspaceMember.findUnique({
                where: {
                  userId_workspaceId: {
                    userId: user.id,
                    workspaceId: workspace.id,
                  },
                },
              });

              if (existingMember) {
                throw new ConflictError(
                  `${newMember.email} is already a member`
                );
              }

              // Set permissions based on role if not explicitly provided
              let permissions = newMember.permissions;

              if (!permissions) {
                // First check if there's a workspace-specific template
                const roleTemplate = await tx.workspaceRolePermTemplate.findUnique({
                  where: {
                    workspaceId_role: {
                      workspaceId: workspace.id,
                      role: newMember.role,
                    },
                  },
                });

                permissions = roleTemplate?.permissions ||
                  (rolePermissionPresets[newMember.role] as $Enums.WorkspacePermission[]) ||
                  [];
              }

              await tx.workspaceMember.create({
                data: {
                  userId: user.id,
                  workspaceId: workspace.id,
                  role: newMember.role,
                  permissions,
                },
              });

              changes.members.added.push(newMember.email);
            }
          }

          // Update existing members
          if (members.update && members.update.length > 0) {
            for (const updateMember of members.update) {
              const member = workspace.members.find(
                (m) => m.id === updateMember.memberId
              );

              if (!member) {
                throw new NotFoundError(
                  `Member with ID ${updateMember.memberId} not found`
                );
              }

              // Can't change owner's role
              if (member.userId === workspace.ownerId && updateMember.role) {
                throw new BadRequestError("Cannot change the owner's role");
              }

              // Validate role hierarchy
              if (!isOwner && requesterMember && updateMember.role) {
                const requesterRole = requesterMember.role;
                const targetRole = member.role;
                const newRole = updateMember.role;

                // Can't promote to same or higher level than yourself
                if (
                  requesterRole !== "OWNER" &&
                  (newRole === "OWNER" ||
                    (requesterRole === "ADMIN" && newRole === "ADMIN"))
                ) {
                  throw new ForbiddenError(
                    "Cannot promote member to same or higher level than yourself"
                  );
                }

                // Can't demote someone at same or higher level
                if (
                  requesterRole !== "OWNER" &&
                  (targetRole === "OWNER" ||
                    (requesterRole === "ADMIN" && targetRole === "ADMIN"))
                ) {
                  throw new ForbiddenError(
                    "Cannot modify member at same or higher level"
                  );
                }
              }

              const updateData: any = {};

              if (updateMember.role !== undefined) {
                updateData.role = updateMember.role;

                // Apply default permissions for role if permissions not explicitly set
                if (!updateMember.permissions) {
                  // First check if there's a workspace-specific template
                  const roleTemplate = await tx.workspaceRolePermTemplate.findUnique({
                    where: {
                      workspaceId_role: {
                        workspaceId: workspace.id,
                        role: updateMember.role,
                      },
                    },
                  });

                  updateData.permissions = roleTemplate?.permissions ||
                    (rolePermissionPresets[updateMember.role] as $Enums.WorkspacePermission[]) ||
                    [];
                }
              }

              if (updateMember.permissions !== undefined) {
                updateData.permissions = updateMember.permissions;
              }

              if (Object.keys(updateData).length > 0) {
                await tx.workspaceMember.update({
                  where: { id: member.id },
                  data: updateData,
                });

                changes.members.updated.push(member.user?.email || member.email || 'Unknown');
                changes.permissions.affectedMembers.push(member.userId);
                changes.permissions.updated = true;
              }
            }
          }

          // Remove members
          if (members.remove && members.remove.length > 0) {
            for (const memberId of members.remove) {
              const member = workspace.members.find(
                (m) => m.id === memberId
              );

              if (!member) {
                throw new NotFoundError(`Member with ID ${memberId} not found`);
              }

              // Can't remove owner
              if (member.userId === workspace.ownerId) {
                throw new BadRequestError("Cannot remove the workspace owner");
              }

              // Can't remove yourself
              if (member.userId === requesterId) {
                throw new BadRequestError(
                  "Cannot remove yourself from the workspace"
                );
              }

              await tx.workspaceMember.delete({
                where: { id: member.id },
              });

              changes.members.removed.push(member.user?.email || member.email || 'Unknown');
            }
          }
        }

        // 3. Update role permission templates (affects all members with that role)
        if (rolePermissions) {
          if (!canManageMembers) {
            throw new ForbiddenError(
              "You don't have permission to manage role permissions"
            );
          }

          // Update or create the role permission template for the workspace
          await tx.workspaceRolePermTemplate.upsert({
            where: {
              workspaceId_role: {
                workspaceId: workspace.id,
                role: rolePermissions.role,
              },
            },
            create: {
              workspaceId: workspace.id,
              role: rolePermissions.role,
              permissions: rolePermissions.permissions,
            },
            update: {
              permissions: rolePermissions.permissions,
            },
          });

          // Update all existing members with that role
          const membersToUpdate = workspace.members.filter(
            (m) => m.role === rolePermissions.role && m.userId !== workspace.ownerId
          );

          for (const member of membersToUpdate) {
            await tx.workspaceMember.update({
              where: { id: member.id },
              data: {
                permissions: rolePermissions.permissions,
              },
            });

            changes.permissions.affectedMembers.push(member.userId);
          }

          changes.permissions.updated = true;
        }

        // 4. Update limits (if applicable - might need separate table)
        if (limits && isOwner) {
          // This would require a separate WorkspaceLimits table
          // For now, we'll store it as JSON in a settings field if available
          // Or implement in a future update
        }

        // Fetch updated workspace
        const updatedWorkspace = await tx.workspace.findUnique({
          where: { id: workspace.id },
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                username: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    username: true,
                  },
                },
              },
            },
            _count: {
              select: {
                funnels: true,
                domains: true,
              },
            },
          },
        });

        if (!updatedWorkspace) {
          throw new Error("Failed to fetch updated workspace");
        }

        return {
          message: "Workspace updated successfully",
          workspace: {
            id: updatedWorkspace.id,
            name: updatedWorkspace.name,
            slug: updatedWorkspace.slug,
            description: updatedWorkspace.description,
            image: updatedWorkspace.image,
            ownerId: updatedWorkspace.ownerId,
            members: updatedWorkspace.members.map((m) => ({
              id: m.id,
              userId: m.userId,
              role: m.role,
              permissions: m.permissions || [],
              user: m.user,
            })),
            limits: limits || {},
          },
          changes,
        };
      });

      // Invalidate all caches related to this workspace
      try {
        // Invalidate workspace cache by ID
        await cacheService.invalidateWorkspaceCache(workspace.id);

        // Invalidate workspace cache by slug (new pattern without userId)
        await cacheService.del(`slug:${workspace.slug}`, { prefix: "workspace" });

        // Invalidate user workspaces cache for owner
        await cacheService.invalidateUserWorkspacesCache(workspace.ownerId);

        // Invalidate cache for all members
        for (const member of workspace.members) {
          await cacheService.invalidateUserWorkspacesCache(member.userId);
        }

        // If members were added, invalidate their user cache too
        if (changes.members.added.length > 0 && members?.add) {
          for (const newMember of members.add) {
            const user = await prisma.user.findUnique({
              where: { email: newMember.email },
              select: { id: true },
            });
            if (user) {
              await cacheService.invalidateUserWorkspacesCache(user.id);
            }
          }
        }

        console.log(`[Cache] Invalidated workspace cache for ${workspace.slug}`);
      } catch (cacheError) {
        console.error("Failed to invalidate workspace cache:", cacheError);
        // Don't fail the update operation if cache invalidation fails
      }

      return result;
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid data provided";
        throw new BadRequestError(message);
      }
      throw error;
    }
  }
}