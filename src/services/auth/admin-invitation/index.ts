import sgMail from "@sendgrid/mail";
import {
  GenerateAdminInvitationRequest,
  GenerateAdminInvitationResponse,
} from "../../../types/auth/admin-invitation";
import { generateInvitationToken } from "./utils/generate-invitation-token";
import { formatResponse } from "./utils/format-response";
import {
  getAdminInvitationEmailHtml,
  getAdminInvitationEmailText,
  AdminInvitationEmailData,
} from "../../../constants/emails/auth/admin-invitation";
import { getPrisma } from "../../../lib/prisma";
import { ConflictError } from "../../../errors/http-errors";

export class GenerateAdminInvitationService {
  static async generateInvitation(
    data: GenerateAdminInvitationRequest
  ): Promise<GenerateAdminInvitationResponse> {
    try {
      const prisma = getPrisma();

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.invitedEmail },
        select: { id: true },
      });

      if (existingUser) {
        throw new ConflictError(
          "A user with this email address already exists. They can sign in directly."
        );
      }

      // Generate invitation token
      const token = generateInvitationToken({
        adminCode: data.adminCode,
        invitedEmail: data.invitedEmail,
        plan: data.plan,
      });

      // Create invitation URL
      const frontendUrl = process.env.FRONTEND_URL;
      if (!frontendUrl) {
        throw new Error("FRONTEND_URL is not configured");
      }

      const invitationUrl = `${frontendUrl}/register?outerPayment=${token}`;

      // Calculate expiry date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Send invitation email (non-blocking)
      this.sendInvitationEmail(data.invitedEmail, invitationUrl, data.plan)
        .then(() => {
          console.log(`Invitation email sent to ${data.invitedEmail}`);
        })
        .catch((error) => {
          console.error(
            `Failed to send invitation email to ${data.invitedEmail}:`,
            error
          );
        });

      // Return response
      return formatResponse({
        token,
        invitationUrl,
        expiresAt,
      });
    } catch (error) {
      throw error;
    }
  }

  private static async sendInvitationEmail(
    email: string,
    invitationUrl: string,
    plan: string
  ): Promise<void> {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error("SENDGRID_API_KEY is not configured");
    }

    sgMail.setApiKey(apiKey);

    const emailData: AdminInvitationEmailData = {
      invitedEmail: email,
      invitationUrl,
      plan,
    };

    await sgMail.send({
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: "Digitalsite",
      },
      subject:
        "You're Invited to Join Digitalsite | تمت دعوتك للانضمام إلى Digitalsite",
      html: getAdminInvitationEmailHtml(emailData),
      text: getAdminInvitationEmailText(emailData),
    });
  }
}
