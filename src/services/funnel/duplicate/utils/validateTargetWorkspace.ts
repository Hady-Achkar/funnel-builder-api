import { PrismaClient } from "../../../../generated/prisma-client";

/**
 * Validates and retrieves the target workspace for cross-workspace duplication
 *
 * Used when duplicating a funnel to a different workspace than the original.
 * If no workspace slug is provided, returns null (duplicate to same workspace).
 *
 * @param prisma - Prisma client instance
 * @param workspaceSlug - Optional slug of target workspace for cross-workspace duplication
 * @returns Target workspace details or null if duplicating to same workspace
 * @throws Error if workspace slug is provided but workspace is not found
 */
export const validateTargetWorkspace = async (
  prisma: PrismaClient,
  workspaceSlug?: string
) => {
  if (!workspaceSlug) {
    return null;
  }

  const targetWorkspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: { id: true, name: true, ownerId: true },
  });

  if (!targetWorkspace) {
    throw new Error("Target workspace not found");
  }

  return targetWorkspace;
};
