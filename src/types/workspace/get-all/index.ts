import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

const workspaceMemberSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  username: z.string(),
  role: z.enum($Enums.WorkspaceRole),
  permissions: z.array(z.enum($Enums.WorkspacePermission)),
});

export const getAllWorkspacesResponse = z.array(
  z.object({
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
  })
);

export type GetAllWorkspacesResponse = z.infer<typeof getAllWorkspacesResponse>;
