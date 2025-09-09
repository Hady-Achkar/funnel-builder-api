import sgMail from "@sendgrid/mail";
import { 
  getAffiliateCongratulationsEmailHtml, 
  getAffiliateCongratulationsEmailText 
} from "../../../../constants/emails/affiliate/congratulations";

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

export async function sendAffiliateCongratulationsEmail(
  to: string,
  firstName: string = "Partner"
): Promise<void> {
  try {
    initialize();

    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: "Digitalsite",
      },
      subject: "🎉 Congratulations! New Referral Success",
      html: getAffiliateCongratulationsEmailHtml(),
      text: getAffiliateCongratulationsEmailText(),
    };

    await sgMail.send(msg);
  } catch (error: any) {
    console.error("Error sending affiliate congratulations email:", error);
    if (error.response && error.response.body) {
      console.error(
        "SendGrid error details:",
        JSON.stringify(error.response.body, null, 2)
      );
    }
    throw new Error("Failed to send affiliate congratulations email");
  }
}