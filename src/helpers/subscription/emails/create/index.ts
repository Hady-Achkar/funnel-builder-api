import sgMail from "@sendgrid/mail";
import { 
  getSubscriptionWelcomeEmailHtml, 
  getSubscriptionWelcomeEmailText,
  SubscriptionWelcomeTemplateData 
} from "../../../../constants/emails/registration-emails/subscription-welcome";

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

export async function sendSubscriptionVerificationEmail(
  to: string,
  firstName: string,
  verificationToken: string,
  temporaryPassword: string
): Promise<void> {
  try {
    initialize();

    const confirmationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const templateData: SubscriptionWelcomeTemplateData = {
      firstName,
      email: to,
      temporaryPassword,
      verificationLink: confirmationLink,
    };

    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: "Digitalsite",
      },
      subject: "Welcome to Digitalsite - Verify Your Email",
      html: getSubscriptionWelcomeEmailHtml(templateData),
      text: getSubscriptionWelcomeEmailText(templateData),
    };

    await sgMail.send(msg);
  } catch (error: any) {
    console.error("Error sending subscription verification email:", error);
    if (error.response && error.response.body) {
      console.error(
        "SendGrid error details:",
        JSON.stringify(error.response.body, null, 2)
      );
    }
    throw new Error("Failed to send subscription verification email");
  }
}