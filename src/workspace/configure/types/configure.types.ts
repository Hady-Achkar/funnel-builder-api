import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const configureWorkspaceRequest = z
  .object({
    workspaceId: z.number().int().positive(),
    memberId: z.number().int().positive(),

    newRole: z.nativeEnum($Enums.WorkspaceRole).optional(),

    addPermissions: z.array(z.nativeEnum($Enums.WorkspacePermission)).optional(),
    removePermissions: z.array(z.nativeEnum($Enums.WorkspacePermission)).optional(),

    allocations: z
      .object({
        allocatedFunnels: z.number().int().min(0).optional(),
        allocatedCustomDomains: z.number().int().min(0).optional(),
        allocatedSubdomains: z.number().int().min(0).optional(),
      })
      .optional(),
  })
  .refine(
    (data) =>
      data.newRole ||
      data.addPermissions ||
      data.removePermissions ||
      data.allocations,
    {
      message:
        "At least one change (role, permissions, or allocations) must be specified",
      path: ["changes"],
    }
  );

export type ConfigureWorkspaceRequest = z.infer<
  typeof configureWorkspaceRequest
>;

export const memberInfo = z.object({
  id: z.number(),
  userId: z.number(),
  role: z.nativeEnum($Enums.WorkspaceRole),
  permissions: z.array(z.nativeEnum($Enums.WorkspacePermission)),
  joinedAt: z.date(),
  updatedAt: z.date(),
  user: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  }),
});

export type MemberInfo = z.infer<typeof memberInfo>;

export const workspaceAllocations = z.object({
  allocatedFunnels: z.number(),
  allocatedCustomDomains: z.number(),
  allocatedSubdomains: z.number(),
});

export type WorkspaceAllocations = z.infer<typeof workspaceAllocations>;

export const configureWorkspaceResponse = z.object({
  message: z.string(),
  member: memberInfo,
  allocations: workspaceAllocations.optional(),
  changes: z.object({
    roleChanged: z.boolean(),
    permissionsAdded: z.array(z.nativeEnum($Enums.WorkspacePermission)),
    permissionsRemoved: z.array(z.nativeEnum($Enums.WorkspacePermission)),
    allocationsUpdated: z.boolean(),
  }),
});

export type ConfigureWorkspaceResponse = z.infer<
  typeof configureWorkspaceResponse
>;

export const roleChangeAttempt = z.object({
  requesterId: z.number(),
  requesterRole: z.nativeEnum($Enums.WorkspaceRole),
  requesterPermissions: z.array(z.nativeEnum($Enums.WorkspacePermission)),
  targetMemberId: z.number(),
  targetRole: z.nativeEnum($Enums.WorkspaceRole),
  newRole: z.nativeEnum($Enums.WorkspaceRole),
  isOwner: z.boolean(),
});

export type RoleChangeAttempt = z.infer<typeof roleChangeAttempt>;

export const permissionChangeAttempt = z.object({
  requesterId: z.number(),
  requesterRole: z.nativeEnum($Enums.WorkspaceRole),
  requesterPermissions: z.array(z.nativeEnum($Enums.WorkspacePermission)),
  targetMemberId: z.number(),
  targetRole: z.nativeEnum($Enums.WorkspaceRole),
  permissionsToAdd: z.array(z.nativeEnum($Enums.WorkspacePermission)),
  permissionsToRemove: z.array(z.nativeEnum($Enums.WorkspacePermission)),
  isOwner: z.boolean(),
});

export type PermissionChangeAttempt = z.infer<typeof permissionChangeAttempt>;
