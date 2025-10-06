import { getPrisma } from "../../../../lib/prisma";

/**
 * Generates a unique funnel name by appending -1, -2, -3, etc. if name already exists
 * Similar to how we handle unique slugs
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
  let counter = 1;
  let uniqueName = `${baseName}-${counter}`;

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
    uniqueName = `${baseName}-${counter}`;

    // Safety check to prevent infinite loops
    if (counter > 1000) {
      throw new Error(
        "Unable to generate a unique funnel name. Please try a different name."
      );
    }
  }
};
