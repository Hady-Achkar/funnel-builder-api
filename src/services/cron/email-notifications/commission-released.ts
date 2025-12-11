import sgMail from "@sendgrid/mail";
import type { CommissionReleasedEmailData } from "../../../types/cron/commission-release.types";

/**
 * Send email notification when affiliate commission is released
 *
 * This email is sent when a held commission (30-day hold) is released
 * and moved from pending balance to available balance.
 */
export async function sendCommissionReleasedEmail(
  data: CommissionReleasedEmailData
): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn(
      "[CommissionRelease] SENDGRID_API_KEY not configured, skipping email"
    );
    return;
  }

  sgMail.setApiKey(apiKey);

  const { affiliateOwnerEmail, affiliateOwnerName, commissionAmount, newAvailableBalance, numberOfCommissions } = data;

  const formattedAmount = `$${commissionAmount.toFixed(2)}`;
  const formattedBalance = `$${newAvailableBalance.toFixed(2)}`;
  const commissionText =
    numberOfCommissions === 1
      ? "commission has"
      : `${numberOfCommissions} commissions have`;

  try {
    await sgMail.send({
      to: affiliateOwnerEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || "noreply@digitalsite.com",
        name: "Digitalsite",
      },
      subject: `Commission Released - ${formattedAmount} Now Available | تم إصدار العمولة`,
      html: getCommissionReleasedEmailHtml(data),
      text: getCommissionReleasedEmailText(data),
    });

    console.log(
      `[CommissionRelease] Email sent successfully to ${affiliateOwnerEmail}`
    );
  } catch (error) {
    console.error(
      `[CommissionRelease] Failed to send email to ${affiliateOwnerEmail}:`,
      error
    );
    throw error;
  }
}

/**
 * HTML email template
 */
function getCommissionReleasedEmailHtml(
  data: CommissionReleasedEmailData
): string {
  const { affiliateOwnerName, commissionAmount, newAvailableBalance, numberOfCommissions } = data;

  const formattedAmount = `$${commissionAmount.toFixed(2)}`;
  const formattedBalance = `$${newAvailableBalance.toFixed(2)}`;
  const commissionText =
    numberOfCommissions === 1
      ? "Your held commission has"
      : `Your ${numberOfCommissions} held commissions have`;

  return `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Commission Released</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="border: 2px solid #000000; background-color: #ffffff;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px; text-align: center; border-bottom: 2px solid #000000;">
                            <h1 style="margin: 0; font-size: 28px; color: #000000;">Digitalsite</h1>
                        </td>
                    </tr>

                    <!-- English Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #000000;">Commission Released!</h2>
                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #000000;">
                                Hi ${affiliateOwnerName},
                            </p>
                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #000000;">
                                Great news! ${commissionText} been successfully released after the 30-day hold period.
                            </p>

                            <!-- Commission Box -->
                            <table width="100%" cellpadding="20" cellspacing="0" style="margin: 20px 0; border: 2px solid #000000; background-color: #f5f5f5;">
                                <tr>
                                    <td style="text-align: center;">
                                        <div style="font-size: 14px; color: #666666; margin-bottom: 5px;">Released Commission</div>
                                        <div style="font-size: 32px; font-weight: bold; color: #000000;">${formattedAmount}</div>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 20px 0 15px 0; font-size: 16px; line-height: 1.6; color: #000000;">
                                <strong>Your New Available Balance:</strong> ${formattedBalance}
                            </p>

                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #000000;">
                                You can now request a withdrawal of these funds at any time through your dashboard.
                            </p>

                            <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 1.6; color: #000000;">
                                Keep up the great work!
                            </p>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 30px;">
                            <div style="border-top: 2px solid #000000;"></div>
                        </td>
                    </tr>

                    <!-- Arabic Content -->
                    <tr>
                        <td style="padding: 40px 30px;" dir="rtl">
                            <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #000000;">تم إصدار العمولة!</h2>
                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #000000;">
                                مرحباً ${affiliateOwnerName}،
                            </p>
                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #000000;">
                                أخبار رائعة! تم إصدار عمولتك بنجاح بعد فترة التجميد لمدة 30 يومًا.
                            </p>

                            <!-- Commission Box -->
                            <table width="100%" cellpadding="20" cellspacing="0" style="margin: 20px 0; border: 2px solid #000000; background-color: #f5f5f5;">
                                <tr>
                                    <td style="text-align: center;">
                                        <div style="font-size: 14px; color: #666666; margin-bottom: 5px;">العمولة المصدرة</div>
                                        <div style="font-size: 32px; font-weight: bold; color: #000000;">${formattedAmount}</div>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 20px 0 15px 0; font-size: 16px; line-height: 1.6; color: #000000;">
                                <strong>رصيدك المتاح الجديد:</strong> ${formattedBalance}
                            </p>

                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #000000;">
                                يمكنك الآن طلب سحب هذه الأموال في أي وقت من خلال لوحة التحكم الخاصة بك.
                            </p>

                            <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 1.6; color: #000000;">
                                استمر في العمل الرائع!
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; text-align: center; border-top: 2px solid #000000;">
                            <p style="margin: 0; font-size: 14px; color: #000000;">
                                Digitalsite © ${new Date().getFullYear()}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `.trim();
}

/**
 * Plain text email template
 */
function getCommissionReleasedEmailText(
  data: CommissionReleasedEmailData
): string {
  const { affiliateOwnerName, commissionAmount, newAvailableBalance, numberOfCommissions } = data;

  const formattedAmount = `$${commissionAmount.toFixed(2)}`;
  const formattedBalance = `$${newAvailableBalance.toFixed(2)}`;
  const commissionText =
    numberOfCommissions === 1
      ? "Your held commission has"
      : `Your ${numberOfCommissions} held commissions have`;

  return `
DIGITALSITE

Commission Released!

Hi ${affiliateOwnerName},

Great news! ${commissionText} been successfully released after the 30-day hold period.

Released Commission: ${formattedAmount}

Your New Available Balance: ${formattedBalance}

You can now request a withdrawal of these funds at any time through your dashboard.

Keep up the great work!

---

تم إصدار العمولة!

مرحباً ${affiliateOwnerName}،

أخبار رائعة! تم إصدار عمولتك بنجاح بعد فترة التجميد لمدة 30 يومًا.

العمولة المصدرة: ${formattedAmount}

رصيدك المتاح الجديد: ${formattedBalance}

يمكنك الآن طلب سحب هذه الأموال في أي وقت من خلال لوحة التحكم الخاصة بك.

استمر في العمل الرائع!

---

Digitalsite © ${new Date().getFullYear()}
  `.trim();
}
