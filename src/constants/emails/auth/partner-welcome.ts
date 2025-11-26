/**
 * Partner Plan Welcome Email
 *
 * Sent to users who purchase Partner Plan via payment-first flow
 * Includes temporary password and login instructions
 * User account is auto-created and verified upon payment
 *
 * Design: Professional, bilingual, black & white only, no emojis
 * @see ../EMAIL_GUIDE.md
 */

import {
  generateBilingualEmail,
  generateBilingualEmailText,
  BilingualContent,
  EmailMetadata,
} from "../templates/base-template";

export interface PartnerWelcomeEmailData {
  firstName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}

/**
 * Generates HTML version of Partner Plan welcome email
 */
export function getPartnerWelcomeEmailHtml(
  data: PartnerWelcomeEmailData
): string {
  const { firstName, email, temporaryPassword, loginUrl } = data;

  const content: BilingualContent = {
    english: {
      greeting: `Welcome to Digitalsite, ${firstName}`,
      mainContent: `Thank you for purchasing the Partner Plan. Your account has been created and is ready to use.<br><br><strong>Your Login Credentials:</strong><br>Email: ${email}<br>Password: ${temporaryPassword}`,
      ctaText: "Login to Your Account",
      ctaUrl: loginUrl,
      additionalInfo:
        "For security, please change your password after your first login. You can do this from your account settings.",
    },
    arabic: {
      greeting: `مرحبًا بك في Digitalsite، ${firstName}`,
      mainContent: `شكرًا لشرائك خطة الشريك. تم إنشاء حسابك وهو جاهز للاستخدام.<br><br><strong>بيانات تسجيل الدخول الخاصة بك:</strong><br>البريد الإلكتروني: ${email}<br>كلمة المرور: ${temporaryPassword}`,
      ctaText: "تسجيل الدخول إلى حسابك",
      ctaUrl: loginUrl,
      additionalInfo:
        "لأسباب أمنية، يرجى تغيير كلمة المرور بعد أول تسجيل دخول. يمكنك القيام بذلك من إعدادات حسابك.",
    },
  };

  const metadata: EmailMetadata = {
    subject:
      "Welcome to Digitalsite - Partner Plan | مرحبًا بك في Digitalsite - خطة الشريك",
    previewText: "Your Partner Plan account is ready",
  };

  return generateBilingualEmail(content, metadata);
}

/**
 * Generates plain text version of Partner Plan welcome email
 */
export function getPartnerWelcomeEmailText(
  data: PartnerWelcomeEmailData
): string {
  const { firstName, email, temporaryPassword, loginUrl } = data;

  const content: BilingualContent = {
    english: {
      greeting: `Welcome to Digitalsite, ${firstName}`,
      mainContent: `Thank you for purchasing the Partner Plan. Your account has been created and is ready to use.

Your Login Credentials:
Email: ${email}
Password: ${temporaryPassword}`,
      ctaText: "Login to Your Account",
      ctaUrl: loginUrl,
      additionalInfo:
        "For security, please change your password after your first login. You can do this from your account settings.",
    },
    arabic: {
      greeting: `مرحبًا بك في Digitalsite، ${firstName}`,
      mainContent: `شكرًا لشرائك خطة الشريك. تم إنشاء حسابك وهو جاهز للاستخدام.

بيانات تسجيل الدخول الخاصة بك:
البريد الإلكتروني: ${email}
كلمة المرور: ${temporaryPassword}`,
      ctaText: "تسجيل الدخول إلى حسابك",
      ctaUrl: loginUrl,
      additionalInfo:
        "لأسباب أمنية، يرجى تغيير كلمة المرور بعد أول تسجيل دخول. يمكنك القيام بذلك من إعدادات حسابك.",
    },
  };

  return generateBilingualEmailText(content);
}
