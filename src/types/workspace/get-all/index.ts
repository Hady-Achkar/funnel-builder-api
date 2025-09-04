import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const getAllWorkspacesResponse = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    role: z.nativeEnum($Enums.WorkspaceRole),
  })
);

export type GetAllWorkspacesResponse = z.infer<typeof getAllWorkspacesResponse>;
