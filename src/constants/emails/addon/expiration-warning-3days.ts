import {
  generateBilingualEmail,
  BilingualContent,
  EmailMetadata,
} from "../templates/base-template";

export interface AddonWarning3DaysData {
  recipientName: string;
  addonTypeName: string;
  quantity: number;
  expirationDate: Date;
  whatWillHappen: string;
  whatWillHappenArabic: string;
  renewalUrl: string;
}

function formatDateEnglish(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateArabic(date: Date): string {
  return date.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

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

export function getAddonWarning3DaysEmailHtml(
  data: AddonWarning3DaysData
): string {
  const expirationDateEnglish = formatDateEnglish(data.expirationDate);
  const expirationDateArabic = formatDateArabic(data.expirationDate);
  const addonTypeArabic = translateAddonTypeToArabic(data.addonTypeName);
  const quantityText = data.quantity > 1 ? ` (${data.quantity})` : "";

  const content: BilingualContent = {
    english: {
      greeting: `Hello ${data.recipientName},`,
      mainContent: `Your ${data.addonTypeName}${quantityText} addon will expire in 3 days on ${expirationDateEnglish}. This is your second reminder.`,
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
      mainContent: `ستنتهي صلاحية ${addonTypeArabic}${quantityText} خلال 3 أيام في ${expirationDateArabic}. هذا تذكيرك الثاني.`,
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
    subject: "Urgent: Addon Expiring in 3 Days | عاجل: تنتهي الإضافة خلال 3 أيام",
    previewText: `Your ${data.addonTypeName} addon expires in 3 days`,
  };

  return generateBilingualEmail(content, metadata);
}

export function getAddonWarning3DaysEmailText(
  data: AddonWarning3DaysData
): string {
  const expirationDateEnglish = formatDateEnglish(data.expirationDate);
  const expirationDateArabic = formatDateArabic(data.expirationDate);
  const addonTypeArabic = translateAddonTypeToArabic(data.addonTypeName);
  const quantityText = data.quantity > 1 ? ` (${data.quantity})` : "";

  return `
Hello ${data.recipientName},

Your ${data.addonTypeName}${quantityText} addon will expire in 3 days on ${expirationDateEnglish}. This is your second reminder.

What Will Happen:
${data.whatWillHappen}

To continue using this addon, please contact support or renew before ${expirationDateEnglish}.

---

مرحبًا ${data.recipientName}،

ستنتهي صلاحية ${addonTypeArabic}${quantityText} خلال 3 أيام في ${expirationDateArabic}. هذا تذكيرك الثاني.

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
