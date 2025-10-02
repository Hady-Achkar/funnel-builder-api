import jwt from "jsonwebtoken";

export interface DecodedInvitationToken {
  workspaceId: number;
  email: string;
  role: string;
  permissions: string[];
}

/**
 * Decodes and validates the structure of an invitation token
 * Pure function - no database calls, no try-catch
 */
export function decodeInvitationToken(token: string, jwtSecret: string): DecodedInvitationToken | null {
  try {
    const decoded = jwt.verify(token, jwtSecret) as DecodedInvitationToken;

    // Validate required fields exist
    if (!decoded.workspaceId || !decoded.email || !decoded.role) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Checks if the token email matches the provided email
 * Pure function - no database calls
 */
export function validateTokenEmail(tokenEmail: string, providedEmail: string): boolean {
  return tokenEmail.toLowerCase() === providedEmail.toLowerCase();
}

/**
 * Checks if invitation exists in the provided list
 * Pure function - no database calls
 */
export function checkInvitationExists(
  invitations: Array<{ email: string; workspaceId: number; status: string }>,
  email: string,
  workspaceId: number
): boolean {
  return invitations.some(
    inv => inv.email.toLowerCase() === email.toLowerCase() &&
           inv.workspaceId === workspaceId &&
           inv.status === "PENDING"
  );
}