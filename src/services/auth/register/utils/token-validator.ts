import jwt from "jsonwebtoken";
import { BadRequestError, ForbiddenError } from "../../../../errors";
import { MembershipStatus } from "../../../../generated/prisma-client";

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
   * Validates an invitation token and checks if the email matches
   * Throws user-friendly errors for various failure scenarios
   */
  static async validateInvitationToken(
    token: string,
    email: string
  ): Promise<InvitationTokenPayload> {
    let tokenPayload: InvitationTokenPayload;

    try {
      tokenPayload = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as InvitationTokenPayload;
    } catch (error) {
      throw new BadRequestError(
        "Invalid or expired invitation token. Please request a new invitation from your workspace administrator."
      );
    }

    if (tokenPayload.type !== "workspace_invitation") {
      throw new BadRequestError("Invalid invitation token type.");
    }

    if (tokenPayload.email !== email) {
      const maskedInvitedEmail = this.maskEmail(tokenPayload.email);
      throw new ForbiddenError(
        `This invitation was sent to ${maskedInvitedEmail}. Please register with that email address or request a new invitation.`
      );
    }

    return tokenPayload;
  }

  /**
   * Checks if a pending invitation exists for the given email and workspace
   */
  static async checkPendingInvitation(
    email: string,
    workspaceId: number,
    prisma: any
  ): Promise<boolean> {
    const pendingInvitation = await prisma.workspaceMember.findFirst({
      where: {
        email,
        workspaceId,
        status: MembershipStatus.PENDING,
      },
    });

    if (!pendingInvitation) {
      throw new ForbiddenError(
        "No pending invitation found for this email address. Please contact your workspace administrator."
      );
    }

    return true;
  }

  /**
   * Masks an email address for security purposes
   * Example: "john.doe@example.com" → "jo***@example.com"
   */
  private static maskEmail(email: string): string {
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