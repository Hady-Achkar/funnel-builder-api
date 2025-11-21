/**
 * BUSINESS Plan Migration Welcome Email
 *
 * Sent to users migrated from old database with Business userType
 * Includes temporary password and explains the migration to new Digitalsite
 * No default workspace created for Business users
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

export interface BusinessWelcomeData {
  firstName: string;
  email: string;
  temporaryPassword: string;
  trialEndDate: Date;
}

/**
 * Generates HTML version of BUSINESS plan welcome email
 */
export function getBusinessWelcomeEmailHtml(data: BusinessWelcomeData): string {
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

  // Video tutorial URL
  const videoUrl = "https://www.loom.com/share/d986e3304d934779a87a5073521524a6";

  // Base content structure
  const content: BilingualContent = {
    english: {
      greeting: `Welcome to the New Digitalsite, ${firstName}`,
      mainContent: `Your Business account has been migrated to our new platform. We have created your new account with the credentials below.<br><br><strong>Your Login Credentials:</strong><br>Email: ${email}<br>Password: ${temporaryPassword}<br><br><strong>Next Steps:</strong><br>1. Go to <a href="https://digitalsite.io/login" style="color: #000000; text-decoration: underline;">https://digitalsite.io/login</a><br>2. Sign in with the credentials above, OR<br>3. Click on "Forgot password?" to reset your auto-generated password<br><br>For security, we recommend resetting your password after your first login.`,
      ctaText: "Watch Migration Tutorial",
      ctaUrl: videoUrl,
      additionalInfo: `Your Business plan benefits and settings have been preserved. You can continue using Digitalsite with full access to all Business features.<br><br><strong>1 Year Extra Trial:</strong> As a valued Business member, we have extended your trial period by 1 additional year. Your new trial expires on ${formattedDate}. This means you can continue using all Business features until that date. For example, if your original trial was ending in January 2025, it is now extended to January 2026.`,
    },
    arabic: {
      greeting: `مرحبًا بك في Digitalsite الجديد، ${firstName}`,
      mainContent: `تم إضافة حسابك من نوع Business إلى منصتنا الجديدة. قمنا بإنشاء حسابك الجديد باستخدام البيانات أدناه.<br><br><strong>بيانات الدخول الخاصة بك:</strong><br>البريد الإلكتروني: ${email}<br>كلمة المرور: ${temporaryPassword}<br><br><strong>الخطوات التالية:</strong><br>1. اذهب إلى <a href="https://digitalsite.io/login" style="color: #000000; text-decoration: underline;">https://digitalsite.io/login</a><br>2. سجل الدخول باستخدام البيانات أعلاه، أو<br>3. انقر على "نسيت كلمة المرور؟" لإعادة تعيين كلمة المرور التلقائية<br><br>للأمان، نوصي بإعادة تعيين كلمة المرور بعد أول تسجيل دخول.`,
      ctaText: "شاهد الفيديو التوضيحي",
      ctaUrl: videoUrl,
      additionalInfo: `جميع ميزات خطة Business والإعدادات الخاصة بك محفوظة. يمكنك الاستمرار في استخدام Digitalsite بكامل الميزات.<br><br><strong>سنة إضافية مجانية:</strong> كهدية لعملاء Business، أضفنا لك سنة إضافية مجانية. حسابك سيعمل حتى ${formattedDateArabic}. مثلاً، إذا كان حسابك ينتهي في يناير 2025، الآن سيستمر حتى يناير 2026.`,
    },
  };

  // Generate and return email
  return generateBilingualEmail(content, {
    subject: "Welcome to the New Digitalsite | مرحبًا بك في Digitalsite الجديد",
    previewText: "Your Business account has been migrated",
  });
}

/**
 * Generates plain text version of BUSINESS plan welcome email
 */
export function getBusinessWelcomeEmailText(data: BusinessWelcomeData): string {
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

  // Video tutorial URL
  const videoUrl = "https://www.loom.com/share/d986e3304d934779a87a5073521524a6";

  const content: BilingualContent = {
    english: {
      greeting: `Welcome to the New Digitalsite, ${firstName}`,
      mainContent: `Your Business account has been migrated to our new platform. We have created your new account with the credentials below.

YOUR CREDENTIALS:
Email: ${email}
Password: ${temporaryPassword}

NEXT STEPS:
1. Go to https://digitalsite.io/login
2. Sign in with the credentials above, OR
3. Click on "Forgot password?" to reset your auto-generated password

For security, we recommend resetting your password after your first login.`,
      ctaText: "Watch Migration Tutorial",
      ctaUrl: videoUrl,
      additionalInfo: `Your Business plan benefits and settings have been preserved. You can continue using Digitalsite with full access to all Business features.

1 Year Extra Trial: As a valued Business member, we have extended your trial period by 1 additional year. Your new trial expires on ${formattedDate}. This means you can continue using all Business features until that date. For example, if your original trial was ending in January 2025, it is now extended to January 2026.`,
    },
    arabic: {
      greeting: `مرحبًا بك في Digitalsite الجديد، ${firstName}`,
      mainContent: `تم إضافة حسابك من نوع Business إلى منصتنا الجديدة. قمنا بإنشاء حسابك الجديد باستخدام البيانات أدناه.

بيانات الدخول الخاصة بك:
البريد الإلكتروني: ${email}
كلمة المرور: ${temporaryPassword}

الخطوات التالية:
1. اذهب إلى https://digitalsite.io/login
2. سجل الدخول باستخدام البيانات أعلاه، أو
3. انقر على "نسيت كلمة المرور؟" لإعادة تعيين كلمة المرور التلقائية

للأمان، نوصي بإعادة تعيين كلمة المرور بعد أول تسجيل دخول.`,
      ctaText: "شاهد الفيديو التوضيحي",
      ctaUrl: videoUrl,
      additionalInfo: `جميع ميزات خطة Business والإعدادات الخاصة بك محفوظة. يمكنك الاستمرار في استخدام Digitalsite بكامل الميزات.

سنة إضافية مجانية: كهدية لعملاء Business، أضفنا لك سنة إضافية مجانية. حسابك سيعمل حتى ${formattedDateArabic}. مثلاً، إذا كان حسابك ينتهي في يناير 2025، الآن سيستمر حتى يناير 2026.`,
    },
  };

  return generateBilingualEmailText(content);
}
