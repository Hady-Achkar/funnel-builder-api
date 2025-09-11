import { Funnel, Workspace } from "../../../generated/prisma-client";

export type CreateFunnelPayload = Pick<
  Funnel,
  "id" | "name" | "slug" | "status" | "createdBy" | "workspaceId"
>;
