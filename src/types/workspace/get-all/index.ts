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

export const getAllWorkspacesResponse = z.array(workspaceItemSchema);

export type GetAllWorkspacesResponse = z.infer<typeof getAllWorkspacesResponse>;
