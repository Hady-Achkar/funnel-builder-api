import { PrismaClient } from "../../../../generated/prisma-client";

/**
 * Generates a unique name for the duplicated funnel
 *
 * Naming pattern:
 * - First duplicate: "Original Name - copy"
 * - If exists: "Original Name - copy (2)", "Original Name - copy (3)", etc.
 *
 * Prevents name conflicts by checking existing funnel names in the workspace.
 *
 * @param prisma - Prisma client instance
 * @param baseName - Original funnel name
 * @param workspaceId - Target workspace ID where duplicate will be created
 * @returns Unique funnel name with " - copy" suffix and optional counter
 */
export const generateUniqueFunnelName = async (
  prisma: PrismaClient,
  baseName: string,
  workspaceId: number
): Promise<string> => {
  let finalFunnelName = `${baseName} - copy`;

  // Check if name already exists in target workspace and generate unique name
  const existingFunnels = await prisma.funnel.findMany({
    where: {
      workspaceId: workspaceId,
      name: {
        startsWith: finalFunnelName,
      },
    },
    select: {
      name: true,
    },
  });

  if (existingFunnels.length > 0) {
    const existingNames = existingFunnels.map((f) => f.name);

    // If exact name exists, start looking for numbered versions
    if (existingNames.includes(finalFunnelName)) {
      let counter = 2;
      let newName = `${finalFunnelName} (${counter})`;

      while (existingNames.includes(newName)) {
        counter++;
        newName = `${finalFunnelName} (${counter})`;
      }

      finalFunnelName = newName;
    }
  }

  return finalFunnelName;
};
