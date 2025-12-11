import sgMail from "@sendgrid/mail";
import {
  getResetPasswordEmailHtml,
  getResetPasswordEmailText,
  ResetPasswordEmailData,
} from "../../../../constants/emails/auth/reset-password";

let initialized = false;

function initialize() {
  if (!initialized) {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error("SENDGRID_API_KEY is not configured");
    }
    sgMail.setApiKey(apiKey);
    initialized = true;
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string
): Promise<void> {
  try {
    initialize();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const emailData: ResetPasswordEmailData = {
      resetUrl: resetLink,
    };

    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: "Digitalsite",
      },
      subject: "Reset Your Password | إعادة تعيين كلمة المرور",
      html: getResetPasswordEmailHtml(emailData),
      text: getResetPasswordEmailText(emailData),
    };

    await sgMail.send(msg);
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    if (error.response && error.response.body) {
      console.error(
        "SendGrid error details:",
        JSON.stringify(error.response.body, null, 2)
      );
    }
    throw new Error("Failed to send password reset email");
  }
}