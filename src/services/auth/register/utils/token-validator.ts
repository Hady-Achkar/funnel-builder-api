import jwt from "jsonwebtoken";

export interface InvitationTokenPayload {
  workspaceId: number;
  workspaceSlug: string;
  role: string;
  email: string;
  type: string;
  exp: number;
}

export class TokenValidator {
  /**
   * Validates an invitation token structure
   * Returns null if invalid, payload if valid
   * Pure function - no error throwing
   */
  static validateInvitationToken(
    token: string,
    jwtSecret: string
  ): InvitationTokenPayload | null {
    try {
      const tokenPayload = jwt.verify(
        token,
        jwtSecret
      ) as InvitationTokenPayload;

      // Check if it's a workspace invitation type
      if (tokenPayload.type !== "workspace_invitation") {
        return null;
      }

      return tokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * Checks if email matches the token email
   */
  static isEmailMatch(tokenEmail: string, providedEmail: string): boolean {
    return tokenEmail.toLowerCase() === providedEmail.toLowerCase();
  }

  /**
   * Masks an email address for security purposes
   * Example: "john.doe@example.com" → "jo***@example.com"
   */
  static maskEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return '***@***.***';
    }

    const emailParts = email.split('@');
    if (emailParts.length !== 2) {
      return '***@***.***';
    }

    const [localPart, domain] = emailParts;

    if (localPart.length === 0) {
      return '***@' + domain;
    }

    // Show first 2 characters or all characters if less than 3
    const visibleChars = Math.min(2, localPart.length);
    const maskedLocal = localPart.substring(0, visibleChars) + '***';

    return `${maskedLocal}@${domain}`;
  }
}