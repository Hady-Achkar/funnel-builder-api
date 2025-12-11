import {
  generateBilingualEmail,
  BilingualContent,
  EmailMetadata,
} from "../templates/base-template";

export interface AddonWarning7DaysData {
  recipientName: string;
  addonTypeName: string; // User-friendly name (e.g., "Extra Website", "Additional Domain")
  quantity: number;
  expirationDate: Date;
  whatWillHappen: string; // Specific description of what will be disabled (English)
  whatWillHappenArabic: string; // Specific description of what will be disabled (Arabic)
  renewalUrl: string;
}

/**
 * Formats a date as "January 15, 2025" in English
 */
function formatDateEnglish(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formats a date in Arabic numerals with month name
 */
function formatDateArabic(date: Date): string {
  return date.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Translates addon types to Arabic
 */
function translateAddonTypeToArabic(addonType: string): string {
  const translations: Record<string, string> = {
    "Extra Workspace": "مساحة عمل إضافية",
    "Extra Website": "موقع إضافي",
    "Extra Funnel": "موقع إضافي",
    "Extra Page": "صفحة إضافية",
    "Extra Subdomain": "نطاق فرعي إضافي",
    "Extra Custom Domain": "نطاق مخصص إضافي",
    "Extra Admin": "مدير إضافي",
    "Additional Team Member": "عضو فريق إضافي",
  };
  return translations[addonType] || addonType;
}

/**
 * Generates the HTML email for 7-day addon expiration warning
 */
export function getAddonWarning7DaysEmailHtml(
  data: AddonWarning7DaysData
): string {
  const expirationDateEnglish = formatDateEnglish(data.expirationDate);
  const expirationDateArabic = formatDateArabic(data.expirationDate);
  const addonTypeArabic = translateAddonTypeToArabic(data.addonTypeName);

  const quantityText =
    data.quantity > 1 ? ` (${data.quantity})` : "";

  const content: BilingualContent = {
    english: {
      greeting: `Hello ${data.recipientName},`,
      mainContent: `Your ${data.addonTypeName}${quantityText} addon will expire in 7 days on ${expirationDateEnglish}.`,
      additionalInfo: `
        <div style="margin-top: 24px; padding: 20px; background-color: #F9F9F9; border-radius: 4px;">
          <p style="margin: 0 0 12px 0; font-weight: 600; color: #000000;">What Will Happen</p>
          <p style="margin: 0; color: #000000; font-size: 14px;">${data.whatWillHappen}</p>
        </div>
        <p style="margin-top: 20px; color: #000000; font-size: 14px;">To continue using this addon, please contact support or renew before ${expirationDateEnglish}.</p>
      `,
    },
    arabic: {
      greeting: `مرحبًا ${data.recipientName}،`,
      mainContent: `ستنتهي صلاحية ${addonTypeArabic}${quantityText} خلال 7 أيام في ${expirationDateArabic}.`,
      additionalInfo: `
        <div style="margin-top: 24px; padding: 20px; background-color: #F9F9F9; border-radius: 4px; direction: rtl; text-align: right;">
          <p style="margin: 0 0 12px 0; font-weight: 600; color: #000000;">ما الذي سيحدث</p>
          <p style="margin: 0; color: #000000; font-size: 14px;">${data.whatWillHappenArabic}</p>
        </div>
        <p style="margin-top: 20px; color: #000000; font-size: 14px; direction: rtl; text-align: right;">لمواصلة استخدام هذه الإضافة، يرجى الاتصال بالدعم أو التجديد قبل ${expirationDateArabic}.</p>
      `,
    },
  };

  const metadata: EmailMetadata = {
    subject: "Addon Expiring in 7 Days | تنتهي الإضافة خلال 7 أيام",
    previewText: `Your ${data.addonTypeName} addon expires in 7 days`,
  };

  return generateBilingualEmail(content, metadata);
}

/**
 * Generates the plain text email for 7-day addon expiration warning
 */
export function getAddonWarning7DaysEmailText(
  data: AddonWarning7DaysData
): string {
  const expirationDateEnglish = formatDateEnglish(data.expirationDate);
  const expirationDateArabic = formatDateArabic(data.expirationDate);
  const addonTypeArabic = translateAddonTypeToArabic(data.addonTypeName);
  const quantityText = data.quantity > 1 ? ` (${data.quantity})` : "";

  return `
Hello ${data.recipientName},

Your ${data.addonTypeName}${quantityText} addon will expire in 7 days on ${expirationDateEnglish}.

What Will Happen:
${data.whatWillHappen}

To continue using this addon, please contact support or renew before ${expirationDateEnglish}.

---

مرحبًا ${data.recipientName}،

ستنتهي صلاحية ${addonTypeArabic}${quantityText} خلال 7 أيام في ${expirationDateArabic}.

ما الذي سيحدث:
${data.whatWillHappenArabic}

لمواصلة استخدام هذه الإضافة، يرجى الاتصال بالدعم أو التجديد قبل ${expirationDateArabic}.

---

Best regards,
The Digitalsite Team

مع أطيب التحيات،
فريق Digitalsite
  `.trim();
}
