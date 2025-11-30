/**
 * Business Plan Welcome Email
 *
 * Sent to users who purchase Business Plan via payment-first flow (AD source)
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

export interface BusinessWelcomeEmailData {
  firstName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}

/**
 * Generates HTML version of Business Plan welcome email
 */
export function getBusinessWelcomeEmailHtml(
  data: BusinessWelcomeEmailData
): string {
  const { firstName, email, temporaryPassword, loginUrl } = data;

  const content: BilingualContent = {
    english: {
      greeting: `Welcome to Digitalsite, ${firstName}`,
      mainContent: `Thank you for purchasing the Business Plan. Your account has been created and is ready to use.<br><br><strong>Your Login Credentials:</strong><br>Email: ${email}<br>Password: ${temporaryPassword}`,
      ctaText: "Login to Your Account",
      ctaUrl: loginUrl,
      additionalInfo:
        "For security, please change your password after your first login. You can do this from your account settings.",
    },
    arabic: {
      greeting: `مرحبًا بك في Digitalsite، ${firstName}`,
      mainContent: `شكرًا لشرائك خطة الأعمال. تم إنشاء حسابك وهو جاهز للاستخدام.<br><br><strong>بيانات تسجيل الدخول الخاصة بك:</strong><br>البريد الإلكتروني: ${email}<br>كلمة المرور: ${temporaryPassword}`,
      ctaText: "تسجيل الدخول إلى حسابك",
      ctaUrl: loginUrl,
      additionalInfo:
        "لأسباب أمنية، يرجى تغيير كلمة المرور بعد أول تسجيل دخول. يمكنك القيام بذلك من إعدادات حسابك.",
    },
  };

  const metadata: EmailMetadata = {
    subject:
      "Welcome to Digitalsite - Business Plan | مرحبًا بك في Digitalsite - خطة الأعمال",
    previewText: "Your Business Plan account is ready",
  };

  return generateBilingualEmail(content, metadata);
}

/**
 * Generates plain text version of Business Plan welcome email
 */
export function getBusinessWelcomeEmailText(
  data: BusinessWelcomeEmailData
): string {
  const { firstName, email, temporaryPassword, loginUrl } = data;

  const content: BilingualContent = {
    english: {
      greeting: `Welcome to Digitalsite, ${firstName}`,
      mainContent: `Thank you for purchasing the Business Plan. Your account has been created and is ready to use.

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
      mainContent: `شكرًا لشرائك خطة الأعمال. تم إنشاء حسابك وهو جاهز للاستخدام.

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
