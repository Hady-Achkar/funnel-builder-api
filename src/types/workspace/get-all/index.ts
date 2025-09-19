import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const getAllWorkspacesResponse = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    role: z.enum($Enums.WorkspaceRole),
    owner: z.object({
      id: z.number(),
      firstName: z.string(),
      lastName: z.string(),
      username: z.string(),
    }),
    funnelsCount: z.number(),
  })
);

export type GetAllWorkspacesResponse = z.infer<typeof getAllWorkspacesResponse>;
