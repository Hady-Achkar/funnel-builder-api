import sgMail from "@sendgrid/mail";
import { WORKSPACE_INVITATION_EMAIL } from "../../../../constants/emails/workspace/invitation";
import { WORKSPACE_REGISTER_INVITATION_EMAIL } from "../../../../constants/emails/workspace/register-invitation";

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

export async function sendWorkspaceInvitationEmail(
  to: string,
  workspaceName: string,
  role: string,
  token: string
): Promise<void> {
  try {
    initialize();

    const acceptInvitationLink = `${process.env.FRONTEND_URL}/accept-invitation?token=${token}`;

    const html = WORKSPACE_INVITATION_EMAIL.template
      .replace(/{{workspaceName}}/g, workspaceName)
      .replace(/{{role}}/g, role)
      .replace(/{{acceptInvitationLink}}/g, acceptInvitationLink);

    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: "Digitalsite",
      },
      subject: WORKSPACE_INVITATION_EMAIL.subject,
      html,
    };

    await sgMail.send(msg);
  } catch (error: any) {
    console.error("Error sending workspace invitation email:", error);
    if (error.response && error.response.body) {
      console.error(
        "SendGrid error details:",
        JSON.stringify(error.response.body, null, 2)
      );
    }
    throw new Error("Failed to send workspace invitation email");
  }
}

export async function sendWorkspaceRegisterInvitationEmail(
  to: string,
  workspaceName: string,
  role: string,
  token: string
): Promise<void> {
  try {
    initialize();

    const registerInvitationLink = `${process.env.FRONTEND_URL}/register?token=${token}`;

    const html = WORKSPACE_REGISTER_INVITATION_EMAIL.template
      .replace(/{{workspaceName}}/g, workspaceName)
      .replace(/{{role}}/g, role)
      .replace(/{{registerInvitationLink}}/g, registerInvitationLink);

    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: "Digitalsite",
      },
      subject: WORKSPACE_REGISTER_INVITATION_EMAIL.subject,
      html,
    };

    await sgMail.send(msg);
  } catch (error: any) {
    console.error("Error sending workspace register invitation email:", error);
    if (error.response && error.response.body) {
      console.error(
        "SendGrid error details:",
        JSON.stringify(error.response.body, null, 2)
      );
    }
    throw new Error("Failed to send workspace register invitation email");
  }
}
