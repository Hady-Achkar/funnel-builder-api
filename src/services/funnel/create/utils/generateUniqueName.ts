import { getPrisma } from "../../../../lib/prisma";

/**
 * Generates a unique funnel name by appending 2, 3, 4, etc. if name already exists
 * Format: "New Site", "New Site 2", "New Site 3", etc.
 */
export const generateUniqueName = async (
  baseName: string,
  workspaceId: number
): Promise<string> => {
  const prisma = getPrisma();

  // Check if base name exists
  const existingFunnel = await prisma.funnel.findFirst({
    where: {
      workspaceId,
      name: baseName,
    },
    select: { id: true },
  });

  // If name doesn't exist, use it as-is
  if (!existingFunnel) {
    return baseName;
  }

  // Name exists, find the next available number
  let counter = 2;
  let uniqueName = `${baseName} ${counter}`;

  while (true) {
    const exists = await prisma.funnel.findFirst({
      where: {
        workspaceId,
        name: uniqueName,
      },
      select: { id: true },
    });

    if (!exists) {
      return uniqueName;
    }

    counter++;
    uniqueName = `${baseName} ${counter}`;

    // Safety check to prevent infinite loops
    if (counter > 1000) {
      throw new Error(
        "Unable to generate a unique funnel name. Please try a different name."
      );
    }
  }
};
