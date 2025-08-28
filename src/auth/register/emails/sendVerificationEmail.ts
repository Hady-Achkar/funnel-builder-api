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

export async function sendVerificationEmail(
  to: string,
  firstName: string,
  verificationToken: string
): Promise<void> {
  try {
    initialize();

    const confirmationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: "Digitalsite",
      },
      templateId: "d-0ec5ea02e0e14ef380469a2ab63917d4",
      dynamicTemplateData: {
        firstName,
        confirmationLink,
      },
    };

    await sgMail.send(msg);
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    if (error.response && error.response.body) {
      console.error(
        "SendGrid error details:",
        JSON.stringify(error.response.body, null, 2)
      );
    }
    throw new Error("Failed to send verification email");
  }
}
