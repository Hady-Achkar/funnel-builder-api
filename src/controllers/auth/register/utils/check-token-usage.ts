import { PrismaClient } from "../../../../generated/prisma-client";

/**
 * Check if a token has already been used for registration
 * Returns true if token was already used, false if it's available
 */
export async function checkTokenUsage(
  token: string,
  prisma: PrismaClient
): Promise<boolean> {
  const existingUser = await prisma.user.findFirst({
    where: {
      registrationToken: token,
    },
    select: {
      id: true,
    },
  });

  return existingUser !== null;
}
