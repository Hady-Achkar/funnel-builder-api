import crypto from "crypto";
import { getPrisma } from "../../lib/prisma";

/**
 * Generates a unique username from first and last name with random suffix
 * Format: firstname_lastname_randomId (e.g., john_doe_a1b2c3)
 *
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Unique username string
 */
export async function generateUsername(
  firstName: string,
  lastName: string
): Promise<string> {
  const prisma = getPrisma();
  const maxAttempts = 3;

  // Sanitize names: lowercase, keep only alphanumeric and underscores
  const sanitizedFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const sanitizedLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const baseName = `${sanitizedFirst}_${sanitizedLast}`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const randomId = crypto.randomBytes(3).toString("hex"); // 6 chars
    const username = `${baseName}_${randomId}`;

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!existingUser) {
      return username;
    }
  }

  // Fallback with longer random suffix if all attempts fail
  const fallbackId = crypto.randomBytes(6).toString("hex"); // 12 chars
  return `${baseName}_${fallbackId}`;
}
