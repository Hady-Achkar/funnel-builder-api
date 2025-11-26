import crypto from "crypto";

/**
 * Generates a secure temporary password
 * Creates a 12-character password with mixed case, numbers, and safe symbols
 *
 * @returns Secure temporary password string
 */
export function generateTempPassword(): string {
  // Generate random bytes and convert to base64
  // Base64 includes A-Z, a-z, 0-9, +, /
  // We replace + and / with safer characters for URLs/emails
  const password = crypto
    .randomBytes(9)
    .toString("base64")
    .replace(/\+/g, "X")
    .replace(/\//g, "Y")
    .slice(0, 12);

  return password;
}
