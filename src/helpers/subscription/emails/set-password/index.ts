import sgMail from "@sendgrid/mail";

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

/**
 * Sends password setup email to new subscription users
 * This is sent after account creation via webhook to allow user to set their password
 * @param to - User's email address
 * @param firstName - User's first name for personalization
 * @param passwordResetToken - Token for setting password
 */
export async function sendSetPasswordEmail(
  to: string,
  firstName: string,
  passwordResetToken: string
): Promise<void> {
  try {
    initialize();

    const setPasswordLink = `${process.env.FRONTEND_URL}/reset-password?token=${passwordResetToken}`;

    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: "Digitalsite",
      },
      templateId: "d-YOUR_SENDGRID_TEMPLATE_ID", // TODO: Replace with actual SendGrid template ID
      dynamicTemplateData: {
        firstName,
        email: to,
        link: setPasswordLink,
      },
    };

    await sgMail.send(msg);
    console.log(`[Email] Password setup email sent to ${to}`);
  } catch (error: any) {
    console.error("Error sending password setup email:", error);
    if (error.response && error.response.body) {
      console.error(
        "SendGrid error details:",
        JSON.stringify(error.response.body, null, 2)
      );
    }
    throw new Error("Failed to send password setup email");
  }
}
