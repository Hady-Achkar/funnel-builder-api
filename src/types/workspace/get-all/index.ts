import { z } from "zod";
import { $Enums, MembershipStatus } from "../../../generated/prisma-client";

const workspaceMemberSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  username: z.string(),
  role: z.enum($Enums.WorkspaceRole),
  permissions: z.array(z.enum($Enums.WorkspacePermission)),
  status: z.enum(MembershipStatus),
});

export const getAllWorkspacesRequest = z.object({
  page: z
    .coerce
    .number({
      message: "Page must be a number",
    })
    .int({ message: "Page must be an integer" })
    .positive({ message: "Page must be positive" })
    .optional()
    .default(1),
  limit: z
    .coerce
    .number({
      message: "Limit must be a number",
    })
    .int({ message: "Limit must be an integer" })
    .positive({ message: "Limit must be positive" })
    .max(100, { message: "Limit cannot exceed 100" })
    .optional()
    .default(10),
  sortBy: z
    .enum(["createdAt", "name", "memberCount", "funnelCount", "domainCount"], {
      message: "Sort by must be one of: createdAt, name, memberCount, funnelCount, domainCount",
    })
    .optional()
    .default("createdAt"),
  sortOrder: z
    .enum(["asc", "desc"], {
      message: "Sort order must be either 'asc' or 'desc'",
    })
    .optional()
    .default("desc"),
  role: z
    .enum($Enums.WorkspaceRole, {
      message: `Role must be one of: ${Object.values($Enums.WorkspaceRole).join(", ")}`,
    })
    .optional(),
  search: z
    .string({
      message: "Search must be a string",
    })
    .min(1, { message: "Search cannot be empty" })
    .optional(),
});

export type GetAllWorkspacesRequest = z.infer<typeof getAllWorkspacesRequest>;

const workspaceItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  image: z.string().nullable(),
  role: z.enum($Enums.WorkspaceRole),
  permissions: z.array(z.enum($Enums.WorkspacePermission)),
  owner: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    username: z.string(),
  }),
  members: z.array(workspaceMemberSchema),
  memberCount: z.number(),
  funnelCount: z.number(),
  domainCount: z.number(),
  createdAt: z.date(),
});

export const getAllWorkspacesResponse = z.object({
  workspaces: z.array(workspaceItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export type GetAllWorkspacesResponse = z.infer<typeof getAllWorkspacesResponse>;
