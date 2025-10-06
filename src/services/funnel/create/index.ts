import {
  CreateFunnelRequest,
  CreateFunnelResponse,
} from "../../../types/funnel/create";
import { getPrisma } from "../../../lib/prisma";
import { validateWorkspace } from "./utils/validateWorkspace";
import { checkWorkspaceFunnelLimit } from "./utils/checkWorkspaceFunnelLimit";
import { validateUserPermissions } from "./utils/validateUserPermissions";
import { generateFunnelSlug } from "./utils/generateFunnelSlug";
import { generateUniqueName } from "./utils/generateUniqueName";
import { createFunnelInTransaction } from "./utils/createFunnelInTransaction";

export const createFunnel = async (
  userId: number,
  data: CreateFunnelRequest
): Promise<{ response: CreateFunnelResponse; workspaceId: number }> => {
  if (!userId) {
    throw new Error("Please log in to continue");
  }

  const prisma = getPrisma();

  const workspace = await validateWorkspace(prisma, data.workspaceSlug);

  await checkWorkspaceFunnelLimit(prisma, workspace.id);

  await validateUserPermissions(prisma, userId, workspace);

  // Generate unique name (adds -1, -2, etc. if duplicate)
  const uniqueName = await generateUniqueName(data.name, workspace.id);

  const slug = await generateFunnelSlug(uniqueName, workspace.id, data.slug);

  const result = await createFunnelInTransaction(prisma, {
    name: uniqueName,
    slug,
    status: data.status,
    workspaceId: workspace.id,
    userId,
  });

  const response: CreateFunnelResponse = {
    message: "Funnel created successfully!",
    funnelId: result.funnel.id,
  };

  return { response, workspaceId: workspace.id };
};
