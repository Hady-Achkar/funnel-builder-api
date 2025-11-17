/**
 * OLD_MEMBER Migration Welcome Email
 *
 * Sent to users migrated from the old database with OLD_MEMBER plan
 * Includes temporary password and explains the migration to new Digitalsite
 *
 * Design: Professional, bilingual, black & white only, no emojis
 * @see ../EMAIL_GUIDE.md
 */

import {
  generateBilingualEmail,
  generateBilingualEmailText,
  BilingualContent,
  EmailMetadata,
  createCredentialsBox,
} from "../templates/base-template";

export interface OldMemberWelcomeData {
  firstName: string;
  email: string;
  temporaryPassword: string;
  trialEndDate: Date;
}

/**
 * Generates HTML version of OLD_MEMBER welcome email
 */
export function getOldMemberWelcomeEmailHtml(
  data: OldMemberWelcomeData
): string {
  const { firstName, email, temporaryPassword, trialEndDate } = data;

  // Format trial end date
  const formattedDate = trialEndDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedDateArabic = trialEndDate.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Video tutorial URL (placeholder)
  const videoUrl = "https://digitalsite.com/migration-tutorial";

  // Base content structure
  const content: BilingualContent = {
    english: {
      greeting: `Welcome to the New Digitalsite, ${firstName}`,
      mainContent: `Your account has been migrated to our new platform. We have created your new account with the credentials below. For security, please change your password after your first login.<br><br><strong>Your Login Credentials:</strong><br>Email: ${email}<br>Password: ${temporaryPassword}`,
      ctaText: "Watch Migration Tutorial",
      ctaUrl: videoUrl,
      additionalInfo: `Your workspace and settings have been preserved. You can continue using Digitalsite with your existing data.<br><br><strong>1 Year Extra Trial:</strong> As a valued member, we have extended your trial period by 1 additional year. Your new trial expires on ${formattedDate}. This means you can continue using all features until that date. For example, if your original trial was ending in January 2025, it is now extended to January 2026.`,
    },
    arabic: {
      greeting: `مرحبًا بك في Digitalsite الجديد، ${firstName}`,
      mainContent: `تم إضافتك إلى منصتنا الجديدة. قمنا بإنشاء حسابك الجديد باستخدام البيانات أدناه. للأمان، يرجى تغيير كلمة المرور بعد أول تسجيل دخول.<br><br><strong>بيانات الدخول الخاصة بك:</strong><br>البريد الإلكتروني: ${email}<br>كلمة المرور: ${temporaryPassword}`,
      ctaText: "شاهد الفيديو التوضيحي",
      ctaUrl: videoUrl,
      additionalInfo: `جميع بياناتك وإعداداتك محفوظة. يمكنك الاستمرار في استخدام Digitalsite كالمعتاد.<br><br><strong>سنة إضافية مجانية:</strong> كهدية منا، أضفنا لك سنة إضافية مجانية. حسابك سيعمل حتى ${formattedDateArabic}. مثلاً، إذا كان حسابك ينتهي في يناير 2025، الآن سيستمر حتى يناير 2026.`,
    },
  };

  // Generate and return email
  return generateBilingualEmail(content, {
    subject: "Welcome to the New Digitalsite | مرحبًا بك في Digitalsite الجديد",
    previewText: "Your account has been migrated to the new platform",
  });
}

/**
 * Generates plain text version of OLD_MEMBER welcome email
 */
export function getOldMemberWelcomeEmailText(
  data: OldMemberWelcomeData
): string {
  const { firstName, email, temporaryPassword, trialEndDate } = data;

  // Format trial end date
  const formattedDate = trialEndDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedDateArabic = trialEndDate.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Video tutorial URL (placeholder)
  const videoUrl = "https://digitalsite.com/migration-tutorial";

  const content: BilingualContent = {
    english: {
      greeting: `Welcome to the New Digitalsite, ${firstName}`,
      mainContent: `Your account has been migrated to our new platform. We have created your new account with the credentials below. For security, please change your password after your first login.

YOUR CREDENTIALS:
Email: ${email}
Password: ${temporaryPassword}`,
      ctaText: "Watch Migration Tutorial",
      ctaUrl: videoUrl,
      additionalInfo: `Your workspace and settings have been preserved. You can continue using Digitalsite with your existing data.

1 Year Extra Trial: As a valued member, we have extended your trial period by 1 additional year. Your new trial expires on ${formattedDate}. This means you can continue using all features until that date. For example, if your original trial was ending in January 2025, it is now extended to January 2026.`,
    },
    arabic: {
      greeting: `مرحبًا بك في Digitalsite الجديد، ${firstName}`,
      mainContent: `تم إضافتك إلى منصتنا الجديدة. قمنا بإنشاء حسابك الجديد باستخدام البيانات أدناه. للأمان، يرجى تغيير كلمة المرور بعد أول تسجيل دخول.

بيانات الدخول الخاصة بك:
البريد الإلكتروني: ${email}
كلمة المرور: ${temporaryPassword}`,
      ctaText: "شاهد الفيديو التوضيحي",
      ctaUrl: videoUrl,
      additionalInfo: `جميع بياناتك وإعداداتك محفوظة. يمكنك الاستمرار في استخدام Digitalsite كالمعتاد.

سنة إضافية مجانية: كهدية منا، أضفنا لك سنة إضافية مجانية. حسابك سيعمل حتى ${formattedDateArabic}. مثلاً، إذا كان حسابك ينتهي في يناير 2025، الآن سيستمر حتى يناير 2026.`,
    },
  };

  return generateBilingualEmailText(content);
}
