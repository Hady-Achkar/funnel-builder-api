import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const configureWorkspaceRequest = z
  .object({
    workspaceSlug: z
      .string()
      .min(3, "Workspace slug must be at least 3 characters"),
    memberId: z.number().int().positive().optional(),

    newRole: z.enum($Enums.WorkspaceRole).optional(),

    addPermissions: z.array(z.enum($Enums.WorkspacePermission)).optional(),
    removePermissions: z.array(z.enum($Enums.WorkspacePermission)).optional(),
  })
  .refine(
    (data) => data.newRole || data.addPermissions || data.removePermissions,
    {
      message: "At least one change (role or permissions) must be specified",
      path: ["changes"],
    }
  )
  .refine(
    (data) => {
      // If member-related changes are requested, memberId is required
      const memberChanges =
        data.newRole || data.addPermissions || data.removePermissions;
      if (memberChanges && !data.memberId) {
        return false;
      }
      return true;
    },
    {
      message: "memberId is required when modifying roles or permissions",
      path: ["memberId"],
    }
  );

export type ConfigureWorkspaceRequest = z.infer<
  typeof configureWorkspaceRequest
>;

export const memberInfo = z.object({
  id: z.number(),
  userId: z.number(),
  role: z.enum($Enums.WorkspaceRole),
  permissions: z.array(z.enum($Enums.WorkspacePermission)),
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

export const configureWorkspaceResponse = z.object({
  message: z.string(),
  member: memberInfo.optional(),
  changes: z.object({
    roleChanged: z.boolean(),
    permissionsAdded: z.array(z.enum($Enums.WorkspacePermission)),
    permissionsRemoved: z.array(z.enum($Enums.WorkspacePermission)),
  }),
});

export type ConfigureWorkspaceResponse = z.infer<
  typeof configureWorkspaceResponse
>;

export const roleChangeAttempt = z.object({
  requesterId: z.number(),
  requesterRole: z.enum($Enums.WorkspaceRole),
  requesterPermissions: z.array(z.enum($Enums.WorkspacePermission)),
  targetMemberId: z.number(),
  targetRole: z.enum($Enums.WorkspaceRole),
  newRole: z.enum($Enums.WorkspaceRole),
  isOwner: z.boolean(),
});

export type RoleChangeAttempt = z.infer<typeof roleChangeAttempt>;

export const permissionChangeAttempt = z.object({
  requesterId: z.number(),
  requesterRole: z.enum($Enums.WorkspaceRole),
  requesterPermissions: z.array(z.enum($Enums.WorkspacePermission)),
  targetMemberId: z.number(),
  targetRole: z.enum($Enums.WorkspaceRole),
  permissionsToAdd: z.array(z.enum($Enums.WorkspacePermission)),
  permissionsToRemove: z.array(z.enum($Enums.WorkspacePermission)),
  isOwner: z.boolean(),
});

export type PermissionChangeAttempt = z.infer<typeof permissionChangeAttempt>;
