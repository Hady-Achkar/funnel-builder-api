import {
  generateBilingualEmail,
  BilingualContent,
  EmailMetadata,
} from "../templates/base-template";

export interface AddonWarning1DayData {
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

export function getAddonWarning1DayEmailHtml(
  data: AddonWarning1DayData
): string {
  const expirationDateEnglish = formatDateEnglish(data.expirationDate);
  const expirationDateArabic = formatDateArabic(data.expirationDate);
  const addonTypeArabic = translateAddonTypeToArabic(data.addonTypeName);
  const quantityText = data.quantity > 1 ? ` (${data.quantity})` : "";

  const content: BilingualContent = {
    english: {
      greeting: `Hello ${data.recipientName},`,
      mainContent: `Final reminder: Your ${data.addonTypeName}${quantityText} addon expires tomorrow on ${expirationDateEnglish}.`,
      additionalInfo: `
        <div style="margin-top: 24px; padding: 20px; background-color: #F9F9F9; border-radius: 4px;">
          <p style="margin: 0 0 12px 0; font-weight: 600; color: #000000;">What Will Happen Tomorrow</p>
          <p style="margin: 0; color: #000000; font-size: 14px;">${data.whatWillHappen}</p>
        </div>
        <p style="margin-top: 20px; color: #000000; font-size: 14px;">To continue using this addon, please contact support or renew immediately to prevent interruption.</p>
      `,
    },
    arabic: {
      greeting: `مرحبًا ${data.recipientName}،`,
      mainContent: `تذكير أخير: ستنتهي صلاحية ${addonTypeArabic}${quantityText} غدًا في ${expirationDateArabic}.`,
      additionalInfo: `
        <div style="margin-top: 24px; padding: 20px; background-color: #F9F9F9; border-radius: 4px; direction: rtl; text-align: right;">
          <p style="margin: 0 0 12px 0; font-weight: 600; color: #000000;">ما الذي سيحدث غدًا</p>
          <p style="margin: 0; color: #000000; font-size: 14px;">${data.whatWillHappenArabic}</p>
        </div>
        <p style="margin-top: 20px; color: #000000; font-size: 14px; direction: rtl; text-align: right;">لمواصلة استخدام هذه الإضافة، يرجى الاتصال بالدعم أو التجديد فورًا لمنع الانقطاع.</p>
      `,
    },
  };

  const metadata: EmailMetadata = {
    subject:
      "Final Warning: Addon Expires Tomorrow | تحذير أخير: تنتهي الإضافة غدًا",
    previewText: `Your ${data.addonTypeName} addon expires tomorrow`,
  };

  return generateBilingualEmail(content, metadata);
}

export function getAddonWarning1DayEmailText(
  data: AddonWarning1DayData
): string {
  const expirationDateEnglish = formatDateEnglish(data.expirationDate);
  const expirationDateArabic = formatDateArabic(data.expirationDate);
  const addonTypeArabic = translateAddonTypeToArabic(data.addonTypeName);
  const quantityText = data.quantity > 1 ? ` (${data.quantity})` : "";

  return `
Hello ${data.recipientName},

Final reminder: Your ${data.addonTypeName}${quantityText} addon expires tomorrow on ${expirationDateEnglish}.

What Will Happen Tomorrow:
${data.whatWillHappen}

To continue using this addon, please contact support or renew immediately to prevent interruption.

---

مرحبًا ${data.recipientName}،

تذكير أخير: ستنتهي صلاحية ${addonTypeArabic}${quantityText} غدًا في ${expirationDateArabic}.

ما الذي سيحدث غدًا:
${data.whatWillHappenArabic}

لمواصلة استخدام هذه الإضافة، يرجى الاتصال بالدعم أو التجديد فورًا لمنع الانقطاع.

---

Best regards,
The Digitalsite Team

مع أطيب التحيات،
فريق Digitalsite
  `.trim();
}
