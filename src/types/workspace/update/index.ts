import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

// General workspace settings
export const updateWorkspaceGeneralRequest = z.object({
  workspaceSlug: z.string(),
  name: z.string().min(3).max(50).optional(),
  description: z.string().max(500).optional(),
  image: z.string().url().optional().nullable(),
});

// Member update request
export const updateWorkspaceMemberRequest = z.object({
  workspaceSlug: z.string(),
  memberId: z.number(),
  role: z.nativeEnum($Enums.WorkspaceRole).optional(),
  permissions: z.array(z.nativeEnum($Enums.WorkspacePermission)).optional(),
});

// Add new member request
export const addWorkspaceMemberRequest = z.object({
  workspaceSlug: z.string(),
  email: z.string().email(),
  role: z.nativeEnum($Enums.WorkspaceRole),
  permissions: z.array(z.nativeEnum($Enums.WorkspacePermission)).optional(),
});

// Remove member request
export const removeWorkspaceMemberRequest = z.object({
  workspaceSlug: z.string(),
  memberId: z.number(),
});

// Permission groups for UI
export const permissionGroups = z.object({
  workspace: z.object({
    enabled: z.boolean(),
    permissions: z.array(z.enum(["MANAGE_WORKSPACE", "MANAGE_MEMBERS"])),
  }),
  funnels: z.object({
    enabled: z.boolean(),
    permissions: z.object({
      create: z.boolean(), // CREATE_FUNNELS
      view: z.boolean(),   // View funnel (not in enum, might need to add)
      edit: z.boolean(),   // EDIT_FUNNELS, EDIT_PAGES
      share: z.boolean(),  // Share funnel (not in enum)
      duplicate: z.boolean(), // Duplicate (not in enum)
      rename: z.boolean(), // Rename (not in enum)
      archive: z.boolean(), // Archive (not in enum)
      restore: z.boolean(), // Restore archived funnels (not in enum)
      move: z.boolean(),   // Move funnel (not in enum)
      delete: z.boolean(), // DELETE_FUNNELS
      analytics: z.boolean(), // VIEW_ANALYTICS
    }),
  }),
  domains: z.object({
    enabled: z.boolean(),
    permissions: z.object({
      add: z.boolean(),    // CREATE_DOMAINS, CONNECT_DOMAINS
      delete: z.boolean(), // DELETE_DOMAINS
      manage: z.boolean(), // MANAGE_DOMAINS
    }),
  }),
});

// Role-based permission presets
export const rolePermissionPresets = {
  OWNER: [
    "MANAGE_WORKSPACE",
    "MANAGE_MEMBERS",
    "CREATE_FUNNELS",
    "EDIT_FUNNELS",
    "EDIT_PAGES",
    "DELETE_FUNNELS",
    "VIEW_ANALYTICS",
    "MANAGE_DOMAINS",
    "CREATE_DOMAINS",
    "DELETE_DOMAINS",
    "CONNECT_DOMAINS",
  ],
  ADMIN: [
    "MANAGE_WORKSPACE",
    "MANAGE_MEMBERS",
    "CREATE_FUNNELS",
    "EDIT_FUNNELS",
    "EDIT_PAGES",
    "DELETE_FUNNELS",
    "VIEW_ANALYTICS",
    "MANAGE_DOMAINS",
    "CREATE_DOMAINS",
    "DELETE_DOMAINS",
    "CONNECT_DOMAINS",
  ],
  EDITOR: [
    "CREATE_FUNNELS",
    "EDIT_FUNNELS",
    "EDIT_PAGES",
    "VIEW_ANALYTICS",
  ],
  VIEWER: [
    "VIEW_ANALYTICS",
  ],
};

// Comprehensive workspace update request
export const updateWorkspaceRequest = z.object({
  workspaceSlug: z.string(),

  // General settings
  general: z.object({
    name: z.string().min(3).max(50).optional(),
    description: z.string().max(500).optional(),
    image: z.string().url().optional().nullable(),
  }).optional(),

  // Member updates
  members: z.object({
    add: z.array(z.object({
      email: z.string().email(),
      role: z.nativeEnum($Enums.WorkspaceRole),
      permissions: z.array(z.nativeEnum($Enums.WorkspacePermission)).optional(),
    })).optional(),

    update: z.array(z.object({
      memberId: z.number(),
      role: z.nativeEnum($Enums.WorkspaceRole).optional(),
      permissions: z.array(z.nativeEnum($Enums.WorkspacePermission)).optional(),
    })).optional(),

    remove: z.array(z.number()).optional(), // Array of member IDs to remove
  }).optional(),

  // Role-based permission templates
  rolePermissions: z.object({
    role: z.nativeEnum($Enums.WorkspaceRole),
    permissions: z.array(z.nativeEnum($Enums.WorkspacePermission)),
  }).optional(),

  // Usage and limits (for future implementation)
  limits: z.object({
    maxMembers: z.number().positive().optional(),
    maxFunnels: z.number().positive().optional(),
    maxDomains: z.number().positive().optional(),
    maxStorage: z.number().positive().optional(), // in MB
  }).optional(),
});

export type UpdateWorkspaceRequest = z.infer<typeof updateWorkspaceRequest>;
export type UpdateWorkspaceGeneralRequest = z.infer<typeof updateWorkspaceGeneralRequest>;
export type UpdateWorkspaceMemberRequest = z.infer<typeof updateWorkspaceMemberRequest>;
export type AddWorkspaceMemberRequest = z.infer<typeof addWorkspaceMemberRequest>;
export type RemoveWorkspaceMemberRequest = z.infer<typeof removeWorkspaceMemberRequest>;
export type PermissionGroups = z.infer<typeof permissionGroups>;

// Response types
export const updateWorkspaceResponse = z.object({
  message: z.string(),
  workspace: z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    image: z.string().nullable(),
    ownerId: z.number(),
    members: z.array(z.object({
      id: z.number(),
      userId: z.number(),
      role: z.nativeEnum($Enums.WorkspaceRole),
      permissions: z.array(z.nativeEnum($Enums.WorkspacePermission)),
      user: z.object({
        id: z.number(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
        username: z.string(),
      }),
    })),
    limits: z.object({
      maxMembers: z.number().optional(),
      maxFunnels: z.number().optional(),
      maxDomains: z.number().optional(),
      maxStorage: z.number().optional(),
    }).optional(),
  }),
  changes: z.object({
    general: z.object({
      updated: z.boolean(),
      fields: z.array(z.string()),
    }).optional(),
    members: z.object({
      added: z.array(z.string()),
      updated: z.array(z.string()),
      removed: z.array(z.string()),
    }).optional(),
    permissions: z.object({
      updated: z.boolean(),
      affectedMembers: z.array(z.number()),
    }).optional(),
  }),
});

export type UpdateWorkspaceResponse = z.infer<typeof updateWorkspaceResponse>;